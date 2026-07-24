# SJKVY Backend — v1.0 Release Notes

**Release:** Backend v1.0 (database + API + notification worker + infrastructure).
**Status:** feature-complete, hardened, engineering-audited; ready for frontend
integration. Production go-live is gated only on staging sign-off of live external
integrations (auth/storage/notification providers) — code is complete for all of them.

## Highlights

- **PostgreSQL-authoritative architecture.** All business logic, authorization, state
  machines, idempotency and concurrency live in the database (55 tables, 48 RLS policies,
  90+ SECURITY DEFINER functions). The API and worker are thin, stateless tiers — no ORM,
  no duplicated logic.
- **Complete HTTP API.** 103 operations across 14 domains, generated OpenAPI (101 paths)
  that provably matches the implementation, uniform error envelope with request IDs.
- **Production auth.** JWT verification (JWKS RS256/ES256 or HS256), issuer/audience/
  expiry/skew checks, role-escalation rejection. `auth.uid()` drives RLS.
- **Secure document pipeline.** Signed upload/download URLs; drivers for local, **S3**
  (native SigV4, no SDK — proven against AWS's published vector), and **Supabase Storage**.
  `storage_path` never leaves the server; view authorization is in the database.
- **Notification worker.** Outbox → enqueue → deliver with DB-owned retry and dead-letter;
  pluggable providers (SendGrid/SES email, Twilio SMS; mock default).
- **Hardening & ops.** Rate limiting, security headers, CORS, body limits, backpressure,
  fail-fast secret validation, structured logs, `/health` `/ready` `/metrics`, Docker +
  Compose + nginx, GitHub Actions CI.

## Validation (executed)

- **Database suite:** GO **81/81** (migrations 0000–0005 + t01–t05 + concurrency races).
- **API suites:** **46/46** integration + **2/2** S3 unit; typecheck clean.
- **Load:** authenticated RLS reads ~2,320 rps @ p99 31 ms, **zero 5xx**, pool stable.
- **Security:** **12/12** penetration-style probes; DB privilege invariants verified
  (service_role 0 table grants; all tables FORCE RLS; anon minimal).

## What's in this release

| Area | Contents |
|---|---|
| `sjkvy-db` | Migrations 0000–0005, SQL + concurrency tests, static/semantic CI gates, manifest freeze |
| `sjkvy-api` | Fastify API, notification worker, storage drivers, config/auth/errors/idempotency, tests, tools |
| Deployment | `Dockerfile`, `docker-compose.yml`, `deploy/{db-init,nginx,.env.compose.example}`, `.github/workflows/ci.yml` |
| Docs | `docs/{ARCHITECTURE,DEVELOPER_GUIDE,FRONTEND_INTEGRATION_HANDBOOK}.md`, `INTEGRATION_GUIDES.md`, `reports/*` |

## Upgrade / migration notes

- Migrations 0000–0003 are **frozen** (byte-verified). 0004 (catalogue CRUD) and 0005
  (worker support) are additive and backward-compatible. Never edit an applied migration;
  add a new one with tests.
- On Supabase, do **not** apply `sql/auth_adapter.sql` (the platform provides `auth.uid()`
  and roles). On self-hosted PostgreSQL, apply it before the migrations.

## Known limitations / conditions before production

- Live auth/storage/notification providers require staging credentials to validate
  (Phase-6 staging checklist); all code is in place.
- Antivirus scanning and provider delivery-webhook verification are hooks to wire in prod.
- Frontend is not part of this release.

## Compatibility

- PostgreSQL 15+ (developed/validated on 16.13). Node 22. Supabase-compatible role model
  (`anon`/`authenticated`/`service_role`, `auth.uid()`).

## Credits

Built and validated across Phases 1–7: audit → database completion → API → infrastructure
→ remaining backend → production integration/hardening → final engineering audit.

— Backend v1.0
