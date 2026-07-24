// idempotency.ts — the API's half of the idempotency contract. The DATABASE owns the
// guarantee (fn_idem_begin serializes on (op, actor, key) with FOR UPDATE and replays
// the stored response); the API merely forwards the client's Idempotency-Key and a
// stable hash of the request so the DB can detect same-key/different-payload misuse.
import { createHash } from 'node:crypto';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v);
}

// Canonical request hash: method + path + sorted JSON body. Deterministic so a retried
// identical request hashes equal, while a different payload under the same key differs
// (the DB then raises E.CONFLICT.DUPLICATE, surfaced as 409).
export function requestHash(
  method: string,
  path: string,
  body: unknown,
): string {
  const canonical = stableStringify(body ?? {});
  return createHash('sha256')
    .update(`${method} ${path}\n${canonical}`)
    .digest('hex')
    .slice(0, 32);
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}
