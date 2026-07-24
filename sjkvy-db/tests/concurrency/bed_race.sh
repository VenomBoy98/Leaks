#!/usr/bin/env bash
# Final-bed race. PHASE2-FIX: the original referenced undefined $R1/$R2, so both
# allocations failed on an empty uuid and the check passed vacuously. Now: the seat
# winner accepts their offer (-> enrolment -> hostel request), both live requests are
# APPROVED, and the two requests genuinely race for the same bed b1.
set -e; DB=${1:-sjkvy_test}
BED='4d000000-0000-0000-0000-0000000000b1'
psql -q "$DB" -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE v_owner uuid; v_offer uuid; v_enrol uuid; v_req uuid;
BEGIN
  SELECT ap.profile_id, o.id INTO v_owner, v_offer
  FROM app.admission_offers o
  JOIN app.applications a ON a.id = o.application_id
  JOIN app.applicants ap ON ap.id = a.applicant_id
  WHERE o.batch_id = 'b0000000-0000-0000-0000-000000000001' AND o.status = 'SENT';
  PERFORM set_config('test.jwt_sub', v_owner::text, true);
  v_enrol := (app.fn_offer_accept(v_offer, gen_random_uuid(), 'h')->>'enrolment_id')::uuid;
  PERFORM app.fn_hostel_request(v_enrol);
  PERFORM set_config('test.jwt_sub', '50000000-0000-0000-0000-0000000000a7', true);
  FOR v_req IN SELECT id FROM app.hostel_requests WHERE status = 'REQUESTED' LOOP
    PERFORM app.fn_hostel_approve(v_req);
  END LOOP;
  PERFORM set_config('test.jwt_sub', '', true);
END $$;
SQL
R1=$(psql -qtA "$DB" -c "SELECT id FROM app.hostel_requests WHERE status='APPROVED' ORDER BY created_at ASC LIMIT 1")
R2=$(psql -qtA "$DB" -c "SELECT id FROM app.hostel_requests WHERE status='APPROVED' ORDER BY created_at DESC LIMIT 1")
alloc(){ psql -qtA "$DB" -c "SELECT app_test.as_user('50000000-0000-0000-0000-0000000000a7');
  SET ROLE authenticated;
  SELECT app.fn_hostel_allocate('$1','$BED',gen_random_uuid(),'h');" 2>&1 || true; }
alloc "$R1" & alloc "$R2" & wait
psql -qtA "$DB" -c "INSERT INTO app_test.results(name,ok,detail)
 SELECT 'bed race: single active allocation on bed',
   (SELECT count(*) FROM app.hostel_allocations WHERE bed_id='$BED' AND released_at IS NULL) = 1, '';"
psql -qtA "$DB" -c "INSERT INTO app_test.results(name,ok,detail)
 SELECT 'bed race: exercised (one ALLOCATED, one still APPROVED)',
   (SELECT count(*) FROM app.hostel_requests WHERE id IN ('$R1','$R2') AND status='ALLOCATED')=1
   AND (SELECT count(*) FROM app.hostel_requests WHERE id IN ('$R1','$R2') AND status='APPROVED')=1, '';"
