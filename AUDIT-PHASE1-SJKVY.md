# SJKVY Platform — Phase 1 Repository Audit

**Date:** 2026-07-11
**Artifact audited:** uploaded archive `fc1d10fe-sjkvydb.zip` → `sjkvy-db/` (31 files, ~332 KB)
**Runtime used:** PostgreSQL 16.13 (Ubuntu 24.04), python 3.12 — this is the **first environment in the project's history able to execute the suite**, and it was executed.
**Manifest integrity:** `python3 verify_manifest.py` → `OK=30 MISMATCH=0 MISSING=0` (byte-exact per `SYNC_README.md` transfer rule). Verified before any other action.

---

## 1. Executive summary

The upload contains **only the database workspace** (`sjkvy-db/`) of the SJKVY platform. It is real, substantial, and internally consistent: 4 migrations (2,252 lines) creating 55 tables, 48 RLS policies, 91 functions and 10 triggers; 4 plain-SQL test suites; 5 concurrency race scripts; static + semantic CI gates; a manifest integrity check. The frontend, portals, API server, OpenAPI contract, service adapter and mock layer described in the project brief are **absent from this upload** (see §2).

Three headline results, all from actual execution in this session:

1. **Migrations 0000→0003 apply cleanly on real PostgreSQL 16** (first time ever verified at runtime), and both CI gates (`ci/static_checks.py`, `ci/semantic_check.py`) pass.
2. **The runtime test verdict is NO-GO: 24/39 recorded assertions passed, 15 failed** (`tests/run_all.sh`, full log preserved). The project's own prior documents predicted this possibility — every previous session was blocked from running anything ("Zero database tests were executed, because zero can be" — `EXECUTION_STATUS.md`).
3. **Root cause of most failures is one architectural defect: RLS policy recursion.** The SELECT policies in `migrations/0001_foundation.sql` form reference cycles (`applications ↔ verification_cases`, `students ↔ enrolments`, etc.). PostgreSQL aborts with `infinite recursion detected in policy` on **most authenticated direct reads**, including an applicant reading her own application. The write plane (SECURITY DEFINER functions) is unaffected and works. Additionally, **all five concurrency race checks "passed" vacuously** — their fixtures failed to build, so no race was actually exercised; concurrency safety remains unverified.

No committed secrets were found (`.env.example` is placeholders only — verified by reading it). No security *weakening* is needed or was performed; no repository file was modified (frozen-artifact rule respected).

---

## 2. Repository identity verification (requested checklist)

| Expected component | Status in upload | Evidence |
|---|---|---|
| React/Vite/TypeScript frontend workspace | **ABSENT** | no `package.json`, no `src/` anywhere in archive |
| Applicant / Student / Staff / Centre-Admin portal prototypes | **ABSENT** | — |
| PostgreSQL schema + migrations ~0000–0006 | **PARTIAL** | `migrations/0000_schema.sql` … `0003_functions_remaining.sql` exist; **0004–0006 do not exist** in this artifact |
| RLS/security policies | **PRESENT** | 48 policies in `0001_foundation.sql` (runtime-counted in `pg_policies`) |
| Database functions | **PRESENT** | 91 functions in schema `app` (runtime-counted) |
| SQL tests | **PRESENT** | `tests/plain/t01–t04`, harness, seed |
| Concurrency test infrastructure | **PRESENT** (defective — §7) | `tests/concurrency/*.sh` + `_prep.sql` |
| Manifest/static/semantic checks | **PRESENT** | `verify_manifest.py`, `ci/static_checks.py`, `ci/semantic_check.py` |
| API server skeleton | **ABSENT** | — |
| OpenAPI contract | **ABSENT** (op-IDs exist only as comments in SQL and in `ci/static_checks.py`'s 65-op map) |
| Typed frontend service adapter | **ABSENT** | — |
| Mock service implementation | **ABSENT** | — |

**Interpretation (inference):** this artifact is the "sjkvy-db" sub-project referenced by the docs; the frontend/API workspaces live elsewhere and were not provided. Audit sections that require them (frontend feature matrix, portal matrix, mock-to-real map, design/motion, responsive/accessibility) are recorded as **blocked pending those artifacts** rather than guessed at.

Also verified: `VenomBoy98/Leaks` remains unrelated (still only README/LICENSE/.gitignore) and was **not** used for any SJKVY work, per instruction.

## 3. Architecture map (verified)

```
sjkvy-db/
├── migrations/
│   ├── 0000_schema.sql              391 ln — 55 tables, indexes, partial-unique invariants
│   ├── 0001_foundation.sql          448 ln — roles, helpers, triggers, RLS enable+FORCE, 48 policies, grants, 3 views
│   ├── 0002_functions_core.sql      376 ln — sjkvy_def grants, workers, doc boundary, 6 high-risk fns
│   └── 0003_functions_remaining.sql 1037 ln — full 65-op function catalogue + ownership/EXECUTE DO-block
├── tests/
│   ├── plain/00_harness.sql         Supabase stub: anon/authenticated/service_role roles, auth.uid() ← GUC test.jwt_sub
│   ├── plain/01_seed.sql            deterministic fixtures (2 centres, 1 course/batch, 11 actors, hostel, settings)
│   ├── plain/t01_security.sql       RLS visibility, non-leak, grants, idempotency, documents
│   ├── plain/t02_flows.sql          counselling→admission→offer→enrolment→hostel→certificates
│   ├── plain/t03_attendance_redteam.sql  11-attack trainer red team
│   ├── plain/t04_comm_audit.sql     outbox dedupe, read_at set-once, audit tamper, export/config
│   ├── concurrency/{_prep.sql, seat|bed|waitlist|claim|idem_race.sh}
│   ├── pgtap/example_rls.sql        4-assertion pgTAP sample (CI mirror)
│   ├── run_all.sh                   gate → fresh DB → migrate → seed → L1 → L2 → machine verdict
│   └── RUN_IN_REAL_PG.md            turnkey execution incl. Docker one-liner
├── ci/{gate.md, static_checks.py, semantic_check.py}
├── verify_manifest.py + MANIFEST.sha256 (30 files)
├── .env.example                     placeholders only (Supabase URL/keys/PG vars) — no real secrets
└── *.md status docs                 EXECUTION_STATUS, RUNTIME_EXECUTION_REPORT, PHASE_EXECUTION_VERDICT,
                                     PHASE_STAGING_ATTEMPT, PHASE1_ENV, SYNC_README
```

Build/lint/typecheck commands: none (no application code). Test command: `./tests/run_all.sh <db>` (requires PG 15+ binaries on PATH). Deployment files: none beyond `ci/gate.md` (process doc).

## 4. Database architecture summary (Section C)

**Domains and key tables** (all in schema `app`, `0000_schema.sql`):

- **Identity/staff:** `profiles`, `roles` (8 seeded codes: operator, checker, counsellor, trainer, hostel_manager, placement, centre_admin, super_admin), `centres`, `staff_memberships` (UNIQUE profile+centre+role)
- **Catalogue:** `courses`, `course_versions`, `batches` (status PLANNED→OPEN→RUNNING→COMPLETED/CANCELLED; capacity CHECK > 0)
- **Application:** `applicants` (partial-unique unclaimed phone `ux_applicants_unclaimed_phone`), `applications` (status DRAFT→SUBMITTED→IN_PROCESS→DECIDED→CLOSED / WITHDRAWN / EXPIRED; **one active application per applicant** via `ux_applications_active`)
- **Documents:** `document_types`, `document_requirements`, `applicant_documents`, `document_versions` (`storage_path` lives here; **no client SELECT policy at all** — deliberate, SEC-DOC-001)
- **Verification:** `verification_cases` (single case per application), `verification_assignments` (one active via `ux_assignment_active`), `verification_decisions`, `correction_requests`
- **Counselling/admission:** `counselling_appointments/outcomes`, `admission_decisions` (supersede chain, one current via `ux_decision_current`), `admission_offers` (one live SENT per application), `waitlist_entries` (`ux_waitlist_rank` on batch+rank WHERE ACTIVE), `waitlist_moves`
- **Enrolment/academics:** `students`, `enrolments`, `enrolment_transfers`, `class_sessions` (lockable), `attendance` (UNIQUE session+enrolment), `attendance_corrections`, `assessments`, `assessment_results`
- **Certificates:** `certificates` — one ISSUED per enrolment (`ux_cert_active`), reissue supersede chain, public `verify_code`
- **Hostel:** `hostel_blocks/rooms/beds`, `hostel_requests` (one live via `ux_hostel_request_live`), `hostel_allocations` (**bed and enrolment each at most one active allocation** via `ux_alloc_bed_active` / `ux_alloc_enrol_active`), `hostel_transfers`
- **Placement:** `placement_profiles` (consent_at NOT NULL, withdrawable), `employers`, `job_opportunities`, `placement_referrals`, `placement_outcomes`
- **Engagement:** `notices` + `notice_audiences` (PUBLIC/APPLICANTS/STUDENTS/BATCH), `events`, `event_participation`
- **Infra:** `domain_events` (outbox), `notifications` (dedupe_key UNIQUE), `delivery_attempts`, `audit_events` (append-only), `system_settings`, `eligibility_rules`, `idempotency_keys` (PK op+actor+key), `export_jobs`

**Operations intentionally implemented as database functions** — the API must call these, never re-implement them (traceability map: `ci/static_checks.py` lines 87–119, **65 ops → 65 functions, verified complete by the executed gate**). Highlights:

- Application: `fn_create_self_application`, `fn_create_assisted_application`, `fn_save_draft`, `fn_submit_application` (idempotent), `fn_withdraw_application`, `fn_claim_assisted`
- Verification: `fn_assign_checker`, `fn_reassign_checker`, `fn_decide_document`, `fn_request_correction`, `fn_resubmit_corrections`, `fn_fail_verification`
- Counselling: `fn_counsel_schedule/reschedule/no_show/outcome`
- Admission/seats: `fn_admission_finalize` (locks batch **before** application — documented lock-rank discipline; auto-waitlists on BATCH_FULL; enforces recommender ≠ finalizer two-step), `fn_waitlist_promote` (`FOR UPDATE SKIP LOCKED`), `fn_offer_accept/decline`, `fn_jobs_expire_offers/drafts`
- Enrolment: `fn_confirm_joining`, `fn_mark_not_joined`, `fn_transfer_enrolment`, `fn_complete_enrolment`, `fn_drop_enrolment` (releases hostel bed)
- Attendance: direct-write policies for trainers (`p_att_ins_trainer`/`p_att_upd_trainer` + `fn_can_mark_attendance`), `fn_lock_attendance`, `fn_correct_attendance` (post-lock, history row)
- Hostel: `fn_hostel_request/cancel/approve/allocate/transfer/discharge`, `fn_set_bed_status` (bed locked at rank 2, ascending-id ordering on transfer)
- Certificates: `fn_cert_issue` (COMPLETED + `fn_assessment_passed` gate, retry loop on code collision), `fn_cert_reissue`, `fn_cert_revoke`, `fn_cert_verify` (**anon-callable, fixed minimal projection, uniform `{valid:false}`**)
- Documents: `fn_finalize_upload`, `fn_scan_result`, `fn_authorize_doc_view` (path released only to service role, viewer audited — SEC-DOC-003/004)
- Governance: `fn_staff_register`, `fn_membership_grant/revoke`, `fn_staff_deactivate`, `fn_config_set` (super_admin only), `fn_export_create`, `fn_audit_query` (centre-scoped)
- Infra: `fn_idem_begin/finish/purge` (row-lock serialized idempotency), `fn_audit` (PII-scrubbing regex on summary), `fn_outbox` (strips phone/dob/storage_path), `fn_outbox_claim`, `fn_notification_enqueue` (dedupe), `fn_delivery_record`

## 5. Security architecture summary + trust boundary map (Section D)

**Trust boundaries (as designed — API/storage tiers not present in artifact):**

```
anon (browser, unauthenticated)      → v_public_catalog (definer-owned view), fn_cert_verify, fn_eligibility_eval — nothing else
authenticated (browser, JWT)         → RLS-scoped SELECTs + 4 narrow column-limited direct writes
                                       + EXECUTE on user-facing definer functions (auth re-checked inside each)
service_role (server only)           → EXECUTE on 13 [SYS] functions (doc pipeline, outbox, jobs, staff bootstrap)
sjkvy_def (NOLOGIN BYPASSRLS)        → owns every function; the only role with broad table DML
PostgreSQL                           → 55/55 tables ENABLE + FORCE ROW LEVEL SECURITY (runtime-verified count)
Object storage / signed URLs         → outside SQL; path gate = fn_authorize_doc_view (not in artifact scope)
```

**Verified strengths (runtime-confirmed where noted):**
- Deny-by-default: `REVOKE ALL … FROM PUBLIC, anon, authenticated` (0001 §1); 15 tables intentionally have **no** client policy (audit, outbox, idempotency, settings, transfers, corrections, `document_versions`…)
- Runtime-passed assertions: applicant cannot update `centre_id` (no column grant), cannot self-grant roles, cannot INSERT into `audit_events`, cannot SELECT `document_versions` (storage paths unreachable), `marked_by` forge denied, locked/deactivated-trainer attendance writes blocked, duplicate active application blocked, config is super-admin-only, CAD audit queries centre-scoped, public cert verify uniform-false for unknown codes
- Every SECURITY DEFINER function pins `search_path = app, public, pg_temp` (static gate, executed, PASS) and ownership+EXECUTE grants are set by the 0003 DO block over `pg_proc` (applied cleanly at runtime)
- Audit append-only trigger `tg_audit_appendonly`; `fn_audit` scrubs `otp|aadhaar|password|secret|path|phone` keys; outbox payloads strip `phone/dob/storage_path`
- No committed secrets: `.env.example` contains placeholders only

**Defects and gaps found (see §6–7 for evidence):**

| # | Severity | Finding | Class |
|---|---|---|---|
| S1 | **Critical** | RLS SELECT-policy graph contains cycles → `infinite recursion` errors on most authenticated reads (details §6). The data is not leaked — it is *unreadable*, i.e., availability failure of the entire authenticated read plane. | Verified fact (runtime) |
| S2 | High | `service_role` receives **no table grants** in any migration (only EXECUTE on [SYS] fns). The Supabase assumption that service_role can read/write tables directly is false for custom schema `app` unless granted. Tests t01/t04 assume it. Decide: either grant (matching Supabase semantics) or redesign tests/server access to be function-only. | Verified fact (runtime `permission denied` as service_role) |
| S3 | Medium | Concurrency invariants (seat/bed/waitlist/claim/idem races) are **unproven**: all five "passes" were vacuous because fixtures failed (§7). The locking design reads correctly (lock-rank comments, SKIP LOCKED, partial uniques as backstop) — but rule 10 of this audit forbids claiming runtime proof, and there is none yet. | Verified fact |
| S4 | Low | `fn_cert_verify` (anon) returns `holder_name` for any guessed-valid 16-char code. Codes are high-entropy (`gen_random_bytes(24)` base64), so brute force is impractical; rate limiting is delegated to the absent API tier. Acceptable by design, but must be rate-limited at the API. | Inference/recommendation |
| S5 | Low | `notice_audiences` SELECT policy is `USING (true)` for all authenticated (targeting metadata visible) — documented as known-accepted in `EXECUTION_STATUS.md` §C. | Verified fact, accepted |
| S6 | Info | `fn_waitlist_promote` skips the staff check when `auth.uid()` IS NULL (system path). Under the harness, an authenticated role with no JWT GUC set could call it without the centre_admin check. On Supabase, `authenticated` always carries a uid, so exploitability is environment-dependent. Worth an explicit guard. | Inference |
| S7 | Info | Missing rate-limit/OTP/input-length concerns are API-tier responsibilities; API absent, so **open** by definition. | Unknown/blocked |

## 6. Runtime execution results — Level 1 (Section E, executed)

Command: `sudo -u postgres env PATH=/usr/lib/postgresql/16/bin:$PATH bash tests/run_all.sh sjkvy_test`
Result: readiness gates PASS → 4 migrations apply cleanly → seed OK → **TOTAL=39 FAIL=15 → `VERDICT: NO-GO`** (exit 2). Full log: `scratchpad/run_all_full.log`.

### 6.1 The recursion defect (root cause of ~9 failures + many unrecorded aborts)

Empirical read matrix as applicant A (`SET ROLE authenticated` + `auth.uid()` stub):

- **Recurse (ERROR):** `applications`, `applicants`, `applicant_documents`, `v_my_documents`, `admission_offers`, `verification_cases`, `enrolments`, `students`, `class_sessions`, `assessments`, `assessment_results`, `attendance`, `certificates`, `hostel_requests`, `notices`
- **Work:** `profiles` (own), `staff_memberships`, `centres`, `courses`, `batches`, `waitlist_entries`, `notifications`, `v_public_catalog`

Cycle edges (all in `0001_foundation.sql`): `p_applications_sel` embeds `EXISTS(… verification_cases …)` and calls `fn_is_assigned_checker` (SECURITY **INVOKER**, reads `verification_assignments`); `p_vcases_sel` embeds `EXISTS(… applications …)`; `p_vassign_sel` embeds `verification_cases JOIN applications`; `p_students_sel` ↔ `p_enrol_sel` reference each other's tables. PostgreSQL detects the cycle at plan time and aborts.

**Proof of the fix pattern already in the codebase:** `waitlist_entries` policy uses the SECURITY **DEFINER** helper `fn_owns_application` for its applications-side check — and `waitlist_entries` reads work. The repair (Phase 2, not performed now per audit rules) is to route every cross-table policy predicate through DEFINER scope helpers (e.g., make `fn_is_assigned_checker` DEFINER like `fn_owns_application`; add `fn_is_staff_for_application(app_id)`, `fn_owns_enrolment(enrol_id)` etc.), leaving policy USING clauses cycle-free. This is a *surgical* change to 0001's policies — not an architecture rewrite, and it must not widen any scope.

### 6.2 Classification of all 15 recorded failures

| Failing assertion (suite) | Root cause | Class |
|---|---|---|
| A: same key different payload conflicts (t01) | recursion via `(SELECT id FROM app.applications …)` sub-select | **S1 schema defect** |
| A: stale re-submit invalid transition (t01) | same | S1 |
| two-step: recommender cannot finalize (t02) | same | S1 |
| bed OCCUPIED after allocate / same-bed blocked (t02) | prior `fn_hostel_allocate` call aborted on recursive sub-select on `hostel_requests` | S1 |
| cert blocked pre-completion / second active cert blocked (t02) | recursion on `enrolments` sub-selects | S1 |
| attack: FK reassign session_id denied (t03) | recursion on `attendance` policy chain — masked the intended `permission denied` | S1 (masks a passing control) |
| doc-view: trainer denied (t01) | test sub-select reads `document_versions` as `service_role`, which has no grant | **S2 grant-model mismatch** (the control itself is fine) |
| audit UPDATE / DELETE blocked (t04) | got `permission denied` (grants) before trigger backstop could raise `E.AUTHZ.FORBIDDEN` — *protection is stronger than asserted*, test expectation wrong for this grant model | S2 / test bug |
| outbox dedupe / business events atomic / read_at set once / read_at rewrite blocked (t04) | `fn_notification_enqueue` call aborted: sub-select on `domain_events` as service_role → permission denied → no notification ever created; cascade | S2 cascade |

Additional unrecorded aborts (statement errors outside `expect_err`, so no row in `app_test.results`): anon `SELECT FROM app.profiles` errors with `permission denied` (test intended "sees zero rows"); t02's anon cert-verify check reads `app.certificates` directly as anon (no grant); t03's history check reads `attendance_corrections` (intentionally closed table). These are **test defects**: assertions that require reads the security model forbids.

### 6.3 Level 2 concurrency — executed but vacuous

- `tests/concurrency/_prep.sql:14` fails: `column reference "id" is ambiguous` (`SELECT id FROM app.applications a JOIN app.applicants ap …` — both tables have `id`). With `ON_ERROR_STOP=1` the whole fixture file aborts → application B never reaches finalizable state, claim-race applicant never created.
- `seat_race.sh`: both workers error `E.STATE.INVALID_TRANSITION` (no fixture) → invariant check passes on an empty race.
- `bed_race.sh`: references **undefined `$R1`/`$R2`** → both allocations fail on empty-uuid; check passes vacuously.
- `idem_race.sh`: references **undefined `$APPB`** → all 5 calls fail `invalid input syntax for type uuid: ""`.
- `claim_race.sh`: both workers `E.RES.NOT_FOUND` (fixture missing).

**Conclusion (verified fact):** despite 5 green checkmarks, *no concurrency invariant has ever been exercised*. `RUNTIME_EXECUTION_REPORT.md` §G's claim that the race scripts were "made self-contained" is contradicted by the artifact contents. This is exactly the "meaningless green" failure mode the project's own docs warn about.

### 6.4 Test inventory (Section E matrix)

| Category | Location | How to run | Complete? | Executable here? | Needs |
|---|---|---|---|---|---|
| Static checks (10) | `ci/static_checks.py` | `python3 ci/static_checks.py` | yes | **yes — PASS** | python3 |
| Semantic checks (8) | `ci/semantic_check.py` | `python3 ci/semantic_check.py` | yes | **yes — PASS** | python3 |
| Manifest integrity | `verify_manifest.py` | `python3 verify_manifest.py` | yes | **yes — OK=30** | python3 |
| Migration apply | via `run_all.sh` | — | yes | **yes — clean** | PG15+ |
| RLS/privilege/idempotency | `tests/plain/t01` | `run_all.sh` | mostly | **yes — partial fail (S1/S2)** | PG15+ |
| Workflow flows | `tests/plain/t02` | 〃 | yes | **yes — heavy S1 impact** | PG15+ |
| Attendance red team (11 attacks) | `tests/plain/t03` | 〃 | yes | **yes — 5/7 recorded pass** | PG15+ |
| Comm/audit/outbox | `tests/plain/t04` | 〃 | yes | **yes — S2 cascade fails** | PG15+ |
| Seat/bed/waitlist/claim/idem races | `tests/concurrency/` | `run_all.sh` or per-script | **no — fixture bugs** | ran, but vacuous | PG15+, fixture fixes |
| pgTAP | `tests/pgtap/example_rls.sql` | needs `CREATE EXTENSION pgtap` | sample only (4 asserts) | not attempted (extension not installed) | pgtap pkg |
| Frontend/route tests | — | — | **absent** | — | frontend artifact |

## 7. API gap analysis (Section F)

There is **no API surface at all** — every domain is **missing** at the API tier. The database side is essentially **complete** per domain. The build-out matrix (API column = to build; DB column = existing function(s) that MUST back it):

| Domain | API status | Backing DB capability (exists, verified applied) |
|---|---|---|
| Auth (OTP/JWT/sessions) | missing | delegated to auth provider; `fn_apply_phone_change` [SYS] after dual-OTP |
| Applicant profile | missing | `profiles` DW update (full_name, preferred_lang); `fn_claim_assisted` |
| Applications | missing | `fn_create_self/assisted_application`, `fn_save_draft`, `fn_submit_application`, `fn_withdraw_application` |
| Documents | missing | `fn_finalize_upload`, `fn_scan_result`, `fn_authorize_doc_view` (+ storage tier, absent) |
| Verification | missing | `fn_assign_checker/reassign/decide_document/request_correction/resubmit/fail` |
| Counselling | missing | `fn_counsel_*` (4) |
| Admissions | missing | `fn_admission_finalize`, `fn_waitlist_promote` |
| Offer accept / joining | missing | `fn_offer_accept/decline`, `fn_confirm_joining`, `fn_mark_not_joined` |
| Batches | missing | reads via RLS; `fn_transfer_enrolment`; no batch-CRUD functions (centre-admin batch creation is a **DB gap** — only seed creates batches) |
| Attendance | missing | DW insert/update policies + `fn_lock_attendance`, `fn_correct_attendance` |
| Hostel | missing | `fn_hostel_*` (6), `fn_set_bed_status` |
| Assessments | missing | DW `p_ares_ins_trainer` + `fn_finalize_assessment`; no assessment-create function (**gap**: `assessments` INSERT has no client path — t02 inserts as superuser) |
| Certificates | missing | `fn_cert_issue/reissue/revoke` |
| Public cert verification | missing | `fn_cert_verify` (anon EXECUTE already granted) |
| Placement | missing | `fn_placement_profile_create/withdraw`, `fn_referral_create/status`, `fn_outcome_record` |
| Notifications | missing | `fn_notification_enqueue/delivery_record` [SYS], read_at DW policy |
| Centre administration | missing | `fn_staff_register` [SYS], `fn_membership_grant/revoke`, `fn_staff_deactivate`, `fn_config_set`, `fn_export_create`, `fn_audit_query` |

Two genuine **DB-side gaps** surfaced by the mapping: no function/policy path to create `batches`, `courses`, `assessments`, `hostel_blocks/rooms/beds`, `events`, `notices` (drafts), `employers`, `job_opportunities` — i.e., **catalogue/infrastructure CRUD for centre admins is unimplemented** (seed-only today). This matches the docs' "0004–0006 expected later" reading (unknown — needs stakeholder confirmation, §10).

## 8. Sections G–I (blocked by missing artifacts)

- **G. Mock-to-real map:** impossible without the frontend; the real map's right-hand side is §7's function catalogue. Blocked.
- **H. Design/motion readiness:** the archive contains **no suitable asset** for the walking sequence — no WebM, no frame sequence, no sprite sheet, no source video, no GSAP/Framer/R3F code (no JS at all). Blocked. (A prior doc mentions "mounted uploads contain PNGs + saksham-premium-en.html" in an *earlier session's* environment — those files are not in this artifact.)
- **I. Responsive/accessibility:** no UI to audit. Blocked.

## 9. Highest-risk technical issues (ranked)

1. **RLS policy recursion (S1)** — authenticated read plane is broken at runtime; blocks any frontend/API integration. Surgical fix in 0001 policies via DEFINER scope helpers (pattern already proven in-repo by `waitlist_entries`). Must not widen scopes.
2. **Concurrency safety unproven (S3)** — fixture bugs (`_prep.sql` ambiguous `id`, `$R1/$R2/$APPB` unbound) mean seat/bed/waitlist/claim/idem races have never actually run. Fix fixtures, then require a genuinely-exercised green.
3. **service_role grant model undecided (S2)** — migrations grant service_role nothing on tables; tests (and possibly the future API) assume otherwise. Decide function-only server access (preferred, least privilege) and rewrite the affected test reads, or add explicit narrow grants.
4. **Frozen-artifact rule vs necessary fixes** — `SYNC_README.md` forbids regenerating migrations/tests, but S1–S3 require changes to `0001_foundation.sql`, `_prep.sql`, 3 race scripts, and several test assertions. Needs explicit stakeholder release + `MANIFEST.sha256` regeneration policy.
5. **Admin catalogue CRUD missing in DB** (batches/courses/assessments/hostel inventory/notices/events/employers) — Centre Admin portal cannot function without it.
6. **Missing tiers**: API server, OpenAPI, storage boundary, frontend — everything client-facing.

## 10. Recommended next implementation phase (evidence-based)

**Phase 2 = "Make the database actually pass its own suite on real PostgreSQL", in this order:**

1. Unfreeze artifacts formally (stakeholder sign-off; update MANIFEST after each fix).
2. Fix S1: convert cross-table policy predicates in `0001_foundation.sql` to SECURITY DEFINER scope helpers (no scope widening; keep FORCE RLS; keep deny-by-default). Re-run `run_all.sh` after each policy group.
3. Fix concurrency fixtures (`_prep.sql` alias the ambiguous `id`; define `$R1/$R2` in `bed_race.sh`, `$APPB` in `idem_race.sh`) and re-run Level 2 with **verifiably non-vacuous** races (assert workers actually reached the function, e.g., exactly one success + one domain error).
4. Resolve S2 by decision, then repair the ~8 test assertions that read closed tables (use definer test helpers or assert on function results instead).
5. Target: `VERDICT: GO` from `tests/run_all.sh` on PG 15/16 — now achievable in this environment.
6. Only then Phase 3: API server skeleton + OpenAPI mapped 1:1 to the 65-op catalogue (§7), then Supabase staging per `ci/gate.md`.

Do **not** start frontend integration against this database until step 5 is green — every portal read path currently 500s at the database.

## 11. Questions for stakeholders

1. Where are the frontend/API workspaces (portals, service adapter, mock layer, OpenAPI)? Provide as upload or repo so sections B/G/H/I can be audited.
2. Are migrations 0004–0006 planned (admin catalogue CRUD?) or does the brief overstate the range? This artifact ends at 0003.
3. May the frozen artifacts be modified to fix S1–S3 (with manifest regeneration), per `SYNC_README.md`?
4. Server data-access policy: function-only for service_role (recommended), or explicit table grants?
5. Is Supabase confirmed as the auth/storage provider (migrations assume `anon/authenticated/service_role` + `auth.uid()`)?

---

### Method note (fact vs inference)
Everything marked *verified* above was directly observed in this session: file reads, `verify_manifest.py`, both CI gates, four migration applies, the full `run_all.sh` execution (log preserved), and targeted psql diagnostics on the post-run database (`sjkvy_test`, PostgreSQL 16.13, still available for inspection). Inferences and recommendations are labelled as such. No repository file was created, modified, or deleted inside `sjkvy-db/`; nothing was pushed to `VenomBoy98/Leaks`.
