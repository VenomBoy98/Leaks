"use client";
// Certificate management — issue certificates for COMPLETED enrolments (the backend enforces the
// completion + assessment-pass gate; the frontend never mints an authoritative certificate),
// and reissue / revoke existing ones (reason required). Verification codes match the public
// /verify endpoint. All reads are RLS-scoped to the centre admin.
import { useState } from "react";
import Shell from "@/components/staff/Shell";
import { ActionButton, Table } from "@/components/staff/ui";
import { Loading, EmptyState, ErrorState, StatusPill, Field } from "@/components/ui/States";
import { useCertificates, useEnrolments, refresh } from "@/lib/hooks";
import { api } from "@/lib/api";

export default function Certificates() {
  const certs = useCertificates();
  const enrolments = useEnrolments();
  const completed = (enrolments.data ?? []).filter((e) => /COMPLETED/i.test(e.status));
  const certifiedEnrol = new Set((certs.data ?? []).map((c) => c.enrolment_id));
  const eligible = completed.filter((e) => !certifiedEnrol.has(e.id));
  const refetch = () => { certs.mutate(); refresh.certificates(); };
  const [revoke, setRevoke] = useState<Record<string, string>>({});

  return (
    <Shell title="Certificates" subtitle="Issue, reissue and revoke completion certificates">
      <section className="mb-8">
        <h2 className="mb-3 font-display-md text-title-lg text-primary">Eligible for issuance</h2>
        {enrolments.isLoading ? <Loading label="Loading enrolments…" /> : enrolments.error ? (
          <ErrorState message="Could not load enrolments." onRetry={() => enrolments.mutate()} />
        ) : eligible.length === 0 ? (
          <EmptyState icon="task_alt" title="Nothing to issue" hint="No COMPLETED enrolments are awaiting a certificate." />
        ) : (
          <Table head={["Enrolment", "Batch", "Status", ""]}>
            {eligible.map((e) => (
              <tr key={e.id} className="border-b border-outline/10 last:border-0">
                <td className="px-4 py-3 font-body-md">{e.id.slice(0, 8)}</td>
                <td className="px-4 py-3 font-body-md text-on-surface-variant">{e.batch_id?.slice(0, 8)}</td>
                <td className="px-4 py-3"><StatusPill status={e.status} /></td>
                <td className="px-4 py-3 text-right">
                  <ActionButton variant="primary" confirm="Issue a certificate for this enrolment?"
                    onRun={() => api.issueCertificate(e.id)} onDone={refetch}>Issue certificate</ActionButton>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display-md text-title-lg text-primary">Issued certificates</h2>
        {certs.isLoading ? <Loading label="Loading certificates…" /> : certs.error ? (
          <ErrorState message="Could not load certificates." onRetry={() => certs.mutate()} />
        ) : (certs.data ?? []).length === 0 ? (
          <EmptyState icon="workspace_premium" title="No certificates yet" />
        ) : (
          <Table head={["Number", "Verify code", "Status", "Actions"]}>
            {(certs.data ?? []).map((c) => (
              <tr key={c.id} className="border-b border-outline/10 last:border-0 align-top">
                <td className="px-4 py-3 font-body-md">{c.certificate_no ?? c.id.slice(0, 8)}</td>
                <td className="px-4 py-3 font-mono text-body-md text-on-surface-variant">{c.verify_code ?? "—"}</td>
                <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-end gap-2">
                    <ActionButton variant="secondary" confirm="Reissue this certificate (supersedes the current one)?"
                      onRun={() => api.reissueCertificate(c.id)} onDone={refetch}>Reissue</ActionButton>
                    <Field label="Revoke reason">
                      <input value={revoke[c.id] ?? ""} onChange={(ev) => setRevoke((r) => ({ ...r, [c.id]: ev.target.value }))}
                        className="w-48 rounded-lg border border-outline/40 bg-surface px-2 py-1 font-caption" />
                    </Field>
                    <ActionButton variant="danger" disabled={(revoke[c.id] ?? "").trim().length < 3}
                      confirm="Revoke this certificate?" onRun={() => api.revokeCertificate(c.id, revoke[c.id])} onDone={refetch}>Revoke</ActionButton>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </section>
    </Shell>
  );
}
