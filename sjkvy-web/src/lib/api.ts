// api.ts — thin client for the SJKVY backend (Fastify API over the PostgreSQL function
// catalogue). Base URL comes from Vite env so it points at localhost in dev and the real
// gateway in production. Only the PUBLIC (auth: none) endpoints are used by the public
// site; authenticated/portal calls arrive with later design batches.
const BASE = (import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8080").replace(/\/$/, "");

export interface CertVerifyResult {
  valid: boolean;
  status?: string | null;
  holder_name?: string | null;
  course_code?: string | null;
  batch_code?: string | null;
  issued_on?: string | null; // ISO date
  superseded?: boolean | null;
}

export interface PublicCourse {
  id: string;
  code: string;
  name_en: string;
  name_hi: string;
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { accept: "application/json" },
    signal,
  });
  if (!res.ok) {
    throw new Error(`API ${res.status} for ${path}`);
  }
  return (await res.json()) as T;
}

/** PUBLIC certificate verification — GET /verify/:code (anon). */
export function verifyCertificate(code: string, signal?: AbortSignal): Promise<CertVerifyResult> {
  return getJson<CertVerifyResult>(`/verify/${encodeURIComponent(code)}`, signal);
}

/** PUBLIC active course catalogue — GET /public/courses (anon). */
export async function listCourses(signal?: AbortSignal): Promise<PublicCourse[]> {
  const data = await getJson<{ items: PublicCourse[] }>(`/public/courses`, signal);
  return data.items ?? [];
}

export { BASE as apiBaseUrl };
