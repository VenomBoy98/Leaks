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
  id: string; application_id: string; status: string; assigned_to?: string | null; centre_id?: string; created_at?: string;
}
export interface NotificationItem { id: string; template_key?: string; status?: string; created_at?: string; payload?: unknown }

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

  // ----- staff: verification -----
  listVerificationCases: (opts?: RequestOpts) => listOf<VerificationCase>("verification/cases", opts),
  decideDocument: (
    caseId: string, body: { document_version_id: string; decision: DocDecision; reason?: string }, opts?: RequestOpts,
  ) => http.post<{ decision: string; case_verified: boolean }>(`verification/cases/${caseId}/decisions`, body, { idempotencyKey: newIdempotencyKey(), ...opts }),
  // backend contract: view-url is POST (mints a short-lived authorized URL)
  documentViewUrl: (versionId: string, opts?: RequestOpts) =>
    http.post<{ url: string; expires_at?: string }>(`documents/${versionId}/view-url`, undefined, opts),

  // ----- admin: admission decision (transactional + idempotent) -----
  finalizeAdmission: (
    applicationId: string, body: { decision: AdmissionDecision; batch_id?: string; reason?: string }, opts?: RequestOpts,
  ) => http.post<{ decision: string; offer_id?: string | null; rank?: number | null }>(
    `applications/${applicationId}/admission`, body, { idempotencyKey: newIdempotencyKey(), ...opts },
  ),

  // ----- student -----
  listEnrolments: (opts?: RequestOpts) => listOf<Record<string, unknown>>("enrolments", opts),

  // ----- documents (via the secure BFF, not the proxy) -----
  listDocuments: (applicationId: string, opts?: RequestOpts) =>
    http.get<{ items: ApplicantDocument[] }>(`applications/${applicationId}/documents`, opts).then((d) => d.items ?? []),

  // ----- notifications -----
  listNotifications: (opts?: RequestOpts) => listOf<NotificationItem>("notifications", opts),
  markNotificationRead: (id: string, opts?: RequestOpts) => http.post<{ ok: boolean }>(`notifications/${id}/read`, undefined, opts),
};

export interface ApplicantDocument {
  id: string; application_id: string; document_type_code: string; status: string;
  version_no: number; scan_status: string; uploaded_at?: string;
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
