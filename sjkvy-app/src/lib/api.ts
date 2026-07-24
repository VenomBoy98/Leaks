// api.ts — typed endpoint layer over apiClient (`http`). Types mirror the sjkvy-api
// operation contracts (src/domains/*). All calls go through the authenticated proxy.
import { http, newIdempotencyKey, type RequestOpts } from "@/lib/apiClient";
export const newIdempotencyKeySafe = newIdempotencyKey;

// ---------- shared types ----------
export type ApplicationStatus =
  | "DRAFT" | "SUBMITTED" | "IN_PROCESS" | "DECIDED" | "CLOSED" | "WITHDRAWN" | "EXPIRED";
export type Gender = "F" | "M" | "O";
export type AdmissionDecision = "APPROVED" | "REJECTED" | "WAITLISTED";
export type DocDecision = "ACCEPT" | "REJECT";

export interface Profile {
  id: string; full_name: string; phone: string; email: string | null;
  preferred_lang: "hi" | "en"; is_active: boolean;
}
export interface PublicCentre { id: string; name: string; district: string }
export interface PublicCourse { id: string; code: string; name_en: string; name_hi: string }
export interface Application {
  id: string; applicant_id: string; centre_id: string; course_id: string;
  status: ApplicationStatus; eligibility_flag?: boolean | null; hostel_required?: boolean;
  submitted_at?: string | null; created_at: string; updated_at: string;
}
export interface CertVerifyResult {
  valid: boolean; status?: string | null; holder_name?: string | null;
  course_code?: string | null; batch_code?: string | null; issued_on?: string | null; superseded?: boolean | null;
}
export interface VerificationCase {
  id: string; application_id: string; status: string; assigned_to?: string | null; centre_id?: string; created_at?: string; updated_at?: string;
}
export interface NotificationItem { id: string; template_key?: string; status?: string; created_at?: string; payload?: unknown }

// ----- staff domain types (mirror sjkvy-api read projections) -----
export interface Enrolment {
  id: string; student_id: string; batch_id: string; application_id: string;
  status: string; joined_at?: string | null; left_at?: string | null; created_at?: string;
}
export interface Batch { id: string; code?: string; centre_id?: string; course_id?: string; status?: string; capacity?: number | null; name?: string }
export interface ClassSession {
  id: string; batch_id: string; session_date: string; kind: string; slot?: number | null; topic?: string | null; trainer_profile_id?: string; locked_at?: string | null;
}
export interface AttendanceRow { id: string; session_id: string; enrolment_id: string; present: boolean; created_at?: string; updated_at?: string }
export interface CounsellingAppointment {
  id: string; application_id: string; status: string; scheduled_at?: string | null; attempt_no?: number; created_at?: string;
}
export interface HostelRequest {
  id: string; enrolment_id: string; status: string; created_at?: string; updated_at?: string;
}
export interface HostelBed {
  id: string; room_id: string; bed_no: string; status: string; room_no?: string | null; block_name?: string | null;
}
export interface Certificate {
  id: string; enrolment_id: string; certificate_no?: string | null; verify_code?: string | null; status: string; created_at?: string; supersedes_id?: string | null;
}
export interface PlacementOpportunity {
  id: string; employer_id: string; centre_id: string; course_id?: string | null; title: string; openings?: number | null; closes_on?: string | null; created_at?: string;
}
export interface PlacementReferral {
  id: string; opportunity_id: string; placement_profile_id: string; status: string; created_at?: string; updated_at?: string;
}
export interface StaffMember { profile_id: string; centre_id: string; role_code: string; is_active: boolean }
export interface StatusCount { status: string; n: number }
export interface AdmissionDecisionRow { id: string; application_id: string; decision: string; batch_id?: string | null; reason?: string | null; created_at?: string }
export interface WaitlistEntry { id: string; application_id: string; batch_id: string; status: string; rank?: number | null; created_at?: string }

const listOf = <T>(p: string, opts?: RequestOpts) => http.get<{ items: T[] }>(p, opts).then((d) => d.items ?? []);

export const api = {
  // ----- public -----
  listCourses: (opts?: RequestOpts) => listOf<PublicCourse>("public/courses", opts),
  listCentres: (opts?: RequestOpts) => listOf<PublicCentre>("public/centres", opts),
  submitContact: (body: { name: string; email: string; subject: string; message: string }, opts?: RequestOpts) =>
    http.post<{ ok: boolean }>(`public/contact`, body, opts),
  verifyCertificate: (code: string, opts?: RequestOpts) =>
    http.get<CertVerifyResult>(`verify/${encodeURIComponent(code)}`, opts),

  // ----- identity -----
  me: (opts?: RequestOpts) => http.get<Profile>("auth/me", opts),
  updateMe: (body: { full_name?: string; preferred_lang?: "hi" | "en" }, opts?: RequestOpts) =>
    http.patch<Profile>("auth/me", body, opts),

  // ----- applicant: applications -----
  listApplications: (opts?: RequestOpts) => listOf<Application>("applications", opts),
  getApplication: (id: string, opts?: RequestOpts) => http.get<Application>(`applications/${id}`, opts),
  createApplication: (
    body: { course_id: string; dob: string; gender: Gender; district: string; block?: string; address?: string; qualification?: string },
    opts?: RequestOpts,
  ) => http.post<{ application_id: string; applicant_id: string; status: ApplicationStatus }>(
    "applications", body, { idempotencyKey: newIdempotencyKey(), ...opts },
  ),
  saveDraft: (id: string, fields: Record<string, unknown>, opts?: RequestOpts) =>
    http.patch<{ saved: boolean; eligibility_preview: boolean }>(`applications/${id}/draft`, { fields }, opts),
  submitApplication: (id: string, opts?: RequestOpts) =>
    http.post<{ status: ApplicationStatus; review: boolean }>(`applications/${id}/submit`, undefined, { idempotencyKey: newIdempotencyKey(), ...opts }),
  withdrawApplication: (id: string, reason: string, opts?: RequestOpts) =>
    http.post<{ status: ApplicationStatus }>(`applications/${id}/withdraw`, { reason }, { idempotencyKey: newIdempotencyKey(), ...opts }),

  // ----- staff: roster (for assignment pickers) -----
  listStaff: (opts?: RequestOpts) => listOf<StaffMember>("admin/staff", opts),

  // ----- staff: verification -----
  listVerificationCases: (opts?: RequestOpts) => listOf<VerificationCase>("verification/cases", opts),
  assignChecker: (caseId: string, checker: string, opts?: RequestOpts) =>
    http.post<{ status: string }>(`verification/cases/${caseId}/assign`, { checker }, { idempotencyKey: newIdempotencyKey(), ...opts }),
  reassignChecker: (caseId: string, checker: string, opts?: RequestOpts) =>
    http.post<{ status: string }>(`verification/cases/${caseId}/reassign`, { checker }, { idempotencyKey: newIdempotencyKey(), ...opts }),
  decideDocument: (
    caseId: string, body: { document_version_id: string; decision: DocDecision; reason?: string }, opts?: RequestOpts,
  ) => http.post<{ decision: string; case_verified: boolean }>(`verification/cases/${caseId}/decisions`, body, { idempotencyKey: newIdempotencyKey(), ...opts }),
  requestCorrection: (caseId: string, body: { document_version_id: string; reason: string }, opts?: RequestOpts) =>
    http.post<{ status: string }>(`verification/cases/${caseId}/corrections`, body, { idempotencyKey: newIdempotencyKey(), ...opts }),
  failVerification: (caseId: string, reason: string, opts?: RequestOpts) =>
    http.post<{ status: string }>(`verification/cases/${caseId}/fail`, { reason }, { idempotencyKey: newIdempotencyKey(), ...opts }),
  // backend contract: view-url is POST (mints a short-lived authorized URL)
  documentViewUrl: (versionId: string, opts?: RequestOpts) =>
    http.post<{ url: string; expires_at?: string }>(`documents/${versionId}/view-url`, undefined, opts),

  // ----- staff: attendance -----
  listBatches: (opts?: RequestOpts) => listOf<Batch>("batches", opts),
  listSessions: (batchId: string, opts?: RequestOpts) => listOf<ClassSession>(`batches/${batchId}/sessions`, opts),
  createSession: (body: { batch_id: string; session_date: string; kind: "THEORY" | "PRACTICAL"; slot?: number; topic?: string }, opts?: RequestOpts) =>
    http.post<ClassSession>("sessions", body, opts),
  listSessionAttendance: (sessionId: string, opts?: RequestOpts) => listOf<AttendanceRow>(`sessions/${sessionId}/attendance`, opts),
  markAttendance: (sessionId: string, body: { enrolment_id: string; present: boolean }, opts?: RequestOpts) =>
    http.post<{ id: string; present: boolean }>(`sessions/${sessionId}/attendance`, body, opts),
  lockSession: (sessionId: string, opts?: RequestOpts) =>
    http.post<{ ok: boolean }>(`sessions/${sessionId}/lock`, undefined, { idempotencyKey: newIdempotencyKey(), ...opts }),
  listBatchEnrolments: (batchId: string, opts?: RequestOpts) => listOf<Enrolment>(`batches/${batchId}/enrolments`, opts),
  attendanceSummary: (batchId: string, opts?: RequestOpts) =>
    http.get<{ items: Array<{ session_id: string; session_date: string; topic: string | null; present: number; absent: number; total: number }> }>(`batches/${batchId}/attendance-summary`, opts).then((d) => d.items ?? []),

  // ----- staff: counselling -----
  listCounselling: (opts?: RequestOpts) => listOf<CounsellingAppointment>("counselling/appointments", opts),
  scheduleCounselling: (applicationId: string, scheduledAt: string, opts?: RequestOpts) =>
    http.post<{ appointment_id: string }>(`applications/${applicationId}/counselling`, { scheduled_at: scheduledAt }, { idempotencyKey: newIdempotencyKey(), ...opts }),
  rescheduleCounselling: (appointmentId: string, scheduledAt: string, opts?: RequestOpts) =>
    http.post<{ status: string }>(`counselling/${appointmentId}/reschedule`, { scheduled_at: scheduledAt }, { idempotencyKey: newIdempotencyKey(), ...opts }),
  counsellingNoShow: (appointmentId: string, opts?: RequestOpts) =>
    http.post<{ status: string }>(`counselling/${appointmentId}/no-show`, undefined, { idempotencyKey: newIdempotencyKey(), ...opts }),
  counsellingOutcome: (appointmentId: string, body: { recommendation: "APPROVE" | "REJECT" | "WAITLIST"; notes?: string }, opts?: RequestOpts) =>
    http.post<{ recommendation: string }>(`counselling/${appointmentId}/outcome`, body, { idempotencyKey: newIdempotencyKey(), ...opts }),

  // ----- staff: hostel -----
  listHostelRequests: (opts?: RequestOpts) => listOf<HostelRequest>("hostel/requests", opts),
  listHostelBeds: (opts?: RequestOpts) => listOf<HostelBed>("hostel/beds", opts),
  approveHostelRequest: (requestId: string, opts?: RequestOpts) =>
    http.post<{ status: string }>(`hostel/requests/${requestId}/approve`, undefined, { idempotencyKey: newIdempotencyKey(), ...opts }),
  allocateHostelBed: (requestId: string, bedId: string, opts?: RequestOpts) =>
    http.post<{ status: string }>(`hostel/requests/${requestId}/allocate`, { bed_id: bedId }, { idempotencyKey: newIdempotencyKey(), ...opts }),
  setBedStatus: (bedId: string, status: "AVAILABLE" | "MAINTENANCE", opts?: RequestOpts) =>
    http.post<{ status: string }>(`hostel/beds/${bedId}/status`, { status }, { idempotencyKey: newIdempotencyKey(), ...opts }),

  // ----- staff: certificates -----
  listCertificates: (opts?: RequestOpts) => listOf<Certificate>("certificates", opts),
  issueCertificate: (enrolmentId: string, opts?: RequestOpts) =>
    http.post<{ certificate_id: string; code?: string }>(`enrolments/${enrolmentId}/certificate`, undefined, { idempotencyKey: newIdempotencyKey(), ...opts }),
  reissueCertificate: (certId: string, opts?: RequestOpts) =>
    http.post<{ certificate_id: string }>(`certificates/${certId}/reissue`, undefined, { idempotencyKey: newIdempotencyKey(), ...opts }),
  revokeCertificate: (certId: string, reason: string, opts?: RequestOpts) =>
    http.post<{ status: string }>(`certificates/${certId}/revoke`, { reason }, { idempotencyKey: newIdempotencyKey(), ...opts }),

  // ----- staff: placement -----
  listOpportunities: (opts?: RequestOpts) => listOf<PlacementOpportunity>("placement/opportunities", opts),
  listReferrals: (opts?: RequestOpts) => listOf<PlacementReferral>("placement/referrals", opts),
  referStudent: (opportunityId: string, placementProfileId: string, opts?: RequestOpts) =>
    http.post<{ referral_id: string }>(`placement/opportunities/${opportunityId}/referrals`, { placement_profile_id: placementProfileId }, { idempotencyKey: newIdempotencyKey(), ...opts }),
  updateReferral: (referralId: string, status: string, opts?: RequestOpts) =>
    http.patch<{ status: string }>(`placement/referrals/${referralId}`, { status }, opts),
  referralOutcome: (referralId: string, body: { outcome: string; notes?: string }, opts?: RequestOpts) =>
    http.post<{ outcome: string }>(`placement/referrals/${referralId}/outcome`, body, { idempotencyKey: newIdempotencyKey(), ...opts }),

  // ----- staff: reports (scoped aggregates) -----
  reportVerification: (opts?: RequestOpts) => listOf<StatusCount>("reports/verification", opts),
  reportCounselling: (opts?: RequestOpts) => listOf<StatusCount>("reports/counselling", opts),
  reportHostelOccupancy: (opts?: RequestOpts) => listOf<StatusCount>("reports/hostel-occupancy", opts),
  reportCertificates: (opts?: RequestOpts) => listOf<StatusCount>("reports/certificates", opts),
  reportPlacement: (opts?: RequestOpts) => listOf<StatusCount>("reports/placement", opts),

  // ----- admin: admission decision (transactional + idempotent) -----
  finalizeAdmission: (
    applicationId: string, body: { decision: AdmissionDecision; batch_id?: string; reason?: string }, opts?: RequestOpts,
  ) => http.post<{ decision: string; offer_id?: string | null; rank?: number | null }>(
    `applications/${applicationId}/admission`, body, { idempotencyKey: newIdempotencyKey(), ...opts },
  ),
  listDecisions: (applicationId: string, opts?: RequestOpts) => listOf<AdmissionDecisionRow>(`applications/${applicationId}/decisions`, opts),
  listWaitlist: (batchId: string, opts?: RequestOpts) => listOf<WaitlistEntry>(`batches/${batchId}/waitlist`, opts),
  promoteWaitlist: (batchId: string, opts?: RequestOpts) =>
    http.post<{ promoted?: string | null }>(`batches/${batchId}/waitlist/promote`, undefined, { idempotencyKey: newIdempotencyKey(), ...opts }),

  // ----- student / staff -----
  listEnrolments: (opts?: RequestOpts) => listOf<Enrolment>("enrolments", opts),

  // ----- documents (via the secure BFF, not the proxy) -----
  listDocuments: (applicationId: string, opts?: RequestOpts) =>
    http.get<{ items: ApplicantDocument[] }>(`applications/${applicationId}/documents`, opts).then((d) => d.items ?? []),

  // ----- notifications -----
  listNotifications: (opts?: RequestOpts) => listOf<NotificationItem>("notifications", opts),
  markNotificationRead: (id: string, opts?: RequestOpts) => http.post<{ ok: boolean }>(`notifications/${id}/read`, undefined, opts),
};

export interface ApplicantDocument {
  id: string; application_id: string; document_type_code: string; status: string;
  version_no: number; scan_status: string; uploaded_at?: string; version_id?: string | null;
}
export interface UploadResult { document_type: string; version_id: string; version_no: number; scan_status: string }

// Upload a file through the secure document BFF (returns PENDING_SCAN — never auto-clean).
export async function uploadDocument(input: {
  application_id: string; document_type: string; mime: string; file: File;
}): Promise<UploadResult> {
  const buf = await input.file.arrayBuffer();
  const content_base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  const res = await fetch("/api/documents/upload", {
    method: "POST", credentials: "include", headers: { "content-type": "application/json" },
    body: JSON.stringify({ application_id: input.application_id, document_type: input.document_type, mime: input.mime, content_base64 }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? "Upload failed");
  return body as UploadResult;
}

// Request a short-lived signed view URL (only succeeds for CLEAN documents).
export async function documentViewUrl(input: { versionId: string; application_id: string; document_type: string }): Promise<string> {
  const res = await fetch(`/api/documents/${input.versionId}/view-url`, {
    method: "POST", credentials: "include", headers: { "content-type": "application/json" },
    body: JSON.stringify({ application_id: input.application_id, document_type: input.document_type }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? "Cannot view this document.");
  return body.url as string;
}

// legacy named exports used by existing screen wiring
export const verifyCertificate = api.verifyCertificate;
export async function devLogin(role: string): Promise<{ ok: boolean; home: string }> {
  const res = await fetch("/api/dev-login", {
    method: "POST", headers: { "content-type": "application/json" }, credentials: "include",
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error("login failed");
  return res.json();
}
export async function logout(): Promise<void> {
  await fetch("/api/logout", { method: "POST", credentials: "include" });
}
