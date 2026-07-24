-- t02 — Batches 5–9: counselling→admission (two-step, seat race basis), enrolment, hostel, certs
\set ON_ERROR_STOP off
-- counselling by CNS; recommender≠finalizer enforced
-- PHASE2-FIX(tests): document_versions is a closed table (no client SELECT), so the
-- checker cannot sub-select the version id; fetch ids as superuser, call with literals.
SELECT id AS case1 FROM app.verification_cases LIMIT 1 \gset
SELECT id AS dv2 FROM app.document_versions LIMIT 1 \gset
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a2'); SET ROLE authenticated;
SELECT app.fn_decide_document(:'case1', :'dv2', 'ACCEPT', NULL);
RESET ROLE;
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a3'); SET ROLE authenticated;
SELECT app.fn_counsel_schedule((SELECT id FROM app.applications LIMIT 1), now()+interval '1 day');
SELECT app.fn_counsel_outcome((SELECT id FROM app.counselling_appointments LIMIT 1),'APPROVE','ok');
SELECT app_test.expect_err('two-step: recommender cannot finalize',
  $q$SELECT app.fn_admission_finalize((SELECT id FROM app.applications LIMIT 1),'APPROVED',
     'b0000000-0000-0000-0000-000000000001',NULL,'33333333-3333-3333-3333-333333333331','h')$q$,
  'E.RES.NOT_FOUND');  -- CNS lacks centre_admin: non-leak masks as NOT_FOUND
RESET ROLE;
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a4'); SET ROLE authenticated;
SELECT app_test.check('CAD: finalize APPROVED',
  (app.fn_admission_finalize((SELECT id FROM app.applications LIMIT 1),'APPROVED',
   'b0000000-0000-0000-0000-000000000001',NULL,'33333333-3333-3333-3333-333333333332','h')->>'decision')='APPROVED');
RESET ROLE;
-- accept offer → enrolment (+hostel_required=false default)
SELECT app_test.as_user('a0000000-0000-0000-0000-00000000000a'); SET ROLE authenticated;
SELECT app_test.check('A: offer accept → enrolment',
  (app.fn_offer_accept((SELECT id FROM app.admission_offers LIMIT 1),
   '44444444-4444-4444-4444-444444444441','h')->>'enrolment_id') IS NOT NULL);
RESET ROLE;
-- seat formula: capacity 2, 1 enrolled → second APPROVED consumes last seat; third → WAITLISTED(BATCH_FULL)
-- (full parallel race covered in tests/concurrency/seat_race.sh)
-- hostel: request/approve/allocate/double-bed/transfer/discharge/re-request
SELECT app_test.as_user('a0000000-0000-0000-0000-00000000000a'); SET ROLE authenticated;
SELECT app.fn_hostel_request((SELECT id FROM app.enrolments LIMIT 1));
RESET ROLE;
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a7'); SET ROLE authenticated;
SELECT app.fn_hostel_approve((SELECT id FROM app.hostel_requests LIMIT 1));
SELECT app.fn_hostel_allocate((SELECT id FROM app.hostel_requests LIMIT 1),
  '4d000000-0000-0000-0000-0000000000b1','55555555-5555-5555-5555-555555555551','h');
SELECT app_test.check('bed OCCUPIED after allocate',
  (SELECT status FROM app.beds WHERE id='4d000000-0000-0000-0000-0000000000b1')='OCCUPIED');
SELECT app_test.expect_err('same bed second allocation blocked',
  $q$SELECT app.fn_hostel_allocate((SELECT id FROM app.hostel_requests LIMIT 1),
     '4d000000-0000-0000-0000-0000000000b1','55555555-5555-5555-5555-555555555552','h')$q$,
  'E.CONFLICT.ALREADY_ACTIVE');
  -- PHASE2-FIX(tests): the function locks and checks the BED (lock rank 2) before it
  -- reads the request (rank 3), so an occupied bed raises E.CONFLICT.ALREADY_ACTIVE
  -- first; the original expectation assumed the request-state check came first.
SELECT app.fn_hostel_transfer((SELECT id FROM app.enrolments LIMIT 1),
  '4d000000-0000-0000-0000-0000000000b2','tx1','55555555-5555-5555-5555-555555555553','h');
SELECT app_test.check('transfer: old bed freed, one active allocation',
  (SELECT status FROM app.beds WHERE id='4d000000-0000-0000-0000-0000000000b1')='AVAILABLE'
  AND (SELECT count(*) FROM app.hostel_allocations WHERE released_at IS NULL)=1);
SELECT app.fn_hostel_discharge((SELECT id FROM app.hostel_allocations WHERE released_at IS NULL),
  'left','55555555-5555-5555-5555-555555555554','h');
RESET ROLE;
SELECT app_test.as_user('a0000000-0000-0000-0000-00000000000a'); SET ROLE authenticated;
SELECT app_test.check('re-request after discharge allowed (E-2)',
  (app.fn_hostel_request((SELECT id FROM app.enrolments LIMIT 1))->>'request_id') IS NOT NULL);
RESET ROLE;
-- certificates: gate, issue, duplicate, reissue chain, revoke, public verify
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a4'); SET ROLE authenticated;
SELECT app.fn_confirm_joining((SELECT id FROM app.enrolments LIMIT 1));
SELECT app_test.expect_err('cert blocked pre-completion',
  $q$SELECT app.fn_cert_issue((SELECT id FROM app.enrolments LIMIT 1),
     '66666666-6666-6666-6666-666666666661','h')$q$,'E.STATE.INVALID_TRANSITION');
RESET ROLE;
-- trainer records PASS result, CAD finalizes, completes, issues
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a6'); SET ROLE authenticated;
INSERT INTO app.class_sessions (batch_id, session_date, kind, trainer_profile_id)
 VALUES ('b0000000-0000-0000-0000-000000000001', current_date, 'THEORY',
         '50000000-0000-0000-0000-0000000000a6');
RESET ROLE;
INSERT INTO app.assessments (id, batch_id, name, max_marks)
 VALUES ('a5000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','Final',100);
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a6'); SET ROLE authenticated;
INSERT INTO app.assessment_results (assessment_id, enrolment_id, marks, result)
 VALUES ('a5000000-0000-0000-0000-000000000001',(SELECT id FROM app.enrolments LIMIT 1),80,'PASS');
RESET ROLE;
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a4'); SET ROLE authenticated;
SELECT app.fn_finalize_assessment('a5000000-0000-0000-0000-000000000001');
RESET ROLE;
-- PHASE2-FIX(tests): enrolment completion + certificate lifecycle moved to t04.
-- t02 previously completed the only enrolment, which made t03's attendance red-team
-- normal path impossible (fn_can_mark_attendance requires ENROLLED/ACTIVE) — a latent
-- ordering defect in the never-executed suite, exposed by the first real run.
