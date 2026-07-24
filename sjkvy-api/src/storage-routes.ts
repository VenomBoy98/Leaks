// storage-routes.ts — the browser-facing secure document pipeline. Orchestration only;
// authorization lives in the database ([SYS] fn_finalize_upload / fn_authorize_doc_view).
//
// Flow:
//   1. POST /documents/:applicationId/upload-url  (user) → validate + sign a PUT URL
//   2. PUT  /storage/upload/:token                (signed) → store bytes
//   3. POST /documents/:applicationId/finalize    (user)  → record version via [SYS] fn
//   4. GET  /documents/:versionId/download-url     (user)  → authorize via [SYS] fn, sign GET
//   5. GET  /storage/download/:token              (signed) → stream bytes
//
// storage_path is never returned to a client; only opaque signed URLs.
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { callFn, queryRead, elevatedActor } from './db.js';
import { resolveActor } from './auth.js';
import { ApiError } from './errors.js';
import { buildStorage } from './storage/index.js';
import type { Config } from './config.js';

interface FinalizeResult {
  document_id: string;
  version_id: string;
  version_no: number;
  scan_status: string;
}

export function registerStorage(app: FastifyInstance, cfg: Config): void {
  const storage = buildStorage(cfg);
  const driver = storage.driver;

  // Raw-body parser for the allowed upload content types (buffered, size-capped).
  for (const mime of cfg.storage.allowedMime) {
    app.addContentTypeParser(mime, { parseAs: 'buffer', bodyLimit: cfg.storage.maxUploadBytes },
      (_req, body, done) => done(null, body));
  }
  app.addContentTypeParser('application/octet-stream',
    { parseAs: 'buffer', bodyLimit: cfg.storage.maxUploadBytes },
    (_req, body, done) => done(null, body));

  // 1. request a signed upload URL ------------------------------------------------
  app.route({
    method: 'POST',
    url: '/documents/:applicationId/upload-url',
    schema: {
      tags: ['documents'],
      summary: 'Request a signed upload URL for a document (user).',
      params: { type: 'object', properties: { applicationId: { type: 'string', format: 'uuid' } } },
      body: {
        type: 'object',
        required: ['document_type', 'mime', 'size'],
        properties: {
          document_type: { type: 'string' },
          mime: { type: 'string' },
          size: { type: 'integer', minimum: 1 },
        },
      },
    },
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const actor = await resolveActor(req, 'user', cfg);
      const { applicationId } = req.params as { applicationId: string };
      const body = req.body as { document_type: string; mime: string; size: number };

      const v = storage.validateUpload(body.mime, body.size);
      if (!v.ok) throw new ApiError(422, 'E.VAL.FAILED', v.reason ?? 'invalid upload');

      // Ownership gate via RLS: the caller must be able to SEE the application (their
      // own, or one they staff/assist). Uses the existing policy — no new logic.
      const rows = await queryRead(actor, `SELECT id FROM app.applications WHERE id = $1`, [
        applicationId,
      ]);
      if (rows.length === 0) throw new ApiError(404, 'E.RES.NOT_FOUND', 'Not found');

      const key = storage.makeObjectKey(applicationId, body.document_type);
      const signed = await driver.presignUpload(key, body.mime);
      return reply.send({ object_key: key, ...signed });
    },
  });

  // 2. receive the upload (signature-gated; no bearer) -----------------------------
  app.route({
    method: 'PUT',
    url: '/storage/upload/:token',
    schema: { tags: ['documents'], summary: 'Signed upload sink (internal gateway).', hide: true } as never,
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const { token } = req.params as { token: string };
      const p = driver.verifyToken?.(token);
      if (!p || p.op !== 'up') throw new ApiError(403, 'E.AUTHZ.FORBIDDEN', 'Invalid or expired URL');
      const ct = req.headers['content-type'];
      if (p.ct && ct !== p.ct) throw new ApiError(422, 'E.VAL.FAILED', 'content-type mismatch');
      const data = req.body as Buffer;
      if (!Buffer.isBuffer(data) || data.length === 0) {
        throw new ApiError(422, 'E.VAL.FAILED', 'empty body');
      }
      if (p.max && data.length > p.max) {
        throw new ApiError(413, 'E.VAL.FAILED', 'payload too large');
      }
      await driver.put!(p.key, data);
      return reply.status(204).send();
    },
  });

  // 3. finalize the upload → record a document version via [SYS] fn -----------------
  app.route({
    method: 'POST',
    url: '/documents/:applicationId/finalize',
    schema: {
      tags: ['documents'],
      summary: 'Finalize an uploaded document version (user; elevates to [SYS] fn).',
      params: { type: 'object', properties: { applicationId: { type: 'string', format: 'uuid' } } },
      body: {
        type: 'object',
        required: ['document_type', 'object_key', 'mime', 'size'],
        properties: {
          document_type: { type: 'string' },
          object_key: { type: 'string' },
          mime: { type: 'string' },
          size: { type: 'integer', minimum: 1 },
          sha256: { type: 'string' },
        },
      },
    },
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const actor = await resolveActor(req, 'user', cfg);
      if (!actor.uid) throw new ApiError(401, 'E.AUTHZ.FORBIDDEN', 'Authentication required');
      const { applicationId } = req.params as { applicationId: string };
      const b = req.body as {
        document_type: string;
        object_key: string;
        mime: string;
        size: number;
        sha256?: string;
      };
      // The bytes must actually exist at the claimed key (prevents recording a version
      // for an object that was never uploaded).
      if (!(await driver.exists(b.object_key))) {
        throw new ApiError(422, 'E.VAL.FAILED', 'object not found for key');
      }
      // [SYS] fn re-checks that the verified caller owns/assists the application.
      const result = await callFn<FinalizeResult>(elevatedActor(actor.uid), 'fn_finalize_upload', [
        actor.uid,
        applicationId,
        b.document_type,
        b.object_key, // storage_path — stored, never returned to clients
        b.mime,
        b.size,
        b.sha256 ?? null,
      ]);
      return reply.status(201).send(result);
    },
  });

  // 4. request a signed download URL (authorized by [SYS] fn) -----------------------
  app.route({
    method: 'GET',
    url: '/documents/:versionId/download-url',
    schema: {
      tags: ['documents'],
      summary: 'Authorize a document view and return a short-lived signed download URL.',
      params: { type: 'object', properties: { versionId: { type: 'string', format: 'uuid' } } },
      querystring: { type: 'object', properties: { purpose: { type: 'string' } } },
    },
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const actor = await resolveActor(req, 'user', cfg);
      if (!actor.uid) throw new ApiError(401, 'E.AUTHZ.FORBIDDEN', 'Authentication required');
      const { versionId } = req.params as { versionId: string };
      const purpose = (req.query as { purpose?: string }).purpose ?? 'view';
      // fn_authorize_doc_view returns the storage path ONLY to service_role, audits the
      // access, and denies trainer/hostel/placement (SEC-DOC-004). We never echo the path.
      const path = await callFn<string>(elevatedActor(actor.uid), 'fn_authorize_doc_view', [
        actor.uid,
        versionId,
        purpose,
      ]);
      const signed = await driver.presignDownload(path);
      return reply.send({ url: signed.url, method: 'GET', expires_at: signed.expires_at });
    },
  });

  // 5. serve the download (signature-gated; no bearer) -----------------------------
  app.route({
    method: 'GET',
    url: '/storage/download/:token',
    schema: { tags: ['documents'], summary: 'Signed download source (internal gateway).', hide: true } as never,
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const { token } = req.params as { token: string };
      const p = driver.verifyToken?.(token);
      if (!p || p.op !== 'dn') throw new ApiError(403, 'E.AUTHZ.FORBIDDEN', 'Invalid or expired URL');
      if (!(await driver.exists(p.key))) throw new ApiError(404, 'E.RES.NOT_FOUND', 'Not found');
      const data = await driver.get!(p.key);
      return reply
        .header('content-type', 'application/octet-stream')
        .header('cache-control', 'private, no-store')
        .send(data);
    },
  });
}
