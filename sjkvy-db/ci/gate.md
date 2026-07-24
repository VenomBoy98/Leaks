# CI Database Security Gate (vendor-agnostic)
Execution order — any failure blocks deployment:
1. MIGRATION: apply 0000→0003 on scratch PG15 + Supabase-staging shadow; failure ⇒ FAIL.
2. STATIC: checks in ci/static_checks.py (definer/search_path pairing, grant coverage,
   no config literals, catalogue completeness, $$ balance).
3. PRIVILEGE/RLS (pgTAP + plain): anon/authenticated visibility, cross-owner, cross-centre,
   assignment scope, document path denial, audit append-only, read_at set-once.
4. STATE-MACHINE: invalid/stale transition rejections (t01/t02/t03 expect_err set).
5. INVARIANT: partial-unique probes (active application, active cert, bed/enrolment allocation,
   waitlist rank, assignment active).
6. CONCURRENCY (level-2, real parallel sessions): seat_race, bed_race, idem_race,
   waitlist double-promote, claim race. pgTAP alone is NOT accepted as concurrency proof.
7. REGRESSION: rerun full suite on every migration PR; new policies require new tests.
Environments: scratch Postgres for 1–5; Supabase staging (real auth.uid()/JWT/storage) for 3,6
before production promotion. Session-revocation and signed-URL flows are staging-only tests.
