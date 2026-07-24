-- t01 — Batches 1–4: RLS visibility, non-leak, grants, helpers, application flow, documents
\set ON_ERROR_STOP off
-- PHASE2-FIX(tests): anon has no SELECT grant on app.profiles at all, so a bare
-- SELECT errors ("permission denied") instead of returning zero rows; assert the
-- stronger grant-level denial explicitly.
SELECT app_test.as_user(NULL); SET ROLE anon;
SELECT app_test.expect_err('anon: profiles denied (no grant)',
  $q$SELECT count(*) FROM app.profiles$q$, 'permission denied');
SELECT app_test.check('anon: public catalog visible',
  EXISTS (SELECT 1 FROM app.v_public_catalog));
RESET ROLE;

-- applicant A creates + drafts + duplicate blocked
SELECT app_test.as_user('a0000000-0000-0000-0000-00000000000a'); SET ROLE authenticated;
SELECT app_test.check('A: create_self ok',
  (app.fn_create_self_application('aa000000-0000-0000-0000-000000000001','2000-01-01','F',
   'Hazaribagh',NULL,NULL,'10th')->>'status') = 'DRAFT');
SELECT app_test.expect_err('A: duplicate active blocked',
  $q$SELECT app.fn_create_self_application('aa000000-0000-0000-0000-000000000001','2000-01-01','F','Hazaribagh',NULL,NULL,'10th')$q$,
  'E.CONFLICT.ALREADY_ACTIVE');
SELECT app_test.check('A: sees own application', (SELECT count(*) FROM app.applications) = 1);
RESET ROLE;

-- cross-owner + cross-centre non-leak
SELECT app_test.as_user('a0000000-0000-0000-0000-00000000000b'); SET ROLE authenticated;
SELECT app_test.check('B: cannot see A rows (non-leak)',
  NOT EXISTS (SELECT 1 FROM app.applications));
RESET ROLE;
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a5'); SET ROLE authenticated;
SELECT app_test.check('CAD2: cross-centre applications invisible',
  NOT EXISTS (SELECT 1 FROM app.applications));
SELECT app_test.check('CAD2: cross-centre memberships invisible beyond own centre',
  NOT EXISTS (SELECT 1 FROM app.staff_memberships
              WHERE centre_id='c0000000-0000-0000-0000-000000000001'));
RESET ROLE;

-- writable-FK / immutability / role manipulation
SELECT app_test.as_user('a0000000-0000-0000-0000-00000000000a'); SET ROLE authenticated;
SELECT app_test.expect_err('A: centre_id immutable (no grant)',
  $q$UPDATE app.applications SET centre_id='c0000000-0000-0000-0000-000000000002'$q$,
  'permission denied');
SELECT app_test.expect_err('A: cannot self-grant role (no INSERT)',
  $q$INSERT INTO app.staff_memberships (profile_id, centre_id, role_code)
     VALUES ('a0000000-0000-0000-0000-00000000000a','c0000000-0000-0000-0000-000000000001','centre_admin')$q$,
  'permission denied');
SELECT app_test.expect_err('A: audit insert denied',
  $q$INSERT INTO app.audit_events (action, target_type) VALUES ('x','y')$q$,'permission denied');
-- documents: upload via service, scan, then submit
-- PHASE2-FIX(tests): service_role holds EXECUTE on the [SYS] functions but no table
-- grants (function-only access model, confirmed at runtime). Fixture ids are fetched
-- as superuser into psql variables; service_role then calls the functions with literals.
RESET ROLE;
SELECT id AS appa FROM app.applications LIMIT 1 \gset
SET ROLE service_role;
SELECT app_test.check('svc: finalize_upload ok',
  (app.fn_finalize_upload('a0000000-0000-0000-0000-00000000000a',
    :'appa','MATRIC','q/x1','image/jpeg',1000,'sha')->>'scan_status') = 'PENDING');
RESET ROLE;
SELECT id AS dv1 FROM app.document_versions LIMIT 1 \gset
SET ROLE service_role;
SELECT app.fn_scan_result(:'dv1','CLEAN');
RESET ROLE;
SELECT app_test.as_user('a0000000-0000-0000-0000-00000000000a'); SET ROLE authenticated;
SELECT app_test.check('A: doc metadata via view, no path column',
  EXISTS (SELECT 1 FROM app.v_my_documents WHERE scan_status='CLEAN'));
SELECT app_test.expect_err('A: document_versions base table denied',
  $q$SELECT storage_path FROM app.document_versions$q$,'permission denied');
-- submit + idempotent replay
SELECT app_test.check('A: submit ok',
  (app.fn_submit_application((SELECT id FROM app.applications LIMIT 1),
   '11111111-1111-1111-1111-111111111111','h1')->>'status')='SUBMITTED');
SELECT app_test.check('A: submit replay flagged',
  (app.fn_submit_application((SELECT id FROM app.applications LIMIT 1),
   '11111111-1111-1111-1111-111111111111','h1')->>'replayed')='true');
SELECT app_test.expect_err('A: same key different payload conflicts',
  $q$SELECT app.fn_submit_application((SELECT id FROM app.applications LIMIT 1),
   '11111111-1111-1111-1111-111111111111','DIFFERENT')$q$,'E.CONFLICT.DUPLICATE');
SELECT app_test.expect_err('A: stale re-submit invalid transition',
  $q$SELECT app.fn_submit_application((SELECT id FROM app.applications LIMIT 1),
   '22222222-2222-2222-2222-222222222222','h2')$q$,'E.STATE.INVALID_TRANSITION');
RESET ROLE;
-- checker assignment + unassigned denial + doc-view scope
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a4'); SET ROLE authenticated;
SELECT app.fn_assign_checker((SELECT id FROM app.verification_cases LIMIT 1),
  '50000000-0000-0000-0000-0000000000a2');
RESET ROLE;
SET ROLE service_role;
SELECT app_test.check('doc-view: assigned checker allowed (path returned to service)',
  app.fn_authorize_doc_view('50000000-0000-0000-0000-0000000000a2',
   :'dv1','verification') = 'q/x1');
SELECT app_test.expect_err('doc-view: trainer denied (SEC-DOC-004)',
  format($q$SELECT app.fn_authorize_doc_view('50000000-0000-0000-0000-0000000000a6', %L, 'x')$q$,
         :'dv1'::uuid),'E.RES.NOT_FOUND');
RESET ROLE;
-- audit_events is a closed table (no client/service grants): verify as superuser
SELECT app_test.check('doc-view issuance audited',
  EXISTS (SELECT 1 FROM app.audit_events WHERE action='document.viewed'));
