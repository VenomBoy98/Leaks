# Page ↔ API Integration Matrix

## Canonical frontend decision (evidence)
Two frontends exist in the repo:
- **`sjkvy-web`** (Vite + react-router): **8 pages**, public-marketing only
  (`home/about/programs/campus/admission/faq/contact/login`). Built earlier from the 8 Stitch
  marketing exports (`_stitch_raw`). **No portals, no 42 screens.**
- **`sjkvy-app`** (Next.js 14 App Router): **42 screens** = full system (public + Applicant /
  Student / Staff / Centre-Admin), built from the supplied 42-screen handoff bundle
  (`_frontend_integration/design_handoff_sjkvy_ecosystem/app/*.html`).

**Decision: `sjkvy-app` is the canonical production frontend.** The hypothesis that 42
React/Vite pages live under `web/src/pages` is false — `sjkvy-web/src/pages` has only 8
public pages. `sjkvy-web` is a **superseded public-only prototype**; it is not maintained or
wired further. Only `sjkvy-app` is integrated. (No `vercel.json`/`netlify.toml`; only the
backend has deploy config — `sjkvy-api/{Dockerfile,docker-compose.yml}`.)

## Migration inventory (verified)
`sjkvy-db/migrations/`: `0000_schema`, `0001_foundation`, `0002_functions_core`,
`0003_functions_remaining`, `0004_catalogue_crud`, `0005_worker` — **six, 0000–0005.**
`0006_security_repair.sql` and `0007_email_auth.sql` **do not exist** in the working tree or
in any supplied bundle (verified across `sjkvy-all-except-stitch.zip`, `sjkvy-backend-v1.0`,
`phase5/6`, `db-phase2-GO`). Not fabricated, not skipped — they were never supplied. Because
`0007_email_auth` is absent, the DB has **no email-OTP/credential store**; production auth
must come from an external provider via `src/lib/auth-adapter.ts`.

---

Every frontend route in `sjkvy-app` (Next.js App Router; all screens served by the dynamic
`[[...screen]]` route from `src/screens/generated/*`). Backend = existing `sjkvy-api`
(Fastify) over `sjkvy-db` (PostgreSQL, RLS + SECURITY DEFINER). All calls go through the
server-side proxy `/api/proxy/*`, which attaches the authenticated session token — the
browser never sees the JWT and never sends a profileId/role/centre.

**Status legend:** `static` = renders handoff copy, no API · `partial` = some live data/mutations ·
`connected` = all important data + buttons live.

## Public (role: anonymous)

| Route | Data displayed | Backend endpoint | DB function/table | Mutations | States | Status |
|---|---|---|---|---|---|---|
| `/` (index) | Admissions landing, intake CTA | — (editorial) + `GET /public/courses` for highlights | `app.v_public_catalog` | — | n/a | partial |
| `/home` | Institutional landing, stats | editorial | — | — | n/a | static (editorial) |
| `/about` | Vision/resources | editorial | — | — | n/a | static (editorial) |
| `/schemes` | Program/course catalogue | `GET /public/courses` | `v_public_catalog` (courses) | — | loading/empty/error | **connected** |
| `/campus` | Real active centres (public-safe fields) | `GET /public/centres` | `v_public_centres` (0009) | — | loading/empty/error | **connected** — real component |
| `/contact` | Real enquiry form | `POST /public/contact` | `fn_contact_submit` → `contact_enquiries` (0008) | submit enquiry | validation/loading/sent/error | **connected** (real component + backend) |
| `/support` | FAQ + certificate verification | `GET /verify/:code` | `fn_cert_verify` → `certificates` | verify (read) | loading/valid/invalid/error | **connected** |
| `/login` | Portal sign-in | `POST /api/dev-login` (dev issuer) → session | `app.profiles` (via auth.uid) | create session | error | **connected** (dev auth) |
| `/register` | New applicant account | needs OTP/provider (Phase 1 adapter) | `app.profiles` | create user (TODO) | validation | static (blocked on provider) |
| `/sitemap` | Dev index | — | — | — | n/a | static (dev-only, remove in prod) |

## Applicant (role: applicant — server-derived from `auth.uid()`)

| Route | Data displayed | Backend endpoint | DB function/table | Mutations | States | Status |
|---|---|---|---|---|---|---|
| `/dashboard` | Real app id, status, course, completion %, missing docs, next action, notices | `GET /applications`, `/auth/me`, `/applications/:id/documents`, `/public/courses`, `/notifications` | `applications`, `profiles`, `applicant_documents` | — | loading/empty/error | **connected** — real React component |
| `/application` | Real multi-step form: courses, draft load/create, debounced autosave, idempotent submit, doc-gated | `GET /public/courses`, `POST /applications`, `PATCH /applications/:id/draft`, `POST /applications/:id/submit` (Idempotency-Key) | `fn_create_self_application`, `fn_save_draft`, `fn_submit_application` | create/draft/submit | validation/saving/saved/error/idempotent/unsaved-guard | **connected** — real component + browser test |
| `/documents` | Real required-doc list, upload/re-upload, PENDING/CLEAN/FLAGGED, signed view | BFF: `POST /api/documents/upload`→finalize (PENDING only); scanner worker (separate credential) sets CLEAN/FLAGGED; `POST /api/documents/:v/view-url`→signed URL (CLEAN only) | `applicant_documents`, `document_versions` | upload/re-upload/view | upload/scan/flagged/error/retry | **connected** — real component; secure scan model |
| `/timeline` | Milestones from real application state | `GET /applications` | `applications` | — | loading/empty/error | **connected** — real component |
| `/notifications` | Real list, unread count, mark-read | `GET /notifications`, `POST /notifications/:id/read` | `notifications` | mark-read | loading/empty/error | **connected** — real component |
| `/profile` (applicant) | Load + update allowed fields only | `GET/PATCH /auth/me` | `profiles` (column grant) | update name/lang | validation/saving | **connected** — real component; no mass assignment |

## Student (role: student — enrolment-derived)

| Route | Data displayed | Backend endpoint | DB function/table | Mutations | States | Status |
|---|---|---|---|---|---|---|
| `/student-dashboard` | Batch, attendance %, assessments | `GET /auth/me`, `GET /enrolments` | `enrolments`, `batches` | — | loading/empty | partial (greeting live) |
| `/attendance` | Monthly attendance | `GET /sessions/:id/attendance` | `attendance`, `sessions` | — | loading/empty | static → wiring |
| `/hostel` | Room, mess, requests | `POST /enrolments/:id/hostel-request`, `GET .../hostel-requests` | `hostel_*` | request | loading | static → wiring |
| `/assessments` | Marks, feedback | `GET /assessments/:id/results` | `assessment_results` | — | loading/empty | static → wiring |
| `/certificates` | Issued certs (verifiable) | `GET /enrolments/:id/certificate` | `certificates` | download URL | loading/empty | static → wiring |
| `/placement` | Opportunities, applications | `GET /placement/opportunities`, `/placement/referrals` | `placement_*` | apply | loading/empty | static → wiring |
| `/student-profile` | Profile | `GET/PATCH /auth/me` | `profiles` | update | validation | static → wiring |

## Staff (role: staff — centre-scoped by membership)

| Route | Data displayed | Backend endpoint | DB function/table | Mutations | States | Status |
|---|---|---|---|---|---|---|
| `/staff-dashboard` | Queues, pending counts | `GET /verification/cases`, `GET /applications` | `verification_cases` | — | loading/empty | static → wiring |
| `/verification` | Verification queue + doc decisions | `GET /verification/cases`, `POST /verification/cases/:id/assign`, `/decisions`, `/corrections`, `GET /documents/:v/view-url` | `fn_assign_checker`, `fn_decide_document`, `fn_request_correction` | assign/decide/correct | loading/empty/conflict(409) | static → wiring (Phase 3 core) |
| `/counselling` | Sessions, notes | `POST /applications/:id/counselling`, `/counselling/:id/outcome` | `counselling_*` | schedule/outcome | loading | static → wiring |
| `/staff-attendance` | Mark attendance | `POST /sessions`, `POST /sessions/:id/attendance`, `/lock` | `fn_mark_attendance` | create session/mark/lock | loading/error | static → wiring |
| `/staff-hostel` | Rooms, occupancy | `GET .../hostel-requests`, allocate | `hostel_*` | allocate/discharge | loading | static → wiring |
| `/staff-placement` | Listings, matches | `GET /placement/opportunities`, referrals | `placement_*` | create/refer | loading | static → wiring |
| `/staff-reports` | Aggregate metrics | composed: `GET /batches`, `/enrolments`, `/sessions/:id/attendance` | multiple | export | loading | static → wiring |
| `/staff-directory` | Staff list | `GET /admin/staff` (scoped) | `staff_memberships` | — | loading/empty | static → wiring |

## Centre Admin (role: admin — centre or super scoped)

| Route | Data displayed | Backend endpoint | DB function/table | Mutations | States | Status |
|---|---|---|---|---|---|---|
| `/admin-dashboard` | Centre KPIs | composed reads | multiple | — | loading | static → wiring |
| `/admin-applications` | All applications, filter/assign | `GET /applications`, `POST /applications/:id/reassign-assistance` | `applications` | assign | loading/empty/pagination | partial (admin read live) |
| `/admin-admissions` | Verified apps → decide | `POST /applications/:id/admission` (idempotent) | `fn_admission_finalize`, `fn_waitlist_promote` | approve/reject/waitlist | loading/conflict/idempotent | static → wiring (Phase 4 core) |
| `/admin-directory` | Student directory | `GET /enrolments` (centre) | `students`, `enrolments` | — | loading/empty/pagination | static → wiring |
| `/admin-hostel` | Hostel inventory | `GET`/allocate hostel | `hostel_*` | allocate | loading | static → wiring |
| `/admin-programs` | Programs/batches CRUD | `GET/POST /admin/courses`, `/admin/batches`, `/batches/:id/status` | `fn_course_*`, `fn_batch_*` | CRUD | validation | static → wiring |
| `/admin-assessments` | Define/publish results | `POST /batches/:id/assessments`, `/assessments/:id/finalize` | `fn_assessment_*` | create/publish | loading | static → wiring |
| `/admin-certificates` | Issue/revoke certs | `POST /enrolments/:id/certificate`, `/certificates/:id/revoke` | `fn_cert_issue`, `fn_cert_revoke` | issue/revoke | loading | static → wiring |
| `/admin-industry` | Employers, pipeline | `GET/POST /placement/opportunities` | `placement_*`, employers | CRUD | loading | static → wiring |
| `/admin-reports` | Cross-cutting reports | `GET /admin/exports`, composed | `fn_export_*` | export | loading | static → wiring |
| `/admin-settings` | Centre config, users/roles | `POST /admin/memberships/grant|revoke`, `/admin/config/:key` | `fn_membership_*`, `app_config` | grant/revoke/config | validation | static → wiring |

## Summary
- **Connected (all important data + buttons live):** `/support` (real `fn_cert_verify`),
  `/login` (real session), portal identity greetings (real `auth.me`). The real course
  catalogue (`GET /public/courses`) is consumed by the typed client and surfaces in the
  application form's course selection (Phase 2); the `/schemes` program cards are curated
  **editorial** content (allowed static).
- **Partial:** `/`, `/campus`, `/dashboard`, `/application`, `/profile`, `/student-dashboard`, `/admin-applications`.
- **Static (editorial, allowed):** `/home`, `/about`.
- **Static (blocked on backend/provider):** `/contact` (no enquiry endpoint), `/register` (needs OTP provider).
- **Static → wiring (Phases 3–5):** the remaining ~30 portal screens; endpoints all exist and are reachable through the proxy.

Every route is inspected. Intentionally-static public content: `/home`, `/about` (editorial), `/sitemap` (dev-only). Blocked items require a new backend enquiry endpoint and a real auth provider respectively (documented, not faked).

## Phase-2 closure notes
- **Withdrawal:** applicant UI (confirmation + required reason + idempotency) on `/application`;
  cascades verification case → FAILED so staff no longer see it as actionable. UI + integration
  + authorization tested.
- **Document scanning (production):** upload records **PENDING** only; the trusted **scanner
  worker** (`sjkvy-api` `npm run scan-worker`, service_role) claims PENDING versions via
  `fn_scan_claim` (retry/timeout), scans via a configurable adapter (ClamAV / fake-in-tests),
  records CLEAN/FLAGGED, quarantines FLAGGED. Readiness reports **degraded** if unconfigured →
  files stay PENDING. No browser-reachable scan path; `/api/internal/scan` is 404 in prod.
- **Migrations:** runners (`run_all.sh`, `setup-test-db.sh`, `deploy/db-init.sh`) now apply
  every `migrations/[0-9]*.sql` in sorted order — 0000–0005 + 0008–0010, gap at absent
  0006/0007 handled. Verified on a fresh database.
