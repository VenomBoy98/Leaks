# SJKVY DB Implementation — Actual Execution Status (honest labels)
Repo: migrations/0000–0003 (391+448+376+1037 lines; 55 tables, 48 policies, 91 fn defs, 10 triggers),
tests/ (harness+seed+4 suites, 3 concurrency scripts, pgTAP sample, runner), ci/ (gate + static_checks.py).

## A. Actual execution summary
| Area | Status |
|---|---|
| Migrations 0000–0003 SQL | GENERATED + STATICALLY REVIEWED (executed structural checks) |
| ci/static_checks.py (10 checks: definer/search_path, catalogue 64 fns, grant lists, RLS coverage 55 tables, config-literal scan, test patterns, fixture integrity, 65-op traceability) | EXECUTED · PASSED (after fixes in B) |
| Auth/JWT fixtures (harness: roles + auth.uid() stub + 11 actors, all scopes) | GENERATED (execution BLOCKED) |
| RLS isolation & privilege tests (t01) | GENERATED · BLOCKED BY ENVIRONMENT (no PostgreSQL binary, no network — re-verified this session) |
| DEFINER/search_path behavior tests | STATIC: EXECUTED·PASSED; runtime: BLOCKED |
| Trainer-attendance 11-attack red team (t03) | GENERATED · BLOCKED |
| State-machine transition tests (t01/t02) | GENERATED · BLOCKED |
| Idempotency incl. concurrent same-key (t01 + idem_race.sh) | GENERATED · BLOCKED |
| Concurrency: seat/bed/promotion/claim/reissue races | GENERATED (scripts) · BLOCKED |
| Audit immutability + outbox atomicity (t04) | GENERATED · BLOCKED |
| Reporting cross-centre isolation (t01/t04 + invoker views) | GENERATED · BLOCKED |
| Ownership + EXECUTE grants per function | Enforced by 0003 DO block; list membership EXECUTED·PASSED; runtime BLOCKED |
| API mutation → path; direct read → policy | EXECUTED·PASSED (65 ops→fns; 6 [DW] ops→policies; 55-table coverage) |
**Nothing above is claimed as runtime-PASSED. Zero database tests were executed, because zero can be.**

## B. Failures found and fixes applied (all found by executed static review this session)
1. jsonb scalar config extraction `value->>0` returned NULL (3 sites: fn_config_int, fn_config_text, default_centre_id) → `value #>> '{}'`. Severity High (all config reads). Regression: check 5.
2. t03 used `(INSERT … RETURNING x)` as scalar subquery — invalid PG → rewritten as writable-CTE DO blocks. Regression: check 6 (CTE-aware).
3. static_checks.py: invalid regex backreference (check 7) and CTE false-positive (check 6) → fixed; suite green.
4. Prior sessions (already in repo): waitlist INSERT-in-FROM → CTE; sjkvy_def missing table privileges → grants in 0002; seed non-hex UUIDs → rewritten (guarded by check 7).

## C. Remaining untested areas (until run on real PG/Supabase)
Everything marked BLOCKED in A, plus Supabase-specific: real auth.uid()/JWT claims, anon/authenticated/service_role semantics, storage signed-URL boundary, session revocation via Auth API, pg_cron scheduling, pgTAP in CI. Minor known-accepted: notice_audiences readable to all authenticated (targeting metadata only); config coalesce fallbacks are class-A defaults (listed by check 5 INFO).

## D. Security regression results
Static regression suite (ci/static_checks.py) EXECUTED · ALL PASS: definer hardening, deny-by-default coverage, grant-list integrity, catalogue completeness, known-bug patterns, fixture integrity, traceability. Runtime regressions: BLOCKED.

## E. API → function → RLS → test traceability gaps
None found by the executed mapper: 65/65 mutation+eval ops resolve to an implemented function; 6/6 direct-write ops resolve to a column-limited policy; 55/55 tables have a policy or are intentionally closed; every t0* fixture id resolves. Test-ID linkage to invariants is by suite section (t01→SEC-OWN/CTR/LEAK/IMM, t02→SEC-CONC/STATE, t03→SEC-ASG-004/DW, t04→SEC-AUDIT/OUT); per-assertion invariant tags can be added when the suite first runs green.

## F. Verdict
**CONDITIONAL GO** for application-layer integration. Conditions (blocking, in order):
1. Run `tests/run_all.sh` on disposable PostgreSQL 15+ → all Level-1 assertions green (fix-forward any failure with minimal patches + regression tests).
2. Run tests/concurrency/*.sh (parallel sessions) → post-condition invariants hold.
3. Repeat 1–2 on Supabase staging (real auth/roles/storage); ci/gate.md order enforced in CI.
GO is not claimable now by the phase's own rule: no test was executed against a database, and the environment (re-verified) cannot host one.
