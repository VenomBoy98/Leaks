"use client";
// Shared staff UI: an async ActionButton that runs a real authorized operation with a pending
// state and surfaces failures, a lightweight Modal for confirmations/forms, and thin table
// helpers. Every primary action a staff member takes flows through ActionButton so errors from
// the backend (403/409/422/…) are shown rather than swallowed.
import { useState, type ReactNode } from "react";
import { ApiError } from "@/lib/apiClient";

export function messageOf(e: unknown): string {
  if (e instanceof ApiError) return e.message || e.code || "Request failed";
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}

export function ActionButton({
  onRun, children, variant = "primary", confirm, disabled, onDone, className = "",
}: {
  onRun: () => Promise<unknown>;
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  confirm?: string;
  disabled?: boolean;
  onDone?: () => void;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const styles: Record<string, string> = {
    primary: "bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50",
    secondary: "bg-secondary-container text-on-secondary-container hover:opacity-90 disabled:opacity-50",
    danger: "bg-error text-on-error hover:opacity-90 disabled:opacity-50",
    ghost: "border border-outline/40 text-on-surface hover:bg-surface-container-high disabled:opacity-50",
  };
  const run = async () => {
    if (confirm && !window.confirm(confirm)) return;
    setBusy(true); setErr(null);
    try { await onRun(); onDone?.(); }
    catch (e) { setErr(messageOf(e)); }
    finally { setBusy(false); }
  };
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button onClick={run} disabled={busy || disabled}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-label-md text-label-md transition-colors ${styles[variant]} ${className}`}>
        {busy && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
        {children}
      </button>
      {err && <span className="font-caption text-error" role="alert">{err}</span>}
    </span>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display-md text-title-lg text-primary">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-outline/15 bg-surface">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-outline/15 bg-surface-container-high/50">
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function StatCard({ label, value, icon, href }: { label: string; value: ReactNode; icon: string; href?: string }) {
  const inner = (
    <div className="flex items-center gap-4 rounded-xl border border-outline/15 bg-surface p-5">
      <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">{icon}</span>
      <div>
        <p className="font-display-md text-headline-md text-on-surface">{value}</p>
        <p className="font-caption text-on-surface-variant">{label}</p>
      </div>
    </div>
  );
  return href ? <a href={href} className="block transition-transform hover:-translate-y-0.5">{inner}</a> : inner;
}
