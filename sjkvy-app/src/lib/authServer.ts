import "server-only";
// authServer.ts — SERVER-ONLY. Bridges the browser's opaque session cookie to the sjkvy-api:
// it calls the service-authed /auth/* endpoints (holding SERVICE_TOKEN, forwarding the real
// client IP), manages the httpOnly session + CSRF cookies, and resolves a request's caller by
// introspecting the opaque session (falling back to the dev-login JWT for dev/test). The browser
// never holds the API JWT; the proxy mints a short-lived one per request from the resolved caller.
import { cookies, headers } from "next/headers";
import { SignJWT } from "jose";

const API = (process.env.API_BASE_URL ?? "http://127.0.0.1:8080").replace(/\/$/, "");
const SERVICE_TOKEN = process.env.SERVICE_TOKEN ?? "";
const JWT_SECRET = () => new TextEncoder().encode(process.env.DEV_JWT_SECRET ?? process.env.JWT_SECRET ?? "");

export const SESSION_COOKIE = "sjkvy_session";
export const CSRF_COOKIE = "sjkvy_csrf";
export const ROLE_COOKIE = "sjkvy_role"; // readable, middleware zone-gating only (not authz)

const isProd = process.env.NODE_ENV === "production";
const baseCookie = { httpOnly: true, secure: isProd, sameSite: "lax" as const, path: "/" };

export function clientIp(): string {
  const h = headers();
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
}

// Call a service-authed API auth endpoint, forwarding the real client IP.
export async function callAuth<T = unknown>(path: string, body: unknown): Promise<{ status: number; data: T }> {
  const res = await fetch(`${API}/auth/${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${SERVICE_TOKEN}`, "content-type": "application/json", "x-real-ip": clientIp() },
    body: JSON.stringify(body ?? {}),
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, data };
}

// Primary landing role (drives the readable role cookie + post-login redirect). Real per-request
// authorization is always enforced server-side by the API + PostgreSQL RLS, not this cookie.
const ADMIN = new Set(["centre_admin", "super_admin"]);
const STAFF = new Set(["operator", "checker", "counsellor", "trainer", "hostel_manager", "placement", "centre_admin", "super_admin"]);
export function landingRole(roles: string[]): "admin" | "staff" | "student" | "applicant" {
  if (roles.some((r) => ADMIN.has(r))) return "admin";
  if (roles.some((r) => STAFF.has(r))) return "staff";
  if (roles.includes("student")) return "student";
  return "applicant";
}
export const ROLE_HOME: Record<string, string> = {
  admin: "/admin-dashboard", staff: "/staff-dashboard", student: "/student-dashboard", applicant: "/dashboard",
};

export function setSessionCookies(session: { token: string; csrf: string; roles: string[]; expiresAt?: string }): void {
  const jar = cookies();
  const expires = session.expiresAt ? new Date(session.expiresAt) : undefined;
  jar.set(SESSION_COOKIE, session.token, { ...baseCookie, expires });
  jar.set(CSRF_COOKIE, session.csrf, { ...baseCookie, httpOnly: false, expires }); // readable for double-submit
  jar.set(ROLE_COOKIE, landingRole(session.roles), { ...baseCookie, httpOnly: false, expires });
}
export function clearSessionCookies(): void {
  const jar = cookies();
  for (const n of [SESSION_COOKIE, CSRF_COOKIE, ROLE_COOKIE]) jar.set(n, "", { ...baseCookie, httpOnly: n !== CSRF_COOKIE && n !== ROLE_COOKIE, maxAge: 0 });
}

export interface Caller { profileId: string; roles: string[]; csrfCookie?: string }

// Resolve the current caller: opaque session (introspected by the API) first, then the dev-login
// JWT (dev/test only). Returns null when unauthenticated.
export async function resolveCaller(): Promise<Caller | null> {
  const jar = cookies();
  const session = jar.get(SESSION_COOKIE)?.value;
  if (session) {
    const r = await fetch(`${API}/auth/session/introspect`, {
      method: "POST",
      headers: { authorization: `Bearer ${SERVICE_TOKEN}`, "content-type": "application/json", "x-real-ip": clientIp() },
      body: JSON.stringify({ token: session }),
    }).catch(() => null);
    if (r && r.ok) {
      const d = (await r.json()) as { profileId: string; roles: string[] };
      return { profileId: d.profileId, roles: d.roles, csrfCookie: jar.get(CSRF_COOKIE)?.value };
    }
    return null; // session present but invalid/expired
  }
  // dev-login fallback (JWT cookie) — development/testing only.
  const devJwt = jar.get("sjkvy_token")?.value;
  if (devJwt && process.env.DEV_AUTH === "true") {
    try {
      const { jwtVerify } = await import("jose");
      const { payload } = await jwtVerify(devJwt, JWT_SECRET());
      return { profileId: String(payload.sub), roles: [] };
    } catch { return null; }
  }
  return null;
}

// Mint a short-lived API JWT for a resolved profile (the API expects auth.uid from JWT claims).
export async function mintApiJwt(profileId: string): Promise<string> {
  return new SignJWT({ role: "authenticated" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(profileId)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(JWT_SECRET());
}
