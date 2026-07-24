# Running the SJKVY site with the backend

The public website (this `sjkvy-web` app) talks to the SJKVY backend (`../sjkvy-api`, a
Fastify API over the PostgreSQL function catalogue in `../sjkvy-db`). Only the **public**
(anonymous) API endpoints are used by the public site; portal/dashboard features arrive with
their design batches.

## What is wired to the backend (Batch 1)

| Page / feature | Endpoint | Status |
|---|---|---|
| **Certificate verification** (`/certificate-verification`, `/faq`) | `GET /verify/:code` | ✅ Live. Real lookup; the result card shows the real holder / course / issue date, or a "not found" state. |
| Public course catalogue (client helper `listCourses()`) | `GET /public/courses` | ✅ Endpoint live and available via `src/lib/api.ts`. Not injected into the marketing cards (that would alter the Stitch design); ready for the application flow when its screens land. |
| **Login** (`/login`) | — | ⏸ The API is **not** the auth authority by design — it verifies JWTs issued by an external identity provider (Supabase Auth). There is no password endpoint to call, and the database has no credential store. Wiring real sign-in needs that provider configured (or a dev token issuer). Form is left exactly as designed. |
| **Contact** (`/contact`) | — | ⏸ No contact/enquiry endpoint exists in the backend. Wiring it needs a new public endpoint + table (a small backend addition). Form is left exactly as designed. |

The frontend API base URL is read from `VITE_API_BASE_URL` (see `.env.example`); it defaults
to `http://127.0.0.1:8080`.

## 1. Database (PostgreSQL 15+)

```bash
cd ../sjkvy-db
# apply the test harness (roles + auth.uid), then migrations 0000→0005, then seed:
psql -f tests/plain/00_harness.sql "$DB"
for m in 0000_schema 0001_foundation 0002_functions_core 0003_functions_remaining 0004_catalogue_crud 0005_worker; do
  psql -v ON_ERROR_STOP=1 -f "migrations/$m.sql" "$DB"
done
psql -f tests/plain/01_seed.sql "$DB"
# create the API login role (member of anon/authenticated/service_role):
psql "$DB" -c "CREATE ROLE sjkvy_api_login LOGIN; GRANT anon, authenticated, service_role TO sjkvy_api_login;"
```

(A verifiable demo certificate with code `SJKVY-2024-8842` and a few extra courses can be
seeded on top — see the seed snippet in the delivery notes.)

## 2. API

```bash
cd ../sjkvy-api
npm install
DATABASE_URL=postgres://sjkvy_api_login@127.0.0.1:5432/<DB> \
JWT_SECRET=<32+ char secret> SERVICE_TOKEN=<24+ char> \
STORAGE_URL_SIGNING_SECRET=<32+ char> \
CORS_ORIGINS=http://127.0.0.1:4173,http://localhost:5173 \
npm run dev            # serves on http://127.0.0.1:8080
```

Smoke test: `curl http://127.0.0.1:8080/verify/SJKVY-2024-8842`

## 3. Web

```bash
cd sjkvy-web
npm install
npm run localize-images   # one-time: pull Stitch images into public/img (self-contained)
npm run dev               # http://127.0.0.1:5173  (or `npm run build && npm run preview`)
```

Open `/certificate-verification`, enter `SJKVY-2024-8842`, and the card fills from the live
database. Any unknown code returns the "No Valid Certificate Found" state.

## Images are local

`npm run localize-images` downloads every Stitch CDN image into `public/img/` and writes
`scripts/image-map.json`; `npm run convert` rewrites the generated pages to those local
paths. The images are identical to the Stitch export — just served locally so nothing breaks
when the temporary CDN expires. `_stitch_raw/` (the canonical source) is left untouched.
