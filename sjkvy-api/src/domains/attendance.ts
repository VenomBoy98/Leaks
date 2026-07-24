// domain: attendance
// Session creation, attendance marking and result recording are DIRECT WRITES the DB
// grants to `authenticated` via column-limited RLS policies (p_sessions_ins_trainer,
// p_att_ins/upd_trainer, p_ares_ins_trainer). Locking and post-lock correction are
// functions. The API issues the exact granted DML; the DB's WITH CHECK enforces authz.
import type { Operation } from '../operation.js';
import { reqStr } from '../operation.js';
import { obj, uuid, isoDate, okResult } from '../schemas.js';

export const attendanceOps: Operation[] = [
  {
    domain: 'attendance',
    opId: 'session.create',
    method: 'POST',
    path: '/sessions',
    auth: 'user',
    summary: 'Trainer creates a class session (DW: p_sessions_ins_trainer).',
    successStatus: 201,
    write: (ctx) => ({
      text: `INSERT INTO app.class_sessions (batch_id, session_date, kind, slot, topic, trainer_profile_id)
             VALUES ($1, $2, $3, coalesce($4,1), $5, auth.uid())
             RETURNING id, batch_id, session_date, kind, slot, topic, trainer_profile_id`,
      values: [
        reqStr(ctx.body.batch_id, 'batch_id'),
        reqStr(ctx.body.session_date, 'session_date'),
        reqStr(ctx.body.kind, 'kind'),
        ctx.body.slot ?? null,
        ctx.body.topic ?? null,
      ],
      single: true,
    }),
    request: obj(
      {
        batch_id: uuid,
        session_date: isoDate,
        kind: { type: 'string', enum: ['THEORY', 'PRACTICAL'] },
        slot: { type: 'integer', nullable: true },
        topic: { type: 'string', nullable: true },
      },
      ['batch_id', 'session_date', 'kind'],
    ),
    response: obj({ id: uuid, batch_id: uuid, session_date: isoDate, kind: { type: 'string' } }),
    errors: ['E.AUTHZ.FORBIDDEN'],
    notes:
      'trainer_profile_id is forced to auth.uid() in SQL; the policy WITH CHECK requires ' +
      'trainer membership at the batch centre and session_date >= today.',
  },
  {
    domain: 'attendance',
    opId: 'attendance.mark',
    method: 'POST',
    path: '/sessions/:sessionId/attendance',
    auth: 'user',
    summary: 'Trainer marks/updates attendance for an enrolment (DW upsert on the granted columns).',
    write: (ctx) => ({
      // marked_by is stamped by trigger tg_attendance_stamp; only (session_id,
      // enrolment_id, present) are granted. fn_can_mark_attendance gates via policy.
      text: `INSERT INTO app.attendance (session_id, enrolment_id, present)
             VALUES ($1, $2, $3)
             ON CONFLICT (session_id, enrolment_id) DO UPDATE SET present = excluded.present
             RETURNING id, session_id, enrolment_id, present`,
      values: [
        reqStr(ctx.params.sessionId, 'sessionId'),
        reqStr(ctx.body.enrolment_id, 'enrolment_id'),
        ctx.body.present === true,
      ],
      single: true,
    }),
    paramsSchema: obj({ sessionId: uuid }, ['sessionId']),
    request: obj({ enrolment_id: uuid, present: { type: 'boolean' } }, ['enrolment_id', 'present']),
    response: obj({ id: uuid, present: { type: 'boolean' } }),
    errors: ['E.AUTHZ.FORBIDDEN'],
    notes:
      'Blocked once the session is locked or the trainer is deactivated (verified in the ' +
      'attendance red-team, t03). No delete/FK-reassign grant.',
  },
  {
    domain: 'attendance',
    opId: 'attendance.lock',
    method: 'POST',
    path: '/sessions/:sessionId/lock',
    auth: 'user',
    summary: 'Trainer or centre admin locks a session’s attendance.',
    fn: 'fn_lock_attendance',
    args: (ctx) => [reqStr(ctx.params.sessionId, 'sessionId')],
    paramsSchema: obj({ sessionId: uuid }, ['sessionId']),
    response: okResult,
    errors: ['E.RES.NOT_FOUND', 'E.STATE.INVALID_TRANSITION'],
  },
  {
    domain: 'attendance',
    opId: 'attendance.correct',
    method: 'POST',
    path: '/attendance/:attendanceId/correct',
    auth: 'user',
    summary: 'Centre admin corrects a locked attendance record (history row, idempotent).',
    fn: 'fn_correct_attendance',
    idempotent: true,
    args: (ctx) => [
      reqStr(ctx.params.attendanceId, 'attendanceId'),
      ctx.body.present === true,
      reqStr(ctx.body.reason, 'reason'),
    ],
    paramsSchema: obj({ attendanceId: uuid }, ['attendanceId']),
    request: obj({ present: { type: 'boolean' }, reason: { type: 'string' } }, ['present', 'reason']),
    response: okResult,
    errors: ['E.RES.NOT_FOUND', 'E.STATE.INVALID_TRANSITION'],
    notes: 'Post-lock only; writes an attendance_corrections audit row.',
  },
  // --- read ---
  {
    domain: 'attendance',
    opId: 'attendance.list',
    method: 'GET',
    path: '/sessions/:sessionId/attendance',
    auth: 'user',
    summary: 'List attendance for a session (student self / trainer / centre admin).',
    read: (ctx) => ({
      text: `SELECT id, session_id, enrolment_id, present, created_at, updated_at
             FROM app.attendance WHERE session_id = $1`,
      values: [reqStr(ctx.params.sessionId, 'sessionId')],
    }),
    paramsSchema: obj({ sessionId: uuid }, ['sessionId']),
    notes: 'Scoped by policy p_att_sel.',
  },
];
