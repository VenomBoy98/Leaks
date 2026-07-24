# SJKVY Backend — Production Go-Live Checklist

Sign off each item before serving real users. ✅ = validated in this environment ·
☐ = operator action at deploy/staging.

## Database
- ✅ Migrations 0000–0005 apply cleanly; `run_all.sh` → GO 81/81.
- ✅ All 55 tables FORCE RLS; `service_role` 0 table grants; DW grants column-limited.
- ☐ Managed Postgres 15+ provisioned with TLS; `max_connections` sized vs pool.
- ☐ `sjkvy_api_login` created, member of anon/authenticated/service_role, USAGE on app+auth.
- ☐ On Supabase: do NOT apply `auth_adapter.sql`. Self-host: apply it before migrations.
- ☐ Nightly backup / PITR enabled; **restore drill executed** into a scratch instance.

## API
- ✅ Typecheck clean; 46/46 integration + 2/2 unit; OpenAPI parity OK.
- ✅ Fail-fast config validation rejects weak/placeholder secrets (verified live).
- ☐ `NODE_ENV=production`; `DATABASE_URL` with `sslmode=require`; `PG_POOL_MAX × replicas ≤ max_connections` (or pgBouncer).
- ☐ `TRUST_PROXY=true` behind the proxy; `CORS_ORIGINS` = the real app origin(s).
- ☐ Secrets from a manager (not env files in the image): `JWT_*`, `SERVICE_TOKEN`, storage, providers.
- ☐ 2+ API replicas behind the LB; `readinessProbe: /ready`, `livenessProbe: /health`.

## Authentication
- ✅ JWT verification (JWKS/HS256, exp/iss/aud/skew); forged/expired/escalation rejected (probes).
- ☐ `JWT_JWKS_URI` (or `JWT_SECRET`) + `JWT_ISSUER`/`JWT_AUDIENCE` point at the real provider.
- ☐ Token `sub` == `app.profiles.id`; staff provisioned via `fn_staff_register`.
- ☐ Provider hardening: token lifetime, refresh, MFA for staff/admin.

## Storage
- ✅ S3 SigV4 signing proven vs AWS vector; local pipeline 15/15; no path leak; traversal blocked.
- ☐ `STORAGE_DRIVER=s3|supabase` with private bucket, SSE, CORS, lifecycle-expire incomplete uploads.
- ☐ Signed upload/finalize/download round-trip validated on staging; large-file at cap.
- ☐ Antivirus wired to `POST /documents/:vid/scan-result`; FLAGGED never becomes current.
- ☐ Bucket versioning + backups aligned with DB retention.

## Notifications
- ✅ Worker claim→enqueue→deliver→retry→dead-letter validated (mock providers).
- ☐ `NOTIFY_EMAIL_PROVIDER`/`NOTIFY_SMS_PROVIDER` + creds set; real send validated on staging.
- ☐ Provider delivery webhooks signature-verified before `fn_delivery_record`.
- ☐ Worker deployed as its own process/replica(s); `WORKER_INTERVAL_MS` tuned.

## Security & hardening
- ✅ 12/12 penetration-style probes; rate limiting engaged under load; body limits.
- ☐ TLS + HSTS at nginx/LB; HTTP→HTTPS redirect; `/metrics` restricted to monitoring net.
- ☐ WAF/CDN in front of the proxy; secret rotation schedule set.
- ☐ Run `security-probe.mjs` against staging (fresh rate-limit window).

## Observability & ops
- ✅ `/health`, `/ready`, `/metrics`; structured logs with request-id; audit append-only.
- ☐ Prometheus scraping `/metrics`; alerts on p99 latency, `sjkvy_db_errors_total`, `/ready` flaps.
- ☐ Logs shipped to a store; retention + PII policy set.
- ☐ Scheduled jobs (`/jobs/*`) driven by cron/CronJob with the service token.

## Performance
- ✅ Baseline load test: 0×5xx; authed RLS reads ~2,320 rps @ p99 31 ms; pool stable.
- ☐ Re-run `loadtest.mjs` against staging (real network) to size replicas; add write-path scenarios.

## CI/CD & release
- ✅ GitHub Actions: typecheck, build, DB suite, API suites, audit.
- ☐ Require CI green before merge; image scanning/signing in the registry.
- ☐ Tag `v1.0.0`; publish `RELEASE_NOTES_v1.0.md`.

## Final gate
- ☐ Every ☐ above signed off (staging validation report §B complete).
- ☐ Rollback plan confirmed (previous image tag; compensating migrations only).
