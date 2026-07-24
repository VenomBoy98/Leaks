#!/usr/bin/env bash
# Concurrent same-key submit x5 -> exactly one verification case; replays share response.
# PHASE2-FIX: the original referenced an undefined $APPB (all five calls failed on an
# empty uuid — the exact "unbound fixture var" class the docs claimed was fixed). Now
# stages its own submittable DRAFT application for the claimed applicant, then races.
set -e; DB=${1:-sjkvy_test}; KEY="deadbeef-0000-0000-0000-000000000001"
CLAIMER='c1a10000-0000-0000-0000-000000000001'
APPK=$(psql -qtA "$DB" -c "SELECT set_config('test.jwt_sub','$CLAIMER',false);
  SELECT app.fn_create_self_application('aa000000-0000-0000-0000-000000000001',
    '2000-05-05','F','Hazaribagh',NULL,NULL,'10th')->>'application_id';" | tail -n1)
psql -qtA "$DB" -c "SELECT app.fn_finalize_upload('$CLAIMER','$APPK','MATRIC','q/k1','image/jpeg',1000,'sha')" >/dev/null
DVK=$(psql -qtA "$DB" -c "SELECT dv.id FROM app.document_versions dv
  JOIN app.applicant_documents d ON d.id=dv.document_id WHERE d.application_id='$APPK'")
psql -qtA "$DB" -c "SELECT app.fn_scan_result('$DVK','CLEAN')" >/dev/null
call(){ psql -qtA "$DB" -c "SELECT set_config('test.jwt_sub','$CLAIMER',false);
  SET ROLE authenticated; SELECT app.fn_submit_application('$APPK','$KEY','h');" 2>&1 || true; }
for i in 1 2 3 4 5; do call & done; wait
psql -qtA "$DB" -c "INSERT INTO app_test.results(name,ok,detail)
 SELECT 'idem race: exactly one case for the racing app (workers=5)',
   (SELECT count(*) FROM app.verification_cases WHERE application_id='$APPK') = 1, '';"
psql -qtA "$DB" -c "INSERT INTO app_test.results(name,ok,detail)
 SELECT 'idem race: key recorded DONE exactly once',
   (SELECT count(*) FROM app.idempotency_keys WHERE key='$KEY' AND op='application.submit' AND status='DONE') = 1, '';"
