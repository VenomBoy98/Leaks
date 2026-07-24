# SJKVY Backend — Security Review (Phase 5)

Scope: the PostgreSQL business layer (migrations 0000–0005), the Fastify API, the
storage pipeline, and the notification worker. This review maps controls to the OWASP
API Security Top 10 (2023) and records verified evidence vs. residual risk.

Legend: ✅ verified by an executed test · 🔧 implemented, staging-validation pending ·
📋 operator responsibility.

## OWASP API Security Top 10 (2023)

### API1:2023 — Broken Object Level Authorization (BOLA)
- ✅ Every object read is RLS-scoped; the DB decides row visibility from `auth.uid()`,
  not from API code. Verified: applicant B cannot see A's application; CAD2 sees no
  centre-1 rows; cross-owner/cross-centre reads return 0 rows.
- ✅ Mutations are SECURITY DEFINER functions that re-check ownership/scope internally
  (`fn_owns_application`, `_req_staff`, in-tx active-assignee recheck).
- ✅ Document access: `fn_authorize_doc_view` denies non-owners (trainer→404 non-leak).

### API2:2023 — Broken Authentication
- ✅ JWT signature verification (HS256 + JWKS RS256/ES256); expiry, issuer, audience,
  clock-skew enforced. Verified: expired→401, wrong-secret→401.
- ✅ The API never trusts a client-supplied identity or role; a token claiming
  `role: service_role` is rejected (403). `[SYS]` endpoints require a constant-time
  service token. Verified.
- 🔧 Provider hardening (token lifetime, refresh, MFA) is configured at the auth
  provider (Supabase/Auth0/Cognito) — see INTEGRATION_GUIDES.md.

### API3:2023 — Broken Object Property Level Authorization
- ✅ No mass-assignment: direct writes are column-limited GRANTs (e.g. attendance only
  `present`; profile only `full_name, preferred_lang`); everything else flows through
  functions with explicit field handling. Immutable columns are trigger-guarded.
- ✅ Response shaping: reads select explicit columns; `document_versions.storage_path`
  is never exposed (closed table + path-less view). Verified.

### API4:2023 — Unrestricted Resource Consumption
- ✅ Global per-subject/IP rate limit; tighter limit on public cert verify (20/min).
- ✅ Body size limit (1 MB JSON); upload size capped at issuance and gateway.
- ✅ Backpressure (`under-pressure`) sheds load and fails readiness under stress.
- ✅ Read endpoints use bounded `LIMIT`s; DB pool is capped.
- 📋 Add an outer nginx/WAF/CDN limit and per-tenant quotas at scale.

### API5:2023 — Broken Function Level Authorization
- ✅ Auth mode is fixed per endpoint (`none`/`user`/`service`) and maps to the DB role;
  role can never be escalated from client input. Verified: user JWT on a `[SYS]` job
  endpoint → 401; CAD cannot set config (SAD-only) → 404 non-leak.
- ✅ Staff scope (centre/role) enforced inside every definer function via `_req_staff`.

### API6:2023 — Unrestricted Access to Sensitive Business Flows
- ✅ Idempotency on all state-changing multi-step flows (DB-serialized on
  `(op, actor, key)`); replay returns the stored result, same-key/different-body → 409.
- ✅ Concurrency-guarded flows (seat/bed/waitlist/claim) proven at the DB (81/81) and
  the seat race re-proven through the API.
- ✅ Two-step admission (recommender ≠ finalizer) enforced in `fn_admission_finalize`.

### API7:2023 — Server Side Request Forgery
- ✅ No user-controlled URL fetching in the API. The only outbound URL is the JWKS
  endpoint, which is operator-configured (`JWT_JWKS_URI`), not client-supplied.

### API8:2023 — Security Misconfiguration
- ✅ Fail-fast config validation aborts production startup on missing/weak/placeholder
  secrets. Verified. Security headers via helmet; CORS default-deny allowlist.
- ✅ Errors never leak SQL/table/policy internals (SQLSTATE 42501 → generic 403).
- ✅ Least-privileged DB login role; `service_role` holds zero table grants (function-
  only) — re-verified in Phase 5: the worker resolves recipients and reads its queue
  through purpose-built definer functions (`fn_application_owner`,
  `fn_pending_notifications`), never a table grant.
- 📋 TLS/HSTS at the proxy; restrict `/metrics` to the monitoring network.

### API9:2023 — Improper Inventory Management
- ✅ Single generated OpenAPI (`openapi.json`, 101 paths) + endpoint reference, both
  derived from one manifest — no undocumented endpoints. `/health` `/ready` `/metrics`
  are the only non-manifest routes plus the signed storage gateway (marked internal).

### API10:2023 — Unsafe Consumption of APIs
- ✅ Provider tokens are verified, not trusted. Notification provider results are
  recorded but never used to make authorization decisions.
- 🔧 When wiring real SMS/email/push providers, validate their callbacks (signed
  webhooks) before calling `fn_delivery_record`.

## Layer-specific findings

### PostgreSQL (RLS + SECURITY DEFINER)
- ✅ FORCE ROW LEVEL SECURITY on all 55 tables; 48 policies; deny-by-default grants.
- ✅ Every definer function pins `search_path = app, public, pg_temp` and is owned by
  `sjkvy_def` (BYPASSRLS but non-superuser). Verified by the static gate + runtime.
- ✅ Migrations 0004/0005 follow the same discipline (static + semantic gates pass;
  81/81 runtime). No new client grants; no RLS weakening.
- ✅ Audit is append-only (trigger backstop even against superuser); `fn_audit` scrubs
  `otp|aadhaar|password|secret|path|phone`; outbox strips `phone/dob/storage_path`.

### Upload pipeline
- ✅ Signed, tamper-evident, short-TTL URLs; MIME allowlist + size cap; path-traversal
  blocked; finalization verifies bytes exist and re-checks ownership in the DB.
- 🔧 Antivirus: `POST /documents/:versionId/scan-result` is the hook; wire a real
  scanner (ClamAV/Lambda) in production. FLAGGED versions never become `current`.

### Notification worker
- ✅ Runs as `service_role` with only EXECUTE on `[SYS]` functions. Retry and
  dead-letter (FAILED) are DB-owned via `fn_delivery_record` vs `notif_max_attempts`.
- 🔧 Provider credentials in a secrets manager; verify inbound delivery webhooks.

## Residual risks (tracked)
1. 🔧 Live storage (S3/Supabase) and auth-provider integrations are implemented as
   documented adapters but not yet validated against the real services (no staging in
   this environment). Must pass the staging checklist before production.
2. 🔧 Real AV scanning and provider webhook signature verification not yet wired.
3. 📋 Operational: secret rotation, `/metrics` network restriction, backups/PITR for DB
   and object store, WAF/CDN, and CI-green-before-merge enforcement.

## Verdict
No High/Critical defect found in the code under review. All executable controls pass
their tests (DB 81/81; API 43/43 across five suites at time of writing). Residual items
are integration/operational and are enumerated above and in the readiness report.
