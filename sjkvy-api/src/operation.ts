// operation.ts — the declarative contract for every endpoint. One Operation object
// fully describes an endpoint: how it authenticates, which database function it calls
// (or which scoped read it runs), how request fields map to positional function args,
// and its request/response/error schemas. The router (src/router.ts), the OpenAPI
// generator (scripts/export-openapi.ts) and the endpoint docs (scripts/gen-docs.ts)
// are all driven by this single source of truth — so the spec can never drift from
// the implementation. This keeps the API genuinely thin: there is almost no per-
// endpoint imperative code, only data describing the mapping to the DB catalogue.
import type { FastifyRequest } from 'fastify';
import type { AuthMode } from './auth.js';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT';

// JSON Schema fragment (kept loose; used for both validation and OpenAPI).
export type Schema = Record<string, unknown>;

// Context handed to arg/read builders: the parsed request pieces plus the caller's id.
export interface OpCtx {
  params: Record<string, string>;
  query: Record<string, unknown>;
  body: Record<string, unknown>;
  uid: string | null;
  // For idempotent ops: the client Idempotency-Key (uuid) and a hash of the request.
  idemKey: string | null;
  idemHash: string | null;
  req: FastifyRequest;
}

export interface Operation {
  domain: string;
  opId: string; // catalogue op id, e.g. 'application.submit'
  method: HttpMethod;
  path: string; // Fastify path, e.g. '/applications/:id/submit'
  auth: AuthMode;
  summary: string;

  // --- Mutation path: call a catalogue function ---
  // The DB function name (e.g. 'fn_submit_application'). Omit for pure reads.
  fn?: string;
  // Marks that the function's last two params are (p_idem uuid, p_hash text). The
  // router requires an Idempotency-Key header and appends [idemKey, idemHash].
  idempotent?: boolean;
  // Build the positional args from the request. For idempotent ops, return ONLY the
  // business args; the router appends the idempotency pair.
  args?: (ctx: OpCtx) => unknown[];
  // HTTP status on success (default 200; use 201 for creates).
  successStatus?: number;

  // --- Read path: a narrow, RLS-scoped SELECT ---
  // Returns bounded SQL + values. Runs under the caller's role, so RLS filters rows.
  read?: (ctx: OpCtx) => { text: string; values: unknown[]; single?: boolean };

  // --- Direct-write path: a column-limited INSERT/UPDATE the DB grants to clients ---
  // For the 6 [DW] operations the catalogue implements via RLS policy + column GRANT
  // (attendance mark, session create, result record, profile update, mark-read, draft
  // autosave) rather than a function. Runs the parameterized DML under the caller's
  // role; the WITH CHECK policy and column grant enforce authorization in the DB.
  // Use RETURNING so the row is echoed back. This is NOT business logic in the API —
  // it is exactly the write the database already authorizes for `authenticated`.
  write?: (ctx: OpCtx) => { text: string; values: unknown[]; single?: boolean };

  // --- Documentation / validation ---
  request?: Schema; // body schema
  paramsSchema?: Schema;
  querySchema?: Schema;
  response?: Schema;
  errors?: string[]; // domain error codes this op can return (for docs)
  notes?: string; // security / behavior notes for the docs table
  // Optional per-route rate-limit override (e.g. tighter for public enumeration-prone
  // endpoints like certificate verification). Falls back to the global limit.
  rateLimit?: { max: number; timeWindow: string };
}

// Helper: assert a required uuid path/body field, giving a clean 422 instead of a
// deep DB error when the client omits it.
export function reqStr(v: unknown, field: string): string {
  if (typeof v !== 'string' || v.length === 0) {
    const e = new Error(`E.VAL.FAILED`);
    (e as Error & { detail?: string }).detail = JSON.stringify({ field, rule: 'required' });
    throw e;
  }
  return v;
}
