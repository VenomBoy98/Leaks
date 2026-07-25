"use client";
// /login — email + password (verified server-side) → email-OTP → session.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard, AuthField, FormError, SubmitButton, inputClass } from "@/components/auth/AuthCard";
import { OtpInput, secondsUntil } from "@/components/auth/OtpInput";
import { authClient } from "@/lib/authClient";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [creds, setCreds] = useState({ email: "", password: "" });
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setBusy(true);
    try { const ch = await authClient.login(creds); setChallengeId(ch.challengeId); setResendAt(ch.resendAvailableAt); setStep("otp"); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  const verify = async (code: string) => {
    setErr(null); setBusy(true);
    try { const s = await authClient.verifyLogin({ challengeId, otp: code }); router.push(s.home); }
    catch (e) { setErr((e as Error).message); setOtp(""); } finally { setBusy(false); }
  };
  const resend = async () => {
    setErr(null);
    try { const ch = await authClient.resend(challengeId); setChallengeId(ch.challengeId); setResendAt(ch.resendAvailableAt); setOtp(""); }
    catch (e) { setErr((e as Error).message); }
  };

  if (step === "otp") {
    return (
      <AuthCard title="Enter your login code" subtitle={`We sent a 6-digit code to ${creds.email}.`}
        footer={<button onClick={() => setStep("form")} className="text-primary hover:underline">Use a different account</button>}>
        <FormError message={err} />
        <div className="mb-5 flex justify-center"><OtpInput value={otp} onChange={setOtp} onComplete={verify} disabled={busy} /></div>
        <button type="button" onClick={() => otp.length === 6 && verify(otp)} disabled={busy || otp.length !== 6}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-label-md text-on-primary hover:bg-primary-container disabled:opacity-50">
          {busy && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
          Sign in
        </button>
        <button type="button" onClick={resend} disabled={cooldown > 0}
          className="mt-4 w-full text-center font-body-md text-primary hover:underline disabled:text-on-surface-variant disabled:no-underline">
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Sign in" subtitle="Access your SJKVY portal."
      footer={<>New here? <Link href="/register" className="text-primary hover:underline">Create an account</Link></>}>
      <form onSubmit={submit} noValidate>
        <FormError message={err} />
        <AuthField label="Email">
          <input className={inputClass} type="email" value={creds.email} onChange={(e) => setCreds({ ...creds, email: e.target.value })} autoComplete="email" required />
        </AuthField>
        <AuthField label="Password">
          <input className={inputClass} type="password" value={creds.password} onChange={(e) => setCreds({ ...creds, password: e.target.value })} autoComplete="current-password" required />
        </AuthField>
        <div className="mb-4 text-right"><Link href="/forgot-password" className="font-caption text-primary hover:underline">Forgot password?</Link></div>
        <SubmitButton busy={busy}>Continue</SubmitButton>
      </form>
    </AuthCard>
  );
}
