# SJKVY Backend — Production Security Checklist

Status legend: ✅ implemented & tested · 🔧 implemented, operator action required ·
📋 operator responsibility (deploy-time).

## Authentication & authorization
- ✅ JWT signatures verified (HS256 secret **or** JWKS RS256/ES256); expiry, issuer,
  audience, and clock-skew checked (`src/auth.ts`). Tested: expired token → 401,
  wrong-secret token → 401.
- ✅ API never trusts a client-supplied identity; `auth.uid()` comes from the verified
  `sub`. A token claiming `role: service_role` is rejected (→ 403). Tested.
- ✅ DB role per request is chosen by the endpoint's auth mode, never by token claims
  (`anon` / `authenticated` / `service_role` via `SET LOCAL ROLE`).
- ✅ RLS + FORCE ROW LEVEL SECURITY on all 55 tables; SECURITY DEFINER boundaries
  preserved. Verified end-to-end: cross-owner and cross-centre reads return 0 rows.
- ✅ `[SYS]` endpoints require the constant-time-compared `SERVICE_TOKEN`. Tested: a
  user JWT on a job endpoint → 401.
- 📋 Rotate `JWT_SECRET`/`SERVICE_TOKEN`/`STORAGE_URL_SIGNING_SECRET` on a schedule;
  store in a secrets manager, never in the image or git.

## Data exposure
- ✅ No internal tables exposed; reads are RLS-scoped SELECTs or DEFINER functions.
- ✅ `document_versions.storage_path` is never returned to a client; documents are
  reached only via short-lived signed URLs. Tested: finalize/download responses have no
  `storage_path`.
- ✅ Document-view authorization enforced in the DB (`fn_authorize_doc_view`,
  SEC-DOC-004); unrelated trainer denied (→ 404 non-leak). Tested.
- ✅ Error envelopes never leak SQL/table/policy internals; SQLSTATE 42501 → generic 403.

## File storage
- ✅ Signed upload/download URLs (HMAC-SHA256, short TTL, tamper-evident). Tested:
  tampered token → 403, expired token → rejected.
- ✅ Upload validation: allowed MIME allowlist + max size, enforced at URL issuance and
  at the gateway. Path traversal blocked (key regex + rooted resolve).
- ✅ Finalization verifies the object exists and re-checks ownership in the DB.
- 🔧 Swap the local driver for S3/Supabase Storage; add server-side AV scanning that
  calls `POST /documents/:versionId/scan-result`.

## Transport & headers
- ✅ Security headers via `@fastify/helmet`.
- ✅ CORS allowlist (`CORS_ORIGINS`); default deny.
- 📋 TLS terminated at nginx/LB; HSTS enabled; HTTP→HTTPS redirect (`deploy/nginx.conf`).

## Abuse protection
- ✅ Global per-subject/per-IP rate limit (`@fastify/rate-limit`); tighter limit on the
  public `GET /verify/:code` (20/min) against enumeration.
- ✅ Request body size limit (`BODY_LIMIT_BYTES`, 1 MB) + separate capped upload path.
- ✅ Backpressure via `@fastify/under-pressure` (event-loop delay shedding).
- 📋 nginx-level `limit_req` as an outer layer; consider a WAF/CDN for L7.

## Idempotency & concurrency
- ✅ Idempotent mutations require `Idempotency-Key`; the DB serializes on
  `(op, actor, key)` and replays. Tested: replay → `replayed:true`; same key + different
  body → 409.
- ✅ Seat/bed/waitlist/claim races proven at the DB layer (65/65) and the seat race
  re-proven through the API (parallel HTTP finalizes → exactly one offer).

## Observability & audit
- ✅ Structured JSON logs with request IDs; sensitive headers redacted.
- ✅ `/health`, `/ready` (DB probe), `/metrics` (Prometheus).
- ✅ Append-only, trigger-guarded `app.audit_events`; PII-scrubbing in `fn_audit`.
- 📋 Restrict `/metrics` to the monitoring network (nginx allow-list provided).

## Configuration hygiene
- ✅ Fail-fast startup validation in production (missing/weak/placeholder secrets abort).
  Tested: placeholder secrets → process exits with a clear error.
- ✅ No secrets in code or image; `.dockerignore` excludes `.env`.
- 📋 Least-privileged DB login role (`sjkvy_api_login`) — never connect the API as a
  superuser or as `sjkvy_def`. Do not weaken its grants.

## CI/CD
- ✅ GitHub Actions runs typecheck, build, OpenAPI generation, `npm audit`, the full DB
  suite (migrations + level-1 + level-2 races) and the full API suite on every push/PR.
- 📋 Require the CI check to pass before merge; sign/scan images in your registry.
