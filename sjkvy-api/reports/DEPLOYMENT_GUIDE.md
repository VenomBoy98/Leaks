# SJKVY Backend — Production Deployment Guide

Deploys the PostgreSQL business layer + Fastify API + notification worker behind a
reverse proxy. The database stays authoritative; the API/worker are stateless tiers.
Companion docs: `PRODUCTION.md` (topology/ops), `PRODUCTION_CONFIG.md` (all env),
`INTEGRATION_GUIDES.md` (auth/storage/notification wiring).

## 1. Prerequisites
- PostgreSQL 15+ (managed: Supabase / RDS / Cloud SQL) with TLS.
- Container runtime (Docker/K8s) for the API + worker images.
- A reverse proxy / LB terminating TLS (nginx config provided).
- An auth provider (Supabase/Auth0/Cognito), object storage (S3/Supabase), and
  notification providers (SendGrid/SES, Twilio) — see `INTEGRATION_GUIDES.md`.

## 2. Database
1. Apply migrations in order: `0000 → 0005`. On self-host, apply `sql/auth_adapter.sql`
   **before** the migrations (it creates the roles + `auth.uid()`); on Supabase, skip it.
2. Create the API login role and grant role membership:
   ```sql
   CREATE ROLE sjkvy_api_login LOGIN PASSWORD '<API_DB_PASSWORD>';
   GRANT anon, authenticated, service_role TO sjkvy_api_login;
   GRANT USAGE ON SCHEMA app, auth TO sjkvy_api_login;
   ```
3. Migrations are gated by CI (`ci/gate.md`); never edit an applied migration — add a
   new one with tests and run `tests/run_all.sh` green first.

## 3. Build & ship images
```
docker build -t <registry>/sjkvy-api:<tag> .      # API and worker share this image
```
API entrypoint: `node dist/index.js`. Worker entrypoint: `node dist/worker/index.js`
(the compose `worker` service overrides `command`). Non-root, healthchecked.

## 4. Configure
Set env per `PRODUCTION_CONFIG.md` from your secret manager. Minimum for production:
`NODE_ENV=production`, `DATABASE_URL` (TLS), one of `JWT_JWKS_URI`/`JWT_SECRET`,
`SERVICE_TOKEN`, a storage driver (`STORAGE_DRIVER=s3|supabase` + its creds), and
`CORS_ORIGINS`. Startup **aborts** on missing/weak/placeholder secrets — this is intended.

## 5. Deploy
### Docker Compose (staging / small prod)
```
cp deploy/.env.compose.example .env   # fill strong secrets
docker compose up -d --build          # db + api + worker + proxy
```
### Kubernetes (scale prod)
- Deployment `api` (N replicas) + Deployment `worker` (1–N; SKIP LOCKED makes >1 safe).
- `readinessProbe: GET /ready`, `livenessProbe: GET /health`.
- HPA on CPU/RPS for `api`. Secrets via `Secret`/external-secrets. Ingress terminates TLS.
- Size `PG_POOL_MAX × replicas ≤ Postgres max_connections`, or front with pgBouncer.

## 6. Reverse proxy / HTTPS
Use `deploy/nginx.conf`: forwards `X-Forwarded-*` (API `TRUST_PROXY=true`), coarse rate
limit, restricts `/metrics` to the monitoring network. Enable the 443 block, mount certs,
redirect 80→443, send HSTS. Obtain certs via Let's Encrypt or managed TLS.

## 7. Verify (post-deploy smoke)
```
GET /health            -> 200 {status:ok}
GET /ready             -> 200 {db:true}
GET /metrics           -> Prometheus text (restricted network)
GET /public/courses    -> 200 items (anon)
<authenticated read>   -> 200 scoped rows
<signed upload+download round-trip>
```
Then run `scripts/security-probe.mjs` and `scripts/loadtest.mjs` against staging.

## 8. Observability & ops
- Scrape `/metrics` (Prometheus); alert on `sjkvy_http_request_duration_seconds` p99,
  `sjkvy_db_errors_total`, and `/ready` flapping.
- Ship structured JSON logs (request-id correlated) to your log store.
- Run the notification worker as a separate deployment; scale by replica count.
- Scheduled jobs (`/jobs/*`, service token): drive from cron/K8s CronJob.

## 9. Backups & DR
Nightly `pg_dump`/PITR + quarterly restore drill; bucket versioning + lifecycle; a DR
runbook (promote replica / restore snapshot → re-provision secrets → smoke test). See
`SECURITY_REPORT.md §5`.

## 10. Rollback
Images are immutable per tag — roll back by redeploying the previous tag. Database
migrations are additive and backward-compatible within a release; if a migration must be
reverted, ship a new compensating migration (never edit history).
