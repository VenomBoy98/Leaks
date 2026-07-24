// domain: certificates (issue/reissue/revoke + PUBLIC verification)
import type { Operation } from '../operation.js';
import { reqStr } from '../operation.js';
import { obj, uuid, okResult } from '../schemas.js';

export const certificatesOps: Operation[] = [
  {
    domain: 'certificates',
    opId: 'cert.issue',
    method: 'POST',
    path: '/enrolments/:enrolmentId/certificate',
    auth: 'user',
    summary: 'Centre admin issues a certificate (COMPLETED + assessment-passed gate, idempotent).',
    fn: 'fn_cert_issue',
    idempotent: true,
    successStatus: 201,
    args: (ctx) => [reqStr(ctx.params.enrolmentId, 'enrolmentId')],
    paramsSchema: obj({ enrolmentId: uuid }, ['enrolmentId']),
    response: obj({
      certificate_id: uuid,
      certificate_no: { type: 'string' },
      verify_code: { type: 'string' },
    }),
    errors: ['E.RES.NOT_FOUND', 'E.STATE.INVALID_TRANSITION', 'E.CONFLICT.ALREADY_ACTIVE'],
    notes: 'One ISSUED cert per enrolment (ux_cert_active); collision-retry on verify_code.',
  },
  {
    domain: 'certificates',
    opId: 'cert.reissue',
    method: 'POST',
    path: '/certificates/:certId/reissue',
    auth: 'user',
    summary: 'Reissue a certificate (supersede chain, idempotent).',
    fn: 'fn_cert_reissue',
    idempotent: true,
    args: (ctx) => [reqStr(ctx.params.certId, 'certId'), reqStr(ctx.body.reason, 'reason')],
    paramsSchema: obj({ certId: uuid }, ['certId']),
    request: obj({ reason: { type: 'string' } }, ['reason']),
    response: obj({ new_certificate_id: uuid }),
    errors: ['E.RES.NOT_FOUND', 'E.STATE.INVALID_TRANSITION', 'E.VAL.FAILED'],
  },
  {
    domain: 'certificates',
    opId: 'cert.revoke',
    method: 'POST',
    path: '/certificates/:certId/revoke',
    auth: 'user',
    summary: 'Revoke a certificate (idempotent).',
    fn: 'fn_cert_revoke',
    idempotent: true,
    args: (ctx) => [reqStr(ctx.params.certId, 'certId'), reqStr(ctx.body.reason, 'reason')],
    paramsSchema: obj({ certId: uuid }, ['certId']),
    request: obj({ reason: { type: 'string' } }, ['reason']),
    response: okResult,
    errors: ['E.RES.NOT_FOUND', 'E.STATE.INVALID_TRANSITION', 'E.VAL.FAILED'],
  },
  {
    domain: 'certificates',
    opId: 'cert.verify',
    method: 'GET',
    path: '/verify/:code',
    auth: 'none',
    summary: 'PUBLIC certificate verification by code (uniform minimal projection).',
    fn: 'fn_cert_verify',
    // Tighter limit: this anon endpoint is enumeration-prone. Codes are high-entropy
    // so brute force is impractical, but rate-limit as defense-in-depth.
    rateLimit: { max: 20, timeWindow: '1 minute' },
    args: (ctx) => [reqStr(ctx.params.code, 'code')],
    paramsSchema: obj({ code: { type: 'string' } }, ['code']),
    response: obj({
      valid: { type: 'boolean' },
      status: { type: 'string', nullable: true },
      holder_name: { type: 'string', nullable: true },
      course_code: { type: 'string', nullable: true },
      batch_code: { type: 'string', nullable: true },
      issued_on: { type: 'string', nullable: true },
      superseded: { type: 'boolean', nullable: true },
    }),
    notes:
      'anon EXECUTE. Unknown code → uniform {valid:false}; no PII beyond holder name + ' +
      'course/batch. Rate limiting is an API-tier concern (see notes).',
  },
  {
    domain: 'certificates',
    opId: 'certificates.list',
    method: 'GET',
    path: '/certificates',
    auth: 'user',
    summary: 'List certificates for the caller’s centre (centre admin) or own (holder).',
    read: () => ({
      text: `SELECT id, enrolment_id, certificate_no, verify_code, status, supersedes_id, created_at
             FROM app.certificates ORDER BY created_at DESC LIMIT 200`,
      values: [],
    }),
    notes: 'Scoped by policy p_cert_sel (owner or centre_admin at the enrolment’s centre).',
  },
];
