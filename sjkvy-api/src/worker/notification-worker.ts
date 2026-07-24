// worker/notification-worker.ts — the notification pipeline worker. It NEVER embeds
// business logic; it drives the verified database functions as service_role:
//
//   1. fn_outbox_claim(limit)        — FOR UPDATE SKIP LOCKED batch of domain_events
//   2. map each event → recipients + template (the ONLY mapping the worker owns)
//   3. fn_notification_enqueue(...)  — dedupe + mark event processed (in the DB)
//   4. for each PENDING notification: provider.send → fn_delivery_record(ok, ref, err)
//
// Retry + dead-letter are the DATABASE's: fn_delivery_record increments the attempt and
// sets status SENT / PENDING (retry) / FAILED (dead-letter) against notif_max_attempts.
// PENDING rows are retried on the next tick; FAILED rows are the DLQ (queryable).
import type pg from 'pg';
import { callFn, queryRead, type Actor } from '../db.js';
import type { Channel, ChannelProvider, OutboundMessage } from './providers.js';
import { buildProviders } from './providers.js';

const SERVICE: Actor = { role: 'service_role', uid: null };

// Event → (channel, template, recipient) mapping. Data-only; extend per event type.
// recipient resolution reads from the DB under service_role.
interface Plan {
  channel: Channel;
  templateKey: string;
  recipientProfileId: string | null;
  recipientPhone: string | null;
  params: Record<string, unknown>;
}

// Minimal default mapping: notify the application's owner in-app for lifecycle events.
// Production expands this table; the shape stays data-driven.
const EVENT_TEMPLATES: Record<string, string> = {
  'application.submitted': 'application_submitted',
  'decision.approved': 'admission_approved',
  'decision.waitlisted': 'admission_waitlisted',
  'offer.accepted': 'offer_accepted',
  'waitlist.promoted': 'waitlist_promoted',
  'certificate.issued': 'certificate_issued',
  'hostel.allocation_update': 'hostel_update',
};

async function planFor(ev: {
  id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
}): Promise<Plan[]> {
  const tpl = EVENT_TEMPLATES[ev.event_type];
  if (!tpl) return []; // event has no notification (still marked processed on enqueue-none)
  // Resolve the owning applicant profile via the narrow [SYS] resolver (migration 0005),
  // so the worker needs NO table grants — service_role keeps zero direct table access.
  if (ev.aggregate_type === 'application') {
    const pid = await callFn<string | null>(SERVICE, 'fn_application_owner', [ev.aggregate_id]);
    if (!pid) return [];
    return [{ channel: 'INAPP', templateKey: tpl, recipientProfileId: pid, recipientPhone: null, params: {} }];
  }
  return [];
}

export interface WorkerDeps {
  providers?: Map<Channel, ChannelProvider>;
  batchSize?: number;
}

export class NotificationWorker {
  private providers: Map<Channel, ChannelProvider>;
  private batchSize: number;

  constructor(deps: WorkerDeps = {}) {
    this.providers = deps.providers ?? buildProviders();
    this.batchSize = deps.batchSize ?? 50;
  }

  // Claim + enqueue a batch of domain events. Returns how many events were claimed.
  async dispatchOnce(): Promise<number> {
    // Set-returning definer fn read as a table; service_role holds only EXECUTE.
    const events = await queryRead<{
      id: string;
      event_type: string;
      aggregate_type: string;
      aggregate_id: string;
    }>(
      SERVICE,
      `SELECT id, event_type, aggregate_type, aggregate_id
         FROM app.fn_outbox_claim($1)`,
      [this.batchSize],
    );
    if (!events || events.length === 0) return 0;
    for (const ev of events) {
      const plans = await planFor(ev);
      if (plans.length === 0) {
        // No recipient/template: mark the event processed so it is not re-claimed
        // (migration 0005 [SYS] helper; fn_notification_enqueue would return early
        // for INAPP+null recipient WITHOUT marking it).
        await callFn(SERVICE, 'fn_outbox_mark_processed', [ev.id]);
        continue;
      }
      for (const p of plans) {
        await callFn(SERVICE, 'fn_notification_enqueue', [
          ev.id,
          p.recipientProfileId,
          p.recipientPhone,
          p.channel,
          p.templateKey,
          p.params,
        ]);
      }
    }
    return events.length;
  }

  // Deliver all PENDING notifications (initial + retries). Returns counts. The DB owns
  // the SENT / PENDING(retry) / FAILED(dead-letter) transition inside fn_delivery_record;
  // the worker only reports provider-level success vs failure.
  async deliverPending(): Promise<{ sent: number; failed: number }> {
    const pending = await queryRead<{
      id: string;
      channel: Channel;
      recipient_phone: string | null;
      recipient_profile_id: string | null;
      template_key: string;
      params: Record<string, unknown>;
    }>(SERVICE, `SELECT * FROM app.fn_pending_notifications($1)`, [this.batchSize]);

    let sent = 0;
    let failed = 0;
    for (const n of pending) {
      const provider = this.providers.get(n.channel);
      const msg: OutboundMessage = {
        notificationId: n.id,
        channel: n.channel,
        recipientPhone: n.recipient_phone,
        recipientProfileId: n.recipient_profile_id,
        templateKey: n.template_key,
        params: n.params ?? {},
      };
      const result = provider
        ? await provider.send(msg)
        : { ok: false, error: `no provider for channel ${n.channel}` };
      await callFn(SERVICE, 'fn_delivery_record', [
        n.id,
        result.ok,
        result.providerRef ?? null,
        result.error ?? null,
      ]);
      if (result.ok) sent++;
      else failed++;
    }
    return { sent, failed };
  }

  // One full tick: claim/enqueue, then deliver.
  async tick(): Promise<{ claimed: number; sent: number; failed: number }> {
    const claimed = await this.dispatchOnce();
    const d = await this.deliverPending();
    return { claimed, ...d };
  }
}

// Standalone runner (used by a cron/sidecar). Not started by the API process.
export async function runWorkerLoop(
  intervalMs: number,
  stop: { stopped: boolean },
  log: (m: string) => void = () => {},
): Promise<void> {
  const worker = new NotificationWorker();
  while (!stop.stopped) {
    try {
      const r = await worker.tick();
      if (r.claimed || r.sent || r.failed) {
        log(`worker tick claimed=${r.claimed} sent=${r.sent} failed=${r.failed}`);
      }
    } catch (err) {
      log(`worker error: ${(err as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

export type Pool = pg.Pool; // re-export hint for the entrypoint
