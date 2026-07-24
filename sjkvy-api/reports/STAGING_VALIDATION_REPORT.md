# SJKVY Backend — Staging Validation Report

**Date:** 2026-07-13. This report separates what was **validated in this environment**
(local PostgreSQL 16 + running API + worker) from what **must run against real staging**
(Supabase/S3/auth provider/SMS/email), which is blocked here by the absence of staging
credentials and external network egress.

## A. Validated in this environment (executed, green)

| Area | How | Result |
|---|---|---|
| Database | `run_all.sh` (migrations 0000–0005 + t01–t05 + concurrency) | **GO 81/81** |
| API functional | 5 integration suites over HTTP | **46/46** |
| S3 signing | SigV4 vs AWS published vector | **2/2** (offline, provably correct) |
| Storage pipeline (local driver) | upload-url → PUT → finalize → download-url → GET | ✅ (15/15 incl. SEC-DOC-004) |
| Worker | claim → enqueue → deliver, unmapped-event handling, retry → dead-letter | ✅ 3/3 |
| Concurrency | API-level seat race (parallel finalizes) | ✅ exactly one offer |
| Idempotency | replay → stored result; same-key/different-body → 409 | ✅ |
| Auth (JWT) | expired / tampered / foreign-signed / role-escalation | ✅ (probes 2–5) |
| RLS under auth | IDOR probe; cross-owner/centre reads | ✅ 0 rows |
| Load | 50 conc × 10 s; pool at cap, 0×5xx; rate limit engaged | ✅ (see LOAD_TEST_REPORT) |
| Security probes | 12 penetration-style checks | ✅ 12/12 |

## B. Blocked here — run against real staging before production

Follow `INTEGRATION_GUIDES.md §4`. Each item has code implemented; only live validation
is outstanding.

1. **Auth provider (Supabase/Auth0/Cognito):** set `JWT_JWKS_URI`; obtain a real token;
   `GET /auth/me` → 200 with the correct profile; confirm expired/foreign token → 401 and
   RLS scoping across two real users. `auth.uid()` = verified `sub`; on Supabase the
   platform provides `auth.uid()` (do not apply the adapter).
2. **Storage (S3 or Supabase):** `STORAGE_DRIVER=s3|supabase`; presigned upload → PUT to
   the provider → finalize → presigned download → GET; unrelated user denied (404); raw
   path never returned; large-file upload at the size cap; AV FLAGGED path.
3. **Notification providers:** `NOTIFY_EMAIL_PROVIDER`/`NOTIFY_SMS_PROVIDER` + creds;
   emit events → real email/SMS delivered; force failures → retry → FAILED (DLQ);
   delivery tracking rows in `app.delivery_attempts`.
4. **Deployment:** `docker compose up` (db + api + worker + proxy) OR managed equivalents;
   secrets from a manager; `/health` `/ready` `/metrics` reachable; TLS/HSTS at the proxy.
5. **End-to-end + concurrency + idempotency + performance:** re-run the four functional
   suites and the load harness against staging (real network + proxy) to size instances.

## C. Staging deployment procedure (summary)

```
# 1. Provision managed Postgres (or Supabase). Apply migrations 0000–0005 (+ adapter if self-host).
# 2. Create the least-privileged sjkvy_api_login role; grant anon/authenticated/service_role.
# 3. Configure secrets (PRODUCTION_CONFIG.md) in the platform's secret store.
# 4. Deploy API + worker images; point DATABASE_URL at staging (sslmode=require).
# 5. Verify: /health 200, /ready db:true, /metrics scrape, one authenticated read, one signed download.
# 6. Run: run_all.sh (against a staging scratch DB), the API suites, loadtest.mjs, security-probe.mjs.
# 7. Sign off each row in §B before promoting to production.
```

## Verdict
**Everything runnable without external services is green.** Staging sign-off on §B is the
remaining gate before production — code is complete for all of it; only live-service
validation with credentials remains.
