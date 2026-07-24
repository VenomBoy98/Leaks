#!/usr/bin/env bash
# Waitlist double-promote race. PHASE2-FIX: the original ran while the batch was full,
# so no promotion could ever occur and the check was vacuous. Capacity is raised to 2
# (1 enrolled -> exactly ONE free seat); two parallel promotes must yield exactly one
# promotion and no overbook.
set -e; DB=${1:-sjkvy_test}
B='b0000000-0000-0000-0000-000000000001'
psql -qtA "$DB" -c "UPDATE app.batches SET capacity=2 WHERE id='$B'"
prom(){ psql -qtA "$DB" -c "SELECT set_config('test.jwt_sub','50000000-0000-0000-0000-0000000000a4',false);
  SET ROLE authenticated; SELECT app.fn_waitlist_promote('$B',gen_random_uuid(),'h');" 2>&1 || true; }
prom & prom & wait
psql -qtA "$DB" -c "INSERT INTO app_test.results(name,ok,detail)
 SELECT 'waitlist race: no overbook via promotion (workers=2)',
   (SELECT count(*) FROM app.enrolments WHERE batch_id='$B' AND status IN ('ENROLLED','ACTIVE'))
   +(SELECT count(*) FROM app.admission_offers WHERE batch_id='$B' AND status='SENT' AND expires_at>now())
   <= (SELECT capacity FROM app.batches WHERE id='$B'), '';"
psql -qtA "$DB" -c "INSERT INTO app_test.results(name,ok,detail)
 SELECT 'waitlist race: exercised (exactly one promotion)',
   (SELECT count(*) FROM app.waitlist_entries WHERE batch_id='$B' AND status='PROMOTED')=1
   AND (SELECT count(*) FROM app.waitlist_entries WHERE batch_id='$B' AND status='ACTIVE')=0, '';"
