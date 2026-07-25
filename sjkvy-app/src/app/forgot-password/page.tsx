"use client";
// /forgot-password — request a reset code (generic response), then set a new password with the
// OTP. Non-enumerating: the request step always shows the same confirmation.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard, AuthField, FormError, SubmitButton, inputClass } from "@/components/auth/AuthCard";
import { OtpInput } from "@/components/auth/OtpInput";
import { authClient } from "@/lib/authClient";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "reset" | "done">("request");
  const [email, setEmail] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [otp, setOtp] = useState("");
  const [pw, setPw] = useState({ newPassword: "", confirmPassword: "" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const request = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setBusy(true);
    try {
      const ch = await authClient.forgot(email);
      setChallengeId(ch.challengeId ?? ""); // present only when the account exists (never revealed)
      setStep("reset");
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  const reset = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    if (pw.newPassword !== pw.confirmPassword) return setErr("Passwords do not match.");
    if (pw.newPassword.length < 8) return setErr("Password must be at least 8 characters.");
    setBusy(true);
    try {
      await authClient.reset({ challengeId, otp, newPassword: pw.newPassword, confirmPassword: pw.confirmPassword });
      setStep("done");
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  if (step === "done") {
    return (
      <AuthCard title="Password changed" subtitle="Your password was updated and all sessions were signed out.">
        <button onClick={() => router.push("/login")} className="flex w-full justify-center rounded-lg bg-primary px-4 py-2.5 font-label-md text-on-primary hover:bg-primary-container">Sign in</button>
      </AuthCard>
    );
  }

  if (step === "reset") {
    return (
      <AuthCard title="Set a new password" subtitle="If an account exists for that email, we sent a 6-digit code. Enter it below."
        footer={<Link href="/login" className="text-primary hover:underline">Back to sign in</Link>}>
        <form onSubmit={reset} noValidate>
          <FormError message={err} />
          <div className="mb-4 flex justify-center"><OtpInput value={otp} onChange={setOtp} disabled={busy} /></div>
          <AuthField label="New password" hint="At least 8 characters.">
            <input className={inputClass} type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} autoComplete="new-password" required />
          </AuthField>
          <AuthField label="Confirm new password">
            <input className={inputClass} type="password" value={pw.confirmPassword} onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })} autoComplete="new-password" required />
          </AuthField>
          <SubmitButton busy={busy} disabled={otp.length !== 6}>Reset password</SubmitButton>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Forgot password" subtitle="Enter your email and we'll send a reset code."
      footer={<Link href="/login" className="text-primary hover:underline">Back to sign in</Link>}>
      <form onSubmit={request} noValidate>
        <FormError message={err} />
        <AuthField label="Email">
          <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </AuthField>
        <SubmitButton busy={busy}>Send reset code</SubmitButton>
      </form>
    </AuthCard>
  );
}
