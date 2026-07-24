"use client";
// Placement management — opportunities and referrals from RLS-scoped backend reads. Placement
// staff refer a consented student to an opportunity, advance a referral's status, and record a
// (non-guaranteed) outcome. Consent/privacy boundaries are enforced by the backend functions.
import { useState } from "react";
import Shell from "@/components/staff/Shell";
import { ActionButton, Modal, Table } from "@/components/staff/ui";
import { Loading, EmptyState, ErrorState, StatusPill, Field } from "@/components/ui/States";
import { useOpportunities, useReferrals, refresh } from "@/lib/hooks";
import { api, type PlacementOpportunity, type PlacementReferral } from "@/lib/api";

const REFERRAL_STATES = ["SHORTLISTED", "INTERVIEW", "OFFERED", "REJECTED", "WITHDRAWN"];

export default function Placement() {
  const opps = useOpportunities();
  const refs = useReferrals();
  const [referTo, setReferTo] = useState<PlacementOpportunity | null>(null);
  const [outcomeFor, setOutcomeFor] = useState<PlacementReferral | null>(null);
  const refetch = () => { refs.mutate(); refresh.referrals(); };

  return (
    <Shell title="Placement" subtitle="Opportunities and student referrals">
      <section className="mb-8">
        <h2 className="mb-3 font-display-md text-title-lg text-primary">Opportunities</h2>
        {opps.isLoading ? <Loading label="Loading opportunities…" /> : opps.error ? (
          <ErrorState message="Could not load opportunities." onRetry={() => opps.mutate()} />
        ) : (opps.data ?? []).length === 0 ? (
          <EmptyState icon="work" title="No opportunities" hint="No placement opportunities for your centre yet." />
        ) : (
          <Table head={["Title", "Openings", "Closes", ""]}>
            {(opps.data ?? []).map((o) => (
              <tr key={o.id} className="border-b border-outline/10 last:border-0">
                <td className="px-4 py-3 font-body-md">{o.title}</td>
                <td className="px-4 py-3 font-body-md">{o.openings ?? "—"}</td>
                <td className="px-4 py-3 font-caption text-on-surface-variant">{o.closes_on ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setReferTo(o)} className="rounded-lg bg-primary px-3 py-1.5 font-label-md text-on-primary hover:bg-primary-container">Refer student</button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display-md text-title-lg text-primary">Referrals</h2>
        {refs.isLoading ? <Loading label="Loading referrals…" /> : refs.error ? (
          <ErrorState message="Could not load referrals." onRetry={() => refs.mutate()} />
        ) : (refs.data ?? []).length === 0 ? (
          <EmptyState icon="group" title="No referrals" hint="Refer a consented student to an opportunity above." />
        ) : (
          <Table head={["Referral", "Status", "Advance", "Outcome"]}>
            {(refs.data ?? []).map((r) => (
              <tr key={r.id} className="border-b border-outline/10 last:border-0 align-top">
                <td className="px-4 py-3 font-body-md">{r.id.slice(0, 8)}</td>
                <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                <td className="px-4 py-3"><AdvanceReferral referral={r} onDone={refetch} /></td>
                <td className="px-4 py-3">
                  <button onClick={() => setOutcomeFor(r)} className="rounded-lg bg-secondary-container px-3 py-1.5 font-label-md text-on-secondary-container hover:opacity-90">Record</button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </section>

      {referTo && <ReferModal opportunity={referTo} onClose={() => setReferTo(null)} onDone={() => { setReferTo(null); refetch(); }} />}
      {outcomeFor && <OutcomeModal referral={outcomeFor} onClose={() => setOutcomeFor(null)} onDone={() => { setOutcomeFor(null); refetch(); }} />}
    </Shell>
  );
}

function AdvanceReferral({ referral, onDone }: { referral: PlacementReferral; onDone: () => void }) {
  const [status, setStatus] = useState("");
  return (
    <span className="inline-flex items-center gap-2">
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-outline/40 bg-surface px-2 py-1 font-caption">
        <option value="">Set status…</option>
        {REFERRAL_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <ActionButton variant="primary" disabled={!status} onRun={() => api.updateReferral(referral.id, status)} onDone={onDone}>Save</ActionButton>
    </span>
  );
}

function ReferModal({ opportunity, onClose, onDone }: { opportunity: PlacementOpportunity; onClose: () => void; onDone: () => void }) {
  const [profileId, setProfileId] = useState("");
  return (
    <Modal title={`Refer to · ${opportunity.title}`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Field label="Placement profile ID (consented student)">
          <input value={profileId} onChange={(e) => setProfileId(e.target.value)} placeholder="uuid"
            className="rounded-lg border border-outline/40 bg-surface px-3 py-2 font-body-md" />
        </Field>
        <ActionButton variant="primary" disabled={!/^[0-9a-fA-F-]{36}$/.test(profileId)}
          onRun={() => api.referStudent(opportunity.id, profileId)} onDone={onDone}>Create referral</ActionButton>
      </div>
    </Modal>
  );
}

function OutcomeModal({ referral, onClose, onDone }: { referral: PlacementReferral; onClose: () => void; onDone: () => void }) {
  const [outcome, setOutcome] = useState("PLACED");
  const [notes, setNotes] = useState("");
  return (
    <Modal title={`Outcome · ${referral.id.slice(0, 8)}`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Field label="Outcome">
          <select value={outcome} onChange={(e) => setOutcome(e.target.value)} className="rounded-lg border border-outline/40 bg-surface px-3 py-2 font-body-md">
            <option value="PLACED">Placed</option>
            <option value="NOT_PLACED">Not placed</option>
            <option value="DECLINED">Declined</option>
          </select>
        </Field>
        <Field label="Notes"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="rounded-lg border border-outline/40 bg-surface px-3 py-2 font-body-md" /></Field>
        <ActionButton variant="primary" onRun={() => api.referralOutcome(referral.id, { outcome, notes: notes || undefined })} onDone={onDone}>Record outcome</ActionButton>
      </div>
    </Modal>
  );
}
