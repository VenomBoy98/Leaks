"use client";
// AuthCard — branded, responsive shell for the auth pages, matching the SJKVY design system
// (Sal-Forest-Green primary, ivory surface, Playfair display headings).
import Link from "next/link";
import type { ReactNode } from "react";

export function AuthCard({ title, subtitle, children, footer }: {
  title: string; subtitle?: string; children: ReactNode; footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="font-display-md text-display-md font-bold text-primary">SJKVY</Link>
          <p className="font-caption text-on-surface-variant">Saksham Jharkhand Kaushal Vikas Yojana</p>
        </div>
        <div className="rounded-2xl border border-outline/15 bg-surface p-6 shadow-sm sm:p-8">
          <h1 className="font-display-md text-headline-md text-on-surface">{title}</h1>
          {subtitle && <p className="mt-1 font-body-md text-on-surface-variant">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-4 text-center font-body-md text-on-surface-variant">{footer}</div>}
      </div>
    </div>
  );
}

export function AuthField({ label, children, error, hint }: { label: string; children: ReactNode; error?: string; hint?: string }) {
  return (
    <label className="mb-4 flex flex-col gap-1.5">
      <span className="font-label-md text-label-md text-on-surface">{label}</span>
      {children}
      {hint && !error && <span className="font-caption text-on-surface-variant">{hint}</span>}
      {error && <span className="font-caption text-error" role="alert">{error}</span>}
    </label>
  );
}

export const inputClass =
  "rounded-lg border border-outline/40 bg-surface px-3 py-2.5 font-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

export function SubmitButton({ children, busy, disabled }: { children: ReactNode; busy?: boolean; disabled?: boolean }) {
  return (
    <button type="submit" disabled={busy || disabled}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-label-md text-on-primary transition-colors hover:bg-primary-container disabled:opacity-50">
      {busy && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
      {children}
    </button>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-error/30 bg-error-container/40 p-3 text-error" role="alert">
      <span className="material-symbols-outlined text-[18px]">error</span>
      <span className="font-body-md">{message}</span>
    </div>
  );
}
