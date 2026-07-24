-- 0003_functions_remaining.sql — full transition-function catalogue completion + execute grants
-- Every function: SECURITY DEFINER, owner sjkvy_def (set in DO block), pinned search_path,
-- non-leak scope checks, from-state under lock, audit+outbox in-tx. API opIds in comments.

-- ===== application / assisted (D-ops) =====
CREATE OR REPLACE FUNCTION app.fn_create_self_application(p_course uuid, p_dob date, p_gender text,
  p_district text, p_block text, p_address text, p_qualification text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE pr app.profiles%ROWTYPE; v_ap uuid; v_app uuid; v_centre uuid;
BEGIN  -- application.create_self
  SELECT * INTO pr FROM app.profiles WHERE id = auth.uid() AND is_active;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  v_centre := (SELECT (value #>> '{}')::uuid FROM app.system_settings WHERE key='default_centre_id');
  PERFORM app._req(v_centre IS NOT NULL, 'config:default_centre_id');
  SELECT id INTO v_ap FROM app.applicants WHERE profile_id = pr.id;
  IF v_ap IS NULL THEN
    INSERT INTO app.applicants (profile_id, full_name, phone, dob, gender, district, block, address, created_channel)
    VALUES (pr.id, pr.full_name, pr.phone, p_dob, p_gender, p_district, p_block, p_address, 'SELF')
    RETURNING id INTO v_ap;
  END IF;
  INSERT INTO app.applications (applicant_id, centre_id, course_id, qualification)
  VALUES (v_ap, v_centre, p_course, p_qualification) RETURNING id INTO v_app;  -- ux_applications_active guards dup
  PERFORM app.fn_audit('application.created','application', v_app, NULL, NULL);
  RETURN jsonb_build_object('application_id', v_app, 'applicant_id', v_ap, 'status','DRAFT');
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'E.CONFLICT.ALREADY_ACTIVE';
END $$;

CREATE OR REPLACE FUNCTION app.fn_create_assisted_application(p_centre uuid, p_course uuid,
  p_full_name text, p_phone text, p_dob date, p_gender text, p_district text, p_block text,
  p_address text, p_guardian text, p_guardian_phone text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v_ap uuid; v_app uuid;
BEGIN  -- application.create_assisted (SEC-ASG-003)
  PERFORM app._req_staff(p_centre, ARRAY['operator']);
  INSERT INTO app.applicants (full_name, phone, dob, gender, district, block, address,
    guardian_name, guardian_phone, created_channel, created_by_profile_id)
  VALUES (p_full_name, p_phone, p_dob, p_gender, p_district, p_block, p_address,
    p_guardian, p_guardian_phone, 'ASSISTED', auth.uid()) RETURNING id INTO v_ap;
  INSERT INTO app.applications (applicant_id, centre_id, course_id, assisting_operator_id)
  VALUES (v_ap, p_centre, p_course, auth.uid()) RETURNING id INTO v_app;
  PERFORM app.fn_audit('application.created_assisted','application', v_app, NULL, NULL);
  PERFORM app.fn_outbox('application.assisted_created','applicant', v_ap, '{}'::jsonb);
  RETURN jsonb_build_object('application_id', v_app, 'applicant_id', v_ap,
    'eligibility_preview', app.fn_eligibility_eval(p_dob, p_gender, p_district));
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'E.CONFLICT.DUPLICATE';
END $$;

CREATE OR REPLACE FUNCTION app.fn_save_draft(p_app uuid, p_fields jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE a app.applications%ROWTYPE; ap app.applicants%ROWTYPE;
BEGIN  -- application.save_draft (canonical; [DW] whitelist mirrors this)
  SELECT * INTO a FROM app.applications WHERE id = p_app FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  SELECT * INTO ap FROM app.applicants WHERE id = a.applicant_id;
  IF NOT (ap.profile_id = auth.uid() OR a.assisting_operator_id = auth.uid()) THEN PERFORM app._nf(); END IF;
  IF a.status <> 'DRAFT' THEN PERFORM app._inv(a.status,'DRAFT'); END IF;
  UPDATE app.applications SET
    course_id      = coalesce((p_fields->>'course_id')::uuid, course_id),
    hostel_required= coalesce((p_fields->>'hostel_required')::boolean, hostel_required),
    qualification  = coalesce(p_fields->>'qualification', qualification),
    passing_year   = coalesce((p_fields->>'passing_year')::int, passing_year),
    updated_at = now() WHERE id = a.id;
  UPDATE app.applicants SET
    dob      = coalesce((p_fields->>'dob')::date, dob),
    district = coalesce(p_fields->>'district', district),
    block    = coalesce(p_fields->>'block', block),
    address  = coalesce(p_fields->>'address', address),
    guardian_name  = coalesce(p_fields->>'guardian_name', guardian_name),
    guardian_phone = coalesce(p_fields->>'guardian_phone', guardian_phone),
    aadhaar_last4  = coalesce(p_fields->>'aadhaar_last4', aadhaar_last4),
    updated_at = now() WHERE id = ap.id;
  RETURN jsonb_build_object('saved', true, 'eligibility_preview',
    app.fn_eligibility_eval(coalesce((p_fields->>'dob')::date, ap.dob), ap.gender,
                            coalesce(p_fields->>'district', ap.district)));
END $$;

CREATE OR REPLACE FUNCTION app.fn_withdraw_application(p_app uuid, p_reason text, p_idem uuid, p_hash text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v jsonb; a app.applications%ROWTYPE; v_res jsonb;
BEGIN  -- application.withdraw (cascade order: app → case → appt → offer → waitlist)
  v := app.fn_idem_begin('application.withdraw', p_idem, p_hash);
  IF v IS NOT NULL THEN RETURN v; END IF;
  SELECT * INTO a FROM app.applications WHERE id = p_app FOR UPDATE;
  IF NOT FOUND OR NOT app.fn_owns_application(a.id) THEN PERFORM app._nf(); END IF;
  IF a.status NOT IN ('DRAFT','SUBMITTED','IN_PROCESS') THEN PERFORM app._inv(a.status,'pre-decision'); END IF;
  UPDATE app.applications SET status='WITHDRAWN', withdrawn_at=now(), updated_at=now() WHERE id=a.id;
  UPDATE app.verification_cases SET status='FAILED', updated_at=now()
   WHERE application_id=a.id AND status NOT IN ('VERIFIED','FAILED');
  UPDATE app.counselling_appointments SET status='CANCELLED', updated_at=now()
   WHERE application_id=a.id AND status IN ('SCHEDULED','RESCHEDULED');
  UPDATE app.admission_offers SET status='DECLINED', updated_at=now()
   WHERE application_id=a.id AND status='SENT';
  UPDATE app.waitlist_entries SET status='WITHDRAWN', updated_at=now()
   WHERE application_id=a.id AND status='ACTIVE';
  PERFORM app.fn_audit('application.withdrawn','application', a.id, p_reason, NULL);
  PERFORM app.fn_outbox('application.withdrawn','application', a.id, '{}'::jsonb);
  v_res := jsonb_build_object('status','WITHDRAWN');
  PERFORM app.fn_idem_finish('application.withdraw', p_idem, v_res);
  RETURN v_res;
END $$;

CREATE OR REPLACE FUNCTION app.fn_reassign_assistance(p_app uuid, p_new_operator uuid, p_reason text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE a app.applications%ROWTYPE;
BEGIN  -- admission.reassign_assistance (S-1 handoff)
  PERFORM app._req(coalesce(p_reason,'')<>'','reason');
  SELECT * INTO a FROM app.applications WHERE id = p_app FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  PERFORM app._req_staff(a.centre_id, ARRAY['centre_admin']);
  IF a.status <> 'DRAFT' THEN PERFORM app._inv(a.status,'DRAFT'); END IF;
  IF NOT EXISTS (SELECT 1 FROM app.staff_memberships m WHERE m.profile_id=p_new_operator
     AND m.centre_id=a.centre_id AND m.role_code='operator' AND m.is_active) THEN PERFORM app._nf(); END IF;
  UPDATE app.applications SET assisting_operator_id = p_new_operator, updated_at=now() WHERE id=a.id;
  PERFORM app.fn_audit('assistance.reassigned','application', a.id, p_reason,
    jsonb_build_object('to', p_new_operator));
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION app.fn_apply_phone_change(p_caller uuid, p_new_phone text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
BEGIN  -- profile.confirm_phone_change ([SYS]: EF verifies dual OTP first)
  UPDATE app.profiles SET phone = p_new_phone, updated_at=now() WHERE id = p_caller;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  UPDATE app.applicants SET phone = p_new_phone, updated_at=now() WHERE profile_id = p_caller;
  INSERT INTO app.audit_events (actor_profile_id, action, target_type, target_id)
  VALUES (p_caller, 'profile.phone_changed', 'profile', p_caller);
  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'E.CONFLICT.DUPLICATE';
END $$;

-- ===== verification (B-ops) =====
CREATE OR REPLACE FUNCTION app.fn_assign_checker(p_case uuid, p_checker uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE vc app.verification_cases%ROWTYPE; v_centre uuid;
BEGIN  -- verify.assign
  SELECT * INTO vc FROM app.verification_cases WHERE id = p_case FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  SELECT centre_id INTO v_centre FROM app.applications WHERE id = vc.application_id;
  PERFORM app._req_staff(v_centre, ARRAY['centre_admin']);
  IF vc.status <> 'PENDING_ASSIGNMENT' THEN PERFORM app._inv(vc.status,'PENDING_ASSIGNMENT'); END IF;
  IF NOT EXISTS (SELECT 1 FROM app.staff_memberships m WHERE m.profile_id=p_checker
     AND m.centre_id=v_centre AND m.role_code='checker' AND m.is_active) THEN PERFORM app._nf(); END IF;
  INSERT INTO app.verification_assignments (case_id, checker_profile_id, assigned_by)
  VALUES (p_case, p_checker, auth.uid());
  UPDATE app.verification_cases SET status='IN_REVIEW', updated_at=now() WHERE id=p_case;
  UPDATE app.applications SET status='IN_PROCESS', updated_at=now()
   WHERE id=vc.application_id AND status='SUBMITTED';
  PERFORM app.fn_audit('verification.assigned','verification_case', p_case, NULL,
    jsonb_build_object('checker', p_checker));
  PERFORM app.fn_outbox('verification.assigned','verification_case', p_case, '{}'::jsonb);
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION app.fn_reassign_checker(p_case uuid, p_checker uuid, p_reason text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE vc app.verification_cases%ROWTYPE; v_centre uuid;
BEGIN  -- verify.reassign (K-5 basis)
  PERFORM app._req(coalesce(p_reason,'')<>'','reason');
  SELECT * INTO vc FROM app.verification_cases WHERE id = p_case FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  SELECT centre_id INTO v_centre FROM app.applications WHERE id = vc.application_id;
  PERFORM app._req_staff(v_centre, ARRAY['centre_admin']);
  UPDATE app.verification_assignments SET active=false, reassign_reason=p_reason
   WHERE case_id=p_case AND active;
  INSERT INTO app.verification_assignments (case_id, checker_profile_id, assigned_by)
  VALUES (p_case, p_checker, auth.uid());
  PERFORM app.fn_audit('verification.reassigned','verification_case', p_case, p_reason,
    jsonb_build_object('checker', p_checker));
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION app.fn_decide_document(p_case uuid, p_version uuid, p_decision text, p_reason text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE vc app.verification_cases%ROWTYPE; v_doc uuid; v_app uuid; v_done boolean;
BEGIN  -- verify.decide_document (in-tx active-assignee recheck, SEC-ASG-001)
  PERFORM app._req(p_decision IN ('ACCEPT','REJECT'),'decision');
  IF p_decision='REJECT' THEN PERFORM app._req(coalesce(p_reason,'')<>'','reason'); END IF;
  SELECT * INTO vc FROM app.verification_cases WHERE id = p_case FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  IF NOT EXISTS (SELECT 1 FROM app.verification_assignments va
     WHERE va.case_id=p_case AND va.checker_profile_id=auth.uid() AND va.active)
  THEN RAISE EXCEPTION 'E.AUTHZ.FORBIDDEN'; END IF;                       -- stale checker (case known)
  IF vc.status NOT IN ('IN_REVIEW','RESUBMITTED') THEN PERFORM app._inv(vc.status,'IN_REVIEW'); END IF;
  SELECT dv.document_id INTO v_doc FROM app.document_versions dv WHERE dv.id = p_version;
  IF v_doc IS NULL THEN PERFORM app._nf(); END IF;
  INSERT INTO app.verification_decisions (case_id, document_version_id, decision, reason, decided_by)
  VALUES (p_case, p_version, p_decision, p_reason, auth.uid());
  UPDATE app.applicant_documents SET status = CASE p_decision WHEN 'ACCEPT' THEN 'ACCEPTED' ELSE 'REJECTED' END,
    updated_at=now() WHERE id = v_doc;
  v_app := vc.application_id;
  SELECT NOT EXISTS (SELECT 1 FROM app.document_requirements dr
    JOIN app.applications a ON a.id = v_app
    WHERE dr.stage='APPLICATION' AND dr.is_required
      AND (dr.course_id IS NULL OR dr.course_id = a.course_id)
      AND NOT EXISTS (SELECT 1 FROM app.applicant_documents d WHERE d.application_id=v_app
                      AND d.document_type_code=dr.document_type_code AND d.status='ACCEPTED'))
  INTO v_done;
  IF v_done THEN
    UPDATE app.verification_cases SET status='VERIFIED', updated_at=now() WHERE id=p_case;
    PERFORM app.fn_outbox('verification.completed','application', v_app, '{}'::jsonb);
  END IF;
  PERFORM app.fn_audit('verification.decision','document', v_doc, p_reason,
    jsonb_build_object('decision', p_decision));
  RETURN jsonb_build_object('decision', p_decision, 'case_verified', v_done);
END $$;

CREATE OR REPLACE FUNCTION app.fn_request_correction(p_case uuid, p_items jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE vc app.verification_cases%ROWTYPE; it jsonb;
BEGIN  -- verify.request_correction
  SELECT * INTO vc FROM app.verification_cases WHERE id = p_case FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  IF NOT EXISTS (SELECT 1 FROM app.verification_assignments va
     WHERE va.case_id=p_case AND va.checker_profile_id=auth.uid() AND va.active)
  THEN RAISE EXCEPTION 'E.AUTHZ.FORBIDDEN'; END IF;
  IF vc.status NOT IN ('IN_REVIEW','RESUBMITTED') THEN PERFORM app._inv(vc.status,'IN_REVIEW'); END IF;
  PERFORM app._req(jsonb_array_length(coalesce(p_items,'[]'::jsonb)) > 0, 'items');
  FOR it IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO app.correction_requests (case_id, document_id, message)
    VALUES (p_case, (it->>'document_id')::uuid, it->>'message');
  END LOOP;
  UPDATE app.verification_cases SET status='CORRECTION_REQUESTED', updated_at=now() WHERE id=p_case;
  PERFORM app.fn_audit('verification.correction_requested','verification_case', p_case, NULL, NULL);
  PERFORM app.fn_outbox('verification.correction_requested','application', vc.application_id, '{}'::jsonb);
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION app.fn_resubmit_corrections(p_app uuid, p_idem uuid, p_hash text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v jsonb; vc app.verification_cases%ROWTYPE; v_open int; v_res jsonb;
BEGIN  -- application.resubmit_corrections (partial-aware, J-3)
  v := app.fn_idem_begin('application.resubmit', p_idem, p_hash);
  IF v IS NOT NULL THEN RETURN v; END IF;
  IF NOT app.fn_owns_application(p_app) THEN PERFORM app._nf(); END IF;
  SELECT * INTO vc FROM app.verification_cases WHERE application_id = p_app FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  IF vc.status <> 'CORRECTION_REQUESTED' THEN PERFORM app._inv(vc.status,'CORRECTION_REQUESTED'); END IF;
  UPDATE app.correction_requests cr SET resolved_at = now()
  WHERE cr.case_id = vc.id AND cr.resolved_at IS NULL
    AND EXISTS (SELECT 1 FROM app.document_versions dv
                WHERE dv.document_id = cr.document_id AND dv.created_at > cr.created_at);
  SELECT count(*) INTO v_open FROM app.correction_requests
   WHERE case_id = vc.id AND resolved_at IS NULL;
  IF v_open = 0 THEN
    UPDATE app.verification_cases SET status='RESUBMITTED', updated_at=now() WHERE id=vc.id;
    PERFORM app.fn_outbox('verification.resubmitted','application', p_app, '{}'::jsonb);
  END IF;
  PERFORM app.fn_audit('verification.resubmitted','application', p_app, NULL,
    jsonb_build_object('open_items', v_open));
  v_res := jsonb_build_object('open_items', v_open);
  PERFORM app.fn_idem_finish('application.resubmit', p_idem, v_res);
  RETURN v_res;
END $$;

CREATE OR REPLACE FUNCTION app.fn_fail_verification(p_case uuid, p_reason text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE vc app.verification_cases%ROWTYPE;
BEGIN  -- verify.fail
  PERFORM app._req(coalesce(p_reason,'')<>'','reason');
  SELECT * INTO vc FROM app.verification_cases WHERE id = p_case FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  IF NOT EXISTS (SELECT 1 FROM app.verification_assignments va
     WHERE va.case_id=p_case AND va.checker_profile_id=auth.uid() AND va.active)
  THEN RAISE EXCEPTION 'E.AUTHZ.FORBIDDEN'; END IF;
  IF vc.status IN ('VERIFIED','FAILED') THEN PERFORM app._inv(vc.status,'open'); END IF;
  UPDATE app.verification_cases SET status='FAILED', updated_at=now() WHERE id=p_case;
  PERFORM app.fn_audit('verification.failed','verification_case', p_case, p_reason, NULL);
  RETURN jsonb_build_object('ok', true);
END $$;

-- ===== counselling (C-ops) =====
CREATE OR REPLACE FUNCTION app.fn_counsel_schedule(p_app uuid, p_at timestamptz) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE a app.applications%ROWTYPE; v_id uuid;
BEGIN  -- counsel.schedule
  SELECT * INTO a FROM app.applications WHERE id = p_app FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  PERFORM app._req_staff(a.centre_id, ARRAY['counsellor','centre_admin']);
  IF NOT EXISTS (SELECT 1 FROM app.verification_cases vc WHERE vc.application_id=a.id AND vc.status='VERIFIED')
  THEN PERFORM app._inv('UNVERIFIED','VERIFIED'); END IF;
  INSERT INTO app.counselling_appointments (application_id, scheduled_at)
  VALUES (a.id, p_at) RETURNING id INTO v_id;
  PERFORM app.fn_audit('counselling.scheduled','application', a.id, NULL, NULL);
  PERFORM app.fn_outbox('counselling.scheduled','application', a.id,
    jsonb_build_object('at', p_at));
  RETURN jsonb_build_object('appointment_id', v_id);
END $$;

CREATE OR REPLACE FUNCTION app.fn_counsel_reschedule(p_appt uuid, p_at timestamptz, p_reason text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE ca app.counselling_appointments%ROWTYPE; v_centre uuid; v_max int;
BEGIN  -- counsel.reschedule (config counter)
  PERFORM app._req(coalesce(p_reason,'')<>'','reason');
  SELECT * INTO ca FROM app.counselling_appointments WHERE id = p_appt FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  SELECT centre_id INTO v_centre FROM app.applications WHERE id = ca.application_id;
  PERFORM app._req_staff(v_centre, ARRAY['counsellor','centre_admin']);
  IF ca.status NOT IN ('SCHEDULED','RESCHEDULED','NO_SHOW') THEN PERFORM app._inv(ca.status,'open'); END IF;
  v_max := coalesce(app.fn_config_int('counselling_max_reschedules'), 1);
  IF ca.attempt_no > v_max THEN RAISE EXCEPTION 'E.CONFLICT.CAPACITY_FULL'
    USING DETAIL='{"limit":"counselling_max_reschedules"}'; END IF;
  UPDATE app.counselling_appointments SET scheduled_at=p_at, status='RESCHEDULED',
    attempt_no = attempt_no + 1, updated_at=now() WHERE id=p_appt;
  PERFORM app.fn_audit('counselling.rescheduled','application', ca.application_id, p_reason, NULL);
  PERFORM app.fn_outbox('counselling.rescheduled','application', ca.application_id,
    jsonb_build_object('at', p_at));                          -- §V-16 fix retained
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION app.fn_counsel_no_show(p_appt uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE ca app.counselling_appointments%ROWTYPE; v_centre uuid;
BEGIN  -- counsel.mark_no_show
  SELECT * INTO ca FROM app.counselling_appointments WHERE id = p_appt FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  SELECT centre_id INTO v_centre FROM app.applications WHERE id = ca.application_id;
  PERFORM app._req_staff(v_centre, ARRAY['counsellor','centre_admin']);
  IF ca.status NOT IN ('SCHEDULED','RESCHEDULED') THEN PERFORM app._inv(ca.status,'SCHEDULED'); END IF;
  UPDATE app.counselling_appointments SET status='NO_SHOW', updated_at=now() WHERE id=p_appt;
  PERFORM app.fn_audit('counselling.missed','application', ca.application_id, NULL, NULL);
  PERFORM app.fn_outbox('counselling.missed','application', ca.application_id, '{}'::jsonb);
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION app.fn_counsel_outcome(p_appt uuid, p_rec text, p_notes text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE ca app.counselling_appointments%ROWTYPE; v_centre uuid;
BEGIN  -- counsel.record_outcome (recommendation for C11 two-step)
  PERFORM app._req(p_rec IN ('APPROVE','REJECT','HOLD'),'recommendation');
  SELECT * INTO ca FROM app.counselling_appointments WHERE id = p_appt FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  SELECT centre_id INTO v_centre FROM app.applications WHERE id = ca.application_id;
  PERFORM app._req_staff(v_centre, ARRAY['counsellor','centre_admin']);
  IF ca.status NOT IN ('SCHEDULED','RESCHEDULED') THEN PERFORM app._inv(ca.status,'SCHEDULED'); END IF;
  UPDATE app.counselling_appointments SET status='COMPLETED', updated_at=now() WHERE id=p_appt;
  INSERT INTO app.counselling_outcomes (appointment_id, recommendation, notes, recorded_by)
  VALUES (p_appt, p_rec, p_notes, auth.uid());
  PERFORM app.fn_audit('counselling.outcome','application', ca.application_id, NULL,
    jsonb_build_object('recommendation', p_rec));
  RETURN jsonb_build_object('ok', true);
END $$;

-- ===== offers / enrolment (D→E ops) =====
CREATE OR REPLACE FUNCTION app.fn_offer_accept(p_offer uuid, p_idem uuid, p_hash text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v jsonb; o app.admission_offers%ROWTYPE; a app.applications%ROWTYPE;
        v_student uuid; v_enrol uuid; v_res jsonb;
BEGIN  -- offer.accept → enrolment (lock order: offer(3) → batch(1)? NO: batch first per K)
  v := app.fn_idem_begin('offer.accept', p_idem, p_hash);
  IF v IS NOT NULL THEN RETURN v; END IF;
  SELECT * INTO o FROM app.admission_offers WHERE id = p_offer;   -- read (no lock yet)
  IF NOT FOUND OR NOT app.fn_owns_application(o.application_id) THEN PERFORM app._nf(); END IF;
  PERFORM 1 FROM app.batches WHERE id = o.batch_id FOR UPDATE;    -- rank 1 first (K order)
  SELECT * INTO o FROM app.admission_offers WHERE id = p_offer FOR UPDATE;  -- rank 3 re-read
  IF o.status <> 'SENT' OR o.expires_at <= now() THEN PERFORM app._inv(o.status,'SENT+unexpired'); END IF;
  SELECT * INTO a FROM app.applications WHERE id = o.application_id FOR UPDATE;
  SELECT id INTO v_student FROM app.students st
   WHERE st.applicant_id = a.applicant_id;
  IF v_student IS NULL THEN
    INSERT INTO app.students (applicant_id, student_code)
    VALUES (a.applicant_id, app.fn_next_student_code(a.centre_id)) RETURNING id INTO v_student;
  END IF;
  INSERT INTO app.enrolments (student_id, batch_id, application_id)
  VALUES (v_student, o.batch_id, a.id) RETURNING id INTO v_enrol;
  UPDATE app.admission_offers SET status='ACCEPTED', updated_at=now() WHERE id=o.id;
  UPDATE app.applications SET status='CLOSED', updated_at=now() WHERE id=a.id;
  IF a.hostel_required THEN
    INSERT INTO app.hostel_requests (enrolment_id) VALUES (v_enrol) ON CONFLICT DO NOTHING;
  END IF;
  PERFORM app.fn_audit('offer.accepted','application', a.id, NULL, jsonb_build_object('enrolment', v_enrol));
  PERFORM app.fn_outbox('offer.accepted','application', a.id, jsonb_build_object('enrolment', v_enrol));
  v_res := jsonb_build_object('enrolment_id', v_enrol, 'student_id', v_student);
  PERFORM app.fn_idem_finish('offer.accept', p_idem, v_res);
  RETURN v_res;
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'E.CONFLICT.DUPLICATE';
END $$;

CREATE OR REPLACE FUNCTION app.fn_offer_decline(p_offer uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE o app.admission_offers%ROWTYPE;
BEGIN  -- offer.decline (seat release → [SYS] promotion)
  SELECT * INTO o FROM app.admission_offers WHERE id = p_offer;
  IF NOT FOUND OR NOT app.fn_owns_application(o.application_id) THEN PERFORM app._nf(); END IF;
  PERFORM 1 FROM app.batches WHERE id = o.batch_id FOR UPDATE;
  SELECT * INTO o FROM app.admission_offers WHERE id = p_offer FOR UPDATE;
  IF o.status <> 'SENT' THEN PERFORM app._inv(o.status,'SENT'); END IF;
  UPDATE app.admission_offers SET status='DECLINED', updated_at=now() WHERE id=o.id;
  UPDATE app.applications SET status='CLOSED', updated_at=now() WHERE id=o.application_id;
  PERFORM app.fn_audit('offer.declined','application', o.application_id, NULL, NULL);
  PERFORM app.fn_outbox('batch.seat_released','batch', o.batch_id, '{}'::jsonb);
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION app.fn_jobs_expire_offers() RETURNS int
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE r record; n int := 0;
BEGIN  -- [SYS]
  FOR r IN SELECT id, application_id, batch_id FROM app.admission_offers
           WHERE status='SENT' AND expires_at <= now() FOR UPDATE SKIP LOCKED LOOP
    UPDATE app.admission_offers SET status='EXPIRED', updated_at=now() WHERE id=r.id;
    UPDATE app.applications SET status='CLOSED', updated_at=now() WHERE id=r.application_id;
    PERFORM app.fn_outbox('offer.expired','application', r.application_id, '{}'::jsonb);
    PERFORM app.fn_outbox('batch.seat_released','batch', r.batch_id, '{}'::jsonb);
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION app.fn_jobs_expire_drafts() RETURNS int
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE n int;
BEGIN  -- [SYS] draft expiry (config days)
  WITH upd AS (
    UPDATE app.applications SET status='EXPIRED', updated_at=now()
    WHERE status='DRAFT'
      AND updated_at < now() - make_interval(days => coalesce(app.fn_config_int('draft_expiry_days'),30))
    RETURNING id)
  SELECT count(*) INTO n FROM upd;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION app.fn_confirm_joining(p_enrolment uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE e app.enrolments%ROWTYPE; v_centre uuid;
BEGIN  -- enrolment.confirm_joining
  SELECT * INTO e FROM app.enrolments WHERE id = p_enrolment FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  SELECT centre_id INTO v_centre FROM app.batches WHERE id = e.batch_id;
  PERFORM app._req_staff(v_centre, ARRAY['centre_admin','trainer']);
  IF e.status <> 'ENROLLED' THEN PERFORM app._inv(e.status,'ENROLLED'); END IF;
  UPDATE app.enrolments SET status='ACTIVE', joined_at=current_date, updated_at=now() WHERE id=e.id;
  PERFORM app.fn_audit('enrolment.joined','enrolment', e.id, NULL, NULL);
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION app.fn_mark_not_joined(p_enrolment uuid, p_reason text, p_idem uuid, p_hash text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v jsonb; e app.enrolments%ROWTYPE; v_centre uuid; v_res jsonb;
BEGIN  -- enrolment.mark_not_joined (grace via config; seat release)
  v := app.fn_idem_begin('enrolment.not_joined', p_idem, p_hash);
  IF v IS NOT NULL THEN RETURN v; END IF;
  PERFORM app._req(coalesce(p_reason,'')<>'','reason');
  SELECT * INTO e FROM app.enrolments WHERE id = p_enrolment FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  SELECT centre_id INTO v_centre FROM app.batches WHERE id = e.batch_id;
  PERFORM app._req_staff(v_centre, ARRAY['centre_admin']);
  IF e.status <> 'ENROLLED' THEN PERFORM app._inv(e.status,'ENROLLED'); END IF;
  UPDATE app.enrolments SET status='DROPPED', left_at=current_date, updated_at=now() WHERE id=e.id;
  PERFORM app.fn_audit('enrolment.not_joined','enrolment', e.id, p_reason, NULL);
  PERFORM app.fn_outbox('batch.seat_released','batch', e.batch_id, '{}'::jsonb);
  v_res := jsonb_build_object('ok', true);
  PERFORM app.fn_idem_finish('enrolment.not_joined', p_idem, v_res);
  RETURN v_res;
END $$;

CREATE OR REPLACE FUNCTION app.fn_transfer_enrolment(p_enrolment uuid, p_to_batch uuid, p_reason text,
  p_idem uuid, p_hash text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v jsonb; e app.enrolments%ROWTYPE; b app.batches%ROWTYPE; v_seats int; v_res jsonb;
BEGIN  -- enrolment.transfer (to_batch rank1 → enrolment rank3)
  v := app.fn_idem_begin('enrolment.transfer', p_idem, p_hash);
  IF v IS NOT NULL THEN RETURN v; END IF;
  PERFORM app._req(coalesce(p_reason,'')<>'','reason');
  SELECT * INTO b FROM app.batches WHERE id = p_to_batch FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  PERFORM app._req_staff(b.centre_id, ARRAY['centre_admin']);
  SELECT * INTO e FROM app.enrolments WHERE id = p_enrolment FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  IF e.status NOT IN ('ENROLLED','ACTIVE') THEN PERFORM app._inv(e.status,'ENROLLED|ACTIVE'); END IF;
  SELECT b.capacity
    - (SELECT count(*) FROM app.enrolments WHERE batch_id=b.id AND status IN ('ENROLLED','ACTIVE'))
    - (SELECT count(*) FROM app.admission_offers WHERE batch_id=b.id AND status='SENT' AND expires_at>now())
  INTO v_seats;
  IF v_seats <= 0 THEN RAISE EXCEPTION 'E.CONFLICT.CAPACITY_FULL'; END IF;
  INSERT INTO app.enrolment_transfers (enrolment_id, from_batch, to_batch, reason, transferred_by)
  VALUES (e.id, e.batch_id, p_to_batch, p_reason, auth.uid());
  UPDATE app.enrolments SET batch_id = p_to_batch, updated_at=now() WHERE id=e.id;
  PERFORM app.fn_audit('enrolment.transferred','enrolment', e.id, p_reason,
    jsonb_build_object('to_batch', p_to_batch));
  PERFORM app.fn_outbox('batch.seat_released','batch', e.batch_id, '{}'::jsonb);
  v_res := jsonb_build_object('ok', true);
  PERFORM app.fn_idem_finish('enrolment.transfer', p_idem, v_res);
  RETURN v_res;
END $$;

CREATE OR REPLACE FUNCTION app.fn_complete_enrolment(p_enrolment uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE e app.enrolments%ROWTYPE; v_centre uuid;
BEGIN  -- enrolment.complete (assessment gate at cert time; completion is administrative)
  SELECT * INTO e FROM app.enrolments WHERE id = p_enrolment FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  SELECT centre_id INTO v_centre FROM app.batches WHERE id = e.batch_id;
  PERFORM app._req_staff(v_centre, ARRAY['centre_admin']);
  IF e.status <> 'ACTIVE' THEN PERFORM app._inv(e.status,'ACTIVE'); END IF;
  UPDATE app.enrolments SET status='COMPLETED', left_at=current_date, updated_at=now() WHERE id=e.id;
  PERFORM app.fn_audit('enrolment.completed','enrolment', e.id, NULL, NULL);
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION app.fn_drop_enrolment(p_enrolment uuid, p_reason text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE e app.enrolments%ROWTYPE; v_centre uuid;
BEGIN  -- enrolment.drop
  PERFORM app._req(coalesce(p_reason,'')<>'','reason');
  SELECT * INTO e FROM app.enrolments WHERE id = p_enrolment FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  SELECT centre_id INTO v_centre FROM app.batches WHERE id = e.batch_id;
  PERFORM app._req_staff(v_centre, ARRAY['centre_admin']);
  IF e.status NOT IN ('ENROLLED','ACTIVE') THEN PERFORM app._inv(e.status,'live'); END IF;
  UPDATE app.enrolments SET status='DROPPED', left_at=current_date, updated_at=now() WHERE id=e.id;
  UPDATE app.hostel_allocations SET released_at=now(), released_reason='ENROLMENT_DROPPED'
   WHERE enrolment_id=e.id AND released_at IS NULL;
  UPDATE app.beds SET status='AVAILABLE', updated_at=now()
   WHERE id IN (SELECT bed_id FROM app.hostel_allocations
                WHERE enrolment_id=e.id AND released_reason='ENROLMENT_DROPPED');
  -- PHASE2-FIX (runtime-exposed, same defect as fn_hostel_discharge): close any live
  -- hostel request so the enrolment's slot under ux_hostel_request_live is freed.
  UPDATE app.hostel_requests SET status='CANCELLED', updated_at=now()
   WHERE enrolment_id=e.id AND status IN ('REQUESTED','APPROVED','QUEUED','ALLOCATED');
  PERFORM app.fn_audit('enrolment.dropped','enrolment', e.id, p_reason, NULL);
  PERFORM app.fn_outbox('batch.seat_released','batch', e.batch_id, '{}'::jsonb);
  RETURN jsonb_build_object('ok', true);
END $$;

-- ===== academics =====
CREATE OR REPLACE FUNCTION app.fn_lock_attendance(p_session uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE s app.class_sessions%ROWTYPE; v_centre uuid;
BEGIN  -- attendance.lock
  SELECT * INTO s FROM app.class_sessions WHERE id = p_session FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  SELECT centre_id INTO v_centre FROM app.batches WHERE id = s.batch_id;
  IF NOT (s.trainer_profile_id = auth.uid()
          OR EXISTS (SELECT 1 FROM app.staff_memberships m WHERE m.profile_id=auth.uid()
                     AND m.centre_id=v_centre AND m.role_code='centre_admin' AND m.is_active))
  THEN PERFORM app._nf(); END IF;
  IF s.locked_at IS NOT NULL THEN PERFORM app._inv('LOCKED','unlocked'); END IF;
  UPDATE app.class_sessions SET locked_at=now(), updated_at=now() WHERE id=p_session;
  PERFORM app.fn_audit('attendance.locked','class_session', p_session, NULL, NULL);
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION app.fn_correct_attendance(p_attendance uuid, p_present boolean,
  p_reason text, p_idem uuid, p_hash text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v jsonb; att app.attendance%ROWTYPE; v_centre uuid; v_locked timestamptz; v_res jsonb;
BEGIN  -- attendance.correct (CAD, post-lock only, history row)
  v := app.fn_idem_begin('attendance.correct', p_idem, p_hash);
  IF v IS NOT NULL THEN RETURN v; END IF;
  PERFORM app._req(coalesce(p_reason,'')<>'','reason');
  SELECT * INTO att FROM app.attendance WHERE id = p_attendance FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  SELECT b.centre_id, s.locked_at INTO v_centre, v_locked
  FROM app.class_sessions s JOIN app.batches b ON b.id=s.batch_id WHERE s.id = att.session_id;
  PERFORM app._req_staff(v_centre, ARRAY['centre_admin']);
  IF v_locked IS NULL THEN PERFORM app._inv('UNLOCKED','locked'); END IF;
  INSERT INTO app.attendance_corrections (attendance_id, old_present, new_present, reason, corrected_by)
  VALUES (att.id, att.present, p_present, p_reason, auth.uid());
  UPDATE app.attendance SET present = p_present, updated_at=now() WHERE id = att.id;
  PERFORM app.fn_audit('attendance.corrected','attendance', att.id, p_reason,
    jsonb_build_object('old', att.present, 'new', p_present));
  v_res := jsonb_build_object('ok', true);
  PERFORM app.fn_idem_finish('attendance.correct', p_idem, v_res);
  RETURN v_res;
END $$;

CREATE OR REPLACE FUNCTION app.fn_finalize_assessment(p_assessment uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE s app.assessments%ROWTYPE; v_centre uuid;
BEGIN  -- assessment.finalize
  SELECT * INTO s FROM app.assessments WHERE id = p_assessment FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  SELECT centre_id INTO v_centre FROM app.batches WHERE id = s.batch_id;
  PERFORM app._req_staff(v_centre, ARRAY['centre_admin']);
  IF s.finalized_at IS NOT NULL THEN PERFORM app._inv('FINALIZED','open'); END IF;
  UPDATE app.assessments SET finalized_at = now() WHERE id = p_assessment;
  PERFORM app.fn_audit('assessment.finalized','assessment', p_assessment, NULL, NULL);
  RETURN jsonb_build_object('ok', true);
END $$;

-- ===== hostel (F-ops) =====
CREATE OR REPLACE FUNCTION app.fn_hostel_request(p_enrolment uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v_own boolean; v_id uuid;
BEGIN  -- hostel.request (re-request after cancel allowed via partial unique E-2)
  SELECT EXISTS (SELECT 1 FROM app.enrolments e JOIN app.students st ON st.id=e.student_id
    JOIN app.applicants ap ON ap.id=st.applicant_id
    WHERE e.id=p_enrolment AND ap.profile_id=auth.uid() AND e.status IN ('ENROLLED','ACTIVE'))
  INTO v_own;
  IF NOT v_own THEN PERFORM app._nf(); END IF;
  INSERT INTO app.hostel_requests (enrolment_id) VALUES (p_enrolment) RETURNING id INTO v_id;
  PERFORM app.fn_audit('hostel.requested','enrolment', p_enrolment, NULL, NULL);
  RETURN jsonb_build_object('request_id', v_id);
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'E.CONFLICT.ALREADY_ACTIVE';
END $$;

CREATE OR REPLACE FUNCTION app.fn_hostel_cancel(p_request uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE r app.hostel_requests%ROWTYPE; v_own boolean;
BEGIN  -- hostel.cancel_request (pre check-in)
  SELECT * INTO r FROM app.hostel_requests WHERE id = p_request FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  SELECT EXISTS (SELECT 1 FROM app.enrolments e JOIN app.students st ON st.id=e.student_id
    JOIN app.applicants ap ON ap.id=st.applicant_id
    WHERE e.id=r.enrolment_id AND ap.profile_id=auth.uid()) INTO v_own;
  IF NOT v_own THEN PERFORM app._nf(); END IF;
  IF r.status NOT IN ('REQUESTED','APPROVED','QUEUED') THEN PERFORM app._inv(r.status,'pre-allocation'); END IF;
  UPDATE app.hostel_requests SET status='CANCELLED', updated_at=now() WHERE id=r.id;
  PERFORM app.fn_audit('hostel.cancelled','enrolment', r.enrolment_id, NULL, NULL);
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION app.fn_hostel_approve(p_request uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE r app.hostel_requests%ROWTYPE; v_centre uuid; v_free int; v_new text;
BEGIN  -- hostel.approve (→APPROVED or QUEUED)
  SELECT * INTO r FROM app.hostel_requests WHERE id = p_request FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  SELECT b.centre_id INTO v_centre FROM app.enrolments e JOIN app.batches b ON b.id=e.batch_id
  WHERE e.id = r.enrolment_id;
  PERFORM app._req_staff(v_centre, ARRAY['hostel_manager','centre_admin']);
  IF r.status <> 'REQUESTED' THEN PERFORM app._inv(r.status,'REQUESTED'); END IF;
  SELECT count(*) INTO v_free FROM app.beds bd JOIN app.rooms rm ON rm.id=bd.room_id
  JOIN app.hostel_blocks hb ON hb.id=rm.block_id
  WHERE hb.centre_id = v_centre AND bd.status='AVAILABLE';
  v_new := CASE WHEN v_free > 0 THEN 'APPROVED' ELSE 'QUEUED' END;
  UPDATE app.hostel_requests SET status=v_new, updated_at=now() WHERE id=r.id;
  PERFORM app.fn_audit('hostel.approved','enrolment', r.enrolment_id, NULL,
    jsonb_build_object('state', v_new));
  PERFORM app.fn_outbox('hostel.request_' || lower(v_new),'enrolment', r.enrolment_id, '{}'::jsonb);
  RETURN jsonb_build_object('status', v_new);
END $$;

CREATE OR REPLACE FUNCTION app.fn_hostel_transfer(p_enrolment uuid, p_to_bed uuid, p_reason text,
  p_idem uuid, p_hash text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v jsonb; alloc app.hostel_allocations%ROWTYPE; v_centre uuid; v_from uuid; bd record; v_res jsonb;
BEGIN  -- hostel.transfer: beds ascending-id (§V-13 corrected order), release+allocate one tx
  v := app.fn_idem_begin('hostel.transfer', p_idem, p_hash);
  IF v IS NOT NULL THEN RETURN v; END IF;
  PERFORM app._req(coalesce(p_reason,'')<>'','reason');
  SELECT * INTO alloc FROM app.hostel_allocations
   WHERE enrolment_id = p_enrolment AND released_at IS NULL;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  v_from := alloc.bed_id;
  FOR bd IN SELECT b.* FROM app.beds b WHERE b.id IN (v_from, p_to_bed) ORDER BY b.id FOR UPDATE LOOP
    NULL; END LOOP;                                            -- rank 2, ascending id
  SELECT hb.centre_id INTO v_centre FROM app.beds b JOIN app.rooms rm ON rm.id=b.room_id
  JOIN app.hostel_blocks hb ON hb.id=rm.block_id WHERE b.id = p_to_bed;
  IF v_centre IS NULL THEN PERFORM app._nf(); END IF;
  PERFORM app._req_staff(v_centre, ARRAY['hostel_manager','centre_admin']);
  IF (SELECT status FROM app.beds WHERE id=p_to_bed) <> 'AVAILABLE'
  THEN RAISE EXCEPTION 'E.CONFLICT.ALREADY_ACTIVE'; END IF;
  UPDATE app.hostel_allocations SET released_at=now(), released_reason='TRANSFER'
   WHERE id = alloc.id;                                        -- frees enrolment partial unique
  INSERT INTO app.hostel_allocations (bed_id, enrolment_id) VALUES (p_to_bed, p_enrolment);
  UPDATE app.beds SET status='AVAILABLE', updated_at=now() WHERE id=v_from;
  UPDATE app.beds SET status='OCCUPIED', updated_at=now() WHERE id=p_to_bed;
  INSERT INTO app.hostel_transfers (enrolment_id, from_bed, to_bed, reason, transferred_by)
  VALUES (p_enrolment, v_from, p_to_bed, p_reason, auth.uid());
  PERFORM app.fn_audit('hostel.transferred','enrolment', p_enrolment, p_reason,
    jsonb_build_object('from', v_from, 'to', p_to_bed));
  PERFORM app.fn_outbox('hostel.allocation_update','enrolment', p_enrolment, '{}'::jsonb);
  v_res := jsonb_build_object('ok', true);
  PERFORM app.fn_idem_finish('hostel.transfer', p_idem, v_res);
  RETURN v_res;
END $$;

CREATE OR REPLACE FUNCTION app.fn_hostel_discharge(p_allocation uuid, p_reason text,
  p_idem uuid, p_hash text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v jsonb; alloc app.hostel_allocations%ROWTYPE; v_centre uuid; v_res jsonb;
BEGIN  -- hostel.discharge (bed → AVAILABLE → [SYS] queue review)
  v := app.fn_idem_begin('hostel.discharge', p_idem, p_hash);
  IF v IS NOT NULL THEN RETURN v; END IF;
  PERFORM app._req(coalesce(p_reason,'')<>'','reason');
  SELECT * INTO alloc FROM app.hostel_allocations WHERE id = p_allocation;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  PERFORM 1 FROM app.beds WHERE id = alloc.bed_id FOR UPDATE;   -- rank 2 first
  SELECT * INTO alloc FROM app.hostel_allocations WHERE id = p_allocation FOR UPDATE;
  SELECT hb.centre_id INTO v_centre FROM app.beds b JOIN app.rooms rm ON rm.id=b.room_id
  JOIN app.hostel_blocks hb ON hb.id=rm.block_id WHERE b.id = alloc.bed_id;
  PERFORM app._req_staff(v_centre, ARRAY['hostel_manager','centre_admin']);
  IF alloc.released_at IS NOT NULL THEN PERFORM app._inv('RELEASED','active'); END IF;
  UPDATE app.hostel_allocations SET released_at=now(), released_reason=p_reason WHERE id=alloc.id;
  UPDATE app.beds SET status='AVAILABLE', updated_at=now() WHERE id=alloc.bed_id;
  -- PHASE2-FIX (runtime-exposed): the request stayed 'ALLOCATED' forever, which is a
  -- live status under ux_hostel_request_live, so a discharged student could never
  -- re-request (E-2). Close the request when its allocation ends.
  UPDATE app.hostel_requests SET status='CANCELLED', updated_at=now()
   WHERE enrolment_id = alloc.enrolment_id AND status = 'ALLOCATED';
  PERFORM app.fn_audit('hostel.discharged','enrolment', alloc.enrolment_id, p_reason, NULL);
  PERFORM app.fn_outbox('hostel.bed_released','bed', alloc.bed_id, '{}'::jsonb);
  v_res := jsonb_build_object('ok', true);
  PERFORM app.fn_idem_finish('hostel.discharge', p_idem, v_res);
  RETURN v_res;
END $$;

CREATE OR REPLACE FUNCTION app.fn_set_bed_status(p_bed uuid, p_status text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v_centre uuid;
BEGIN  -- hostel.set_bed_status (maintenance toggle; not while actively allocated)
  PERFORM app._req(p_status IN ('AVAILABLE','MAINTENANCE'),'status');
  PERFORM 1 FROM app.beds WHERE id = p_bed FOR UPDATE;
  SELECT hb.centre_id INTO v_centre FROM app.beds b JOIN app.rooms rm ON rm.id=b.room_id
  JOIN app.hostel_blocks hb ON hb.id=rm.block_id WHERE b.id = p_bed;
  IF v_centre IS NULL THEN PERFORM app._nf(); END IF;
  PERFORM app._req_staff(v_centre, ARRAY['hostel_manager','centre_admin']);
  IF EXISTS (SELECT 1 FROM app.hostel_allocations WHERE bed_id=p_bed AND released_at IS NULL)
  THEN RAISE EXCEPTION 'E.CONFLICT.ALREADY_ACTIVE'; END IF;
  UPDATE app.beds SET status=p_status, updated_at=now() WHERE id=p_bed;
  PERFORM app.fn_audit('hostel.bed_status','bed', p_bed, NULL, jsonb_build_object('status', p_status));
  RETURN jsonb_build_object('ok', true);
END $$;

-- ===== certificates =====
CREATE OR REPLACE FUNCTION app.fn_cert_revoke(p_cert uuid, p_reason text, p_idem uuid, p_hash text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v jsonb; c app.certificates%ROWTYPE; v_centre uuid; v_res jsonb;
BEGIN  -- cert.revoke
  v := app.fn_idem_begin('cert.revoke', p_idem, p_hash);
  IF v IS NOT NULL THEN RETURN v; END IF;
  PERFORM app._req(coalesce(p_reason,'')<>'','reason');
  SELECT * INTO c FROM app.certificates WHERE id = p_cert FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  SELECT b.centre_id INTO v_centre FROM app.enrolments e JOIN app.batches b ON b.id=e.batch_id
  WHERE e.id = c.enrolment_id;
  PERFORM app._req_staff(v_centre, ARRAY['centre_admin']);
  IF c.status <> 'ISSUED' THEN PERFORM app._inv(c.status,'ISSUED'); END IF;
  UPDATE app.certificates SET status='REVOKED', reason=p_reason, updated_at=now() WHERE id=c.id;
  PERFORM app.fn_audit('certificate.revoked','certificate', c.id, p_reason, NULL);
  v_res := jsonb_build_object('ok', true);
  PERFORM app.fn_idem_finish('cert.revoke', p_idem, v_res);
  RETURN v_res;
END $$;

CREATE OR REPLACE FUNCTION app.fn_cert_verify(p_code text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
  -- cert.verify [PUBLIC]: minimal fixed projection; unknown → uniform {valid:false}
  SELECT coalesce((SELECT jsonb_build_object('valid', c.status='ISSUED',
           'status', c.status,
           'holder_name', ap.full_name,
           'course_code', co.code,
           'batch_code', b.code,
           'issued_on', c.created_at::date,
           'superseded', EXISTS (SELECT 1 FROM app.certificates n WHERE n.supersedes_id=c.id))
    FROM app.certificates c
    JOIN app.enrolments e ON e.id=c.enrolment_id
    JOIN app.students st ON st.id=e.student_id
    JOIN app.applicants ap ON ap.id=st.applicant_id
    JOIN app.batches b ON b.id=e.batch_id
    JOIN app.course_versions cv ON cv.id=b.course_version_id
    JOIN app.courses co ON co.id=cv.course_id
    WHERE c.verify_code = p_code), jsonb_build_object('valid', false))
$$;

-- ===== placement =====
CREATE OR REPLACE FUNCTION app.fn_placement_profile_create(p_skills text, p_district text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v_student uuid; v_id uuid;
BEGIN  -- placement.create_profile (consent structural: consent_at NOT NULL)
  SELECT st.id INTO v_student FROM app.students st JOIN app.applicants ap ON ap.id=st.applicant_id
  WHERE ap.profile_id = auth.uid();
  IF v_student IS NULL THEN PERFORM app._nf(); END IF;
  INSERT INTO app.placement_profiles (student_id, consent_at, skills_summary, preferred_district)
  VALUES (v_student, now(), p_skills, p_district) RETURNING id INTO v_id;
  PERFORM app.fn_audit('placement.consented','student', v_student, NULL, NULL);
  RETURN jsonb_build_object('profile_id', v_id);
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'E.CONFLICT.ALREADY_ACTIVE';
END $$;

CREATE OR REPLACE FUNCTION app.fn_placement_withdraw() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE pp app.placement_profiles%ROWTYPE;
BEGIN  -- placement.withdraw_consent (+ close open referrals)
  SELECT p.* INTO pp FROM app.placement_profiles p
  JOIN app.students st ON st.id=p.student_id JOIN app.applicants ap ON ap.id=st.applicant_id
  WHERE ap.profile_id = auth.uid() AND p.withdrawn_at IS NULL FOR UPDATE OF p;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  UPDATE app.placement_profiles SET withdrawn_at = now() WHERE id = pp.id;
  UPDATE app.placement_referrals SET status='CLOSED', updated_at=now()
   WHERE placement_profile_id = pp.id AND status IN ('REFERRED','INTERVIEW');
  PERFORM app.fn_audit('placement.withdrawn','student', pp.student_id, NULL, NULL);
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION app.fn_referral_create(p_opportunity uuid, p_profile uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v_centre uuid; v_id uuid;
BEGIN  -- referral.create (consented only, C9)
  SELECT centre_id INTO v_centre FROM app.job_opportunities WHERE id = p_opportunity;
  IF v_centre IS NULL THEN PERFORM app._nf(); END IF;
  PERFORM app._req_staff(v_centre, ARRAY['placement','centre_admin']);
  IF NOT EXISTS (SELECT 1 FROM app.placement_profiles WHERE id=p_profile AND withdrawn_at IS NULL)
  THEN PERFORM app._nf(); END IF;
  INSERT INTO app.placement_referrals (opportunity_id, placement_profile_id)
  VALUES (p_opportunity, p_profile) RETURNING id INTO v_id;
  PERFORM app.fn_audit('placement.referred','placement_referral', v_id, NULL, NULL);
  PERFORM app.fn_outbox('placement.referred','placement_referral', v_id, '{}'::jsonb);
  RETURN jsonb_build_object('referral_id', v_id);
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'E.CONFLICT.DUPLICATE';
END $$;

CREATE OR REPLACE FUNCTION app.fn_referral_status(p_referral uuid, p_status text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE r app.placement_referrals%ROWTYPE; v_centre uuid;
BEGIN  -- referral.update_status
  PERFORM app._req(p_status IN ('INTERVIEW','OFFERED','DECLINED','CLOSED'),'status');
  SELECT * INTO r FROM app.placement_referrals WHERE id = p_referral FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  SELECT centre_id INTO v_centre FROM app.job_opportunities WHERE id = r.opportunity_id;
  PERFORM app._req_staff(v_centre, ARRAY['placement','centre_admin']);
  UPDATE app.placement_referrals SET status=p_status, updated_at=now() WHERE id=r.id;
  PERFORM app.fn_audit('placement.status','placement_referral', r.id, NULL,
    jsonb_build_object('status', p_status));
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION app.fn_outcome_record(p_referral uuid, p_outcome text, p_joined date,
  p_band text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE r app.placement_referrals%ROWTYPE; v_centre uuid; v_id uuid;
BEGIN  -- outcome.record (assistance record — never guaranteed employment)
  PERFORM app._req(p_outcome IN ('JOINED','NOT_JOINED'),'outcome');
  SELECT * INTO r FROM app.placement_referrals WHERE id = p_referral FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  SELECT centre_id INTO v_centre FROM app.job_opportunities WHERE id = r.opportunity_id;
  PERFORM app._req_staff(v_centre, ARRAY['placement','centre_admin']);
  INSERT INTO app.placement_outcomes (referral_id, outcome, joined_on, salary_band, recorded_by)
  VALUES (r.id, p_outcome, p_joined, p_band, auth.uid()) RETURNING id INTO v_id;
  PERFORM app.fn_audit('placement.outcome','placement_referral', r.id, NULL,
    jsonb_build_object('outcome', p_outcome));
  RETURN jsonb_build_object('outcome_id', v_id);
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'E.CONFLICT.DUPLICATE';
END $$;

-- ===== engagement =====
CREATE OR REPLACE FUNCTION app.fn_event_join(p_event uuid, p_enrolment uuid, p_consent boolean)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE ev app.events%ROWTYPE; v_own boolean;
BEGIN  -- event.join (consent gate)
  SELECT * INTO ev FROM app.events WHERE id = p_event;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  SELECT EXISTS (SELECT 1 FROM app.enrolments e JOIN app.students st ON st.id=e.student_id
    JOIN app.applicants ap ON ap.id=st.applicant_id
    WHERE e.id=p_enrolment AND ap.profile_id=auth.uid()) INTO v_own;
  IF NOT v_own THEN PERFORM app._nf(); END IF;
  IF ev.consent_required THEN PERFORM app._req(p_consent,'consent'); END IF;
  INSERT INTO app.event_participation (event_id, enrolment_id, consent_at)
  VALUES (p_event, p_enrolment, CASE WHEN ev.consent_required THEN now() END);
  PERFORM app.fn_audit('event.joined','event', p_event, NULL, NULL);
  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'E.CONFLICT.DUPLICATE';
END $$;

CREATE OR REPLACE FUNCTION app.fn_notice_publish(p_notice uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE n app.notices%ROWTYPE;
BEGIN  -- notice.publish
  SELECT * INTO n FROM app.notices WHERE id = p_notice FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  PERFORM app._req(n.centre_id IS NOT NULL, 'centre_id');
  PERFORM app._req_staff(n.centre_id, ARRAY['centre_admin']);
  IF n.status <> 'DRAFT' THEN PERFORM app._inv(n.status,'DRAFT'); END IF;
  PERFORM app._req(EXISTS (SELECT 1 FROM app.notice_audiences WHERE notice_id=n.id), 'audience');
  UPDATE app.notices SET status='PUBLISHED', published_at=now(), published_by=auth.uid(),
    updated_at=now() WHERE id=n.id;
  PERFORM app.fn_audit('notice.published','notice', n.id, NULL, NULL);
  PERFORM app.fn_outbox('notice.published','notice', n.id, '{}'::jsonb);
  RETURN jsonb_build_object('ok', true);
END $$;

-- ===== staff / governance =====
CREATE OR REPLACE FUNCTION app.fn_staff_register(p_profile uuid, p_full_name text, p_email text,
  p_phone text, p_centre uuid, p_role text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
BEGIN  -- staff.create [SYS]: EF creates auth user first, passes its uuid
  INSERT INTO app.profiles (id, full_name, phone, email)
  VALUES (p_profile, p_full_name, p_phone, p_email)
  ON CONFLICT (id) DO UPDATE SET email = excluded.email, updated_at = now();
  INSERT INTO app.staff_memberships (profile_id, centre_id, role_code)
  VALUES (p_profile, p_centre, p_role);
  INSERT INTO app.audit_events (actor_profile_id, action, target_type, target_id, summary)
  VALUES (p_profile, 'staff.created', 'profile', p_profile,
          jsonb_build_object('role', p_role, 'centre', p_centre));
  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'E.CONFLICT.DUPLICATE';
END $$;

CREATE OR REPLACE FUNCTION app.fn_membership_grant(p_profile uuid, p_centre uuid, p_role text,
  p_reason text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
BEGIN  -- membership.grant (CAD own-centre non-admin; SAD anywhere)
  PERFORM app._req(coalesce(p_reason,'')<>'','reason');
  IF NOT (app.fn_is_staff(p_centre, ARRAY['super_admin'])
       OR (app.fn_is_staff(p_centre, ARRAY['centre_admin']) AND p_role NOT IN ('centre_admin','super_admin')))
  THEN PERFORM app._nf(); END IF;
  INSERT INTO app.staff_memberships (profile_id, centre_id, role_code)
  VALUES (p_profile, p_centre, p_role)
  ON CONFLICT (profile_id, centre_id, role_code)
  DO UPDATE SET is_active = true, deactivated_at = NULL, updated_at = now();
  PERFORM app.fn_audit('role.granted','profile', p_profile, p_reason,
    jsonb_build_object('role', p_role, 'centre', p_centre));
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION app.fn_membership_revoke(p_profile uuid, p_centre uuid, p_role text,
  p_reason text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
BEGIN  -- membership.revoke
  PERFORM app._req(coalesce(p_reason,'')<>'','reason');
  IF NOT (app.fn_is_staff(p_centre, ARRAY['super_admin'])
       OR (app.fn_is_staff(p_centre, ARRAY['centre_admin']) AND p_role NOT IN ('centre_admin','super_admin')))
  THEN PERFORM app._nf(); END IF;
  UPDATE app.staff_memberships SET is_active=false, deactivated_at=now(), updated_at=now()
  WHERE profile_id=p_profile AND centre_id=p_centre AND role_code=p_role AND is_active;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  PERFORM app.fn_audit('role.revoked','profile', p_profile, p_reason,
    jsonb_build_object('role', p_role, 'centre', p_centre));
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION app.fn_staff_deactivate(p_profile uuid, p_reason text, p_idem uuid, p_hash text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v jsonb; v_open_cases int; v_open_drafts int; v_res jsonb; v_centre uuid;
BEGIN  -- staff.deactivate (v1.1 §M offboarding; session revocation = EF/Auth-API boundary)
  v := app.fn_idem_begin('staff.deactivate', p_idem, p_hash);
  IF v IS NOT NULL THEN RETURN v; END IF;
  PERFORM app._req(coalesce(p_reason,'')<>'','reason');
  SELECT centre_id INTO v_centre FROM app.staff_memberships
   WHERE profile_id = p_profile AND is_active LIMIT 1;
  IF v_centre IS NULL THEN PERFORM app._nf(); END IF;
  IF NOT (app.fn_is_staff(v_centre, ARRAY['centre_admin','super_admin'])) THEN PERFORM app._nf(); END IF;
  UPDATE app.staff_memberships SET is_active=false, deactivated_at=now(), updated_at=now()
  WHERE profile_id=p_profile AND is_active;
  UPDATE app.profiles SET is_active=false, updated_at=now() WHERE id=p_profile;
  SELECT count(*) INTO v_open_cases FROM app.verification_assignments
   WHERE checker_profile_id=p_profile AND active;
  SELECT count(*) INTO v_open_drafts FROM app.applications
   WHERE assisting_operator_id=p_profile AND status='DRAFT';
  IF v_open_cases + v_open_drafts > 0 THEN
    PERFORM app.fn_outbox('staff.deactivated_with_open_work','profile', p_profile,
      jsonb_build_object('open_cases', v_open_cases, 'open_drafts', v_open_drafts));
  END IF;
  PERFORM app.fn_audit('staff.deactivated','profile', p_profile, p_reason,
    jsonb_build_object('open_cases', v_open_cases, 'open_drafts', v_open_drafts));
  v_res := jsonb_build_object('ok', true, 'open_cases', v_open_cases, 'open_drafts', v_open_drafts);
  PERFORM app.fn_idem_finish('staff.deactivate', p_idem, v_res);
  RETURN v_res;
END $$;

CREATE OR REPLACE FUNCTION app.fn_config_set(p_key text, p_value jsonb, p_reason text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v_old jsonb;
BEGIN  -- config.set (SAD only, any centre membership)
  PERFORM app._req(coalesce(p_reason,'')<>'','reason');
  IF NOT EXISTS (SELECT 1 FROM app.staff_memberships m WHERE m.profile_id=auth.uid()
     AND m.role_code='super_admin' AND m.is_active) THEN PERFORM app._nf(); END IF;
  SELECT value INTO v_old FROM app.system_settings WHERE key=p_key;
  INSERT INTO app.system_settings (key, value, updated_by) VALUES (p_key, p_value, auth.uid())
  ON CONFLICT (key) DO UPDATE SET value=excluded.value, updated_by=auth.uid(), updated_at=now();
  PERFORM app.fn_audit('config.changed','setting', NULL, p_reason,
    jsonb_build_object('key', p_key, 'old', v_old, 'new', p_value));
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION app.fn_export_create(p_report text, p_params jsonb, p_idem uuid, p_hash text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v jsonb; v_id uuid; v_res jsonb;
BEGIN  -- export.create (C12; generation + CSV neutralization at server layer)
  v := app.fn_idem_begin('export.create', p_idem, p_hash);
  IF v IS NOT NULL THEN RETURN v; END IF;
  IF NOT EXISTS (SELECT 1 FROM app.staff_memberships m WHERE m.profile_id=auth.uid()
     AND m.role_code IN ('centre_admin','super_admin','placement') AND m.is_active)
  THEN PERFORM app._nf(); END IF;
  INSERT INTO app.export_jobs (actor, report_key, params) VALUES (auth.uid(), p_report, p_params)
  RETURNING id INTO v_id;
  PERFORM app.fn_audit('export.created','export_job', v_id, NULL,
    jsonb_build_object('report', p_report));
  v_res := jsonb_build_object('job_id', v_id);
  PERFORM app.fn_idem_finish('export.create', p_idem, v_res);
  RETURN v_res;
END $$;

CREATE OR REPLACE FUNCTION app.fn_export_mark_downloaded(p_job uuid, p_actor uuid) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
BEGIN  -- export.download audit [SYS]
  INSERT INTO app.audit_events (actor_profile_id, action, target_type, target_id)
  VALUES (p_actor, 'export.downloaded', 'export_job', p_job);
END $$;

CREATE OR REPLACE FUNCTION app.fn_audit_query(p_from timestamptz, p_to timestamptz, p_action text,
  p_limit int) RETURNS SETOF app.audit_events
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v_centres uuid[];
BEGIN  -- audit.query (CAD centre-scope / SAD all)
  IF EXISTS (SELECT 1 FROM app.staff_memberships m WHERE m.profile_id=auth.uid()
     AND m.role_code='super_admin' AND m.is_active) THEN
    RETURN QUERY SELECT * FROM app.audit_events ae
      WHERE ae.at BETWEEN coalesce(p_from,'-infinity') AND coalesce(p_to,'infinity')
        AND (p_action IS NULL OR ae.action = p_action)
      ORDER BY ae.at DESC LIMIT least(coalesce(p_limit,100), 500);
  END IF;
  SELECT array_agg(centre_id) INTO v_centres FROM app.staff_memberships
   WHERE profile_id=auth.uid() AND role_code='centre_admin' AND is_active;
  IF v_centres IS NULL THEN PERFORM app._nf(); END IF;
  RETURN QUERY SELECT ae.* FROM app.audit_events ae
    WHERE ae.at BETWEEN coalesce(p_from,'-infinity') AND coalesce(p_to,'infinity')
      AND (p_action IS NULL OR ae.action = p_action)
      AND (ae.actor_profile_id IN (SELECT profile_id FROM app.staff_memberships
                                   WHERE centre_id = ANY(v_centres))
           OR EXISTS (SELECT 1 FROM app.applications a
                      WHERE a.id = ae.target_id AND a.centre_id = ANY(v_centres)))
    ORDER BY ae.at DESC LIMIT least(coalesce(p_limit,100), 500);
END $$;

-- ===== ownership + execute grants (SEC-DEF-001) =====
DO $$
DECLARE f record;
  sys_only text[] := ARRAY['fn_finalize_upload','fn_scan_result','fn_authorize_doc_view',
    'fn_outbox_claim','fn_notification_enqueue','fn_delivery_record','fn_jobs_expire_offers',
    'fn_jobs_expire_drafts','fn_apply_phone_change','fn_staff_register','fn_export_mark_downloaded',
    'fn_idem_purge','fn_waitlist_promote'];
  owner_only text[] := ARRAY['_nf','_inv','_req','_req_staff','fn_audit','fn_outbox',
    'fn_idem_begin','fn_idem_finish','fn_snapshot','fn_next_student_code','fn_next_cert_no',
    'fn_assessment_passed','fn_random_code','fn_config_int','fn_config_text',
    'fn_assert_immutable','fn_raise_appendonly','fn_stamp_marked_by','fn_guard_read_at'];
  anon_ok text[] := ARRAY['fn_cert_verify','fn_eligibility_eval'];
BEGIN
  FOR f IN SELECT p.oid::regprocedure AS sig, p.proname AS nm
           FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='app' LOOP
    EXECUTE format('ALTER FUNCTION %s OWNER TO sjkvy_def', f.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated, service_role', f.sig);
    IF f.nm = ANY(owner_only) THEN CONTINUE;
    ELSIF f.nm = ANY(sys_only) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.sig);
      IF f.nm = 'fn_waitlist_promote' THEN
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f.sig);  -- CAD manual + SYS
      END IF;
    ELSIF f.nm = ANY(anon_ok) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated', f.sig);
    ELSE
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f.sig);
    END IF;
  END LOOP;
END $$;
