// test/helpers.ts — shared test setup: build the in-process server against the real
// sjkvy_api database, and mint HS256 JWTs for seeded actors.
import { SignJWT } from 'jose';
import { initDb, closeDb } from '../src/db.js';
import { buildServer } from '../src/server.js';
import type { Config } from '../src/config.js';

export const TEST_SECRET = 'test-secret-do-not-use-in-prod';
export const SERVICE_TOKEN = 'test-service-token';

export const STORAGE_SECRET = 'test-storage-signing-secret-32chars-min-xx';

export const cfg: Config = {
  nodeEnv: 'test',
  port: 0,
  host: '127.0.0.1',
  databaseUrl:
    process.env.TEST_DATABASE_URL ??
    'postgres://sjkvy_api_login:apitest@127.0.0.1:5432/sjkvy_api',
  pgPoolMax: 10,
  jwt: {
    secret: TEST_SECRET,
    jwksUri: undefined,
    issuer: undefined,
    audience: undefined,
    algorithms: ['HS256'],
    clockToleranceSec: 5,
  },
  storage: {
    urlSigningSecret: STORAGE_SECRET,
    uploadTtlSec: 300,
    downloadTtlSec: 300,
    maxUploadBytes: 10 * 1024 * 1024,
    allowedMime: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    publicBaseUrl: 'http://127.0.0.1:8080/storage',
  },
  auth: {
    otpHmacSecret: 'test-otp-hmac-secret-please-change-32chars',
    emailProvider: 'fake',
    resendApiKey: undefined,
    emailFrom: 'SJKVY <no-reply@sjkvy.test>',
    appUrl: 'http://127.0.0.1:3000',
    sessionTtlSec: 3600,
    otpResendCooldownSec: 0,     // relaxed for deterministic tests (throttling tested separately)
    otpHourlyEmailCap: 1000,
    otpHourlyIpCap: 100000,
    otpMaxAttempts: 5,
  },
  serviceToken: SERVICE_TOKEN,
  logLevel: 'warn',
  corsOrigins: [],
  bodyLimitBytes: 1024 * 1024,
  rateLimitMax: 100000, // effectively off for tests
  rateLimitWindow: '1 minute',
  trustProxy: false,
};

// Seeded actor profile ids (from tests/plain/01_seed.sql).
export const ACTORS = {
  applicantA: 'a0000000-0000-0000-0000-00000000000a',
  applicantB: 'a0000000-0000-0000-0000-00000000000b',
  operator: '50000000-0000-0000-0000-0000000000a1',
  checker: '50000000-0000-0000-0000-0000000000a2',
  counsellor: '50000000-0000-0000-0000-0000000000a3',
  cad1: '50000000-0000-0000-0000-0000000000a4',
  cad2: '50000000-0000-0000-0000-0000000000a5',
  trainer: '50000000-0000-0000-0000-0000000000a6',
  hostel: '50000000-0000-0000-0000-0000000000a7',
  placement: '50000000-0000-0000-0000-0000000000a8',
  superAdmin: '50000000-0000-0000-0000-0000000000a9',
};

export const SEED = {
  course: 'aa000000-0000-0000-0000-000000000001',
  centre1: 'c0000000-0000-0000-0000-000000000001',
  batch1: 'b0000000-0000-0000-0000-000000000001',
};

export async function mintJwt(
  sub: string,
  opts: { expiredSec?: number; extraClaims?: Record<string, unknown>; secret?: string } = {},
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const jwt = new SignJWT({ role: 'authenticated', ...(opts.extraClaims ?? {}) })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sub)
    .setIssuedAt(opts.expiredSec ? now - opts.expiredSec - 3600 : now)
    .setExpirationTime(opts.expiredSec ? now - opts.expiredSec : now + 3600);
  return jwt.sign(new TextEncoder().encode(opts.secret ?? TEST_SECRET));
}

export async function makeApp() {
  initDb(cfg.databaseUrl);
  return buildServer(cfg);
}

export async function teardown() {
  await closeDb();
}

// Convenience: authorization header for a seeded actor.
export async function userAuth(sub: string): Promise<Record<string, string>> {
  return { authorization: `Bearer ${await mintJwt(sub)}` };
}

export const serviceAuth: Record<string, string> = {
  authorization: `Bearer ${SERVICE_TOKEN}`,
};

export function idemHeaders(): Record<string, string> {
  return { 'idempotency-key': crypto.randomUUID() };
}
