// Browser UI flow (Playwright) — interacts with the VISIBLE applicant screens end to end:
// fill the form, save, reload+restore, upload a document (stays PENDING), scanner marks CLEAN,
// submit, and see the real status on the dashboard. Uses a throwaway applicant.
import { chromium } from "playwright";
import { SignJWT } from "jose";
import { Client } from "pg";
import { randomUUID } from "node:crypto";

const base = "http://127.0.0.1:3000";
const SECRET = new TextEncoder().encode("dev-local-jwt-secret-please-change-32chars");
const SCANNER = "dev-local-scanner-token-separate-xyz";
const COURSE = "aa000000-0000-0000-0000-000000000001";
const applicant = randomUUID();
const fail = (m) => { console.error("FAIL:", m); process.exitCode = 1; };
const ok = (m) => console.log("ok:", m);

const pg = new Client({ host: "/tmp/sjkvy-pg/sock", port: 5433, user: "postgres", database: "sjkvy" });
await pg.connect();
await pg.query("INSERT INTO app.profiles (id,full_name,phone,preferred_lang,is_active) VALUES ($1,'UI Applicant',$2,'en',true) ON CONFLICT (id) DO NOTHING", [applicant, "+9198" + Math.floor(1e8 + Math.random() * 8e8)]);

const token = await new SignJWT({ role: "authenticated" }).setProtectedHeader({ alg: "HS256" }).setSubject(applicant).setIssuedAt().setExpirationTime("1h").sign(SECRET);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
await ctx.addCookies([{ name: "sjkvy_token", value: token, url: base }, { name: "sjkvy_role", value: "applicant", url: base }]);
const page = await ctx.newPage();

try {
  // 1. open the form, fill step 1, save & continue → creates a draft
  await page.goto(`${base}/application`, { waitUntil: "networkidle" });
  await page.selectOption("select >> nth=0", COURSE);
  await page.fill('input[type="date"]', "2002-06-15");
  await page.selectOption("select >> nth=1", "F");
  await page.fill('input[placeholder="e.g. Ranchi"]', "Ranchi");
  await page.click("text=Save & continue");
  await page.waitForTimeout(1500);
  ok("filled step 1 and saved (draft created)");

  // 2. reload → the course value is restored (single draft, no duplicate)
  await page.goto(`${base}/application`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const courseVal = await page.$eval("select >> nth=0", (el) => el.value).catch(() => "");
  courseVal === COURSE ? ok("draft restored after reload") : fail(`draft not restored (got ${courseVal})`);

  // 3. documents → upload MATRIC, remains PENDING (never auto-clean)
  await page.goto(`${base}/documents`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const pdf = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.from("ui-test document body")]);
  const input = await page.$('input[type="file"]');
  await input.setInputFiles({ name: "matric.pdf", mimeType: "application/pdf", buffer: pdf });
  // confirm via DB that the version was finalized as PENDING (never auto-clean)
  let versionId = null, scanStatus = null;
  for (let i = 0; i < 12 && !versionId; i++) {
    const q = await pg.query(
      `SELECT dv.id, dv.scan_status FROM app.document_versions dv JOIN app.applicant_documents d ON d.id=dv.document_id
       JOIN app.applications a ON a.id=d.application_id JOIN app.applicants ap ON ap.id=a.applicant_id
       WHERE ap.profile_id=$1 ORDER BY dv.created_at DESC LIMIT 1`, [applicant]);
    if (q.rows[0]) { versionId = q.rows[0].id; scanStatus = q.rows[0].scan_status; }
    else await page.waitForTimeout(500);
  }
  versionId && scanStatus === "PENDING" ? ok("uploaded document is PENDING (not auto-clean)") : fail(`document not pending after upload (status=${scanStatus})`);

  // 4. submit is blocked while the document is pending (reload resets to step 0)
  await page.goto(`${base}/application`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.click('button:has-text("Continue")'); // step 0→1
  await page.click('button:has-text("Continue")'); // step 1→2
  await page.waitForSelector('[data-testid="submit-btn"]', { timeout: 8000 });
  const disabledBefore = await page.getAttribute('[data-testid="submit-btn"]', "disabled");
  disabledBefore !== null ? ok("submit disabled while document pending") : fail("submit was NOT disabled while pending");

  // 5. trusted scanner marks the version CLEAN (separate credential)
  const scan = await fetch(`${base}/api/internal/scan`, { method: "POST", headers: { "content-type": "application/json", "x-scanner-token": SCANNER }, body: JSON.stringify({ version_id: versionId, verdict: "CLEAN" }) });
  scan.ok ? ok("scanner marked CLEAN") : fail("scanner call failed " + scan.status);

  // 6. now submit is enabled → submit → land on dashboard with SUBMITTED
  await page.goto(`${base}/application`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.click('button:has-text("Continue")'); await page.click('button:has-text("Continue")');
  await page.waitForSelector('[data-testid="submit-btn"]', { timeout: 8000 });
  const disabledAfter = await page.getAttribute('[data-testid="submit-btn"]', "disabled");
  disabledAfter === null ? ok("submit enabled after CLEAN") : fail("submit still disabled after CLEAN");
  await page.click('[data-testid="submit-btn"]');
  await page.click("text=Confirm submit");
  await page.waitForURL("**/dashboard", { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1000);
  const status = await page.textContent("body");
  /Submitted/i.test(status) ? ok("dashboard shows SUBMITTED after submit") : fail("dashboard did not show submitted");
  await page.screenshot({ path: "/tmp/ui_flow_final.png" });

  // 7. withdrawal through the visible UI (confirmation dialog + required reason)
  await page.goto(`${base}/application`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="withdraw-open"]', { timeout: 8000 });
  await page.click('[data-testid="withdraw-open"]');
  await page.fill('[data-testid="withdraw-reason"]', "No longer able to attend this session");
  await page.click('[data-testid="withdraw-confirm"]');
  await page.waitForURL("**/dashboard", { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const afterWithdraw = await page.textContent("body");
  /Withdrawn/i.test(afterWithdraw) ? ok("dashboard shows WITHDRAWN after UI withdrawal") : fail("dashboard did not show withdrawn");
} catch (e) {
  fail("exception: " + e.message);
} finally {
  await pg.query("DELETE FROM app.profiles WHERE id=$1", [applicant]).catch(() => {});
  await pg.end();
  await b.close();
  console.log(process.exitCode ? "UI FLOW: FAIL" : "UI FLOW: PASS");
}
