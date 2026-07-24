"use client";
// Attendance management — real batch → session → roster flow. Batches, sessions and the roster
// all come from RLS-scoped backend reads. Marks are written per enrolment through the granted
// upsert; locking is a backend function. The browser never invents rosters or marks.
import { useMemo, useState } from "react";
import Shell from "@/components/staff/Shell";
import { ActionButton, Modal, Table } from "@/components/staff/ui";
import { Loading, EmptyState, ErrorState, StatusPill, Field } from "@/components/ui/States";
import { useBatches, useSessions, useSessionAttendance, useBatchEnrolments, refresh } from "@/lib/hooks";
import { api, type ClassSession } from "@/lib/api";

export default function Attendance() {
  const { data: batches, isLoading: bl, error: be } = useBatches();
  const [batchId, setBatchId] = useState<string>("");
  const [session, setSession] = useState<ClassSession | null>(null);
  const [creating, setCreating] = useState(false);
  const sessions = useSessions(batchId || undefined);

  return (
    <Shell title="Attendance" subtitle="Mark and lock class attendance">
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <Field label="Batch">
          {bl ? <Loading label="…" /> : be ? <span className="text-error">Failed to load batches</span> : (
            <select value={batchId} onChange={(e) => { setBatchId(e.target.value); setSession(null); }}
              className="w-72 rounded-lg border border-outline/40 bg-surface px-3 py-2 font-body-md">
              <option value="">Select a batch…</option>
              {(batches ?? []).map((b) => <option key={b.id} value={b.id}>{b.code ?? b.name ?? b.id.slice(0, 8)}</option>)}
            </select>
          )}
        </Field>
        {batchId && <button onClick={() => setCreating(true)} className="rounded-lg bg-primary px-4 py-2 font-label-md text-on-primary hover:bg-primary-container">New session</button>}
      </div>

      {!batchId ? (
        <EmptyState icon="groups" title="Choose a batch" hint="Select a batch to see its sessions and roster." />
      ) : sessions.isLoading ? (
        <Loading label="Loading sessions…" />
      ) : sessions.error ? (
        <ErrorState message="Could not load sessions." onRetry={() => sessions.mutate()} />
      ) : (sessions.data ?? []).length === 0 ? (
        <EmptyState icon="event" title="No sessions" hint="Create a class session to start marking attendance." />
      ) : (
        <Table head={["Date", "Kind", "Topic", "Locked", ""]}>
          {(sessions.data ?? []).map((s) => (
            <tr key={s.id} className="border-b border-outline/10 last:border-0">
              <td className="px-4 py-3 font-body-md">{s.session_date}</td>
              <td className="px-4 py-3"><StatusPill status={s.kind} /></td>
              <td className="px-4 py-3 font-body-md text-on-surface-variant">{s.topic ?? "—"}</td>
              <td className="px-4 py-3">{s.locked_at ? <StatusPill status="CLOSED" /> : <span className="font-caption text-on-surface-variant">open</span>}</td>
              <td className="px-4 py-3 text-right"><button onClick={() => setSession(s)} className="rounded-lg bg-primary px-3 py-1.5 font-label-md text-on-primary">Roster</button></td>
            </tr>
          ))}
        </Table>
      )}

      {creating && <NewSessionModal batchId={batchId} onClose={() => setCreating(false)} onDone={() => { setCreating(false); sessions.mutate(); refresh.sessions(batchId); }} />}
      {session && <RosterModal session={session} batchId={batchId} onClose={() => setSession(null)} onLocked={() => { setSession(null); sessions.mutate(); }} />}
    </Shell>
  );
}

function NewSessionModal({ batchId, onClose, onDone }: { batchId: string; onClose: () => void; onDone: () => void }) {
  const [date, setDate] = useState("");
  const [kind, setKind] = useState<"THEORY" | "PRACTICAL">("THEORY");
  const [topic, setTopic] = useState("");
  return (
    <Modal title="New class session" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Field label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-outline/40 bg-surface px-3 py-2 font-body-md" /></Field>
        <Field label="Kind">
          <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className="rounded-lg border border-outline/40 bg-surface px-3 py-2 font-body-md">
            <option value="THEORY">Theory</option><option value="PRACTICAL">Practical</option>
          </select>
        </Field>
        <Field label="Topic"><input value={topic} onChange={(e) => setTopic(e.target.value)} className="rounded-lg border border-outline/40 bg-surface px-3 py-2 font-body-md" /></Field>
        <ActionButton variant="primary" disabled={!date}
          onRun={() => api.createSession({ batch_id: batchId, session_date: date, kind, topic: topic || undefined })} onDone={onDone}>
          Create session
        </ActionButton>
      </div>
    </Modal>
  );
}

function RosterModal({ session, batchId, onClose, onLocked }: { session: ClassSession; batchId: string; onClose: () => void; onLocked: () => void }) {
  const roster = useBatchEnrolments(batchId);
  const att = useSessionAttendance(session.id);
  const marked = useMemo(() => new Map((att.data ?? []).map((a) => [a.enrolment_id, a.present])), [att.data]);
  const locked = !!session.locked_at;
  const present = (att.data ?? []).filter((a) => a.present).length;

  return (
    <Modal title={`Roster · ${session.session_date}`} onClose={onClose}>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-caption text-on-surface-variant">{present} present of {(att.data ?? []).length} marked{locked ? " · locked" : ""}</p>
        {!locked && (
          <ActionButton variant="danger" confirm="Lock this session? Marks can only be corrected afterwards."
            onRun={() => api.lockSession(session.id)} onDone={onLocked}>Lock session</ActionButton>
        )}
      </div>
      {roster.isLoading ? <Loading label="Loading roster…" /> : roster.error ? <ErrorState message="Could not load roster." onRetry={() => roster.mutate()} /> : (roster.data ?? []).length === 0 ? (
        <EmptyState icon="person_off" title="No enrolments" hint="This batch has no active enrolments." />
      ) : (
        <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
          {(roster.data ?? []).map((e) => {
            const cur = marked.get(e.id);
            return (
              <div key={e.id} className="flex items-center justify-between rounded-lg border border-outline/15 px-3 py-2">
                <span className="font-body-md">{e.student_id.slice(0, 8)} <span className="text-on-surface-variant">· {e.status}</span></span>
                {locked ? (
                  <span className="font-caption">{cur === undefined ? "—" : cur ? "Present" : "Absent"}</span>
                ) : (
                  <span className="flex gap-2">
                    <ActionButton variant={cur === true ? "primary" : "ghost"} onRun={() => api.markAttendance(session.id, { enrolment_id: e.id, present: true })} onDone={() => att.mutate()}>Present</ActionButton>
                    <ActionButton variant={cur === false ? "danger" : "ghost"} onRun={() => api.markAttendance(session.id, { enrolment_id: e.id, present: false })} onDone={() => att.mutate()}>Absent</ActionButton>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
