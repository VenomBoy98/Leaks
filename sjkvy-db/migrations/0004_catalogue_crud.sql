-- 0004_catalogue_crud.sql — administrative catalogue CRUD (the Phase-1 gap).
-- Adds SECURITY DEFINER functions for creating/curating: courses + versions, batches,
-- assessments, hostel inventory (blocks/rooms/beds), notices (+ audiences), employers,
-- and placement opportunities. NO new tables, NO new client grants, NO RLS changes:
-- every mutation is a definer function owned by sjkvy_def with a pinned search_path and
-- an explicit staff scope check (_req_staff), exactly like 0002/0003. Reads continue to
-- flow through the existing SELECT policies. Unique constraints (course.code,
-- batch(centre,code), etc.) provide dup-safety; no idempotency pair is needed for these
-- create ops (mirrors fn_create_self_application / fn_counsel_schedule).
--
-- Frozen migrations 0000–0003 are untouched. This file is additive and idempotent-safe
-- to (re)apply via CREATE OR REPLACE.

-- ===== courses (global catalogue: super_admin) =====
CREATE OR REPLACE FUNCTION app.fn_course_create(p_code text, p_name_en text, p_name_hi text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v_id uuid;
BEGIN  -- course.create (SAD only; courses are not centre-scoped)
  PERFORM app._req(coalesce(p_code,'')<>'' AND coalesce(p_name_en,'')<>'' AND coalesce(p_name_hi,'')<>'',
                   'code/name');
  IF NOT EXISTS (SELECT 1 FROM app.staff_memberships m WHERE m.profile_id=auth.uid()
     AND m.role_code='super_admin' AND m.is_active) THEN PERFORM app._nf(); END IF;
  INSERT INTO app.courses (code, name_en, name_hi) VALUES (p_code, p_name_en, p_name_hi)
  RETURNING id INTO v_id;
  PERFORM app.fn_audit('course.created','course', v_id, NULL, jsonb_build_object('code', p_code));
  RETURN jsonb_build_object('course_id', v_id);
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'E.CONFLICT.DUPLICATE';
END $$;

CREATE OR REPLACE FUNCTION app.fn_course_set_active(p_course uuid, p_active boolean)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
BEGIN  -- course.set_active (SAD)
  IF NOT EXISTS (SELECT 1 FROM app.staff_memberships m WHERE m.profile_id=auth.uid()
     AND m.role_code='super_admin' AND m.is_active) THEN PERFORM app._nf(); END IF;
  UPDATE app.courses SET is_active = p_active, updated_at = now() WHERE id = p_course;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  PERFORM app.fn_audit('course.set_active','course', p_course, NULL, jsonb_build_object('active', p_active));
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION app.fn_course_version_create(p_course uuid, p_version_no int,
  p_syllabus text, p_duration_weeks int) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v_id uuid;
BEGIN  -- course.add_version (SAD)
  PERFORM app._req(p_duration_weeks > 0, 'duration_weeks');
  IF NOT EXISTS (SELECT 1 FROM app.staff_memberships m WHERE m.profile_id=auth.uid()
     AND m.role_code='super_admin' AND m.is_active) THEN PERFORM app._nf(); END IF;
  IF NOT EXISTS (SELECT 1 FROM app.courses WHERE id = p_course) THEN PERFORM app._nf(); END IF;
  INSERT INTO app.course_versions (course_id, version_no, syllabus_summary, duration_weeks)
  VALUES (p_course, p_version_no, p_syllabus, p_duration_weeks) RETURNING id INTO v_id;
  PERFORM app.fn_audit('course.version_added','course', p_course, NULL,
    jsonb_build_object('version_id', v_id, 'version_no', p_version_no));
  RETURN jsonb_build_object('course_version_id', v_id);
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'E.CONFLICT.DUPLICATE';
END $$;

-- ===== batches (centre_admin at the batch centre) =====
CREATE OR REPLACE FUNCTION app.fn_batch_create(p_centre uuid, p_course_version uuid, p_code text,
  p_capacity int, p_start date, p_end date) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v_id uuid;
BEGIN  -- batch.create
  PERFORM app._req_staff(p_centre, ARRAY['centre_admin']);
  PERFORM app._req(p_capacity > 0, 'capacity');
  PERFORM app._req(p_end > p_start, 'end_date');
  IF NOT EXISTS (SELECT 1 FROM app.course_versions WHERE id = p_course_version) THEN PERFORM app._nf(); END IF;
  INSERT INTO app.batches (centre_id, course_version_id, code, capacity, start_date, end_date)
  VALUES (p_centre, p_course_version, p_code, p_capacity, p_start, p_end) RETURNING id INTO v_id;
  PERFORM app.fn_audit('batch.created','batch', v_id, NULL, jsonb_build_object('code', p_code));
  RETURN jsonb_build_object('batch_id', v_id, 'status', 'PLANNED');
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'E.CONFLICT.DUPLICATE';
END $$;

CREATE OR REPLACE FUNCTION app.fn_batch_update(p_batch uuid, p_fields jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE b app.batches%ROWTYPE;
BEGIN  -- batch.update (pre-RUNNING mutable fields only)
  SELECT * INTO b FROM app.batches WHERE id = p_batch FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  PERFORM app._req_staff(b.centre_id, ARRAY['centre_admin']);
  IF b.status NOT IN ('PLANNED','OPEN') THEN PERFORM app._inv(b.status,'PLANNED|OPEN'); END IF;
  UPDATE app.batches SET
    code       = coalesce(p_fields->>'code', code),
    capacity   = coalesce((p_fields->>'capacity')::int, capacity),
    start_date = coalesce((p_fields->>'start_date')::date, start_date),
    end_date   = coalesce((p_fields->>'end_date')::date, end_date),
    updated_at = now()
  WHERE id = b.id;
  PERFORM app._req((SELECT capacity FROM app.batches WHERE id=b.id) > 0, 'capacity');
  PERFORM app._req((SELECT end_date > start_date FROM app.batches WHERE id=b.id), 'end_date');
  PERFORM app.fn_audit('batch.updated','batch', b.id, NULL, NULL);
  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'E.CONFLICT.DUPLICATE';
END $$;

CREATE OR REPLACE FUNCTION app.fn_batch_set_status(p_batch uuid, p_status text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE b app.batches%ROWTYPE; v_ok boolean;
BEGIN  -- batch.set_status (guarded transitions)
  PERFORM app._req(p_status IN ('PLANNED','OPEN','RUNNING','COMPLETED','CANCELLED'), 'status');
  SELECT * INTO b FROM app.batches WHERE id = p_batch FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  PERFORM app._req_staff(b.centre_id, ARRAY['centre_admin']);
  -- allowed: PLANNED->OPEN|CANCELLED, OPEN->RUNNING|CANCELLED, RUNNING->COMPLETED
  v_ok := (b.status='PLANNED' AND p_status IN ('OPEN','CANCELLED'))
       OR (b.status='OPEN'    AND p_status IN ('RUNNING','CANCELLED'))
       OR (b.status='RUNNING' AND p_status = 'COMPLETED');
  IF NOT v_ok THEN PERFORM app._inv(b.status, p_status); END IF;
  UPDATE app.batches SET status = p_status, updated_at = now() WHERE id = b.id;
  PERFORM app.fn_audit('batch.status','batch', b.id, NULL, jsonb_build_object('status', p_status));
  PERFORM app.fn_outbox('batch.status_'||lower(p_status),'batch', b.id, '{}'::jsonb);
  RETURN jsonb_build_object('status', p_status);
END $$;

-- ===== assessments (centre_admin at the batch centre) =====
CREATE OR REPLACE FUNCTION app.fn_assessment_create(p_batch uuid, p_name text, p_max_marks int,
  p_held_on date) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v_centre uuid; v_id uuid;
BEGIN  -- assessment.create
  PERFORM app._req(coalesce(p_name,'')<>'' AND p_max_marks > 0, 'name/max_marks');
  SELECT centre_id INTO v_centre FROM app.batches WHERE id = p_batch;
  IF v_centre IS NULL THEN PERFORM app._nf(); END IF;
  PERFORM app._req_staff(v_centre, ARRAY['centre_admin']);
  INSERT INTO app.assessments (batch_id, name, max_marks, held_on)
  VALUES (p_batch, p_name, p_max_marks, p_held_on) RETURNING id INTO v_id;
  PERFORM app.fn_audit('assessment.created','assessment', v_id, NULL, jsonb_build_object('batch', p_batch));
  RETURN jsonb_build_object('assessment_id', v_id);
END $$;

-- ===== hostel inventory (hostel_manager or centre_admin at the centre) =====
CREATE OR REPLACE FUNCTION app.fn_hostel_block_create(p_centre uuid, p_name text, p_warden uuid)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v_id uuid;
BEGIN  -- hostel.block_create
  PERFORM app._req(coalesce(p_name,'')<>'', 'name');
  PERFORM app._req_staff(p_centre, ARRAY['hostel_manager','centre_admin']);
  IF p_warden IS NOT NULL AND NOT EXISTS (SELECT 1 FROM app.profiles WHERE id=p_warden)
  THEN PERFORM app._nf(); END IF;
  INSERT INTO app.hostel_blocks (centre_id, name, warden_profile_id)
  VALUES (p_centre, p_name, p_warden) RETURNING id INTO v_id;
  PERFORM app.fn_audit('hostel.block_created','hostel_block', v_id, NULL, NULL);
  RETURN jsonb_build_object('block_id', v_id);
END $$;

CREATE OR REPLACE FUNCTION app.fn_room_create(p_block uuid, p_room_no text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v_centre uuid; v_id uuid;
BEGIN  -- hostel.room_create
  PERFORM app._req(coalesce(p_room_no,'')<>'', 'room_no');
  SELECT centre_id INTO v_centre FROM app.hostel_blocks WHERE id = p_block;
  IF v_centre IS NULL THEN PERFORM app._nf(); END IF;
  PERFORM app._req_staff(v_centre, ARRAY['hostel_manager','centre_admin']);
  INSERT INTO app.rooms (block_id, room_no) VALUES (p_block, p_room_no) RETURNING id INTO v_id;
  PERFORM app.fn_audit('hostel.room_created','room', v_id, NULL, NULL);
  RETURN jsonb_build_object('room_id', v_id);
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'E.CONFLICT.DUPLICATE';
END $$;

CREATE OR REPLACE FUNCTION app.fn_bed_create(p_room uuid, p_bed_no text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v_centre uuid; v_id uuid;
BEGIN  -- hostel.bed_create (starts AVAILABLE per schema default)
  PERFORM app._req(coalesce(p_bed_no,'')<>'', 'bed_no');
  SELECT hb.centre_id INTO v_centre FROM app.rooms r JOIN app.hostel_blocks hb ON hb.id=r.block_id
  WHERE r.id = p_room;
  IF v_centre IS NULL THEN PERFORM app._nf(); END IF;
  PERFORM app._req_staff(v_centre, ARRAY['hostel_manager','centre_admin']);
  INSERT INTO app.beds (room_id, bed_no) VALUES (p_room, p_bed_no) RETURNING id INTO v_id;
  PERFORM app.fn_audit('hostel.bed_created','bed', v_id, NULL, NULL);
  RETURN jsonb_build_object('bed_id', v_id);
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'E.CONFLICT.DUPLICATE';
END $$;

-- ===== notices (+ audiences) (centre_admin at the notice centre) =====
CREATE OR REPLACE FUNCTION app.fn_notice_create(p_centre uuid, p_title_hi text, p_title_en text,
  p_body_hi text, p_body_en text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v_id uuid;
BEGIN  -- notice.create (DRAFT; publish via existing fn_notice_publish). Bilingual: the
       -- title/body columns are NOT NULL in both hi and en.
  PERFORM app._req(coalesce(p_title_en,'')<>'' AND coalesce(p_body_en,'')<>''
               AND coalesce(p_title_hi,'')<>'' AND coalesce(p_body_hi,'')<>'', 'title/body (hi+en)');
  PERFORM app._req_staff(p_centre, ARRAY['centre_admin']);
  INSERT INTO app.notices (centre_id, title_hi, title_en, body_hi, body_en)
  VALUES (p_centre, p_title_hi, p_title_en, p_body_hi, p_body_en) RETURNING id INTO v_id;
  PERFORM app.fn_audit('notice.created','notice', v_id, NULL, NULL);
  RETURN jsonb_build_object('notice_id', v_id, 'status', 'DRAFT');
END $$;

CREATE OR REPLACE FUNCTION app.fn_notice_add_audience(p_notice uuid, p_audience text, p_batch uuid)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE n app.notices%ROWTYPE; v_id uuid;
BEGIN  -- notice.add_audience (DRAFT only)
  PERFORM app._req(p_audience IN ('PUBLIC','APPLICANTS','STUDENTS','BATCH'), 'audience');
  SELECT * INTO n FROM app.notices WHERE id = p_notice FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  PERFORM app._req(n.centre_id IS NOT NULL, 'centre_id');
  PERFORM app._req_staff(n.centre_id, ARRAY['centre_admin']);
  IF n.status <> 'DRAFT' THEN PERFORM app._inv(n.status,'DRAFT'); END IF;
  IF p_audience = 'BATCH' THEN
    PERFORM app._req(p_batch IS NOT NULL, 'batch_id');
    IF NOT EXISTS (SELECT 1 FROM app.batches WHERE id=p_batch AND centre_id=n.centre_id)
    THEN PERFORM app._nf(); END IF;
  END IF;
  INSERT INTO app.notice_audiences (notice_id, audience, batch_id)
  VALUES (p_notice, p_audience, CASE WHEN p_audience='BATCH' THEN p_batch END) RETURNING id INTO v_id;
  PERFORM app.fn_audit('notice.audience_added','notice', p_notice, NULL,
    jsonb_build_object('audience', p_audience));
  RETURN jsonb_build_object('audience_id', v_id);
END $$;

-- ===== employers + placement opportunities (placement or centre_admin) =====
CREATE OR REPLACE FUNCTION app.fn_employer_create(p_name text, p_contact text, p_district text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v_id uuid;
BEGIN  -- employer.create (any placement/centre_admin staff; employers are not centre-scoped)
  PERFORM app._req(coalesce(p_name,'')<>'', 'name');
  IF NOT EXISTS (SELECT 1 FROM app.staff_memberships m WHERE m.profile_id=auth.uid()
     AND m.role_code IN ('placement','centre_admin') AND m.is_active) THEN PERFORM app._nf(); END IF;
  INSERT INTO app.employers (name, contact, district) VALUES (p_name, p_contact, p_district)
  RETURNING id INTO v_id;
  PERFORM app.fn_audit('employer.created','employer', v_id, NULL, NULL);
  RETURN jsonb_build_object('employer_id', v_id);
END $$;

CREATE OR REPLACE FUNCTION app.fn_opportunity_create(p_employer uuid, p_centre uuid, p_course uuid,
  p_title text, p_openings int, p_closes_on date) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v_id uuid;
BEGIN  -- opportunity.create (placement/centre_admin at the centre)
  PERFORM app._req(coalesce(p_title,'')<>'' AND p_openings > 0, 'title/openings');
  PERFORM app._req_staff(p_centre, ARRAY['placement','centre_admin']);
  IF NOT EXISTS (SELECT 1 FROM app.employers WHERE id = p_employer) THEN PERFORM app._nf(); END IF;
  IF p_course IS NOT NULL AND NOT EXISTS (SELECT 1 FROM app.courses WHERE id=p_course)
  THEN PERFORM app._nf(); END IF;
  INSERT INTO app.job_opportunities (employer_id, centre_id, course_id, title, openings, closes_on)
  VALUES (p_employer, p_centre, p_course, p_title, p_openings, p_closes_on) RETURNING id INTO v_id;
  PERFORM app.fn_audit('opportunity.created','job_opportunity', v_id, NULL, NULL);
  PERFORM app.fn_outbox('opportunity.created','job_opportunity', v_id, '{}'::jsonb);
  RETURN jsonb_build_object('opportunity_id', v_id);
END $$;

-- ===== ownership + execute grants (same discipline as 0003) =====
DO $$
DECLARE f record;
  fns text[] := ARRAY['fn_course_create','fn_course_set_active','fn_course_version_create',
    'fn_batch_create','fn_batch_update','fn_batch_set_status','fn_assessment_create',
    'fn_hostel_block_create','fn_room_create','fn_bed_create','fn_notice_create',
    'fn_notice_add_audience','fn_employer_create','fn_opportunity_create'];
BEGIN
  FOR f IN SELECT p.oid::regprocedure AS sig, p.proname AS nm
           FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
           WHERE n.nspname='app' AND p.proname = ANY(fns) LOOP
    EXECUTE format('ALTER FUNCTION %s OWNER TO sjkvy_def', f.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated, service_role', f.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f.sig);
  END LOOP;
END $$;
