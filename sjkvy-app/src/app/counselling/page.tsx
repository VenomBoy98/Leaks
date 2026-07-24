"use client";
// Counselling management — the counsellor/centre-admin appointment queue (RLS-scoped) with the
// real state machine: schedule (needs a VERIFIED application), reschedule within limits, mark
// no-show, and record an outcome recommendation. Invalid transitions surface as backend errors.
import { useState } from "react";
import Shell from "@/components/staff/Shell";
import { ActionButton, Modal, Table } from "@/components/staff/ui";
import { Loading, EmptyState, ErrorState, StatusPill, Field } from "@/components/ui/States";
import { useCounselling, refresh } from "@/lib/hooks";
import { api, type CounsellingAppointment } from "@/lib/api";

export default function Counselling() {
  const { data, isLoading, error, mutate } = useCounselling();
  const [scheduling, setScheduling] = useState(false);
  const [outcomeFor, setOutcomeFor] = useState<CounsellingAppointment | null>(null);
  const refetch = () => { mutate(); refresh.counselling(); };

  return (
    <Shell title="Counselling" subtitle="Appointment queue and outcomes">
      <div className="mb-4 flex justify-end">
        <button onClick={() => setScheduling(true)} className="rounded-lg bg-primary px-4 py-2 font-label-md text-on-primary hover:bg-primary-container">
          Schedule appointment
        </button>
      </div>

      {isLoading ? (
        <Loading label="Loading appointments…" />
      ) : error ? (
        <ErrorState message="Could not load the counselling queue." onRetry={() => mutate()} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState icon="forum" title="No appointments" hint="Schedule a counselling appointment for a verified application." />
      ) : (
        <Table head={["Application", "Scheduled", "Attempt", "Status", "Actions"]}>
          {(data ?? []).map((a) => (
            <tr key={a.id} className="border-b border-outline/10 last:border-0 align-top">
              <td className="px-4 py-3 font-body-md text-on-surface-variant">{a.application_id.slice(0, 8)}</td>
              <td className="px-4 py-3 font-body-md">{a.scheduled_at ? new Date(a.scheduled_at).toLocaleString() : "—"}</td>
              <td className="px-4 py-3 font-body-md">{a.attempt_no ?? 1}</td>
              <td className="px-4 py-3"><StatusPill status={a.status} /></td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <RescheduleButton appt={a} onDone={refetch} />
                  <ActionButton variant="ghost" confirm="Mark this appointment as no-show?"
                    onRun={() => api.counsellingNoShow(a.id)} onDone={refetch}>No-show</ActionButton>
                  <button onClick={() => setOutcomeFor(a)} className="rounded-lg bg-secondary-container px-3 py-1.5 font-label-md text-on-secondary-container hover:opacity-90">
                    Outcome
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {scheduling && <ScheduleModal onClose={() => setScheduling(false)} onDone={() => { setScheduling(false); refetch(); }} />}
      {outcomeFor && <OutcomeModal appt={outcomeFor} onClose={() => setOutcomeFor(null)} onDone={() => { setOutcomeFor(null); refetch(); }} />}
    </Shell>
  );
}

function RescheduleButton({ appt, onDone }: { appt: CounsellingAppointment; onDone: () => void }) {
  const [when, setWhen] = useState("");
  const [open, setOpen] = useState(false);
  if (!open) return <button onClick={() => setOpen(true)} className="rounded-lg border border-outline/40 px-3 py-1.5 font-label-md hover:bg-surface-container-high">Reschedule</button>;
  return (
    <span className="inline-flex items-center gap-2">
      <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)}
        className="rounded-lg border border-outline/40 bg-surface px-2 py-1 font-caption" />
      <ActionButton variant="primary" disabled={!when}
        onRun={() => api.rescheduleCounselling(appt.id, new Date(when).toISOString())} onDone={onDone}>Save</ActionButton>
    </span>
  );
}

function ScheduleModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [appId, setAppId] = useState("");
  const [when, setWhen] = useState("");
  return (
    <Modal title="Schedule counselling" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Field label="Application ID (must be VERIFIED)">
          <input value={appId} onChange={(e) => setAppId(e.target.value)} placeholder="uuid"
            className="rounded-lg border border-outline/40 bg-surface px-3 py-2 font-body-md" />
        </Field>
        <Field label="When">
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)}
            className="rounded-lg border border-outline/40 bg-surface px-3 py-2 font-body-md" />
        </Field>
        <ActionButton variant="primary" disabled={!/^[0-9a-fA-F-]{36}$/.test(appId) || !when}
          onRun={() => api.scheduleCounselling(appId, new Date(when).toISOString())} onDone={onDone}>
          Schedule
        </ActionButton>
      </div>
    </Modal>
  );
}

function OutcomeModal({ appt, onClose, onDone }: { appt: CounsellingAppointment; onClose: () => void; onDone: () => void }) {
  const [rec, setRec] = useState<"APPROVE" | "REJECT" | "WAITLIST">("APPROVE");
  const [notes, setNotes] = useState("");
  const needsNotes = rec !== "APPROVE";
  return (
    <Modal title={`Outcome · ${appt.application_id.slice(0, 8)}`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Field label="Recommendation">
          <select value={rec} onChange={(e) => setRec(e.target.value as typeof rec)}
            className="rounded-lg border border-outline/40 bg-surface px-3 py-2 font-body-md">
            <option value="APPROVE">Approve</option>
            <option value="WAITLIST">Waitlist</option>
            <option value="REJECT">Reject</option>
          </select>
        </Field>
        <Field label={`Notes${needsNotes ? " (required)" : ""}`}>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
            className="rounded-lg border border-outline/40 bg-surface px-3 py-2 font-body-md" />
        </Field>
        <ActionButton variant="primary" disabled={needsNotes && notes.trim().length < 3}
          onRun={() => api.counsellingOutcome(appt.id, { recommendation: rec, notes: notes || undefined })} onDone={onDone}>
          Record outcome
        </ActionButton>
      </div>
    </Modal>
  );
}
