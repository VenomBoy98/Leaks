"use client";
// Verification Queue — the full centre-scoped verification workflow against the real backend.
// Triage lists RLS-scoped cases; a centre admin assigns/reassigns a checker; the assigned
// checker opens a case, reviews CLEAN document versions (storage paths never exposed), and
// records ACCEPT / REJECT / correction decisions. Every button calls a real authorized op and
// surfaces backend conflict/authorization errors instead of faking UI state.
import { useEffect, useMemo, useState } from "react";
import Shell from "@/components/staff/Shell";
import { ActionButton, Modal, Table, messageOf } from "@/components/staff/ui";
import { Loading, EmptyState, ErrorState, StatusPill, Field } from "@/components/ui/States";
import { useVerificationCases, useStaff, refresh } from "@/lib/hooks";
import { api, documentViewUrl, type ApplicantDocument, type VerificationCase } from "@/lib/api";

export default function VerificationQueue() {
  const { data: cases, isLoading, error, mutate } = useVerificationCases();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openCase, setOpenCase] = useState<VerificationCase | null>(null);

  const filtered = useMemo(() => {
    let rows = cases ?? [];
    if (statusFilter) rows = rows.filter((c) => c.status === statusFilter);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      rows = rows.filter((c) => c.application_id.toLowerCase().includes(s) || c.id.toLowerCase().includes(s));
    }
    return rows;
  }, [cases, q, statusFilter]);

  const statuses = useMemo(() => Array.from(new Set((cases ?? []).map((c) => c.status))).sort(), [cases]);

  return (
    <Shell title="Verification Queue" subtitle="Triage, assign and review document verification">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Search application / case id">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. 8220b1eb"
            className="w-64 rounded-lg border border-outline/40 bg-surface px-3 py-2 font-body-md" />
        </Field>
        <Field label="Status">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-outline/40 bg-surface px-3 py-2 font-body-md">
            <option value="">All</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <button onClick={() => mutate()} className="rounded-lg border border-outline/40 px-3 py-2 font-label-md text-on-surface hover:bg-surface-container-high">
          Refresh
        </button>
      </div>

      {isLoading ? (
        <Loading label="Loading verification cases…" />
      ) : error ? (
        <ErrorState message="Could not load the queue." onRetry={() => mutate()} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="fact_check" title="No cases" hint="No verification cases match your filters for this centre." />
      ) : (
        <Table head={["Case", "Application", "Status", "Updated", "Actions"]}>
          {filtered.map((c) => (
            <tr key={c.id} className="border-b border-outline/10 last:border-0 align-top">
              <td className="px-4 py-3 font-body-md">{c.id.slice(0, 8)}</td>
              <td className="px-4 py-3 font-body-md text-on-surface-variant">{c.application_id.slice(0, 8)}</td>
              <td className="px-4 py-3"><StatusPill status={c.status} /></td>
              <td className="px-4 py-3 font-caption text-on-surface-variant">{c.updated_at ? new Date(c.updated_at).toLocaleDateString() : "—"}</td>
              <td className="px-4 py-3">
                <button onClick={() => setOpenCase(c)} className="rounded-lg bg-primary px-3 py-1.5 font-label-md text-on-primary hover:bg-primary-container">
                  Open
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {openCase && (
        <CaseDrawer vcase={openCase} onClose={() => setOpenCase(null)} onChanged={() => { mutate(); refresh.verificationCases(); }} />
      )}
    </Shell>
  );
}

function CaseDrawer({ vcase, onClose, onChanged }: { vcase: VerificationCase; onClose: () => void; onChanged: () => void }) {
  const { data: staff } = useStaff();
  const checkers = (staff ?? []).filter((s) => /checker|counsellor|centre_admin/i.test(s.role_code));
  const [checker, setChecker] = useState("");
  const [reason, setReason] = useState("");

  return (
    <Modal title={`Case ${vcase.id.slice(0, 8)} · ${vcase.status}`} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div className="rounded-lg bg-surface-container-high/40 p-3 font-caption text-on-surface-variant">
          Application <span className="font-mono">{vcase.application_id.slice(0, 12)}</span> · Status <StatusPill status={vcase.status} />
        </div>

        {/* Assign / reassign (centre admin). Reassignment requires a reason. */}
        <section className="flex flex-col gap-2">
          <h3 className="font-label-md uppercase tracking-wider text-on-surface-variant">Assignment</h3>
          <Field label="Checker (role · id)">
            <select value={checker} onChange={(e) => setChecker(e.target.value)}
              className="rounded-lg border border-outline/40 bg-surface px-3 py-2 font-body-md">
              <option value="">Select a staff member…</option>
              {checkers.map((s) => <option key={s.profile_id} value={s.profile_id}>{s.role_code} · {s.profile_id.slice(0, 8)}</option>)}
            </select>
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            <ActionButton variant="primary" disabled={!checker} onRun={() => api.assignChecker(vcase.id, checker)} onDone={onChanged}>
              Assign
            </ActionButton>
            <Field label="Reassignment reason">
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Required to reassign"
                className="w-56 rounded-lg border border-outline/40 bg-surface px-3 py-2 font-body-md" />
            </Field>
            <ActionButton variant="secondary" disabled={!checker || reason.trim().length < 3}
              onRun={() => api.reassignChecker(vcase.id, checker)} onDone={onChanged}>
              Reassign
            </ActionButton>
          </div>
        </section>

        {/* Documents — decide only genuinely CLEAN versions. */}
        <DocumentsPanel applicationId={vcase.application_id} caseId={vcase.id} onChanged={onChanged} />

        {/* Fail the case (requires a reason). */}
        <section className="flex items-end gap-3 border-t border-outline/15 pt-4">
          <Field label="Fail reason">
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Required"
              className="w-56 rounded-lg border border-outline/40 bg-surface px-3 py-2 font-body-md" />
          </Field>
          <ActionButton variant="danger" disabled={reason.trim().length < 3}
            confirm="Fail this verification case?" onRun={() => api.failVerification(vcase.id, reason)} onDone={onChanged}>
            Fail case
          </ActionButton>
        </section>
      </div>
    </Modal>
  );
}

function DocumentsPanel({ applicationId, caseId, onChanged }: { applicationId: string; caseId: string; onChanged: () => void }) {
  const [docs, setDocs] = useState<ApplicantDocument[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [viewErr, setViewErr] = useState<string | null>(null);
  const [remark, setRemark] = useState<Record<string, string>>({});

  const load = async () => {
    setErr(null);
    try { setDocs(await api.listDocuments(applicationId)); }
    catch (e) { setErr(messageOf(e)); }
  };
  // Load once when the panel mounts (not during render).
  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [applicationId]);

  const viewDoc = async (d: ApplicantDocument) => {
    setViewErr(null);
    try {
      const url = await documentViewUrl({ versionId: d.version_id!, application_id: applicationId, document_type: d.document_type_code });
      window.open(url, "_blank", "noopener");
    } catch (e) { setViewErr(messageOf(e)); }
  };

  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-label-md uppercase tracking-wider text-on-surface-variant">Documents</h3>
      {err && <ErrorState message={err} onRetry={load} />}
      {viewErr && <p className="font-caption text-error" role="alert">{viewErr}</p>}
      {docs === null ? (
        <Loading label="Loading documents…" />
      ) : docs.length === 0 ? (
        <EmptyState icon="description" title="No documents" />
      ) : (
        <div className="flex flex-col gap-3">
          {docs.map((d) => {
            const clean = d.scan_status === "CLEAN";
            return (
              <div key={d.id} className="rounded-lg border border-outline/15 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-label-md text-on-surface">{d.document_type_code} <span className="text-on-surface-variant">v{d.version_no}</span></p>
                    <StatusPill status={d.scan_status} />
                  </div>
                  {/* Only genuinely CLEAN versions can be viewed (signed URL). */}
                  <button onClick={() => clean && viewDoc(d)} disabled={!clean || !d.version_id}
                    className="rounded-lg border border-outline/40 px-3 py-1.5 font-label-md text-on-surface disabled:opacity-40 hover:bg-surface-container-high">
                    {clean ? "View" : "Not viewable"}
                  </button>
                </div>
                {clean && d.version_id && (
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <Field label="Remark (required to reject / request correction)">
                      <input value={remark[d.version_id] ?? ""} onChange={(e) => setRemark((r) => ({ ...r, [d.version_id!]: e.target.value }))}
                        className="w-64 rounded-lg border border-outline/40 bg-surface px-3 py-1.5 font-body-md" />
                    </Field>
                    <ActionButton variant="primary" onRun={() => api.decideDocument(caseId, { document_version_id: d.version_id!, decision: "ACCEPT" })} onDone={onChanged}>
                      Accept
                    </ActionButton>
                    <ActionButton variant="danger" disabled={(remark[d.version_id] ?? "").trim().length < 3}
                      onRun={() => api.decideDocument(caseId, { document_version_id: d.version_id!, decision: "REJECT", reason: remark[d.version_id!] })} onDone={onChanged}>
                      Reject
                    </ActionButton>
                    <ActionButton variant="secondary" disabled={(remark[d.version_id] ?? "").trim().length < 3}
                      onRun={() => api.requestCorrection(caseId, { document_version_id: d.version_id!, reason: remark[d.version_id!] })} onDone={onChanged}>
                      Request correction
                    </ActionButton>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
