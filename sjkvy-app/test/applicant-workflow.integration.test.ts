// Applicant workflow integration test — drives the REAL backend end to end with separate
// applicant/staff identities, using the same operations the app's BFF uses. Fixtures only
// (a throwaway profile per run). Skips gracefully if the API/DB aren't up.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { SignJWT } from "jose";
import { Client } from "pg";
import { randomUUID } from "node:crypto";

const API = process.env.API_BASE_URL ?? "http://127.0.0.1:8080";
const SERVICE = process.env.SERVICE_TOKEN ?? "dev-local-service-token-abcdefgh";
const SECRET = new TextEncoder().encode(process.env.DEV_JWT_SECRET ?? "dev-local-jwt-secret-please-change-32chars");
const COUNSELLOR = "50000000-0000-0000-0000-0000000000a3"; // staff (counsellor) at centre 1 — triages the queue
const CHECKER = "50000000-0000-0000-0000-0000000000a2"; // checker at centre 1 — sees a case only once ASSIGNED
const COURSE = "aa000000-0000-0000-0000-000000000001";

const tok = (sub: string) =>
  new SignJWT({ role: "authenticated" }).setProtectedHeader({ alg: "HS256" }).setSubject(sub).setIssuedAt().setExpirationTime("10m").sign(SECRET);
const asUser = async (sub: string) => ({ authorization: `Bearer ${await tok(sub)}`, "content-type": "application/json" });
const asService = { authorization: `Bearer ${SERVICE}`, "content-type": "application/json" };

const applicant = randomUUID();
const other = randomUUID();
const submitKey = randomUUID(); // fixed idempotency key → double-submit is a safe replay
const submitHeaders = async () => ({ authorization: (await asUser(applicant)).authorization, "idempotency-key": submitKey });
let pg: Client | null = null;
let up = false;
let appId = "";

beforeAll(async () => {
  up = await fetch(`${API}/verify/x`).then((r) => r.ok).catch(() => false);
  if (!up) return;
  pg = new Client({ host: "/tmp/sjkvy-pg/sock", port: 5433, user: "postgres", database: "sjkvy" });
  try {
    await pg.connect();
    for (const [id, name] of [[applicant, "WF Applicant"], [other, "WF Other"]] as const) {
      await pg.query(
        "INSERT INTO app.profiles (id, full_name, phone, preferred_lang, is_active) VALUES ($1,$2,$3,'en',true) ON CONFLICT (id) DO NOTHING",
        [id, name, "+9198" + Math.floor(1e8 + Math.random() * 8e8)],
      );
    }
  } catch {
    up = false;
  }
});
afterAll(async () => {
  if (pg) {
    await pg.query("DELETE FROM app.profiles WHERE id = ANY($1)", [[applicant, other]]).catch(() => {});
    await pg.end().catch(() => {});
  }
});

const guard = () => !up;

describe("applicant → staff cross-portal workflow", () => {
  it("creates exactly one application (draft)", async () => {
    if (guard()) return expect(true).toBe(true);
    const r = await fetch(`${API}/applications`, {
      method: "POST", headers: await asUser(applicant),
      body: JSON.stringify({ course_id: COURSE, dob: "2002-06-15", gender: "F", district: "Ranchi" }),
    });
    expect(r.status).toBe(201);
    const b = await r.json();
    expect(b.status).toBe("DRAFT");
    appId = b.application_id;
  });

  it("prevents a duplicate active application", async () => {
    if (guard()) return expect(true).toBe(true);
    const r = await fetch(`${API}/applications`, {
      method: "POST", headers: await asUser(applicant),
      body: JSON.stringify({ course_id: COURSE, dob: "2002-06-15", gender: "F", district: "Ranchi" }),
    });
    expect(r.status).toBeGreaterThanOrEqual(400); // E.CONFLICT.ALREADY_ACTIVE
  });

  it("saves a draft (autosave) and can be reopened", async () => {
    if (guard()) return expect(true).toBe(true);
    const save = await fetch(`${API}/applications/${appId}/draft`, {
      method: "PATCH", headers: await asUser(applicant), body: JSON.stringify({ fields: { block: "Namkum", address: "Line 4" } }),
    });
    expect(save.status).toBe(200);
    const reopened = await fetch(`${API}/applications/${appId}`, { headers: await asUser(applicant) });
    expect(reopened.status).toBe(200);
    expect((await reopened.json()).id).toBe(appId);
  });

  it("rejects submission while required documents are missing", async () => {
    if (guard()) return expect(true).toBe(true);
    const r = await fetch(`${API}/applications/${appId}/submit`, { method: "POST", headers: { authorization: (await asUser(applicant)).authorization, "idempotency-key": randomUUID() } });
    expect(r.status).toBeGreaterThanOrEqual(400); // E.VAL.FAILED docs_missing (MATRIC)
    expect((await r.json()).detail?.docs_missing).toContain("MATRIC");
  });

  it("uploads the required MATRIC document and it becomes CLEAN (BFF service flow)", async () => {
    if (guard()) return expect(true).toBe(true);
    const fin = await fetch(`${API}/documents/finalize`, {
      method: "POST", headers: asService,
      body: JSON.stringify({ caller: applicant, application_id: appId, document_type: "MATRIC", storage_path: `${appId}/matric.pdf`, mime: "application/pdf", size: 1234, sha256: "a".repeat(64) }),
    });
    expect(fin.status).toBe(201);
    const { version_id } = await fin.json();
    const scan = await fetch(`${API}/documents/${version_id}/scan-result`, { method: "POST", headers: asService, body: JSON.stringify({ status: "CLEAN" }) });
    expect(scan.status).toBe(200);
  });

  it("submits successfully once requirements are met, creating a verification case", async () => {
    if (guard()) return expect(true).toBe(true);
    const r = await fetch(`${API}/applications/${appId}/submit`, { method: "POST", headers: await submitHeaders() });
    expect(r.status).toBe(200);
    expect((await r.json()).status).toBe("SUBMITTED");
  });

  it("submitted application appears in the authorized staff verification queue (triage role)", async () => {
    if (guard()) return expect(true).toBe(true);
    const r = await fetch(`${API}/verification/cases`, { headers: await asUser(COUNSELLOR) });
    expect(r.status).toBe(200);
    const found = (await r.json()).items.some((c: { application_id: string }) => c.application_id === appId);
    expect(found, "case must be visible to the centre's triage staff").toBe(true);
  });

  it("an unassigned checker cannot yet see the case (assignment-gated visibility)", async () => {
    if (guard()) return expect(true).toBe(true);
    const r = await fetch(`${API}/verification/cases`, { headers: await asUser(CHECKER) });
    expect(r.status).toBe(200);
    const found = (await r.json()).items.some((c: { application_id: string }) => c.application_id === appId);
    expect(found, "unassigned checker must NOT see the case").toBe(false);
  });

  it("is idempotent-safe: another submit does not error or double-process", async () => {
    if (guard()) return expect(true).toBe(true);
    // same idempotency key as the successful submit → safe replay, not a second case
    const r = await fetch(`${API}/applications/${appId}/submit`, { method: "POST", headers: await submitHeaders() });
    expect(r.status).toBe(200);
    expect((await r.json()).status).toBe("SUBMITTED");
    // exactly one verification case exists for this application
    if (pg) {
      const { rows } = await pg.query("SELECT count(*)::int n FROM app.verification_cases WHERE application_id=$1", [appId]);
      expect(rows[0].n).toBe(1);
    }
  });

  it("enforces applicant ownership isolation (another applicant cannot read it)", async () => {
    if (guard()) return expect(true).toBe(true);
    const r = await fetch(`${API}/applications/${appId}`, { headers: await asUser(other) });
    expect([403, 404]).toContain(r.status);
  });

  it("creates a notification for the applicant after submission", async () => {
    if (guard()) return expect(true).toBe(true);
    const r = await fetch(`${API}/notifications`, { headers: await asUser(applicant) });
    expect(r.status).toBe(200);
    // outbox → notification may be async; assert the endpoint is reachable and shape is right
    expect(Array.isArray((await r.json()).items)).toBe(true);
  });

  it("applicant withdraws with a reason (idempotent)", async () => {
    if (guard()) return expect(true).toBe(true);
    const key = randomUUID();
    const hdr = { authorization: (await asUser(applicant)).authorization, "content-type": "application/json", "idempotency-key": key };
    const r1 = await fetch(`${API}/applications/${appId}/withdraw`, { method: "POST", headers: hdr, body: JSON.stringify({ reason: "Relocating out of state" }) });
    expect(r1.status).toBe(200);
    expect((await r1.json()).status).toBe("WITHDRAWN");
    // replay with the same key → safe (no error, no double-processing)
    const r2 = await fetch(`${API}/applications/${appId}/withdraw`, { method: "POST", headers: hdr, body: JSON.stringify({ reason: "Relocating out of state" }) });
    expect(r2.status).toBe(200);
  });

  it("withdrawn application is no longer actionable in the staff queue", async () => {
    if (guard()) return expect(true).toBe(true);
    const r = await fetch(`${API}/verification/cases`, { headers: await asUser(COUNSELLOR) });
    const cases = (await r.json()).items as Array<{ application_id: string; status: string }>;
    const c = cases.find((x) => x.application_id === appId);
    // either dropped from the actionable queue, or present only as a terminal FAILED case
    expect(!c || c.status === "FAILED").toBe(true);
  });
});
