// storage/driver.ts — the storage driver contract. The API and the DB authorization
// (fn_authorize_doc_view / fn_finalize_upload) are unchanged across drivers; only the
// mechanism for minting signed URLs and moving bytes varies. Production selects `s3` or
// `supabase`; `local` is the default dev/self-host gateway.
export interface SignedUrl {
  url: string;
  method: 'PUT' | 'GET';
  expires_at: string;
  required_headers?: Record<string, string>;
}

export interface StorageDriver {
  readonly kind: 'local' | 's3' | 'supabase';
  // Presign a client-side upload of `key` with the given content type.
  presignUpload(key: string, contentType: string): Promise<SignedUrl>;
  // Presign a client-side download of `key`.
  presignDownload(key: string): Promise<SignedUrl>;
  // Does the object exist (used at finalize to reject unrecorded keys)?
  exists(key: string): Promise<boolean>;
  // Local gateway only: accept/serve bytes for the signed HMAC token. Cloud drivers
  // return null tokens (the client talks straight to the provider).
  verifyToken?(token: string): { op: 'up' | 'dn'; key: string; ct?: string; max?: number } | null;
  put?(key: string, data: Buffer): Promise<void>;
  get?(key: string): Promise<Buffer>;
}

const KEY_RE = /^[A-Za-z0-9][A-Za-z0-9/_-]{0,200}$/;
export function assertKey(key: string): void {
  if (!KEY_RE.test(key)) throw new Error('invalid object key');
}
