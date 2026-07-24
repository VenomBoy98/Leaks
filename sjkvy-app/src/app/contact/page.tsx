"use client";
// Public contact page — a REAL enquiry form backed by POST /public/contact
// (fn_contact_submit). Client + server validation; generic success; no fake success, no
// browser-only storage. Editorial page chrome is kept minimal and on-brand.
import { useState } from "react";
import Link from "next/link";
import { Field } from "@/components/ui/States";
import { api } from "@/lib/api";

const SUBJECTS = ["Admissions", "Programs & Courses", "Documents & Verification", "Placement", "Other"];

export default function ContactPage() {
  const [f, setF] = useState({ name: "", email: "", subject: SUBJECTS[0], message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [serverErr, setServerErr] = useState<string | null>(null);

  function validate() {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = "Please enter your name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) e.email = "Enter a valid email address.";
    if (f.message.trim().length < 5) e.message = "Please write at least a few words.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerErr(null);
    if (!validate()) return;
    setState("sending");
    try {
      await api.submitContact({ name: f.name.trim(), email: f.email.trim(), subject: f.subject, message: f.message.trim() });
      setState("sent");
      setF({ name: "", email: "", subject: SUBJECTS[0], message: "" });
    } catch {
      // generic failure — never echoes back submitted content
      setState("error");
      setServerErr("We couldn't send your message right now. Please try again in a moment.");
    }
  }

  return (
    <main className="min-h-screen bg-background text-on-background">
      <header className="flex h-topbar-height items-center justify-between border-b border-secondary/10 px-margin-mobile md:px-margin-desktop">
        <Link href="/" className="font-display-md text-display-md font-semibold text-primary">SJKVY</Link>
        <nav className="hidden gap-6 font-body-md text-on-surface-variant md:flex">
          <Link href="/schemes" className="hover:text-secondary">Programs</Link>
          <Link href="/support" className="hover:text-secondary">Support</Link>
          <Link href="/login" className="hover:text-secondary">Portal Login</Link>
        </nav>
      </header>

      <div className="mx-auto max-w-2xl px-margin-mobile py-12 md:px-margin-desktop">
        <p className="font-label-md uppercase tracking-widest text-secondary">Get in touch</p>
        <h1 className="mt-2 font-display-md text-display-md text-primary">Contact the institution</h1>
        <p className="mt-2 font-body-lg text-on-surface-variant">Questions about admissions, programs or documents? Send us a message.</p>

        {state === "sent" ? (
          <div className="mt-8 rounded-xl border border-primary/20 bg-primary/10 p-6" role="status">
            <p className="font-title-lg text-primary">Thank you — your message has been received.</p>
            <p className="mt-1 font-body-md text-on-surface-variant">Our team will respond to your email if a reply is needed.</p>
            <button onClick={() => setState("idle")} className="mt-4 rounded-lg border border-outline/30 px-5 py-2.5 font-label-md">Send another</button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 flex flex-col gap-4 rounded-xl border border-secondary/10 bg-surface-container-lowest p-6">
            {serverErr && <p className="rounded-lg bg-error-container/50 px-4 py-2 font-body-md text-error" role="alert">{serverErr}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" error={errors.name}><input className="rounded-lg border border-outline/20 p-3 font-body-md" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={120} /></Field>
              <Field label="Email" error={errors.email}><input type="email" className="rounded-lg border border-outline/20 p-3 font-body-md" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} maxLength={200} /></Field>
            </div>
            <Field label="Subject">
              <select className="rounded-lg border border-outline/20 p-3 font-body-md" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })}>
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Message" error={errors.message}>
              <textarea rows={5} className="rounded-lg border border-outline/20 p-3 font-body-md" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} maxLength={4000} />
            </Field>
            <button type="submit" disabled={state === "sending"} className="rounded-lg bg-primary px-6 py-3 font-label-md text-on-primary hover:bg-primary-container disabled:opacity-50">
              {state === "sending" ? "Sending…" : "Send message"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
