// auth-admin.ts — secure server-side CLI for the first super-admin bootstrap and role management.
// There is intentionally NO public bootstrap endpoint. Run on the server with DB access:
//   npm run auth:bootstrap-superadmin -- <email> [centreId]
//   npm run auth:grant-role -- <email> <role> [centreId]
//   npm run auth:revoke-role -- <email> <role> [centreId]
// The account must already exist (registered + email-verified via the normal flow); this only
// changes roles. Every change writes an app.auth_security_events row.
import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL is required'); process.exit(1); }

const [cmd, ...args] = process.argv.slice(2);
const norm = (e: string) => e.trim().toLowerCase();

async function withService<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    await c.query(`SET LOCAL ROLE service_role`);
    const out = await fn(c);
    await c.query('COMMIT');
    return out;
  } catch (e) { await c.query('ROLLBACK').catch(() => {}); throw e; }
  finally { c.release(); await pool.end(); }
}

async function resolveProfile(c: pg.PoolClient, email: string): Promise<string> {
  const r = await c.query<{ profile_id: string; email_verified_at: Date | null }>(
    `SELECT profile_id, email_verified_at FROM app.auth_credentials WHERE email_normalized=$1`, [norm(email)]);
  if (!r.rowCount) throw new Error(`No account for ${email}. Ask them to register + verify first.`);
  if (!r.rows[0].email_verified_at) throw new Error(`Account ${email} is not email-verified yet.`);
  return r.rows[0].profile_id;
}
async function resolveCentre(c: pg.PoolClient, given?: string): Promise<string> {
  if (given) return given;
  const r = await c.query<{ id: string }>(`SELECT id FROM app.centres ORDER BY created_at LIMIT 1`);
  if (!r.rowCount) throw new Error('No centre exists to attach the membership to; pass a centreId.');
  return r.rows[0].id;
}
async function setMembership(c: pg.PoolClient, profileId: string, centreId: string, role: string, active: boolean): Promise<string> {
  const m = await c.query<{ id: string }>(
    `INSERT INTO app.staff_memberships (profile_id, centre_id, role_code)
     VALUES ($1,$2,$3)
     ON CONFLICT (profile_id, centre_id, role_code)
     DO UPDATE SET is_active=$4, deactivated_at=CASE WHEN $4 THEN NULL ELSE now() END, updated_at=now()
     RETURNING id`, [profileId, centreId, role, active]);
  await c.query(`INSERT INTO app.auth_security_events (profile_id, event_type, summary)
                 VALUES ($1,$2,$3)`,
    [profileId, active ? 'role.granted.cli' : 'role.revoked.cli', JSON.stringify({ role, centre: centreId, via: 'cli' })]);
  return m.rows[0].id;
}

async function main() {
  if (cmd === 'bootstrap-superadmin') {
    const [email, centreId] = args;
    if (!email) throw new Error('usage: bootstrap-superadmin <email> [centreId]');
    await withService(async (c) => {
      const pid = await resolveProfile(c, email);
      const cid = await resolveCentre(c, centreId);
      await setMembership(c, pid, cid, 'super_admin', true);
      console.log(`OK: ${email} is now super_admin (centre ${cid}).`);
    });
  } else if (cmd === 'grant-role' || cmd === 'revoke-role') {
    const [email, role, centreId] = args;
    if (!email || !role) throw new Error(`usage: ${cmd} <email> <role> [centreId]`);
    await withService(async (c) => {
      const valid = await c.query(`SELECT 1 FROM app.roles WHERE code=$1`, [role]);
      if (!valid.rowCount) throw new Error(`Unknown role '${role}'.`);
      if (role === 'super_admin' && cmd === 'grant-role') throw new Error('Use bootstrap-superadmin to grant super_admin.');
      const pid = await resolveProfile(c, email);
      const cid = await resolveCentre(c, centreId);
      await setMembership(c, pid, cid, role, cmd === 'grant-role');
      console.log(`OK: ${cmd === 'grant-role' ? 'granted' : 'revoked'} ${role} for ${email} (centre ${cid}).`);
    });
  } else {
    console.error('commands: bootstrap-superadmin <email> [centreId] | grant-role <email> <role> [centreId] | revoke-role <email> <role> [centreId]');
    process.exit(1);
  }
}
main().catch((e) => { console.error('ERROR:', (e as Error).message); process.exit(1); });
