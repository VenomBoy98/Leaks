# SJKVY Backend — Production-Only Configuration Values

Every value below is set via environment (validated by `src/config.ts`, which aborts
startup in production on missing/weak/placeholder secrets). Store secrets in a manager,
never in the image or git. `⚠` = secret.

## API service

| Var | Example / value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | enables strict validation + info logs |
| `PORT` / `HOST` | `8080` / `0.0.0.0` | behind the proxy |
| `DATABASE_URL` ⚠ | `postgres://sjkvy_api_login:<pw>@<host>:5432/sjkvy?sslmode=require` | least-privileged login role; **require TLS** to a managed DB |
| `PG_POOL_MAX` | `20` | keep `instances × PG_POOL_MAX ≤ Postgres max_connections` (or use pgBouncer) |
| `TRUST_PROXY` | `true` | honor `X-Forwarded-*` from nginx/LB |
| `CORS_ORIGINS` | `https://app.sjkvy.example` | comma-separated allowlist; empty = same-origin |
| `BODY_LIMIT_BYTES` | `1048576` | JSON body cap |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW` | `100` / `1 minute` | global; cert-verify is tighter (20/min, in code) |
| `LOG_LEVEL` | `info` | pino; sensitive headers redacted |

## Authentication (choose one verification method)

| Var | Notes |
|---|---|
| `JWT_JWKS_URI` | asymmetric provider JWKS (Supabase/Auth0/Cognito) — **preferred** |
| `JWT_SECRET` ⚠ | HS256 shared secret (≥32 chars) — Supabase legacy secret |
| `JWT_ISSUER`, `JWT_AUDIENCE` | recommended claim checks |
| `JWT_ALGORITHMS` | defaults from method (`RS256,ES256` for JWKS; `HS256` for secret) |
| `JWT_CLOCK_TOLERANCE_SEC` | `5` |

## Service-to-service

| Var | Notes |
|---|---|
| `SERVICE_TOKEN` ⚠ | `[SYS]` bearer (≥24 chars); worker + job callers only |

## Storage (choose a driver)

| Var | Driver | Notes |
|---|---|---|
| `STORAGE_DRIVER` | `s3` \| `supabase` \| `local` | production: `s3` or `supabase` |
| `STORAGE_URL_SIGNING_SECRET` ⚠ | local only | HMAC gateway signing (≥32) |
| `STORAGE_PUBLIC_BASE_URL` | local only | signed-link base through the proxy |
| `STORAGE_UPLOAD_TTL_SEC` / `STORAGE_DOWNLOAD_TTL_SEC` | all | default 300 |
| `STORAGE_MAX_UPLOAD_BYTES` | all | default 10 MB |
| `STORAGE_ALLOWED_MIME` | all | default `image/jpeg,image/png,image/webp,application/pdf` |
| `S3_BUCKET`, `S3_REGION` | s3 | |
| `AWS_ACCESS_KEY_ID` ⚠, `AWS_SECRET_ACCESS_KEY` ⚠, `AWS_SESSION_TOKEN` ⚠ | s3 | prefer IAM role over static keys |
| `S3_ENDPOINT_HOST` | s3 | optional (MinIO / S3-compatible) |
| `SUPABASE_URL`, `STORAGE_BUCKET` | supabase | |
| `SUPABASE_SERVICE_ROLE_KEY` ⚠ | supabase | **server-only**, never shipped to a browser |

## Notification worker

| Var | Notes |
|---|---|
| `WORKER_INTERVAL_MS` | `5000` |
| `NOTIFY_SMS_PROVIDER` | `twilio` (unset → mock) |
| `TWILIO_ACCOUNT_SID` ⚠, `TWILIO_AUTH_TOKEN` ⚠, `TWILIO_FROM` | SMS |
| `NOTIFY_EMAIL_PROVIDER` | `sendgrid` \| `ses-http` (unset → mock) |
| `EMAIL_API_KEY` ⚠, `EMAIL_FROM`, `EMAIL_ENDPOINT` | email |

## Compose / DB init (staging & self-host)

| Var | Notes |
|---|---|
| `POSTGRES_PASSWORD` ⚠ | superuser (init only) |
| `API_DB_PASSWORD` ⚠ | `sjkvy_api_login` password (used by `DATABASE_URL`) |
| `PROXY_HTTP_PORT` | `80` (enable 443 + certs for TLS) |

## Hard rules

- On **Supabase**, do NOT apply `sql/auth_adapter.sql` (the platform provides
  `auth.uid()` + roles). On **self-host**, apply it after the migrations.
- The API's DB role is `sjkvy_api_login` (member of anon/authenticated/service_role).
  **Never** connect the API as a superuser, `postgres`, or `sjkvy_def`.
- TLS everywhere: DB (`sslmode=require`) and client traffic (HTTPS/HSTS at the proxy).
