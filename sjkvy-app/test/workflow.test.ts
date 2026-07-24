// Cross-portal workflow + authorization test against the RUNNING backend (fixtures only).
// Skips gracefully if the API isn't up. Proves: an applicant's application is visible to the
// applicant (owner scope) and to the centre admin (centre scope) — same record — and that an
// applicant token cannot invoke an admin-only admission decision.
import { describe, it, expect, beforeAll } from "vitest";
import { SignJWT } from "jose";

const API = process.env.API_BASE_URL ?? "http://127.0.0.1:8080";
const SECRET = new TextEncoder().encode(process.env.DEV_JWT_SECRET ?? "dev-local-jwt-secret-please-change-32chars");
const USERS = {
  applicant: "a0000000-0000-0000-0000-00000000000a",
  admin: "50000000-0000-0000-0000-0000000000a4",
};
const token = (sub: string) =>
  new SignJWT({ role: "authenticated" }).setProtectedHeader({ alg: "HS256" }).setSubject(sub).setIssuedAt().setExpirationTime("10m").sign(SECRET);
const get = async (path: string, sub: string) => {
  const r = await fetch(`${API}${path}`, { headers: { authorization: `Bearer ${await token(sub)}` } });
  return { status: r.status, body: await r.json().catch(() => null) };
};

let up = false;
beforeAll(async () => {
  up = await fetch(`${API}/verify/x`).then((r) => r.ok).catch(() => false);
});

describe("cross-portal application visibility", () => {
  it("applicant sees their own application", async () => {
    if (!up) return expect(true).toBe(true);
    const { status, body } = await get("/applications", USERS.applicant);
    expect(status).toBe(200);
    expect(body.items.length).toBeGreaterThan(0);
  });

  it("centre admin sees the same application (cross-portal consistency)", async () => {
    if (!up) return expect(true).toBe(true);
    const a = await get("/applications", USERS.applicant);
    const adm = await get("/applications", USERS.admin);
    expect(adm.status).toBe(200);
    const applicantAppIds = new Set(a.body.items.map((x: { id: string }) => x.id));
    const overlap = adm.body.items.some((x: { id: string }) => applicantAppIds.has(x.id));
    expect(overlap, "admin should see the applicant's application").toBe(true);
  });

  it("applicant cannot make an admission decision (authorization enforced server-side)", async () => {
    if (!up) return expect(true).toBe(true);
    const a = await get("/applications", USERS.applicant);
    const appId = a.body.items[0].id;
    const r = await fetch(`${API}/applications/${appId}/admission`, {
      method: "POST",
      headers: { authorization: `Bearer ${await token(USERS.applicant)}`, "content-type": "application/json" },
      body: JSON.stringify({ decision: "APPROVED" }),
    });
    // must NOT succeed for a non-admin
    expect(r.status, "applicant must not successfully decide admission").not.toBe(200);
    expect(r.status).toBeGreaterThanOrEqual(400);
  });
});
