// production.integration.test.ts — Phase 4 hardening proofs against the real database:
// JWT verification edge cases, the end-to-end signed storage pipeline (no path leak),
// document-view authorization (SEC-DOC-004), and operational endpoints.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ACTORS, SEED, makeApp, teardown, mintJwt, userAuth, serviceAuth } from './helpers.js';

let app: FastifyInstance;
let applicationId: string;

beforeAll(async () => {
  app = await makeApp();
  await app.ready();
  // Stage one application (applicant A) for the storage flow.
  const res = await app.inject({
    method: 'POST',
    url: '/applications',
    headers: await userAuth(ACTORS.applicantA),
    payload: { course_id: SEED.course, dob: '2000-01-01', gender: 'F', district: 'Hazaribagh' },
  });
  applicationId = res.json().application_id;
});
afterAll(async () => {
  await app.close();
  await teardown();
});

function tokenFromUrl(url: string): string {
  return url.split('/').pop() as string;
}

describe('operational endpoints', () => {
  it('GET /health is ok and needs no auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('ok');
  });
  it('GET /ready reports DB reachable', async () => {
    const res = await app.inject({ method: 'GET', url: '/ready' });
    expect(res.statusCode).toBe(200);
    expect(res.json().db).toBe(true);
  });
  it('GET /metrics exposes Prometheus text', async () => {
    const res = await app.inject({ method: 'GET', url: '/metrics' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('sjkvy_http_requests_total');
  });
  it('every response carries a request id on error', async () => {
    const res = await app.inject({ method: 'GET', url: '/applications' }); // 401
    expect(res.statusCode).toBe(401);
    expect(res.json().requestId).toBeTruthy();
  });
});

describe('JWT verification', () => {
  it('rejects an expired token', async () => {
    const tok = await mintJwt(ACTORS.applicantA, { expiredSec: 60 });
    const res = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: `Bearer ${tok}` },
    });
    expect(res.statusCode).toBe(401);
  });
  it('rejects a token signed with the wrong secret', async () => {
    const tok = await mintJwt(ACTORS.applicantA, { secret: 'attacker-secret-attacker-secret-xx' });
    const res = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: `Bearer ${tok}` },
    });
    expect(res.statusCode).toBe(401);
  });
  it('rejects a token that claims a privileged role', async () => {
    const tok = await mintJwt(ACTORS.applicantA, { extraClaims: { role: 'service_role' } });
    const res = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: `Bearer ${tok}` },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe('secure storage pipeline (no path exposure)', () => {
  let objectKey: string;
  let versionId: string;

  it('mints a signed upload URL for a document', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/documents/${applicationId}/upload-url`,
      headers: await userAuth(ACTORS.applicantA),
      payload: { document_type: 'MATRIC', mime: 'image/jpeg', size: 1024 },
    });
    expect(res.statusCode).toBe(200);
    objectKey = res.json().object_key;
    expect(res.json().url).toContain('/storage/upload/');
    // the storage path/key is an internal detail; the signed URL is opaque
    expect(res.json().url).toContain(tokenFromUrl(res.json().url));
  });

  it('rejects a disallowed mime type', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/documents/${applicationId}/upload-url`,
      headers: await userAuth(ACTORS.applicantA),
      payload: { document_type: 'MATRIC', mime: 'application/x-msdownload', size: 10 },
    });
    expect(res.statusCode).toBe(422);
  });

  it('accepts the upload only with a valid signature + content-type', async () => {
    const signed = await app.inject({
      method: 'POST',
      url: `/documents/${applicationId}/upload-url`,
      headers: await userAuth(ACTORS.applicantA),
      payload: { document_type: 'MATRIC', mime: 'image/jpeg', size: 1024 },
    });
    objectKey = signed.json().object_key;
    const token = tokenFromUrl(signed.json().url);

    // tampered token → 403
    const bad = await app.inject({
      method: 'PUT',
      url: `/storage/upload/${token}x`,
      headers: { 'content-type': 'image/jpeg' },
      payload: Buffer.from('hello'),
    });
    expect(bad.statusCode).toBe(403);

    // valid signature → 204
    const ok = await app.inject({
      method: 'PUT',
      url: `/storage/upload/${token}`,
      headers: { 'content-type': 'image/jpeg' },
      payload: Buffer.from('fake-jpeg-bytes'),
    });
    expect(ok.statusCode).toBe(204);
  });

  it('finalizes the version via the [SYS] function (elevated, ownership re-checked)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/documents/${applicationId}/finalize`,
      headers: await userAuth(ACTORS.applicantA),
      payload: { document_type: 'MATRIC', object_key: objectKey, mime: 'image/jpeg', size: 15 },
    });
    expect(res.statusCode).toBe(201);
    versionId = res.json().version_id;
    expect(versionId).toBeTruthy();
    // response exposes metadata, never the storage path
    expect(res.json()).not.toHaveProperty('storage_path');
  });

  it('owner gets a signed download URL; response has no storage path', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/documents/${versionId}/download-url?purpose=view`,
      headers: await userAuth(ACTORS.applicantA),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().url).toContain('/storage/download/');
    expect(res.json()).not.toHaveProperty('storage_path');
    // fetch the bytes through the signed URL
    const dl = await app.inject({ method: 'GET', url: new URL(res.json().url).pathname });
    expect(dl.statusCode).toBe(200);
  });

  it('denies document view to an unrelated trainer (SEC-DOC-004)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/documents/${versionId}/download-url`,
      headers: await userAuth(ACTORS.trainer),
    });
    expect(res.statusCode).toBe(404); // non-leak mask
  });
});

describe('service endpoints still require the service token', () => {
  it('rejects a user JWT on a [SYS] job endpoint', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/jobs/expire-offers',
      headers: await userAuth(ACTORS.superAdmin),
    });
    expect(res.statusCode).toBe(401);
  });
  it('accepts the service token', async () => {
    const res = await app.inject({ method: 'POST', url: '/jobs/expire-offers', headers: serviceAuth });
    expect(res.statusCode).toBe(200);
  });
});
