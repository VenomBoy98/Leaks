"use client";
// Hostel oversight — request queue + bed inventory from RLS-scoped backend reads. Approve a
// request, then allocate a specific AVAILABLE bed (the backend allocation is transactional and
// concurrency-safe; the browser is never the source of truth for availability). Beds can be
// toggled AVAILABLE/MAINTENANCE. All scoped to the hostel manager / centre admin's centre.
import { useMemo, useState } from "react";
import Shell from "@/components/staff/Shell";
import { ActionButton, Modal, Table } from "@/components/staff/ui";
import { Loading, EmptyState, ErrorState, StatusPill } from "@/components/ui/States";
import { useHostelRequests, useHostelBeds, useHostelAllocations, refresh } from "@/lib/hooks";
import { api, type HostelRequest } from "@/lib/api";

export default function Hostel() {
  const reqs = useHostelRequests();
  const beds = useHostelBeds();
  const allocs = useHostelAllocations();
  const [allocFor, setAllocFor] = useState<HostelRequest | null>(null);
  const [reason, setReason] = useState<Record<string, string>>({});
  const available = useMemo(() => (beds.data ?? []).filter((b) => /AVAILABLE/i.test(b.status)), [beds.data]);
  const refetch = () => { reqs.mutate(); beds.mutate(); allocs.mutate(); refresh.hostelRequests(); refresh.hostelBeds(); refresh.hostelAllocations(); };

  return (
    <Shell title="Hostel" subtitle="Requests and bed allocation">
      <section className="mb-8">
        <h2 className="mb-3 font-display-md text-title-lg text-primary">Requests</h2>
        {reqs.isLoading ? <Loading label="Loading requests…" /> : reqs.error ? (
          <ErrorState message="Could not load hostel requests." onRetry={() => reqs.mutate()} />
        ) : (reqs.data ?? []).length === 0 ? (
          <EmptyState icon="night_shelter" title="No requests" hint="No hostel requests for your centre." />
        ) : (
          <Table head={["Request", "Enrolment", "Status", "Actions"]}>
            {(reqs.data ?? []).map((r) => (
              <tr key={r.id} className="border-b border-outline/10 last:border-0">
                <td className="px-4 py-3 font-body-md">{r.id.slice(0, 8)}</td>
                <td className="px-4 py-3 font-body-md text-on-surface-variant">{r.enrolment_id.slice(0, 8)}</td>
                <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {/^REQUESTED$/i.test(r.status) && (
                      <ActionButton variant="secondary" onRun={() => api.approveHostelRequest(r.id)} onDone={refetch}>Approve</ActionButton>
                    )}
                    {/^(APPROVED|QUEUED)$/i.test(r.status) && (
                      <button onClick={() => setAllocFor(r)} className="rounded-lg bg-primary px-3 py-1.5 font-label-md text-on-primary hover:bg-primary-container">Allocate bed</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display-md text-title-lg text-primary">Bed inventory</h2>
        {beds.isLoading ? <Loading label="Loading beds…" /> : beds.error ? (
          <ErrorState message="Could not load beds." onRetry={() => beds.mutate()} />
        ) : (beds.data ?? []).length === 0 ? (
          <EmptyState icon="bed" title="No beds" hint="No hostel beds configured for your centre." />
        ) : (
          <Table head={["Block", "Room", "Bed", "Status", "Actions"]}>
            {(beds.data ?? []).map((b) => (
              <tr key={b.id} className="border-b border-outline/10 last:border-0">
                <td className="px-4 py-3 font-body-md">{b.block_name ?? "—"}</td>
                <td className="px-4 py-3 font-body-md">{b.room_no ?? "—"}</td>
                <td className="px-4 py-3 font-body-md">{b.bed_no}</td>
                <td className="px-4 py-3"><StatusPill status={b.status} /></td>
                <td className="px-4 py-3">
                  {/^AVAILABLE$/i.test(b.status) ? (
                    <ActionButton variant="ghost" onRun={() => api.setBedStatus(b.id, "MAINTENANCE")} onDone={refetch}>Set maintenance</ActionButton>
                  ) : /^MAINTENANCE$/i.test(b.status) ? (
                    <ActionButton variant="ghost" onRun={() => api.setBedStatus(b.id, "AVAILABLE")} onDone={refetch}>Set available</ActionButton>
                  ) : <span className="font-caption text-on-surface-variant">occupied</span>}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-display-md text-title-lg text-primary">Current residents</h2>
        {allocs.isLoading ? <Loading label="Loading allocations…" /> : allocs.error ? (
          <ErrorState message="Could not load allocations." onRetry={() => allocs.mutate()} />
        ) : (allocs.data ?? []).length === 0 ? (
          <EmptyState icon="hotel" title="No active allocations" hint="No residents are currently allocated a bed." />
        ) : (
          <Table head={["Block", "Room", "Bed", "Enrolment", "Since", "Discharge"]}>
            {(allocs.data ?? []).map((a) => (
              <tr key={a.id} className="border-b border-outline/10 last:border-0 align-top">
                <td className="px-4 py-3 font-body-md">{a.block_name ?? "—"}</td>
                <td className="px-4 py-3 font-body-md">{a.room_no ?? "—"}</td>
                <td className="px-4 py-3 font-body-md">{a.bed_no ?? "—"}</td>
                <td className="px-4 py-3 font-body-md text-on-surface-variant">{a.enrolment_id.slice(0, 8)}</td>
                <td className="px-4 py-3 font-caption text-on-surface-variant">{a.allocated_at ? new Date(a.allocated_at).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-end gap-2">
                    <input value={reason[a.id] ?? ""} onChange={(e) => setReason((r) => ({ ...r, [a.id]: e.target.value }))} placeholder="Reason"
                      className="w-40 rounded-lg border border-outline/40 bg-surface px-2 py-1 font-caption" />
                    <ActionButton variant="danger" disabled={(reason[a.id] ?? "").trim().length < 3}
                      confirm="Discharge this resident and free the bed?"
                      onRun={() => api.dischargeAllocation(a.id, reason[a.id])} onDone={refetch}>Discharge</ActionButton>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </section>

      {allocFor && (
        <Modal title={`Allocate a bed · request ${allocFor.id.slice(0, 8)}`} onClose={() => setAllocFor(null)}>
          {available.length === 0 ? (
            <EmptyState icon="bed" title="No available beds" hint="Free a bed or clear maintenance first." />
          ) : (
            <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
              {available.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-outline/15 px-3 py-2">
                  <span className="font-body-md">{b.block_name} · Room {b.room_no} · Bed {b.bed_no}</span>
                  <ActionButton variant="primary" confirm="Allocate this bed to the request?"
                    onRun={() => api.allocateHostelBed(allocFor.id, b.id)} onDone={() => { setAllocFor(null); refetch(); }}>Allocate</ActionButton>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </Shell>
  );
}
