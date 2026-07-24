// apiClient.ts — the one shared frontend API layer. All calls go same-origin through
// /api/proxy, which attaches the httpOnly session token server-side and forwards to the
// existing sjkvy-api. The browser never holds the JWT and never sends profileId/role/centre.
//
// Provides: normalized errors, cancellation + timeout, idempotency keys, status handling
// (401/403/404/409/422/429/5xx + session-expired), and pagination/filter/search params.

export interface NormalizedError {
  status: number;
  code: string; // backend error code (E.*) or a client code
  message: string;
  retriable: boolean;
  sessionExpired: boolean;
  details?: unknown;
}

export class ApiError extends Error implements NormalizedError {
  status: number;
  code: string;
  retriable: boolean;
  sessionExpired: boolean;
  details?: unknown;
  constructor(e: NormalizedError) {
    super(e.message);
    this.name = "ApiError";
    this.status = e.status;
    this.code = e.code;
    this.retriable = e.retriable;
    this.sessionExpired = e.sessionExpired;
    this.details = e.details;
  }
}

const BASE = "/api/proxy";
const DEFAULT_TIMEOUT_MS = 15_000;

export interface RequestOpts {
  signal?: AbortSignal;
  timeoutMs?: number;
  idempotencyKey?: string; // for retry-sensitive mutations
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
}

export interface Page<T> {
  items: T[];
  total?: number;
  cursor?: string | null;
}

function buildUrl(path: string, query?: RequestOpts["query"]): string {
  const url = `${BASE}/${path.replace(/^\/+/, "")}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined) params.set(k, String(v));
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

function normalize(status: number, body: unknown): NormalizedError {
  const b = (body ?? {}) as { error?: string; code?: string; message?: string };
  const code = b.code ?? b.error ?? `HTTP_${status}`;
  const messages: Record<number, string> = {
    400: "The request was invalid.",
    401: "Your session has expired. Please sign in again.",
    403: "You do not have permission to do that.",
    404: "That item was not found.",
    409: "This changed since you loaded it. Refresh and try again.",
    422: "Some fields need attention.",
    429: "Too many requests. Please slow down.",
  };
  const message = b.message ?? messages[status] ?? (status >= 500 ? "Something went wrong on our side." : "Request failed.");
  return {
    status,
    code,
    message,
    retriable: status === 429 || status >= 500,
    sessionExpired: status === 401,
    details: body,
  };
}

async function request<T>(method: string, path: string, body: unknown, opts: RequestOpts = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  // chain an externally-provided signal
  if (opts.signal) {
    if (opts.signal.aborted) controller.abort();
    else opts.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  const headers: Record<string, string> = { accept: "application/json", ...(opts.headers ?? {}) };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (opts.idempotencyKey) headers["idempotency-key"] = opts.idempotencyKey;

  try {
    const res = await fetch(buildUrl(path, opts.query), {
      method,
      headers,
      credentials: "include", // send the session cookie to our same-origin proxy
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    const parsed = text ? safeJson(text) : null;
    if (!res.ok) throw new ApiError(normalize(res.status, parsed));
    return parsed as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error)?.name === "AbortError") {
      throw new ApiError({ status: 0, code: "ABORTED", message: "Request was cancelled or timed out.", retriable: true, sessionExpired: false });
    }
    throw new ApiError({ status: 0, code: "NETWORK", message: "Could not reach the server.", retriable: true, sessionExpired: false });
  } finally {
    clearTimeout(timeout);
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

// A fresh idempotency key for retry-sensitive mutations (admission decisions, submissions).
export function newIdempotencyKey(): string {
  return (globalThis.crypto?.randomUUID?.() ?? `idk-${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

export const http = {
  get: <T>(path: string, opts?: RequestOpts) => request<T>("GET", path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOpts) => request<T>("POST", path, body, opts),
  patch: <T>(path: string, body?: unknown, opts?: RequestOpts) => request<T>("PATCH", path, body, opts),
  put: <T>(path: string, body?: unknown, opts?: RequestOpts) => request<T>("PUT", path, body, opts),
};
