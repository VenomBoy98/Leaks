# SJKVY Backend — Final Engineering Audit (Phase 7)

**Date:** 2026-07-13 · **Scope:** whole backend (sjkvy-db + sjkvy-api), no new features,
no architecture change. Method: static inventory + automated checks + runtime validation.
**Headline:** the backend is maintainable and production-ready. No Critical or High
finding. Three trivial dead-code items were found and fixed; everything else is
Low/Nice-to-have and documented in `TECHNICAL_DEBT.md`.

## 1. Findings by severity

### Critical — none
### High — none

### Medium — none
(The one candidate — the 3-round-trip identity/role setup per request — is a proven-fast
path, see Performance §5; recorded as Low/nice-to-have, not changed, per "only modify on
a verified issue".)

### Low (fixed this audit — dead code, zero behavior change)
| # | Finding | Action | Evidence |
|---|---|---|---|
| L1 | `getPool()` exported in `db.ts`, referenced nowhere (src/test/scripts) | Removed | grep: only the definition existed |
| L2 | `errorResponse` schema exported but unused | **Wired into the router** as the documented `4xx`/`5xx` response for every endpoint (improves OpenAPI completeness + error consistency) | runtime error envelope re-verified unchanged |
| L3 | `registry` exported from `observability.ts` but only used internally | Dropped the `export` | grep: no external import |

### Nice-to-have (documented, not changed)
See `TECHNICAL_DEBT.md`: combine the two identity/role `SET` round-trips into one;
move `storage-routes.ts` under `storage/`; add ESLint + Prettier configs; add a
`fn_profile_phone` resolver for the SMS channel; per-op error-code → status doc tags.

## 2. Audit tasks & evidence

### 2.1 Dead code / unused deps / unused exports
- **Dependencies:** all 9 runtime deps are imported and used (verified per-dep grep). No
  unused dependency. Dev deps (`tsx`, `vitest`, `typescript`, `@types/*`) all used.
- **Exports:** scanned every `export` for external references. All are used by src, tests,
  or scripts **except** L1–L3 above (fixed). Types exported for public surface (e.g.
  `S3Config`, `Operation`) are intentional.
- **Dead code:** none beyond L1–L3.

### 2.2 OpenAPI ↔ implementation parity — VERIFIED
`scripts/check-openapi-parity.mjs` (new): **103 manifest operations + storage routes +
health/ready all present; no undocumented path.** Result: `PARITY OK`. The spec is
generated from the same manifest that drives the router, so drift is structurally
prevented. Error responses (`4xx`/`5xx`) are now documented for every path (L2).

### 2.3 Database access invariants — VERIFIED (live query on a built DB)
- `service_role` direct table grants: **0** (function-only access confirmed).
- `authenticated` INSERT/UPDATE grants: **exactly the 7 column-limited DW grants**
  (applications draft fields, assessment_results, attendance ins/upd, class_sessions,
  notifications.read_at, profiles display fields) — each backed by a WITH CHECK policy.
- Tables not forcing RLS: **none** (all 55 FORCE RLS).
- `anon`: SELECT on `v_public_catalog` (definer view) + EXECUTE on `fn_cert_verify`,
  `fn_eligibility_eval` — nothing else.
- Every mutation endpoint calls an `app.fn_*`; the only raw writes are the 6 DW policy
  writes (run under the caller's role → RLS enforced). No endpoint bypasses RLS.
  `service_role`-elevated calls (storage finalize/view, worker) invoke only functions.

### 2.4 Performance — REVIEWED (load-tested in Phase 6)
- **Connection pool:** held at cap (20) under 50-concurrent load, drained clean, no leak
  (`pg_stat_activity`). `withActor` acquires/releases per request.
- **Query counts:** the hot read path is 3 round-trips/request (set claims, set role,
  query) — inherent to the per-request identity model; measured ~2,320 rps @ p99 31 ms.
  The worker's per-event resolver call is an acceptable background N+1 (batched).
- **Caching:** public/immutable reads (`/public/courses`, verified certs) are
  cache-friendly at the edge/client (documented in the frontend handbook). No server-side
  cache is warranted (correctness + RLS).
- **Memory:** streaming JSON via Fastify; upload bodies capped; no unbounded buffers
  except the deliberate storage gateway buffer (size-limited). Default Node metrics
  exposed for RSS/heap monitoring.

### 2.5 Security — REVIEWED + LIVE-PROBED (Phase 6, re-confirmed)
- JWT: signature/exp/iss/aud/skew verified; forged/tampered/expired/role-escalation
  rejected (probes 2–5). Uploads: signed URLs, validation, path-traversal blocked, no path
  leak. Notifications: provider results never used for authz. Rate limiting: global +
  tighter cert-verify (engaged under load). Logging: structured, request-id, secrets
  redacted. Secrets: env-only, fail-fast, none in image/git. Docker: multi-stage,
  non-root, healthcheck, `.dockerignore` excludes `.env`.
- **12/12 penetration-style probes pass** (`scripts/security-probe.mjs`).

### 2.6 Maintainability — REVIEWED
- Clear single-responsibility modules; the declarative `Operation` manifest keeps
  per-endpoint code near-zero and self-documenting.
- Comments explain the *why* (security rationale) throughout the hot paths.
- Folder organization is coherent (`storage/`, `worker/`, `domains/`). One minor
  inconsistency (`storage-routes.ts` at root) recorded as nice-to-have.
- Docs added this phase: `ARCHITECTURE.md`, `DEVELOPER_GUIDE.md`,
  `FRONTEND_INTEGRATION_HANDBOOK.md`, plus this report set.

## 3. Runtime validation (this audit, PostgreSQL 16.13)
- DB suite: **GO 81/81**. API suites: **46/46** + S3 unit **2/2**. Typecheck clean.
- OpenAPI parity: **OK** (regenerated). Error-envelope runtime output: unchanged.
- DB privilege invariants: all green (§2.3). Security probes: 12/12 (Phase 6).

## 4. Verdict
**Backend v1.0 is release-ready and ready for frontend integration.** No blocking
finding. The only outstanding items are the staging integration sign-off (live auth/
storage/notification providers — code complete, credentials required) tracked in the
Phase-6 reports, and the nice-to-haves in `TECHNICAL_DEBT.md`.
