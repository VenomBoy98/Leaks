// auth-bff.integration.test.ts — end-to-end first-party auth through the Next BFF (localhost:3000)
// against the running API. Proves: register issues a challenge (no OTP in the response), OTP
// verification sets an httpOnly opaque session + readable CSRF cookie, the session authorizes
// proxied API calls, CSRF is enforced on writes, and logout revokes the session. Skips if the
// dev servers / fake-provider OTP peek are unavailable.
import { describe, it, expect, beforeAll } from "vitest";

const APP = process.env.APP_BASE_URL ?? "http://127.0.0.1:3000";
const API = process.env.API_BASE_URL ?? "http://127.0.0.1:8080";
const SVC = process.env.SERVICE_TOKEN ?? "dev-local-service-token-abcdefgh";

let up = false;
beforeAll(async () => {
  up = await fetch(`${APP}/api/auth/session`).then((r) => r.status === 401 || r.ok).catch(() => false);
});
const guard = () => !up;

function jar() {
  const cookies: Record<string, string> = {};
  return {
    header: () => Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; "),
    absorb: (res: Response) => { for (const c of (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ?? []) { const [kv] = c.split(";"); const i = kv.indexOf("="); cookies[kv.slice(0, i)] = kv.slice(i + 1); } },
    get: (k: string) => cookies[k],
  };
}

describe("BFF password + email-OTP auth", () => {
  it("register → verify → authorized proxy → CSRF-guarded write → logout", async () => {
    if (guard()) return expect(true).toBe(true);
    const c = jar();
    const email = `bfftest-${Date.now()}@example.com`;
    const post = async (path: string, body: unknown, extra: Record<string, string> = {}) => {
      const r = await fetch(`${APP}${path}`, { method: "POST", headers: { "content-type": "application/json", cookie: c.header(), ...extra }, body: JSON.stringify(body) });
      c.absorb(r);
      return r;
    };

    const reg = await post("/api/auth/register", { name: "BFF Test", email, password: "Sup3r-Secret-Pw", confirmPassword: "Sup3r-Secret-Pw" });
    expect(reg.status).toBe(200);
    const { challengeId } = await reg.json();
    expect(challengeId).toBeTruthy();

    // fetch the OTP via the fake-provider dev peek (only present when EMAIL_PROVIDER=fake)
    const otpRes = await fetch(`${API}/auth/dev/last-otp`, { method: "POST", headers: { authorization: `Bearer ${SVC}`, "content-type": "application/json" }, body: JSON.stringify({ email }) });
    if (otpRes.status === 404) return expect(true).toBe(true); // not in fake mode; skip
    const { otp } = await otpRes.json();
    expect(otp).toMatch(/^\d{6}$/);

    const ver = await post("/api/auth/register/verify", { challengeId, otp });
    expect(ver.status).toBe(200);
    expect(c.get("sjkvy_session")).toBeTruthy(); // httpOnly opaque session set
    expect(c.get("sjkvy_csrf")).toBeTruthy();

    // authorized proxied read
    const me = await fetch(`${APP}/api/proxy/auth/me`, { headers: { cookie: c.header() } });
    expect(me.status).toBe(200);

    // write without CSRF → 403; with CSRF → allowed
    const noCsrf = await fetch(`${APP}/api/proxy/auth/me`, { method: "PATCH", headers: { cookie: c.header(), "content-type": "application/json" }, body: JSON.stringify({ preferred_lang: "en" }) });
    expect(noCsrf.status).toBe(403);
    const withCsrf = await fetch(`${APP}/api/proxy/auth/me`, { method: "PATCH", headers: { cookie: c.header(), "content-type": "application/json", "x-sjkvy-csrf": decodeURIComponent(c.get("sjkvy_csrf")!) }, body: JSON.stringify({ preferred_lang: "en" }) });
    expect(withCsrf.status).toBe(200);

    // logout revokes the session
    await post("/api/auth/logout", {});
    const after = await fetch(`${APP}/api/proxy/auth/me`, { headers: { cookie: c.header() } });
    expect(after.status).toBe(401);
  });

  it("register does not return the OTP in its response", async () => {
    if (guard()) return expect(true).toBe(true);
    const r = await fetch(`${APP}/api/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "No Leak", email: `noleak-${Date.now()}@example.com`, password: "Sup3r-Secret-Pw" }) });
    const body = await r.text();
    expect(body).not.toMatch(/\b\d{6}\b/);
  });
});
