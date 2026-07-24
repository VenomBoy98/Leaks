-- 0001_foundation.sql — security foundation (Batches 1–2 core)
-- Invariants: SEC-RLS-001, SEC-DEF-001, SEC-OWN-*, SEC-CTR-*, SEC-ASG-*, SEC-IMM-001, SEC-DW-001
-- Assumes Supabase-provided roles: anon, authenticated, service_role; auth.uid().
-- Rollback: policies/functions droppable individually; see report §P.

-- 1. definer owner
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='sjkvy_def') THEN
    CREATE ROLE sjkvy_def NOLOGIN BYPASSRLS;
  END IF;
END $$;
GRANT USAGE ON SCHEMA app TO authenticated, service_role, anon, sjkvy_def;
ALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE ALL ON TABLES FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA app FROM PUBLIC, anon, authenticated;

-- 2. core read helpers (INVOKER; no recursion: their base policies use auth.uid() directly)
CREATE OR REPLACE FUNCTION app.fn_profile_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = app, public, pg_temp AS
$$ SELECT p.id FROM app.profiles p WHERE p.id = auth.uid() AND p.is_active $$;

CREATE OR REPLACE FUNCTION app.fn_is_staff(p_centre uuid, p_roles text[]) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.staff_memberships m
   WHERE m.profile_id = auth.uid() AND m.centre_id = p_centre
     AND m.role_code = ANY(p_roles) AND m.is_active) $$;

CREATE OR REPLACE FUNCTION app.fn_staff_centres(p_roles text[]) RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = app, public, pg_temp AS
$$ SELECT m.centre_id FROM app.staff_memberships m
   WHERE m.profile_id = auth.uid() AND m.role_code = ANY(p_roles) AND m.is_active $$;

-- DEFINER helpers (recursion-safe by design; owner bypasses RLS)
CREATE OR REPLACE FUNCTION app.fn_owns_application(p_app uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.applications a JOIN app.applicants ap ON ap.id = a.applicant_id
   WHERE a.id = p_app AND ap.profile_id = auth.uid()) $$;

-- PHASE2-FIX(S1): was SECURITY INVOKER; as INVOKER it re-entered RLS on
-- verification_assignments from inside policies, creating a policy cycle
-- (applications -> verification_cases -> verification_assignments -> applications)
-- that PostgreSQL 16 aborts with "infinite recursion detected in policy".
-- DEFINER matches the fn_owns_application pattern; scope semantics unchanged.
CREATE OR REPLACE FUNCTION app.fn_is_assigned_checker(p_case uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.verification_assignments va
   WHERE va.case_id = p_case AND va.checker_profile_id = auth.uid() AND va.active) $$;

-- PHASE2-FIX(S1): DEFINER scope helpers. Runtime execution on PostgreSQL 16
-- (2026-07-11, first-ever run of this suite) proved the original SELECT policies
-- recursed: policies embedded raw cross-table EXISTS subqueries, so evaluating one
-- table's policy re-entered another RLS-protected table whose policy referenced the
-- first (applications<->verification_cases, students<->enrolments, ...). Every
-- cross-table predicate now lives in one of these SECURITY DEFINER helpers (owner
-- sjkvy_def bypasses RLS internally, so policy evaluation never re-enters RLS).
-- Each helper answers only "does the CALLING user (auth.uid()) stand in this exact
-- relationship to this row" — scopes are copied 1:1 from the original policies;
-- nothing is widened. Pattern precedent: fn_owns_application (unchanged, above).
CREATE OR REPLACE FUNCTION app.fn_app_staff(p_app uuid, p_roles text[]) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.applications a
   JOIN app.staff_memberships m ON m.centre_id = a.centre_id
   WHERE a.id = p_app AND m.profile_id = auth.uid()
     AND m.role_code = ANY(p_roles) AND m.is_active) $$;

CREATE OR REPLACE FUNCTION app.fn_checker_for_app(p_app uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.verification_cases vc
   JOIN app.verification_assignments va ON va.case_id = vc.id
   WHERE vc.application_id = p_app AND va.checker_profile_id = auth.uid() AND va.active) $$;

CREATE OR REPLACE FUNCTION app.fn_case_staff(p_case uuid, p_roles text[]) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.verification_cases vc
   JOIN app.applications a ON a.id = vc.application_id
   JOIN app.staff_memberships m ON m.centre_id = a.centre_id
   WHERE vc.id = p_case AND m.profile_id = auth.uid()
     AND m.role_code = ANY(p_roles) AND m.is_active) $$;

CREATE OR REPLACE FUNCTION app.fn_owns_case(p_case uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.verification_cases vc
   JOIN app.applications a ON a.id = vc.application_id
   JOIN app.applicants ap ON ap.id = a.applicant_id
   WHERE vc.id = p_case AND ap.profile_id = auth.uid()) $$;

CREATE OR REPLACE FUNCTION app.fn_appt_staff(p_appt uuid, p_roles text[]) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.counselling_appointments ca
   JOIN app.applications a ON a.id = ca.application_id
   JOIN app.staff_memberships m ON m.centre_id = a.centre_id
   WHERE ca.id = p_appt AND m.profile_id = auth.uid()
     AND m.role_code = ANY(p_roles) AND m.is_active) $$;

CREATE OR REPLACE FUNCTION app.fn_applicant_scope(p_applicant uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.applications a WHERE a.applicant_id = p_applicant
     AND ((a.assisting_operator_id = auth.uid() AND a.status = 'DRAFT')
       OR app.fn_app_staff(a.id, ARRAY['counsellor','centre_admin'])
       OR app.fn_checker_for_app(a.id))) $$;

CREATE OR REPLACE FUNCTION app.fn_owns_student(p_student uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.students st
   JOIN app.applicants ap ON ap.id = st.applicant_id
   WHERE st.id = p_student AND ap.profile_id = auth.uid()) $$;

CREATE OR REPLACE FUNCTION app.fn_student_staff(p_student uuid, p_roles text[]) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.enrolments e
   JOIN app.batches b ON b.id = e.batch_id
   JOIN app.staff_memberships m ON m.centre_id = b.centre_id
   WHERE e.student_id = p_student AND m.profile_id = auth.uid()
     AND m.role_code = ANY(p_roles) AND m.is_active) $$;

CREATE OR REPLACE FUNCTION app.fn_owns_enrolment(p_enrol uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.enrolments e
   JOIN app.students st ON st.id = e.student_id
   JOIN app.applicants ap ON ap.id = st.applicant_id
   WHERE e.id = p_enrol AND ap.profile_id = auth.uid()) $$;

CREATE OR REPLACE FUNCTION app.fn_enrol_staff(p_enrol uuid, p_roles text[]) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.enrolments e
   JOIN app.batches b ON b.id = e.batch_id
   JOIN app.staff_memberships m ON m.centre_id = b.centre_id
   WHERE e.id = p_enrol AND m.profile_id = auth.uid()
     AND m.role_code = ANY(p_roles) AND m.is_active) $$;

CREATE OR REPLACE FUNCTION app.fn_enrol_trainer(p_enrol uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.enrolments e
   JOIN app.class_sessions s ON s.batch_id = e.batch_id
   WHERE e.id = p_enrol AND s.trainer_profile_id = auth.uid()) $$;

CREATE OR REPLACE FUNCTION app.fn_batch_staff(p_batch uuid, p_roles text[]) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.batches b
   JOIN app.staff_memberships m ON m.centre_id = b.centre_id
   WHERE b.id = p_batch AND m.profile_id = auth.uid()
     AND m.role_code = ANY(p_roles) AND m.is_active) $$;

CREATE OR REPLACE FUNCTION app.fn_batch_trainer(p_batch uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.class_sessions s
   WHERE s.batch_id = p_batch AND s.trainer_profile_id = auth.uid()) $$;

CREATE OR REPLACE FUNCTION app.fn_student_in_batch(p_batch uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.enrolments e
   JOIN app.students st ON st.id = e.student_id
   JOIN app.applicants ap ON ap.id = st.applicant_id
   WHERE e.batch_id = p_batch AND ap.profile_id = auth.uid()) $$;

CREATE OR REPLACE FUNCTION app.fn_student_at_centre(p_centre uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.enrolments e
   JOIN app.batches b ON b.id = e.batch_id
   JOIN app.students st ON st.id = e.student_id
   JOIN app.applicants ap ON ap.id = st.applicant_id
   WHERE b.centre_id = p_centre AND ap.profile_id = auth.uid()) $$;

CREATE OR REPLACE FUNCTION app.fn_is_applicant() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.applicants ap WHERE ap.profile_id = auth.uid()) $$;

CREATE OR REPLACE FUNCTION app.fn_is_student() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.students st
   JOIN app.applicants ap ON ap.id = st.applicant_id WHERE ap.profile_id = auth.uid()) $$;

CREATE OR REPLACE FUNCTION app.fn_session_scope(p_session uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.class_sessions s
   LEFT JOIN app.batches b ON b.id = s.batch_id
   LEFT JOIN app.staff_memberships m ON m.centre_id = b.centre_id
        AND m.profile_id = auth.uid() AND m.role_code = 'centre_admin' AND m.is_active
   WHERE s.id = p_session AND (s.trainer_profile_id = auth.uid() OR m.id IS NOT NULL)) $$;

CREATE OR REPLACE FUNCTION app.fn_assessment_scope(p_assessment uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.assessments s WHERE s.id = p_assessment
     AND (app.fn_batch_staff(s.batch_id, ARRAY['centre_admin'])
       OR app.fn_batch_trainer(s.batch_id))) $$;

CREATE OR REPLACE FUNCTION app.fn_bed_staff(p_bed uuid, p_roles text[]) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.beds bd
   JOIN app.rooms r ON r.id = bd.room_id
   JOIN app.hostel_blocks hb ON hb.id = r.block_id
   JOIN app.staff_memberships m ON m.centre_id = hb.centre_id
   WHERE bd.id = p_bed AND m.profile_id = auth.uid()
     AND m.role_code = ANY(p_roles) AND m.is_active) $$;

CREATE OR REPLACE FUNCTION app.fn_event_staff(p_event uuid, p_roles text[]) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.events ev
   JOIN app.staff_memberships m ON m.centre_id = ev.centre_id
   WHERE ev.id = p_event AND m.profile_id = auth.uid()
     AND m.role_code = ANY(p_roles) AND m.is_active) $$;

CREATE OR REPLACE FUNCTION app.fn_owns_placement_profile(p_profile uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.placement_profiles pp
   JOIN app.students st ON st.id = pp.student_id
   JOIN app.applicants ap ON ap.id = st.applicant_id
   WHERE pp.id = p_profile AND ap.profile_id = auth.uid()) $$;

CREATE OR REPLACE FUNCTION app.fn_has_placement_profile() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.placement_profiles pp
   JOIN app.students st ON st.id = pp.student_id
   JOIN app.applicants ap ON ap.id = st.applicant_id
   WHERE ap.profile_id = auth.uid() AND pp.withdrawn_at IS NULL) $$;

CREATE OR REPLACE FUNCTION app.fn_opp_staff(p_opp uuid, p_roles text[]) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.job_opportunities o
   JOIN app.staff_memberships m ON m.centre_id = o.centre_id
   WHERE o.id = p_opp AND m.profile_id = auth.uid()
     AND m.role_code = ANY(p_roles) AND m.is_active) $$;

CREATE OR REPLACE FUNCTION app.fn_can_mark_attendance(p_session uuid, p_enrolment uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (
     SELECT 1 FROM app.class_sessions s
     JOIN app.enrolments e ON e.batch_id = s.batch_id
     JOIN app.batches b ON b.id = s.batch_id
     JOIN app.staff_memberships m ON m.profile_id = auth.uid()
          AND m.centre_id = b.centre_id AND m.role_code = 'trainer' AND m.is_active
     WHERE s.id = p_session AND e.id = p_enrolment
       AND s.trainer_profile_id = auth.uid() AND s.locked_at IS NULL
       AND e.status IN ('ENROLLED','ACTIVE')) $$;

-- 3. error/guard utilities (owner-internal)
CREATE OR REPLACE FUNCTION app._nf() RETURNS void LANGUAGE plpgsql AS
$$ BEGIN RAISE EXCEPTION 'E.RES.NOT_FOUND'; END $$;
CREATE OR REPLACE FUNCTION app._inv(p_from text, p_expected text) RETURNS void LANGUAGE plpgsql AS
$$ BEGIN RAISE EXCEPTION 'E.STATE.INVALID_TRANSITION'
   USING DETAIL = json_build_object('from',p_from,'expected',p_expected)::text; END $$;
CREATE OR REPLACE FUNCTION app._req(p_ok boolean, p_field text) RETURNS void LANGUAGE plpgsql AS
$$ BEGIN IF NOT coalesce(p_ok,false) THEN RAISE EXCEPTION 'E.VAL.FAILED'
   USING DETAIL = json_build_object('field',p_field,'rule','required')::text; END IF; END $$;
CREATE OR REPLACE FUNCTION app._req_staff(p_centre uuid, p_roles text[]) RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ BEGIN IF NOT EXISTS (SELECT 1 FROM app.staff_memberships m
     WHERE m.profile_id = auth.uid() AND m.centre_id = p_centre
       AND m.role_code = ANY(p_roles) AND m.is_active)
   THEN PERFORM app._nf(); END IF; END $$;

-- 4. config / util
CREATE OR REPLACE FUNCTION app.fn_config_int(p_key text) RETURNS int
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT (value #>> '{}')::int FROM app.system_settings WHERE key = p_key $$;
CREATE OR REPLACE FUNCTION app.fn_config_text(p_key text) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT value #>> '{}' FROM app.system_settings WHERE key = p_key $$;
CREATE OR REPLACE FUNCTION app.fn_random_code(p_len int) RETURNS text
LANGUAGE sql VOLATILE SET search_path = app, public, pg_temp AS
$$ SELECT upper(substr(encode(gen_random_bytes(24),'base64'), 1, p_len)) $$;
CREATE OR REPLACE FUNCTION app.fn_eligibility_eval(p_dob date, p_gender text, p_district text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.eligibility_rules r WHERE r.active
     AND date_part('year', age(p_dob)) BETWEEN r.min_age AND r.max_age
     AND p_gender = r.required_gender
     AND (r.district_whitelist IS NULL OR p_district = ANY(r.district_whitelist))) $$;

-- 5. audit / outbox / idempotency infrastructure (owner-internal writers)
CREATE OR REPLACE FUNCTION app.fn_audit(p_action text, p_ttype text, p_target uuid,
                                        p_reason text, p_summary jsonb) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
BEGIN
  INSERT INTO app.audit_events (actor_profile_id, actor_role_snapshot, action, target_type,
                                target_id, reason, summary)
  VALUES (auth.uid(),
          (SELECT string_agg(role_code || '@' || centre_id, ',')
             FROM app.staff_memberships WHERE profile_id = auth.uid() AND is_active),
          p_action, p_ttype, p_target, p_reason,
          CASE WHEN p_summary IS NULL THEN NULL
               ELSE (SELECT jsonb_object_agg(k, v) FROM jsonb_each(p_summary) AS e(k, v)
                     WHERE k !~* 'otp|aadhaar|password|secret|path|phone') END);
END $$;

CREATE OR REPLACE FUNCTION app.fn_outbox(p_type text, p_atype text, p_agg uuid, p_payload jsonb)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
BEGIN
  INSERT INTO app.domain_events (event_type, aggregate_type, aggregate_id, payload)
  VALUES (p_type, p_atype, p_agg, coalesce(p_payload,'{}'::jsonb) - 'phone' - 'dob' - 'storage_path');
END $$;

CREATE OR REPLACE FUNCTION app.fn_idem_begin(p_op text, p_key uuid, p_hash text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE r app.idempotency_keys%ROWTYPE;
BEGIN
  INSERT INTO app.idempotency_keys (op, actor, key, request_hash, expires_at)
  VALUES (p_op, auth.uid(), p_key, p_hash,
          now() + make_interval(hours => coalesce(app.fn_config_int('idem_ttl_hours'), 48)))
  ON CONFLICT (op, actor, key) DO NOTHING;
  SELECT * INTO r FROM app.idempotency_keys
   WHERE op = p_op AND actor = auth.uid() AND key = p_key FOR UPDATE;   -- serializes same-key
  IF r.request_hash <> p_hash THEN RAISE EXCEPTION 'E.CONFLICT.DUPLICATE'; END IF;
  IF r.status = 'DONE' THEN RETURN r.response || jsonb_build_object('replayed', true); END IF;
  RETURN NULL;   -- PENDING owned by this tx (crash ⇒ rollback removes/frees it)
END $$;
CREATE OR REPLACE FUNCTION app.fn_idem_finish(p_op text, p_key uuid, p_resp jsonb) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
BEGIN UPDATE app.idempotency_keys SET status='DONE', response=p_resp
      WHERE op=p_op AND actor=auth.uid() AND key=p_key; END $$;
CREATE OR REPLACE FUNCTION app.fn_idem_purge() RETURNS int
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ WITH d AS (DELETE FROM app.idempotency_keys WHERE expires_at < now() RETURNING 1)
   SELECT count(*)::int FROM d $$;

-- 6. immutability / append-only framework (SEC-IMM-001, SEC-AUDIT-001)
CREATE OR REPLACE FUNCTION app.fn_assert_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE col text;
BEGIN
  FOREACH col IN ARRAY TG_ARGV LOOP
    IF to_jsonb(NEW)->col IS DISTINCT FROM to_jsonb(OLD)->col THEN
      RAISE EXCEPTION 'E.VAL.FAILED'
        USING DETAIL = json_build_object('field', col, 'rule', 'immutable')::text;
    END IF;
  END LOOP;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION app.fn_raise_appendonly() RETURNS trigger LANGUAGE plpgsql AS
$$ BEGIN RAISE EXCEPTION 'E.AUTHZ.FORBIDDEN' USING DETAIL='append-only'; END $$;
CREATE OR REPLACE FUNCTION app.fn_stamp_marked_by() RETURNS trigger LANGUAGE plpgsql AS
$$ BEGIN NEW.marked_by := auth.uid(); RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION app.fn_guard_read_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.read_at IS NOT NULL AND NEW.read_at IS DISTINCT FROM OLD.read_at THEN
    RAISE EXCEPTION 'E.STATE.INVALID_TRANSITION' USING DETAIL='{"field":"read_at","rule":"set-once"}';
  END IF; RETURN NEW;
END $$;

CREATE TRIGGER tg_applications_imm BEFORE UPDATE ON app.applications FOR EACH ROW
  EXECUTE FUNCTION app.fn_assert_immutable('applicant_id','centre_id','created_channel',
    'created_by_profile_id' /* status/snapshot mutate only via definer fns which run as owner */);
CREATE TRIGGER tg_applicants_imm BEFORE UPDATE ON app.applicants FOR EACH ROW
  EXECUTE FUNCTION app.fn_assert_immutable('created_channel','created_by_profile_id');
CREATE TRIGGER tg_enrolments_imm BEFORE UPDATE ON app.enrolments FOR EACH ROW
  EXECUTE FUNCTION app.fn_assert_immutable('student_id','application_id');
CREATE TRIGGER tg_attendance_imm BEFORE UPDATE ON app.attendance FOR EACH ROW
  EXECUTE FUNCTION app.fn_assert_immutable('session_id','enrolment_id','marked_by');
CREATE TRIGGER tg_attendance_stamp BEFORE INSERT ON app.attendance FOR EACH ROW
  EXECUTE FUNCTION app.fn_stamp_marked_by();
CREATE TRIGGER tg_alloc_imm BEFORE UPDATE ON app.hostel_allocations FOR EACH ROW
  EXECUTE FUNCTION app.fn_assert_immutable('bed_id','enrolment_id','allocated_at');
CREATE TRIGGER tg_cert_imm BEFORE UPDATE ON app.certificates FOR EACH ROW
  EXECUTE FUNCTION app.fn_assert_immutable('enrolment_id','certificate_no','verify_code','supersedes_id');
CREATE TRIGGER tg_notif_imm BEFORE UPDATE ON app.notifications FOR EACH ROW
  EXECUTE FUNCTION app.fn_assert_immutable('event_id','recipient_profile_id','recipient_phone',
    'channel','template_key','params','dedupe_key','created_at');
CREATE TRIGGER tg_notif_read_once BEFORE UPDATE ON app.notifications FOR EACH ROW
  EXECUTE FUNCTION app.fn_guard_read_at();
CREATE TRIGGER tg_audit_appendonly BEFORE UPDATE OR DELETE ON app.audit_events FOR EACH ROW
  EXECUTE FUNCTION app.fn_raise_appendonly();

-- NOTE (status columns): definer functions run as sjkvy_def; the immutable-column triggers above fire
-- for ALL writers, so status columns are intentionally NOT in trigger lists — they are protected by
-- (a) absence of client UPDATE grants and (b) RLS. Verified in tests t01/t03.

-- 7. RLS ENABLE + FORCE everywhere (SEC-RLS-001)
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='app' LOOP
    EXECUTE format('ALTER TABLE app.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE app.%I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- 8. SELECT policies + grants (Plane A)
CREATE POLICY p_profiles_sel_own ON app.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY p_memb_sel ON app.staff_memberships FOR SELECT TO authenticated
  USING (profile_id = auth.uid()
     OR centre_id IN (SELECT app.fn_staff_centres(ARRAY['centre_admin','super_admin'])));
CREATE POLICY p_centres_sel ON app.centres FOR SELECT TO authenticated USING (is_active);
CREATE POLICY p_courses_sel ON app.courses FOR SELECT TO authenticated USING (is_active);
CREATE POLICY p_cversions_sel ON app.course_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY p_batches_sel ON app.batches FOR SELECT TO authenticated
  USING (status IN ('OPEN','RUNNING')
     OR centre_id IN (SELECT app.fn_staff_centres(ARRAY['operator','checker','counsellor','trainer',
                       'hostel_manager','placement','centre_admin','super_admin'])));
-- PHASE2-FIX(S1): all policies below this line that previously embedded raw
-- cross-table EXISTS subqueries now call the DEFINER scope helpers defined in §2.
-- Role lists and ownership semantics are copied verbatim from the originals.
CREATE POLICY p_applicants_sel ON app.applicants FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR app.fn_applicant_scope(id));
CREATE POLICY p_applications_sel ON app.applications FOR SELECT TO authenticated
  USING (app.fn_owns_application(id)
     OR (assisting_operator_id = auth.uid() AND status = 'DRAFT')
     OR app.fn_app_staff(id, ARRAY['counsellor','centre_admin'])
     OR app.fn_checker_for_app(id));
CREATE POLICY p_docs_sel ON app.applicant_documents FOR SELECT TO authenticated
  USING (app.fn_owns_application(application_id)
     OR app.fn_checker_for_app(application_id)
     OR app.fn_app_staff(application_id, ARRAY['counsellor','centre_admin']));
-- document_versions: NO client SELECT policy at all (SEC-DOC-001); metadata via view below.
CREATE POLICY p_vcases_sel ON app.verification_cases FOR SELECT TO authenticated
  USING (app.fn_owns_application(application_id) OR app.fn_is_assigned_checker(id)
     OR app.fn_app_staff(application_id, ARRAY['counsellor','centre_admin']));
CREATE POLICY p_vassign_sel ON app.verification_assignments FOR SELECT TO authenticated
  USING (checker_profile_id = auth.uid()
     OR app.fn_case_staff(case_id, ARRAY['centre_admin']));
CREATE POLICY p_vdec_sel ON app.verification_decisions FOR SELECT TO authenticated
  USING (app.fn_is_assigned_checker(case_id)
     OR app.fn_owns_case(case_id)
     OR app.fn_case_staff(case_id, ARRAY['centre_admin']));
CREATE POLICY p_corr_sel ON app.correction_requests FOR SELECT TO authenticated
  USING (app.fn_owns_case(case_id) OR app.fn_is_assigned_checker(case_id)
     OR app.fn_case_staff(case_id, ARRAY['centre_admin']));
CREATE POLICY p_counsel_sel ON app.counselling_appointments FOR SELECT TO authenticated
  USING (app.fn_owns_application(application_id)
     OR app.fn_app_staff(application_id, ARRAY['counsellor','centre_admin']));
CREATE POLICY p_coutcome_sel ON app.counselling_outcomes FOR SELECT TO authenticated
  USING (app.fn_appt_staff(appointment_id, ARRAY['counsellor','centre_admin']));
CREATE POLICY p_decision_sel ON app.admission_decisions FOR SELECT TO authenticated
  USING (app.fn_owns_application(application_id)
     OR app.fn_app_staff(application_id, ARRAY['counsellor','centre_admin']));
CREATE POLICY p_offers_sel ON app.admission_offers FOR SELECT TO authenticated
  USING (app.fn_owns_application(application_id)
     OR app.fn_app_staff(application_id, ARRAY['centre_admin']));
CREATE POLICY p_wl_sel ON app.waitlist_entries FOR SELECT TO authenticated
  USING (app.fn_owns_application(application_id)
     OR EXISTS (SELECT 1 FROM app.batches b WHERE b.id = waitlist_entries.batch_id
                AND app.fn_is_staff(b.centre_id, ARRAY['centre_admin'])));
CREATE POLICY p_students_sel ON app.students FOR SELECT TO authenticated
  USING (app.fn_owns_student(id)
     OR app.fn_student_staff(id, ARRAY['counsellor','centre_admin','trainer','placement']));
CREATE POLICY p_enrol_sel ON app.enrolments FOR SELECT TO authenticated
  USING (app.fn_owns_enrolment(id)
     OR app.fn_enrol_staff(id, ARRAY['centre_admin','counsellor','hostel_manager'])
     OR app.fn_enrol_trainer(id));
CREATE POLICY p_sessions_sel ON app.class_sessions FOR SELECT TO authenticated
  USING (trainer_profile_id = auth.uid()
     OR app.fn_batch_staff(batch_id, ARRAY['centre_admin'])
     OR app.fn_student_in_batch(batch_id));
CREATE POLICY p_att_sel ON app.attendance FOR SELECT TO authenticated
  USING (app.fn_owns_enrolment(enrolment_id)
     OR app.fn_session_scope(session_id));
CREATE POLICY p_ares_sel ON app.assessment_results FOR SELECT TO authenticated
  USING (app.fn_owns_enrolment(enrolment_id)
     OR app.fn_assessment_scope(assessment_id));
CREATE POLICY p_assess_sel ON app.assessments FOR SELECT TO authenticated
  USING (app.fn_batch_staff(batch_id, ARRAY['centre_admin'])
     OR app.fn_batch_trainer(batch_id)
     OR app.fn_student_in_batch(batch_id));
CREATE POLICY p_cert_sel ON app.certificates FOR SELECT TO authenticated
  USING (app.fn_owns_enrolment(enrolment_id)
     OR app.fn_enrol_staff(enrolment_id, ARRAY['centre_admin']));
CREATE POLICY p_hblocks_sel ON app.hostel_blocks FOR SELECT TO authenticated
  USING (app.fn_is_staff(centre_id, ARRAY['hostel_manager','centre_admin']));
CREATE POLICY p_rooms_sel ON app.rooms FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM app.hostel_blocks hb WHERE hb.id = rooms.block_id
                 AND app.fn_is_staff(hb.centre_id, ARRAY['hostel_manager','centre_admin'])));
CREATE POLICY p_beds_sel ON app.beds FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM app.rooms r JOIN app.hostel_blocks hb ON hb.id=r.block_id
                 WHERE r.id = beds.room_id
                   AND app.fn_is_staff(hb.centre_id, ARRAY['hostel_manager','centre_admin'])));
CREATE POLICY p_hreq_sel ON app.hostel_requests FOR SELECT TO authenticated
  USING (app.fn_owns_enrolment(enrolment_id)
     OR app.fn_enrol_staff(enrolment_id, ARRAY['hostel_manager','centre_admin']));
CREATE POLICY p_halloc_sel ON app.hostel_allocations FOR SELECT TO authenticated
  USING (app.fn_owns_enrolment(enrolment_id)
     OR app.fn_bed_staff(bed_id, ARRAY['hostel_manager','centre_admin']));
CREATE POLICY p_notices_sel ON app.notices FOR SELECT TO authenticated
  USING (status = 'PUBLISHED' AND EXISTS (SELECT 1 FROM app.notice_audiences na
         WHERE na.notice_id = notices.id AND (na.audience = 'PUBLIC'
           OR (na.audience = 'APPLICANTS' AND app.fn_is_applicant())
           OR (na.audience = 'STUDENTS' AND app.fn_is_student())
           OR (na.audience = 'BATCH' AND app.fn_student_in_batch(na.batch_id))))
     OR (centre_id IS NOT NULL AND app.fn_is_staff(centre_id, ARRAY['centre_admin'])));
CREATE POLICY p_naud_sel ON app.notice_audiences FOR SELECT TO authenticated USING (true);
CREATE POLICY p_events_sel ON app.events FOR SELECT TO authenticated
  USING (app.fn_is_staff(centre_id, ARRAY['centre_admin'])
     OR app.fn_student_at_centre(centre_id));
CREATE POLICY p_epart_sel ON app.event_participation FOR SELECT TO authenticated
  USING (app.fn_owns_enrolment(enrolment_id)
     OR app.fn_event_staff(event_id, ARRAY['centre_admin']));
CREATE POLICY p_pprof_sel ON app.placement_profiles FOR SELECT TO authenticated
  USING (withdrawn_at IS NULL AND (
         app.fn_owns_student(student_id)
      OR app.fn_student_staff(student_id, ARRAY['placement','centre_admin'])));
CREATE POLICY p_emp_sel ON app.employers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM app.staff_memberships m WHERE m.profile_id=auth.uid()
                 AND m.role_code IN ('placement','centre_admin') AND m.is_active));
CREATE POLICY p_opp_sel ON app.job_opportunities FOR SELECT TO authenticated
  USING (app.fn_is_staff(centre_id, ARRAY['placement','centre_admin'])
     OR app.fn_has_placement_profile());
CREATE POLICY p_ref_sel ON app.placement_referrals FOR SELECT TO authenticated
  USING (app.fn_owns_placement_profile(placement_profile_id)
     OR app.fn_opp_staff(opportunity_id, ARRAY['placement','centre_admin']));
CREATE POLICY p_pout_sel ON app.placement_outcomes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM app.placement_referrals r WHERE r.id = placement_outcomes.referral_id));
CREATE POLICY p_notif_sel ON app.notifications FOR SELECT TO authenticated
  USING (recipient_profile_id = auth.uid());
CREATE POLICY p_export_sel ON app.export_jobs FOR SELECT TO authenticated USING (actor = auth.uid());

GRANT SELECT ON app.profiles, app.staff_memberships, app.centres, app.courses, app.course_versions,
 app.batches, app.applicants, app.applications, app.applicant_documents, app.verification_cases,
 app.verification_assignments, app.verification_decisions, app.correction_requests,
 app.counselling_appointments, app.counselling_outcomes, app.admission_decisions, app.admission_offers,
 app.waitlist_entries, app.students, app.enrolments, app.class_sessions, app.attendance,
 app.assessments, app.assessment_results, app.certificates, app.hostel_blocks, app.rooms, app.beds,
 app.hostel_requests, app.hostel_allocations, app.notices, app.notice_audiences, app.events,
 app.event_participation, app.placement_profiles, app.employers, app.job_opportunities,
 app.placement_referrals, app.placement_outcomes, app.notifications, app.export_jobs
TO authenticated;

-- 9. narrow direct writes (SEC-DW-001)
CREATE POLICY p_profiles_upd_own ON app.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
GRANT UPDATE (full_name, preferred_lang) ON app.profiles TO authenticated;

CREATE POLICY p_applications_upd_draft ON app.applications FOR UPDATE TO authenticated
  USING ((app.fn_owns_application(id) OR assisting_operator_id = auth.uid()) AND status = 'DRAFT')
  WITH CHECK ((app.fn_owns_application(id) OR assisting_operator_id = auth.uid()) AND status = 'DRAFT');
GRANT UPDATE (qualification, passing_year, course_id, hostel_required) ON app.applications TO authenticated;

CREATE POLICY p_att_ins_trainer ON app.attendance FOR INSERT TO authenticated
  WITH CHECK (app.fn_can_mark_attendance(session_id, enrolment_id));
CREATE POLICY p_att_upd_trainer ON app.attendance FOR UPDATE TO authenticated
  USING (app.fn_can_mark_attendance(session_id, enrolment_id))
  WITH CHECK (app.fn_can_mark_attendance(session_id, enrolment_id));
GRANT INSERT (session_id, enrolment_id, present), UPDATE (present) ON app.attendance TO authenticated;

CREATE POLICY p_sessions_ins_trainer ON app.class_sessions FOR INSERT TO authenticated
  WITH CHECK (trainer_profile_id = auth.uid() AND session_date >= current_date
    AND EXISTS (SELECT 1 FROM app.batches b WHERE b.id = batch_id
                AND app.fn_is_staff(b.centre_id, ARRAY['trainer'])));
GRANT INSERT (batch_id, session_date, kind, slot, topic, trainer_profile_id) ON app.class_sessions TO authenticated;

CREATE POLICY p_ares_ins_trainer ON app.assessment_results FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM app.assessments s
     JOIN app.class_sessions cs ON cs.batch_id = s.batch_id AND cs.trainer_profile_id = auth.uid()
     JOIN app.enrolments e ON e.id = enrolment_id AND e.batch_id = s.batch_id
     WHERE s.id = assessment_id AND s.finalized_at IS NULL));
GRANT INSERT (assessment_id, enrolment_id, marks, result) ON app.assessment_results TO authenticated;

CREATE POLICY p_notif_upd_read ON app.notifications FOR UPDATE TO authenticated
  USING (recipient_profile_id = auth.uid())
  WITH CHECK (recipient_profile_id = auth.uid() AND read_at IS NOT NULL);
GRANT UPDATE (read_at) ON app.notifications TO authenticated;

-- 10. views (invoker; path-less documents; public catalog exception is definer-owned + column-limited)
-- PHASE2-FIX(S1): was security_invoker=true, which required the caller to hold
-- SELECT on document_versions — a grant that deliberately does not exist
-- (SEC-DOC-001), so the view could never return version metadata to any client.
-- Now definer-owned (same pattern as v_public_catalog) with the p_docs_sel scope
-- embedded in the view itself. storage_path is still never projected anywhere.
CREATE VIEW app.v_my_documents AS
  SELECT d.id, d.application_id, d.document_type_code, d.status,
         v.version_no, v.scan_status, v.created_at AS uploaded_at
  FROM app.applicant_documents d
  LEFT JOIN app.document_versions v ON v.id = d.current_version_id
  WHERE app.fn_owns_application(d.application_id)
     OR app.fn_checker_for_app(d.application_id)
     OR app.fn_app_staff(d.application_id, ARRAY['counsellor','centre_admin']);
ALTER VIEW app.v_my_documents OWNER TO sjkvy_def;
GRANT SELECT ON app.v_my_documents TO authenticated;
CREATE VIEW app.v_public_catalog AS   -- definer-owned exception: anon catalog, no sensitive columns
  SELECT c.id, c.code, c.name_en, c.name_hi FROM app.courses c WHERE c.is_active;
ALTER VIEW app.v_public_catalog OWNER TO sjkvy_def;
GRANT SELECT ON app.v_public_catalog TO anon, authenticated;
CREATE VIEW app.v_audit_centre WITH (security_invoker = false) AS
  SELECT ae.* , (SELECT a.centre_id FROM app.applications a WHERE a.id = ae.target_id) AS centre_hint
  FROM app.audit_events ae;
ALTER VIEW app.v_audit_centre OWNER TO sjkvy_def;
REVOKE ALL ON app.v_audit_centre FROM PUBLIC, authenticated;  -- exposed via fn_audit_query only
