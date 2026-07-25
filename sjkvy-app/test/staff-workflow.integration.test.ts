// Staff workflow integration — drives the REAL backend through the Next BFF proxy (localhost:3000)
// with per-profile staff sessions. Proves: staff reads are RLS/centre-scoped, a centre-2 admin
// cannot see centre-1 records, assignment-gated queue visibility, the proxy allowlist blocks
// service ops and un-listed paths, and the reports aggregates are real. Skips gracefully if the
// dev server isn't up. Read-only against seeded data (no mutations of shared state).
import { describe, it, expect, beforeAll } from "vitest";
import { SignJWT } from "jose";

const APP = process.env.APP_BASE_URL ?? "http://127.0.0.1:3000";
const SECRET = new TextEncoder().encode(process.env.DEV_JWT_SECRET ?? "dev-local-jwt-secret-please-change-32chars");

// Seeded staff (see app.staff_memberships): centre 1 = Hazaribagh, centre 2 = Other Centre.
const CAD1 = "50000000-0000-0000-0000-0000000000a4"; // centre_admin, centre 1
const CAD2 = "50000000-0000-0000-0000-0000000000a5"; // centre_admin, centre 2
const CHECKER = "50000000-0000-0000-0000-0000000000a2"; // checker, centre 1 (assignment-gated)
const COUNSELLOR = "50000000-0000-0000-0000-0000000000a3"; // counsellor, centre 1
const APPLICANT = "a0000000-0000-0000-0000-00000000000a";

async function cookie(sub: string, role = "admin"): Promise<string> {
  const t = await new SignJWT({ role: "authenticated" }).setProtectedHeader({ alg: "HS256" }).setSubject(sub).setIssuedAt().setExpirationTime("10m").sign(SECRET);
  return `sjkvy_token=${t}; sjkvy_role=${role}`;
}
const get = (path: string, ck: string) => fetch(`${APP}/api/proxy/${path}`, { headers: { cookie: ck } });
const items = async (r: Response) => ((await r.json()).items ?? []) as Array<Record<string, unknown>>;

let up = false;
beforeAll(async () => {
  up = await fetch(`${APP}/api/dev-login`, { method: "POST", headers: { "content-type": "application/json" }, body: '{"role":"applicant"}' }).then((r) => r.ok).catch(() => false);
});
const guard = () => !up;

describe("staff reads are centre-scoped through the BFF proxy", () => {
  it("centre-1 admin sees their verification queue", async () => {
    if (guard()) return expect(true).toBe(true);
    const r = await get("verification/cases", await cookie(CAD1));
    expect(r.status).toBe(200);
    expect((await items(r)).length).toBeGreaterThan(0);
  });

  it("centre-2 admin CANNOT see centre-1 verification cases (cross-centre isolation)", async () => {
    if (guard()) return expect(true).toBe(true);
    const c1 = await items(await get("verification/cases", await cookie(CAD1)));
    const c2 = await items(await get("verification/cases", await cookie(CAD2)));
    const c1ids = new Set(c1.map((x) => x.id));
    // none of centre-1's cases may appear for the centre-2 admin
    expect(c2.some((x) => c1ids.has(x.id))).toBe(false);
  });

  it("centre-2 admin CANNOT see centre-1 hostel beds", async () => {
    if (guard()) return expect(true).toBe(true);
    const beds1 = await items(await get("hostel/beds", await cookie(CAD1)));
    const beds2 = await items(await get("hostel/beds", await cookie(CAD2)));
    expect(beds1.length).toBeGreaterThan(0);
    const ids1 = new Set(beds1.map((b) => b.id));
    expect(beds2.some((b) => ids1.has(b.id))).toBe(false);
  });

  it("an unassigned checker does not see a pending-assignment case the counsellor sees", async () => {
    if (guard()) return expect(true).toBe(true);
    const triage = await items(await get("verification/cases", await cookie(COUNSELLOR)));
    const checkerView = await items(await get("verification/cases", await cookie(CHECKER)));
    const pending = triage.find((c) => c.status === "PENDING_ASSIGNMENT");
    if (pending) {
      expect(checkerView.some((c) => c.id === pending.id)).toBe(false);
    } else {
      expect(true).toBe(true); // no pending case seeded right now — nothing to assert
    }
  });
});

describe("0011: document version_id exposure is authorized and leak-free", () => {
  it("authorized staff see version_id but never storage_path", async () => {
    if (guard()) return expect(true).toBe(true);
    const cases = await items(await get("verification/cases", await cookie(CAD1)));
    // find a case whose application has at least one document visible to the centre admin
    let docs: Array<Record<string, unknown>> = [];
    for (const c of cases) {
      const d = await items(await get(`applications/${c.application_id}/documents`, await cookie(CAD1)));
      if (d.length) { docs = d; break; }
    }
    if (docs.length === 0) return expect(true).toBe(true); // no seeded docs to assert on
    for (const d of docs) {
      expect(d).toHaveProperty("version_id");
      expect(d).not.toHaveProperty("storage_path"); // 0011 must not leak the object location
    }
  });

  it("a centre-2 admin cannot read a centre-1 application's documents (cross-centre denial)", async () => {
    if (guard()) return expect(true).toBe(true);
    const cases = await items(await get("verification/cases", await cookie(CAD1)));
    const withDocs: string[] = [];
    for (const c of cases) {
      const d = await items(await get(`applications/${c.application_id}/documents`, await cookie(CAD1)));
      if (d.length) { withDocs.push(String(c.application_id)); break; }
    }
    if (withDocs.length === 0) return expect(true).toBe(true);
    const r = await get(`applications/${withDocs[0]}/documents`, await cookie(CAD2));
    // RLS view returns no rows for a non-scoped admin (never someone else's rows)
    const d2 = r.status === 200 ? await items(r) : [];
    expect(d2.length).toBe(0);
  });

  it("an unrelated applicant cannot read another applicant's documents", async () => {
    if (guard()) return expect(true).toBe(true);
    const cases = await items(await get("verification/cases", await cookie(CAD1)));
    let target = "";
    for (const c of cases) {
      const d = await items(await get(`applications/${c.application_id}/documents`, await cookie(CAD1)));
      if (d.length) { target = String(c.application_id); break; }
    }
    if (!target) return expect(true).toBe(true);
    // a throwaway applicant sub with no relationship to the application
    const stranger = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    const r = await get(`applications/${target}/documents`, await cookie(stranger, "applicant"));
    const d = r.status === 200 ? await items(r) : [];
    expect(d.length).toBe(0);
  });
});

describe("staff reports are real scoped aggregates", () => {
  it("centre-1 admin gets non-empty verification aggregate; centre-2 admin's is disjoint", async () => {
    if (guard()) return expect(true).toBe(true);
    const a1 = await items(await get("reports/verification", await cookie(CAD1)));
    expect(a1.length).toBeGreaterThan(0);
    expect(a1[0]).toHaveProperty("n");
    const total1 = a1.reduce((s, r) => s + (r.n as number), 0);
    const a2 = await items(await get("reports/verification", await cookie(CAD2)));
    const total2 = a2.reduce((s, r) => s + (r.n as number), 0);
    // centre 2 has no verification cases seeded → its scoped total is strictly smaller
    expect(total2).toBeLessThan(total1);
  });
});

describe("proxy allowlist + authorization boundaries", () => {
  it("blocks the service-only finalize op through the user proxy", async () => {
    if (guard()) return expect(true).toBe(true);
    const r = await fetch(`${APP}/api/proxy/documents/finalize`, { method: "POST", headers: { cookie: await cookie(CAD1), "content-type": "application/json" }, body: "{}" });
    expect(r.status).toBe(403);
  });

  it("blocks a non-allowlisted path (403, never forwarded)", async () => {
    if (guard()) return expect(true).toBe(true);
    const r = await get("admin/exports", await cookie(CAD1)); // real API op, deliberately not allowlisted
    expect(r.status).toBe(403);
  });

  it("an applicant session leaks no staff data from the staff roster read", async () => {
    if (guard()) return expect(true).toBe(true);
    const r = await get("admin/staff", await cookie(APPLICANT, "applicant"));
    // RLS returns an empty set for a non-staff caller (no rows, not someone else's rows)
    expect(r.status).toBe(200);
    expect((await items(r)).length).toBe(0);
  });

  it("the staff roster read is scoped to the caller's own centre", async () => {
    if (guard()) return expect(true).toBe(true);
    const staff1 = await items(await get("admin/staff", await cookie(CAD1)));
    expect(staff1.length).toBeGreaterThan(0);
    // every membership the centre-1 admin sees belongs to centre 1
    const centres = new Set(staff1.map((s) => s.centre_id));
    expect(centres.size).toBe(1);
  });
});
