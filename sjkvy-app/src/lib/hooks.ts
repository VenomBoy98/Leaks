"use client";
// Data hooks (SWR) over the typed api layer. Every hook exposes real loading / empty / error
// state; mutations call `mutate` so other views refresh. No mock data.
import useSWR, { mutate as globalMutate } from "swr";
import {
  api, type Application, type PublicCentre, type ApplicantDocument, type NotificationItem, type Profile, type PublicCourse,
  type VerificationCase, type Batch, type ClassSession, type AttendanceRow, type Enrolment,
  type CounsellingAppointment, type HostelRequest, type HostelBed, type Certificate,
  type PlacementOpportunity, type PlacementReferral, type StaffMember,
} from "@/lib/api";

export function useMe() {
  return useSWR<Profile>("me", () => api.me());
}
export function useCentres() {
  return useSWR<PublicCentre[]>("centres", () => api.listCentres());
}
export function useCourses() {
  return useSWR<PublicCourse[]>("courses", () => api.listCourses());
}
export function useApplications() {
  return useSWR<Application[]>("applications", () => api.listApplications());
}
export function useApplication(id: string | undefined) {
  return useSWR<Application | null>(id ? ["application", id] : null, () => (id ? api.getApplication(id) : Promise.resolve(null)));
}
export function useDocuments(applicationId: string | undefined) {
  return useSWR<ApplicantDocument[]>(applicationId ? ["docs", applicationId] : null, () =>
    applicationId ? api.listDocuments(applicationId) : Promise.resolve([]),
  );
}
export function useNotifications() {
  return useSWR<NotificationItem[]>("notifications", () => api.listNotifications());
}

// ----- staff hooks -----
export function useStaff() {
  return useSWR<StaffMember[]>("admin/staff", () => api.listStaff());
}
export function useVerificationCases() {
  return useSWR<VerificationCase[]>("verification/cases", () => api.listVerificationCases());
}
export function useBatches() {
  return useSWR<Batch[]>("batches", () => api.listBatches());
}
export function useSessions(batchId: string | undefined) {
  return useSWR<ClassSession[]>(batchId ? ["sessions", batchId] : null, () => (batchId ? api.listSessions(batchId) : Promise.resolve([])));
}
export function useSessionAttendance(sessionId: string | undefined) {
  return useSWR<AttendanceRow[]>(sessionId ? ["attendance", sessionId] : null, () => (sessionId ? api.listSessionAttendance(sessionId) : Promise.resolve([])));
}
export function useBatchEnrolments(batchId: string | undefined) {
  return useSWR<Enrolment[]>(batchId ? ["roster", batchId] : null, () => (batchId ? api.listBatchEnrolments(batchId) : Promise.resolve([])));
}
export function useAttendanceSummary(batchId: string | undefined) {
  return useSWR(batchId ? ["att-summary", batchId] : null, () => (batchId ? api.attendanceSummary(batchId) : Promise.resolve([])));
}
export function useCounselling() {
  return useSWR<CounsellingAppointment[]>("counselling/appointments", () => api.listCounselling());
}
export function useHostelRequests() {
  return useSWR<HostelRequest[]>("hostel/requests", () => api.listHostelRequests());
}
export function useHostelBeds() {
  return useSWR<HostelBed[]>("hostel/beds", () => api.listHostelBeds());
}
export function useCertificates() {
  return useSWR<Certificate[]>("certificates", () => api.listCertificates());
}
export function useEnrolments() {
  return useSWR<Enrolment[]>("enrolments", () => api.listEnrolments());
}
export function useOpportunities() {
  return useSWR<PlacementOpportunity[]>("placement/opportunities", () => api.listOpportunities());
}
export function useReferrals() {
  return useSWR<PlacementReferral[]>("placement/referrals", () => api.listReferrals());
}
export function useDecisions(applicationId: string | undefined) {
  return useSWR(applicationId ? ["decisions", applicationId] : null, () => (applicationId ? api.listDecisions(applicationId) : Promise.resolve([])));
}
export function useWaitlist(batchId: string | undefined) {
  return useSWR(batchId ? ["waitlist", batchId] : null, () => (batchId ? api.listWaitlist(batchId) : Promise.resolve([])));
}
export function useReports() {
  return useSWR("reports/all", async () => {
    const [verification, counselling, hostel, certificates, placement] = await Promise.all([
      api.reportVerification(), api.reportCounselling(), api.reportHostelOccupancy(), api.reportCertificates(), api.reportPlacement(),
    ]);
    return { verification, counselling, hostel, certificates, placement };
  });
}

// Refresh helpers after mutations.
export const refresh = {
  applications: () => globalMutate("applications"),
  application: (id: string) => globalMutate(["application", id]),
  documents: (id: string) => globalMutate(["docs", id]),
  notifications: () => globalMutate("notifications"),
  verificationCases: () => globalMutate("verification/cases"),
  sessions: (batchId: string) => globalMutate(["sessions", batchId]),
  attendance: (sessionId: string) => globalMutate(["attendance", sessionId]),
  attendanceSummary: (batchId: string) => globalMutate(["att-summary", batchId]),
  counselling: () => globalMutate("counselling/appointments"),
  decisions: (id: string) => globalMutate(["decisions", id]),
  waitlist: (batchId: string) => globalMutate(["waitlist", batchId]),
  hostelRequests: () => globalMutate("hostel/requests"),
  hostelBeds: () => globalMutate("hostel/beds"),
  certificates: () => globalMutate("certificates"),
  referrals: () => globalMutate("placement/referrals"),
};
