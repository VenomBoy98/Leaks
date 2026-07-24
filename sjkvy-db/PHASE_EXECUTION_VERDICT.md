# SJKVY DB — Runtime Execution Attempt: Result

## A. Environment actually used
Build sandbox: python 3.12.3, sqlite 3.45.1. **No PostgreSQL binary** (psql/postgres/initdb/pg_ctl absent; none on disk). **No network to obtain one:** `apt-get download` → HTTP 403 Forbidden from archive.ubuntu.com; `pip install` → PyPI unreachable ("No matching distribution"); no conda/mamba. No Supabase staging project or credentials provided. PostgreSQL 15+ **cannot be provisioned or connected to here.**

## B. Clean migration result
**BLOCKED BY ENVIRONMENT.** Migrations 0000→0003 could not be applied to a real database because no PostgreSQL engine exists in this sandbox and none can be installed. Not attempted against sqlite: sqlite has no RLS, no `SECURITY DEFINER`, no `FORCE ROW LEVEL SECURITY`, no partial-unique predicate semantics, no `FOR UPDATE SKIP LOCKED`, and no parallel-session model — applying the suite there would produce a meaningless green and would violate the "no runtime success from non-Postgres" rule.

## C. Runtime test results
RLS / privilege / SECURITY DEFINER / search_path / state-machine / idempotency / audit / outbox / reporting-isolation / attendance: **all BLOCKED BY ENVIRONMENT** (0 executed, 0 passed, 0 failed). The suites exist and are structurally verified but were not run against a database.

## D. Concurrency test results
Seat race, bed race, waitlist-promotion race, claim race, same-idempotency-key race, cert issue/reissue race: **all BLOCKED BY ENVIRONMENT.** No parallel psql sessions possible. Per the phase rule, none is marked PASSED from inspection.

## E. Attendance red-team results
11 attacks: **BLOCKED BY ENVIRONMENT** (require a live engine to attempt real unauthorized mutations). Design remains as approved (retained with column-grants + definer helper + unique + no-delete); its runtime proof is deferred, not claimed.

## F. Supabase staging results
**BLOCKED** — no isolated staging project available; production use is prohibited by the brief and by policy.

## G. Failures discovered (this session, via executed static tooling only)
None new in migration source. The executed static gate (ci/static_checks.py) passes all 10 checks. Three *lint-tool* false positives were identified and understood (CASE/END, END-LOOP, and inline single-line `$$` forms confusing keyword-regexes) — these are artifacts of regex-based checking, not code defects, and are precisely why static analysis is not accepted as runtime proof here. No source was changed to chase them.

## H. Corrections made
None to migrations this session (prior sessions' fixes stand: jsonb `#>> '{}'` config extraction, waitlist writable-CTE, sjkvy_def grants, seed UUIDs, t03 writable-CTE). Added `tests/RUN_IN_REAL_PG.md` (zero-step execution incl. Docker one-liner) and `PHASE1_ENV.txt`.

## I. Regression test results
Static regression gate: **EXECUTED · PASS** (definer/search_path, catalogue completeness, grant integrity, 55-table RLS coverage, config-literal scan, test-pattern scans, fixture integrity, 65-op traceability). Runtime regressions: **BLOCKED.**

## J. Remaining blocked items
All runtime, concurrency, and staging validation — blocked solely by absence of a PostgreSQL engine and network in this sandbox. Unblocking requires running the existing `tests/run_all.sh` + `tests/concurrency/*.sh` on any PostgreSQL 15+ host (one command; Docker line provided), then Supabase staging per `ci/gate.md`. No code work remains before that run.

## K. Final verdict
**CONDITIONAL GO.** Justification against the phase's own rule set: this is not NO-GO (no migration failure, security failure, or concurrency-invariant failure was observed — none could be observed, and none was faked), and it is not GO (GO requires runtime + concurrency + staging tests to *actually pass*, which did not happen because the environment cannot host a database). It matches the definition of CONDITIONAL GO exactly: the artifact is complete and statically clean, with clearly identified external execution — the real-PostgreSQL and Supabase runs — remaining blocked by the environment. The single blocking condition is mechanical execution of the delivered suite on a Postgres host; I will not upgrade this to GO on static evidence.
