// domain: documents
// Storage/scanning live OUTSIDE SQL. The API's server tier holds the storage
// credentials and mints signed URLs; the DB owns only the authorization + metadata.
// finalize_upload / scan_result / authorize_doc_view are [SYS] (service_role): the
// server verifies the caller, uploads bytes to storage, then records/authorizes here.
import type { Operation } from '../operation.js';
import { reqStr } from '../operation.js';
import { obj, uuid } from '../schemas.js';

export const documentsOps: Operation[] = [
  {
    domain: 'documents',
    opId: 'doc.finalize_upload',
    method: 'POST',
    path: '/documents/finalize',
    auth: 'service',
    summary: 'Record a finished upload version for an application ([SYS]).',
    fn: 'fn_finalize_upload',
    successStatus: 201,
    args: (ctx) => [
      reqStr(ctx.body.caller, 'caller'),
      reqStr(ctx.body.application_id, 'application_id'),
      reqStr(ctx.body.document_type, 'document_type'),
      reqStr(ctx.body.storage_path, 'storage_path'),
      reqStr(ctx.body.mime, 'mime'),
      Number(ctx.body.size ?? 0),
      ctx.body.sha256 ?? null,
    ],
    request: obj(
      {
        caller: uuid,
        application_id: uuid,
        document_type: { type: 'string' },
        storage_path: { type: 'string' },
        mime: { type: 'string' },
        size: { type: 'integer', minimum: 1 },
        sha256: { type: 'string', nullable: true },
      },
      ['caller', 'application_id', 'document_type', 'storage_path', 'mime', 'size'],
    ),
    response: obj({
      document_id: uuid,
      version_id: uuid,
      version_no: { type: 'integer' },
      scan_status: { type: 'string' },
    }),
    errors: ['E.RES.NOT_FOUND', 'E.STATE.INVALID_TRANSITION'],
    notes:
      'service_role. Function re-checks that `caller` owns or assists the application; ' +
      'storage_path is stored but never exposed to clients (SEC-DOC-001).',
  },
  {
    domain: 'documents',
    opId: 'doc.scan_callback',
    method: 'POST',
    path: '/documents/:versionId/scan-result',
    auth: 'service',
    summary: 'Anti-virus/scan callback marks a version CLEAN or FLAGGED ([SYS]).',
    fn: 'fn_scan_result',
    args: (ctx) => [reqStr(ctx.params.versionId, 'versionId'), reqStr(ctx.body.status, 'status')],
    paramsSchema: obj({ versionId: uuid }, ['versionId']),
    request: obj({ status: { type: 'string', enum: ['CLEAN', 'FLAGGED'] } }, ['status']),
    response: obj({}),
    errors: ['E.RES.NOT_FOUND', 'E.STATE.INVALID_TRANSITION', 'E.VAL.FAILED'],
  },
  {
    domain: 'documents',
    opId: 'doc.get_view_url',
    method: 'POST',
    path: '/documents/:versionId/view-url',
    auth: 'service',
    summary:
      'Authorize a document view and return the storage path for signed-URL minting ([SYS]).',
    fn: 'fn_authorize_doc_view',
    args: (ctx) => [
      reqStr(ctx.body.caller, 'caller'),
      reqStr(ctx.params.versionId, 'versionId'),
      reqStr(ctx.body.purpose, 'purpose'),
    ],
    paramsSchema: obj({ versionId: uuid }, ['versionId']),
    request: obj({ caller: uuid, purpose: { type: 'string' } }, ['caller', 'purpose']),
    response: obj({ storage_path: { type: 'string' } }),
    errors: ['E.RES.NOT_FOUND'],
    notes:
      'Returns the raw path only to service_role, which mints a short-lived signed URL. ' +
      'Owner/assigned-checker/admission staff only; trainer/hostel/placement denied ' +
      '(SEC-DOC-004). Every issuance is audited (SEC-DOC-003).',
  },
  // --- read ---
  {
    domain: 'documents',
    opId: 'documents.list_mine',
    method: 'GET',
    path: '/applications/:id/documents',
    auth: 'user',
    summary: 'List document metadata for an application (path-less view, RLS-scoped).',
    read: (ctx) => ({
      text: `SELECT id, application_id, document_type_code, status, version_no,
                    scan_status, uploaded_at
             FROM app.v_my_documents WHERE application_id = $1
             ORDER BY document_type_code`,
      values: [reqStr(ctx.params.id, 'id')],
    }),
    paramsSchema: obj({ id: uuid }, ['id']),
    notes:
      'Reads the definer view v_my_documents (no storage_path column); the view embeds ' +
      'the same owner/checker/admission scope as policy p_docs_sel.',
  },
];
