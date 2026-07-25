// auth-core/crypto.ts — password hashing (Argon2id), OTP generation/keyed-digest, opaque token
// and digest helpers. Secrets (OTPs, session tokens, role codes) are NEVER stored in plaintext;
// only their keyed/one-way digests are persisted. All comparisons are timing-safe.
import { hash as argonHash, verify as argonVerify, Algorithm } from '@node-rs/argon2';
import { createHmac, createHash, randomInt, randomBytes, timingSafeEqual } from 'node:crypto';

// ---- passwords (Argon2id) ----
export async function hashPassword(password: string): Promise<string> {
  return argonHash(password, { algorithm: Algorithm.Argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
}
export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await argonVerify(passwordHash, password);
  } catch {
    return false;
  }
}

// ---- OTP (6 digits, CSPRNG) ----
export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

// HMAC-SHA256(otp) hex — keyed with a server-only secret so a leaked DB can't be brute-forced
// against the low-entropy 6-digit space without the key.
export function otpDigest(otp: string, secret: string): string {
  return createHmac('sha256', secret).update(otp).digest('hex');
}

// ---- opaque tokens (sessions, role codes) ----
// 256-bit session token, url-safe.
export function newSessionToken(): string {
  return randomBytes(32).toString('base64url');
}
// 160-bit (>=128) role code, base32 crockford-ish, grouped for humans (shown once).
export function newRoleCode(): string {
  const raw = randomBytes(20); // 160 bits
  const alphabet = 'ABCDEFGHJKMNPQRSTVWXYZ0123456789'; // no I,L,O,U
  let out = '';
  for (const b of raw) out += alphabet[b % 32];
  return out.replace(/(.{4})(?=.)/g, '$1-'); // XXXX-XXXX-...
}

// SHA-256 hex digest for storing/looking up opaque tokens and hashing IPs.
export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

// Timing-safe hex-digest comparison (both must be 64-char hex).
export function digestEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
