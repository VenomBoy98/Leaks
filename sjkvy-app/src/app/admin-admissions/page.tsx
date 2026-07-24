"use client";
// Admin admissions — the two-step approval workflow. Verified applications (submitted, past
// staff verification + counselling) await a centre-admin decision: APPROVE into a batch (seat-safe
// offer, else waitlist), REJECT with a reason, or WAITLIST. The seat guarantee and idempotency
// live in the DB (fn_admission_finalize); this screen surfaces conflicts rather than faking state.
// A per-batch waitlist view can promote the top entry when a seat frees.
import { useMemo, useState } from "react";
import Shell from "@/components/admin/Shell";
import { ActionButton, Modal, Table } from "@/components/staff/ui";
import { Loading, EmptyState, ErrorState, StatusPill, Field } from "@/components/ui/States";
import { useApplications, useBatches, useWaitlist, refresh } from "@/lib/hooks";
import { api, type Application } from "@/lib/api";

export default function AdminAdmissions() {
  const apps = useApplications();
  const batches = useBatches();
  const [deciding, setDeciding] = useState<Application | null>(null);
  const [waitlistBatch, setWaitlistBatch] = useState<string>("");

  const awaiting = useMemo(() => (apps.data ?? []).filter((a) => a.status === "SUBMITTED" || a.status === "IN_PROCESS"), [apps.data]);
  const decided = useMemo(() => (apps.data ?? []).filter((a) => a.status === "DECIDED"), [apps.data]);

  return (
    <Shell title="Admissions" subtitle="Decide verified applications; manage the waitlist">
      <section className="mb-8">
        <h2 className="mb-3 font-display-md text-title-lg text-primary">Awaiting decision</h2>
        {apps.isLoading ? <Loading label="Loading applications…" /> : apps.error ? (
          <ErrorState message="Could not load applications." onRetry={() => apps.mutate()} />
        ) : awaiting.length === 0 ? (
          <EmptyState icon="how_to_reg" title="Nothing to decide" hint="No verified applications are awaiting an admission decision." />
        ) : (
          <Table head={["Application", "District", "Status", "Decision"]}>
            {awaiting.map((a) => (
              <tr key={a.id} className="border-b border-outline/10 last:border-0">
                <td className="px-4 py-3 font-body-md">{a.id.slice(0, 8)}</td>
                <td className="px-4 py-3 font-body-md text-on-surface-variant">{(a as { district?: string }).district ?? "—"}</td>
                <td className="px-4 py-3"><StatusPill status={a.status} /></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setDeciding(a)} className="rounded-lg bg-primary px-3 py-1.5 font-label-md text-on-primary hover:bg-primary-container">Decide</button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-display-md text-title-lg text-primary">Recently decided</h2>
        {decided.length === 0 ? (
          <EmptyState icon="task_alt" title="No decisions yet" />
        ) : (
          <Table head={["Application", "Status"]}>
            {decided.slice(0, 15).map((a) => (
              <tr key={a.id} className="border-b border-outline/10 last:border-0">
                <td className="px-4 py-3 font-body-md">{a.id.slice(0, 8)}</td>
                <td className="px-4 py-3"><StatusPill status={a.status} /></td>
              </tr>
            ))}
          </Table>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display-md text-title-lg text-primary">Waitlist</h2>
        <div className="mb-3">
          <Field label="Batch">
            <select value={waitlistBatch} onChange={(e) => setWaitlistBatch(e.target.value)}
              className="w-72 rounded-lg border border-outline/40 bg-surface px-3 py-2 font-body-md">
              <option value="">Select a batch…</option>
              {(batches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.code ?? b.name ?? b.id.slice(0, 8)}</option>)}
            </select>
          </Field>
        </div>
        {waitlistBatch && <WaitlistPanel batchId={waitlistBatch} />}
      </section>

      {deciding && (
        <DecideModal application={deciding} batches={(batches.data ?? []).map((b) => ({ id: b.id, label: b.code ?? b.name ?? b.id.slice(0, 8) }))}
          onClose={() => setDeciding(null)} onDone={() => { setDeciding(null); apps.mutate(); refresh.applications(); }} />
      )}
    </Shell>
  );
}

function DecideModal({ application, batches, onClose, onDone }: {
  application: Application; batches: Array<{ id: string; label: string }>; onClose: () => void; onDone: () => void;
}) {
  const [decision, setDecision] = useState<"APPROVED" | "WAITLISTED" | "REJECTED">("APPROVED");
  const [batchId, setBatchId] = useState("");
  const [reason, setReason] = useState("");
  const needsBatch = decision === "APPROVED" || decision === "WAITLISTED";
  const needsReason = decision === "REJECTED";
  const ready = (!needsBatch || !!batchId) && (!needsReason || reason.trim().length >= 3);

  return (
    <Modal title={`Decide · ${application.id.slice(0, 8)}`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Field label="Decision">
          <select value={decision} onChange={(e) => setDecision(e.target.value as typeof decision)}
            className="rounded-lg border border-outline/40 bg-surface px-3 py-2 font-body-md">
            <option value="APPROVED">Approve (offer a seat)</option>
            <option value="WAITLISTED">Waitlist</option>
            <option value="REJECTED">Reject</option>
          </select>
        </Field>
        {needsBatch && (
          <Field label="Batch">
            <select value={batchId} onChange={(e) => setBatchId(e.target.value)}
              className="rounded-lg border border-outline/40 bg-surface px-3 py-2 font-body-md">
              <option value="">Select a batch…</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </Field>
        )}
        {needsReason && (
          <Field label="Reason (required)">
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              className="rounded-lg border border-outline/40 bg-surface px-3 py-2 font-body-md" />
          </Field>
        )}
        <ActionButton variant={decision === "REJECTED" ? "danger" : "primary"} disabled={!ready}
          confirm={`Record ${decision} for this application?`}
          onRun={() => api.finalizeAdmission(application.id, { decision, batch_id: needsBatch ? batchId : undefined, reason: reason || undefined })}
          onDone={onDone}>
          Record decision
        </ActionButton>
      </div>
    </Modal>
  );
}

function WaitlistPanel({ batchId }: { batchId: string }) {
  const wl = useWaitlist(batchId);
  return (
    <div>
      <div className="mb-2 flex justify-end">
        <ActionButton variant="secondary" confirm="Promote the top waitlisted application if a seat is free?"
          onRun={() => api.promoteWaitlist(batchId)} onDone={() => { wl.mutate(); refresh.waitlist(batchId); }}>
          Promote next
        </ActionButton>
      </div>
      {wl.isLoading ? <Loading label="Loading waitlist…" /> : wl.error ? (
        <ErrorState message="Could not load the waitlist." onRetry={() => wl.mutate()} />
      ) : (wl.data ?? []).length === 0 ? (
        <EmptyState icon="format_list_numbered" title="Empty waitlist" hint="No active waitlist entries for this batch." />
      ) : (
        <Table head={["Rank", "Application", "Status"]}>
          {(wl.data ?? []).map((w) => (
            <tr key={w.id} className="border-b border-outline/10 last:border-0">
              <td className="px-4 py-3 font-body-md">{w.rank ?? "—"}</td>
              <td className="px-4 py-3 font-body-md">{w.application_id.slice(0, 8)}</td>
              <td className="px-4 py-3"><StatusPill status={w.status} /></td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
