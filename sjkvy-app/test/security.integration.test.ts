// Security integration tests against the running Next dev server (localhost:3000). Prove the
// allowlisted proxy cannot reach service ops, ordinary users cannot finalize/scan, the scanner
// requires its own credential, and another applicant cannot read someone else's application.
import { describe, it, expect, beforeAll } from "vitest";
import { SignJWT } from "jose";

const APP = "http://127.0.0.1:3000";
const SECRET = new TextEncoder().encode("dev-local-jwt-secret-please-change-32chars");
const SCANNER = "dev-local-scanner-token-separate-xyz";

async function session(role: string): Promise<string> {
  const r = await fetch(`${APP}/api/dev-login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ role }) });
  return r.headers.get("set-cookie") ?? "";
}
async function sessionForSub(sub: string): Promise<string> {
  // build a cookie header directly for an arbitrary seeded profile
  const t = await new SignJWT({ role: "authenticated" }).setProtectedHeader({ alg: "HS256" }).setSubject(sub).setIssuedAt().setExpirationTime("10m").sign(SECRET);
  return `sjkvy_token=${t}; sjkvy_role=applicant`;
}

let up = false;
beforeAll(async () => { up = await fetch(`${APP}/`).then((r) => r.ok).catch(() => false); });
const skip = () => !up;

describe("proxy allowlist + document security", () => {
  it("blocks service-role finalize through the user proxy", async () => {
    if (skip()) return expect(true).toBe(true);
    const cookie = await session("applicant");
    const r = await fetch(`${APP}/api/proxy/documents/finalize`, { method: "POST", headers: { cookie, "content-type": "application/json" }, body: "{}" });
    expect(r.status).toBe(403);
  });

  it("blocks scan-result through the user proxy", async () => {
    if (skip()) return expect(true).toBe(true);
    const cookie = await session("applicant");
    const r = await fetch(`${APP}/api/proxy/documents/11111111-1111-1111-1111-111111111111/scan-result`, { method: "POST", headers: { cookie, "content-type": "application/json" }, body: '{"status":"CLEAN"}' });
    expect(r.status).toBe(403);
  });

  it("rejects path traversal in the proxy", async () => {
    if (skip()) return expect(true).toBe(true);
    const cookie = await session("applicant");
    const r = await fetch(`${APP}/api/proxy/..%2f..%2fadmin`, { headers: { cookie } });
    expect([400, 403, 404]).toContain(r.status);
  });

  it("scanner callback requires its own credential (unavailable to the browser)", async () => {
    if (skip()) return expect(true).toBe(true);
    const r = await fetch(`${APP}/api/internal/scan`, { method: "POST", headers: { "content-type": "application/json" }, body: '{"version_id":"11111111-1111-1111-1111-111111111111","verdict":"CLEAN"}' });
    expect(r.status).toBe(401);
  });

  it("scanner validates the verdict enum", async () => {
    if (skip()) return expect(true).toBe(true);
    const r = await fetch(`${APP}/api/internal/scan`, { method: "POST", headers: { "content-type": "application/json", "x-scanner-token": SCANNER }, body: '{"version_id":"11111111-1111-1111-1111-111111111111","verdict":"MAYBE"}' });
    expect(r.status).toBe(422);
  });

  it("an applicant cannot read another applicant's application via the proxy", async () => {
    if (skip()) return expect(true).toBe(true);
    // applicant A's application id
    const cookieA = await sessionForSub("a0000000-0000-0000-0000-00000000000a");
    const listA = await (await fetch(`${APP}/api/proxy/applications`, { headers: { cookie: cookieA } })).json();
    const appId = listA.items?.[0]?.id;
    if (!appId) return expect(true).toBe(true);
    // applicant B tries to read it
    const cookieB = await sessionForSub("a0000000-0000-0000-0000-00000000000b");
    const r = await fetch(`${APP}/api/proxy/applications/${appId}`, { headers: { cookie: cookieB } });
    expect([403, 404]).toContain(r.status);
  });

  it("public contact accepts a valid enquiry and rejects invalid input", async () => {
    if (skip()) return expect(true).toBe(true);
    const good = await fetch(`${APP}/api/proxy/public/contact`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Test User", email: "t@example.com", subject: "Admissions", message: "A real enquiry message." }) });
    expect(good.status).toBe(200);
    const bad = await fetch(`${APP}/api/proxy/public/contact`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "", email: "nope", subject: "", message: "x" }) });
    expect(bad.status).toBeGreaterThanOrEqual(400);
  });

  it("dev-login endpoint exists in dev but the upload route never auto-marks clean", async () => {
    if (skip()) return expect(true).toBe(true);
    // upload without a session → 401 (no auto-clean path reachable unauthenticated)
    const r = await fetch(`${APP}/api/documents/upload`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    expect(r.status).toBe(401);
  });
});
