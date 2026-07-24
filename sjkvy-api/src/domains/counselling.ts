// domain: counselling
import type { Operation } from '../operation.js';
import { reqStr } from '../operation.js';
import { obj, uuid, isoDateTime, okResult } from '../schemas.js';

export const counsellingOps: Operation[] = [
  {
    domain: 'counselling',
    opId: 'counsel.schedule',
    method: 'POST',
    path: '/applications/:id/counselling',
    auth: 'user',
    summary: 'Counsellor schedules a counselling appointment (requires VERIFIED case).',
    fn: 'fn_counsel_schedule',
    successStatus: 201,
    args: (ctx) => [reqStr(ctx.params.id, 'id'), reqStr(ctx.body.scheduled_at, 'scheduled_at')],
    paramsSchema: obj({ id: uuid }, ['id']),
    request: obj({ scheduled_at: isoDateTime }, ['scheduled_at']),
    response: obj({ appointment_id: uuid }),
    errors: ['E.RES.NOT_FOUND', 'E.STATE.INVALID_TRANSITION'],
  },
  {
    domain: 'counselling',
    opId: 'counsel.reschedule',
    method: 'POST',
    path: '/counselling/:appointmentId/reschedule',
    auth: 'user',
    summary: 'Reschedule a counselling appointment (config-limited attempt count).',
    fn: 'fn_counsel_reschedule',
    args: (ctx) => [
      reqStr(ctx.params.appointmentId, 'appointmentId'),
      reqStr(ctx.body.scheduled_at, 'scheduled_at'),
      reqStr(ctx.body.reason, 'reason'),
    ],
    paramsSchema: obj({ appointmentId: uuid }, ['appointmentId']),
    request: obj({ scheduled_at: isoDateTime, reason: { type: 'string' } }, ['scheduled_at', 'reason']),
    response: okResult,
    errors: ['E.RES.NOT_FOUND', 'E.STATE.INVALID_TRANSITION', 'E.CONFLICT.CAPACITY_FULL'],
  },
  {
    domain: 'counselling',
    opId: 'counsel.mark_no_show',
    method: 'POST',
    path: '/counselling/:appointmentId/no-show',
    auth: 'user',
    summary: 'Mark a counselling appointment as no-show.',
    fn: 'fn_counsel_no_show',
    args: (ctx) => [reqStr(ctx.params.appointmentId, 'appointmentId')],
    paramsSchema: obj({ appointmentId: uuid }, ['appointmentId']),
    response: okResult,
    errors: ['E.RES.NOT_FOUND', 'E.STATE.INVALID_TRANSITION'],
  },
  {
    domain: 'counselling',
    opId: 'counsel.record_outcome',
    method: 'POST',
    path: '/counselling/:appointmentId/outcome',
    auth: 'user',
    summary: 'Record a counselling recommendation (basis for the two-step admission).',
    fn: 'fn_counsel_outcome',
    args: (ctx) => [
      reqStr(ctx.params.appointmentId, 'appointmentId'),
      reqStr(ctx.body.recommendation, 'recommendation'),
      ctx.body.notes ?? null,
    ],
    paramsSchema: obj({ appointmentId: uuid }, ['appointmentId']),
    request: obj(
      {
        recommendation: { type: 'string', enum: ['APPROVE', 'REJECT', 'HOLD'] },
        notes: { type: 'string', nullable: true },
      },
      ['recommendation'],
    ),
    response: okResult,
    errors: ['E.RES.NOT_FOUND', 'E.STATE.INVALID_TRANSITION', 'E.VAL.FAILED'],
    notes: 'The recorder cannot later finalize the admission (recommender≠finalizer, C11).',
  },
  // --- read ---
  {
    domain: 'counselling',
    opId: 'counselling.list',
    method: 'GET',
    path: '/applications/:id/counselling',
    auth: 'user',
    summary: 'List counselling appointments for an application (RLS-scoped).',
    read: (ctx) => ({
      text: `SELECT id, application_id, scheduled_at, attempt_no, status, created_at
             FROM app.counselling_appointments WHERE application_id = $1
             ORDER BY created_at DESC`,
      values: [reqStr(ctx.params.id, 'id')],
    }),
    paramsSchema: obj({ id: uuid }, ['id']),
    notes: 'Scoped by policy p_counsel_sel.',
  },
  {
    domain: 'counselling',
    opId: 'counselling.queue',
    method: 'GET',
    path: '/counselling/appointments',
    auth: 'user',
    summary: 'Counselling queue for the caller (counsellor / centre admin) across applications.',
    read: () => ({
      text: `SELECT id, application_id, scheduled_at, attempt_no, status, created_at
             FROM app.counselling_appointments
             ORDER BY scheduled_at DESC NULLS LAST, created_at DESC LIMIT 200`,
      values: [],
    }),
    notes: 'Scoped by policy p_counsel_sel — a counsellor/centre_admin sees their centre’s appointments.',
  },
];
