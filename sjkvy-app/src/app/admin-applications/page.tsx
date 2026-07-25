"use client";
// Admin applications — centre-wide monitoring of every application (RLS-scoped to the admin's
// centre). Search, status filter and pagination over real data; each row links into the
// admissions workflow. No hardcoded rows; the list is the backend's, scoped by PostgreSQL.
import { useMemo, useState } from "react";
import Shell from "@/components/admin/Shell";
import { Table } from "@/components/staff/ui";
import { Loading, EmptyState, ErrorState, StatusPill, Field } from "@/components/ui/States";
import { useApplications } from "@/lib/hooks";

const PAGE_SIZE = 20;

export default function AdminApplications() {
  const { data, isLoading, error, mutate } = useApplications();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);

  const statuses = useMemo(() => Array.from(new Set((data ?? []).map((a) => a.status))).sort(), [data]);
  const filtered = useMemo(() => {
    let rows = data ?? [];
    if (statusFilter) rows = rows.filter((a) => a.status === statusFilter);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      rows = rows.filter((a) => a.id.toLowerCase().includes(s) || a.applicant_id.toLowerCase().includes(s));
    }
    return rows;
  }, [data, q, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (page > 0 && page >= pageCount) setPage(0);
  const rows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <Shell title="Applications" subtitle="All applications for your centre">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Search application / applicant id">
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="e.g. bfd4c800"
            className="w-64 rounded-lg border border-outline/40 bg-surface px-3 py-2 font-body-md" />
        </Field>
        <Field label="Status">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="rounded-lg border border-outline/40 bg-surface px-3 py-2 font-body-md">
            <option value="">All</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <button onClick={() => mutate()} className="rounded-lg border border-outline/40 px-3 py-2 font-label-md text-on-surface hover:bg-surface-container-high">Refresh</button>
      </div>

      {isLoading ? (
        <Loading label="Loading applications…" />
      ) : error ? (
        <ErrorState message="Could not load applications." onRetry={() => mutate()} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="assignment" title="No applications" hint="No applications match your filters for this centre." />
      ) : (
        <>
          <Table head={["Application", "Applicant", "Status", "Eligible", "Submitted", ""]}>
            {rows.map((a) => (
              <tr key={a.id} className="border-b border-outline/10 last:border-0">
                <td className="px-4 py-3 font-body-md">{a.id.slice(0, 8)}</td>
                <td className="px-4 py-3 font-body-md text-on-surface-variant">{a.applicant_id.slice(0, 8)}</td>
                <td className="px-4 py-3"><StatusPill status={a.status} /></td>
                <td className="px-4 py-3 font-caption text-on-surface-variant">{a.eligibility_flag == null ? "—" : a.eligibility_flag ? "Yes" : "No"}</td>
                <td className="px-4 py-3 font-caption text-on-surface-variant">{a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3 text-right">
                  {(a.status === "SUBMITTED" || a.status === "IN_PROCESS") && (
                    <a href="/admin-admissions" className="font-label-md text-primary hover:underline">Decide →</a>
                  )}
                </td>
              </tr>
            ))}
          </Table>
          <div className="mt-3 flex items-center justify-between font-caption text-on-surface-variant">
            <span>{filtered.length} application{filtered.length === 1 ? "" : "s"} · page {page + 1} of {pageCount}</span>
            <span className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="rounded-lg border border-outline/40 px-3 py-1.5 font-label-md disabled:opacity-40">Prev</button>
              <button disabled={page + 1 >= pageCount} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-outline/40 px-3 py-1.5 font-label-md disabled:opacity-40">Next</button>
            </span>
          </div>
        </>
      )}
    </Shell>
  );
}
