# Full-Stack Integration Plan

Connect the existing `sjkvy-api` + `sjkvy-db` backend to every `sjkvy-app` page so the
five portals work on real data, with changes propagating cross-portal. Reuse existing
domains/functions — no second backend, no duplicate tables, no new status strings.

## Architecture discovered
- **Frontend:** Next.js 14 App Router. 42 handoff screens rendered verbatim (high fidelity)
  via `src/screens/generated/*` + `HandoffScreen`. Auth/session, proxy, and portal-scoped
  routing already in place.
- **Backend:** Fastify, declarative operation manifest (`src/domains/*`), 103 operations /
  14 domains. Every request does `SET LOCAL ROLE` + `request.jwt.claims` GUC → `auth.uid()`
  drives RLS + SECURITY DEFINER functions. `service_role` has 0 table grants.
- **DB:** migrations 0000–0005 (GO 81/81). RLS policies + definer functions are the
  authoritative business layer; the API is a thin orchestration tier.
- **Trust boundary:** the API turns a verified JWT into an identity; the DB enforces what
  that identity may do. **The browser never supplies profileId/role/centre** — all derived
  server-side from the session token via the proxy.

## Cross-cutting rules (applied every phase)
- Preserve Stitch design; convert static templates to real components without redesign.
- All data through `/api/proxy` (token attached server-side). No DB access from browser.
- Strict TS request/response types checked against backend schemas (contract tests).
- Backend authorization is the source of truth (RLS/definer), not hidden nav.
- Mutations use existing idempotency + transactions; preserve enum/state machines exactly.
- Notifications via the existing outbox; sensitive actions via the existing audit.
- Never log secrets/tokens/OTPs/raw documents; documents via short-lived view URLs only.

---

## Phase 1 — Shared auth & API infrastructure  ✅ (this session)
- `src/lib/apiClient.ts`: base URL from env, cookie credentials, JSON parse, **normalized
  error objects** (401/403/404/409/422/429/5xx + session-expired), **request cancellation +
  timeouts**, **idempotency keys**, pagination/filter/search params, safe retry.
- CSRF hook for state-changing cookie requests (adapter; dev proxy is same-origin).
- Session/OTP **adapter interface** (`src/lib/auth-adapter.ts`) — real provider slots in;
  no insecure production login created. Dev issuer stays behind `DEV_AUTH`.
- **Contract tests** asserting client method/path/body/response match the backend manifest.
- Gate: typecheck + build + tests green.

## Phase 2 — Public & applicant pages
- Public: schemes/campus/support/verification on real catalogue/centre/cert endpoints
  (editorial home/about stay static). Contact + register: document backend gaps.
- Applicant: application create/draft/submit (atomic, no duplicate draft), documents
  (upload → version → scan status via secure storage), dashboard status, timeline,
  notifications, profile, withdrawal. Ownership enforced by RLS.
- **Submitting activates the verification workflow** → visible in the correct staff queue.
- Tests: draft/duplicate/upload/invalid-doc/submit/ownership/withdraw/status.

## Phase 3 — Staff verification & operations
- Verification queue: centre-scoped list, search/filter/paginate, assign/claim, secure
  document view (view-url), per-document decide, approve/reject/hold/correction with
  mandatory remarks, complete-on-requirements, 409 conflict handling, verification history,
  applicant notifications.
- Attendance/counselling/certificate/hostel/placement/reports on their APIs.
- Tests: authorization, centre-scoping, concurrency, cross-portal propagation.

## Phase 4 — Administrative management & approvals
- Admission decision via `fn_admission_finalize` (transactional, idempotent): load verified
  apps, seat-capacity safe, no duplicate offers/enrolments, offer expiry + waitlist
  promotion, notify, immutable audit.
- Programs/batches/centres/staff/hostel/assessments/employers/reports/settings CRUD via
  existing APIs. Super-admin vs centre-admin enforced server-side.

## Phase 5 — Student portal
- Student access only after authorized enrolment/role assignment.
- Enrolment/batch/course/centre, attendance, assessments, hostel, placement, certificates,
  notifications — all real. No cross-student access.

## Phase 6 — Cross-portal E2E + full checks
- Automated workflows (applicant→staff→admin→student), seat concurrency, idempotency,
  authorization boundaries, invalid-transition safety, audit+notification creation, every
  route renders without mock data.
- Run: format, lint, typecheck, backend unit/integration, DB static+semantic, PG
  integration/concurrency, frontend component, E2E, prod builds, OpenAPI parity, secret scan.

---

## Status this session
- Phase 1 infrastructure: **built** (apiClient, auth adapter, contract tests).
- Core vertical slice (applicant→staff→admin→student) wired with **real data + real
  mutations** as the working proof; remaining screens catalogued in
  `page-api-integration-matrix.md` as `static → wiring` with their exact endpoints.
- Phases 2–5 full breadth across all 42 pages: **staged continuation** (each screen is
  mechanical per the matrix). Phase 6 full suite runs against the wired slice now and expands
  as screens land.
