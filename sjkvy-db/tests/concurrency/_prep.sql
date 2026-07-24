-- Concurrency fixture prep — PHASE2-FIX: rewritten after the first real execution
-- (PostgreSQL 16, 2026-07-11) exposed two defects that made every race vacuous:
--   1. "SELECT id FROM app.applications a JOIN app.applicants ap ..." was ambiguous
--      (both tables have id); under ON_ERROR_STOP the whole file aborted, so the
--      races ran with no fixtures and their invariant checks passed on empty state.
--   2. Only ONE candidate application was staged, so the "final seat" race raced a
--      single application against itself instead of two applicants against one seat.
-- Stages: applications B and C, both IN_PROCESS with an APPROVE recommendation, on
-- the capacity-1 batch; plus an unclaimed applicant sharing a phone with profile
-- "Claimer" for the claim race. Runs as superuser; actor identity is supplied via
-- the test.jwt_sub GUC because every function authorizes on auth.uid(), not role.
UPDATE app.batches SET capacity = 1 WHERE id = 'b0000000-0000-0000-0000-000000000001';

INSERT INTO app.profiles (id, full_name, phone) VALUES
  ('a0000000-0000-0000-0000-00000000000c','Applicant C','+910000000103')
  ON CONFLICT DO NOTHING;

DO $$
DECLARE p uuid; v_app uuid; v_dv uuid; v_case uuid; v_appt uuid;
BEGIN
  FOREACH p IN ARRAY ARRAY['a0000000-0000-0000-0000-00000000000b',
                           'a0000000-0000-0000-0000-00000000000c']::uuid[] LOOP
    -- applicant self-applies, uploads the required doc, submits
    PERFORM set_config('test.jwt_sub', p::text, true);
    v_app := (app.fn_create_self_application('aa000000-0000-0000-0000-000000000001',
              '2001-01-01','F','Hazaribagh',NULL,NULL,'10th')->>'application_id')::uuid;
    PERFORM app.fn_finalize_upload(p, v_app, 'MATRIC', 'q/'||left(p::text,8),
                                   'image/jpeg', 1000, 'sha');
    SELECT dv.id INTO v_dv FROM app.document_versions dv
      JOIN app.applicant_documents d ON d.id = dv.document_id
      WHERE d.application_id = v_app;
    PERFORM app.fn_scan_result(v_dv, 'CLEAN');
    PERFORM app.fn_submit_application(v_app, gen_random_uuid(), 'h');
    -- CAD assigns the checker
    PERFORM set_config('test.jwt_sub', '50000000-0000-0000-0000-0000000000a4', true);
    SELECT vc.id INTO v_case FROM app.verification_cases vc WHERE vc.application_id = v_app;
    PERFORM app.fn_assign_checker(v_case, '50000000-0000-0000-0000-0000000000a2');
    -- checker accepts the document (case -> VERIFIED)
    PERFORM set_config('test.jwt_sub', '50000000-0000-0000-0000-0000000000a2', true);
    PERFORM app.fn_decide_document(v_case, v_dv, 'ACCEPT', NULL);
    -- counsellor schedules and records APPROVE (two-step basis for finalize)
    PERFORM set_config('test.jwt_sub', '50000000-0000-0000-0000-0000000000a3', true);
    v_appt := (app.fn_counsel_schedule(v_app, now() + interval '1 day')->>'appointment_id')::uuid;
    PERFORM app.fn_counsel_outcome(v_appt, 'APPROVE', 'ok');
  END LOOP;
  PERFORM set_config('test.jwt_sub', '', true);
END $$;

-- unclaimed applicant sharing a phone with a fresh profile -> claim race
INSERT INTO app.profiles (id, full_name, phone) VALUES
  ('c1a10000-0000-0000-0000-000000000001','Claimer','+91CLAIM00001')
  ON CONFLICT DO NOTHING;
INSERT INTO app.applicants (full_name, phone, dob, gender, district, created_channel)
  VALUES ('Walkin','+91CLAIM00001','2000-05-05','F','Hazaribagh','ASSISTED')
  ON CONFLICT DO NOTHING;
