// auth-repo.ts — first-party auth business logic over the service-only auth_* tables. Runs in
// service_role transactions (db.withServiceTx). Enforces: password-before-OTP, generic responses
// (no account enumeration), OTP single-use + expiry + attempts, resend cooldown + hourly caps,
// new-OTP-invalidates-old, delivery only on confirmed email hand-off, atomic OTP consumption,
// opaque session issue/rotate/revoke, and password reset that revokes all sessions. Secrets are
// only ever stored as digests. Nothing sensitive is returned or logged.
import type { PoolClient } from 'pg';
import { withServiceTx } from './db.js';
import type { Config } from './config.js';
import { hashPassword, verifyPassword, generateOtp, otpDigest, sha256, newSessionToken, digestEquals } from './auth-core/crypto.js';
import { getEmailProvider, otpEmail, passwordChangedEmail, type EmailProvider } from './auth-core/email.js';

export type Purpose = 'registration' | 'login' | 'password_reset';

export class AuthError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

const MAX_PASSWORD_FAILS = 5;
const PASSWORD_LOCK_SEC = 15 * 60;

const normalizeEmail = (e: string): string => e.trim().toLowerCase();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface Challenge { challengeId: string; resendAvailableAt: string; expiresAt: string; email: string; purpose: Purpose }
export interface SessionResult { token: string; csrf: string; expiresAt: string; profileId: string; roles: string[]; emailVerified: boolean }

export function createAuthRepo(cfg: Config) {
  const email: EmailProvider = getEmailProvider(cfg.auth);
  const otpSecret = cfg.auth.otpHmacSecret ?? 'dev-only-otp-secret-please-change-32chars';
  const RESEND_COOLDOWN_MS = cfg.auth.otpResendCooldownSec * 1000;
  const HOURLY_EMAIL_CAP = cfg.auth.otpHourlyEmailCap;
  const HOURLY_IP_CAP = cfg.auth.otpHourlyIpCap;
  const MAX_ATTEMPTS = cfg.auth.otpMaxAttempts;
  const ipHash = (ip: string): string => sha256(`ip:${ip}`);

  // Derive the caller's effective roles: active staff memberships + derived applicant/student.
  async function resolveRoles(client: PoolClient, profileId: string): Promise<string[]> {
    const staff = await client.query<{ role_code: string }>(
      `SELECT DISTINCT role_code FROM app.staff_memberships WHERE profile_id=$1 AND is_active`, [profileId]);
    const roles = staff.rows.map((r) => r.role_code);
    const app = await client.query(`SELECT 1 FROM app.applicants WHERE profile_id=$1 LIMIT 1`, [profileId]);
    if (app.rowCount) roles.push('applicant');
    // a student is linked through their applicant record (students.applicant_id -> applicants.profile_id)
    const stu = await client.query(
      `SELECT 1 FROM app.students s JOIN app.applicants a ON a.id = s.applicant_id WHERE a.profile_id=$1 LIMIT 1`, [profileId]);
    if (stu.rowCount) roles.push('student');
    return roles;
  }

  async function assertNotRateLimited(client: PoolClient, emailNorm: string, ip: string): Promise<void> {
    const rows = await client.query<{ email_count: string; ip_count: string; last_at: Date | null }>(
      `SELECT
         (SELECT count(*) FROM app.auth_challenges WHERE email_normalized=$1 AND created_at > now()-interval '1 hour') AS email_count,
         (SELECT count(*) FROM app.auth_challenges WHERE ip_hash=$2 AND created_at > now()-interval '1 hour') AS ip_count,
         (SELECT max(created_at) FROM app.auth_challenges WHERE email_normalized=$1) AS last_at`,
      [emailNorm, ipHash(ip)]);
    const r = rows.rows[0];
    if (r.last_at && Date.now() - new Date(r.last_at).getTime() < RESEND_COOLDOWN_MS) {
      throw new AuthError(429, 'E.RATE.COOLDOWN', 'Please wait before requesting another code.');
    }
    if (Number(r.email_count) >= HOURLY_EMAIL_CAP || Number(r.ip_count) >= HOURLY_IP_CAP) {
      throw new AuthError(429, 'E.RATE.LIMIT', 'Too many requests. Try again later.');
    }
  }

  // Issue an OTP inside an existing tx: invalidate the prior delivered/unconsumed one for this
  // (profile,purpose), insert a fresh challenge, email it, and mark delivered ONLY on send success
  // (a failed send rolls the whole tx back, so nothing is falsely marked delivered).
  async function issueChallenge(
    client: PoolClient, profileId: string, emailNorm: string, purpose: Purpose, ip: string, credentialVersion: number,
  ): Promise<Challenge> {
    await client.query(
      `UPDATE app.auth_challenges SET consumed_at=now()
        WHERE profile_id=$1 AND purpose=$2 AND delivered_at IS NOT NULL AND consumed_at IS NULL`,
      [profileId, purpose]);
    const otp = generateOtp();
    const ins = await client.query<{ id: string; expires_at: Date; created_at: Date }>(
      `INSERT INTO app.auth_challenges
         (profile_id, email_normalized, purpose, otp_digest, ip_hash, expires_at, attempts_remaining, credential_version)
       VALUES ($1,$2,$3,$4,$5, now()+interval '5 minutes', $6, $7)
       RETURNING id, expires_at, created_at`,
      [profileId, emailNorm, purpose, otpDigest(otp, otpSecret), ipHash(ip), MAX_ATTEMPTS, credentialVersion]);
    const row = ins.rows[0];
    const msg = otpEmail(purpose, otp);
    await email.send({ ...msg, to: emailNorm }); // throws on failure -> tx rolls back
    await client.query(`UPDATE app.auth_challenges SET delivered_at=now() WHERE id=$1`, [row.id]);
    await client.query(
      `INSERT INTO app.auth_security_events (profile_id, event_type, ip_hash, summary)
       VALUES ($1,$2,$3,$4)`,
      [profileId, `otp.issued.${purpose}`, ipHash(ip), JSON.stringify({ purpose })]);
    return {
      challengeId: row.id,
      resendAvailableAt: new Date(new Date(row.created_at).getTime() + RESEND_COOLDOWN_MS).toISOString(),
      expiresAt: new Date(row.expires_at).toISOString(),
      email: emailNorm, purpose,
    };
  }

  async function createSession(client: PoolClient, profileId: string, ip: string): Promise<SessionResult> {
    const token = newSessionToken();
    const csrf = newSessionToken();
    await client.query(
      `INSERT INTO app.auth_sessions (profile_id, token_digest, csrf_digest, expires_at)
       VALUES ($1,$2,$3, now()+ ($4 || ' seconds')::interval)`,
      [profileId, sha256(token), sha256(csrf), String(cfg.auth.sessionTtlSec)]);
    const roles = await resolveRoles(client, profileId);
    await client.query(
      `INSERT INTO app.auth_security_events (profile_id, event_type, ip_hash) VALUES ($1,'session.created',$2)`,
      [profileId, ipHash(ip)]);
    return { token, csrf, expiresAt: new Date(Date.now() + cfg.auth.sessionTtlSec * 1000).toISOString(), profileId, roles, emailVerified: true };
  }

  return {
    // ---------- registration ----------
    async register(input: { name: string; email: string; password: string; ip: string }): Promise<Challenge> {
      const emailNorm = normalizeEmail(input.email);
      if (!EMAIL_RE.test(emailNorm)) throw new AuthError(422, 'E.VAL.EMAIL', 'Enter a valid email address.');
      if (!input.password || input.password.length < 8) throw new AuthError(422, 'E.VAL.PASSWORD', 'Password must be at least 8 characters.');
      if (!input.name || input.name.trim().length < 2) throw new AuthError(422, 'E.VAL.NAME', 'Enter your name.');
      return withServiceTx(async (client) => {
        await assertNotRateLimited(client, emailNorm, input.ip);
        const existing = await client.query<{ profile_id: string; email_verified_at: Date | null }>(
          `SELECT profile_id, email_verified_at FROM app.auth_credentials WHERE email_normalized=$1`, [emailNorm]);
        let profileId: string;
        let credVersion = 1;
        if (existing.rowCount) {
          // Verified account already exists -> generic response, no new challenge (anti-enumeration
          // is handled at the route by returning the same shape). We still avoid re-registering.
          if (existing.rows[0].email_verified_at) {
            throw new AuthError(409, 'E.AUTH.EXISTS', 'If this email can be registered, a code has been sent.');
          }
          // Unverified: refresh the password + name and re-issue a code (safe re-registration).
          profileId = existing.rows[0].profile_id;
          const cv = await client.query<{ credential_version: number }>(
            `UPDATE app.auth_credentials SET password_hash=$2, updated_at=now() WHERE profile_id=$1 RETURNING credential_version`,
            [profileId, await hashPassword(input.password)]);
          credVersion = cv.rows[0].credential_version;
          await client.query(`UPDATE app.profiles SET full_name=$2, updated_at=now() WHERE id=$1`, [profileId, input.name.trim()]);
        } else {
          const prof = await client.query<{ id: string }>(
            `INSERT INTO app.profiles (id, full_name, preferred_lang, is_active) VALUES (gen_random_uuid(),$1,'en',true) RETURNING id`,
            [input.name.trim()]);
          profileId = prof.rows[0].id;
          await client.query(
            `INSERT INTO app.auth_credentials (profile_id, email_normalized, password_hash) VALUES ($1,$2,$3)`,
            [profileId, emailNorm, await hashPassword(input.password)]);
        }
        return issueChallenge(client, profileId, emailNorm, 'registration', input.ip, credVersion);
      });
    },

    // ---------- login (verify password FIRST, then issue OTP) ----------
    async login(input: { email: string; password: string; ip: string }): Promise<Challenge> {
      const emailNorm = normalizeEmail(input.email);
      const generic = new AuthError(401, 'E.AUTH.CREDENTIALS', 'Invalid email or password.');
      if (!EMAIL_RE.test(emailNorm) || !input.password) throw generic;
      return withServiceTx(async (client) => {
        const cred = await client.query<{ profile_id: string; password_hash: string; email_verified_at: Date | null; failed_password_attempts: number; password_locked_until: Date | null; credential_version: number; is_active: boolean }>(
          `SELECT c.profile_id, c.password_hash, c.email_verified_at, c.failed_password_attempts,
                  c.password_locked_until, c.credential_version, p.is_active
             FROM app.auth_credentials c JOIN app.profiles p ON p.id=c.profile_id
            WHERE c.email_normalized=$1`, [emailNorm]);
        if (!cred.rowCount) { await verifyPassword('$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', input.password).catch(() => {}); throw generic; }
        const c = cred.rows[0];
        if (c.password_locked_until && new Date(c.password_locked_until) > new Date()) {
          throw new AuthError(429, 'E.AUTH.LOCKED', 'Too many attempts. Try again later.');
        }
        const ok = await verifyPassword(c.password_hash, input.password);
        if (!ok) {
          const fails = c.failed_password_attempts + 1;
          await client.query(
            `UPDATE app.auth_credentials SET failed_password_attempts=$2::int,
               password_locked_until = CASE WHEN $2::int >= $3::int THEN now()+make_interval(secs => $4::int) ELSE password_locked_until END
             WHERE profile_id=$1`,
            [c.profile_id, fails, MAX_PASSWORD_FAILS, PASSWORD_LOCK_SEC]);
          await client.query(`INSERT INTO app.auth_security_events (profile_id,event_type,ip_hash) VALUES ($1,'login.password_failed',$2)`, [c.profile_id, ipHash(input.ip)]);
          throw generic;
        }
        await client.query(`UPDATE app.auth_credentials SET failed_password_attempts=0, password_locked_until=NULL WHERE profile_id=$1`, [c.profile_id]);
        // Suspended/inactive or unverified accounts: no OTP, generic response.
        if (!c.is_active) throw generic;
        if (!c.email_verified_at) throw new AuthError(403, 'E.AUTH.UNVERIFIED', 'Please verify your email first.');
        await assertNotRateLimited(client, emailNorm, input.ip);
        return issueChallenge(client, c.profile_id, emailNorm, 'login', input.ip, c.credential_version);
      });
    },

    // ---------- verify an OTP for registration/login -> create session ----------
    async verify(input: { challengeId: string; otp: string; ip: string }): Promise<SessionResult> {
      return withServiceTx(async (client) => {
        // Lock the row so concurrent verifies can't both consume it.
        const q = await client.query<{ id: string; profile_id: string; purpose: Purpose; otp_digest: string; expires_at: Date; attempts_remaining: number; consumed_at: Date | null; email_normalized: string }>(
          `SELECT id, profile_id, purpose, otp_digest, expires_at, attempts_remaining, consumed_at, email_normalized
             FROM app.auth_challenges WHERE id=$1 FOR UPDATE`, [input.challengeId]);
        if (!q.rowCount) throw new AuthError(400, 'E.OTP.INVALID', 'Invalid or expired code.');
        const ch = q.rows[0];
        if (ch.purpose === 'password_reset') throw new AuthError(400, 'E.OTP.INVALID', 'Invalid or expired code.');
        if (ch.consumed_at || new Date(ch.expires_at) < new Date() || ch.attempts_remaining <= 0) {
          throw new AuthError(400, 'E.OTP.INVALID', 'Invalid or expired code.');
        }
        const match = digestEquals(ch.otp_digest, otpDigest(String(input.otp), otpSecret));
        if (!match) {
          await client.query(`UPDATE app.auth_challenges SET attempts_remaining=attempts_remaining-1 WHERE id=$1`, [ch.id]);
          throw new AuthError(400, 'E.OTP.INVALID', 'Invalid or expired code.');
        }
        await client.query(`UPDATE app.auth_challenges SET consumed_at=now() WHERE id=$1`, [ch.id]);
        if (ch.purpose === 'registration') {
          await client.query(`UPDATE app.auth_credentials SET email_verified_at=now(), updated_at=now() WHERE profile_id=$1 AND email_verified_at IS NULL`, [ch.profile_id]);
          await client.query(`INSERT INTO app.auth_security_events (profile_id,event_type,ip_hash) VALUES ($1,'email.verified',$2)`, [ch.profile_id, ipHash(input.ip)]);
        }
        return createSession(client, ch.profile_id, input.ip);
      });
    },

    // ---------- resend an OTP for an existing challenge ----------
    async resend(input: { challengeId: string; ip: string }): Promise<Challenge> {
      return withServiceTx(async (client) => {
        const q = await client.query<{ profile_id: string; purpose: Purpose; email_normalized: string; credential_version: number; consumed_at: Date | null }>(
          `SELECT profile_id, purpose, email_normalized, credential_version, consumed_at
             FROM app.auth_challenges WHERE id=$1`, [input.challengeId]);
        if (!q.rowCount) throw new AuthError(400, 'E.OTP.INVALID', 'Invalid code.');
        const ch = q.rows[0];
        await assertNotRateLimited(client, ch.email_normalized, input.ip);
        return issueChallenge(client, ch.profile_id, ch.email_normalized, ch.purpose, input.ip, ch.credential_version);
      });
    },

    // ---------- forgot password (generic) ----------
    async forgotPassword(input: { email: string; ip: string }): Promise<{ ok: true; challengeId?: string; resendAvailableAt?: string; expiresAt?: string }> {
      const emailNorm = normalizeEmail(input.email);
      if (!EMAIL_RE.test(emailNorm)) return { ok: true };
      try {
        return await withServiceTx(async (client) => {
          const cred = await client.query<{ profile_id: string; email_verified_at: Date | null; credential_version: number; is_active: boolean }>(
            `SELECT c.profile_id, c.email_verified_at, c.credential_version, p.is_active
               FROM app.auth_credentials c JOIN app.profiles p ON p.id=c.profile_id WHERE c.email_normalized=$1`, [emailNorm]);
          if (!cred.rowCount || !cred.rows[0].email_verified_at || !cred.rows[0].is_active) return { ok: true as const };
          await assertNotRateLimited(client, emailNorm, input.ip);
          const ch = await issueChallenge(client, cred.rows[0].profile_id, emailNorm, 'password_reset', input.ip, cred.rows[0].credential_version);
          return { ok: true as const, challengeId: ch.challengeId, resendAvailableAt: ch.resendAvailableAt, expiresAt: ch.expiresAt };
        });
      } catch (e) {
        if (e instanceof AuthError && e.code.startsWith('E.RATE')) throw e;
        return { ok: true };
      }
    },

    // ---------- reset password (verify OTP -> new hash -> revoke all sessions) ----------
    async resetPassword(input: { challengeId: string; otp: string; newPassword: string; ip: string }): Promise<{ ok: true }> {
      if (!input.newPassword || input.newPassword.length < 8) throw new AuthError(422, 'E.VAL.PASSWORD', 'Password must be at least 8 characters.');
      return withServiceTx(async (client) => {
        const q = await client.query<{ id: string; profile_id: string; purpose: Purpose; otp_digest: string; expires_at: Date; attempts_remaining: number; consumed_at: Date | null; email_normalized: string }>(
          `SELECT id, profile_id, purpose, otp_digest, expires_at, attempts_remaining, consumed_at, email_normalized
             FROM app.auth_challenges WHERE id=$1 FOR UPDATE`, [input.challengeId]);
        if (!q.rowCount || q.rows[0].purpose !== 'password_reset') throw new AuthError(400, 'E.OTP.INVALID', 'Invalid or expired code.');
        const ch = q.rows[0];
        if (ch.consumed_at || new Date(ch.expires_at) < new Date() || ch.attempts_remaining <= 0) throw new AuthError(400, 'E.OTP.INVALID', 'Invalid or expired code.');
        if (!digestEquals(ch.otp_digest, otpDigest(String(input.otp), otpSecret))) {
          await client.query(`UPDATE app.auth_challenges SET attempts_remaining=attempts_remaining-1 WHERE id=$1`, [ch.id]);
          throw new AuthError(400, 'E.OTP.INVALID', 'Invalid or expired code.');
        }
        await client.query(`UPDATE app.auth_challenges SET consumed_at=now() WHERE id=$1`, [ch.id]);
        await client.query(
          `UPDATE app.auth_credentials SET password_hash=$2, credential_version=credential_version+1,
             failed_password_attempts=0, password_locked_until=NULL, updated_at=now() WHERE profile_id=$1`,
          [ch.profile_id, await hashPassword(input.newPassword)]);
        // revoke every active session for this account
        await client.query(`UPDATE app.auth_sessions SET revoked_at=now() WHERE profile_id=$1 AND revoked_at IS NULL`, [ch.profile_id]);
        await client.query(`INSERT INTO app.auth_security_events (profile_id,event_type,ip_hash) VALUES ($1,'password.reset',$2)`, [ch.profile_id, ipHash(input.ip)]);
        try { await email.send({ ...passwordChangedEmail(), to: ch.email_normalized }); } catch { /* best-effort notification */ }
        return { ok: true as const };
      });
    },

    // ---------- session introspection (used by the Next BFF proxy) ----------
    async introspect(token: string): Promise<{ profileId: string; roles: string[]; csrfValid: (csrf: string) => boolean } | null> {
      if (!token) return null;
      return withServiceTx(async (client) => {
        const q = await client.query<{ id: string; profile_id: string; csrf_digest: string }>(
          `SELECT id, profile_id, csrf_digest FROM app.auth_sessions
            WHERE token_digest=$1 AND revoked_at IS NULL AND expires_at > now()`, [sha256(token)]);
        if (!q.rowCount) return null;
        await client.query(`UPDATE app.auth_sessions SET last_seen_at=now() WHERE id=$1`, [q.rows[0].id]);
        const roles = await resolveRoles(client, q.rows[0].profile_id);
        const csrfDigest = q.rows[0].csrf_digest;
        return { profileId: q.rows[0].profile_id, roles, csrfValid: (csrf: string) => digestEquals(csrfDigest, sha256(csrf)) };
      });
    },

    async logout(token: string): Promise<void> {
      if (!token) return;
      await withServiceTx(async (client) => {
        await client.query(`UPDATE app.auth_sessions SET revoked_at=now() WHERE token_digest=$1 AND revoked_at IS NULL`, [sha256(token)]);
      });
    },

    async revokeAllSessions(profileId: string): Promise<void> {
      await withServiceTx(async (client) => {
        await client.query(`UPDATE app.auth_sessions SET revoked_at=now() WHERE profile_id=$1 AND revoked_at IS NULL`, [profileId]);
      });
    },

    emailProviderName: email.name,
  };
}

export type AuthRepo = ReturnType<typeof createAuthRepo>;
