// catalogue.integration.test.ts — migration 0004 admin CRUD through the API.
// Confirms authorization scope (SAD vs CAD vs placement), state guards, and non-leak,
// all enforced by the SECURITY DEFINER functions — the API only forwards.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ACTORS, SEED, makeApp, teardown, userAuth } from './helpers.js';

let app: FastifyInstance;

beforeAll(async () => {
  app = await makeApp();
  await app.ready();
});
afterAll(async () => {
  await app.close();
  await teardown();
});

async function post(url: string, sub: string, body?: unknown) {
  return app.inject({ method: 'POST', url, headers: await userAuth(sub), payload: body ?? {} });
}

describe('courses (super_admin only)', () => {
  it('CAD cannot create a course (404 non-leak)', async () => {
    const res = await post('/admin/courses', ACTORS.cad1, { code: 'CX', name_en: 'x', name_hi: 'y' });
    expect(res.statusCode).toBe(404);
  });
  it('SAD creates a course + version', async () => {
    const c = await post('/admin/courses', ACTORS.superAdmin, { code: 'CX', name_en: 'X', name_hi: 'Y' });
    expect(c.statusCode).toBe(201);
    const v = await post(`/admin/courses/${c.json().course_id}/versions`, ACTORS.superAdmin, {
      version_no: 1,
      duration_weeks: 10,
    });
    expect(v.statusCode).toBe(201);
    expect(v.json().course_version_id).toBeTruthy();
  });
});

describe('batches (centre_admin at the centre)', () => {
  let versionId: string;
  let batchId: string;

  beforeAll(async () => {
    const c = await post('/admin/courses', ACTORS.superAdmin, {
      code: 'CB',
      name_en: 'B',
      name_hi: 'B',
    });
    const v = await post(`/admin/courses/${c.json().course_id}/versions`, ACTORS.superAdmin, {
      version_no: 1,
      duration_weeks: 12,
    });
    versionId = v.json().course_version_id;
  });

  it('CAD of another centre cannot create a batch here (404)', async () => {
    const res = await post('/admin/batches', ACTORS.cad2, {
      centre_id: SEED.centre1,
      course_version_id: versionId,
      code: 'NB1',
      capacity: 10,
      start_date: '2026-01-01',
      end_date: '2026-04-01',
    });
    expect(res.statusCode).toBe(404);
  });

  it('CAD creates a batch (PLANNED) and transitions it', async () => {
    const b = await post('/admin/batches', ACTORS.cad1, {
      centre_id: SEED.centre1,
      course_version_id: versionId,
      code: 'NB1',
      capacity: 10,
      start_date: '2026-01-01',
      end_date: '2026-04-01',
    });
    expect(b.statusCode).toBe(201);
    expect(b.json().status).toBe('PLANNED');
    batchId = b.json().batch_id;

    const bad = await post(`/admin/batches/${batchId}/status`, ACTORS.cad1, { status: 'RUNNING' });
    expect(bad.statusCode).toBe(409); // invalid transition PLANNED->RUNNING

    const ok = await post(`/admin/batches/${batchId}/status`, ACTORS.cad1, { status: 'OPEN' });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().status).toBe('OPEN');
  });

  it('CAD creates an assessment on the batch', async () => {
    const res = await post(`/batches/${batchId}/assessments`, ACTORS.cad1, {
      name: 'Midterm',
      max_marks: 50,
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().assessment_id).toBeTruthy();
  });
});

describe('hostel inventory (hostel_manager) + placement (placement staff)', () => {
  it('hostel manager builds block → room → bed; trainer denied', async () => {
    const denied = await post('/hostel/blocks', ACTORS.trainer, {
      centre_id: SEED.centre1,
      name: 'Nope',
    });
    expect(denied.statusCode).toBe(404);

    const block = await post('/hostel/blocks', ACTORS.hostel, {
      centre_id: SEED.centre1,
      name: 'Block C',
    });
    expect(block.statusCode).toBe(201);
    const room = await post(`/hostel/blocks/${block.json().block_id}/rooms`, ACTORS.hostel, {
      room_no: 'C1',
    });
    expect(room.statusCode).toBe(201);
    const bed = await post(`/hostel/rooms/${room.json().room_id}/beds`, ACTORS.hostel, {
      bed_no: '1',
    });
    expect(bed.statusCode).toBe(201);
    expect(bed.json().bed_id).toBeTruthy();
  });

  it('placement staff creates employer + opportunity; applicant denied', async () => {
    const denied = await post('/placement/employers', ACTORS.applicantA, { name: 'Bad' });
    expect(denied.statusCode).toBe(404);

    const emp = await post('/placement/employers', ACTORS.placement, {
      name: 'Acme',
      district: 'Hazaribagh',
    });
    expect(emp.statusCode).toBe(201);
    const opp = await post('/placement/opportunities', ACTORS.placement, {
      employer_id: emp.json().employer_id,
      centre_id: SEED.centre1,
      title: 'Operator',
      openings: 5,
    });
    expect(opp.statusCode).toBe(201);
    expect(opp.json().opportunity_id).toBeTruthy();
  });
});

describe('notices (centre_admin) create → audience → publish', () => {
  it('CAD creates, adds audience, publishes', async () => {
    const n = await post('/admin/notices', ACTORS.cad1, {
      centre_id: SEED.centre1,
      title_hi: 'नमस्ते',
      title_en: 'Hello',
      body_hi: 'संसार',
      body_en: 'World',
    });
    expect(n.statusCode).toBe(201);
    expect(n.json().status).toBe('DRAFT');
    const aud = await post(`/admin/notices/${n.json().notice_id}/audiences`, ACTORS.cad1, {
      audience: 'PUBLIC',
    });
    expect(aud.statusCode).toBe(200);
    const pub = await post(`/admin/notices/${n.json().notice_id}/publish`, ACTORS.cad1);
    expect(pub.statusCode).toBe(200);
    expect(pub.json().ok).toBe(true);
  });
});
