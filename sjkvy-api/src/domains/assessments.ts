// domain: assessments
// Recording a result is a DIRECT WRITE (p_ares_ins_trainer); finalizing is a function.
// NOTE (documented gap from the Phase-1 audit): the catalogue has NO client path to
// CREATE an assessment row (only the seed inserts them). That admin CRUD is a known
// DB gap tracked for a future migration; the API therefore does not expose an
// assessment-create endpoint rather than fabricate one. See PHASE3_API_NOTES.md.
import type { Operation } from '../operation.js';
import { reqStr } from '../operation.js';
import { obj, uuid, okResult } from '../schemas.js';

export const assessmentsOps: Operation[] = [
  {
    domain: 'assessments',
    opId: 'assessment.record_result',
    method: 'POST',
    path: '/assessments/:assessmentId/results',
    auth: 'user',
    summary: 'Trainer records a student result (DW: p_ares_ins_trainer; pre-finalization only).',
    successStatus: 201,
    write: (ctx) => ({
      text: `INSERT INTO app.assessment_results (assessment_id, enrolment_id, marks, result)
             VALUES ($1, $2, $3, $4)
             RETURNING id, assessment_id, enrolment_id, marks, result`,
      values: [
        reqStr(ctx.params.assessmentId, 'assessmentId'),
        reqStr(ctx.body.enrolment_id, 'enrolment_id'),
        ctx.body.marks ?? null,
        reqStr(ctx.body.result, 'result'),
      ],
      single: true,
    }),
    paramsSchema: obj({ assessmentId: uuid }, ['assessmentId']),
    request: obj(
      {
        enrolment_id: uuid,
        marks: { type: 'number', nullable: true },
        result: { type: 'string', enum: ['PASS', 'FAIL', 'ABSENT'] },
      },
      ['enrolment_id', 'result'],
    ),
    response: obj({ id: uuid, result: { type: 'string' } }),
    errors: ['E.AUTHZ.FORBIDDEN'],
    notes:
      'Policy WITH CHECK requires the caller to be the batch trainer and the assessment ' +
      'not yet finalized (s.finalized_at IS NULL).',
  },
  {
    domain: 'assessments',
    opId: 'assessment.create',
    method: 'POST',
    path: '/batches/:batchId/assessments',
    auth: 'user',
    summary: 'Create an assessment for a batch (centre_admin at the batch centre; migration 0004).',
    fn: 'fn_assessment_create',
    successStatus: 201,
    args: (ctx) => [
      reqStr(ctx.params.batchId, 'batchId'),
      reqStr(ctx.body.name, 'name'),
      Number(ctx.body.max_marks ?? 0),
      ctx.body.held_on ?? null,
    ],
    paramsSchema: obj({ batchId: uuid }, ['batchId']),
    request: obj(
      {
        name: { type: 'string' },
        max_marks: { type: 'integer', minimum: 1 },
        held_on: { type: 'string', format: 'date', nullable: true },
      },
      ['name', 'max_marks'],
    ),
    response: obj({ assessment_id: uuid }),
    errors: ['E.RES.NOT_FOUND', 'E.VAL.FAILED'],
  },
  {
    domain: 'assessments',
    opId: 'assessment.finalize',
    method: 'POST',
    path: '/assessments/:assessmentId/finalize',
    auth: 'user',
    summary: 'Centre admin finalizes an assessment (locks results; gates certificate issue).',
    fn: 'fn_finalize_assessment',
    args: (ctx) => [reqStr(ctx.params.assessmentId, 'assessmentId')],
    paramsSchema: obj({ assessmentId: uuid }, ['assessmentId']),
    response: okResult,
    errors: ['E.RES.NOT_FOUND', 'E.STATE.INVALID_TRANSITION'],
  },
  // --- reads ---
  {
    domain: 'assessments',
    opId: 'assessments.list',
    method: 'GET',
    path: '/batches/:batchId/assessments',
    auth: 'user',
    summary: 'List assessments for a batch (staff / trainer / enrolled student).',
    read: (ctx) => ({
      text: `SELECT id, batch_id, name, max_marks, held_on, finalized_at, created_at
             FROM app.assessments WHERE batch_id = $1 ORDER BY created_at`,
      values: [reqStr(ctx.params.batchId, 'batchId')],
    }),
    paramsSchema: obj({ batchId: uuid }, ['batchId']),
    notes: 'Scoped by policy p_assess_sel.',
  },
  {
    domain: 'assessments',
    opId: 'assessment.results.list',
    method: 'GET',
    path: '/assessments/:assessmentId/results',
    auth: 'user',
    summary: 'List results for an assessment (student self / trainer / centre admin).',
    read: (ctx) => ({
      text: `SELECT id, assessment_id, enrolment_id, marks, result, created_at
             FROM app.assessment_results WHERE assessment_id = $1`,
      values: [reqStr(ctx.params.assessmentId, 'assessmentId')],
    }),
    paramsSchema: obj({ assessmentId: uuid }, ['assessmentId']),
    notes: 'Scoped by policy p_ares_sel.',
  },
];
