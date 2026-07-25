# Continuation Checkpoint — Email-OTP Auth System

Repo: `/home/user/Leaks` · Branch: `claude/sjkvy-repository-audit-fpd58e` (working tree clean,
all commits pushed). The older `/home/user/sjkvy` is a redundant copy — do not edit it.

## Last successful commit
`a4c1739 Auth (4/6): frontend auth pages (register / login / OTP / forgot-reset)`
(chain: `ef336c4` design+migration → `3c8ab12` API layer → `5aefb8c` BFF+sessions →
`a4c1739` frontend auth pages)

## Uncommitted files
None. `git status --short` is empty; `git log @{upstream}..HEAD` is empty (nothing unpushed).

## Completed (done + tested)
- **Design**: `sjkvy-app/docs/auth-system-design.md` (self-reviewed).
- **DB**: `sjkvy-db/migrations/0012_email_auth.sql` — service-only `auth_credentials`,
  `auth_challenges`, `auth_sessions`, `auth_role_codes`, `auth_role_code_redemptions`,
  `auth_security_events` (RLS+FORCE, digests only), phone nullable, membership-fn repair.
  Applied to the dev DB + verified fresh/idempotent/upgrade/tamper via the ledger.
- **API** (`sjkvy-api`): `auth-core/crypto.ts` (Argon2id, CSPRNG OTP, HMAC digest, timing-safe),
  `auth-core/email.ts` (Resend + Fake providers, branded templates), `auth-repo.ts` (register,
  login password-first, OTP verify→session, resend, forgot/reset, introspect/logout, role
  resolution; rate limits, lockout, atomic single-use OTP), `auth-routes.ts` (service-authed
  `/auth/*` + dev-only `/auth/dev/last-otp`), `config.ts` AuthConfig, `db.withServiceTx`,
  `scripts/auth-admin.ts` CLI (bootstrap-superadmin / grant-role / revoke-role). 12 integration
  tests green; CLI bootstrap verified.
- **BFF** (`sjkvy-app`): `lib/authServer.ts`, `/api/auth/*` route handlers, opaque httpOnly
  session + CSRF double-submit, proxy resolves session→mints per-request JWT, `getCaller` +
  `apiClient` updated. 2 e2e tests green; full app suite (58) still green.

## Remaining (Tasks 11–12) — next work, in priority order
1. **Frontend auth pages** — DONE (`a4c1739`): `/register`, `/login` (both with the shared
   accessible `OtpInput` + resend countdown), `/forgot-password` (request→reset), `AuthCard`
   design shell, `lib/authClient`. Verified by `scripts/auth-ui-flow.mjs` + production build.
   Still nice-to-add: explicit account-suspended / session-expired banners + role-aware public nav.
2. **Role codes** (API + BFF + UI): add to `auth-repo.ts` — `createRoleCode` (160-bit, digest-only,
   plaintext shown once), `redeemRoleCode` (authenticated+verified+active user; atomic
   `UPDATE ... WHERE use_count < max_uses` guarded + insert redemption + staff_memberships insert,
   all in one tx; never super_admin; email restriction; audited), `listRoleCodes`, `revokeRoleCode`.
   New API routes (user-authed redeem via a NEW manifest op or BFF; admin create/list/revoke).
   Frontend: redeem form + admin role-code manager.
3. **Admin security console** (`sjkvy-app`): user search/filter (role/verification/status), role
   history, grant/remove roles (existing `fn_membership_grant/revoke`), suspend/reactivate
   (`app.profiles.is_active` — add a service op), revoke-all-sessions (`repo.revokeAllSessions` +
   route), role-code CRUD, audit log (`auth_security_events`). Guards: no self-promote, protect
   last super_admin, admin can't edit higher admin, no mass-assignment.
4. **Tests (Task 12)**: rate-limit + lockout (dedicated low-limit app), concurrent OTP verify,
   concurrent role-code redemption, expired/max-uses/email-restricted role codes, suspended-account
   login, unauthorized portal/API, self-promotion attempt, last-super-admin protection, email
   provider failure (throw from a fake), "no plaintext OTP/password/role-code in DB or logs".
5. **Docs (Task 12)**: `docs/auth-setup.md` (architecture, local dev, migrations, Resend + domain
   setup, env vars, first-super-admin bootstrap, role management + role codes, test commands,
   deploy checklist, free-tier warning, undelivered-email troubleshooting, swapping Resend).
   Update README.

## Local runtime (how to resume)
- Postgres: cluster at `/tmp/sjkvy-pg/data`, socket `/tmp/sjkvy-pg/sock`, port 5433, db `sjkvy`
  (dev) / `sjkvy_api` (tests). Start: `sudo -u postgres /usr/lib/postgresql/16/bin/pg_ctl -D
  /tmp/sjkvy-pg/data -o "-p 5433 -k /tmp/sjkvy-pg/sock -c listen_addresses=127.0.0.1" -l
  /tmp/sjkvy-pg/server.log start`.
- API (from `/home/user/Leaks/sjkvy-api`): `DATABASE_URL=postgres://sjkvy_api_login@127.0.0.1:5433/sjkvy
  JWT_SECRET=dev-local-jwt-secret-please-change-32chars SERVICE_TOKEN=dev-local-service-token-abcdefgh
  STORAGE_URL_SIGNING_SECRET=dev-local-storage-signing-secret-32chars
  OTP_HMAC_SECRET=dev-local-otp-hmac-secret-32chars-xyz EMAIL_PROVIDER=fake PORT=8080 npx tsx src/index.ts`
- Next dev (from `sjkvy-app`): `set -a; . ./.env.local; set +a; npx next dev -p 3000`.
- API auth tests: rebuild `sjkvy_api` (harness + all migrations + seed + adapter) then
  `TEST_DATABASE_URL=postgres://sjkvy_api_login:apitest@127.0.0.1:5433/sjkvy_api
  ADMIN_DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5433/sjkvy_api npx vitest run test/auth.integration.test.ts`.
- BFF tests need both servers up (fake provider): `npx vitest run test/auth-bff.integration.test.ts`.

## Next safe command
Build the frontend auth pages (Task 11.1) — no schema change needed; wire to the existing
`/api/auth/*` routes. Start with `sjkvy-app/src/app/register/page.tsx` + a shared `OtpInput`
component, following `components/ui/States.tsx` for the design system.
