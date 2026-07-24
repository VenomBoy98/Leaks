# SJKVY Backend — Developer Guide

Everything a new engineer needs to run, understand, and extend the backend. Companion:
`ARCHITECTURE.md` (diagrams), `INTEGRATION_GUIDES.md` (external services),
`reports/DEPLOYMENT_GUIDE.md` (prod).

## 1. Folder structure

```
sjkvy-db/                     # the business layer (authoritative)
  migrations/0000..0005.sql   # schema, RLS, functions (0000-0003 FROZEN; 0004-0005 additive)
  tests/plain/t01..t05.sql    # runtime SQL tests    tests/concurrency/*.sh  race tests
  tests/run_all.sh            # gate -> migrate -> seed -> L1 -> L2 -> verdict
  ci/{static_checks,semantic_check}.py, gate.md   # static + semantic gates
  MANIFEST.sha256             # byte-freeze of the artifacts

sjkvy-api/
  src/
    index.ts                  # API entrypoint
    config.ts                 # env config + fail-fast validation
    db.ts                     # THE ONLY DB access path (withActor, callFn, queryRead, elevatedActor)
    auth.ts                   # JWT/service-token -> Actor{role, uid}
    errors.ts                 # DB domain codes -> HTTP envelope
    idempotency.ts            # Idempotency-Key + request hash
    operation.ts              # the declarative Operation type
    router.ts                 # generic handler binding Operations -> Fastify
    schemas.ts                # reusable JSON Schema fragments
    server.ts                 # app assembly (helmet, cors, rate-limit, swagger, health/ready/metrics)
    observability.ts          # Prometheus metrics
    storage-routes.ts         # document pipeline routes (upload-url/finalize/download-url + gateway)
    domains/*.ts              # one operation manifest per business domain (14 domains)
    storage/                  # driver.ts (interface) + local.ts + s3.ts + supabase.ts + index.ts (factory)
    worker/                   # notification-worker.ts + providers.ts + channels.ts + index.ts
  test/                       # HTTP integration + unit tests (vitest)
  scripts/                    # setup-test-db, run-tests, export-openapi, gen-docs,
                              #   loadtest.mjs, security-probe.mjs, check-openapi-parity.mjs
  sql/auth_adapter.sql        # self-host auth.uid() (NOT applied on Supabase)
  deploy/                     # db-init.sh, nginx.conf, .env.compose.example
  docs/ + reports/            # this guide, architecture, handbooks, audit reports
  Dockerfile, docker-compose.yml, openapi.json, API_ENDPOINTS.md
```

## 2. Local setup

```bash
# Postgres 15+ running locally (dev box: sudo pg_ctlcluster 16 main start)
cd sjkvy-api
npm install
cp .env.example .env                 # fill DATABASE_URL, JWT_SECRET, SERVICE_TOKEN, STORAGE_URL_SIGNING_SECRET
npm run typecheck
bash scripts/run-tests.sh            # builds a fresh DB per suite, runs unit + 5 integration suites
npm run dev                          # http://localhost:8080  (GET /health, /openapi.json)
npm run worker                       # notification worker (separate process)
```

## 3. How a request works (mental model)

1. `server.ts` registers every `Operation` from `domains/index.ts` via `router.ts`, plus
   the storage routes and `/health` `/ready` `/metrics`.
2. `router.ts` resolves the `Actor` (`auth.ts`), builds args from the manifest, and calls
   `db.ts` (`callFn` for mutations, `queryRead` for reads, or a `write` for the 6 DW ops).
3. `db.ts` runs everything in one transaction with the caller's `role` + `sub` set, so the
   database enforces RLS/DEFINER/idempotency/locks. Errors map to a uniform envelope.

## 4. Adding an endpoint (the only pattern)

Add an `Operation` to the relevant `domains/*.ts`:
```ts
{ domain: 'applicants', opId: 'application.submit', method: 'POST',
  path: '/applications/:id/submit', auth: 'user',
  fn: 'fn_submit_application', idempotent: true,
  args: (ctx) => [ctx.params.id],           // idempotency pair appended by the router
  response: obj({ status: {type:'string'} }), errors: ['E.STATE.INVALID_TRANSITION'] }
```
Then `npm run openapi && npx tsx scripts/gen-docs.ts` and add an integration test.
**Rule:** mutations MUST call an existing `app.fn_*`; never write raw SQL business logic.
The only raw writes allowed are the 6 column-limited DW policy writes already present.

## 5. Adding a database function (new business capability)

Add a new migration (`0006_*.sql`), following 0002–0005: `SECURITY DEFINER`, owner
`sjkvy_def`, pinned `search_path`, `_req_staff` scope checks, audit + outbox, EXECUTE
grant. Add SQL tests, run `tests/run_all.sh` to green, then expose it via a new
`Operation`. Never edit an applied migration.

## 6. Commands

| Command | What |
|---|---|
| `npm run dev` / `npm run worker` | run API / worker |
| `npm run build` | compile to `dist/` (Docker uses this) |
| `npm run typecheck` | tsc --noEmit |
| `bash scripts/run-tests.sh` | unit + 5 integration suites (fresh DB per suite) |
| `npm run openapi` | regenerate `openapi.json` |
| `npx tsx scripts/gen-docs.ts` | regenerate `API_ENDPOINTS.md` |
| `npx tsx scripts/check-openapi-parity.mjs` | assert spec == route surface |
| `node scripts/loadtest.mjs <url> <jwt>` | load test a running API |
| `node scripts/security-probe.mjs <url> <secret>` | penetration-style probes |
| `sudo -u postgres bash ../sjkvy-db/tests/run_all.sh <db>` | full DB suite |

## 7. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Startup aborts `Invalid configuration` | Missing/weak/placeholder secret in production. Set real `JWT_SECRET`/`SERVICE_TOKEN`/`STORAGE_URL_SIGNING_SECRET` (≥ required length, not "example/test-/changeme"). |
| 401 on every user request | JWT not verifiable: wrong `JWT_SECRET`/`JWT_JWKS_URI`, or `iss`/`aud` mismatch, or expired token. |
| 403 `E.AUTHZ.FORBIDDEN` on a read | RLS scoped the row out (correct) OR the DB login role lost `authenticated` membership. Check `GRANT authenticated TO sjkvy_api_login`. |
| `permission denied for table ...` in logs | Something bypassed a function and hit a table the role can't touch. All mutations must go through `app.fn_*`; `service_role` has 0 table grants by design. |
| `infinite recursion detected in policy` | A new policy embedded a raw cross-table subquery. Use a `SECURITY DEFINER` scope helper (pattern in 0001). |
| Idempotent call returns 409 `E.CONFLICT.DUPLICATE` | Same `Idempotency-Key` reused with a different body. Use a fresh key per distinct request. |
| Upload finalize 422 "object not found" | Client didn't PUT to the signed URL before calling finalize, or wrong `object_key`. |
| Download 404 for a valid doc | Caller isn't owner/checker/admission (SEC-DOC-004) — non-leak mask. |
| Worker never delivers | Worker process not running, or no provider configured (defaults to mock). Check `NOTIFY_*` env and `npm run worker` logs. |
| `/ready` 503 | DB unreachable — check `DATABASE_URL`, network, `sslmode`. |
| Pool exhaustion / "too many clients" | `PG_POOL_MAX × replicas` exceeds Postgres `max_connections`; lower it or add pgBouncer. |

## 8. Golden rules

- PostgreSQL is the business layer. The API/worker add no logic.
- Mutations call `app.fn_*`; reads are RLS-scoped SELECTs under the caller's role.
- Never weaken grants; never expose internal tables or `storage_path`.
- Frozen migrations 0000–0003 are byte-immutable; new work is a new migration with tests.
