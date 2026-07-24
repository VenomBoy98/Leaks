# SJKVY Backend — Production Integration Guides

How to connect the backend to real external services. The API architecture does not
change: the database stays authoritative, `auth.uid()` still drives RLS, and storage
authorization stays in `fn_authorize_doc_view`. These are configuration + adapter swaps.

---

## 1. Auth provider (Task 3)

The API verifies access tokens itself and passes the verified `sub` to the database as
`request.jwt.claims`. It supports HS256 (shared secret) and asymmetric providers via
JWKS. The token `sub` MUST equal `app.profiles.id`.

### Supabase Auth
```
JWT_JWKS_URI=https://<ref>.supabase.co/auth/v1/.well-known/jwks.json
JWT_ISSUER=https://<ref>.supabase.co/auth/v1
JWT_AUDIENCE=authenticated
```
On Supabase the platform provides `auth.uid()` and the roles, so **do not** apply
`sql/auth_adapter.sql`. Provision each user's `app.profiles` row (id = auth user id) via
the self-create flow (applicants) or `fn_staff_register` (staff). Legacy projects may
instead set `JWT_SECRET` to the project JWT secret (HS256).

### Auth0
```
JWT_JWKS_URI=https://<tenant>.auth0.com/.well-known/jwks.json
JWT_ISSUER=https://<tenant>.auth0.com/
JWT_AUDIENCE=<api-identifier>
```
Add a rule/action that sets `sub` to the SJKVY profile id (or map it in the API by
looking up an external-id column if you prefer opaque provider ids — a small change in
`resolveActor`).

### AWS Cognito
```
JWT_JWKS_URI=https://cognito-idp.<region>.amazonaws.com/<pool-id>/.well-known/jwks.json
JWT_ISSUER=https://cognito-idp.<region>.amazonaws.com/<pool-id>
JWT_AUDIENCE=<app-client-id>
```

**Validation (staging):** obtain a real token, call `GET /auth/me` (200 + correct
profile), confirm an expired/foreign-signed token → 401, and confirm RLS scoping with
two different users. Covered by the staging checklist (§4).

---

## 2. Object storage (Task 2)

The skeleton ships a **local filesystem driver** (tested) behind `src/storage.ts`. The
production pattern returns the storage's **native presigned URLs** directly to the client
so bytes never transit the API. Two supported backends:

### Amazon S3
- Bucket: private, block public access, SSE (SSE-S3 or KMS), lifecycle to expire
  incomplete uploads. CORS allowing PUT/GET from the app origin.
- Replace `Storage.signUpload/signDownload` to return S3 presigned URLs
  (`@aws-sdk/s3-request-presigner` `getSignedUrl` with `PutObjectCommand` /
  `GetObjectCommand`, short TTL). `object_key` stays the DB `storage_path`.
- `exists()` → `HeadObject`. `finalize` still calls `fn_finalize_upload` with the key.
- Env: `STORAGE_DRIVER=s3`, `S3_BUCKET`, `S3_REGION`, credentials via IAM role (preferred)
  or `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`. Drop the `/storage/*` gateway routes.

### Supabase Storage
- Private bucket. Use `createSignedUploadUrl(path)` and `createSignedUrl(path, ttl)` from
  the service client (service-role key, server-side only).
- Env: `STORAGE_DRIVER=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `STORAGE_BUCKET`. The service-role key is server-only; never ship it to the browser.

In both cases the authorization decision is unchanged: `GET /documents/:versionId/
download-url` calls `fn_authorize_doc_view` (owner/checker/admission only, audited) and
only then asks the driver to presign. `storage_path` is never returned to clients.

**Antivirus:** on upload completion, trigger a scan (Lambda/ClamAV) that calls
`POST /documents/:versionId/scan-result` with `CLEAN`/`FLAGGED`. FLAGGED versions never
become the document's current version.

**Validation (staging):** upload via presigned PUT, finalize, download via presigned GET,
confirm an unrelated user is denied (404), confirm the raw path is never returned.

---

## 3. Notification providers (Task 4)

The worker (`src/worker`) is complete and DB-driven; wire real providers in
`src/worker/providers.ts` `buildProviders()`:
- **SMS:** Twilio / MSG91 (India) — implement `send()` → provider API; return
  `{ok, providerRef}` or `{ok:false, error}`.
- **Email:** SES / SendGrid.
- **Push:** FCM / APNs.

Retry and dead-letter are already handled by the database (`fn_delivery_record` vs
`notif_max_attempts`); providers only send and report. Verify inbound delivery-status
webhooks (signed) before calling `fn_delivery_record`.

Run it: `npm run worker` (or the `worker` compose service — add one mirroring `api` with
`command: node dist/worker/index.js`). It needs the same `DATABASE_URL` as the API.

---

## 4. Staging validation checklist (Task 5)

Run against an isolated Supabase (or equivalent) staging project — **not** production.
Blocked in the build sandbox (no staging credentials/network); execute during rollout.

1. **Migrations:** apply 0000–0005 to staging; run `ci/gate.md` order.
2. **Auth:** real token → `GET /auth/me` 200; expired/foreign token → 401; RLS scoping
   across two users; `role` claim spoof → 403.
3. **RLS/DEFINER:** cross-owner and cross-centre reads = 0 rows; document-view denial.
4. **Storage:** presigned upload/finalize/download; unrelated user denied; no path leak;
   AV FLAGGED path.
5. **API:** run the four functional suites against staging.
6. **Concurrency:** parallel seat/bed/waitlist/claim — invariants hold.
7. **Idempotency:** replay returns stored result; same-key/different-body → 409.
8. **Worker:** emit events → notifications delivered; force failures → retry → FAILED DLQ.
9. **Ops:** `/ready` reflects DB health; `/metrics` scrapes; audit rows present.

Promote to production only when every item passes.
