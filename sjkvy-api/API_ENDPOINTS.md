# SJKVY API — Endpoint Reference

Generated from the operation manifest (`src/domains/*`). Every mutation maps to a verified PostgreSQL catalogue function; reads are RLS-scoped SELECTs; a small set of direct writes use column-limited RLS policies. `*` marks required request fields. Idempotent operations require an `Idempotency-Key: <uuid>` header.

**Total operations:** 103

## authentication

### `GET /auth/me` — Return the authenticated caller’s profile (RLS: own row only).

- **Operation id:** `auth.me`
- **Auth:** User JWT (authenticated)
- **Database binding:** RLS-scoped SELECT
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`
- **Notes:** Row scoped by policy p_profiles_sel (id = auth.uid()).

### `PATCH /auth/me` — Update own profile display fields (DW: full_name, preferred_lang only).

- **Operation id:** `profile.update`
- **Auth:** User JWT (authenticated)
- **Database binding:** Direct write (column-limited RLS policy)
- **Request body:** `full_name`, `preferred_lang`
- **Response:** object
- **Error conditions:** `E.AUTHZ.FORBIDDEN`
- **Notes:** Direct write via column GRANT (full_name, preferred_lang) + policy p_profiles_upd_own.

### `POST /auth/phone-change/confirm` — Confirm a verified phone change ([SYS]; provider verifies dual OTP first).

- **Operation id:** `profile.confirm_phone_change`
- **Auth:** Service token (service_role)
- **Database binding:** `app.fn_apply_phone_change(...)`
- **Request body:** `caller`*, `new_phone`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.CONFLICT.DUPLICATE`
- **Notes:** service_role only. The auth provider performs OTP on both old and new numbers; this endpoint just applies the already-verified change atomically.

## applicants

### `POST /applications` — Applicant self-creates an application (and applicant record on first use).

- **Operation id:** `application.create_self`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_create_self_application(...)`
- **Request body:** `course_id`*, `dob`*, `gender`*, `district`*, `block`, `address`, `qualification`
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.CONFLICT.ALREADY_ACTIVE`, `E.VAL.FAILED`
- **Notes:** Enforces one active application per applicant (ux_applications_active).

### `POST /applications/assisted` — Operator creates an assisted application for a walk-in applicant.

- **Operation id:** `application.create_assisted`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_create_assisted_application(...)`
- **Request body:** `centre_id`*, `course_id`*, `full_name`*, `phone`*, `dob`*, `gender`*, `district`*, `block`, `address`, `guardian_name`, `guardian_phone`
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.CONFLICT.DUPLICATE`
- **Notes:** Requires operator membership at centre (SEC-ASG-003, checked in fn).

### `PATCH /applications/:id/draft` — Save draft fields on a DRAFT application (owner or assisting operator).

- **Operation id:** `application.save_draft`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_save_draft(...)`
- **Request body:** `fields`*
- **Path params:** `id`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`
- **Notes:** p_fields is a jsonb whitelist applied inside the function; no column access in API.

### `POST /applications/:id/submit` — Submit an application (eligibility + required-document gate, idempotent).

- **Operation id:** `application.submit`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_submit_application(...)` *(idempotent)*
- **Path params:** `id`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`, `E.STATE.ELIGIBILITY_FAILED`, `E.VAL.FAILED`, `E.CONFLICT.DUPLICATE`
- **Notes:** Requires Idempotency-Key. Opens the verification case on success.

### `POST /applications/:id/withdraw` — Applicant withdraws a pre-decision application (cascades, idempotent).

- **Operation id:** `application.withdraw`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_withdraw_application(...)` *(idempotent)*
- **Request body:** `reason`*
- **Path params:** `id`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`

### `POST /applicants/claim` — Claim an unclaimed assisted applicant record by matching phone (idempotent).

- **Operation id:** `applicant.claim_assisted`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_claim_assisted(...)` *(idempotent)*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.CONFLICT.DUPLICATE`
- **Notes:** Concurrency-safe: profile_id set once under row lock (SEC-CONC-004).

### `POST /applications/:id/reassign-assistance` — Centre admin hands a DRAFT application to another operator.

- **Operation id:** `admission.reassign_assistance`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_reassign_assistance(...)`
- **Request body:** `new_operator`*, `reason`*
- **Path params:** `id`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`

### `GET /applications` — List applications visible to the caller (RLS: owner / operator / staff / checker).

- **Operation id:** `applications.list`
- **Auth:** User JWT (authenticated)
- **Database binding:** RLS-scoped SELECT
- **Response:** `{ items: [...] }` (or single)
- **Notes:** Rows scoped by policy p_applications_sel via DEFINER helpers.

### `GET /applications/:id` — Get a single application by id (RLS-scoped).

- **Operation id:** `application.get`
- **Auth:** User JWT (authenticated)
- **Database binding:** RLS-scoped SELECT
- **Path params:** `id`*
- **Response:** `{ items: [...] }` (or single)
- **Error conditions:** `E.RES.NOT_FOUND`

### `GET /public/courses` — PUBLIC list of active courses (anon; via v_public_catalog).

- **Operation id:** `catalog.courses`
- **Auth:** Public (anon)
- **Database binding:** RLS-scoped SELECT
- **Response:** object
- **Notes:** anon GRANT SELECT on definer-owned view; no other table is anon-readable.

## documents

### `POST /documents/finalize` — Record a finished upload version for an application ([SYS]).

- **Operation id:** `doc.finalize_upload`
- **Auth:** Service token (service_role)
- **Database binding:** `app.fn_finalize_upload(...)`
- **Request body:** `caller`*, `application_id`*, `document_type`*, `storage_path`*, `mime`*, `size`*, `sha256`
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`
- **Notes:** service_role. Function re-checks that `caller` owns or assists the application; storage_path is stored but never exposed to clients (SEC-DOC-001).

### `POST /documents/:versionId/scan-result` — Anti-virus/scan callback marks a version CLEAN or FLAGGED ([SYS]).

- **Operation id:** `doc.scan_callback`
- **Auth:** Service token (service_role)
- **Database binding:** `app.fn_scan_result(...)`
- **Request body:** `status`*
- **Path params:** `versionId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`, `E.VAL.FAILED`

### `POST /documents/:versionId/view-url` — Authorize a document view and return the storage path for signed-URL minting ([SYS]).

- **Operation id:** `doc.get_view_url`
- **Auth:** Service token (service_role)
- **Database binding:** `app.fn_authorize_doc_view(...)`
- **Request body:** `caller`*, `purpose`*
- **Path params:** `versionId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`
- **Notes:** Returns the raw path only to service_role, which mints a short-lived signed URL. Owner/assigned-checker/admission staff only; trainer/hostel/placement denied (SEC-DOC-004). Every issuance is audited (SEC-DOC-003).

### `GET /applications/:id/documents` — List document metadata for an application (path-less view, RLS-scoped).

- **Operation id:** `documents.list_mine`
- **Auth:** User JWT (authenticated)
- **Database binding:** RLS-scoped SELECT
- **Path params:** `id`*
- **Response:** `{ items: [...] }` (or single)
- **Notes:** Reads the definer view v_my_documents (no storage_path column); the view embeds the same owner/checker/admission scope as policy p_docs_sel.

## verification

### `POST /verification/cases/:caseId/assign` — Centre admin assigns a checker to a pending verification case.

- **Operation id:** `verify.assign`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_assign_checker(...)`
- **Request body:** `checker`*
- **Path params:** `caseId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`

### `POST /verification/cases/:caseId/reassign` — Centre admin reassigns the active checker (deactivates prior assignment).

- **Operation id:** `verify.reassign`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_reassign_checker(...)`
- **Request body:** `checker`*, `reason`*
- **Path params:** `caseId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`

### `POST /verification/cases/:caseId/decisions` — Assigned checker accepts/rejects a document version (auto-verifies when complete).

- **Operation id:** `verify.decide_document`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_decide_document(...)`
- **Request body:** `document_version_id`*, `decision`*, `reason`
- **Path params:** `caseId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`, `E.AUTHZ.FORBIDDEN`, `E.VAL.FAILED`
- **Notes:** In-tx active-assignee recheck (SEC-ASG-001); REJECT requires reason.

### `POST /verification/cases/:caseId/corrections` — Assigned checker requests document corrections (moves case to CORRECTION_REQUESTED).

- **Operation id:** `verify.request_correction`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_request_correction(...)`
- **Request body:** `items`*
- **Path params:** `caseId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`, `E.AUTHZ.FORBIDDEN`, `E.VAL.FAILED`

### `POST /applications/:id/resubmit` — Applicant resubmits after corrections (partial-aware, idempotent).

- **Operation id:** `application.resubmit_corrections`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_resubmit_corrections(...)` *(idempotent)*
- **Path params:** `id`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`

### `POST /verification/cases/:caseId/fail` — Assigned checker fails a verification case.

- **Operation id:** `verify.fail`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_fail_verification(...)`
- **Request body:** `reason`*
- **Path params:** `caseId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`, `E.AUTHZ.FORBIDDEN`

### `GET /verification/cases` — List verification cases visible to the caller (owner / checker / admin).

- **Operation id:** `verification.cases.list`
- **Auth:** User JWT (authenticated)
- **Database binding:** RLS-scoped SELECT
- **Response:** `{ items: [...] }` (or single)
- **Notes:** Scoped by policy p_vcases_sel.

## counselling

### `POST /applications/:id/counselling` — Counsellor schedules a counselling appointment (requires VERIFIED case).

- **Operation id:** `counsel.schedule`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_counsel_schedule(...)`
- **Request body:** `scheduled_at`*
- **Path params:** `id`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`

### `POST /counselling/:appointmentId/reschedule` — Reschedule a counselling appointment (config-limited attempt count).

- **Operation id:** `counsel.reschedule`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_counsel_reschedule(...)`
- **Request body:** `scheduled_at`*, `reason`*
- **Path params:** `appointmentId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`, `E.CONFLICT.CAPACITY_FULL`

### `POST /counselling/:appointmentId/no-show` — Mark a counselling appointment as no-show.

- **Operation id:** `counsel.mark_no_show`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_counsel_no_show(...)`
- **Path params:** `appointmentId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`

### `POST /counselling/:appointmentId/outcome` — Record a counselling recommendation (basis for the two-step admission).

- **Operation id:** `counsel.record_outcome`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_counsel_outcome(...)`
- **Request body:** `recommendation`*, `notes`
- **Path params:** `appointmentId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`, `E.VAL.FAILED`
- **Notes:** The recorder cannot later finalize the admission (recommender≠finalizer, C11).

### `GET /applications/:id/counselling` — List counselling appointments for an application (RLS-scoped).

- **Operation id:** `counselling.list`
- **Auth:** User JWT (authenticated)
- **Database binding:** RLS-scoped SELECT
- **Path params:** `id`*
- **Response:** `{ items: [...] }` (or single)
- **Notes:** Scoped by policy p_counsel_sel.

## admissions

### `POST /applications/:id/admission` — Centre admin finalizes admission (APPROVED/REJECTED/WAITLISTED, seat-safe, idempotent).

- **Operation id:** `admission.finalize`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_admission_finalize(...)` *(idempotent)*
- **Request body:** `decision`*, `batch_id`, `reason`
- **Path params:** `id`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`, `E.AUTHZ.FORBIDDEN`, `E.VAL.FAILED`
- **Notes:** Locks batch before application; auto-waitlists on BATCH_FULL. Enforces recommender≠finalizer. Seat-count race verified (SEC-CONC-001).

### `POST /batches/:batchId/waitlist/promote` — Promote the top waitlisted application when a seat is free (idempotent).

- **Operation id:** `waitlist.promote`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_waitlist_promote(...)` *(idempotent)*
- **Path params:** `batchId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`
- **Notes:** Grantable to both authenticated (centre admin manual) and service_role (scheduler). FOR UPDATE SKIP LOCKED prevents double promotion (SEC-CONC-002).

### `GET /applications/:id/decisions` — List admission decisions for an application (RLS-scoped).

- **Operation id:** `admission.decisions.list`
- **Auth:** User JWT (authenticated)
- **Database binding:** RLS-scoped SELECT
- **Path params:** `id`*
- **Response:** `{ items: [...] }` (or single)
- **Notes:** Scoped by policy p_decision_sel.

### `GET /batches/:batchId/waitlist` — List active waitlist entries for a batch (owner or centre admin).

- **Operation id:** `waitlist.list`
- **Auth:** User JWT (authenticated)
- **Database binding:** RLS-scoped SELECT
- **Path params:** `batchId`*
- **Response:** `{ items: [...] }` (or single)
- **Notes:** Scoped by policy p_wl_sel.

## joining

### `POST /offers/:offerId/accept` — Applicant accepts an admission offer → enrolment (seat-safe, idempotent).

- **Operation id:** `offer.accept`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_offer_accept(...)` *(idempotent)*
- **Path params:** `offerId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`, `E.CONFLICT.DUPLICATE`
- **Notes:** Locks batch before offer (K order). Creates student + enrolment + hostel request if required.

### `POST /offers/:offerId/decline` — Applicant declines an admission offer (releases the seat).

- **Operation id:** `offer.decline`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_offer_decline(...)`
- **Path params:** `offerId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`

### `POST /enrolments/:enrolmentId/confirm-joining` — Staff confirms the student joined (ENROLLED → ACTIVE).

- **Operation id:** `enrolment.confirm_joining`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_confirm_joining(...)`
- **Path params:** `enrolmentId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`

### `POST /enrolments/:enrolmentId/not-joined` — Centre admin marks an enrolment not-joined (releases seat, idempotent).

- **Operation id:** `enrolment.mark_not_joined`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_mark_not_joined(...)` *(idempotent)*
- **Request body:** `reason`*
- **Path params:** `enrolmentId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`

### `POST /enrolments/:enrolmentId/transfer` — Transfer an enrolment to another batch (capacity-checked, idempotent).

- **Operation id:** `enrolment.transfer`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_transfer_enrolment(...)` *(idempotent)*
- **Request body:** `to_batch`*, `reason`*
- **Path params:** `enrolmentId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`, `E.CONFLICT.CAPACITY_FULL`

### `POST /enrolments/:enrolmentId/complete` — Centre admin completes an active enrolment.

- **Operation id:** `enrolment.complete`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_complete_enrolment(...)`
- **Path params:** `enrolmentId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`

### `POST /enrolments/:enrolmentId/drop` — Centre admin drops an enrolment (releases bed + hostel request + seat).

- **Operation id:** `enrolment.drop`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_drop_enrolment(...)`
- **Request body:** `reason`*
- **Path params:** `enrolmentId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`

### `POST /jobs/expire-offers` — Scheduled job: expire SENT offers past expiry ([SYS]).

- **Operation id:** `jobs.expire_offers`
- **Auth:** Service token (service_role)
- **Database binding:** `app.fn_jobs_expire_offers(...)`
- **Response:** object
- **Notes:** service_role scheduler. Emits seat-released events for promotion.

### `POST /jobs/expire-drafts` — Scheduled job: expire stale DRAFT applications ([SYS]).

- **Operation id:** `jobs.expire_drafts`
- **Auth:** Service token (service_role)
- **Database binding:** `app.fn_jobs_expire_drafts(...)`
- **Response:** object

### `GET /applications/:id/offers` — List admission offers for an application (owner or centre admin).

- **Operation id:** `offers.list`
- **Auth:** User JWT (authenticated)
- **Database binding:** RLS-scoped SELECT
- **Path params:** `id`*
- **Response:** `{ items: [...] }` (or single)
- **Notes:** Scoped by policy p_offers_sel.

### `GET /enrolments` — List enrolments visible to the caller (student self / batch staff / trainer).

- **Operation id:** `enrolments.list`
- **Auth:** User JWT (authenticated)
- **Database binding:** RLS-scoped SELECT
- **Response:** `{ items: [...] }` (or single)
- **Notes:** Scoped by policy p_enrol_sel.

## attendance

### `POST /sessions` — Trainer creates a class session (DW: p_sessions_ins_trainer).

- **Operation id:** `session.create`
- **Auth:** User JWT (authenticated)
- **Database binding:** Direct write (column-limited RLS policy)
- **Request body:** `batch_id`*, `session_date`*, `kind`*, `slot`, `topic`
- **Response:** object
- **Error conditions:** `E.AUTHZ.FORBIDDEN`
- **Notes:** trainer_profile_id is forced to auth.uid() in SQL; the policy WITH CHECK requires trainer membership at the batch centre and session_date >= today.

### `POST /sessions/:sessionId/attendance` — Trainer marks/updates attendance for an enrolment (DW upsert on the granted columns).

- **Operation id:** `attendance.mark`
- **Auth:** User JWT (authenticated)
- **Database binding:** Direct write (column-limited RLS policy)
- **Request body:** `enrolment_id`*, `present`*
- **Path params:** `sessionId`*
- **Response:** object
- **Error conditions:** `E.AUTHZ.FORBIDDEN`
- **Notes:** Blocked once the session is locked or the trainer is deactivated (verified in the attendance red-team, t03). No delete/FK-reassign grant.

### `POST /sessions/:sessionId/lock` — Trainer or centre admin locks a session’s attendance.

- **Operation id:** `attendance.lock`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_lock_attendance(...)`
- **Path params:** `sessionId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`

### `POST /attendance/:attendanceId/correct` — Centre admin corrects a locked attendance record (history row, idempotent).

- **Operation id:** `attendance.correct`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_correct_attendance(...)` *(idempotent)*
- **Request body:** `present`*, `reason`*
- **Path params:** `attendanceId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`
- **Notes:** Post-lock only; writes an attendance_corrections audit row.

### `GET /sessions/:sessionId/attendance` — List attendance for a session (student self / trainer / centre admin).

- **Operation id:** `attendance.list`
- **Auth:** User JWT (authenticated)
- **Database binding:** RLS-scoped SELECT
- **Path params:** `sessionId`*
- **Response:** `{ items: [...] }` (or single)
- **Notes:** Scoped by policy p_att_sel.

## hostel

### `POST /enrolments/:enrolmentId/hostel-request` — Student requests hostel accommodation for their enrolment.

- **Operation id:** `hostel.request`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_hostel_request(...)`
- **Path params:** `enrolmentId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.CONFLICT.ALREADY_ACTIVE`
- **Notes:** One live request per enrolment (ux_hostel_request_live); re-request allowed after cancel/discharge.

### `POST /hostel/requests/:requestId/cancel` — Student cancels a pre-allocation hostel request.

- **Operation id:** `hostel.cancel_request`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_hostel_cancel(...)`
- **Path params:** `requestId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`

### `POST /hostel/requests/:requestId/approve` — Hostel manager approves a request (APPROVED if beds free, else QUEUED).

- **Operation id:** `hostel.approve`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_hostel_approve(...)`
- **Path params:** `requestId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`

### `POST /hostel/requests/:requestId/allocate` — Hostel manager allocates a specific bed (concurrency-safe, idempotent).

- **Operation id:** `hostel.allocate`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_hostel_allocate(...)` *(idempotent)*
- **Request body:** `bed_id`*
- **Path params:** `requestId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`, `E.CONFLICT.ALREADY_ACTIVE`
- **Notes:** Bed locked first (rank 2). One active allocation per bed/enrolment (SEC-CONC-003).

### `POST /enrolments/:enrolmentId/hostel-transfer` — Transfer a resident to another bed (release+allocate in one tx, idempotent).

- **Operation id:** `hostel.transfer`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_hostel_transfer(...)` *(idempotent)*
- **Request body:** `to_bed`*, `reason`*
- **Path params:** `enrolmentId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.CONFLICT.ALREADY_ACTIVE`
- **Notes:** Beds locked in ascending id order (deadlock-safe, §V-13).

### `POST /hostel/allocations/:allocationId/discharge` — Discharge a resident; frees the bed and closes the request (idempotent).

- **Operation id:** `hostel.discharge`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_hostel_discharge(...)` *(idempotent)*
- **Request body:** `reason`*
- **Path params:** `allocationId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`

### `POST /hostel/beds/:bedId/status` — Toggle a bed AVAILABLE/MAINTENANCE (not while actively allocated).

- **Operation id:** `hostel.set_bed_status`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_set_bed_status(...)`
- **Request body:** `status`*
- **Path params:** `bedId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.CONFLICT.ALREADY_ACTIVE`, `E.VAL.FAILED`

### `POST /hostel/blocks` — Create a hostel block (hostel_manager/centre_admin at the centre).

- **Operation id:** `hostel.block_create`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_hostel_block_create(...)`
- **Request body:** `centre_id`*, `name`*, `warden_profile_id`
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.VAL.FAILED`

### `POST /hostel/blocks/:blockId/rooms` — Create a room in a block (hostel_manager/centre_admin).

- **Operation id:** `hostel.room_create`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_room_create(...)`
- **Request body:** `room_no`*
- **Path params:** `blockId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.CONFLICT.DUPLICATE`, `E.VAL.FAILED`

### `POST /hostel/rooms/:roomId/beds` — Create a bed in a room (hostel_manager/centre_admin; starts AVAILABLE).

- **Operation id:** `hostel.bed_create`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_bed_create(...)`
- **Request body:** `bed_no`*
- **Path params:** `roomId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.CONFLICT.DUPLICATE`, `E.VAL.FAILED`

### `GET /enrolments/:enrolmentId/hostel-requests` — List hostel requests for an enrolment (student self / hostel manager).

- **Operation id:** `hostel.requests.list`
- **Auth:** User JWT (authenticated)
- **Database binding:** RLS-scoped SELECT
- **Path params:** `enrolmentId`*
- **Response:** `{ items: [...] }` (or single)
- **Notes:** Scoped by policy p_hreq_sel.

## assessments

### `POST /assessments/:assessmentId/results` — Trainer records a student result (DW: p_ares_ins_trainer; pre-finalization only).

- **Operation id:** `assessment.record_result`
- **Auth:** User JWT (authenticated)
- **Database binding:** Direct write (column-limited RLS policy)
- **Request body:** `enrolment_id`*, `marks`, `result`*
- **Path params:** `assessmentId`*
- **Response:** object
- **Error conditions:** `E.AUTHZ.FORBIDDEN`
- **Notes:** Policy WITH CHECK requires the caller to be the batch trainer and the assessment not yet finalized (s.finalized_at IS NULL).

### `POST /batches/:batchId/assessments` — Create an assessment for a batch (centre_admin at the batch centre; migration 0004).

- **Operation id:** `assessment.create`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_assessment_create(...)`
- **Request body:** `name`*, `max_marks`*, `held_on`
- **Path params:** `batchId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.VAL.FAILED`

### `POST /assessments/:assessmentId/finalize` — Centre admin finalizes an assessment (locks results; gates certificate issue).

- **Operation id:** `assessment.finalize`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_finalize_assessment(...)`
- **Path params:** `assessmentId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`

### `GET /batches/:batchId/assessments` — List assessments for a batch (staff / trainer / enrolled student).

- **Operation id:** `assessments.list`
- **Auth:** User JWT (authenticated)
- **Database binding:** RLS-scoped SELECT
- **Path params:** `batchId`*
- **Response:** `{ items: [...] }` (or single)
- **Notes:** Scoped by policy p_assess_sel.

### `GET /assessments/:assessmentId/results` — List results for an assessment (student self / trainer / centre admin).

- **Operation id:** `assessment.results.list`
- **Auth:** User JWT (authenticated)
- **Database binding:** RLS-scoped SELECT
- **Path params:** `assessmentId`*
- **Response:** `{ items: [...] }` (or single)
- **Notes:** Scoped by policy p_ares_sel.

## certificates

### `POST /enrolments/:enrolmentId/certificate` — Centre admin issues a certificate (COMPLETED + assessment-passed gate, idempotent).

- **Operation id:** `cert.issue`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_cert_issue(...)` *(idempotent)*
- **Path params:** `enrolmentId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`, `E.CONFLICT.ALREADY_ACTIVE`
- **Notes:** One ISSUED cert per enrolment (ux_cert_active); collision-retry on verify_code.

### `POST /certificates/:certId/reissue` — Reissue a certificate (supersede chain, idempotent).

- **Operation id:** `cert.reissue`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_cert_reissue(...)` *(idempotent)*
- **Request body:** `reason`*
- **Path params:** `certId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`, `E.VAL.FAILED`

### `POST /certificates/:certId/revoke` — Revoke a certificate (idempotent).

- **Operation id:** `cert.revoke`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_cert_revoke(...)` *(idempotent)*
- **Request body:** `reason`*
- **Path params:** `certId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`, `E.VAL.FAILED`

### `GET /verify/:code` — PUBLIC certificate verification by code (uniform minimal projection).

- **Operation id:** `cert.verify`
- **Auth:** Public (anon)
- **Database binding:** `app.fn_cert_verify(...)`
- **Path params:** `code`*
- **Response:** object
- **Notes:** anon EXECUTE. Unknown code → uniform {valid:false}; no PII beyond holder name + course/batch. Rate limiting is an API-tier concern (see notes).

## placement

### `POST /placement/profile` — Student creates a placement profile (structural consent: consent_at set).

- **Operation id:** `placement.create_profile`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_placement_profile_create(...)`
- **Request body:** `skills_summary`, `preferred_district`
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.CONFLICT.ALREADY_ACTIVE`

### `POST /placement/profile/withdraw` — Student withdraws placement consent (closes open referrals).

- **Operation id:** `placement.withdraw_consent`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_placement_withdraw(...)`
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`

### `POST /placement/opportunities/:opportunityId/referrals` — Placement staff refers a consented student to an opportunity.

- **Operation id:** `referral.create`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_referral_create(...)`
- **Request body:** `placement_profile_id`*
- **Path params:** `opportunityId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.CONFLICT.DUPLICATE`
- **Notes:** Consented (non-withdrawn) profiles only (C9).

### `PATCH /placement/referrals/:referralId` — Placement staff updates a referral status.

- **Operation id:** `referral.update_status`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_referral_status(...)`
- **Request body:** `status`*
- **Path params:** `referralId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.VAL.FAILED`

### `POST /placement/referrals/:referralId/outcome` — Placement staff records a placement outcome (assistance record; never guaranteed).

- **Operation id:** `outcome.record`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_outcome_record(...)`
- **Request body:** `outcome`*, `joined_on`, `salary_band`
- **Path params:** `referralId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.CONFLICT.DUPLICATE`, `E.VAL.FAILED`

### `POST /placement/employers` — Create an employer (placement/centre_admin staff).

- **Operation id:** `employer.create`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_employer_create(...)`
- **Request body:** `name`*, `contact`, `district`
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.VAL.FAILED`

### `POST /placement/opportunities` — Create a placement opportunity (placement/centre_admin at the centre).

- **Operation id:** `opportunity.create`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_opportunity_create(...)`
- **Request body:** `employer_id`*, `centre_id`*, `course_id`, `title`*, `openings`*, `closes_on`
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.VAL.FAILED`

### `GET /placement/opportunities` — List job opportunities visible to the caller (staff / consented student).

- **Operation id:** `placement.opportunities.list`
- **Auth:** User JWT (authenticated)
- **Database binding:** RLS-scoped SELECT
- **Response:** `{ items: [...] }` (or single)
- **Notes:** Scoped by policy p_opp_sel.

### `GET /placement/referrals` — List referrals visible to the caller (student self / placement staff).

- **Operation id:** `placement.referrals.list`
- **Auth:** User JWT (authenticated)
- **Database binding:** RLS-scoped SELECT
- **Response:** `{ items: [...] }` (or single)
- **Notes:** Scoped by policy p_ref_sel.

## notifications

### `GET /notifications` — List the caller’s in-app notifications (RLS: recipient = auth.uid()).

- **Operation id:** `notifications.list`
- **Auth:** User JWT (authenticated)
- **Database binding:** RLS-scoped SELECT
- **Response:** `{ items: [...] }` (or single)
- **Notes:** Scoped by policy p_notif_sel.

### `POST /notifications/:notificationId/read` — Mark a notification read (DW: read_at set-once column grant).

- **Operation id:** `notification.mark_read`
- **Auth:** User JWT (authenticated)
- **Database binding:** Direct write (column-limited RLS policy)
- **Path params:** `notificationId`*
- **Response:** object
- **Error conditions:** `E.AUTHZ.FORBIDDEN`, `E.STATE.INVALID_TRANSITION`
- **Notes:** read_at is immutable once set (E.STATE.INVALID_TRANSITION on rewrite).

### `POST /jobs/outbox/claim` — Worker claims unprocessed domain events (FOR UPDATE SKIP LOCKED) ([SYS]).

- **Operation id:** `jobs.outbox_claim`
- **Auth:** Service token (service_role)
- **Database binding:** `app.fn_outbox_claim(...)`
- **Request body:** `limit`
- **Response:** object
- **Notes:** service_role. Returns a batch of domain_events rows for the dispatcher.

### `POST /jobs/outbox/enqueue` — Worker enqueues a notification for an event (dedupe on dedupe_key) ([SYS]).

- **Operation id:** `jobs.dispatch`
- **Auth:** Service token (service_role)
- **Database binding:** `app.fn_notification_enqueue(...)`
- **Request body:** `event_id`*, `recipient_profile_id`, `recipient_phone`, `channel`*, `template_key`*, `params`
- **Response:** object
- **Notes:** service_role. Marks the event processed; ON CONFLICT (dedupe_key) DO NOTHING.

### `POST /jobs/notifications/:notificationId/delivery` — Record a delivery attempt result (SENT/retry/FAILED per config) ([SYS]).

- **Operation id:** `jobs.delivery_record`
- **Auth:** Service token (service_role)
- **Database binding:** `app.fn_delivery_record(...)`
- **Request body:** `ok`*, `provider_ref`, `error`
- **Path params:** `notificationId`*
- **Response:** object
- **Notes:** service_role. Attempt count vs notif_max_attempts config decides FAILED.

### `POST /jobs/idempotency/purge` — Purge expired idempotency keys ([SYS]).

- **Operation id:** `jobs.idem_purge`
- **Auth:** Service token (service_role)
- **Database binding:** `app.fn_idem_purge(...)`
- **Response:** object
- **Notes:** service_role scheduler.

## centre-administration

### `POST /admin/staff` — Provision a staff profile + membership ([SYS]; auth user created first).

- **Operation id:** `staff.create`
- **Auth:** Service token (service_role)
- **Database binding:** `app.fn_staff_register(...)`
- **Request body:** `profile_id`*, `full_name`*, `email`, `phone`*, `centre_id`*, `role`*
- **Response:** object
- **Error conditions:** `E.CONFLICT.DUPLICATE`
- **Notes:** service_role. The API/EF creates the auth user, then passes its uuid as profile_id.

### `POST /admin/memberships/grant` — Grant a role membership (CAD own-centre non-admin; SAD anywhere).

- **Operation id:** `membership.grant`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_membership_grant(...)`
- **Request body:** `profile_id`*, `centre_id`*, `role`*, `reason`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`

### `POST /admin/memberships/revoke` — Revoke a role membership (CAD own-centre non-admin; SAD anywhere).

- **Operation id:** `membership.revoke`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_membership_revoke(...)`
- **Request body:** `profile_id`*, `centre_id`*, `role`*, `reason`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`

### `POST /admin/staff/:profileId/deactivate` — Deactivate a staff member (offboarding; idempotent). Emits open-work event.

- **Operation id:** `staff.deactivate`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_staff_deactivate(...)` *(idempotent)*
- **Request body:** `reason`*
- **Path params:** `profileId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`
- **Notes:** Session revocation itself is an auth-provider concern (outside SQL).

### `PUT /admin/config/:key` — Set a system setting (super_admin only).

- **Operation id:** `config.set`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_config_set(...)`
- **Request body:** `value`*, `reason`*
- **Path params:** `key`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.VAL.FAILED`
- **Notes:** value is jsonb. SAD-only (checked in fn_config_set).

### `POST /admin/exports` — Create an export job (centre_admin/super_admin/placement; idempotent).

- **Operation id:** `export.create`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_export_create(...)` *(idempotent)*
- **Request body:** `report_key`*, `params`
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`
- **Notes:** Generation + CSV-injection neutralization happen in the server/worker tier.

### `POST /admin/exports/:jobId/downloaded` — Audit an export download ([SYS]).

- **Operation id:** `export.mark_downloaded`
- **Auth:** Service token (service_role)
- **Database binding:** `app.fn_export_mark_downloaded(...)`
- **Request body:** `actor`*
- **Path params:** `jobId`*
- **Response:** object
- **Notes:** service_role. Writes an export.downloaded audit row.

### `GET /admin/audit` — Query audit events (CAD centre-scoped / SAD all).

- **Operation id:** `audit.query`
- **Auth:** User JWT (authenticated)
- **Database binding:** RLS-scoped SELECT
- **Query params:** `from`, `to`, `action`, `limit`
- **Response:** `{ items: [...] }` (or single)
- **Error conditions:** `E.RES.NOT_FOUND`
- **Notes:** Backed by the DEFINER function fn_audit_query (centre scoping inside); the audit_events table itself has no client grant.

### `GET /centres` — List active centres (authenticated).

- **Operation id:** `centres.list`
- **Auth:** User JWT (authenticated)
- **Database binding:** RLS-scoped SELECT
- **Response:** `{ items: [...] }` (or single)
- **Notes:** Scoped by policy p_centres_sel.

### `GET /batches` — List batches (OPEN/RUNNING publicly to authenticated; all for own-centre staff).

- **Operation id:** `batches.list`
- **Auth:** User JWT (authenticated)
- **Database binding:** RLS-scoped SELECT
- **Response:** `{ items: [...] }` (or single)
- **Notes:** Scoped by policy p_batches_sel.

### `POST /admin/courses` — Create a course (super_admin only).

- **Operation id:** `course.create`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_course_create(...)`
- **Request body:** `code`*, `name_en`*, `name_hi`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.CONFLICT.DUPLICATE`, `E.VAL.FAILED`
- **Notes:** SAD-only; courses are not centre-scoped.

### `PATCH /admin/courses/:courseId/active` — Activate/deactivate a course (super_admin).

- **Operation id:** `course.set_active`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_course_set_active(...)`
- **Request body:** `active`*
- **Path params:** `courseId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`

### `POST /admin/courses/:courseId/versions` — Add a course version (super_admin).

- **Operation id:** `course.add_version`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_course_version_create(...)`
- **Request body:** `version_no`*, `syllabus_summary`, `duration_weeks`*
- **Path params:** `courseId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.CONFLICT.DUPLICATE`, `E.VAL.FAILED`

### `POST /admin/batches` — Create a batch (centre_admin at the centre).

- **Operation id:** `batch.create`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_batch_create(...)`
- **Request body:** `centre_id`*, `course_version_id`*, `code`*, `capacity`*, `start_date`*, `end_date`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.CONFLICT.DUPLICATE`, `E.VAL.FAILED`

### `PATCH /admin/batches/:batchId` — Update batch fields (centre_admin; PLANNED/OPEN only).

- **Operation id:** `batch.update`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_batch_update(...)`
- **Request body:** `fields`*
- **Path params:** `batchId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`, `E.VAL.FAILED`

### `POST /admin/batches/:batchId/status` — Transition batch status (guarded: PLANNED→OPEN→RUNNING→COMPLETED / CANCELLED).

- **Operation id:** `batch.set_status`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_batch_set_status(...)`
- **Request body:** `status`*
- **Path params:** `batchId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`, `E.VAL.FAILED`

### `POST /admin/notices` — Create a DRAFT notice (centre_admin).

- **Operation id:** `notice.create`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_notice_create(...)`
- **Request body:** `centre_id`*, `title_hi`*, `title_en`*, `body_hi`*, `body_en`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.VAL.FAILED`

### `POST /admin/notices/:noticeId/audiences` — Add an audience to a DRAFT notice (centre_admin).

- **Operation id:** `notice.add_audience`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_notice_add_audience(...)`
- **Request body:** `audience`*, `batch_id`
- **Path params:** `noticeId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`, `E.VAL.FAILED`

### `POST /admin/notices/:noticeId/publish` — Publish a DRAFT notice (centre_admin).

- **Operation id:** `notice.publish`
- **Auth:** User JWT (authenticated)
- **Database binding:** `app.fn_notice_publish(...)`
- **Path params:** `noticeId`*
- **Response:** object
- **Error conditions:** `E.RES.NOT_FOUND`, `E.STATE.INVALID_TRANSITION`, `E.VAL.FAILED`
