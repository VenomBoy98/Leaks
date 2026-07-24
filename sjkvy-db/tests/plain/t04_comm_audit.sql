-- t04 — Batches 12–13: read_at set-once, audit protections, outbox dedupe/atomicity, exports, config
\set ON_ERROR_STOP off
-- PHASE2-FIX(tests): certificate lifecycle relocated from t02 (see note there) so it
-- runs after t03's red-team, which needs the enrolment still ACTIVE.
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a4'); SET ROLE authenticated;
SELECT app.fn_complete_enrolment((SELECT id FROM app.enrolments LIMIT 1));
SELECT app_test.check('cert issue ok',
  (app.fn_cert_issue((SELECT id FROM app.enrolments LIMIT 1),
   '66666666-6666-6666-6666-666666666662','h')->>'verify_code') IS NOT NULL);
SELECT app_test.expect_err('second active cert blocked',
  $q$SELECT app.fn_cert_issue((SELECT id FROM app.enrolments LIMIT 1),
     '66666666-6666-6666-6666-666666666663','h')$q$,'E.CONFLICT.ALREADY_ACTIVE');
-- PHASE2-FIX(tests): the reissue call and the post-state assertions were one SQL
-- statement, so the count/EXISTS subqueries could not reliably observe the volatile
-- function's writes (same-statement snapshot). Split into act, then assert.
SELECT app_test.check('reissue returns new certificate id',
  (app.fn_cert_reissue((SELECT id FROM app.certificates WHERE status='ISSUED'),
   'name fix','66666666-6666-6666-6666-666666666664','h')->>'new_certificate_id') IS NOT NULL);
SELECT app_test.check('reissue chain: old REISSUED, one ISSUED, supersedes set',
  (SELECT count(*) FROM app.certificates WHERE status='ISSUED')=1
  AND EXISTS (SELECT 1 FROM app.certificates WHERE supersedes_id IS NOT NULL));
RESET ROLE;
-- PHASE2-FIX(tests): anon holds no SELECT grant on app.certificates; fetch the code
-- as superuser first, then verify through the public function as anon.
SELECT verify_code AS vcode FROM app.certificates WHERE status='ISSUED' LIMIT 1 \gset
SELECT app_test.as_user(NULL); SET ROLE anon;
SELECT app_test.check('public verify: valid + minimal fields only',
  (app.fn_cert_verify(:'vcode')->>'valid')='true'
  AND NOT (app.fn_cert_verify(:'vcode') ? 'phone'));
SELECT app_test.check('public verify: unknown code uniform false',
  (app.fn_cert_verify('NOPE')->>'valid')='false');
RESET ROLE;
-- PHASE2-FIX(tests): service_role has EXECUTE but no table grants; fetch the event id
-- as superuser, then enqueue twice as service_role to prove dedupe.
SELECT id AS ev1 FROM app.domain_events LIMIT 1 \gset
SET ROLE service_role;
SELECT app.fn_notification_enqueue(:'ev1',
 'a0000000-0000-0000-0000-00000000000a', NULL, 'INAPP', 'tpl_test', '{}'::jsonb);
SELECT app.fn_notification_enqueue(:'ev1',
 'a0000000-0000-0000-0000-00000000000a', NULL, 'INAPP', 'tpl_test', '{}'::jsonb);
RESET ROLE;
SELECT app_test.check('outbox dedupe: single notification for replayed event',
  (SELECT count(*) FROM app.notifications WHERE template_key='tpl_test')=1);
SELECT app_test.check('business events atomic: submitted event exists',
  EXISTS (SELECT 1 FROM app.domain_events WHERE event_type='application.submitted'));
SELECT app_test.as_user('a0000000-0000-0000-0000-00000000000a'); SET ROLE authenticated;
UPDATE app.notifications SET read_at = now() WHERE recipient_profile_id = auth.uid();
SELECT app_test.check('read_at set once ok',
  EXISTS (SELECT 1 FROM app.notifications WHERE read_at IS NOT NULL));
SELECT app_test.expect_err('read_at rewrite blocked (set-once)',
  $q$UPDATE app.notifications SET read_at = now() + interval '1 hour'
     WHERE recipient_profile_id = auth.uid()$q$, 'E.STATE.INVALID_TRANSITION');
SELECT app_test.expect_err('recipient col untouchable',
  $q$UPDATE app.notifications SET recipient_profile_id = NULL$q$,'permission denied');
RESET ROLE;
-- audit tamper: PHASE2-FIX(tests) — clients and service_role are already stopped at
-- the grant layer ("permission denied", proven in the first runtime run). To exercise
-- the trigger BACKSTOP itself, attack as superuser, whom only the trigger can stop.
SELECT app_test.expect_err('audit UPDATE blocked (trigger backstop)',
  $q$UPDATE app.audit_events SET reason='x'$q$,'E.AUTHZ.FORBIDDEN');
SELECT app_test.expect_err('audit DELETE blocked (trigger backstop)',
  $q$DELETE FROM app.audit_events$q$,'E.AUTHZ.FORBIDDEN');
-- audit scoped query: CAD2 sees nothing from centre1 targets
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a5'); SET ROLE authenticated;
SELECT app_test.check('CAD2 audit query centre-scoped (0 centre1 rows)',
  (SELECT count(*) FROM app.fn_audit_query(NULL,NULL,'application.submitted',50))=0);
RESET ROLE;
-- export create audited; config SAD-only
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a4'); SET ROLE authenticated;
SELECT app.fn_export_create('applications_by_status','{}'::jsonb,
  '99999999-9999-9999-9999-999999999991','h');
SELECT app_test.expect_err('CAD cannot set config (SAD only)',
  $q$SELECT app.fn_config_set('offer_expiry_days','10','test')$q$,'E.RES.NOT_FOUND');
RESET ROLE;
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a9'); SET ROLE authenticated;
SELECT app_test.check('SAD config set ok',
  (app.fn_config_set('offer_expiry_days','10','tuning')->>'ok')='true');
RESET ROLE;
SELECT app_test.check('export + config audited',
  EXISTS (SELECT 1 FROM app.audit_events WHERE action='export.created')
  AND EXISTS (SELECT 1 FROM app.audit_events WHERE action='config.changed'));
