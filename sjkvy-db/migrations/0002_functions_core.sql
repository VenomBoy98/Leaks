-- 0002_functions_core.sql — infra workers + six approved high-risk functions
-- Invariants: SEC-STATE-001/2, SEC-CONC-001..005, SEC-IDEM-*, SEC-AUDIT-002, SEC-OUT-001, SEC-DOC-002/3
-- CORRECTION (impl-caught, High): sjkvy_def BYPASSRLS ≠ table privileges → explicit grants required:
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO sjkvy_def;
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO sjkvy_def;
CREATE SEQUENCE IF NOT EXISTS app.seq_student; CREATE SEQUENCE IF NOT EXISTS app.seq_cert;
GRANT USAGE ON SEQUENCE app.seq_student, app.seq_cert TO sjkvy_def;

-- ---------- worker/support fns ----------
CREATE OR REPLACE FUNCTION app.fn_snapshot(p_app uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT jsonb_build_object('applicant', to_jsonb(ap) - 'aadhaar_last4',
          'application', jsonb_build_object('course_id', a.course_id, 'centre_id', a.centre_id,
            'hostel_required', a.hostel_required, 'qualification', a.qualification,
            'passing_year', a.passing_year))
   FROM app.applications a JOIN app.applicants ap ON ap.id = a.applicant_id WHERE a.id = p_app $$;

CREATE OR REPLACE FUNCTION app.fn_next_student_code(p_centre uuid) RETURNS text
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT replace(replace(coalesce(app.fn_config_text('student_code_format'),'SJK-{YYYY}-{SEQ}'),
   '{YYYY}', to_char(now(),'YYYY')), '{SEQ}', lpad(nextval('app.seq_student')::text, 4, '0')) $$;
CREATE OR REPLACE FUNCTION app.fn_next_cert_no(p_centre uuid) RETURNS text
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT replace(replace(coalesce(app.fn_config_text('cert_no_format'),'SJK-CERT-{YYYY}-{SEQ}'),
   '{YYYY}', to_char(now(),'YYYY')), '{SEQ}', lpad(nextval('app.seq_cert')::text, 5, '0')) $$;

CREATE OR REPLACE FUNCTION app.fn_assessment_passed(p_enrolment uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM app.assessment_results r JOIN app.assessments s ON s.id=r.assessment_id
     WHERE r.enrolment_id = p_enrolment AND s.finalized_at IS NOT NULL AND r.result = 'PASS')
   AND NOT EXISTS (SELECT 1 FROM app.assessment_results r JOIN app.assessments s ON s.id=r.assessment_id
     WHERE r.enrolment_id = p_enrolment AND s.finalized_at IS NOT NULL AND r.result = 'FAIL') $$;

-- [SYS] outbox worker: claim → enqueue notifications (dedupe) → record delivery
CREATE OR REPLACE FUNCTION app.fn_outbox_claim(p_limit int) RETURNS SETOF app.domain_events
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS
$$ SELECT * FROM app.domain_events WHERE processed_at IS NULL
   ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT p_limit $$;

CREATE OR REPLACE FUNCTION app.fn_notification_enqueue(p_event uuid, p_recipient uuid, p_phone text,
  p_channel text, p_template text, p_params jsonb) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
BEGIN
  -- SMS-only until claimed: INAPP requires a profile (v1.1 §M rule)
  IF p_channel = 'INAPP' AND p_recipient IS NULL THEN RETURN; END IF;
  INSERT INTO app.notifications (event_id, recipient_profile_id, recipient_phone, channel,
                                 template_key, params, dedupe_key)
  VALUES (p_event, p_recipient, p_phone, p_channel, p_template,
          coalesce(p_params,'{}'::jsonb),
          coalesce(p_event::text,'-') || '|' || coalesce(p_recipient::text, p_phone, '-') || '|' || p_template)
  ON CONFLICT (dedupe_key) DO NOTHING;                       -- SEC-OUT-002
  UPDATE app.domain_events SET processed_at = now() WHERE id = p_event;
END $$;

CREATE OR REPLACE FUNCTION app.fn_delivery_record(p_notification uuid, p_ok boolean,
  p_ref text, p_error text) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v_att int; v_max int := coalesce(app.fn_config_int('notif_max_attempts'), 3);
BEGIN
  SELECT coalesce(max(attempt_no),0)+1 INTO v_att FROM app.delivery_attempts WHERE notification_id=p_notification;
  INSERT INTO app.delivery_attempts (notification_id, attempt_no, provider_ref, error)
  VALUES (p_notification, v_att, p_ref, p_error);
  UPDATE app.notifications SET status = CASE WHEN p_ok THEN 'SENT'
    WHEN v_att >= v_max THEN 'FAILED' ELSE 'PENDING' END, updated_at = now()
  WHERE id = p_notification;
END $$;

-- [SYS] document boundary fns (EF passes verified caller; storage/scan stay outside SQL)
CREATE OR REPLACE FUNCTION app.fn_finalize_upload(p_caller uuid, p_application uuid,
  p_doc_type text, p_path text, p_mime text, p_size int, p_sha text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE a app.applications%ROWTYPE; d app.applicant_documents%ROWTYPE; v_ver int; v_id uuid;
BEGIN
  SELECT * INTO a FROM app.applications WHERE id = p_application FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  IF NOT (EXISTS (SELECT 1 FROM app.applicants ap WHERE ap.id=a.applicant_id AND ap.profile_id=p_caller)
          OR a.assisting_operator_id = p_caller) THEN PERFORM app._nf(); END IF;
  IF a.status NOT IN ('DRAFT','SUBMITTED','IN_PROCESS') THEN PERFORM app._inv(a.status,'DRAFT|IN_PROCESS'); END IF;
  INSERT INTO app.applicant_documents (application_id, document_type_code)
  VALUES (p_application, p_doc_type)
  ON CONFLICT (application_id, document_type_code) DO UPDATE SET updated_at = now()
  RETURNING * INTO d;
  SELECT coalesce(max(version_no),0)+1 INTO v_ver FROM app.document_versions WHERE document_id = d.id;
  INSERT INTO app.document_versions (document_id, version_no, storage_path, mime, size_bytes, sha256, uploaded_by)
  VALUES (d.id, v_ver, p_path, p_mime, p_size, p_sha, p_caller) RETURNING id INTO v_id;
  PERFORM app.fn_audit('document.uploaded','document', d.id, NULL,
                       jsonb_build_object('version', v_ver, 'type', p_doc_type));
  RETURN jsonb_build_object('document_id', d.id, 'version_id', v_id, 'version_no', v_ver,
                            'scan_status','PENDING');
END $$;

CREATE OR REPLACE FUNCTION app.fn_scan_result(p_version uuid, p_status text) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v app.document_versions%ROWTYPE;
BEGIN
  PERFORM app._req(p_status IN ('CLEAN','FLAGGED'), 'status');
  SELECT * INTO v FROM app.document_versions WHERE id = p_version FOR UPDATE;
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  IF v.scan_status <> 'PENDING' THEN PERFORM app._inv(v.scan_status,'PENDING'); END IF;
  UPDATE app.document_versions SET scan_status = p_status WHERE id = p_version;
  IF p_status = 'CLEAN' THEN
    UPDATE app.applicant_documents SET current_version_id = p_version, status='UPLOADED', updated_at=now()
    WHERE id = v.document_id;
  ELSE
    PERFORM app.fn_outbox('document.flagged','document', v.document_id, '{}'::jsonb);
  END IF;
  PERFORM app.fn_audit('document.scan_result','document_version', p_version, NULL,
                       jsonb_build_object('result', p_status));
END $$;

CREATE OR REPLACE FUNCTION app.fn_authorize_doc_view(p_caller uuid, p_version uuid, p_purpose text)
RETURNS text LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v_path text; v_app uuid; v_centre uuid; v_case uuid; v_ok boolean := false;
BEGIN
  SELECT dv.storage_path, d.application_id INTO v_path, v_app
  FROM app.document_versions dv JOIN app.applicant_documents d ON d.id = dv.document_id
  WHERE dv.id = p_version;
  IF v_path IS NULL THEN PERFORM app._nf(); END IF;
  SELECT a.centre_id INTO v_centre FROM app.applications a WHERE a.id = v_app;
  SELECT vc.id INTO v_case FROM app.verification_cases vc WHERE vc.application_id = v_app;
  v_ok := EXISTS (SELECT 1 FROM app.applications a JOIN app.applicants ap ON ap.id=a.applicant_id
                  WHERE a.id = v_app AND ap.profile_id = p_caller)                       -- OWNER
       OR EXISTS (SELECT 1 FROM app.verification_assignments va
                  WHERE va.case_id = v_case AND va.checker_profile_id = p_caller AND va.active)  -- CHECKER
       OR EXISTS (SELECT 1 FROM app.staff_memberships m WHERE m.profile_id = p_caller
                  AND m.centre_id = v_centre AND m.role_code IN ('counsellor','centre_admin')
                  AND m.is_active);                                                       -- ADMISSION
  IF NOT v_ok THEN PERFORM app._nf(); END IF;                 -- TRN/HST/PLC: no branch (SEC-DOC-004)
  INSERT INTO app.audit_events (actor_profile_id, action, target_type, target_id, reason, summary)
  VALUES (p_caller, 'document.viewed', 'document_version', p_version, p_purpose, NULL);   -- SEC-DOC-003
  RETURN v_path;                                              -- service-role caller mints signed URL
END $$;

-- ---------- six high-risk functions (approved §T pattern, unchanged semantics) ----------
CREATE OR REPLACE FUNCTION app.fn_submit_application(p_app uuid, p_idem uuid, p_hash text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v jsonb; a app.applications%ROWTYPE; ap app.applicants%ROWTYPE;
        v_missing text[]; v_flag text := 'OK'; v_res jsonb;
BEGIN
  v := app.fn_idem_begin('application.submit', p_idem, p_hash);
  IF v IS NOT NULL THEN RETURN v; END IF;
  SELECT * INTO a FROM app.applications WHERE id = p_app FOR UPDATE;            -- rank 3
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  SELECT * INTO ap FROM app.applicants WHERE id = a.applicant_id;
  IF NOT (ap.profile_id = auth.uid() OR (a.assisting_operator_id = auth.uid()
       AND EXISTS (SELECT 1 FROM app.staff_memberships m WHERE m.profile_id=auth.uid()
                   AND m.centre_id=a.centre_id AND m.role_code='operator' AND m.is_active)))
  THEN PERFORM app._nf(); END IF;
  IF a.status <> 'DRAFT' THEN PERFORM app._inv(a.status, 'DRAFT'); END IF;
  IF NOT app.fn_eligibility_eval(ap.dob, ap.gender, ap.district) THEN
    IF a.eligibility_flag = 'REVIEW' THEN v_flag := 'REVIEW';
    ELSE RAISE EXCEPTION 'E.STATE.ELIGIBILITY_FAILED'; END IF;
  END IF;
  SELECT array_agg(dr.document_type_code) INTO v_missing
  FROM app.document_requirements dr
  WHERE dr.stage='APPLICATION' AND dr.is_required
    AND (dr.course_id IS NULL OR dr.course_id = a.course_id)
    AND NOT EXISTS (SELECT 1 FROM app.applicant_documents d
                    JOIN app.document_versions dv ON dv.id = d.current_version_id
                    WHERE d.application_id = a.id AND d.document_type_code = dr.document_type_code
                      AND dv.scan_status = 'CLEAN');
  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'E.VAL.FAILED' USING DETAIL = json_build_object('docs_missing', v_missing)::text;
  END IF;
  UPDATE app.applications SET status='SUBMITTED', submitted_at=now(), eligibility_flag=v_flag,
         submission_snapshot = app.fn_snapshot(a.id), assisting_operator_id = NULL, updated_at=now()
  WHERE id = a.id;
  INSERT INTO app.verification_cases (application_id) VALUES (a.id);
  PERFORM app.fn_audit('application.submitted','application', a.id, NULL, jsonb_build_object('flag', v_flag));
  PERFORM app.fn_outbox('application.submitted','application', a.id, jsonb_build_object('application_id', a.id));
  v_res := jsonb_build_object('status','SUBMITTED','review', v_flag='REVIEW');
  PERFORM app.fn_idem_finish('application.submit', p_idem, v_res);
  RETURN v_res;
END $$;

CREATE OR REPLACE FUNCTION app.fn_admission_finalize(p_app uuid, p_decision text, p_batch uuid,
  p_reason text, p_idem uuid, p_hash text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v jsonb; a app.applications%ROWTYPE; b app.batches%ROWTYPE; v_seats int;
        v_rec record; v_dec text := p_decision; v_reason text := p_reason;
        v_offer uuid; v_rank int; v_res jsonb;
BEGIN
  v := app.fn_idem_begin('admission.finalize', p_idem, p_hash);
  IF v IS NOT NULL THEN RETURN v; END IF;
  PERFORM app._req(p_decision IN ('APPROVED','REJECTED','WAITLISTED'), 'decision');
  IF p_decision IN ('APPROVED','WAITLISTED') THEN
    PERFORM app._req(p_batch IS NOT NULL, 'batch_id');
    SELECT * INTO b FROM app.batches WHERE id = p_batch FOR UPDATE;             -- rank 1 FIRST
    IF NOT FOUND THEN PERFORM app._nf(); END IF;
    PERFORM app._req_staff(b.centre_id, ARRAY['centre_admin']);
  END IF;
  SELECT * INTO a FROM app.applications WHERE id = p_app FOR UPDATE;            -- rank 3
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  PERFORM app._req_staff(a.centre_id, ARRAY['centre_admin']);
  IF a.status NOT IN ('IN_PROCESS','SUBMITTED') THEN PERFORM app._inv(a.status,'IN_PROCESS'); END IF;
  SELECT co.recommendation, co.recorded_by INTO v_rec
  FROM app.counselling_outcomes co JOIN app.counselling_appointments ca ON ca.id = co.appointment_id
  WHERE ca.application_id = a.id ORDER BY co.created_at DESC LIMIT 1;
  IF v_rec IS NULL THEN PERFORM app._inv('NO_RECOMMENDATION','counselling outcome'); END IF;
  IF v_rec.recorded_by = auth.uid() THEN RAISE EXCEPTION 'E.AUTHZ.FORBIDDEN'; END IF;  -- two-step C11
  IF p_decision = 'REJECTED' THEN PERFORM app._req(coalesce(p_reason,'') <> '', 'reason'); END IF;
  IF p_decision = 'APPROVED' THEN
    SELECT b.capacity
      - (SELECT count(*) FROM app.enrolments e WHERE e.batch_id=b.id AND e.status IN ('ENROLLED','ACTIVE'))
      - (SELECT count(*) FROM app.admission_offers o WHERE o.batch_id=b.id AND o.status='SENT' AND o.expires_at>now())
    INTO v_seats;
    IF v_seats <= 0 THEN v_dec := 'WAITLISTED'; v_reason := 'BATCH_FULL'; END IF;      -- J-8
  END IF;
  -- PHASE2-FIX (runtime-exposed): the original nested CASE resolved the inner
  -- all-NULL CASE to text, making the whole expression uuid-vs-text and the INSERT
  -- unplannable ("CASE types text and uuid cannot be matched"). This statement had
  -- never successfully executed before the first real run. Semantics unchanged:
  -- batch recorded only for APPROVED decisions.
  INSERT INTO app.admission_decisions (application_id, decision, batch_id, reason, decided_by)
  VALUES (a.id, v_dec, CASE WHEN v_dec='APPROVED' THEN p_batch END, v_reason, auth.uid());
  IF v_dec = 'APPROVED' THEN
    INSERT INTO app.admission_offers (application_id, batch_id, expires_at)
    VALUES (a.id, p_batch, now() + make_interval(days => coalesce(app.fn_config_int('offer_expiry_days'),7)))
    RETURNING id INTO v_offer;
  ELSIF v_dec = 'WAITLISTED' THEN
    SELECT coalesce(max(rank),0)+1 INTO v_rank FROM app.waitlist_entries
     WHERE batch_id = p_batch AND status='ACTIVE';
    INSERT INTO app.waitlist_entries (application_id, batch_id, rank) VALUES (a.id, p_batch, v_rank);
  END IF;
  UPDATE app.applications SET status='DECIDED', updated_at=now() WHERE id = a.id;
  PERFORM app.fn_audit('admission.decided','application', a.id, v_reason, jsonb_build_object('decision', v_dec));
  PERFORM app.fn_outbox('decision.' || lower(v_dec), 'application', a.id,
                        jsonb_build_object('offer_id', v_offer, 'rank', v_rank));
  v_res := jsonb_build_object('decision', v_dec, 'offer_id', v_offer, 'rank', v_rank);
  PERFORM app.fn_idem_finish('admission.finalize', p_idem, v_res);
  RETURN v_res;
END $$;

CREATE OR REPLACE FUNCTION app.fn_waitlist_promote(p_batch uuid, p_idem uuid, p_hash text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v jsonb; b app.batches%ROWTYPE; v_seats int; e app.waitlist_entries%ROWTYPE; v_res jsonb;
        v_old_dec uuid; v_new_dec uuid;
BEGIN
  v := app.fn_idem_begin('waitlist.promote', p_idem, p_hash);
  IF v IS NOT NULL THEN RETURN v; END IF;
  SELECT * INTO b FROM app.batches WHERE id = p_batch FOR UPDATE;               -- rank 1
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  IF auth.uid() IS NOT NULL THEN PERFORM app._req_staff(b.centre_id, ARRAY['centre_admin']); END IF;
  SELECT b.capacity
    - (SELECT count(*) FROM app.enrolments WHERE batch_id=b.id AND status IN ('ENROLLED','ACTIVE'))
    - (SELECT count(*) FROM app.admission_offers WHERE batch_id=b.id AND status='SENT' AND expires_at>now())
  INTO v_seats;
  IF v_seats <= 0 THEN
    v_res := jsonb_build_object('promoted', false, 'why','no_seats');
  ELSE
    SELECT * INTO e FROM app.waitlist_entries WHERE batch_id=b.id AND status='ACTIVE'
    ORDER BY rank FOR UPDATE SKIP LOCKED LIMIT 1;                               -- rank 3, K-6
    IF NOT FOUND THEN v_res := jsonb_build_object('promoted', false, 'why','empty');
    ELSE
      UPDATE app.waitlist_entries SET status='PROMOTED', updated_at=now() WHERE id=e.id;
      INSERT INTO app.waitlist_moves (entry_id, from_rank, to_rank, reason, moved_by)
      VALUES (e.id, e.rank, NULL, 'PROMOTED', auth.uid());
      -- PHASE2-FIX (runtime-exposed): the original writable-CTE inserted the new
      -- current decision (superseded_by NULL) while the old current row still held
      -- NULL, violating ux_decision_current — promotion had NEVER been executable.
      -- The FK on superseded_by is immediate, so the new row briefly points at the
      -- old decision, the old row is superseded, then the new row becomes current.
      -- Each intermediate state satisfies the partial-unique invariant.
      SELECT ad.id INTO v_old_dec FROM app.admission_decisions ad
       WHERE ad.application_id = e.application_id AND ad.superseded_by IS NULL;
      INSERT INTO app.admission_decisions (application_id, decision, batch_id, reason,
                                           decided_by, supersedes_note, superseded_by)
      VALUES (e.application_id, 'APPROVED', b.id, 'WAITLIST_PROMOTION',
              coalesce(auth.uid(), (SELECT decided_by FROM app.admission_decisions
                WHERE application_id=e.application_id ORDER BY created_at LIMIT 1)), true,
              v_old_dec)
      RETURNING id INTO v_new_dec;
      IF v_old_dec IS NOT NULL THEN
        UPDATE app.admission_decisions SET superseded_by = v_new_dec WHERE id = v_old_dec;
      END IF;
      UPDATE app.admission_decisions SET superseded_by = NULL WHERE id = v_new_dec;
      INSERT INTO app.admission_offers (application_id, batch_id, expires_at)
      VALUES (e.application_id, b.id,
              now() + make_interval(days => coalesce(app.fn_config_int('offer_expiry_days'),7)));
      PERFORM app.fn_audit('waitlist.promoted','application', e.application_id, NULL,
                           jsonb_build_object('rank', e.rank));
      PERFORM app.fn_outbox('waitlist.promoted','application', e.application_id, '{}'::jsonb);
      v_res := jsonb_build_object('promoted', true, 'application_id', e.application_id);
    END IF;
  END IF;
  PERFORM app.fn_idem_finish('waitlist.promote', p_idem, v_res);
  RETURN v_res;
END $$;

CREATE OR REPLACE FUNCTION app.fn_hostel_allocate(p_request uuid, p_bed uuid, p_idem uuid, p_hash text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v jsonb; bed app.beds%ROWTYPE; req app.hostel_requests%ROWTYPE; v_centre uuid; v_res jsonb;
BEGIN
  v := app.fn_idem_begin('hostel.allocate', p_idem, p_hash);
  IF v IS NOT NULL THEN RETURN v; END IF;
  SELECT * INTO bed FROM app.beds WHERE id = p_bed FOR UPDATE;                  -- rank 2 first
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  SELECT hb.centre_id INTO v_centre FROM app.rooms r JOIN app.hostel_blocks hb ON hb.id=r.block_id
  WHERE r.id = bed.room_id;
  PERFORM app._req_staff(v_centre, ARRAY['hostel_manager','centre_admin']);
  IF bed.status <> 'AVAILABLE' THEN RAISE EXCEPTION 'E.CONFLICT.ALREADY_ACTIVE'; END IF;
  SELECT * INTO req FROM app.hostel_requests WHERE id = p_request FOR UPDATE;   -- rank 3
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  IF req.status NOT IN ('APPROVED','QUEUED') THEN PERFORM app._inv(req.status,'APPROVED|QUEUED'); END IF;
  INSERT INTO app.hostel_allocations (bed_id, enrolment_id) VALUES (bed.id, req.enrolment_id);
  UPDATE app.beds SET status='OCCUPIED', updated_at=now() WHERE id = bed.id;
  UPDATE app.hostel_requests SET status='ALLOCATED', updated_at=now() WHERE id = req.id;
  PERFORM app.fn_audit('hostel.allocated','enrolment', req.enrolment_id, NULL,
                       jsonb_build_object('bed', bed.id));
  PERFORM app.fn_outbox('hostel.allocation_update','enrolment', req.enrolment_id, '{}'::jsonb);
  v_res := jsonb_build_object('allocated', true);
  PERFORM app.fn_idem_finish('hostel.allocate', p_idem, v_res);
  RETURN v_res;
END $$;

CREATE OR REPLACE FUNCTION app.fn_claim_assisted(p_idem uuid, p_hash text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v jsonb; v_phone text; ap app.applicants%ROWTYPE; v_res jsonb;
BEGIN
  v := app.fn_idem_begin('applicant.claim', p_idem, p_hash);
  IF v IS NOT NULL THEN RETURN v; END IF;
  SELECT phone INTO v_phone FROM app.profiles WHERE id = auth.uid();
  SELECT * INTO ap FROM app.applicants
  WHERE phone = v_phone AND profile_id IS NULL FOR UPDATE;                      -- rank 3, K-8
  IF NOT FOUND THEN PERFORM app._nf(); END IF;                                  -- loser of race too
  UPDATE app.applicants SET profile_id = auth.uid(), updated_at=now() WHERE id = ap.id;
  PERFORM app.fn_audit('applicant.claimed','applicant', ap.id, NULL,
                       jsonb_build_object('channel', ap.created_channel));
  PERFORM app.fn_outbox('applicant.claimed','applicant', ap.id, '{}'::jsonb);
  v_res := jsonb_build_object('applicant_id', ap.id);
  PERFORM app.fn_idem_finish('applicant.claim', p_idem, v_res);
  RETURN v_res;
END $$;

CREATE OR REPLACE FUNCTION app.fn_cert_issue(p_enrolment uuid, p_idem uuid, p_hash text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v jsonb; e app.enrolments%ROWTYPE; v_centre uuid; v_no text; v_code text;
        v_try int := 0; v_id uuid; v_res jsonb;
BEGIN
  v := app.fn_idem_begin('cert.issue', p_idem, p_hash);
  IF v IS NOT NULL THEN RETURN v; END IF;
  SELECT * INTO e FROM app.enrolments WHERE id = p_enrolment FOR UPDATE;        -- rank 3
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  SELECT b.centre_id INTO v_centre FROM app.batches b WHERE b.id = e.batch_id;
  PERFORM app._req_staff(v_centre, ARRAY['centre_admin']);
  IF e.status <> 'COMPLETED' OR NOT app.fn_assessment_passed(e.id) THEN
    PERFORM app._inv(e.status, 'COMPLETED+PASS');
  END IF;
  v_no := app.fn_next_cert_no(v_centre);
  LOOP
    v_try := v_try + 1; v_code := app.fn_random_code(16);
    BEGIN
      INSERT INTO app.certificates (enrolment_id, certificate_no, verify_code, issued_by)
      VALUES (e.id, v_no, v_code, auth.uid()) RETURNING id INTO v_id;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF EXISTS (SELECT 1 FROM app.certificates WHERE enrolment_id=e.id AND status='ISSUED')
      THEN RAISE EXCEPTION 'E.CONFLICT.ALREADY_ACTIVE'; END IF;
      IF v_try >= 5 THEN RAISE EXCEPTION 'E.SRV.INTERNAL'; END IF;
    END;
  END LOOP;
  PERFORM app.fn_audit('certificate.issued','enrolment', e.id, NULL, jsonb_build_object('cert', v_id));
  PERFORM app.fn_outbox('certificate.issued','enrolment', e.id, jsonb_build_object('cert', v_id));
  v_res := jsonb_build_object('certificate_id', v_id, 'certificate_no', v_no, 'verify_code', v_code);
  PERFORM app.fn_idem_finish('cert.issue', p_idem, v_res);
  RETURN v_res;
END $$;

CREATE OR REPLACE FUNCTION app.fn_cert_reissue(p_cert uuid, p_reason text, p_idem uuid, p_hash text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = app, public, pg_temp AS $$
DECLARE v jsonb; c app.certificates%ROWTYPE; v_centre uuid; v_new uuid; v_res jsonb;
BEGIN
  v := app.fn_idem_begin('cert.reissue', p_idem, p_hash);
  IF v IS NOT NULL THEN RETURN v; END IF;
  PERFORM app._req(coalesce(p_reason,'') <> '', 'reason');
  SELECT * INTO c FROM app.certificates WHERE id = p_cert FOR UPDATE;           -- old cert first
  IF NOT FOUND THEN PERFORM app._nf(); END IF;
  SELECT b.centre_id INTO v_centre FROM app.enrolments e JOIN app.batches b ON b.id=e.batch_id
  WHERE e.id = c.enrolment_id;
  PERFORM app._req_staff(v_centre, ARRAY['centre_admin']);
  IF c.status <> 'ISSUED' THEN PERFORM app._inv(c.status, 'ISSUED'); END IF;
  UPDATE app.certificates SET status='REISSUED', reason=p_reason, updated_at=now() WHERE id=c.id;
  INSERT INTO app.certificates (enrolment_id, certificate_no, verify_code, issued_by, supersedes_id)
  VALUES (c.enrolment_id, app.fn_next_cert_no(v_centre), app.fn_random_code(16), auth.uid(), c.id)
  RETURNING id INTO v_new;
  PERFORM app.fn_audit('certificate.reissued','certificate', c.id, p_reason, jsonb_build_object('new', v_new));
  PERFORM app.fn_outbox('certificate.reissued','certificate', c.id, '{}'::jsonb);
  v_res := jsonb_build_object('new_certificate_id', v_new);
  PERFORM app.fn_idem_finish('cert.reissue', p_idem, v_res);
  RETURN v_res;
END $$;
