"use client";
// Data hooks (SWR) over the typed api layer. Every hook exposes real loading / empty / error
// state; mutations call `mutate` so other views refresh. No mock data.
import useSWR, { mutate as globalMutate } from "swr";
import { api, type Application, type PublicCentre, type ApplicantDocument, type NotificationItem, type Profile, type PublicCourse } from "@/lib/api";

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

// Refresh helpers after mutations.
export const refresh = {
  applications: () => globalMutate("applications"),
  application: (id: string) => globalMutate(["application", id]),
  documents: (id: string) => globalMutate(["docs", id]),
  notifications: () => globalMutate("notifications"),
};
