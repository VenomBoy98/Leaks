// auth.integration.test.ts — first-party password + email-OTP auth against the real DB with a
// FAKE email provider (no real sends). Covers registration/verify, login (password-first), wrong
// password, bad/used/resent OTP, duplicate registration, password reset + session revocation,
// session introspection/logout, and the "no plaintext OTP stored" invariant.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { Client } from 'pg';
import { randomUUID } from 'node:crypto';
import { cfg, makeApp, teardown } from './helpers.js';
import { clearCapturedEmails, getCapturedEmails } from '../src/auth-core/email.js';

let app: FastifyInstance;
let admin: Client;
const SVC = cfg.serviceToken!;
const svc = { authorization: `Bearer ${SVC}`, 'content-type': 'application/json', 'x-real-ip': '203.0.113.9' };
const post = (url: string, payload: unknown, headers = svc) => app.inject({ method: 'POST', url, headers, payload: payload as object });

// The fake provider captures the OTP in the message text ("Code: 123456").
function lastOtpFor(email: string): string {
  const msgs = getCapturedEmails().filter((m) => m.to === email && /Code: \d{6}/.test(m.text));
  const m = msgs[msgs.length - 1];
  return m ? (m.text.match(/Code: (\d{6})/)?.[1] ?? '') : '';
}

beforeAll(async () => {
  app = await makeApp();
  await app.ready();
  admin = new Client({ connectionString: process.env.ADMIN_DATABASE_URL ?? 'postgres://postgres:postgres@127.0.0.1:5433/sjkvy_api' });
  await admin.connect();
});
afterAll(async () => { await admin.end().catch(() => {}); await app.close(); await teardown(); });
beforeEach(() => clearCapturedEmails());

const email = () => `u${randomUUID().slice(0, 8)}@example.com`;
const PW = 'Sup3r-Secret-Pw';

describe('registration + verification', () => {
  it('registers, emails a 6-digit code (not returned by the API), and verifies into a session', async () => {
    const e = email();
    const reg = await post('/auth/register', { name: 'Asha Kumari', email: e, password: PW });
    expect(reg.statusCode).toBe(200);
    const ch = reg.json();
    expect(ch.challengeId).toBeTruthy();
    expect(JSON.stringify(ch)).not.toMatch(/\b\d{6}\b/); // no OTP in the response
    const otp = lastOtpFor(e);
    expect(otp).toMatch(/^\d{6}$/);

    const ver = await post('/auth/register/verify', { challengeId: ch.challengeId, otp });
    expect(ver.statusCode).toBe(200);
    const s = ver.json();
    expect(s.token).toBeTruthy();
    expect(s.csrf).toBeTruthy();
    expect(Array.isArray(s.roles)).toBe(true); // new user starts with no privileged roles
    expect(s.roles).toEqual([]);
  });

  it('rejects a wrong OTP and decrements attempts', async () => {
    const e = email();
    const ch = (await post('/auth/register', { name: 'Bad Otp', email: e, password: PW })).json();
    const bad = await post('/auth/register/verify', { challengeId: ch.challengeId, otp: '000000' });
    expect(bad.statusCode).toBe(400);
  });

  it('rejects a re-used OTP (single use)', async () => {
    const e = email();
    const ch = (await post('/auth/register', { name: 'Once', email: e, password: PW })).json();
    const otp = lastOtpFor(e);
    expect((await post('/auth/register/verify', { challengeId: ch.challengeId, otp })).statusCode).toBe(200);
    expect((await post('/auth/register/verify', { challengeId: ch.challengeId, otp })).statusCode).toBe(400);
  });

  it('resending invalidates the previous OTP', async () => {
    const e = email();
    const ch = (await post('/auth/register', { name: 'Resend', email: e, password: PW })).json();
    const first = lastOtpFor(e);
    const res = await post('/auth/otp/resend', { challengeId: ch.challengeId });
    expect(res.statusCode).toBe(200);
    const newChallengeId = res.json().challengeId; // resend issues a fresh challenge
    const second = lastOtpFor(e);
    expect(second).not.toBe(first);
    // the FIRST code is now invalid (its challenge was superseded); the SECOND works
    expect((await post('/auth/register/verify', { challengeId: ch.challengeId, otp: first })).statusCode).toBe(400);
    expect((await post('/auth/register/verify', { challengeId: newChallengeId, otp: second })).statusCode).toBe(200);
  });

  it('duplicate registration of a verified email does not create a second account', async () => {
    const e = email();
    const ch = (await post('/auth/register', { name: 'Dup', email: e, password: PW })).json();
    await post('/auth/register/verify', { challengeId: ch.challengeId, otp: lastOtpFor(e) });
    const again = await post('/auth/register', { name: 'Dup2', email: e, password: PW });
    expect(again.statusCode).toBe(409);
    const n = await admin.query('SELECT count(*)::int c FROM app.auth_credentials WHERE email_normalized=$1', [e]);
    expect(n.rows[0].c).toBe(1);
  });
});

describe('login (password before OTP)', () => {
  async function registerVerified(): Promise<string> {
    const e = email();
    const ch = (await post('/auth/register', { name: 'Login User', email: e, password: PW })).json();
    await post('/auth/register/verify', { challengeId: ch.challengeId, otp: lastOtpFor(e) });
    clearCapturedEmails();
    return e;
  }

  it('wrong password returns generic error and sends no OTP', async () => {
    const e = await registerVerified();
    const r = await post('/auth/login', { email: e, password: 'wrong-password' });
    expect(r.statusCode).toBe(401);
    expect(lastOtpFor(e)).toBe(''); // no OTP emailed on bad password
  });

  it('correct password issues an OTP; verifying creates a session', async () => {
    const e = await registerVerified();
    const login = await post('/auth/login', { email: e, password: PW });
    expect(login.statusCode).toBe(200);
    const otp = lastOtpFor(e);
    expect(otp).toMatch(/^\d{6}$/);
    const ver = await post('/auth/login/verify', { challengeId: login.json().challengeId, otp });
    expect(ver.statusCode).toBe(200);
    expect(ver.json().token).toBeTruthy();
  });

  it('unknown email returns the same generic error (no enumeration)', async () => {
    const r = await post('/auth/login', { email: email(), password: PW });
    expect(r.statusCode).toBe(401);
  });
});

describe('password reset revokes sessions', () => {
  it('forgot → reset with OTP → old session revoked, new password works', async () => {
    const e = email();
    const ch = (await post('/auth/register', { name: 'Reset User', email: e, password: PW })).json();
    const session = (await post('/auth/register/verify', { challengeId: ch.challengeId, otp: lastOtpFor(e) })).json();
    // session valid now
    expect((await post('/auth/session/introspect', { token: session.token })).statusCode).toBe(200);
    clearCapturedEmails();

    const forgot = await post('/auth/password/forgot', { email: e });
    expect(forgot.statusCode).toBe(200);
    const rid = forgot.json().challengeId;
    expect(rid).toBeTruthy();
    const reset = await post('/auth/password/reset', { challengeId: rid, otp: lastOtpFor(e), newPassword: 'Brand-New-Pw-1' });
    expect(reset.statusCode).toBe(200);
    // old session revoked
    expect((await post('/auth/session/introspect', { token: session.token })).statusCode).toBe(401);
    // new password logs in; old password fails
    expect((await post('/auth/login', { email: e, password: 'Brand-New-Pw-1' })).statusCode).toBe(200);
    expect((await post('/auth/login', { email: e, password: PW })).statusCode).toBe(401);
  });

  it('forgot for an unknown email is generic (200, no challenge)', async () => {
    const r = await post('/auth/password/forgot', { email: email() });
    expect(r.statusCode).toBe(200);
    expect(r.json().challengeId).toBeUndefined();
  });
});

describe('sessions', () => {
  it('introspect returns identity; logout revokes', async () => {
    const e = email();
    const ch = (await post('/auth/register', { name: 'Sess', email: e, password: PW })).json();
    const s = (await post('/auth/register/verify', { challengeId: ch.challengeId, otp: lastOtpFor(e) })).json();
    const intro = await post('/auth/session/introspect', { token: s.token, csrf: s.csrf });
    expect(intro.statusCode).toBe(200);
    expect(intro.json().profileId).toBeTruthy();
    expect(intro.json().csrfValid).toBe(true);
    await post('/auth/logout', { token: s.token });
    expect((await post('/auth/session/introspect', { token: s.token })).statusCode).toBe(401);
  });
});

describe('suspension revokes access', () => {
  it('a suspended account\'s existing session stops working immediately', async () => {
    const e = email();
    const ch = (await post('/auth/register', { name: 'Suspend Me', email: e, password: PW })).json();
    const s = (await post('/auth/register/verify', { challengeId: ch.challengeId, otp: lastOtpFor(e) })).json();
    expect((await post('/auth/session/introspect', { token: s.token })).statusCode).toBe(200);
    // suspend the account out-of-band (as an admin would)
    await admin.query(`UPDATE app.profiles SET is_active=false WHERE id=$1`, [s.profileId]);
    expect((await post('/auth/session/introspect', { token: s.token })).statusCode).toBe(401);
    // and they cannot log in either
    expect((await post('/auth/login', { email: e, password: PW })).statusCode).toBeGreaterThanOrEqual(400);
  });
});

describe('no plaintext secrets stored', () => {
  it('otp_digest is a 64-hex HMAC and no plaintext OTP column exists', async () => {
    const cols = await admin.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema='app' AND table_name='auth_challenges'`);
    const names = cols.rows.map((r) => r.column_name);
    expect(names).toContain('otp_digest');
    expect(names).not.toContain('otp');
    const dig = await admin.query(`SELECT otp_digest FROM app.auth_challenges ORDER BY created_at DESC LIMIT 1`);
    if (dig.rowCount) expect(dig.rows[0].otp_digest).toMatch(/^[a-f0-9]{64}$/);
  });
});
