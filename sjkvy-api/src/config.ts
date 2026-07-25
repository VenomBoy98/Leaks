// config.ts — environment configuration with fail-fast validation. No secrets are
// hard-coded; all come from env. In production (`NODE_ENV=production`) weak or missing
// secrets abort startup rather than silently degrading security.
export type NodeEnv = 'development' | 'test' | 'production';

export interface JwtConfig {
  // HS256 shared secret (dev / self-host / Supabase legacy JWT secret).
  secret: string | undefined;
  // JWKS endpoint for asymmetric providers (RS256/ES256): Supabase, Auth0, Cognito…
  jwksUri: string | undefined;
  issuer: string | undefined;
  audience: string | undefined;
  // Accepted algorithms. Defaults chosen from which of secret/jwksUri is set.
  algorithms: string[];
  // Clock skew tolerance (seconds).
  clockToleranceSec: number;
}

export interface StorageConfig {
  // Signing secret for upload/download URLs (HMAC). Separate from JWT secret.
  urlSigningSecret: string | undefined;
  uploadTtlSec: number;
  downloadTtlSec: number;
  maxUploadBytes: number;
  allowedMime: string[];
  // Public base URL the signed storage links point at (the storage gateway/CDN).
  publicBaseUrl: string;
}

export interface AuthConfig {
  // Server-only key for HMAC-SHA256 of OTPs (low-entropy 6-digit codes are never stored raw).
  otpHmacSecret: string | undefined;
  // Email provider: 'resend' for production; 'fake' captures in-memory for dev/tests only.
  emailProvider: 'resend' | 'fake';
  resendApiKey: string | undefined;
  emailFrom: string;
  appUrl: string;
  // Opaque session lifetime (seconds).
  sessionTtlSec: number;
  // OTP throttling (secure defaults; relaxed only in the test harness).
  otpResendCooldownSec: number;
  otpHourlyEmailCap: number;
  otpHourlyIpCap: number;
  otpMaxAttempts: number;
}

export interface Config {
  nodeEnv: NodeEnv;
  port: number;
  host: string;
  databaseUrl: string;
  pgPoolMax: number;
  jwt: JwtConfig;
  storage: StorageConfig;
  auth: AuthConfig;
  serviceToken: string | undefined;
  logLevel: string;
  // CORS allowlist (comma-separated origins); empty = same-origin only.
  corsOrigins: string[];
  bodyLimitBytes: number;
  rateLimitMax: number;
  rateLimitWindow: string;
  trustProxy: boolean;
}

class ConfigError extends Error {}

function env(name: string, fallback?: string): string | undefined {
  return process.env[name] ?? fallback;
}
function num(name: string, fallback: number): number {
  const v = process.env[name];
  return v === undefined ? fallback : Number(v);
}
function csv(name: string): string[] {
  const v = process.env[name];
  return v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [];
}

export function loadConfig(): Config {
  const nodeEnv = (env('NODE_ENV', 'development') as NodeEnv) ?? 'development';
  const isProd = nodeEnv === 'production';

  const jwtSecret = env('JWT_SECRET');
  const jwksUri = env('JWT_JWKS_URI');
  const algorithms = csv('JWT_ALGORITHMS');

  const cfg: Config = {
    nodeEnv,
    port: num('PORT', 8080),
    host: env('HOST', '0.0.0.0')!,
    databaseUrl: env(
      'DATABASE_URL',
      'postgres://sjkvy_api_login@localhost:5432/sjkvy_test',
    )!,
    pgPoolMax: num('PG_POOL_MAX', 10),
    jwt: {
      secret: jwtSecret,
      jwksUri,
      issuer: env('JWT_ISSUER'),
      audience: env('JWT_AUDIENCE'),
      algorithms:
        algorithms.length > 0
          ? algorithms
          : jwksUri
            ? ['RS256', 'ES256']
            : ['HS256'],
      clockToleranceSec: num('JWT_CLOCK_TOLERANCE_SEC', 5),
    },
    storage: {
      urlSigningSecret: env('STORAGE_URL_SIGNING_SECRET'),
      uploadTtlSec: num('STORAGE_UPLOAD_TTL_SEC', 300),
      downloadTtlSec: num('STORAGE_DOWNLOAD_TTL_SEC', 300),
      maxUploadBytes: num('STORAGE_MAX_UPLOAD_BYTES', 10 * 1024 * 1024),
      allowedMime: csv('STORAGE_ALLOWED_MIME').length
        ? csv('STORAGE_ALLOWED_MIME')
        : ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      publicBaseUrl: env('STORAGE_PUBLIC_BASE_URL', 'http://localhost:8080/storage')!,
    },
    auth: {
      otpHmacSecret: env('OTP_HMAC_SECRET'),
      emailProvider: (env('EMAIL_PROVIDER', isProd ? 'resend' : 'fake') as 'resend' | 'fake'),
      resendApiKey: env('RESEND_API_KEY'),
      emailFrom: env('EMAIL_FROM', 'SJKVY <no-reply@sjkvy.local>')!,
      appUrl: env('APP_URL', 'http://localhost:3000')!,
      sessionTtlSec: num('AUTH_SESSION_TTL_SEC', 12 * 60 * 60),
      otpResendCooldownSec: num('OTP_RESEND_COOLDOWN_SEC', 60),
      otpHourlyEmailCap: num('OTP_HOURLY_EMAIL_CAP', 6),
      otpHourlyIpCap: num('OTP_HOURLY_IP_CAP', 30),
      otpMaxAttempts: num('OTP_MAX_ATTEMPTS', 5),
    },
    serviceToken: env('SERVICE_TOKEN'),
    logLevel: env('LOG_LEVEL', isProd ? 'info' : 'debug')!,
    corsOrigins: csv('CORS_ORIGINS'),
    bodyLimitBytes: num('BODY_LIMIT_BYTES', 1 * 1024 * 1024),
    rateLimitMax: num('RATE_LIMIT_MAX', 100),
    rateLimitWindow: env('RATE_LIMIT_WINDOW', '1 minute')!,
    trustProxy: env('TRUST_PROXY', isProd ? 'true' : 'false') === 'true',
  };

  validate(cfg, isProd);
  return cfg;
}

// Fail-fast validation. In production, missing/weak secrets abort startup.
function validate(cfg: Config, isProd: boolean): void {
  const problems: string[] = [];

  if (!cfg.jwt.secret && !cfg.jwt.jwksUri) {
    problems.push('JWT_SECRET or JWT_JWKS_URI must be set (no way to verify tokens).');
  }
  if (isProd) {
    if (cfg.jwt.secret && cfg.jwt.secret.length < 32) {
      problems.push('JWT_SECRET must be at least 32 chars in production.');
    }
    if (!cfg.serviceToken || cfg.serviceToken.length < 24) {
      problems.push('SERVICE_TOKEN must be set and >= 24 chars in production.');
    }
    if (!cfg.storage.urlSigningSecret || cfg.storage.urlSigningSecret.length < 32) {
      problems.push('STORAGE_URL_SIGNING_SECRET must be set and >= 32 chars in production.');
    }
    if (!cfg.auth.otpHmacSecret || cfg.auth.otpHmacSecret.length < 32) {
      problems.push('OTP_HMAC_SECRET must be set and >= 32 chars in production.');
    }
    if (cfg.auth.emailProvider === 'fake') {
      problems.push('EMAIL_PROVIDER must not be "fake" in production (real email required).');
    }
    if (cfg.auth.emailProvider === 'resend' && (!cfg.auth.resendApiKey || !cfg.auth.emailFrom)) {
      problems.push('RESEND_API_KEY and EMAIL_FROM are required when EMAIL_PROVIDER=resend.');
    }
    if (cfg.databaseUrl.includes('@localhost') || cfg.databaseUrl.includes('@127.0.0.1')) {
      // allowed but warn-worthy; not fatal (compose networks vary)
    }
    if (/:[^:@/]*@/.test(cfg.databaseUrl) === false && !cfg.databaseUrl.includes('sslmode')) {
      // no password in URL — acceptable if using IAM/peer, so not fatal
    }
    for (const [k, v] of Object.entries({
      JWT_SECRET: cfg.jwt.secret,
      SERVICE_TOKEN: cfg.serviceToken,
      STORAGE_URL_SIGNING_SECRET: cfg.storage.urlSigningSecret,
    })) {
      if (v && /change[_-]?me|placeholder|example|secret123|test-/i.test(v)) {
        problems.push(`${k} looks like a placeholder value; set a real secret.`);
      }
    }
  }

  if (problems.length > 0) {
    throw new ConfigError(
      `Invalid configuration:\n  - ${problems.join('\n  - ')}`,
    );
  }
}
