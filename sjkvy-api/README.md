# SJKVY Platform API

A **thin orchestration layer** over the verified SJKVY PostgreSQL function catalogue
(`../sjkvy-db`). The database is the authoritative business layer; this API only
authenticates the caller, sets the identity + role for a transaction, and invokes a
catalogue function or a narrow RLS-scoped read. No business logic, no ORM, no direct
table exposure.

- **Stack:** Fastify 5 · TypeScript · `pg` · `jose` (JWT) · `@fastify/swagger`.
- **Security:** every request runs as `anon | authenticated | service_role` with
  `auth.uid()` derived from a verified JWT — RLS, SECURITY DEFINER functions,
  idempotency and row-lock concurrency are enforced by the database.
- **Docs:** `openapi.json` (generated) and `API_ENDPOINTS.md` (generated) — both derived
  from the declarative operation manifest in `src/domains/*`.

See **`PHASE3_API_NOTES.md`** for the architecture, auth model, idempotency/concurrency
handling, error mapping, and the DB gaps carried forward.

## Layout

```
src/
  config.ts        env config (no secrets in code)
  db.ts            the ONLY DB access path: withActor + callFn + queryRead
  auth.ts          JWT / service-token → Actor (role + verified uid)
  errors.ts        DB domain codes → HTTP envelope
  idempotency.ts   Idempotency-Key + request-hash forwarding
  operation.ts     the declarative Operation type (single source of truth)
  router.ts        generic handler binding Operations to Fastify
  server.ts        app assembly (swagger, error handler, health)
  schemas.ts       reusable JSON Schema fragments
  domains/*        one manifest per business domain (14 domains)
scripts/
  export-openapi.ts   openapi.json
  gen-docs.ts         API_ENDPOINTS.md
  setup-test-db.sh    fresh test DB (migrations + seed + auth adapter + login role)
  run-tests.sh        fresh-DB-per-suite integration runner
sql/auth_adapter.sql  self-host adapter for auth.uid() (unnecessary on Supabase)
test/*                HTTP integration tests against the real database
```

## Quick start

```bash
npm install
cp .env.example .env      # set DATABASE_URL, JWT_SECRET, SERVICE_TOKEN
npm run typecheck
bash scripts/run-tests.sh # requires PostgreSQL 15+
npm run dev               # http://localhost:8080 (GET /health, GET /openapi.json)
```
