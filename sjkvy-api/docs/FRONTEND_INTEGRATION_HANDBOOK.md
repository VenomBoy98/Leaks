# SJKVY — Frontend Integration Handbook

For the team integrating the portals with the backend. The API is a thin, typed surface
over the database; **all authorization is server-side** — the frontend never enforces
access, it only calls endpoints and renders what the API returns. Full reference:
`openapi.json` (import into your client generator) and `API_ENDPOINTS.md`.

## 1. Ground rules for the frontend

- **Never** put business rules or authorization in the client. If the user shouldn't see
  something, the API returns 0 rows / 404 — render accordingly.
- **Never** hold the service token or any DB/storage credential in the browser. The
  browser only ever holds the user's access token (JWT).
- Treat `404` on a resource you expected as "not visible to you" (non-leak mask), not
  necessarily "doesn't exist".
- Generate a typed client from `openapi.json` (e.g. `openapi-typescript` + a fetch
  wrapper). Do not hand-roll types.

## 2. Auth

1. The user signs in with the auth provider (Supabase/Auth0/Cognito) — the frontend uses
   the provider's SDK for sign-in, session, and refresh.
2. On every API call, send `Authorization: Bearer <access_token>`. The token `sub` must
   be the user's `app.profiles.id`.
3. On `401`, refresh the token via the provider and retry once; if still 401, sign out.
4. Roles are **not** in the frontend's control — the API maps the token to a DB role. The
   UI can read the user's staff memberships (`GET /auth/me` + staff endpoints) to decide
   which nav to show, but must not rely on that for security.

## 3. Standard response & error contract

- Success: JSON object, or `{ "items": [...] }` for list reads.
- Error: `{ "code": "E.<CLASS>.<NAME>", "message": string, "detail"?: any, "requestId": string }`.
- Status map: `400` validation, `401` auth, `403` forbidden, `404` not found/not visible,
  `409` conflict/invalid-transition/duplicate, `422` validation/eligibility, `429` rate
  limited, `500` server. Show `message`; log `requestId` for support.

## 4. Idempotency (required on state-changing calls)

Endpoints marked idempotent (submit, admission, offer accept, hostel allocate, cert
issue, etc. — see `API_ENDPOINTS.md`) **require** an `Idempotency-Key: <uuid>` header.
Generate one UUID per user action and reuse it if you retry that same action; a new
action gets a new key. Reusing a key with a different body → `409`.

## 5. Portal → endpoint map (starting points; full list in API_ENDPOINTS.md)

### Public website
- `GET /public/courses` (anon) — course catalog for the apply form.
- `GET /verify/:code` (anon) — certificate verification page (rate-limited 20/min).

### Applicant Portal (role: applicant, own data)
- `GET /auth/me`, `PATCH /auth/me`
- `POST /applications`, `GET /applications`, `GET /applications/:id`
- `PATCH /applications/:id/draft`, `POST /applications/:id/submit` (idem),
  `POST /applications/:id/withdraw` (idem), `POST /applicants/claim` (idem)
- Documents: `POST /documents/:appId/upload-url` → PUT bytes → `POST /documents/:appId/finalize`;
  `GET /applications/:id/documents`; `GET /documents/:vid/download-url`
- Offers: `GET /applications/:id/offers`, `POST /offers/:id/accept` (idem), `.../decline`
- `GET /notifications`, `POST /notifications/:id/read`

### Student Portal (role: student = enrolled applicant)
- `GET /enrolments`; attendance `GET /sessions/:id/attendance`; assessments
  `GET /batches/:id/assessments`, `GET /assessments/:id/results`
- Hostel: `POST /enrolments/:id/hostel-request`, `GET /enrolments/:id/hostel-requests`,
  `POST /hostel/requests/:id/cancel`
- Certificates: appear via enrolment; verify is public.
- Placement: `POST /placement/profile`, `.../withdraw`, `GET /placement/opportunities`,
  `GET /placement/referrals`

### Staff Portal (operator/checker/counsellor/trainer/hostel_manager/placement)
- Operator: `POST /applications/assisted`
- Checker: `GET /verification/cases`, `POST /verification/cases/:id/assign|decisions|corrections|fail`
- Counsellor: `POST /applications/:id/counselling`, `.../counselling/:id/outcome|reschedule|no-show`
- Trainer: `POST /sessions`, `POST /sessions/:id/attendance`, `POST /sessions/:id/lock`,
  `POST /assessments/:id/results`
- Hostel manager: `POST /hostel/requests/:id/approve|allocate`, `POST /hostel/allocations/:id/discharge`,
  inventory `POST /hostel/blocks|.../rooms|.../beds`
- Placement staff: `POST /placement/employers|opportunities|.../referrals`, `.../outcome`

### Centre Admin Portal (centre_admin / super_admin)
- Admissions: `POST /applications/:id/admission` (idem), `POST /batches/:id/waitlist/promote` (idem)
- Enrolment lifecycle: confirm-joining, not-joined, transfer, complete, drop
- Catalogue CRUD: `POST /admin/batches`, `PATCH /admin/batches/:id`, `.../status`,
  `POST /batches/:id/assessments`, `POST /admin/notices` (+audiences, publish)
- Certificates: issue/reissue/revoke
- Governance: `POST /admin/memberships/grant|revoke`, `POST /admin/staff/:id/deactivate`,
  `PUT /admin/config/:key` (super_admin), `POST /admin/exports`, `GET /admin/audit`

## 6. File upload (exact sequence)

```
1. POST /documents/:appId/upload-url  { document_type, mime, size }  -> { object_key, url, ... }
2. PUT  <url>  (body = file bytes, Content-Type = the mime you declared)   -> 204
3. POST /documents/:appId/finalize   { document_type, object_key, mime, size, sha256? } -> { version_id, scan_status }
4. (later) GET /documents/:versionId/download-url -> { url }  then GET <url> for bytes
```
Show `scan_status`; a document isn't "accepted" until a checker decides it. Never display
or store `object_key` as a link — always fetch a fresh signed `download-url`.

## 7. Performance tips for the client

- List reads are `LIMIT`-bounded (≤200) and RLS-scoped — paginate/filter client-side or
  request narrower lists; don't assume unbounded results.
- Cache immutable/public reads (`/public/courses`, verified certificates) with sensible
  TTLs; do not cache authenticated reads across users.
- Batch UI actions to reuse one idempotency key per logical action.
- Expect `429` on aggressive polling; back off. Prefer notifications (`GET /notifications`)
  over tight polling of state.

## 8. Do / Don't

- ✅ Generate types from `openapi.json`; handle the uniform error envelope centrally.
- ✅ Attach `Authorization` + `Idempotency-Key` via a shared fetch wrapper.
- ✅ Treat 404/empty as "not permitted/visible" gracefully.
- ❌ Don't gate security in the UI, hold server secrets, hardcode object keys, or
   re-implement any workflow rule — the API already enforces them.
