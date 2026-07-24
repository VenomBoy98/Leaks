"use client";
// WithdrawSection — applicant withdrawal, shown ONLY for backend-supported pre-decision
// states (DRAFT / SUBMITTED / IN_PROCESS). Confirmation dialog, mandatory reason, idempotency
// key (in the client), validation + conflict handling, and refresh of dashboard/timeline/
// notifications afterward.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, type Application } from "@/lib/api";
import { refresh } from "@/lib/hooks";

const WITHDRAWABLE = new Set(["DRAFT", "SUBMITTED", "IN_PROCESS"]);

export default function WithdrawSection({ app }: { app: Application }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!WITHDRAWABLE.has(app.status)) return null;

  async function confirm() {
    setErr(null);
    if (reason.trim().length < 5) { setErr("Please give a brief reason (at least a few words)."); return; }
    setBusy(true);
    try {
      await api.withdrawApplication(app.id, reason.trim());
      await Promise.all([refresh.applications(), refresh.application(app.id), refresh.notifications()]);
      setOpen(false);
      router.push("/dashboard");
    } catch (e) {
      const m = (e as { status?: number; message?: string });
      setErr(m.status === 409 ? "This application changed since you loaded it — refresh and try again." : (m.message ?? "Could not withdraw. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-error/20 bg-error-container/20 p-5">
      <p className="font-title-lg text-on-surface">Withdraw application</p>
      <p className="mt-1 font-body-md text-on-surface-variant">You can withdraw before an admission decision is made. This cannot be undone.</p>
      <button data-testid="withdraw-open" onClick={() => setOpen(true)}
        className="mt-3 rounded-lg border border-error/40 px-5 py-2.5 font-label-md text-error hover:bg-error-container/40">
        Withdraw application
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-xl bg-surface-container-lowest p-6">
            <p className="font-title-lg text-primary">Withdraw this application?</p>
            <label className="mt-4 flex flex-col gap-1.5">
              <span className="font-label-md uppercase tracking-wider text-on-surface-variant">Reason (required)</span>
              <textarea data-testid="withdraw-reason" rows={3} className="rounded-lg border border-outline/20 p-3 font-body-md" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
            </label>
            {err && <p className="mt-2 font-caption text-error" role="alert">{err}</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button className="rounded-lg border border-outline/30 px-4 py-2 font-label-md" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
              <button data-testid="withdraw-confirm" className="rounded-lg bg-error px-4 py-2 font-label-md text-on-error disabled:opacity-50" onClick={confirm} disabled={busy}>
                {busy ? "Withdrawing…" : "Confirm withdrawal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
