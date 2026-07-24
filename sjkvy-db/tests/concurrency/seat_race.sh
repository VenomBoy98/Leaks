#!/usr/bin/env bash
# Final-seat race. PHASE2-FIX: two DISTINCT applications (B and C, staged by _prep.sql)
# now compete for the last seat of the capacity-1 batch; the original raced one
# application against itself and, after the _prep abort, ran with no fixture at all.
# Invariant SEC-CONC-001: enrolled + live SENT offers <= capacity; exactly one winner.
set -e; DB=${1:-sjkvy_test}
B='b0000000-0000-0000-0000-000000000001'
APPB=$(psql -qtA "$DB" -c "SELECT a.id FROM app.applications a JOIN app.applicants ap ON ap.id=a.applicant_id WHERE ap.profile_id='a0000000-0000-0000-0000-00000000000b' AND a.status='IN_PROCESS'")
APPC=$(psql -qtA "$DB" -c "SELECT a.id FROM app.applications a JOIN app.applicants ap ON ap.id=a.applicant_id WHERE ap.profile_id='a0000000-0000-0000-0000-00000000000c' AND a.status='IN_PROCESS'")
run(){ psql -qtA "$DB" -c "SELECT set_config('test.jwt_sub','50000000-0000-0000-0000-0000000000a4',false);
  SET ROLE authenticated;
  SELECT app.fn_admission_finalize('$1','APPROVED','$B',NULL,gen_random_uuid(),'h');" 2>&1 || true; }
run "$APPB" & run "$APPC" & wait
psql -qtA "$DB" -c "INSERT INTO app_test.results(name,ok,detail)
 SELECT 'seat race: no overbook (workers=2)',
   ((SELECT count(*) FROM app.enrolments WHERE batch_id='$B' AND status IN ('ENROLLED','ACTIVE'))
   +(SELECT count(*) FROM app.admission_offers WHERE batch_id='$B' AND status='SENT' AND expires_at>now()))
   <= (SELECT capacity FROM app.batches WHERE id='$B'),
   'offers+enrolled vs capacity';"
# non-vacuous: both workers must have completed a real finalize — one offer, one waitlisted
psql -qtA "$DB" -c "INSERT INTO app_test.results(name,ok,detail)
 SELECT 'seat race: exercised (1 offer SENT + 1 waitlisted ACTIVE)',
   (SELECT count(*) FROM app.admission_offers WHERE batch_id='$B' AND status='SENT')=1
   AND (SELECT count(*) FROM app.waitlist_entries WHERE batch_id='$B' AND status='ACTIVE')=1,
   'proves the race actually ran';"
