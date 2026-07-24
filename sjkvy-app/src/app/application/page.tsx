"use client";
// Applicant application form — real multi-step form over the backend:
// load courses + existing draft, create exactly one draft, debounced autosave with
// saving/saved/error state, client+server validation, unsaved-changes guard, idempotent
// submit gated on CLEAN documents, and the exact (safe) backend rejection reason.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Shell from "@/components/applicant/Shell";
import { Loading, ErrorState, Field } from "@/components/ui/States";
import { useApplications, useCourses, useDocuments, refresh } from "@/lib/hooks";
import { api, newIdempotencyKeySafe, type Gender } from "@/lib/api";
import WithdrawSection from "@/components/applicant/WithdrawSection";

type Draft = { course_id: string; dob: string; gender: Gender | ""; district: string; block: string; address: string; qualification: string };
const EMPTY: Draft = { course_id: "", dob: "", gender: "", district: "", block: "", address: "", qualification: "" };
const REQUIRED_DOCS = ["MATRIC"];

export default function ApplicationPage() {
  const router = useRouter();
  const { data: apps, isLoading, error, mutate } = useApplications();
  const { data: courses } = useCourses();
  const existing = apps?.find((a) => a.status === "DRAFT") ?? apps?.[0];
  const appId = existing?.id;
  const { data: docs } = useDocuments(appId);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitKey = useRef(newIdempotencyKeySafe());
  const loadedFor = useRef<string | undefined>(undefined);

  // Populate from the existing draft (once), so a refresh restores values.
  useEffect(() => {
    if (existing && loadedFor.current !== existing.id) {
      loadedFor.current = existing.id;
      setForm((f) => ({
        ...f,
        course_id: existing.course_id ?? "",
        // dob/gender/district live on the applicant; block/address/qualification on the app draft.
        block: (existing as unknown as { block?: string }).block ?? f.block,
        address: (existing as unknown as { address?: string }).address ?? f.address,
        qualification: (existing as unknown as { qualification?: string }).qualification ?? f.qualification,
      }));
    }
  }, [existing]);

  // Guard against losing unsaved changes.
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const set = (k: keyof Draft, v: string) => { setForm((f) => ({ ...f, [k]: v })); setDirty(true); };

  const validateStep1 = (): boolean => {
    const e: Partial<Record<keyof Draft, string>> = {};
    if (!form.course_id) e.course_id = "Choose a course.";
    if (!form.dob) e.dob = "Date of birth is required.";
    if (!form.gender) e.gender = "Select gender.";
    if (!form.district.trim()) e.district = "District is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Ensure a single draft exists; create only if none.
  const ensureDraft = useCallback(async (): Promise<string | null> => {
    if (appId) return appId;
    try {
      const created = await api.createApplication({ course_id: form.course_id, dob: form.dob, gender: form.gender as Gender, district: form.district });
      await refresh.applications();
      await mutate();
      loadedFor.current = created.application_id;
      return created.application_id;
    } catch (err) {
      setServerError((err as Error).message);
      return null;
    }
  }, [appId, form, mutate]);

  // Debounced autosave for the free-text draft fields (step 2).
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const autosave = useCallback((next: Draft) => {
    if (!appId) return;
    clearTimeout(saveTimer.current);
    setSaveState("saving");
    saveTimer.current = setTimeout(async () => {
      try {
        await api.saveDraft(appId, { block: next.block, address: next.address, qualification: next.qualification });
        setSaveState("saved");
        setDirty(false);
        refresh.application(appId);
      } catch {
        setSaveState("error");
      }
    }, 800);
  }, [appId]);

  useEffect(() => { if (step === 1 && dirty) autosave(form); }, [form, step, dirty, autosave]);

  const cleanTypes = useMemo(() => (docs ?? []).filter((d) => d.scan_status === "CLEAN").map((d) => d.document_type_code), [docs]);
  const docsReady = REQUIRED_DOCS.every((t) => cleanTypes.includes(t));

  async function onSubmit() {
    if (!appId) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const r = await api.submitApplication(appId, { idempotencyKey: submitKey.current });
      await refresh.applications();
      router.push("/dashboard");
      return r;
    } catch (err) {
      // surface the exact (safe) backend reason
      const m = (err as Error).message || "Submission failed.";
      setServerError(/docs_missing|MATRIC/i.test(m) ? "Submission blocked: a required document is missing or still being scanned." : m);
    } finally {
      setSubmitting(false);
      setConfirming(false);
    }
  }

  if (isLoading) return <Shell title="Application"><Loading /></Shell>;
  if (error) return <Shell title="Application"><ErrorState message="Could not load your application." onRetry={() => mutate()} /></Shell>;

  const submitted = existing && existing.status !== "DRAFT";

  return (
    <Shell title="Application">
      {submitted ? (
        <div className="rounded-xl border border-secondary/10 bg-surface-container-lowest p-6">
          <p className="font-title-lg text-primary">Your application has been submitted.</p>
          <p className="mt-1 font-body-md text-on-surface-variant">Track its progress on your dashboard.</p>
          <Link href="/dashboard" className="mt-4 inline-block rounded-lg bg-primary px-5 py-2.5 font-label-md text-on-primary">Go to dashboard</Link>
          {existing && <WithdrawSection app={existing} />}
        </div>
      ) : (
        <div className="mx-auto max-w-2xl">
          <Steps step={step} />
          {serverError && <div className="mb-4"><ErrorState message={serverError} /></div>}

          {step === 0 && (
            <div className="flex flex-col gap-4 rounded-xl border border-secondary/10 bg-surface-container-lowest p-6">
              <Field label="Course" error={errors.course_id}>
                <select className="rounded-lg border border-outline/20 p-3 font-body-md" value={form.course_id} onChange={(e) => set("course_id", e.target.value)} disabled={!!appId}>
                  <option value="">Select a course…</option>
                  {(courses ?? []).map((c) => <option key={c.id} value={c.id}>{c.name_en} ({c.code})</option>)}
                </select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Date of birth" error={errors.dob}>
                  <input type="date" className="rounded-lg border border-outline/20 p-3 font-body-md" value={form.dob} onChange={(e) => set("dob", e.target.value)} disabled={!!appId} />
                </Field>
                <Field label="Gender" error={errors.gender}>
                  <select className="rounded-lg border border-outline/20 p-3 font-body-md" value={form.gender} onChange={(e) => set("gender", e.target.value)} disabled={!!appId}>
                    <option value="">Select…</option><option value="F">Female</option><option value="M">Male</option><option value="O">Other</option>
                  </select>
                </Field>
              </div>
              <Field label="District" error={errors.district}>
                <input className="rounded-lg border border-outline/20 p-3 font-body-md" value={form.district} onChange={(e) => set("district", e.target.value)} placeholder="e.g. Ranchi" disabled={!!appId} />
              </Field>
              <div className="flex justify-end">
                <button className="rounded-lg bg-primary px-6 py-3 font-label-md text-on-primary hover:bg-primary-container disabled:opacity-50" disabled={submitting}
                  onClick={async () => {
                    // Validate identity fields only when creating; an existing draft already has them.
                    if (!appId && !validateStep1()) return;
                    const id = await ensureDraft();
                    if (id) setStep(1);
                  }}>
                  {appId ? "Continue" : "Save & continue"}
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-4 rounded-xl border border-secondary/10 bg-surface-container-lowest p-6">
              <SaveIndicator state={saveState} />
              <Field label="Block / Locality"><input className="rounded-lg border border-outline/20 p-3 font-body-md" value={form.block} onChange={(e) => set("block", e.target.value)} /></Field>
              <Field label="Address"><input className="rounded-lg border border-outline/20 p-3 font-body-md" value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
              <Field label="Highest qualification"><input className="rounded-lg border border-outline/20 p-3 font-body-md" value={form.qualification} onChange={(e) => set("qualification", e.target.value)} placeholder="e.g. Class 12" /></Field>
              <div className="flex justify-between">
                <button className="rounded-lg border border-outline/30 px-6 py-3 font-label-md text-on-surface" onClick={() => setStep(0)}>Back</button>
                <button className="rounded-lg bg-primary px-6 py-3 font-label-md text-on-primary" onClick={() => setStep(2)}>Continue</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4 rounded-xl border border-secondary/10 bg-surface-container-lowest p-6">
              <p className="font-title-lg text-primary">Review &amp; submit</p>
              <dl className="grid grid-cols-2 gap-2 font-body-md">
                <dt className="text-on-surface-variant">Course</dt><dd>{courses?.find((c) => c.id === form.course_id)?.name_en ?? "—"}</dd>
                <dt className="text-on-surface-variant">District</dt><dd>{form.district || "—"}</dd>
                <dt className="text-on-surface-variant">Qualification</dt><dd>{form.qualification || "—"}</dd>
              </dl>
              {!docsReady && (
                <div className="rounded-lg border border-secondary/30 bg-secondary-container/30 p-4 font-body-md text-on-secondary-container">
                  Required documents are missing or still being scanned.{" "}
                  <Link href="/documents" className="font-semibold underline">Upload documents</Link> before submitting.
                </div>
              )}
              <div className="flex justify-between">
                <button className="rounded-lg border border-outline/30 px-6 py-3 font-label-md text-on-surface" onClick={() => setStep(1)}>Back</button>
                <button data-testid="submit-btn" disabled={!docsReady || submitting}
                  className="rounded-lg bg-primary px-6 py-3 font-label-md text-on-primary hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setConfirming(true)}>
                  Submit application
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-xl bg-surface-container-lowest p-6">
            <p className="font-title-lg text-primary">Submit application?</p>
            <p className="mt-1 font-body-md text-on-surface-variant">Once submitted it enters verification and can only be withdrawn in eligible states.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button className="rounded-lg border border-outline/30 px-4 py-2 font-label-md" onClick={() => setConfirming(false)} disabled={submitting}>Cancel</button>
              <button className="rounded-lg bg-primary px-4 py-2 font-label-md text-on-primary disabled:opacity-50" onClick={onSubmit} disabled={submitting}>
                {submitting ? "Submitting…" : "Confirm submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

function Steps({ step }: { step: number }) {
  const labels = ["Details", "Address", "Review"];
  return (
    <ol className="mb-6 flex gap-2">
      {labels.map((l, i) => (
        <li key={l} className={`flex-1 rounded-full px-3 py-2 text-center font-label-md ${i <= step ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"}`}>{i + 1}. {l}</li>
      ))}
    </ol>
  );
}
function SaveIndicator({ state }: { state: "idle" | "saving" | "saved" | "error" }) {
  const map = { idle: "", saving: "Saving…", saved: "All changes saved", error: "Could not save — retrying on next change" };
  const tone = state === "error" ? "text-error" : state === "saved" ? "text-primary" : "text-on-surface-variant";
  return <p className={`h-4 font-caption ${tone}`} data-testid="save-state" aria-live="polite">{map[state]}</p>;
}
