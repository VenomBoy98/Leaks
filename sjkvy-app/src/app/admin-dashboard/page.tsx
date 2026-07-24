"use client";
// Admin dashboard — real centre KPIs composed from RLS-scoped reads; cards navigate to the
// admin/operations pages. No hardcoded numbers.
import Shell from "@/components/admin/Shell";
import { StatCard } from "@/components/staff/ui";
import { Loading, ErrorState } from "@/components/ui/States";
import { useApplications, useVerificationCases, useEnrolments, useCertificates, useHostelRequests, useReferrals } from "@/lib/hooks";

const TERMINAL_CASE = /^(VERIFIED|FAILED|CLOSED|WITHDRAWN|REJECTED)$/i;

export default function AdminDashboard() {
  const apps = useApplications();
  const cases = useVerificationCases();
  const enrolments = useEnrolments();
  const certs = useCertificates();
  const hostel = useHostelRequests();
  const referrals = useReferrals();

  const awaiting = (apps.data ?? []).filter((a) => a.status === "SUBMITTED" || a.status === "IN_PROCESS").length;
  const openCases = (cases.data ?? []).filter((c) => !TERMINAL_CASE.test(c.status)).length;

  return (
    <Shell title="Dashboard" subtitle="Centre administration overview">
      {apps.isLoading ? (
        <Loading label="Loading centre KPIs…" />
      ) : apps.error ? (
        <ErrorState message="Could not load the dashboard." onRetry={() => apps.mutate()} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Awaiting admission decision" value={awaiting} icon="how_to_reg" href="/admin-admissions" />
          <StatCard label="Open verification cases" value={openCases} icon="fact_check" href="/verification" />
          <StatCard label="Enrolments" value={(enrolments.data ?? []).length} icon="groups" href="/admin-directory" />
          <StatCard label="Certificates issued" value={(certs.data ?? []).length} icon="workspace_premium" href="/admin-certificates" />
          <StatCard label="Hostel requests" value={(hostel.data ?? []).length} icon="night_shelter" href="/admin-hostel" />
          <StatCard label="Placement referrals" value={(referrals.data ?? []).length} icon="work" href="/admin-industry" />
        </div>
      )}
    </Shell>
  );
}
