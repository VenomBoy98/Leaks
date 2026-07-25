// domain: verification (checker assignment, document decisions, corrections)
import type { Operation } from '../operation.js';
import { reqStr } from '../operation.js';
import { obj, uuid, okResult } from '../schemas.js';

export const verificationOps: Operation[] = [
  {
    domain: 'verification',
    opId: 'verify.assign',
    method: 'POST',
    path: '/verification/cases/:caseId/assign',
    auth: 'user',
    summary: 'Centre admin assigns a checker to a pending verification case.',
    fn: 'fn_assign_checker',
    args: (ctx) => [reqStr(ctx.params.caseId, 'caseId'), reqStr(ctx.body.checker, 'checker')],
    paramsSchema: obj({ caseId: uuid }, ['caseId']),
    request: obj({ checker: uuid }, ['checker']),
    response: okResult,
    errors: ['E.RES.NOT_FOUND', 'E.STATE.INVALID_TRANSITION'],
  },
  {
    domain: 'verification',
    opId: 'verify.reassign',
    method: 'POST',
    path: '/verification/cases/:caseId/reassign',
    auth: 'user',
    summary: 'Centre admin reassigns the active checker (deactivates prior assignment).',
    fn: 'fn_reassign_checker',
    args: (ctx) => [
      reqStr(ctx.params.caseId, 'caseId'),
      reqStr(ctx.body.checker, 'checker'),
      reqStr(ctx.body.reason, 'reason'),
    ],
    paramsSchema: obj({ caseId: uuid }, ['caseId']),
    request: obj({ checker: uuid, reason: { type: 'string' } }, ['checker', 'reason']),
    response: okResult,
    errors: ['E.RES.NOT_FOUND'],
  },
  {
    domain: 'verification',
    opId: 'verify.decide_document',
    method: 'POST',
    path: '/verification/cases/:caseId/decisions',
    auth: 'user',
    summary: 'Assigned checker accepts/rejects a document version (auto-verifies when complete).',
    fn: 'fn_decide_document',
    args: (ctx) => [
      reqStr(ctx.params.caseId, 'caseId'),
      reqStr(ctx.body.document_version_id, 'document_version_id'),
      reqStr(ctx.body.decision, 'decision'),
      ctx.body.reason ?? null,
    ],
    paramsSchema: obj({ caseId: uuid }, ['caseId']),
    request: obj(
      {
        document_version_id: uuid,
        decision: { type: 'string', enum: ['ACCEPT', 'REJECT'] },
        reason: { type: 'string', nullable: true },
      },
      ['document_version_id', 'decision'],
    ),
    response: obj({ decision: { type: 'string' }, case_verified: { type: 'boolean' } }),
    errors: ['E.RES.NOT_FOUND', 'E.STATE.INVALID_TRANSITION', 'E.AUTHZ.FORBIDDEN', 'E.VAL.FAILED'],
    notes: 'In-tx active-assignee recheck (SEC-ASG-001); REJECT requires reason.',
  },
  {
    domain: 'verification',
    opId: 'verify.request_correction',
    method: 'POST',
    path: '/verification/cases/:caseId/corrections',
    auth: 'user',
    summary: 'Assigned checker requests document corrections (moves case to CORRECTION_REQUESTED).',
    fn: 'fn_request_correction',
    args: (ctx) => [reqStr(ctx.params.caseId, 'caseId'), ctx.body.items ?? []],
    paramsSchema: obj({ caseId: uuid }, ['caseId']),
    request: obj(
      {
        items: {
          type: 'array',
          items: obj({ document_id: uuid, message: { type: 'string' } }, ['message']),
        },
      },
      ['items'],
    ),
    response: okResult,
    errors: ['E.RES.NOT_FOUND', 'E.STATE.INVALID_TRANSITION', 'E.AUTHZ.FORBIDDEN', 'E.VAL.FAILED'],
  },
  {
    domain: 'verification',
    opId: 'application.resubmit_corrections',
    method: 'POST',
    path: '/applications/:id/resubmit',
    auth: 'user',
    summary: 'Applicant resubmits after corrections (partial-aware, idempotent).',
    fn: 'fn_resubmit_corrections',
    idempotent: true,
    args: (ctx) => [reqStr(ctx.params.id, 'id')],
    paramsSchema: obj({ id: uuid }, ['id']),
    response: obj({ open_items: { type: 'integer' } }),
    errors: ['E.RES.NOT_FOUND', 'E.STATE.INVALID_TRANSITION'],
  },
  {
    domain: 'verification',
    opId: 'verify.fail',
    method: 'POST',
    path: '/verification/cases/:caseId/fail',
    auth: 'user',
    summary: 'Assigned checker fails a verification case.',
    fn: 'fn_fail_verification',
    args: (ctx) => [reqStr(ctx.params.caseId, 'caseId'), reqStr(ctx.body.reason, 'reason')],
    paramsSchema: obj({ caseId: uuid }, ['caseId']),
    request: obj({ reason: { type: 'string' } }, ['reason']),
    response: okResult,
    errors: ['E.RES.NOT_FOUND', 'E.STATE.INVALID_TRANSITION', 'E.AUTHZ.FORBIDDEN'],
  },
  // --- reads ---
  {
    domain: 'verification',
    opId: 'verification.cases.list',
    method: 'GET',
    path: '/verification/cases',
    auth: 'user',
    summary: 'List verification cases visible to the caller (owner / checker / admin).',
    read: () => ({
      // assigned_to (active checker) is surfaced via the RLS-scoped assignment table so the UI
      // can offer an "assigned to me" queue and show the assignee. p_vassign_sel returns the
      // row only to that checker or the case's centre_admin, so no assignment leaks cross-role.
      text: `SELECT vc.id, vc.application_id, vc.status, vc.created_at, vc.updated_at,
                    va.checker_profile_id AS assigned_to
             FROM app.verification_cases vc
             LEFT JOIN app.verification_assignments va ON va.case_id = vc.id AND va.active
             ORDER BY vc.updated_at DESC LIMIT 200`,
      values: [],
    }),
    notes: 'Scoped by policy p_vcases_sel; assignee via p_vassign_sel.',
  },
];
