#!/usr/bin/env bash
# Assisted-claim race. Workers: 2 sessions, same profile, claim same unclaimed applicant.
# Invariant SEC-CONC-004: profile_id set once; loser gets NOT_FOUND (non-leak).
# PHASE2-FIX: assertion strengthened from "<= 1" to "= 1 linked to the claimer" so a
# fixture failure (as in the first run, where _prep aborted) can no longer pass silently.
set -e; DB=${1:-sjkvy_test}
claim(){ psql -qtA "$DB" -c "SELECT set_config('test.jwt_sub','c1a10000-0000-0000-0000-000000000001',false);
  SET ROLE authenticated; SELECT app.fn_claim_assisted(gen_random_uuid(),'h');" 2>&1 || true; }
claim & claim & wait
psql -qtA "$DB" -c "INSERT INTO app_test.results(name,ok,detail)
 SELECT 'claim race: applicant linked exactly once (workers=2)',
   (SELECT count(*) FROM app.applicants
    WHERE phone='+91CLAIM00001'
      AND profile_id='c1a10000-0000-0000-0000-000000000001') = 1, '';"
