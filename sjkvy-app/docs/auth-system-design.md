# SJKVY Authentication & Authorization — Design

Status: design (written before implementation, self-reviewed at the end).
Scope: first-party **password + email-OTP** authentication, opaque server-side sessions,
role-based portal authorization, administrator-generated role codes, and a secure admin
security console — built into the **existing** architecture, not a replacement.

## 1. Architecture detected (what we build on, not around)

- **DB**: PostgreSQL, schema `app`, RLS + `SECURITY DEFINER` functions. `service_role` holds
  function EXECUTE + narrow table grants; `anon`/`authenticated` reach data only through RLS.
  Users are `app.profiles`; staff roles are `app.staff_memberships (profile_id, centre_id,
  role_code)` against `app.roles` (`centre_admin, checker, counsellor, hostel_manager,
  operator, placement, super_admin, trainer`). `applicant`/`student` are **derived** (a row in
  `app.applicants` / `app.students`), not stored role codes.
- **API**: Fastify (`sjkvy-api`), operation manifest. `db.ts` runs each request in a
  transaction that sets `request.jwt.claims` and `SET LOCAL ROLE`. Only the API has a DB
  connection (login role is a member of `anon`/`authenticated`/`service_role`).
- **Frontend**: Next.js 14 App Router (`sjkvy-app`). A strictly **allowlisted** BFF proxy
  (`/api/proxy/[...path]`) attaches the session credential server-side; the browser never holds
  the API JWT. Dev sign-in is `/api/dev-login` (mints an HS256 JWT for a seeded role) — this is
  what production auth replaces. Middleware role-gates portal zones.
- **Existing auth today**: JWT session cookie minted by the dev issuer; **no** email/password/
  OTP store (migration `0007_email_auth` was always planned and deliberately absent).

## 2. Key decisions

1. **Reuse the reference schema** shipped in the handoff zip (`sjkvy-auth-work/.../0007_email_auth.sql`)
   — it already matches this architecture (profiles-as-users, staff_memberships roles, opaque
   `auth_sessions`, digest-only secrets, service-only tables). We adopt it as
   **`migrations/0012_email_auth.sql`** — the next free number that sorts **after** every applied
   migration (0000–0005, 0008–0011), so the ledger applies it last with no out-of-order concern.
   It is otherwise additive (new tables) and only `CREATE OR REPLACE`s two existing functions
   whose signatures match exactly (verified).
2. **Auth logic lives in `sjkvy-api`** (the only component with a DB connection). New auth tables
   grant DML to `service_role`; the API runs auth flows in `service_role` transactions
   (`db.withRole`). Password hashing (**Argon2id**, `@node-rs/argon2`), OTP HMAC, and email live
   in the API (Node).
3. **Opaque server-side sessions** (not JWT-to-browser). After OTP verification the API creates a
   row in `app.auth_sessions` storing only the SHA-256 digest of a 256-bit random token; the
   plaintext token is returned once to the Next BFF, which sets it as an `HttpOnly, Secure,
   SameSite=Lax` cookie (`sjkvy_session`) plus a readable `sjkvy_csrf` cookie (double-submit).
   This gives real **revocation** and **rotation**, which a bare JWT cannot.
4. **Proxy integration without changing the API's auth model**: for each authenticated request the
   Next BFF resolves `sjkvy_session` via the API's `POST /auth/session/introspect` (service),
   gets `{profile_id, roles}`, mints a short-lived HS256 JWT server-side (shared secret, as
   `/api/dev-login` does today) and forwards it. The API stays unchanged; the browser never holds
   a JWT. `/api/dev-login` remains dev/test-only (404 in production).
5. **Roles**: public registration always yields the lowest privilege (an unverified `profiles`
   row with **no** staff membership and no applicant/student derivation → effectively `USER`).
   Privileged roles are granted only by an admin or by redeeming an **admin-generated role code**.
   The task's `USER/APPLICANT/STUDENT/STAFF/ADMIN/SUPER_ADMIN` map to: no-membership /
   applicant-derived / student-derived / any staff role / `centre_admin` / `super_admin`.

## 3. Data model (migration 0012)

| Table | Purpose | Notes |
|---|---|---|
| `auth_credentials` | email + Argon2id hash per profile | `email_normalized` unique CI + format CHECK; `email_verified_at`; `failed_password_attempts` + `password_locked_until` (lockout); `credential_version` (bumped on password change to invalidate challenges/sessions logically) |
| `auth_challenges` | OTP challenges | `purpose ∈ {registration,login,password_reset}`; `otp_digest char(64)` = HMAC-SHA256(otp) hex; `ip_hash`; `expires_at`; `attempts_remaining`; `delivered_at`; `consumed_at`; partial UNIQUE `(profile_id,purpose) WHERE delivered_at IS NOT NULL AND consumed_at IS NULL` → **a new delivered OTP invalidates the prior one** |
| `auth_sessions` | opaque sessions | `token_digest` UNIQUE (sha256), `csrf_digest`, `expires_at`, `revoked_at`, `last_seen_at` |
| `auth_role_codes` | admin-generated grants | `code_digest` UNIQUE (sha256 of ≥128-bit code), `role_code REFERENCES roles CHECK (<>'super_admin')`, `centre_id`, `expires_at`, `max_uses`, `use_count ≤ max_uses`, `email_restriction`, `is_active`, `created_by`, `revoked_by` |
| `auth_role_code_redemptions` | atomic redemption ledger | UNIQUE `(code_id, profile_id)` |
| `auth_security_events` | append-only audit | trigger blocks UPDATE/DELETE |

All six tables: `ENABLE`+`FORCE ROW LEVEL SECURITY`, `REVOKE ALL FROM PUBLIC/anon/authenticated`,
DML granted only to `service_role`. Secrets are **never** stored in plaintext.

## 4. OTP security (implemented in the API)

- 6 digits from `crypto.randomInt` (CSPRNG). Expiry **5 min**. Single-use (`consumed_at`,
  consumed inside the same `SELECT … FOR UPDATE` transaction so concurrent verifies can't double-spend).
- **≤5 attempts** (`attempts_remaining`), **≥60 s** resend cooldown, hourly issue caps per
  email + per IP; verification rate-limited per challenge + IP.
- Stored as **HMAC-SHA256(otp, OTP_HMAC_SECRET)** hex; compared with `crypto.timingSafeEqual`.
  Plaintext OTP is never stored, logged, or returned by any production API.
- Issuing a new challenge for a `(profile,purpose)` marks any prior delivered-unconsumed one
  consumed (enforced by the partial unique index + repository logic).

## 5. Flows

- **Register**: validate → normalize email → create unverified `profiles`+`auth_credentials`
  (Argon2id) → issue `registration` OTP → email. Duplicate email returns the **same generic**
  "check your email" response (no enumeration); if an unverified account exists we re-issue.
  Session created only after `register/verify`.
- **Login**: verify password **first** (generic error on failure; lockout after N fails) → only
  then issue a `login` OTP. Suspended/inactive accounts get the generic response and **no** OTP.
  Session created only after `login/verify`.
- **Password reset**: `forgot` always returns generic; issues a `password_reset` OTP only for a
  real verified active account → `reset` verifies OTP + sets new Argon2id hash → bumps
  `credential_version`, **revokes all sessions**, sends a change-notification email.
- **Session**: created on verify with a rotated id; `introspect` validates + refreshes
  `last_seen`; `logout` revokes the current session.

## 6. Role codes & admin console

- Codes: 160-bit base32 (≥128-bit), shown once, stored as digest. Redeem requires an
  authenticated **verified active** user; consumed atomically (`UPDATE … WHERE use_count <
  max_uses` guarded, insert redemption in the same tx) so concurrency can't exceed `max_uses`.
  Never grants `super_admin`; `centre_admin`/admin codes only creatable by a `super_admin`.
  Every create/redeem/revoke/reject writes an `auth_security_events` row.
- Admin console (Next, under the admin portal, server-authorized): user search/filter, role
  history, grant/remove permitted roles, suspend/reactivate, revoke all sessions, role-code
  CRUD, audit log. Guards: no self-promotion; cannot suspend/remove the **last** `super_admin`;
  an admin cannot edit a higher-privileged admin; protected fields never mass-assignable.
- **Bootstrap**: a one-time CLI (`npm run bootstrap-superadmin -- <email>`) that creates/ං
  promotes the first `super_admin`. No public bootstrap endpoint. Plus a CLI to grant/revoke roles.

## 7. Sessions & browser security

`HttpOnly, Secure, SameSite=Lax` opaque cookie; CSRF double-submit for state-changing requests;
session id **rotated** after OTP verify and privilege change; **revoked** on password reset,
suspension, logout, and admin "revoke all". No secrets in `localStorage` or logs. Security
headers + narrow CORS at the framework layer. `/api/dev-login` 404 in production.

## 8. Env (placeholders only; never commit real values)

`RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL`, `OTP_HMAC_SECRET`, plus existing `JWT_SECRET` /
`SERVICE_TOKEN` / `STORAGE_*`. `EMAIL_PROVIDER=resend|fake` (fake for tests/dev capture; never
`fake` in production — guarded by `NODE_ENV`).

## 9. Testing

Repository tools (vitest + the DB harness). Fake email provider; no real sends. Matrix per the
task in §11 of the brief: register/verify, login, wrong password, bad/expired/used/malformed OTP,
resend invalidation, attempt+rate limits, concurrent verify, duplicate register, reset flow,
session create/rotate/revoke, suspended, unauthorized portal/API, self-promotion, role-code
expiry/revoke/email-restriction/max-uses/concurrent redemption, admin boundaries, last-super-admin
protection, email-provider failure, and "no plaintext OTP/password/role-code stored or logged".

## 10. Self-review (gaps checked)

- **Enumeration**: register/forgot/login all return generic shapes; password verified before OTP
  issuance so the endpoint can't spam arbitrary emails. ✓
- **OTP double-spend**: consume + attempt-decrement inside one `FOR UPDATE` tx. ✓
- **Delivery vs. issue**: OTP row created first; `delivered_at` set only on provider success; a
  send failure does **not** mark delivered and surfaces a clean error. ✓
- **Role-code over-redemption**: atomic guarded update in a tx; unique `(code,profile)`. ✓
- **Privilege escalation**: role codes can't grant `super_admin`; role FK + CHECK; admin console
  guards; roles never settable via profile APIs. ✓
- **Last super-admin**: guarded in the suspend/remove/role paths. ✓
- **Secret exposure**: only digests/hashes stored; timing-safe compares; nothing sensitive logged
  or returned; dev-login stays dev-only. ✓
- **Data preservation**: migration is additive; existing profiles keep working (phone made
  nullable so email-first accounts are valid). ✓
- **Open risk**: introspect-per-request adds a DB round-trip; acceptable, cacheable later. Argon2
  parameters tuned for the runtime; documented in auth-setup.
