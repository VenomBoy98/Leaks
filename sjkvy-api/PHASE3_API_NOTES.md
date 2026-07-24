# SJKVY Phase 3 — API layer notes

**Date:** 2026-07-11 · **Runtime:** Node 22, Fastify 5, TypeScript 5, `pg` 8, PostgreSQL 16.13.
**Status:** API surface complete across all 14 domains; typecheck clean; 20 integration
assertions pass end-to-end over HTTP against the real database (19 lifecycle/security +
1 API-level seat race). OpenAPI (`openapi.json`, 84 paths) and the endpoint reference
(`API_ENDPOINTS.md`, 88 operations) are generated from the same manifest.

## 1. Architecture — the API is thin by construction

The database is the authoritative business layer. The API adds **no** business logic:

- **One access path** (`src/db.ts`). Every request runs in a transaction that
  (1) sets `request.jwt.claims` so the database's `auth.uid()` returns the caller and
  (2) `SET LOCAL ROLE` to exactly one of `anon | authenticated | service_role`. It then
  invokes a catalogue function or a narrow RLS-scoped SELECT. RLS, SECURITY DEFINER
  boundaries, idempotency (`fn_idem_begin/finish`) and row-lock concurrency all execute
  **inside** the database, exactly as verified in Phase 2.
- **Declarative manifest** (`src/domains/*`). Each endpoint is one `Operation` object
  describing method, path, auth mode, the DB function it calls (or the scoped read/
  write), and its schemas. The router, OpenAPI generator and docs generator all consume
  this single source of truth, so the spec cannot drift from the implementation.
- **No ORM, no table CRUD.** Mutations call `app.fn_*(...)`. Reads are bounded SELECTs
  the DB already exposes via GRANT SELECT + policy. Six operations are column-limited
  direct writes the DB grants to `authenticated` (attendance mark, session create,
  result record, profile update, mark-read, draft autosave) — these are exactly the
  writes the database authorizes, not logic added here.

### Request → identity → enforcement

```
HTTP request
  → resolveActor (src/auth.ts): verify JWT (user) / service token (service) / anon
  → withActor (src/db.ts): BEGIN; set request.jwt.claims; SET LOCAL ROLE; ...
  → callFn('fn_...', args)  OR  scoped SELECT/DML
  → database enforces authz + state + idempotency + locks
  → COMMIT; map any RAISE to an HTTP error envelope (src/errors.ts)
```

## 2. Auth model

| Mode | Role | Used by |
|---|---|---|
| `none` | `anon` | public course catalog, certificate verification |
| `user` | `authenticated` | all portal operations; `auth.uid()` = verified JWT `sub` |
| `service` | `service_role` | `[SYS]` server-to-server: document pipeline, outbox/jobs, staff bootstrap |

The API is the JWT trust boundary; **identity / OTP / session issuance belong to the
external auth provider** (Supabase Auth or equivalent), not to this API or the DB. The
API never trusts a client-supplied user id — it derives `sub` from a verified token.

### Deployment auth adapter

`sql/auth_adapter.sql` is **not** part of the frozen migrations. On Supabase it is
unnecessary (the platform supplies `auth.uid()` + the three roles). For self-hosted
PostgreSQL it reproduces that contract so the identical, already-tested security model
runs unchanged. A runtime bug here was caught by the integration tests and fixed:
`auth.uid()` now tolerates an empty/unset claims GUC (`''::jsonb` is invalid JSON), and
`db.ts` sends `'{}'` for anonymous requests.

## 3. Idempotency & concurrency

- Idempotent operations (those whose function takes `p_idem, p_hash`) require an
  `Idempotency-Key: <uuid>` header. The API forwards it plus a stable request hash; the
  **database** owns the guarantee. Verified: a replay returns the stored response with
  `replayed: true`; a same-key/different-body request yields `E.CONFLICT.DUPLICATE` (409).
- Concurrency safety is entirely the DB's (locks in the catalogue functions). The
  API-level seat-race test drives two parallel HTTP finalizes at a capacity-1 batch and
  observes exactly one `APPROVED` + one `WAITLISTED`, invariant intact (SEC-CONC-001).

Note (Fastify): response schemas are serialized with `additionalProperties: true` so the
DB's `replayed` marker (and forward-compatible fields) are never stripped; request
bodies keep strict validation.

## 4. Error mapping (`src/errors.ts`)

Stable DB codes → HTTP: `E.RES.NOT_FOUND`→404 (also the deliberate non-leak mask for
authorization), `E.STATE.INVALID_TRANSITION`→409, `E.VAL.FAILED`/`ELIGIBILITY_FAILED`→422,
`E.CONFLICT.*`→409, `E.AUTHZ.FORBIDDEN`→403. Raw SQLSTATE privilege/RLS failures (42501)
become 403 without leaking table or policy internals.

## 5. Domain coverage (14/14)

authentication · applicants · documents · verification · counselling · admissions ·
joining · attendance · hostel · assessments · certificates · placement · notifications ·
centre-administration. Every one of the 65 catalogue mutation/eval ops is reachable, plus
the 6 direct-write ops and the RLS-scoped reads each domain needs. See `API_ENDPOINTS.md`.

## 6. Known gaps carried forward (not invented in the API)

These are **database** gaps flagged in the Phase-1 audit; the API does not fabricate
endpoints for operations the catalogue does not safely implement:

1. **Admin catalogue CRUD is missing in the DB** — no function/policy to create
   `batches`, `courses`, `assessments`, `hostel_blocks/rooms/beds`, `events`, `notices`
   (draft), `employers`, `job_opportunities`. Today only the seed creates them. The API
   therefore exposes reads for these but no create endpoints (e.g. no "create assessment").
   This needs a future migration (candidate 0004) before the Centre Admin portal is
   fully functional. Recommended as the first Phase-4 DB task.
2. **Storage backend is external.** `doc.finalize_upload` / `doc.get_view_url` record and
   authorize; the actual byte upload and signed-URL minting live in the server/storage
   tier (Supabase Storage or S3) and are out of scope for this API skeleton.
3. **Rate limiting** (esp. public `cert.verify`) and **CSV-injection neutralization** for
   exports are API/worker-tier concerns to add before production, not DB concerns.

## 7. Running it

```bash
cd sjkvy-api && npm install
cp .env.example .env    # fill DATABASE_URL, JWT_SECRET, SERVICE_TOKEN
npm run typecheck
npm run openapi         # regenerate openapi.json
npx tsx scripts/gen-docs.ts   # regenerate API_ENDPOINTS.md
bash scripts/run-tests.sh     # fresh DB per suite, runs all integration tests
npm run dev             # start the server
```

The test runner builds a fresh `sjkvy_api` database (migrations 0000–0003 + seed +
`auth_adapter.sql`) and a least-privileged `sjkvy_api_login` role, then runs each suite.
Requires PostgreSQL 15+.

## 8. Not started (per instruction)

No frontend integration. The API surface is complete and tested; Phase 4 (frontend
mock-to-real integration) can begin against these endpoints once the admin-CRUD DB gap
in §6.1 is scheduled.
