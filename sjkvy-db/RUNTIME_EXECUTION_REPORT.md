# SJKVY DB — Runtime Execution Attempt (Phases 1–7)

## A. Environment actually used
Ubuntu 24.04 sandbox. **PostgreSQL: NONE.** Verified exhaustively this session:
no `psql`/`postgres`/`initdb`/`pg_ctl`/`pg_config` on disk; no cached `.deb`; no conda/nix/micromamba;
no on-disk postgres binary anywhere. Provisioning attempts: `apt-get install postgresql` → egress proxy
returns **403 Forbidden** on every archive.ubuntu.com/security.ubuntu.com `.deb`; PyPI unreachable
(DNS blocked for embedded-server packages `pgserver`/`testing.postgresql`). Network: outbound TCP to some
hosts opens but package mirrors are proxy-denied. **Conclusion: a real PostgreSQL cannot be run or installed here.**
Migration runner intended: `psql -v ON_ERROR_STOP=1`. Test runner: `tests/run_all.sh` (self-gates, then Level-1 plain + Level-2 concurrency, emits machine verdict).

## B. Clean migration result
**BLOCKED (not executed).** `tests/run_all.sh` detects the missing engine and exits with `RESULT: BLOCKED`
rather than reporting success. No database was created; migrations 0000–0003 were not applied to a live server.

## C. Runtime test results (RLS / privilege / definer / search_path / state-machine / idempotency / audit / outbox / reporting / attendance)
**All BLOCKED.** Zero assertions executed against a database. The suites exist and are staged
(t01 privilege/RLS/non-leak/immutability/docs, t02 admission/enrolment/hostel/cert flows,
t03 attendance 11-attack red team, t04 read_at/audit/outbox/export/config) but cannot run here.

## D. Concurrency test results
**All BLOCKED.** Five scripts are now self-contained with `_prep.sql` fixtures and per-race post-condition
assertions (seat, bed, waitlist double-promote, claim, idem same-key) reporting workers/committed/rejected/invariant.
Not executed — concurrency safety is therefore **not marked PASSED** (only the underlying mechanisms are statically verified).

## E. Attendance red-team results
**BLOCKED at runtime.** The 11 attacks are encoded in t03 (foreign enrolment, foreign session, cross-centre,
cross-batch, unrelated enrolment on valid session, post-lock write, post-deactivation write, duplicate insert,
unauthorized update, delete, FK reassignment) plus normal-path. Design is statically sound (column-grant + one
definer helper + unique + no-delete), but the exception is **not runtime-cleared** until executed.

## F. Supabase staging results
**BLOCKED / not performed.** No isolated Supabase staging project is available from this sandbox, and I will not
touch any production project. auth.uid()/JWT/anon/authenticated/service-role/storage/signed-URL/session-revocation
remain unverified against a real Supabase.

## G. Failures discovered (this session, via executed static + semantic gates)
None new in migration SQL. Two checker-tool defects and prior artifacts were the only findings:
- semantic-checker table parser (0-table parse; comma/CHECK handling; enum word-boundary; scan_status vs status) — fixed, now 55 tables parsed and all checks pass.
- concurrency scripts had unbound fixture vars → made self-contained with `_prep.sql`.
(Earlier sessions' real fixes — config `value #>> '{}'`, t03 writable-CTE, waitlist CTE, sjkvy_def grants, seed hex UUIDs — remain in place and are re-verified green.)

## H. Corrections made
`ci/semantic_check.py` added and hardened; `tests/concurrency/{seat,claim,waitlist}_race.sh` + `_prep.sql`
rewritten self-contained; `tests/run_all.sh` upgraded to gate → provision → level1 → level2 → machine verdict
with explicit BLOCKED path. No migration/architecture changes.

## I. Regression test results
**Static + semantic readiness gates: EXECUTED · PASS.**
- static_checks.py: definer/search_path (all definer fns), catalogue (64 fns), grant-list integrity, RLS coverage (55 tables), config-literal scan, test-pattern scan, fixture integrity, 65-op traceability — PASS.
- semantic_check.py: 55-table column model, INSERT/UPDATE column existence, enum-literal validity, symbol resolution, trigger targets, grant targets, apply-order — PASS.
These gate code correctness, not runtime behavior.

## J. Remaining blocked items
Everything requiring a live engine: clean migration apply, all Level-1 runtime assertions, all Level-2 concurrency
races, the executed attendance red team, and all Supabase-staging checks. Unblock = run `tests/run_all.sh` on any
PostgreSQL 15+ (then Supabase staging per `ci/gate.md`). The runner is turnkey and self-verdicting.

## K. Final verdict
**CONDITIONAL GO** — unchanged, and by the phase's own definition this is the only honest verdict:
core runtime tests could not be executed because the environment cannot host or install PostgreSQL (clearly-identified
external blocker), while all executable checks (static + semantic + traceability + mechanism review) pass with no
unresolved High/Critical issue. It is **not GO** (no runtime/concurrency/staging test actually passed) and **not NO-GO**
(no migration failure, no security-mechanism failure, no invariant violation found — the blocker is environmental, not defect-driven).
To convert to GO: execute `tests/run_all.sh` on a real PostgreSQL 15+ and Supabase staging; fix-forward any failures per Phase 6.
