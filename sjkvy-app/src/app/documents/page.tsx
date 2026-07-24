"use client";
// Applicant documents — real required-document list with upload/re-upload, client-side
// size/MIME checks, live scan status (PENDING_SCAN / CLEAN / FLAGGED), safe signed viewing,
// retry, and staff correction remarks. No hardcoded records; never marks anything clean.
import { useRef, useState } from "react";
import Link from "next/link";
import Shell from "@/components/applicant/Shell";
import { Loading, ErrorState, EmptyState, StatusPill } from "@/components/ui/States";
import { useApplications, useDocuments, refresh } from "@/lib/hooks";
import { uploadDocument, documentViewUrl, type ApplicantDocument } from "@/lib/api";

// Application-stage required documents (labels for the UI).
const REQUIRED = [{ code: "MATRIC", label: "Matriculation Certificate" }];
const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";
const MAX = 10 * 1024 * 1024;
const MIME_OK = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export default function DocumentsPage() {
  const { data: apps, isLoading, error } = useApplications();
  const app = apps?.find((a) => a.status === "DRAFT") ?? apps?.[0];
  const { data: docs, mutate, isLoading: docsLoading } = useDocuments(app?.id);

  if (isLoading) return <Shell title="Documents"><Loading /></Shell>;
  if (error) return <Shell title="Documents"><ErrorState message="Could not load your application." /></Shell>;
  if (!app) return (
    <Shell title="Documents">
      <EmptyState icon="assignment" title="No application yet" hint="Start an application before uploading documents." />
      <Link href="/application" className="mt-4 inline-block rounded-lg bg-primary px-5 py-2.5 font-label-md text-on-primary">Start application</Link>
    </Shell>
  );

  const byType = new Map((docs ?? []).map((d) => [d.document_type_code, d]));

  return (
    <Shell title="Documents">
      {docsLoading && <Loading label="Loading documents…" />}
      <div className="flex flex-col gap-4">
        {REQUIRED.map((req) => (
          <DocRow key={req.code} applicationId={app.id} req={req} doc={byType.get(req.code)} onChanged={() => { refresh.documents(app.id); mutate(); }} />
        ))}
      </div>
    </Shell>
  );
}

function DocRow({ applicationId, req, doc, onChanged }: {
  applicationId: string; req: { code: string; label: string }; doc?: ApplicantDocument; onChanged: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [uploadedVersion, setUploadedVersion] = useState<string | null>(null);
  const status = doc?.scan_status; // undefined = not uploaded

  async function onFile(file: File) {
    setErr(null);
    if (!MIME_OK.includes(file.type)) return setErr("Only PDF, JPG, PNG or WebP files are allowed.");
    if (file.size > MAX) return setErr("File exceeds the 10MB limit.");
    setBusy(true);
    try {
      const r = await uploadDocument({ application_id: applicationId, document_type: req.code, mime: file.type, file });
      setUploadedVersion(r.version_id);
      onChanged();
    } catch (e) {
      setErr((e as Error).message || "Upload failed. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  async function onView() {
    if (!uploadedVersion) return;
    setErr(null);
    try {
      const url = await documentViewUrl({ versionId: uploadedVersion, application_id: applicationId, document_type: req.code });
      window.open(url, "_blank", "noopener");
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <section className="rounded-xl border border-secondary/10 bg-surface-container-lowest p-5" data-testid={`doc-${req.code}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-title-lg text-on-surface">{req.label}</p>
          <p className="font-caption text-on-surface-variant">Required · PDF/JPG/PNG/WebP · max 10MB{doc ? ` · v${doc.version_no}` : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          {status ? <StatusPill status={status} /> : <span className="font-label-md text-on-surface-variant">Not uploaded</span>}
        </div>
      </div>

      {doc?.status === "CORRECTION_REQUESTED" && (
        <p className="mt-3 rounded-lg bg-secondary-container/40 px-4 py-2 font-body-md text-on-secondary-container">
          Correction requested by the reviewer. Please re-upload a corrected document.
        </p>
      )}
      {status === "FLAGGED" && (
        <p className="mt-3 rounded-lg bg-error-container/50 px-4 py-2 font-body-md text-error">
          This document failed the security scan and cannot be used. Please upload a different file.
        </p>
      )}
      {status === "PENDING_SCAN" && (
        <p className="mt-3 font-body-md text-on-surface-variant">Scanning in progress — you can submit once it passes.</p>
      )}
      {err && <p className="mt-3 font-caption text-error" role="alert">{err}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
        <button disabled={busy} onClick={() => inputRef.current?.click()}
          className="rounded-lg bg-primary px-5 py-2.5 font-label-md text-on-primary hover:bg-primary-container disabled:opacity-50">
          {busy ? "Uploading…" : doc ? "Re-upload" : "Upload"}
        </button>
        {status === "CLEAN" && uploadedVersion && (
          <button onClick={onView} className="rounded-lg border border-outline/30 px-5 py-2.5 font-label-md text-on-surface hover:bg-surface-container">View</button>
        )}
      </div>
    </section>
  );
}
