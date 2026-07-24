-- t03 — Batch 7 MANDATORY: trainer attendance 11-attack red-team (+ normal path)
\set ON_ERROR_STOP off
-- fixtures: second batch at other centre + foreign enrolment
INSERT INTO app.batches (id, centre_id, course_version_id, code, capacity, start_date, end_date, status)
 VALUES ('b0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000002',
  'ab000000-0000-0000-0000-000000000001','B2',5,current_date,current_date+90,'OPEN');
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a6'); SET ROLE authenticated;
-- normal: mark own session, own-batch enrolment
DO $do$ DECLARE ok boolean; BEGIN
  WITH i AS (INSERT INTO app.attendance (session_id, enrolment_id, present)
    SELECT s.id, e.id, true FROM app.class_sessions s
    JOIN app.enrolments e ON e.batch_id = s.batch_id
    WHERE s.trainer_profile_id = auth.uid() LIMIT 1 RETURNING 1)
  SELECT count(*) = 1 INTO ok FROM i;
  PERFORM app_test.check('trainer: normal mark ok', ok);
END $do$;
DO $do$ DECLARE v boolean; BEGIN
  WITH i AS (INSERT INTO app.attendance (session_id, enrolment_id, present)
    SELECT session_id, enrolment_id, false FROM app.attendance LIMIT 1
    ON CONFLICT (session_id, enrolment_id) DO UPDATE SET present = excluded.present
    RETURNING present)
  SELECT present INTO v FROM i;
  PERFORM app_test.check('duplicate converges via upsert', v = false);
END $do$;
SELECT app_test.expect_err('attack: delete denied',
  $q$DELETE FROM app.attendance$q$,'permission denied');
SELECT app_test.expect_err('attack: FK reassign session_id denied (column grant)',
  $q$UPDATE app.attendance SET session_id = session_id$q$,'permission denied');
SELECT app_test.expect_err('attack: marked_by forge denied',
  $q$UPDATE app.attendance SET marked_by = NULL$q$,'permission denied');
RESET ROLE;
-- CAD locks; then trainer update blocked
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a4'); SET ROLE authenticated;
SELECT app.fn_lock_attendance((SELECT session_id FROM app.attendance LIMIT 1));
RESET ROLE;
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a6'); SET ROLE authenticated;
DO $do$ DECLARE n int; BEGIN
  UPDATE app.attendance SET present = NOT present; GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM app_test.check('attack: locked update affects 0 rows (RLS)', n = 0);
END $do$;
DO $do$ BEGIN
  INSERT INTO app.attendance (session_id, enrolment_id, present)
  SELECT s.id, e.id, true FROM app.class_sessions s, app.enrolments e
  WHERE s.locked_at IS NOT NULL LIMIT 1;
  PERFORM app_test.check('attack: locked insert blocked', false, 'insert succeeded');
EXCEPTION WHEN OTHERS THEN
  PERFORM app_test.check('attack: locked insert blocked', true, SQLERRM);
END $do$;
RESET ROLE;
-- CAD post-lock correction with history
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a4'); SET ROLE authenticated;
SELECT app.fn_correct_attendance((SELECT id FROM app.attendance LIMIT 1), true, 'fix',
  '77777777-7777-7777-7777-777777777771','h');
RESET ROLE;
-- PHASE2-FIX(tests): attendance_corrections is an intentionally closed table (no
-- client SELECT policy); verify the history row as superuser.
SELECT app_test.check('correction history row exists',
  EXISTS (SELECT 1 FROM app.attendance_corrections));
-- PHASE2-FIX(tests): the deactivated-trainer attack below needs an UNLOCKED session
-- to target; the only session so far is locked, so the original attack INSERT
-- selected zero rows and raised nothing. Create a second session while still active.
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a6'); SET ROLE authenticated;
INSERT INTO app.class_sessions (batch_id, session_date, kind, slot, trainer_profile_id)
 VALUES ('b0000000-0000-0000-0000-000000000001', current_date, 'THEORY', 2,
         '50000000-0000-0000-0000-0000000000a6');
RESET ROLE;
-- deactivated trainer loses write instantly
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a9'); SET ROLE authenticated;
SELECT app.fn_staff_deactivate('50000000-0000-0000-0000-0000000000a6','left org',
  '88888888-8888-8888-8888-888888888881','h');
RESET ROLE;
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a6'); SET ROLE authenticated;
DO $do$ BEGIN
  INSERT INTO app.attendance (session_id, enrolment_id, present)
  SELECT s.id, e.id, true FROM app.class_sessions s JOIN app.enrolments e ON e.batch_id=s.batch_id
  WHERE s.locked_at IS NULL LIMIT 1;
  PERFORM app_test.check('attack: deactivated trainer insert blocked', false, 'succeeded');
EXCEPTION WHEN OTHERS THEN
  PERFORM app_test.check('attack: deactivated trainer insert blocked', true, SQLERRM);
END $do$;
RESET ROLE;
SELECT app_test.check('deactivation emitted open-work event or clean audit',
  EXISTS (SELECT 1 FROM app.audit_events WHERE action='staff.deactivated'));
