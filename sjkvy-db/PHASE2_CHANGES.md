# SJKVY DB — Phase 2 change log (artifact unfreeze)

**Date:** 2026-07-11 · **Environment:** PostgreSQL 16.13 (Ubuntu 24.04), the first
environment in this project able to execute the suite.
**Authorization:** stakeholder instruction to unfreeze the Phase-1 artifacts with
minimal, documented changes, fix the runtime-exposed defects, and iterate to GO.
**Result:** `tests/run_all.sh` → **VERDICT: GO — 65/65 runtime assertions passed**
(exit 0), reproduced on a second fresh database (`sjkvy_verify`). Static gate
(10 checks) and semantic gate (8 checks) also pass. `MANIFEST.sha256` regenerated.

Every change below is marked in-source with a `PHASE2-FIX` comment. The security
architecture is unchanged: FORCE RLS on all 55 tables, deny-by-default grants,
function-mediated writes, definer functions owned by `sjkvy_def` with pinned
`search_path`, no new table grants to `anon`/`authenticated`/`service_role`.

## A. Migration fixes (all runtime-exposed; none reachable by the static gates)

| # | File | Defect | Fix |
|---|---|---|---|
| 1 | `0001_foundation.sql` | **RLS policy recursion (Critical).** SELECT policies embedded raw cross-table EXISTS subqueries; the policy graph contained cycles (`applications ↔ verification_cases`, `students ↔ enrolments`, …) and PostgreSQL aborted most authenticated reads with `infinite recursion detected in policy`. | Added 22 `SECURITY DEFINER` scope helpers (§2, `fn_app_staff`, `fn_owns_enrolment`, `fn_checker_for_app`, …) copying each policy's role list 1:1, and rewrote the 26 affected policies to call them. Converted `fn_is_assigned_checker` from INVOKER to DEFINER (same pattern as the pre-existing `fn_owns_application`). No scope widened; verified post-fix: cross-owner reads 0 rows, cross-centre reads 0 rows. |
| 2 | `0001_foundation.sql` | `v_my_documents` was `security_invoker=true`, so it required caller SELECT on `document_versions` — a grant that intentionally does not exist (SEC-DOC-001). The view could never return version metadata to any client. | View is now definer-owned (same pattern as `v_public_catalog`) with the `p_docs_sel` scope embedded in its WHERE clause. `storage_path` remains unprojected and `document_versions` remains fully closed (re-verified). |
| 3 | `0002_functions_core.sql` | `fn_admission_finalize`: nested `CASE` resolved the inner all-NULL branch to `text`, colliding with `uuid` — the decision INSERT was **unplannable** (`CASE types text and uuid cannot be matched`). Admission finalization had never once executed. | `CASE WHEN v_dec='APPROVED' THEN p_batch END` (type uuid; same semantics: batch recorded only for APPROVED). |
| 4 | `0002_functions_core.sql` | `fn_waitlist_promote`: the writable CTE inserted the new current decision while the old one still had `superseded_by IS NULL`, violating `ux_decision_current` — **promotion had never been executable**. | Three-step supersede inside the same transaction (new row briefly references the old decision, old row superseded, new row made current); every intermediate state satisfies both the partial-unique invariant and the immediate FK. |
| 5 | `0003_functions_remaining.sql` | `fn_hostel_discharge` left the request status `ALLOCATED` — a live status under `ux_hostel_request_live` — so a discharged student could never re-request (breaks invariant E-2). | Discharge now closes the request (`CANCELLED`). |
| 6 | `0003_functions_remaining.sql` | Same defect class in `fn_drop_enrolment` (bed released, request left live). | Drop now closes any live request for the enrolment. |

## B. Test-suite fixes (`tests/plain/`)

The suites had never executed; the first run exposed assertions that were
impossible under the intended security model, plus one ordering defect:

1. **t01** — anon `SELECT FROM app.profiles` errors with `permission denied`
   (no grant exists); the "invisible" check is now an explicit `expect_err`
   asserting the stronger grant-level denial.
2. **t01/t02/t04** — `service_role` and clients hold **no table grants**
   (function-only access model, now runtime-confirmed); fixture ids that tests
   previously fetched via direct sub-selects on closed tables
   (`document_versions`, `domain_events`, `certificates` as anon) are now fetched
   as superuser into psql variables (`\gset`) and passed as literals.
3. **t02→t04 relocation** — t02 completed the only enrolment before t03 ran, making
   t03's trainer red-team normal path structurally impossible
   (`fn_can_mark_attendance` requires ENROLLED/ACTIVE). The enrolment-completion +
   certificate block moved to the top of t04; flow semantics unchanged.
4. **t02** — "same bed second allocation": the function locks/validates the **bed**
   (lock rank 2) before reading the request (rank 3), so the correct error is
   `E.CONFLICT.ALREADY_ACTIVE`, not `E.STATE.INVALID_TRANSITION`.
5. **t03** — the deactivated-trainer attack targeted the only session, which was
   locked, so the attack INSERT selected zero rows and could never raise; a second
   unlocked session is now created before deactivation. The closed-table history
   check (`attendance_corrections`) runs as superuser.
6. **t04** — audit tamper is now attacked as **superuser** (clients/service_role are
   already stopped at the grant layer, proven in run 1; only the trigger backstop
   can stop a superuser, which is what the assertion is for). The cert-reissue check
   was one statement performing the action and asserting post-state — unreliable
   under same-statement snapshot rules — now split into act-then-assert.

## C. Concurrency fixtures rebuilt (`tests/concurrency/`)

First run proved all five races were **vacuous**: `_prep.sql` aborted on an ambiguous
`id` reference, `bed_race.sh` used undefined `$R1/$R2`, `idem_race.sh` an undefined
`$APPB` — every invariant check passed against empty state.

- `_prep.sql`: rewritten; stages **two** competing applications (B and C) through the
  full pipeline to IN_PROCESS + APPROVE recommendation on the capacity-1 batch, plus
  the claim-race fixtures. Actor identity via the `test.jwt_sub` GUC.
- `seat_race.sh`: B vs C race for the final seat.
- `bed_race.sh`: stages the seat winner's enrolment + hostel request, approves both
  live requests, then races two requests for the same bed.
- `waitlist_race.sh`: opens exactly one seat (capacity 2, 1 enrolled) then double-promotes.
- `idem_race.sh`: stages its own submittable DRAFT application, then 5 parallel
  same-key submits.
- **Every race now records an additional "exercised" assertion** (e.g. exactly 1 SENT
  offer + exactly 1 ACTIVE waitlist entry) so a fixture failure can never again
  masquerade as a concurrency pass. All 5 invariant + 5 exercised checks pass.

## D. Explicitly NOT changed

- `0000_schema.sql` — untouched (tables, constraints, partial-unique invariants).
- Role model, grants, EXECUTE lists, `sjkvy_def` ownership DO-block — untouched
  (the new helpers flow through the existing DO-block and receive
  authenticated-EXECUTE like the pre-existing policy helpers; none is anon-executable).
- `ci/static_checks.py`, `ci/semantic_check.py`, `tests/run_all.sh`,
  `tests/plain/00_harness.sql`, `01_seed.sql` — untouched, still green.
- Known-accepted items from Phase 1 remain documented, not "fixed": readable
  `notice_audiences` metadata; `fn_waitlist_promote`'s NULL-uid system path
  (service-role scheduler path; on Supabase `authenticated` always carries a uid);
  API-tier concerns (rate limiting on `fn_cert_verify`, OTP) stay at the API tier.

## E. Verification evidence

- `tests/run_all.sh sjkvy_test` → `TOTAL=65 FAIL=0 VERDICT: GO` (exit 0).
- Reproduced: `tests/run_all.sh sjkvy_verify` → `TOTAL=65 FAIL=0 VERDICT: GO`.
- Post-GO spot-probes: cross-owner 0 rows; cross-centre 0 rows (applications,
  enrolments, certificates); `document_versions` has no client/service grant;
  `v_my_documents` returns only the owner's rows; scope helpers owned by
  `sjkvy_def`, not executable by `anon` (only `fn_cert_verify`/`fn_eligibility_eval`
  are, by design).
- Remaining before production: run this same suite against Supabase staging
  (real `auth.uid()`/JWT/storage semantics) per `ci/gate.md` — unchanged requirement.
