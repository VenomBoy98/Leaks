// auth-core/email.ts — provider-agnostic transactional email. Default production provider is
// Resend (called over its REST API with fetch — no SDK dependency, matching the storage
// drivers). A FakeProvider captures messages in memory for dev/tests and must NEVER be used in
// production (guarded in config). Emails carry no passwords, OTancodes-in-subject, internal ids,
// tokens, or debug data beyond the 6-digit code the recipient asked for.
import type { AuthConfig } from '../config.js';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailProvider {
  readonly name: string;
  // Resolves only on confirmed hand-off to the provider; throws on failure so the caller can
  // avoid marking an OTP as delivered.
  send(msg: EmailMessage): Promise<void>;
}

export class ResendProvider implements EmailProvider {
  readonly name = 'resend';
  constructor(private apiKey: string, private from: string) {}
  async send(msg: EmailMessage): Promise<void> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: this.from, to: msg.to, subject: msg.subject, html: msg.html, text: msg.text }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`resend send failed: ${res.status} ${detail.slice(0, 200)}`);
    }
  }
}

// In-memory capture. Exposed to tests via getCapturedEmails(); never enabled in production.
const captured: Array<EmailMessage & { at: string }> = [];
export class FakeProvider implements EmailProvider {
  readonly name = 'fake';
  constructor(private from: string) {}
  async send(msg: EmailMessage): Promise<void> {
    captured.push({ ...msg, at: new Date().toISOString() });
  }
}
export function getCapturedEmails(): ReadonlyArray<EmailMessage & { at: string }> {
  return captured;
}
export function clearCapturedEmails(): void {
  captured.length = 0;
}

export function getEmailProvider(cfg: AuthConfig): EmailProvider {
  if (cfg.emailProvider === 'resend') {
    if (!cfg.resendApiKey) throw new Error('RESEND_API_KEY required for the resend email provider');
    return new ResendProvider(cfg.resendApiKey, cfg.emailFrom);
  }
  return new FakeProvider(cfg.emailFrom);
}

// ---- branded templates ----
const shell = (title: string, body: string) => `<!doctype html><html><body style="margin:0;background:#f6f5f2;font-family:Segoe UI,Roboto,Arial,sans-serif;color:#20301f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#fffdf9;border:1px solid #e6e2d8;border-radius:16px;overflow:hidden">
<tr><td style="background:#2f5233;padding:24px 28px"><span style="color:#fffdf9;font-size:20px;font-weight:700;letter-spacing:.5px">SJKVY</span>
<div style="color:#cfe0cf;font-size:12px;margin-top:2px">Saksham Jharkhand Kaushal Vikas Yojana</div></td></tr>
<tr><td style="padding:28px"><h1 style="font-size:20px;margin:0 0 12px">${title}</h1>${body}
<p style="color:#7a8a76;font-size:12px;margin-top:24px">If you did not request this, you can safely ignore this email — no changes will be made to your account.</p>
</td></tr></table></td></tr></table></body></html>`;

const codeBlock = (otp: string) =>
  `<div style="font-size:32px;font-weight:700;letter-spacing:8px;background:#eef3ec;border-radius:12px;padding:18px;text-align:center;margin:16px 0">${otp}</div>
   <p style="color:#5a6b57;font-size:14px">This code expires in <strong>5 minutes</strong> and can be used once.</p>`;

export function otpEmail(purpose: 'registration' | 'login' | 'password_reset', otp: string): EmailMessage {
  const heading = purpose === 'registration' ? 'Verify your email'
    : purpose === 'login' ? 'Your login code'
    : 'Reset your password';
  const intro = purpose === 'registration' ? 'Welcome to SJKVY. Enter this code to verify your email and finish creating your account.'
    : purpose === 'login' ? 'Enter this code to finish signing in.'
    : 'Enter this code to continue resetting your password.';
  const html = shell(heading, `<p style="font-size:15px">${intro}</p>${codeBlock(otp)}`);
  const text = `${heading}\n\n${intro}\n\nCode: ${otp}\nThis code expires in 5 minutes and can be used once.\nIf you did not request this, ignore this email.`;
  return { to: '', subject: `${heading} — SJKVY`, html, text };
}

export function passwordChangedEmail(): EmailMessage {
  const html = shell('Your password was changed',
    `<p style="font-size:15px">This is a confirmation that your SJKVY account password was just changed and all active sessions were signed out.</p>
     <p style="font-size:14px;color:#5a6b57">If this was not you, reset your password immediately and contact your centre administrator.</p>`);
  const text = 'Your SJKVY account password was just changed and all active sessions were signed out. If this was not you, reset your password immediately.';
  return { to: '', subject: 'Your SJKVY password was changed', html, text };
}
