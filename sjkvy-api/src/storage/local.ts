// storage/local.ts — local filesystem driver + HMAC-signed gateway URLs. Default for
// dev/self-host. Production selects S3 or Supabase (bytes go straight to the provider).
import { createHmac, timingSafeEqual } from 'node:crypto';
import { mkdir, writeFile, readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { StorageConfig } from '../config.js';
import type { SignedUrl, StorageDriver } from './driver.js';
import { assertKey } from './driver.js';

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
    private root = resolve(process.env.STORAGE_DIR ?? '/tmp/sjkvy-storage'),
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
}
