// storage/index.ts — storage service: driver-agnostic validation + object keying, plus
// a factory that selects the driver from STORAGE_DRIVER (local | s3 | supabase). The
// database authorization (fn_finalize_upload / fn_authorize_doc_view) is identical for
// all drivers; only URL-minting and byte transport differ.
import { randomUUID } from 'node:crypto';
import type { Config, StorageConfig } from '../config.js';
import type { StorageDriver } from './driver.js';
import { LocalDriver } from './local.js';
import { S3Driver } from './s3.js';
import { SupabaseStorageDriver } from './supabase.js';

export interface UploadValidation {
  ok: boolean;
  reason?: string;
}

export class StorageService {
  constructor(
    public readonly driver: StorageDriver,
    private cfg: StorageConfig,
  ) {}

  get isLocal(): boolean {
    return this.driver.kind === 'local';
  }

  validateUpload(mime: string, size: number): UploadValidation {
    if (!this.cfg.allowedMime.includes(mime)) return { ok: false, reason: `mime ${mime} not allowed` };
    if (!Number.isInteger(size) || size <= 0) return { ok: false, reason: 'size must be a positive integer' };
    if (size > this.cfg.maxUploadBytes) return { ok: false, reason: `size exceeds ${this.cfg.maxUploadBytes} bytes` };
    return { ok: true };
  }

  // Deterministic, namespaced key. Never derived from a client-supplied path.
  makeObjectKey(applicationId: string, docType: string): string {
    const safeType = docType.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32) || 'DOC';
    return `app/${applicationId}/${safeType}/${randomUUID()}`;
  }
}

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`storage driver requires ${name}`);
  return v;
}

export function buildStorage(cfg: Config): StorageService {
  const s = cfg.storage;
  const driver = (process.env.STORAGE_DRIVER ?? 'local').toLowerCase();
  switch (driver) {
    case 's3':
      return new StorageService(
        new S3Driver({
          bucket: req('S3_BUCKET'),
          region: req('S3_REGION'),
          accessKeyId: req('AWS_ACCESS_KEY_ID'),
          secretAccessKey: req('AWS_SECRET_ACCESS_KEY'),
          sessionToken: process.env.AWS_SESSION_TOKEN,
          host: process.env.S3_ENDPOINT_HOST,
          uploadTtlSec: s.uploadTtlSec,
          downloadTtlSec: s.downloadTtlSec,
        }),
        s,
      );
    case 'supabase':
      return new StorageService(
        new SupabaseStorageDriver({
          url: req('SUPABASE_URL'),
          serviceRoleKey: req('SUPABASE_SERVICE_ROLE_KEY'),
          bucket: req('STORAGE_BUCKET'),
          downloadTtlSec: s.downloadTtlSec,
        }),
        s,
      );
    default:
      return new StorageService(new LocalDriver(s), s);
  }
}

export type { StorageDriver, SignedUrl } from './driver.js';
