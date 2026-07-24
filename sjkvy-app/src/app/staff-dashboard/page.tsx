"use client";
// Staff dashboard — a real, centre-scoped overview composed from live backend reads. Counts
// come straight from the RLS-scoped list endpoints (no mock data); each card links to the
// screen that acts on it. The "needs attention" panel surfaces open verification cases.
import Shell from "@/components/staff/Shell";
import { StatCard, Table } from "@/components/staff/ui";
import { Loading, ErrorState, EmptyState, StatusPill } from "@/components/ui/States";
import { useVerificationCases, useCounselling, useHostelRequests, useCertificates, useReferrals, useBatches } from "@/lib/hooks";

// "Open" = any verification case that is not in a terminal state.
const TERMINAL_CASE = /^(VERIFIED|FAILED|CLOSED|WITHDRAWN|REJECTED)$/i;

export default function StaffDashboard() {
  const cases = useVerificationCases();
  const counselling = useCounselling();
  const hostel = useHostelRequests();
  const certs = useCertificates();
  const referrals = useReferrals();
  const batches = useBatches();

  const openCases = (cases.data ?? []).filter((c) => !TERMINAL_CASE.test(c.status));
  const pendingHostel = (hostel.data ?? []).filter((h) => /REQUESTED|QUEUED|APPROVED/i.test(h.status));

  return (
    <Shell title="Dashboard" subtitle="Centre operations at a glance">
      {cases.isLoading ? (
        <Loading label="Loading centre summary…" />
      ) : cases.error ? (
        <ErrorState message="Could not load the dashboard." onRetry={() => cases.mutate()} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Open verification cases" value={openCases.length} icon="fact_check" href="/verification" />
            <StatCard label="Counselling appointments" value={(counselling.data ?? []).length} icon="forum" href="/counselling" />
            <StatCard label="Active batches" value={(batches.data ?? []).length} icon="groups" href="/staff-attendance" />
            <StatCard label="Hostel requests pending" value={pendingHostel.length} icon="night_shelter" href="/staff-hostel" />
            <StatCard label="Certificates issued" value={(certs.data ?? []).length} icon="workspace_premium" href="/staff-certificates" />
            <StatCard label="Placement referrals" value={(referrals.data ?? []).length} icon="work" href="/staff-placement" />
          </div>

          <section className="mt-8">
            <h2 className="mb-3 font-display-md text-title-lg text-primary">Needs attention — verification queue</h2>
            {openCases.length === 0 ? (
              <EmptyState icon="task_alt" title="Nothing waiting" hint="No open verification cases for your centre right now." />
            ) : (
              <Table head={["Case", "Application", "Status", ""]}>
                {openCases.slice(0, 8).map((c) => (
                  <tr key={c.id} className="border-b border-outline/10 last:border-0">
                    <td className="px-4 py-3 font-body-md">{c.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-body-md text-on-surface-variant">{c.application_id.slice(0, 8)}</td>
                    <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                    <td className="px-4 py-3 text-right"><a href="/verification" className="font-label-md text-primary hover:underline">Open →</a></td>
                  </tr>
                ))}
              </Table>
            )}
          </section>
        </>
      )}
    </Shell>
  );
}
