// worker.integration.test.ts — the notification worker driving the real outbox/delivery
// catalogue functions. Proves: events become notifications (dedupe), delivery is
// recorded, and the retry→dead-letter (FAILED) path is the database's, not the worker's.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import pg from 'pg';
import { ACTORS, SEED, cfg, makeApp, teardown, userAuth, idemHeaders } from './helpers.js';
import { NotificationWorker } from '../src/worker/notification-worker.js';
import { MockProvider, InAppProvider, type Channel, type ChannelProvider } from '../src/worker/providers.js';

let app: FastifyInstance;
let admin: pg.Pool;

beforeAll(async () => {
  app = await makeApp();
  await app.ready();
  admin = new pg.Pool({
    connectionString:
      process.env.ADMIN_DATABASE_URL ??
      'postgres://postgres:postgres@127.0.0.1:5432/sjkvy_api',
  });
});
afterAll(async () => {
  await admin.end();
  await app.close();
  await teardown();
});

describe('notification worker', () => {
  it('turns an application.submitted event into an in-app notification for the owner', async () => {
    // Drive a real submit so fn_outbox emits application.submitted.
    const auth = await userAuth(ACTORS.applicantA);
    const create = await app.inject({
      method: 'POST',
      url: '/applications',
      headers: auth,
      payload: { course_id: SEED.course, dob: '2000-01-01', gender: 'F', district: 'Hazaribagh' },
    });
    const appId = create.json().application_id;
    // upload + scan so submit passes the required-doc gate
    const up = await app.inject({
      method: 'POST',
      url: '/documents/finalize',
      headers: { authorization: 'Bearer test-service-token' },
      payload: {
        caller: ACTORS.applicantA,
        application_id: appId,
        document_type: 'MATRIC',
        storage_path: 'q/w1',
        mime: 'image/jpeg',
        size: 10,
        sha256: 's',
      },
    });
    await app.inject({
      method: 'POST',
      url: `/documents/${up.json().version_id}/scan-result`,
      headers: { authorization: 'Bearer test-service-token' },
      payload: { status: 'CLEAN' },
    });
    await app.inject({
      method: 'POST',
      url: `/applications/${appId}/submit`,
      headers: { ...auth, ...idemHeaders() },
    });

    // Worker with in-app + a normal (succeeding) mock for other channels.
    const worker = new NotificationWorker({ batchSize: 100 });
    const r1 = await worker.tick();
    expect(r1.claimed).toBeGreaterThan(0);

    const notif = await admin.query(
      `SELECT status, template_key FROM app.notifications
        WHERE recipient_profile_id = $1 AND template_key = 'application_submitted'`,
      [ACTORS.applicantA],
    );
    expect(notif.rowCount).toBe(1);
    expect(notif.rows[0].status).toBe('SENT');
  });

  it('marks unmapped events processed (no infinite re-claim)', async () => {
    const before = await admin.query(
      `SELECT count(*)::int AS n FROM app.domain_events WHERE processed_at IS NULL`,
    );
    const worker = new NotificationWorker({ batchSize: 100 });
    await worker.tick();
    await worker.tick();
    const after = await admin.query(
      `SELECT count(*)::int AS n FROM app.domain_events WHERE processed_at IS NULL`,
    );
    // all claimable events end processed (unmapped ones via fn_outbox_mark_processed)
    expect(after.rows[0].n).toBeLessThanOrEqual(before.rows[0].n);
    expect(after.rows[0].n).toBe(0);
  });

  it('retries then dead-letters a failing channel (DB-owned attempt accounting)', async () => {
    // Seed a domain event + a PENDING notification whose template forces the mock to fail.
    const ev = await admin.query(
      `INSERT INTO app.domain_events (event_type, aggregate_type, aggregate_id)
       VALUES ('test.dlq','application', $1) RETURNING id`,
      [SEED.batch1],
    );
    await admin.query(
      `INSERT INTO app.notifications (event_id, recipient_phone, channel, template_key, dedupe_key, status)
       VALUES ($1::uuid, '+910000000001', 'SMS', 'fail_tpl', 'dlq-'||$1::text, 'PENDING')`,
      [ev.rows[0].id],
    );

    // Force the max-attempts config low so the dead-letter is reached quickly.
    await admin.query(
      `INSERT INTO app.system_settings (key, value) VALUES ('notif_max_attempts','2')
       ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
    );

    const failing = new Map<Channel, ChannelProvider>([
      ['SMS', new MockProvider('SMS')], // fails on templates containing "fail"
      ['INAPP', new InAppProvider()],
    ]);
    const worker = new NotificationWorker({ providers: failing, batchSize: 100 });

    // attempt 1 -> retry (still PENDING)
    await worker.deliverPending();
    let row = await admin.query(
      `SELECT status FROM app.notifications WHERE template_key = 'fail_tpl'`,
    );
    expect(row.rows[0].status).toBe('PENDING');

    // attempt 2 -> reaches notif_max_attempts -> FAILED (dead-letter)
    await worker.deliverPending();
    row = await admin.query(
      `SELECT status FROM app.notifications WHERE template_key = 'fail_tpl'`,
    );
    expect(row.rows[0].status).toBe('FAILED');

    // two delivery attempts recorded by the DB
    const attempts = await admin.query(
      `SELECT count(*)::int AS n FROM app.delivery_attempts da
         JOIN app.notifications n ON n.id = da.notification_id
        WHERE n.template_key = 'fail_tpl'`,
    );
    expect(attempts.rows[0].n).toBe(2);
  });
});
