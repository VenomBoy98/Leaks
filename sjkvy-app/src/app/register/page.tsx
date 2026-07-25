"use client";
// /register — create an account (name/email/password) → email-OTP verification → session.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard, AuthField, FormError, SubmitButton, inputClass } from "@/components/auth/AuthCard";
import { OtpInput, secondsUntil } from "@/components/auth/OtpInput";
import { authClient } from "@/lib/authClient";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [challengeId, setChallengeId] = useState("");
  const [resendAt, setResendAt] = useState<string | undefined>();
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (step !== "otp") return;
    const t = setInterval(() => setCooldown(secondsUntil(resendAt)), 1000);
    setCooldown(secondsUntil(resendAt));
    return () => clearInterval(t);
  }, [step, resendAt]);

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    if (form.password !== form.confirmPassword) return setErr("Passwords do not match.");
    if (form.password.length < 8) return setErr("Password must be at least 8 characters.");
    setBusy(true);
    try {
      const ch = await authClient.register(form);
      setChallengeId(ch.challengeId); setResendAt(ch.resendAvailableAt); setStep("otp");
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  const verify = async (code: string) => {
    setErr(null); setBusy(true);
    try {
      const s = await authClient.verifyRegistration({ challengeId, otp: code });
      router.push(s.home);
    } catch (e) { setErr((e as Error).message); setOtp(""); } finally { setBusy(false); }
  };

  const resend = async () => {
    setErr(null);
    try { const ch = await authClient.resend(challengeId); setChallengeId(ch.challengeId); setResendAt(ch.resendAvailableAt); setOtp(""); }
    catch (e) { setErr((e as Error).message); }
  };

  if (step === "otp") {
    return (
      <AuthCard title="Verify your email" subtitle={`Enter the 6-digit code we sent to ${form.email}.`}
        footer={<Link href="/login" className="text-primary hover:underline">Back to sign in</Link>}>
        <FormError message={err} />
        <div className="mb-5 flex justify-center"><OtpInput value={otp} onChange={setOtp} onComplete={verify} disabled={busy} /></div>
        <button type="button" onClick={() => otp.length === 6 && verify(otp)} disabled={busy || otp.length !== 6}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-label-md text-on-primary hover:bg-primary-container disabled:opacity-50">
          {busy && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
          Verify &amp; continue
        </button>
        <button type="button" onClick={resend} disabled={cooldown > 0}
          className="mt-4 w-full text-center font-body-md text-primary hover:underline disabled:text-on-surface-variant disabled:no-underline">
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
        <p className="mt-3 text-center font-caption text-on-surface-variant">The code expires in 5 minutes.</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Create your account" subtitle="Register to apply for a skilling programme."
      footer={<>Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link></>}>
      <form onSubmit={submitForm} noValidate>
        <FormError message={err} />
        <AuthField label="Full name">
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" required />
        </AuthField>
        <AuthField label="Email">
          <input className={inputClass} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" required />
        </AuthField>
        <AuthField label="Password" hint="At least 8 characters.">
          <input className={inputClass} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" required />
        </AuthField>
        <AuthField label="Confirm password">
          <input className={inputClass} type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} autoComplete="new-password" required />
        </AuthField>
        <SubmitButton busy={busy}>Create account</SubmitButton>
      </form>
    </AuthCard>
  );
}
