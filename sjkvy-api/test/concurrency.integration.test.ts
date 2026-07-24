// concurrency.integration.test.ts — proves the seat-allocation guarantee survives the
// API layer: two applicants race for the last seat of a capacity-1 batch via parallel
// HTTP calls. Exactly one offer is created; the other is waitlisted. The safety comes
// entirely from the database (row locks in fn_admission_finalize); this test confirms
// the thin API does not weaken it.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import pg from 'pg';
import { ACTORS, SEED, cfg, makeApp, teardown, userAuth, idemHeaders } from './helpers.js';

let app: FastifyInstance;
let pool: pg.Pool;

// Drive one application (as a given applicant) all the way to IN_PROCESS with an
// APPROVE recommendation, so a centre-admin finalize is the only remaining step.
async function stageToFinalizable(applicantSub: string): Promise<string> {
  const auth = await userAuth(applicantSub);
  const create = await app.inject({
    method: 'POST',
    url: '/applications',
    headers: auth,
    payload: { course_id: SEED.course, dob: '2001-01-01', gender: 'F', district: 'Hazaribagh' },
  });
  const appId = create.json().application_id;
  const up = await app.inject({
    method: 'POST',
    url: '/documents/finalize',
    headers: { authorization: `Bearer ${process.env.SVC ?? 'test-service-token'}` },
    payload: {
      caller: applicantSub,
      application_id: appId,
      document_type: 'MATRIC',
      storage_path: `q/${appId}`,
      mime: 'image/jpeg',
      size: 1000,
      sha256: 'sha',
    },
  });
  const versionId = up.json().version_id;
  await app.inject({
    method: 'POST',
    url: `/documents/${versionId}/scan-result`,
    headers: { authorization: `Bearer ${process.env.SVC ?? 'test-service-token'}` },
    payload: { status: 'CLEAN' },
  });
  await app.inject({
    method: 'POST',
    url: `/applications/${appId}/submit`,
    headers: { ...auth, ...idemHeaders() },
  });
  // assign checker, accept doc
  const caseRow = await pool.query(
    `SELECT id FROM app.verification_cases WHERE application_id = $1`,
    [appId],
  );
  const caseId = caseRow.rows[0].id;
  await app.inject({
    method: 'POST',
    url: `/verification/cases/${caseId}/assign`,
    headers: await userAuth(ACTORS.cad1),
    payload: { checker: ACTORS.checker },
  });
  await app.inject({
    method: 'POST',
    url: `/verification/cases/${caseId}/decisions`,
    headers: await userAuth(ACTORS.checker),
    payload: { document_version_id: versionId, decision: 'ACCEPT' },
  });
  const sched = await app.inject({
    method: 'POST',
    url: `/applications/${appId}/counselling`,
    headers: await userAuth(ACTORS.counsellor),
    payload: { scheduled_at: new Date(Date.now() + 86400000).toISOString() },
  });
  await app.inject({
    method: 'POST',
    url: `/counselling/${sched.json().appointment_id}/outcome`,
    headers: await userAuth(ACTORS.counsellor),
    payload: { recommendation: 'APPROVE', notes: 'ok' },
  });
  return appId;
}

beforeAll(async () => {
  process.env.SVC = 'test-service-token';
  app = await makeApp();
  await app.ready();
  // Fixture/verification pool uses an ADMIN connection (out-of-band test setup only).
  // The API itself still runs as the least-privileged sjkvy_api_login role. Batch
  // capacity has no client endpoint (a documented DB CRUD gap), so it is set here.
  pool = new pg.Pool({
    connectionString:
      process.env.ADMIN_DATABASE_URL ??
      'postgres://postgres:postgres@127.0.0.1:5432/sjkvy_api',
  });
  await pool.query(`UPDATE app.batches SET capacity = 1 WHERE id = $1`, [SEED.batch1]);
});
afterAll(async () => {
  await pool.end();
  await app.close();
  await teardown();
});

describe('seat race through the API (SEC-CONC-001)', () => {
  it('two parallel finalizes on a capacity-1 batch yield exactly one offer', async () => {
    const [appA, appB] = await Promise.all([
      stageToFinalizable(ACTORS.applicantA),
      stageToFinalizable(ACTORS.applicantB),
    ]);

    const finalize = (appId: string) =>
      app.inject({
        method: 'POST',
        url: `/applications/${appId}/admission`,
        headers: { authorization: `Bearer ${''}` }, // replaced below
        payload: { decision: 'APPROVED', batch_id: SEED.batch1 },
      });

    // Both as centre admin, in parallel, each with its own idempotency key.
    const cadAuth = await userAuth(ACTORS.cad1);
    const [rA, rB] = await Promise.all([
      app.inject({
        method: 'POST',
        url: `/applications/${appA}/admission`,
        headers: { ...cadAuth, ...idemHeaders() },
        payload: { decision: 'APPROVED', batch_id: SEED.batch1 },
      }),
      app.inject({
        method: 'POST',
        url: `/applications/${appB}/admission`,
        headers: { ...cadAuth, ...idemHeaders() },
        payload: { decision: 'APPROVED', batch_id: SEED.batch1 },
      }),
    ]);
    void finalize;

    expect(rA.statusCode).toBe(200);
    expect(rB.statusCode).toBe(200);
    const decisions = [rA.json().decision, rB.json().decision].sort();
    // exactly one APPROVED (got the seat), one WAITLISTED (BATCH_FULL)
    expect(decisions).toEqual(['APPROVED', 'WAITLISTED']);

    // Invariant: enrolled + live SENT offers never exceed capacity.
    const check = await pool.query(
      `SELECT (SELECT count(*) FROM app.enrolments
                 WHERE batch_id = $1 AND status IN ('ENROLLED','ACTIVE'))
            + (SELECT count(*) FROM app.admission_offers
                 WHERE batch_id = $1 AND status = 'SENT' AND expires_at > now()) AS used,
              (SELECT capacity FROM app.batches WHERE id = $1) AS cap`,
      [SEED.batch1],
    );
    expect(Number(check.rows[0].used)).toBeLessThanOrEqual(Number(check.rows[0].cap));
  });
});
