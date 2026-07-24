// worker/channels.ts — production channel providers behind the ChannelProvider
// interface. Selected by env; retry/dead-letter remain the DATABASE's job
// (fn_delivery_record vs notif_max_attempts). Providers only send + report.
//
// No vendor SDK dependency: email uses SMTP-over-fetch is not possible, so email uses a
// pluggable HTTP provider (SendGrid/SES-HTTP) and SMS uses the Twilio/MSG91 REST API via
// fetch. Credentials come from env and are never logged. These require network to real
// providers, so they are validated at staging (see INTEGRATION_GUIDES §3); the local/CI
// default remains the deterministic MockProvider.
import type { Channel, ChannelProvider, DeliveryResult, OutboundMessage } from './providers.js';

// --- Email via SendGrid HTTP API (or any compatible endpoint) ---
export interface EmailConfig {
  provider: 'sendgrid' | 'ses-http';
  apiKey: string;
  fromEmail: string;
  endpoint?: string;
  // Resolve a recipient email from a profile id (the DB stores it on app.profiles.email;
  // the worker fetches it via a [SYS] read in production — injected here for testability).
  resolveEmail: (profileId: string | null, phone: string | null) => Promise<string | null>;
  render: (templateKey: string, params: Record<string, unknown>) => { subject: string; html: string };
}

export class EmailProvider implements ChannelProvider {
  channel: Channel = 'EMAIL';
  constructor(private cfg: EmailConfig) {}
  async send(msg: OutboundMessage): Promise<DeliveryResult> {
    const to = await this.cfg.resolveEmail(msg.recipientProfileId, msg.recipientPhone);
    if (!to) return { ok: false, error: 'no email address for recipient' };
    const { subject, html } = this.cfg.render(msg.templateKey, msg.params);
    try {
      const endpoint =
        this.cfg.endpoint ?? 'https://api.sendgrid.com/v3/mail/send';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.cfg.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: this.cfg.fromEmail },
          subject,
          content: [{ type: 'text/html', value: html }],
        }),
      });
      if (res.ok) return { ok: true, providerRef: res.headers.get('x-message-id') ?? 'email' };
      return { ok: false, error: `email provider ${res.status}` };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }
}

// --- SMS via Twilio REST API (or MSG91-compatible) ---
export interface SmsConfig {
  provider: 'twilio' | 'msg91';
  accountSid: string;
  authToken: string;
  fromNumber: string;
  render: (templateKey: string, params: Record<string, unknown>) => string;
}

export class SmsProvider implements ChannelProvider {
  channel: Channel = 'SMS';
  constructor(private cfg: SmsConfig) {}
  async send(msg: OutboundMessage): Promise<DeliveryResult> {
    if (!msg.recipientPhone) return { ok: false, error: 'no phone for recipient' };
    const bodyText = this.cfg.render(msg.templateKey, msg.params);
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.cfg.accountSid}/Messages.json`;
      const auth = Buffer.from(`${this.cfg.accountSid}:${this.cfg.authToken}`).toString('base64');
      const form = new URLSearchParams({
        To: msg.recipientPhone,
        From: this.cfg.fromNumber,
        Body: bodyText,
      });
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          authorization: `Basic ${auth}`,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
      });
      if (res.ok) {
        const j = (await res.json()) as { sid?: string };
        return { ok: true, providerRef: j.sid ?? 'sms' };
      }
      return { ok: false, error: `sms provider ${res.status}` };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }
}
