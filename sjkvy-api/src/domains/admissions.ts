// domain: admissions (finalize decision + waitlist promotion — seat-concurrency core)
import type { Operation } from '../operation.js';
import { reqStr } from '../operation.js';
import { obj, uuid } from '../schemas.js';

export const admissionsOps: Operation[] = [
  {
    domain: 'admissions',
    opId: 'admission.finalize',
    method: 'POST',
    path: '/applications/:id/admission',
    auth: 'user',
    summary: 'Centre admin finalizes admission (APPROVED/REJECTED/WAITLISTED, seat-safe, idempotent).',
    fn: 'fn_admission_finalize',
    idempotent: true,
    args: (ctx) => [
      reqStr(ctx.params.id, 'id'),
      reqStr(ctx.body.decision, 'decision'),
      ctx.body.batch_id ?? null,
      ctx.body.reason ?? null,
    ],
    paramsSchema: obj({ id: uuid }, ['id']),
    request: obj(
      {
        decision: { type: 'string', enum: ['APPROVED', 'REJECTED', 'WAITLISTED'] },
        batch_id: { ...uuid, nullable: true },
        reason: { type: 'string', nullable: true },
      },
      ['decision'],
    ),
    response: obj({
      decision: { type: 'string' },
      offer_id: { ...uuid, nullable: true },
      rank: { type: 'integer', nullable: true },
    }),
    errors: [
      'E.RES.NOT_FOUND',
      'E.STATE.INVALID_TRANSITION',
      'E.AUTHZ.FORBIDDEN',
      'E.VAL.FAILED',
    ],
    notes:
      'Locks batch before application; auto-waitlists on BATCH_FULL. Enforces ' +
      'recommender≠finalizer. Seat-count race verified (SEC-CONC-001).',
  },
  {
    domain: 'admissions',
    opId: 'waitlist.promote',
    method: 'POST',
    path: '/batches/:batchId/waitlist/promote',
    auth: 'user',
    summary: 'Promote the top waitlisted application when a seat is free (idempotent).',
    fn: 'fn_waitlist_promote',
    idempotent: true,
    args: (ctx) => [reqStr(ctx.params.batchId, 'batchId')],
    paramsSchema: obj({ batchId: uuid }, ['batchId']),
    response: obj({
      promoted: { type: 'boolean' },
      application_id: { ...uuid, nullable: true },
      why: { type: 'string', nullable: true },
    }),
    errors: ['E.RES.NOT_FOUND'],
    notes:
      'Grantable to both authenticated (centre admin manual) and service_role (scheduler). ' +
      'FOR UPDATE SKIP LOCKED prevents double promotion (SEC-CONC-002).',
  },
  // --- reads ---
  {
    domain: 'admissions',
    opId: 'admission.decisions.list',
    method: 'GET',
    path: '/applications/:id/decisions',
    auth: 'user',
    summary: 'List admission decisions for an application (RLS-scoped).',
    read: (ctx) => ({
      text: `SELECT id, application_id, decision, batch_id, reason, superseded_by, created_at
             FROM app.admission_decisions WHERE application_id = $1
             ORDER BY created_at DESC`,
      values: [reqStr(ctx.params.id, 'id')],
    }),
    paramsSchema: obj({ id: uuid }, ['id']),
    notes: 'Scoped by policy p_decision_sel.',
  },
  {
    domain: 'admissions',
    opId: 'waitlist.list',
    method: 'GET',
    path: '/batches/:batchId/waitlist',
    auth: 'user',
    summary: 'List active waitlist entries for a batch (owner or centre admin).',
    read: (ctx) => ({
      text: `SELECT id, application_id, batch_id, rank, status, created_at
             FROM app.waitlist_entries WHERE batch_id = $1 AND status = 'ACTIVE'
             ORDER BY rank`,
      values: [reqStr(ctx.params.batchId, 'batchId')],
    }),
    paramsSchema: obj({ batchId: uuid }, ['batchId']),
    notes: 'Scoped by policy p_wl_sel.',
  },
];
