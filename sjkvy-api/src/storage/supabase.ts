// storage/supabase.ts — Supabase Storage driver via the REST API (service-role key,
// server-side only). Uses native signed upload/download URLs, so the browser talks
// straight to Supabase Storage and bytes never transit the API. No SDK dependency.
import type { SignedUrl, StorageDriver } from './driver.js';
import { assertKey } from './driver.js';

export interface SupabaseStorageConfig {
  url: string; // https://<ref>.supabase.co
  serviceRoleKey: string; // server-only
  bucket: string;
  downloadTtlSec: number;
}

export class SupabaseStorageDriver implements StorageDriver {
  readonly kind = 'supabase' as const;
  constructor(private cfg: SupabaseStorageConfig) {}

  private headers(): Record<string, string> {
    return {
      authorization: `Bearer ${this.cfg.serviceRoleKey}`,
      apikey: this.cfg.serviceRoleKey,
      'content-type': 'application/json',
    };
  }

  async presignUpload(key: string, contentType: string): Promise<SignedUrl> {
    assertKey(key);
    // POST /storage/v1/object/upload/sign/{bucket}/{path} -> { url, token }
    const res = await fetch(
      `${this.cfg.url}/storage/v1/object/upload/sign/${this.cfg.bucket}/${key}`,
      { method: 'POST', headers: this.headers(), body: '{}' },
    );
    if (!res.ok) throw new Error(`supabase presign upload failed: ${res.status}`);
    const body = (await res.json()) as { url: string };
    // The returned URL is relative to the storage endpoint.
    const url = body.url.startsWith('http') ? body.url : `${this.cfg.url}/storage/v1${body.url}`;
    return {
      url,
      method: 'PUT',
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      required_headers: { 'content-type': contentType },
    };
  }

  async presignDownload(key: string): Promise<SignedUrl> {
    assertKey(key);
    const res = await fetch(
      `${this.cfg.url}/storage/v1/object/sign/${this.cfg.bucket}/${key}`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ expiresIn: this.cfg.downloadTtlSec }),
      },
    );
    if (!res.ok) throw new Error(`supabase presign download failed: ${res.status}`);
    const body = (await res.json()) as { signedURL: string };
    const url = body.signedURL.startsWith('http')
      ? body.signedURL
      : `${this.cfg.url}/storage/v1${body.signedURL}`;
    return {
      url,
      method: 'GET',
      expires_at: new Date(Date.now() + this.cfg.downloadTtlSec * 1000).toISOString(),
    };
  }

  async exists(key: string): Promise<boolean> {
    assertKey(key);
    try {
      const res = await fetch(
        `${this.cfg.url}/storage/v1/object/info/${this.cfg.bucket}/${key}`,
        { headers: this.headers() },
      );
      return res.ok;
    } catch {
      return false;
    }
  }
}
