-- 0000_schema.sql — SJKVY core schema (Backend Foundation v1.1 + v1.1.1)
-- Deterministic, FK-ordered. Fresh objects only (no blocking DDL on existing data).
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE app.profiles (
  id uuid PRIMARY KEY, full_name text NOT NULL, phone text UNIQUE NOT NULL, email text,
  preferred_lang text NOT NULL DEFAULT 'hi' CHECK (preferred_lang IN ('hi','en')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE app.roles (code text PRIMARY KEY);
INSERT INTO app.roles VALUES ('operator'),('checker'),('counsellor'),('trainer'),
 ('hostel_manager'),('placement'),('centre_admin'),('super_admin');
CREATE TABLE app.centres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, address text NOT NULL,
  district text NOT NULL, is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE app.staff_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES app.profiles ON DELETE RESTRICT,
  centre_id uuid NOT NULL REFERENCES app.centres ON DELETE RESTRICT,
  role_code text NOT NULL REFERENCES app.roles ON DELETE RESTRICT,
  is_active boolean NOT NULL DEFAULT true, deactivated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, centre_id, role_code));
CREATE INDEX ix_memb_centre_role ON app.staff_memberships (centre_id, role_code) WHERE is_active;

CREATE TABLE app.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text UNIQUE NOT NULL,
  name_en text NOT NULL, name_hi text NOT NULL, is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE app.course_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES app.courses ON DELETE RESTRICT,
  version_no int NOT NULL, syllabus_summary text,
  duration_weeks int NOT NULL CHECK (duration_weeks > 0),
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (course_id, version_no));
CREATE TABLE app.batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id uuid NOT NULL REFERENCES app.centres ON DELETE RESTRICT,
  course_version_id uuid NOT NULL REFERENCES app.course_versions ON DELETE RESTRICT,
  code text NOT NULL, capacity int NOT NULL CHECK (capacity > 0),
  start_date date NOT NULL, end_date date NOT NULL,
  status text NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED','OPEN','RUNNING','COMPLETED','CANCELLED')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date > start_date), UNIQUE (centre_id, code));
CREATE INDEX ix_batches_centre_status ON app.batches (centre_id, status);

CREATE TABLE app.applicants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid UNIQUE REFERENCES app.profiles ON DELETE RESTRICT,
  full_name text NOT NULL, phone text NOT NULL, dob date NOT NULL,
  gender text NOT NULL CHECK (gender IN ('F','M','O')),
  district text NOT NULL, block text, address text,
  guardian_name text, guardian_phone text,
  aadhaar_last4 char(4) CHECK (aadhaar_last4 ~ '^[0-9]{4}$'),
  created_channel text NOT NULL CHECK (created_channel IN ('SELF','ASSISTED')),
  created_by_profile_id uuid REFERENCES app.profiles,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX ux_applicants_unclaimed_phone ON app.applicants (phone) WHERE profile_id IS NULL;
CREATE INDEX ix_applicants_phone ON app.applicants (phone);
CREATE TABLE app.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id uuid NOT NULL REFERENCES app.applicants ON DELETE RESTRICT,
  centre_id uuid NOT NULL REFERENCES app.centres ON DELETE RESTRICT,
  course_id uuid NOT NULL REFERENCES app.courses ON DELETE RESTRICT,
  assisting_operator_id uuid REFERENCES app.profiles,
  hostel_required boolean NOT NULL DEFAULT false,
  qualification text, passing_year int CHECK (passing_year BETWEEN 1990 AND 2100),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN
    ('DRAFT','SUBMITTED','IN_PROCESS','DECIDED','CLOSED','WITHDRAWN','EXPIRED')),
  eligibility_flag text CHECK (eligibility_flag IN ('OK','REVIEW')),
  submitted_at timestamptz, withdrawn_at timestamptz, submission_snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX ux_applications_active ON app.applications (applicant_id)
  WHERE status IN ('DRAFT','SUBMITTED','IN_PROCESS');
CREATE INDEX ix_applications_centre_status ON app.applications (centre_id, status);

CREATE TABLE app.document_types (code text PRIMARY KEY, name_en text NOT NULL, name_hi text NOT NULL,
  is_active boolean NOT NULL DEFAULT true);
CREATE TABLE app.document_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES app.courses ON DELETE RESTRICT,
  document_type_code text NOT NULL REFERENCES app.document_types,
  stage text NOT NULL CHECK (stage IN ('APPLICATION','PLACEMENT')),
  is_required boolean NOT NULL DEFAULT true);
CREATE UNIQUE INDEX ux_docreq ON app.document_requirements
  (coalesce(course_id,'00000000-0000-0000-0000-000000000000'::uuid), document_type_code, stage);
CREATE TABLE app.applicant_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES app.applications ON DELETE RESTRICT,
  document_type_code text NOT NULL REFERENCES app.document_types,
  current_version_id uuid,
  status text NOT NULL DEFAULT 'UPLOADED' CHECK (status IN ('UPLOADED','ACCEPTED','REJECTED')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (application_id, document_type_code));
CREATE TABLE app.document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES app.applicant_documents ON DELETE RESTRICT,
  version_no int NOT NULL, storage_path text NOT NULL,
  mime text NOT NULL, size_bytes int NOT NULL CHECK (size_bytes > 0),
  sha256 text, scan_status text NOT NULL DEFAULT 'PENDING' CHECK (scan_status IN ('PENDING','CLEAN','FLAGGED')),
  uploaded_by uuid REFERENCES app.profiles, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, version_no));
ALTER TABLE app.applicant_documents ADD CONSTRAINT fk_current_version
  FOREIGN KEY (current_version_id) REFERENCES app.document_versions;

CREATE TABLE app.verification_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid UNIQUE NOT NULL REFERENCES app.applications ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'PENDING_ASSIGNMENT' CHECK (status IN
    ('PENDING_ASSIGNMENT','IN_REVIEW','CORRECTION_REQUESTED','RESUBMITTED','VERIFIED','FAILED')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE app.verification_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES app.verification_cases ON DELETE RESTRICT,
  checker_profile_id uuid NOT NULL REFERENCES app.profiles,
  assigned_by uuid NOT NULL REFERENCES app.profiles,
  active boolean NOT NULL DEFAULT true, reassign_reason text,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX ux_assignment_active ON app.verification_assignments (case_id) WHERE active;
CREATE TABLE app.verification_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES app.verification_cases ON DELETE RESTRICT,
  document_version_id uuid NOT NULL REFERENCES app.document_versions,
  decision text NOT NULL CHECK (decision IN ('ACCEPT','REJECT')),
  reason text, decided_by uuid NOT NULL REFERENCES app.profiles,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (decision = 'ACCEPT' OR reason IS NOT NULL));
CREATE TABLE app.correction_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES app.verification_cases ON DELETE RESTRICT,
  document_id uuid REFERENCES app.applicant_documents,
  message text NOT NULL, resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE app.counselling_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES app.applications ON DELETE RESTRICT,
  scheduled_at timestamptz NOT NULL, attempt_no int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN
    ('SCHEDULED','RESCHEDULED','COMPLETED','NO_SHOW','CANCELLED')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX ix_counsel_app ON app.counselling_appointments (application_id);
CREATE TABLE app.counselling_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid UNIQUE NOT NULL REFERENCES app.counselling_appointments ON DELETE RESTRICT,
  recommendation text NOT NULL CHECK (recommendation IN ('APPROVE','REJECT','HOLD')),
  notes text, recorded_by uuid NOT NULL REFERENCES app.profiles,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE app.admission_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES app.applications ON DELETE RESTRICT,
  decision text NOT NULL CHECK (decision IN ('APPROVED','REJECTED','WAITLISTED')),
  batch_id uuid REFERENCES app.batches, reason text,
  decided_by uuid NOT NULL REFERENCES app.profiles,
  superseded_by uuid REFERENCES app.admission_decisions, supersedes_note boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (decision <> 'REJECTED' OR reason IS NOT NULL),
  CHECK (decision <> 'APPROVED' OR batch_id IS NOT NULL));
CREATE UNIQUE INDEX ux_decision_current ON app.admission_decisions (application_id)
  WHERE superseded_by IS NULL;
CREATE TABLE app.waitlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid UNIQUE NOT NULL REFERENCES app.applications ON DELETE RESTRICT,
  batch_id uuid NOT NULL REFERENCES app.batches, rank int NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PROMOTED','LAPSED','WITHDRAWN')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX ux_waitlist_rank ON app.waitlist_entries (batch_id, rank) WHERE status = 'ACTIVE';
CREATE TABLE app.waitlist_moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES app.waitlist_entries ON DELETE RESTRICT,
  from_rank int, to_rank int, reason text NOT NULL, moved_by uuid REFERENCES app.profiles,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE app.admission_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid UNIQUE NOT NULL REFERENCES app.applications ON DELETE RESTRICT,
  batch_id uuid NOT NULL REFERENCES app.batches,
  status text NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT','ACCEPTED','DECLINED','EXPIRED')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX ix_offers_batch_live ON app.admission_offers (batch_id) WHERE status = 'SENT';

CREATE TABLE app.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id uuid UNIQUE NOT NULL REFERENCES app.applicants ON DELETE RESTRICT,
  student_code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','COMPLETED','DROPPED')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE app.enrolments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES app.students ON DELETE RESTRICT,
  batch_id uuid NOT NULL REFERENCES app.batches ON DELETE RESTRICT,
  application_id uuid UNIQUE NOT NULL REFERENCES app.applications ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'ENROLLED' CHECK (status IN
    ('ENROLLED','ACTIVE','COMPLETED','DROPPED','TRANSFERRED')),
  joined_at date, left_at date,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, batch_id));
CREATE INDEX ix_enrol_batch_status ON app.enrolments (batch_id, status);
CREATE TABLE app.enrolment_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrolment_id uuid NOT NULL REFERENCES app.enrolments ON DELETE RESTRICT,
  from_batch uuid NOT NULL REFERENCES app.batches, to_batch uuid NOT NULL REFERENCES app.batches,
  reason text NOT NULL, transferred_by uuid NOT NULL REFERENCES app.profiles,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE app.class_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES app.batches ON DELETE RESTRICT,
  session_date date NOT NULL, kind text NOT NULL CHECK (kind IN ('THEORY','PRACTICAL')),
  slot int NOT NULL DEFAULT 1, topic text,
  trainer_profile_id uuid REFERENCES app.profiles, locked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (batch_id, session_date, kind, slot));
CREATE TABLE app.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES app.class_sessions ON DELETE RESTRICT,
  enrolment_id uuid NOT NULL REFERENCES app.enrolments ON DELETE RESTRICT,
  present boolean NOT NULL, marked_by uuid REFERENCES app.profiles,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, enrolment_id));
CREATE TABLE app.attendance_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id uuid NOT NULL REFERENCES app.attendance ON DELETE RESTRICT,
  old_present boolean NOT NULL, new_present boolean NOT NULL,
  reason text NOT NULL, corrected_by uuid NOT NULL REFERENCES app.profiles,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE app.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES app.batches ON DELETE RESTRICT,
  name text NOT NULL, max_marks int NOT NULL CHECK (max_marks > 0),
  held_on date, finalized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE app.assessment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES app.assessments ON DELETE RESTRICT,
  enrolment_id uuid NOT NULL REFERENCES app.enrolments ON DELETE RESTRICT,
  marks numeric CHECK (marks >= 0),
  result text NOT NULL CHECK (result IN ('PASS','FAIL','ABSENT')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, enrolment_id));
CREATE TABLE app.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrolment_id uuid NOT NULL REFERENCES app.enrolments ON DELETE RESTRICT,
  certificate_no text UNIQUE NOT NULL, verify_code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('ISSUED','REVOKED','REISSUED')),
  issued_by uuid NOT NULL REFERENCES app.profiles, reason text,
  supersedes_id uuid REFERENCES app.certificates,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status = 'ISSUED' OR reason IS NOT NULL));
CREATE UNIQUE INDEX ux_cert_active ON app.certificates (enrolment_id) WHERE status = 'ISSUED';

CREATE TABLE app.hostel_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id uuid NOT NULL REFERENCES app.centres ON DELETE RESTRICT,
  name text NOT NULL, warden_profile_id uuid REFERENCES app.profiles,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE app.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid NOT NULL REFERENCES app.hostel_blocks ON DELETE RESTRICT,
  room_no text NOT NULL, UNIQUE (block_id, room_no));
CREATE TABLE app.beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES app.rooms ON DELETE RESTRICT,
  bed_no text NOT NULL,
  status text NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE','OCCUPIED','MAINTENANCE')),
  updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (room_id, bed_no));
CREATE TABLE app.hostel_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrolment_id uuid NOT NULL REFERENCES app.enrolments ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'REQUESTED' CHECK (status IN
    ('REQUESTED','APPROVED','QUEUED','ALLOCATED','CANCELLED','REJECTED')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX ux_hostel_request_live ON app.hostel_requests (enrolment_id)
  WHERE status IN ('REQUESTED','APPROVED','QUEUED','ALLOCATED');
CREATE TABLE app.hostel_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bed_id uuid NOT NULL REFERENCES app.beds ON DELETE RESTRICT,
  enrolment_id uuid NOT NULL REFERENCES app.enrolments ON DELETE RESTRICT,
  allocated_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz, released_reason text);
CREATE UNIQUE INDEX ux_alloc_bed_active ON app.hostel_allocations (bed_id) WHERE released_at IS NULL;
CREATE UNIQUE INDEX ux_alloc_enrol_active ON app.hostel_allocations (enrolment_id) WHERE released_at IS NULL;
CREATE TABLE app.hostel_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrolment_id uuid NOT NULL REFERENCES app.enrolments,
  from_bed uuid NOT NULL REFERENCES app.beds, to_bed uuid NOT NULL REFERENCES app.beds,
  reason text NOT NULL, transferred_by uuid NOT NULL REFERENCES app.profiles,
  created_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE app.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id uuid REFERENCES app.centres, title_hi text NOT NULL, title_en text NOT NULL,
  body_hi text NOT NULL, body_en text NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PUBLISHED','ARCHIVED')),
  published_at timestamptz, published_by uuid REFERENCES app.profiles,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE app.notice_audiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id uuid NOT NULL REFERENCES app.notices ON DELETE RESTRICT,
  audience text NOT NULL CHECK (audience IN ('PUBLIC','APPLICANTS','STUDENTS','BATCH')),
  batch_id uuid REFERENCES app.batches);
CREATE TABLE app.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id uuid NOT NULL REFERENCES app.centres, title text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('TOUR','EVENT')), starts_on date NOT NULL,
  consent_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE app.event_participation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES app.events ON DELETE RESTRICT,
  enrolment_id uuid NOT NULL REFERENCES app.enrolments ON DELETE RESTRICT,
  consent_at timestamptz, status text NOT NULL DEFAULT 'JOINED',
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (event_id, enrolment_id));
CREATE TABLE app.placement_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid UNIQUE NOT NULL REFERENCES app.students ON DELETE RESTRICT,
  consent_at timestamptz NOT NULL, skills_summary text, preferred_district text,
  withdrawn_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE app.employers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL,
  contact text, district text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE app.job_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES app.employers, centre_id uuid NOT NULL REFERENCES app.centres,
  course_id uuid REFERENCES app.courses, title text NOT NULL,
  openings int NOT NULL CHECK (openings > 0), closes_on date,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE app.placement_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES app.job_opportunities ON DELETE RESTRICT,
  placement_profile_id uuid NOT NULL REFERENCES app.placement_profiles ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'REFERRED' CHECK (status IN
    ('REFERRED','INTERVIEW','OFFERED','DECLINED','CLOSED')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (opportunity_id, placement_profile_id));
CREATE TABLE app.placement_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid UNIQUE NOT NULL REFERENCES app.placement_referrals ON DELETE RESTRICT,
  outcome text NOT NULL CHECK (outcome IN ('JOINED','NOT_JOINED')),
  joined_on date, salary_band text, recorded_by uuid NOT NULL REFERENCES app.profiles,
  created_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE app.domain_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL, aggregate_type text NOT NULL, aggregate_id uuid NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz, attempts int NOT NULL DEFAULT 0, last_error text);
CREATE INDEX ix_outbox_unprocessed ON app.domain_events (created_at) WHERE processed_at IS NULL;
CREATE TABLE app.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES app.domain_events,
  recipient_profile_id uuid REFERENCES app.profiles, recipient_phone text,
  channel text NOT NULL CHECK (channel IN ('SMS','INAPP')),
  template_key text NOT NULL, params jsonb NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT','FAILED','SUPPRESSED')),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX ix_notif_recipient ON app.notifications (recipient_profile_id, created_at DESC);
CREATE TABLE app.delivery_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES app.notifications ON DELETE RESTRICT,
  attempt_no int NOT NULL, provider_ref text, error text,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (notification_id, attempt_no));
CREATE TABLE app.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_profile_id uuid, actor_role_snapshot text,
  action text NOT NULL, target_type text NOT NULL, target_id uuid,
  at timestamptz NOT NULL DEFAULT now(), correlation_id uuid, reason text, summary jsonb);
CREATE INDEX ix_audit_target ON app.audit_events (target_type, target_id);
CREATE INDEX ix_audit_actor ON app.audit_events (actor_profile_id, at DESC);
CREATE TABLE app.system_settings (
  key text PRIMARY KEY, value jsonb NOT NULL,
  updated_by uuid REFERENCES app.profiles, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE app.eligibility_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_age int NOT NULL, max_age int NOT NULL, required_gender text NOT NULL,
  district_whitelist text[], active boolean NOT NULL DEFAULT true);
CREATE TABLE app.idempotency_keys (
  op text NOT NULL, actor uuid NOT NULL, key uuid NOT NULL,
  request_hash text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','DONE')),
  response jsonb, created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (op, actor, key));
CREATE TABLE app.export_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor uuid NOT NULL REFERENCES app.profiles, report_key text NOT NULL, params jsonb,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','READY','FAILED')),
  row_count int, storage_path text, created_at timestamptz NOT NULL DEFAULT now());
