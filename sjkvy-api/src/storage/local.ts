// storage/local.ts — local filesystem driver + HMAC-signed gateway URLs. Default for
// dev/self-host. Production selects S3 or Supabase (bytes go straight to the provider).
import { createHmac, timingSafeEqual } from 'node:crypto';
import { mkdir, writeFile, readFile, stat, rename } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { StorageConfig } from '../config.js';
import type { ObjectReadLimits, SignedUrl, StorageDriver } from './driver.js';
import { assertKey } from './driver.js';
import { ObjectTooLargeError } from './bounded.js';

interface TokenPayload {
  op: 'up' | 'dn';
  key: string;
  exp: number;
  ct?: string;
  max?: number;
}

export class LocalDriver implements StorageDriver {
  readonly kind = 'local' as const;
  constructor(
    private cfg: StorageConfig,
    // In local dev the Next BFF upload route writes bytes under SJKVY_DOC_STORAGE; honour it
    // so the API gateway and the scanner worker read from the same root without extra config.
    private root = resolve(process.env.STORAGE_DIR ?? process.env.SJKVY_DOC_STORAGE ?? '/tmp/sjkvy-storage'),
  ) {}

  private secret(): string {
    if (!this.cfg.urlSigningSecret) throw new Error('STORAGE_URL_SIGNING_SECRET not configured');
    return this.cfg.urlSigningSecret;
  }
  private sign(p: TokenPayload): string {
    const body = Buffer.from(JSON.stringify(p)).toString('base64url');
    const mac = createHmac('sha256', this.secret()).update(body).digest('base64url');
    return `${body}.${mac}`;
  }
  verifyToken(token: string): TokenPayload | null {
    const dot = token.lastIndexOf('.');
    if (dot < 0) return null;
    const body = token.slice(0, dot);
    const mac = token.slice(dot + 1);
    const expected = createHmac('sha256', this.secret()).update(body).digest('base64url');
    const a = Buffer.from(mac);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    let p: TokenPayload;
    try {
      p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    } catch {
      return null;
    }
    if (p.exp < Math.floor(Date.now() / 1000)) return null;
    try {
      assertKey(p.key);
    } catch {
      return null;
    }
    return p;
  }

  async presignUpload(key: string, contentType: string): Promise<SignedUrl> {
    assertKey(key);
    const exp = Math.floor(Date.now() / 1000) + this.cfg.uploadTtlSec;
    const token = this.sign({ op: 'up', key, exp, ct: contentType, max: this.cfg.maxUploadBytes });
    return {
      url: `${this.cfg.publicBaseUrl}/upload/${token}`,
      method: 'PUT',
      expires_at: new Date(exp * 1000).toISOString(),
      required_headers: { 'content-type': contentType },
    };
  }

  async presignDownload(key: string): Promise<SignedUrl> {
    assertKey(key);
    const exp = Math.floor(Date.now() / 1000) + this.cfg.downloadTtlSec;
    const token = this.sign({ op: 'dn', key, exp });
    return {
      url: `${this.cfg.publicBaseUrl}/download/${token}`,
      method: 'GET',
      expires_at: new Date(exp * 1000).toISOString(),
    };
  }

  private pathFor(key: string): string {
    const full = resolve(join(this.root, key));
    if (!full.startsWith(this.root + '/') && full !== this.root) {
      throw new Error('path traversal blocked');
    }
    return full;
  }
  async put(key: string, data: Buffer): Promise<void> {
    const p = this.pathFor(key);
    await mkdir(dirname(p), { recursive: true });
    await writeFile(p, data);
  }
  async get(key: string): Promise<Buffer> {
    return readFile(this.pathFor(key));
  }
  async exists(key: string): Promise<boolean> {
    try {
      await stat(this.pathFor(key));
      return true;
    } catch {
      return false;
    }
  }

  // Bounded read for the scanner: stat first and refuse anything over the cap before loading a
  // single byte; a timeout races both filesystem calls. Path traversal is blocked by pathFor.
  async readObject(key: string, { maxBytes, timeoutMs }: ObjectReadLimits): Promise<Buffer> {
    const p = this.pathFor(key);
    const withTimeout = <T>(work: Promise<T>): Promise<T> =>
      Promise.race([
        work,
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error(`object read timed out after ${timeoutMs}ms`)), timeoutMs)),
      ]);
    const st = await withTimeout(stat(p));
    if (st.size > maxBytes) throw new ObjectTooLargeError(maxBytes);
    return withTimeout(readFile(p));
  }

  // Move a flagged object under a .quarantine prefix so it is no longer at its servable key.
  async quarantine(key: string): Promise<void> {
    const from = this.pathFor(key);
    const to = this.pathFor(join('.quarantine', key));
    await mkdir(dirname(to), { recursive: true });
    await rename(from, to);
  }
}
