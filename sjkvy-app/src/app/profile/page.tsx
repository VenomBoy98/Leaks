"use client";
// Applicant profile — loads auth.me; only the backend-allowed fields (full_name,
// preferred_lang) are editable. Identity/phone/email/role/centre are read-only (no mass
// assignment). The backend column grant enforces this even if the client is tampered with.
import { useEffect, useState } from "react";
import Shell from "@/components/applicant/Shell";
import { Loading, ErrorState, Field } from "@/components/ui/States";
import { useMe } from "@/lib/hooks";
import { api } from "@/lib/api";

export default function ProfilePage() {
  const { data: me, isLoading, error, mutate } = useMe();
  const [fullName, setFullName] = useState("");
  const [lang, setLang] = useState<"hi" | "en">("en");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => { if (me) { setFullName(me.full_name); setLang(me.preferred_lang as "hi" | "en"); } }, [me]);

  async function save() {
    setState("saving");
    try { await api.updateMe({ full_name: fullName.trim(), preferred_lang: lang }); await mutate(); setState("saved"); }
    catch { setState("error"); }
  }

  if (isLoading) return <Shell title="Profile"><Loading /></Shell>;
  if (error || !me) return <Shell title="Profile"><ErrorState message="Could not load your profile." onRetry={() => mutate()} /></Shell>;

  return (
    <Shell title="Profile">
      <div className="mx-auto max-w-xl rounded-xl border border-secondary/10 bg-surface-container-lowest p-6">
        <div className="flex flex-col gap-4">
          <Field label="Full name"><input className="rounded-lg border border-outline/20 p-3 font-body-md" value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
          <Field label="Preferred language">
            <select className="rounded-lg border border-outline/20 p-3 font-body-md" value={lang} onChange={(e) => setLang(e.target.value as "hi" | "en")}>
              <option value="en">English</option><option value="hi">Hindi</option>
            </select>
          </Field>
          {/* read-only identity — never editable through the ordinary profile form */}
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-surface-container-low p-4 font-body-md">
            <span className="text-on-surface-variant">Phone</span><span>{me.phone}</span>
            <span className="text-on-surface-variant">Email</span><span>{me.email ?? "—"}</span>
            <span className="text-on-surface-variant">Account</span><span>{me.is_active ? "Active" : "Inactive"}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={save} disabled={state === "saving"} className="rounded-lg bg-primary px-6 py-3 font-label-md text-on-primary hover:bg-primary-container disabled:opacity-50">
              {state === "saving" ? "Saving…" : "Save changes"}
            </button>
            {state === "saved" && <span className="font-caption text-primary">Saved</span>}
            {state === "error" && <span className="font-caption text-error">Could not save</span>}
          </div>
        </div>
      </div>
    </Shell>
  );
}
