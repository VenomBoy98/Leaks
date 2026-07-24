// db.ts — the ONLY place the API touches PostgreSQL. It preserves the verified
// security model by running every request inside a transaction that:
//   1. sets `request.jwt.claims` (so the database's auth.uid() returns the caller), and
//   2. SET LOCAL ROLE to exactly one of anon | authenticated | service_role.
// The API then invokes a catalogue function or a narrow RLS-scoped SELECT. All
// authorization, state transitions, idempotency (fn_idem_begin/finish) and row
// locking happen INSIDE the database. The API adds no business logic.
import pg from 'pg';
import { mapPgError } from './errors.js';

export type DbRole = 'anon' | 'authenticated' | 'service_role';

// Identity + role for one unit of work. uid is the authenticated profile id (or null
// for anon). It is derived by the API from a verified JWT — never from client input.
export interface Actor {
  role: DbRole;
  uid: string | null;
}

const ROLES: Record<DbRole, true> = {
  anon: true,
  authenticated: true,
  service_role: true,
};

let pool: pg.Pool;

export function initDb(databaseUrl: string): pg.Pool {
  pool = new pg.Pool({
    connectionString: databaseUrl,
    max: Number(process.env.PG_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    // Parse int8 counts as JS numbers (safe for this domain's magnitudes).
    application_name: 'sjkvy-api',
  });
  return pool;
}

export async function closeDb(): Promise<void> {
  await pool?.end();
}

// Run `body` inside a transaction bound to `actor`. The role is validated against a
// fixed allow-list before interpolation (it can never be SET ROLE'd to anything a
// client controls). Identity is passed as a parameter, not string-concatenated.
async function withActor<T>(
  actor: Actor,
  body: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  if (!ROLES[actor.role]) throw new Error(`illegal role ${actor.role}`);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // set_config(..., true) = LOCAL to this transaction; auto-reset on COMMIT/ROLLBACK.
    // Always a valid JSON object — '{}' for anonymous/service so auth.uid() -> NULL
    // (an empty string is NOT valid JSON and would break the ::jsonb cast).
    const claims = actor.uid
      ? JSON.stringify({ sub: actor.uid, role: actor.role })
      : '{}';
    await client.query(`SELECT set_config('request.jwt.claims', $1, true)`, [claims]);
    // Role name is from the fixed allow-list above; safe to interpolate.
    await client.query(`SET LOCAL ROLE ${actor.role}`);
    const out = await body(client);
    await client.query('COMMIT');
    return out;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw mapPgError(err);
  } finally {
    client.release();
  }
}

// callFn — invoke a catalogue function `app.<fn>(...)` positionally and return its
// single jsonb/scalar result. This is the mutation path: the function enforces authz,
// state and (when it takes p_idem/p_hash) idempotency + concurrency safety.
export async function callFn<T = unknown>(
  actor: Actor,
  fn: string,
  args: unknown[],
): Promise<T> {
  if (!/^fn_[a-z_]+$/.test(fn)) throw new Error(`illegal function name ${fn}`);
  const placeholders = args.map((_, i) => `$${i + 1}`).join(', ');
  return withActor(actor, async (client) => {
    const res = await client.query(
      `SELECT app.${fn}(${placeholders}) AS result`,
      args,
    );
    return res.rows[0]?.result as T;
  });
}

// queryRead — a narrow, parameterized SELECT executed under the caller's role so RLS
// scopes the rows. Used for Plane-A reads the database exposes via GRANT SELECT +
// policy (never a raw table dump; callers pass a bounded query text + values).
export async function queryRead<T = Record<string, unknown>>(
  actor: Actor,
  text: string,
  values: unknown[] = [],
): Promise<T[]> {
  return withActor(actor, async (client) => {
    const res = await client.query(text, values);
    return res.rows as T[];
  });
}

// elevatedActor — for the documented "[SYS]: EF passes a verified caller" pattern:
// a user-authenticated request that must invoke a service_role-granted function
// (fn_finalize_upload, fn_authorize_doc_view). We run as service_role (which holds the
// EXECUTE grant) but carry the VERIFIED user uid so (a) it is passed as p_caller for the
// function's own ownership re-check and (b) auth.uid() records the real actor in audit.
// This does NOT bypass authorization: the function's explicit p_caller check is the gate.
export function elevatedActor(uid: string): Actor {
  return { role: 'service_role', uid };
}

// Lightweight liveness/ready probe against the pool.
export async function pingDb(): Promise<boolean> {
  try {
    const c = await pool.connect();
    try {
      await c.query('SELECT 1');
      return true;
    } finally {
      c.release();
    }
  } catch {
    return false;
  }
}
