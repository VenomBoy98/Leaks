// storage/s3.ts — Amazon S3 driver using native presigned URLs (AWS Signature V4).
// No AWS SDK dependency: SigV4 is implemented with node:crypto so the client uploads/
// downloads straight to S3 and bytes never transit the API. Correctness is pinned by a
// unit test against AWS's published presigned-URL example vector (see test/s3-sigv4.test.ts).
import { createHash, createHmac } from 'node:crypto';
import type { SignedUrl, StorageDriver } from './driver.js';
import { assertKey } from './driver.js';

export interface S3Config {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  // Override host for tests / S3-compatible endpoints (e.g. MinIO). Defaults to the
  // virtual-hosted-style AWS host.
  host?: string;
  uploadTtlSec: number;
  downloadTtlSec: number;
}

function sha256Hex(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}
function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data).digest();
}
// RFC3986 encoding; S3 keeps '/' unencoded in the path but encodes it in query values.
function enc(str: string, encodeSlash = true): string {
  return str
    .split('')
    .map((c) => {
      if (/[A-Za-z0-9\-._~]/.test(c)) return c;
      if (c === '/' && !encodeSlash) return c;
      return '%' + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0');
    })
    .join('');
}

function amzDates(now: Date): { amzDate: string; dateStamp: string } {
  const iso = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return { amzDate: iso, dateStamp: iso.slice(0, 8) };
}

// Build a SigV4 presigned URL. Exported for the vector test.
export function presignS3(
  cfg: S3Config,
  method: 'GET' | 'PUT',
  key: string,
  expiresSec: number,
  now: Date = new Date(),
): string {
  const host = cfg.host ?? `${cfg.bucket}.s3.${cfg.region}.amazonaws.com`;
  const { amzDate, dateStamp } = amzDates(now);
  const scope = `${dateStamp}/${cfg.region}/s3/aws4_request`;
  const path = '/' + enc(key, false);

  const q: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${cfg.accessKeyId}/${scope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresSec),
    'X-Amz-SignedHeaders': 'host',
  };
  if (cfg.sessionToken) q['X-Amz-Security-Token'] = cfg.sessionToken;
  const canonicalQuery = Object.keys(q)
    .sort()
    .map((k) => `${enc(k)}=${enc(q[k])}`)
    .join('&');

  const canonicalRequest = [
    method,
    path,
    canonicalQuery,
    `host:${host}\n`,
    'host',
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const kDate = hmac('AWS4' + cfg.secretAccessKey, dateStamp);
  const kRegion = hmac(kDate, cfg.region);
  const kService = hmac(kRegion, 's3');
  const kSigning = hmac(kService, 'aws4_request');
  const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  return `https://${host}${path}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

export class S3Driver implements StorageDriver {
  readonly kind = 's3' as const;
  constructor(private cfg: S3Config) {}

  async presignUpload(key: string, contentType: string): Promise<SignedUrl> {
    assertKey(key);
    const exp = Date.now() + this.cfg.uploadTtlSec * 1000;
    return {
      url: presignS3(this.cfg, 'PUT', key, this.cfg.uploadTtlSec),
      method: 'PUT',
      expires_at: new Date(exp).toISOString(),
      required_headers: { 'content-type': contentType },
    };
  }

  async presignDownload(key: string): Promise<SignedUrl> {
    assertKey(key);
    const exp = Date.now() + this.cfg.downloadTtlSec * 1000;
    return {
      url: presignS3(this.cfg, 'GET', key, this.cfg.downloadTtlSec),
      method: 'GET',
      expires_at: new Date(exp).toISOString(),
    };
  }

  async exists(key: string): Promise<boolean> {
    assertKey(key);
    // HEAD via a short-lived presigned GET (range 0-0) — avoids the SDK. Best-effort:
    // network failures are treated as "unknown -> false" by the caller's finalize gate.
    const url = presignS3(this.cfg, 'GET', key, 60);
    try {
      const res = await fetch(url, { method: 'HEAD' });
      return res.ok;
    } catch {
      return false;
    }
  }
}
