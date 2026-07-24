# SJKVY Backend — Production Documentation

This document covers deploying and operating the SJKVY backend (PostgreSQL business
layer + thin Fastify API). The database remains authoritative; the API is a thin
orchestration tier. Nothing here changes that contract.

## 1. Topology

```
client ──HTTPS──▶ nginx (TLS, rate limit, headers) ──▶ API (Fastify) ──▶ PostgreSQL
                                                          │
                                                          └─▶ object storage (signed URLs)
```

- **PostgreSQL** — the frozen migrations 0000–0003 (55 tables, 48 RLS policies, 91
  functions) plus `sql/auth_adapter.sql` for `auth.uid()` on self-hosted PG (unnecessary
  on Supabase). The API connects as the least-privileged `sjkvy_api_login` role.
- **API** — stateless; scale horizontally. Sets `request.jwt.claims` + `SET LOCAL ROLE`
  per transaction so RLS/DEFINER/idempotency/locks execute in the database.
- **Storage** — signed upload/download URLs; the skeleton ships a local-filesystem
  driver (`STORAGE_DIR`). Swap `src/storage.ts`'s driver for S3/Supabase Storage in
  production; the pipeline and authorization (`fn_authorize_doc_view`) are unchanged.

## 2. Configuration (environment)

All configuration is via environment variables; `src/config.ts` validates them and
**aborts startup in production** on missing/weak/placeholder secrets. See
`.env.example` (API) and `deploy/.env.compose.example` (stack).

| Var | Required (prod) | Purpose |
|---|---|---|
| `NODE_ENV` | yes (`production`) | enables strict validation + info logs |
| `DATABASE_URL` | yes | `postgres://sjkvy_api_login:…@host:5432/sjkvy` |
| `PG_POOL_MAX` | no (10) | pool size |
| `JWT_SECRET` **or** `JWT_JWKS_URI` | yes | token verification (HS256 secret or JWKS) |
| `JWT_ISSUER`, `JWT_AUDIENCE` | recommended | additional JWT claim checks |
| `SERVICE_TOKEN` | yes (≥24) | `[SYS]` server-to-server bearer |
| `STORAGE_URL_SIGNING_SECRET` | yes (≥32) | HMAC for signed storage URLs |
| `STORAGE_PUBLIC_BASE_URL` | yes | base for signed links (through the proxy) |
| `STORAGE_MAX_UPLOAD_BYTES`, `STORAGE_ALLOWED_MIME` | no | upload limits |
| `CORS_ORIGINS` | prod | comma-separated allowlist; empty = same-origin |
| `TRUST_PROXY` | prod (`true`) | honor `X-Forwarded-*` from nginx |
| `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW` | no | global per-key limit |
| `BODY_LIMIT_BYTES` | no (1 MB) | JSON body cap (uploads use the storage route) |

### Production auth providers

- **Supabase:** set `JWT_JWKS_URI` to the project JWKS
  (`https://<ref>.supabase.co/auth/v1/.well-known/jwks.json`) or `JWT_SECRET` to the
  project's legacy JWT secret; set `JWT_ISSUER`/`JWT_AUDIENCE`. On Supabase the DB
  already provides `auth.uid()` + roles, so `auth_adapter.sql` is not applied.
- **Auth0 / Cognito / other OIDC:** set `JWT_JWKS_URI`, `JWT_ISSUER`, `JWT_AUDIENCE`.
  The token `sub` must equal the `app.profiles.id` (provision profiles via
  `fn_staff_register` / the applicant self-create flow).

## 3. Deploy with Docker Compose

```bash
cd sjkvy-api
cp deploy/.env.compose.example .env   # fill strong secrets
docker compose up -d --build
docker compose logs -f api
```

The `db` service applies the frozen migrations + adapter + creates `sjkvy_api_login`
on first init (`deploy/db-init.sh`). The `proxy` service terminates client traffic.
Enable TLS in `deploy/nginx.conf` (see §5).

> Note: the API image is a standard multi-stage `node:22-slim` build (`Dockerfile`).
> `dist/index.js` was verified to boot in production mode against the database and
> serve `/health`, `/ready`, `/metrics`, authenticated and anon routes.

## 4. Operating

- **Liveness:** `GET /health` (no DB) — for container/orchestrator restarts.
- **Readiness:** `GET /ready` — 200 only when the DB is reachable; wire to the LB.
- **Metrics:** `GET /metrics` — Prometheus text (`sjkvy_http_requests_total`,
  `sjkvy_http_request_duration_seconds`, `sjkvy_db_errors_total`, default Node metrics).
  Restrict to the monitoring network (nginx already denies public access).
- **Logs:** structured JSON (pino) with a per-request `x-request-id` echoed to clients
  in error envelopes; `authorization`, `cookie`, `idempotency-key` are redacted.
- **Audit:** business audit lives in `app.audit_events` (append-only, trigger-guarded)
  and is queryable via `GET /admin/audit` (centre-scoped by `fn_audit_query`).
- **Scheduled jobs** (`service_role`): `POST /jobs/expire-offers`, `/jobs/expire-drafts`,
  `/jobs/outbox/claim`, `/jobs/idempotency/purge`. Drive from a cron/worker holding the
  `SERVICE_TOKEN`.

## 5. HTTPS

Terminate TLS at nginx (or your platform LB). In `deploy/nginx.conf` enable the 443
server block, mount certs at `/etc/nginx/certs`, redirect 80→443, and send HSTS. Obtain
certificates via Let's Encrypt (certbot) or managed TLS. **Never** serve JWTs or signed
URLs over plain HTTP in production.

## 6. Database migrations policy

Migrations 0000–0003 are FROZEN and byte-verified (`MANIFEST.sha256`). New schema work
is a new migration (candidate 0004+) with its own tests, run through the same
`run_all.sh` gate before deploy (see `ci/gate.md`). Do not edit applied migrations.

## 7. Backups & DR

- Nightly `pg_dump` (or Supabase PITR). Test restores quarterly.
- The `storage-data` volume (or the S3 bucket) holds document bytes — back it up with
  the same retention as the DB. Storage keys are recorded in `app.document_versions`.
