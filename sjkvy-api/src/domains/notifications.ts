// domain: notifications (in-app inbox + [SYS] outbox/delivery machinery)
import type { Operation } from '../operation.js';
import { reqStr } from '../operation.js';
import { obj, uuid } from '../schemas.js';

export const notificationsOps: Operation[] = [
  {
    domain: 'notifications',
    opId: 'notifications.list',
    method: 'GET',
    path: '/notifications',
    auth: 'user',
    summary: 'List the caller’s in-app notifications (RLS: recipient = auth.uid()).',
    read: () => ({
      text: `SELECT id, template_key, params, channel, status, read_at, created_at
             FROM app.notifications
             WHERE recipient_profile_id = auth.uid()
             ORDER BY created_at DESC LIMIT 200`,
      values: [],
    }),
    notes: 'Scoped by policy p_notif_sel.',
  },
  {
    domain: 'notifications',
    opId: 'notification.mark_read',
    method: 'POST',
    path: '/notifications/:notificationId/read',
    auth: 'user',
    summary: 'Mark a notification read (DW: read_at set-once column grant).',
    write: (ctx) => ({
      // Only read_at is granted; policy p_notif_upd_read requires recipient = auth.uid()
      // and WITH CHECK read_at IS NOT NULL. Trigger tg_notif_read_once enforces set-once.
      text: `UPDATE app.notifications SET read_at = now()
             WHERE id = $1 AND recipient_profile_id = auth.uid()
             RETURNING id, read_at`,
      values: [reqStr(ctx.params.notificationId, 'notificationId')],
      single: true,
    }),
    paramsSchema: obj({ notificationId: uuid }, ['notificationId']),
    response: obj({ id: uuid, read_at: { type: 'string' } }),
    errors: ['E.AUTHZ.FORBIDDEN', 'E.STATE.INVALID_TRANSITION'],
    notes: 'read_at is immutable once set (E.STATE.INVALID_TRANSITION on rewrite).',
  },
  // --- [SYS] outbox / delivery worker machinery ---
  {
    domain: 'notifications',
    opId: 'jobs.outbox_claim',
    method: 'POST',
    path: '/jobs/outbox/claim',
    auth: 'service',
    summary: 'Worker claims unprocessed domain events (FOR UPDATE SKIP LOCKED) ([SYS]).',
    fn: 'fn_outbox_claim',
    args: (ctx) => [Number(ctx.body.limit ?? 50)],
    request: obj({ limit: { type: 'integer', minimum: 1, maximum: 500 } }),
    response: { type: 'array', items: { type: 'object' } },
    notes: 'service_role. Returns a batch of domain_events rows for the dispatcher.',
  },
  {
    domain: 'notifications',
    opId: 'jobs.dispatch',
    method: 'POST',
    path: '/jobs/outbox/enqueue',
    auth: 'service',
    summary: 'Worker enqueues a notification for an event (dedupe on dedupe_key) ([SYS]).',
    fn: 'fn_notification_enqueue',
    args: (ctx) => [
      reqStr(ctx.body.event_id, 'event_id'),
      ctx.body.recipient_profile_id ?? null,
      ctx.body.recipient_phone ?? null,
      reqStr(ctx.body.channel, 'channel'),
      reqStr(ctx.body.template_key, 'template_key'),
      ctx.body.params ?? {},
    ],
    request: obj(
      {
        event_id: uuid,
        recipient_profile_id: { ...uuid, nullable: true },
        recipient_phone: { type: 'string', nullable: true },
        channel: { type: 'string', enum: ['SMS', 'INAPP'] },
        template_key: { type: 'string' },
        params: { type: 'object' },
      },
      ['event_id', 'channel', 'template_key'],
    ),
    response: obj({}),
    notes: 'service_role. Marks the event processed; ON CONFLICT (dedupe_key) DO NOTHING.',
  },
  {
    domain: 'notifications',
    opId: 'jobs.delivery_record',
    method: 'POST',
    path: '/jobs/notifications/:notificationId/delivery',
    auth: 'service',
    summary: 'Record a delivery attempt result (SENT/retry/FAILED per config) ([SYS]).',
    fn: 'fn_delivery_record',
    args: (ctx) => [
      reqStr(ctx.params.notificationId, 'notificationId'),
      ctx.body.ok === true,
      ctx.body.provider_ref ?? null,
      ctx.body.error ?? null,
    ],
    paramsSchema: obj({ notificationId: uuid }, ['notificationId']),
    request: obj(
      {
        ok: { type: 'boolean' },
        provider_ref: { type: 'string', nullable: true },
        error: { type: 'string', nullable: true },
      },
      ['ok'],
    ),
    response: obj({}),
    notes: 'service_role. Attempt count vs notif_max_attempts config decides FAILED.',
  },
  {
    domain: 'notifications',
    opId: 'jobs.idem_purge',
    method: 'POST',
    path: '/jobs/idempotency/purge',
    auth: 'service',
    summary: 'Purge expired idempotency keys ([SYS]).',
    fn: 'fn_idem_purge',
    args: () => [],
    response: { type: 'integer', description: 'rows purged' },
    notes: 'service_role scheduler.',
  },
];
