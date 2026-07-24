"use client";
// Shared loading / empty / error primitives + a status pill, styled with the SJKVY tokens.
import type { ReactNode } from "react";

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-10 text-on-surface-variant" role="status" aria-live="polite">
      <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
      <span className="font-body-md">{label}</span>
    </div>
  );
}

export function EmptyState({ icon = "inbox", title, hint }: { icon?: string; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center text-on-surface-variant">
      <span className="material-symbols-outlined text-4xl text-outline">{icon}</span>
      <p className="font-title-lg text-on-surface">{title}</p>
      {hint && <p className="font-body-md max-w-sm">{hint}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-error/30 bg-error-container/40 p-4" role="alert">
      <div className="flex items-center gap-2 text-error">
        <span className="material-symbols-outlined">error</span>
        <span className="font-label-md">{message}</span>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="rounded-lg bg-primary px-4 py-2 font-label-md text-on-primary hover:bg-primary-container">
          Try again
        </button>
      )}
    </div>
  );
}

const PILL: Record<string, string> = {
  DRAFT: "bg-surface-container-high text-on-surface-variant",
  SUBMITTED: "bg-secondary-container text-on-secondary-container",
  IN_PROCESS: "bg-secondary-container text-on-secondary-container",
  DECIDED: "bg-primary/15 text-primary",
  CLOSED: "bg-surface-container-high text-on-surface-variant",
  WITHDRAWN: "bg-surface-container-high text-on-surface-variant",
  EXPIRED: "bg-error-container text-error",
  PENDING: "bg-secondary-container text-on-secondary-container",
  PENDING_SCAN: "bg-secondary-container text-on-secondary-container",
  CLEAN: "bg-primary/15 text-primary",
  FLAGGED: "bg-error-container text-error",
};

export function StatusPill({ status }: { status: string }) {
  const human = status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 font-label-md text-label-md ${PILL[status] ?? "bg-surface-container-high text-on-surface-variant"}`}>
      {human}
    </span>
  );
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">{label}</span>
      {children}
      {error && <span className="font-caption text-error" role="alert">{error}</span>}
    </label>
  );
}
