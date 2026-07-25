// serverApi.ts — SERVER-ONLY. The BFF for privileged (service-role) backend operations that
// the browser must never perform: document finalize, scan callback, and authorized view-url.
// The caller identity is ALWAYS derived from the verified session cookie here — never from the
// request body — so a browser cannot spoof profileId/ownership.
import "server-only";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { createHmac } from "node:crypto";

const API = (process.env.API_BASE_URL ?? "http://127.0.0.1:8080").replace(/\/$/, "");
const SERVICE_TOKEN = process.env.SERVICE_TOKEN ?? "";
const SESSION_SECRET = () => new TextEncoder().encode(process.env.DEV_JWT_SECRET ?? "");
const VIEW_SECRET = process.env.STORAGE_VIEW_SECRET ?? "";

/** Verified caller profile id from the httpOnly session cookie, or null. */
export async function getCaller(): Promise<string | null> {
  // Prefer the opaque server-side session (introspected by the API); fall back to the dev-login
  // JWT for dev/test. Keeps the document BFF (upload/view) working under real sessions too.
  const { resolveCaller } = await import("@/lib/authServer");
  const caller = await resolveCaller();
  if (caller) return caller.profileId;
  return null;
}

async function service<T>(method: string, path: string, body: unknown): Promise<{ status: number; data: T | null }> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { authorization: `Bearer ${SERVICE_TOKEN}`, "content-type": "application/json", accept: "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, data: text ? (JSON.parse(text) as T) : null };
}

export interface FinalizeResult { document_id: string; version_id: string; version_no: number; scan_status: string }

/** Record a finished upload for the verified caller (service op). */
export function finalizeUpload(input: {
  caller: string; application_id: string; document_type: string; storage_path: string; mime: string; size: number; sha256: string;
}) {
  return service<FinalizeResult>("POST", "/documents/finalize", input);
}

/** Anti-virus/scan callback (service op). In dev the server marks a just-written file CLEAN. */
export function scanResult(versionId: string, status: "CLEAN" | "FLAGGED") {
  return service<{ scan_status: string }>("POST", `/documents/${versionId}/scan-result`, { status });
}

/** Authorized document view — returns the backend storage_path (service op, caller-scoped). */
export function authorizeView(versionId: string, caller: string, purpose = "applicant-view") {
  return service<{ storage_path: string }>("POST", `/documents/${versionId}/view-url`, { caller, purpose });
}

// ---- short-lived signed view URLs (never expose storage_path to the browser) ----
export function signViewUrl(storagePath: string, ttlSec = 120): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const sig = createHmac("sha256", VIEW_SECRET).update(`${storagePath}:${exp}`).digest("hex").slice(0, 32);
  const q = new URLSearchParams({ p: storagePath, exp: String(exp), sig });
  return `/api/documents/file?${q.toString()}`;
}
export function verifyViewSig(storagePath: string, exp: string, sig: string): boolean {
  if (!storagePath || !exp || !sig) return false;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return false;
  const expect = createHmac("sha256", VIEW_SECRET).update(`${storagePath}:${exp}`).digest("hex").slice(0, 32);
  return expect === sig;
}
