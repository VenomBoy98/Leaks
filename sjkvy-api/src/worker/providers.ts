// worker/providers.ts — channel provider abstraction for notification delivery.
// The database owns dedupe, attempt accounting and the FAILED (dead-letter) transition
// (fn_notification_enqueue / fn_delivery_record). Providers here only perform the actual
// send and report success/failure. Swap the mock for Twilio/SES/FCM in production.
import { SmsProvider, EmailProvider } from './channels.js';
import { callFn } from '../db.js';

export type Channel = 'SMS' | 'INAPP' | 'EMAIL' | 'PUSH';

export interface OutboundMessage {
  notificationId: string;
  channel: Channel;
  recipientPhone: string | null;
  recipientProfileId: string | null;
  templateKey: string;
  params: Record<string, unknown>;
}

export interface DeliveryResult {
  ok: boolean;
  providerRef?: string;
  error?: string;
}

export interface ChannelProvider {
  channel: Channel;
  send(msg: OutboundMessage): Promise<DeliveryResult>;
}

// In-app "delivery" is a no-op success: the row already exists and is read via the API.
export class InAppProvider implements ChannelProvider {
  channel: Channel = 'INAPP';
  async send(msg: OutboundMessage): Promise<DeliveryResult> {
    return { ok: true, providerRef: `inapp:${msg.notificationId}` };
  }
}

// Mock SMS/email/push provider for local + CI. Deterministic: fails when the template
// key contains "fail" so retry/dead-letter paths can be exercised in tests.
export class MockProvider implements ChannelProvider {
  constructor(public channel: Channel) {}
  async send(msg: OutboundMessage): Promise<DeliveryResult> {
    if (msg.templateKey.includes('fail')) {
      return { ok: false, error: 'mock provider forced failure' };
    }
    return { ok: true, providerRef: `${this.channel.toLowerCase()}:${Date.now()}` };
  }
}

// Registry: choose a provider per channel from env. Real providers (SendGrid/Twilio)
// are used when configured; otherwise the deterministic MockProvider (local/CI). Retry
// and dead-letter stay in the database regardless of provider.
export function buildProviders(): Map<Channel, ChannelProvider> {
  const m = new Map<Channel, ChannelProvider>();
  m.set('INAPP', new InAppProvider());
  m.set('PUSH', new MockProvider('PUSH')); // push wiring (FCM/APNs) added at rollout

  // Lazy imports so the worker has no hard dependency on channels config in dev/CI.
  if (process.env.NOTIFY_SMS_PROVIDER === 'twilio') {
    // Constructed lazily to avoid importing db in this module's hot path.
    m.set('SMS', makeTwilio());
  } else {
    m.set('SMS', new MockProvider('SMS'));
  }
  if (process.env.NOTIFY_EMAIL_PROVIDER) {
    m.set('EMAIL', makeEmail());
  } else {
    m.set('EMAIL', new MockProvider('EMAIL'));
  }
  return m;
}

function makeTwilio(): ChannelProvider {
  return new SmsProvider({
    provider: 'twilio',
    accountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
    authToken: process.env.TWILIO_AUTH_TOKEN ?? '',
    fromNumber: process.env.TWILIO_FROM ?? '',
    render: (tpl) => `SJKVY: ${tpl}`,
  });
}

function makeEmail(): ChannelProvider {
  return new EmailProvider({
    provider: (process.env.NOTIFY_EMAIL_PROVIDER as 'sendgrid' | 'ses-http') ?? 'sendgrid',
    apiKey: process.env.EMAIL_API_KEY ?? '',
    fromEmail: process.env.EMAIL_FROM ?? 'no-reply@sjkvy.example',
    endpoint: process.env.EMAIL_ENDPOINT,
    resolveEmail: async (pid) =>
      pid
        ? await callFn<string | null>({ role: 'service_role', uid: null }, 'fn_profile_email', [pid])
        : null,
    render: (tpl) => ({ subject: `SJKVY: ${tpl}`, html: `<p>${tpl}</p>` }),
  });
}
