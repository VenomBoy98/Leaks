# SJKVY Phase 5 — Production Readiness Report

**Date:** 2026-07-12 · **Scope:** remaining backend work (roadmap Phase 5).
**Rule compliance:** PostgreSQL remains the business layer; no ORM; no business logic in
the API or worker; the existing function catalogue is used and extended with the same
SECURITY DEFINER discipline; no grants weakened; no internal tables exposed; no frontend
started.

## 1. Go / No-Go

**GO for backend feature-completeness and internal validation; CONDITIONAL for
production launch** — the two conditions are integration validation against real
external services (storage, auth provider) and the notification providers, which require
staging credentials/network unavailable in this build environment. Everything buildable
and testable here is implemented and passing.

## 2. Task-by-task status

| # | Task | Status | Evidence |
|---|---|---|---|
| 1 | **Migration 0004 — catalogue CRUD** | ✅ DONE, validated | 14 definer functions (courses/versions, batches +status, assessments, hostel inventory, notices +audiences, employers, opportunities); DB suite **GO 81/81**; API endpoints + tests |
| 2 | **Storage production integration** | 🔧 adapter + guide | Local driver tested; S3/Supabase presigned-URL swap documented (INTEGRATION_GUIDES §2); authz unchanged (`fn_authorize_doc_view`) |
| 3 | **Production auth provider** | 🔧 code done, wiring documented | JWKS (RS256/ES256) + HS256 verified in Phase 4; Supabase/Auth0/Cognito config in INTEGRATION_GUIDES §1 |
| 4 | **Notification worker** | ✅ DONE, validated | `src/worker/*`: claim→enqueue→deliver, DB-owned retry + dead-letter; migration 0005 `[SYS]` helpers; worker integration suite |
| 5 | **Staging validation** | ⛔ blocked (no staging) | Full procedure in INTEGRATION_GUIDES §4; must run at rollout |
| 6 | **Security review** | ✅ DONE | PHASE5_SECURITY_REVIEW.md (OWASP API Top 10 mapped; no High/Critical) |
| 7 | **Readiness report** | ✅ this document | — |

## 3. What changed in the database (additive only; frozen 0000–0003 untouched)

- **0004_catalogue_crud.sql** — 14 SECURITY DEFINER functions for admin CRUD, each with
  `_req_staff` scope checks, audit, and unique-constraint dup-safety. Grants EXECUTE to
  `authenticated`; owner `sjkvy_def`; pinned `search_path`.
- **0005_worker.sql** — 3 `[SYS]` helpers (`fn_outbox_mark_processed`,
  `fn_application_owner`, `fn_pending_notifications`) so the worker runs with EXECUTE-only
  and needs **no table grants**. EXECUTE to `service_role` only.
- Static + semantic gates pass; manifest for 0000–0003 remains byte-frozen.

## 4. Validation executed this session (PostgreSQL 16.13)

- **Database suite** (`run_all.sh`, migrations 0000–0005 + t01–t05 + concurrency):
  **GO 81/81**.
- **API suites** (`scripts/run-tests.sh`, fresh DB per suite): **46/46 pass**
  - api.integration — 19 ✅
  - production.integration — 15 ✅
  - catalogue.integration — 8 ✅ (migration 0004 through the API)
  - worker.integration — 3 ✅ (claim→enqueue→deliver, unmapped-event handling,
    retry→dead-letter with DB-owned attempt accounting)
  - concurrency.integration — 1 ✅ (API seat race)
- Typecheck clean; OpenAPI regenerated (**101 paths / 103 operations**).

All suites were executed on real PostgreSQL 16.13 this session and are green.

## 5. Architecture preserved (verification)

- `service_role` still holds **zero table grants**. The new worker reads its queue and
  resolves recipients exclusively through definer functions — re-confirming the
  function-only access model rather than weakening it.
- No RLS policy changed; no client table grant added; `document_versions` remains closed.
- Every new function is SECURITY DEFINER, owner `sjkvy_def`, pinned `search_path` — the
  static gate enforces this across all migrations.

## 6. Remaining risks / conditions before production

1. **Integration validation (blocking for launch):** run the staging checklist
   (INTEGRATION_GUIDES §4) against a real Supabase/S3 + auth provider. Not possible in
   the build sandbox (no credentials/network).
2. **Wire real providers:** storage driver (S3/Supabase), auth provider JWKS, and
   SMS/email/push senders; add AV scanning and signed provider webhooks.
3. **Operational:** secret rotation, `/metrics` network restriction, DB + object-store
   backups/PITR, WAF/CDN, CI-green-before-merge.
4. **Docker image build** builds on stock CI (the sandbox's TLS-intercepting proxy blocks
   in-container `npm ci` here; the compiled runtime was booted and verified directly).

## 7. Frontend readiness (roadmap Phase 6)

The API surface is now **feature-complete for all five portals**, including the admin
catalogue CRUD that was the one hard blocker. Recommended sequence: finish the staging
integration validation (§6.1–6.2) in parallel with early frontend scaffolding, but gate
any production frontend launch on a green staging run.

## 8. Deliverables index (Phase 5)

- Migrations `0004_catalogue_crud.sql`, `0005_worker.sql` (+ `tests/plain/t05_catalogue.sql`).
- API: catalogue endpoints across centre-administration/assessments/hostel/placement;
  `src/worker/*` notification worker; `npm run worker`.
- Docs: this report, `PHASE5_SECURITY_REVIEW.md`, `INTEGRATION_GUIDES.md`; regenerated
  `openapi.json` + `API_ENDPOINTS.md`.
- Tests: `test/catalogue.integration.test.ts`, `test/worker.integration.test.ts`.
