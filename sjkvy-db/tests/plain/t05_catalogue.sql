-- t05 — migration 0004 catalogue CRUD: authorization scope, state guards, non-leak.
-- Depends on the seed actors/centres/courses. Runs after 0004 is applied.
\set ON_ERROR_STOP off

-- courses are SAD-only ---------------------------------------------------------------
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a4'); SET ROLE authenticated;  -- CAD
SELECT app_test.expect_err('CAD cannot create course (SAD only)',
  $q$SELECT app.fn_course_create('CRSX','X en','X hi')$q$, 'E.RES.NOT_FOUND');
RESET ROLE;
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a9'); SET ROLE authenticated;  -- SAD
SELECT app_test.check('SAD creates course',
  (app.fn_course_create('CRSX','X en','X hi')->>'course_id') IS NOT NULL);
SELECT app_test.expect_err('duplicate course code blocked',
  $q$SELECT app.fn_course_create('CRSX','dup','dup')$q$, 'E.CONFLICT.DUPLICATE');
SELECT app_test.check('SAD adds course version',
  (app.fn_course_version_create((SELECT id FROM app.courses WHERE code='CRSX'),1,'syl',12)
   ->>'course_version_id') IS NOT NULL);
RESET ROLE;

-- batches: centre_admin at the centre; cross-centre denied ----------------------------
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a5'); SET ROLE authenticated;  -- CAD centre2
SELECT app_test.expect_err('CAD2 cannot create batch in centre1',
  $q$SELECT app.fn_batch_create('c0000000-0000-0000-0000-000000000001',
     'ab000000-0000-0000-0000-000000000001','BX',10,current_date,current_date+30)$q$,
  'E.RES.NOT_FOUND');
RESET ROLE;
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a4'); SET ROLE authenticated;  -- CAD centre1
SELECT app_test.check('CAD1 creates batch (PLANNED)',
  (app.fn_batch_create('c0000000-0000-0000-0000-000000000001',
    'ab000000-0000-0000-0000-000000000001','BX',10,current_date,current_date+30)->>'status')='PLANNED');
-- status transition guard: PLANNED->RUNNING is invalid
SELECT app_test.expect_err('invalid batch transition PLANNED->RUNNING',
  $q$SELECT app.fn_batch_set_status((SELECT id FROM app.batches WHERE code='BX'),'RUNNING')$q$,
  'E.STATE.INVALID_TRANSITION');
SELECT app_test.check('valid batch transition PLANNED->OPEN',
  (app.fn_batch_set_status((SELECT id FROM app.batches WHERE code='BX'),'OPEN')->>'status')='OPEN');
SELECT app_test.check('batch capacity update ok',
  (app.fn_batch_update((SELECT id FROM app.batches WHERE code='BX'),'{"capacity":20}'::jsonb)->>'ok')='true');
SELECT app_test.check('assessment create ok',
  (app.fn_assessment_create((SELECT id FROM app.batches WHERE code='BX'),'Mid',50,current_date)
   ->>'assessment_id') IS NOT NULL);
RESET ROLE;

-- hostel inventory: hostel_manager at centre -----------------------------------------
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a7'); SET ROLE authenticated;  -- hostel mgr c1
SELECT app.fn_hostel_block_create('c0000000-0000-0000-0000-000000000001','Block B', NULL) \gset blk_
SELECT app_test.check('hostel block created', :'blk_fn_hostel_block_create' IS NOT NULL);
RESET ROLE;
-- trainer (no hostel role) denied
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a6'); SET ROLE authenticated;
SELECT app_test.expect_err('trainer cannot create hostel block',
  $q$SELECT app.fn_hostel_block_create('c0000000-0000-0000-0000-000000000001','Nope',NULL)$q$,
  'E.RES.NOT_FOUND');
RESET ROLE;
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a7'); SET ROLE authenticated;
DO $do$ DECLARE v_block uuid; v_room uuid; BEGIN
  SELECT id INTO v_block FROM app.hostel_blocks WHERE name='Block B';
  v_room := (app.fn_room_create(v_block,'RB1')->>'room_id')::uuid;
  PERFORM app_test.check('room + bed created',
    (app.fn_bed_create(v_room,'B1')->>'bed_id') IS NOT NULL);
END $do$;
RESET ROLE;

-- notices: create draft + audience + publish path ------------------------------------
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a4'); SET ROLE authenticated;
DO $do$ DECLARE v_notice uuid; BEGIN
  v_notice := (app.fn_notice_create('c0000000-0000-0000-0000-000000000001',
    'शीर्षक','Title','मुख्य','Body')->>'notice_id')::uuid;
  PERFORM app.fn_notice_add_audience(v_notice,'PUBLIC',NULL);
  PERFORM app_test.check('notice publish after audience added',
    (app.fn_notice_publish(v_notice)->>'ok')='true');
END $do$;
RESET ROLE;

-- employers + opportunities: placement staff -----------------------------------------
SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a8'); SET ROLE authenticated;  -- placement
DO $do$ DECLARE v_emp uuid; BEGIN
  v_emp := (app.fn_employer_create('Acme','hr@acme','Hazaribagh')->>'employer_id')::uuid;
  PERFORM app_test.check('opportunity created',
    (app.fn_opportunity_create(v_emp,'c0000000-0000-0000-0000-000000000001',
      NULL,'Machine Operator',5,current_date+30)->>'opportunity_id') IS NOT NULL);
END $do$;
RESET ROLE;
-- applicant cannot create employers
SELECT app_test.as_user('a0000000-0000-0000-0000-00000000000a'); SET ROLE authenticated;
SELECT app_test.expect_err('applicant cannot create employer',
  $q$SELECT app.fn_employer_create('Bad','x','y')$q$, 'E.RES.NOT_FOUND');
RESET ROLE;
