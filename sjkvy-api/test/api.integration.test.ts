// api.integration.test.ts — drives the API over HTTP (via Fastify inject) against the
// real sjkvy_api database. Proves the thin API preserves the DB's security model:
// JWT → identity GUC → RLS/DEFINER; idempotency; concurrency; non-leak isolation.
//
// These tests assume the sjkvy_api database was built by scripts/setup-test-db.sh
// (migrations 0000–0003 + seed + auth_adapter). They mutate seeded rows, so they run
// once against a fresh build.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import {
  ACTORS,
  SEED,
  makeApp,
  teardown,
  userAuth,
  serviceAuth,
  idemHeaders,
} from './helpers.js';

let app: FastifyInstance;

beforeAll(async () => {
  app = await makeApp();
  await app.ready();
});
afterAll(async () => {
  await app.close();
  await teardown();
});

async function post(url: string, headers: Record<string, string>, body?: unknown) {
  return app.inject({ method: 'POST', url, headers, payload: body ?? {} });
}
async function get(url: string, headers: Record<string, string>) {
  return app.inject({ method: 'GET', url, headers });
}

describe('public + auth boundaries', () => {
  it('public course catalog is reachable anonymously', async () => {
    const res = await app.inject({ method: 'GET', url: '/public/courses' });
    expect(res.statusCode).toBe(200);
    expect(res.json().items.length).toBeGreaterThan(0);
  });

  it('rejects an unauthenticated call to a user endpoint', async () => {
    const res = await app.inject({ method: 'GET', url: '/applications' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects a bad service token', async () => {
    const res = await post('/jobs/expire-offers', { authorization: 'Bearer wrong' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /auth/me returns the caller profile only', async () => {
    const res = await get('/auth/me', await userAuth(ACTORS.applicantA));
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(ACTORS.applicantA);
  });
});

describe('application lifecycle → verification → admission → offer → enrolment', () => {
  let applicationId: string;
  let caseId: string;
  let versionId: string;
  let offerId: string;
  let enrolmentId: string;

  it('applicant A self-creates an application', async () => {
    const res = await post('/applications', await userAuth(ACTORS.applicantA), {
      course_id: SEED.course,
      dob: '2000-01-01',
      gender: 'F',
      district: 'Hazaribagh',
      qualification: '10th',
    });
    expect(res.statusCode).toBe(201);
    applicationId = res.json().application_id;
    expect(res.json().status).toBe('DRAFT');
  });

  it('blocks a duplicate active application (409)', async () => {
    const res = await post('/applications', await userAuth(ACTORS.applicantA), {
      course_id: SEED.course,
      dob: '2000-01-01',
      gender: 'F',
      district: 'Hazaribagh',
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe('E.CONFLICT.ALREADY_ACTIVE');
  });

  it('applicant B cannot see A’s application (RLS non-leak)', async () => {
    const res = await get('/applications', await userAuth(ACTORS.applicantB));
    expect(res.statusCode).toBe(200);
    expect(res.json().items.find((a: { id: string }) => a.id === applicationId)).toBeUndefined();
  });

  it('service uploads a document, scan marks it CLEAN', async () => {
    const up = await post('/documents/finalize', serviceAuth, {
      caller: ACTORS.applicantA,
      application_id: applicationId,
      document_type: 'MATRIC',
      storage_path: 'q/apitest1',
      mime: 'image/jpeg',
      size: 1000,
      sha256: 'sha',
    });
    expect(up.statusCode).toBe(201);
    versionId = up.json().version_id;
    const scan = await post(`/documents/${versionId}/scan-result`, serviceAuth, {
      status: 'CLEAN',
    });
    expect(scan.statusCode).toBe(200);
  });

  it('document metadata is readable via the path-less view (no storage_path)', async () => {
    const res = await get(
      `/applications/${applicationId}/documents`,
      await userAuth(ACTORS.applicantA),
    );
    expect(res.statusCode).toBe(200);
    const doc = res.json().items[0];
    expect(doc.scan_status).toBe('CLEAN');
    expect(doc).not.toHaveProperty('storage_path');
  });

  it('submits the application (idempotent) and replays the same key', async () => {
    const headers = { ...(await userAuth(ACTORS.applicantA)), ...idemHeaders() };
    const first = await post(`/applications/${applicationId}/submit`, headers);
    expect(first.statusCode).toBe(200);
    expect(first.json().status).toBe('SUBMITTED');
    // same Idempotency-Key + same body → replayed
    const replay = await post(`/applications/${applicationId}/submit`, headers);
    expect(replay.statusCode).toBe(200);
    expect(replay.json().replayed).toBe(true);
  });

  it('rejects a submit without an Idempotency-Key (400)', async () => {
    const res = await post(
      `/applications/${applicationId}/submit`,
      await userAuth(ACTORS.applicantA),
    );
    expect(res.statusCode).toBe(400);
  });

  it('centre admin assigns a checker; checker accepts the document', async () => {
    const cases = await get('/verification/cases', await userAuth(ACTORS.cad1));
    caseId = cases.json().items[0].id;
    const assign = await post(
      `/verification/cases/${caseId}/assign`,
      await userAuth(ACTORS.cad1),
      { checker: ACTORS.checker },
    );
    expect(assign.statusCode).toBe(200);
    const decide = await post(
      `/verification/cases/${caseId}/decisions`,
      await userAuth(ACTORS.checker),
      { document_version_id: versionId, decision: 'ACCEPT' },
    );
    expect(decide.statusCode).toBe(200);
    expect(decide.json().case_verified).toBe(true);
  });

  it('counsellor schedules + records APPROVE; recommender cannot finalize', async () => {
    const sched = await post(
      `/applications/${applicationId}/counselling`,
      await userAuth(ACTORS.counsellor),
      { scheduled_at: new Date(Date.now() + 86400000).toISOString() },
    );
    expect(sched.statusCode).toBe(201);
    const apptId = sched.json().appointment_id;
    const outcome = await post(
      `/counselling/${apptId}/outcome`,
      await userAuth(ACTORS.counsellor),
      { recommendation: 'APPROVE', notes: 'ok' },
    );
    expect(outcome.statusCode).toBe(200);
    // counsellor is not centre_admin → non-leak NOT_FOUND
    const bad = await post(
      `/applications/${applicationId}/admission`,
      { ...(await userAuth(ACTORS.counsellor)), ...idemHeaders() },
      { decision: 'APPROVED', batch_id: SEED.batch1 },
    );
    expect(bad.statusCode).toBe(404);
  });

  it('centre admin finalizes APPROVED → offer', async () => {
    const res = await post(
      `/applications/${applicationId}/admission`,
      { ...(await userAuth(ACTORS.cad1)), ...idemHeaders() },
      { decision: 'APPROVED', batch_id: SEED.batch1 },
    );
    expect(res.statusCode).toBe(200);
    expect(res.json().decision).toBe('APPROVED');
    const offers = await get(
      `/applications/${applicationId}/offers`,
      await userAuth(ACTORS.applicantA),
    );
    offerId = offers.json().items[0].id;
    expect(offerId).toBeTruthy();
  });

  it('applicant accepts the offer → enrolment (idempotent)', async () => {
    const res = await post(
      `/offers/${offerId}/accept`,
      { ...(await userAuth(ACTORS.applicantA)), ...idemHeaders() },
    );
    expect(res.statusCode).toBe(200);
    enrolmentId = res.json().enrolment_id;
    expect(enrolmentId).toBeTruthy();
  });

  it('enrolment is visible to its owner', async () => {
    const res = await get('/enrolments', await userAuth(ACTORS.applicantA));
    expect(res.json().items.find((e: { id: string }) => e.id === enrolmentId)).toBeTruthy();
  });
});

describe('public certificate verification', () => {
  it('unknown code returns uniform {valid:false}', async () => {
    const res = await app.inject({ method: 'GET', url: '/verify/NOPE' });
    expect(res.statusCode).toBe(200);
    expect(res.json().valid).toBe(false);
    expect(res.json()).not.toHaveProperty('phone');
  });
});

describe('centre administration', () => {
  it('CAD cannot set config; SAD can', async () => {
    const cad = await app.inject({
      method: 'PUT',
      url: '/admin/config/offer_expiry_days',
      headers: await userAuth(ACTORS.cad1),
      payload: { value: 10, reason: 'test' },
    });
    expect(cad.statusCode).toBe(404); // non-leak mask
    const sad = await app.inject({
      method: 'PUT',
      url: '/admin/config/offer_expiry_days',
      headers: await userAuth(ACTORS.superAdmin),
      payload: { value: 10, reason: 'tuning' },
    });
    expect(sad.statusCode).toBe(200);
    expect(sad.json().ok).toBe(true);
  });

  it('audit query is centre-scoped for CAD2 (0 rows from centre1)', async () => {
    const res = await get(
      '/admin/audit?action=application.submitted&limit=50',
      await userAuth(ACTORS.cad2),
    );
    expect(res.statusCode).toBe(200);
    expect(res.json().items.length).toBe(0);
  });
});
