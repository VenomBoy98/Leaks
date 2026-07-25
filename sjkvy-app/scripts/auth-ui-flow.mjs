// Browser flow: register via the real UI -> OTP step -> fetch OTP (fake provider) -> verify -> land on dashboard.
import { chromium } from "playwright";
const base = "http://127.0.0.1:3000", API = "http://127.0.0.1:8080", SVC = "dev-local-service-token-abcdefgh";
const chromePath = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const email = `uiflow-${Date.now()}@example.com`;
const fail = (m) => { console.error("FAIL:", m); process.exitCode = 1; };
const ok = (m) => console.log("ok:", m);
const b = await chromium.launch({ executablePath: chromePath });
try {
  const page = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await page.goto(`${base}/register`, { waitUntil: "networkidle" });
  await page.fill('input[autocomplete="name"]', "UI Flow User");
  await page.fill('input[type="email"]', email);
  const pws = await page.$$('input[type="password"]');
  await pws[0].fill("Sup3r-Secret-Pw"); await pws[1].fill("Sup3r-Secret-Pw");
  await page.click('button:has-text("Create account")');
  await page.waitForSelector('input[aria-label="Digit 1"]', { timeout: 8000 });
  ok("register form submitted; OTP step shown");
  // fetch OTP via the fake-provider dev peek
  const otp = (await (await fetch(`${API}/auth/dev/last-otp`, { method: "POST", headers: { authorization: `Bearer ${SVC}`, "content-type": "application/json" }, body: JSON.stringify({ email }) })).json()).otp;
  /^\d{6}$/.test(otp) ? ok("OTP retrieved") : fail("no OTP");
  // paste the whole code into the first box
  await page.click('input[aria-label="Digit 1"]');
  await page.evaluate((code) => navigator.clipboard.writeText(code), otp).catch(() => {});
  // type digits (paste needs clipboard perms; type instead for reliability)
  for (let i = 0; i < 6; i++) { await page.fill(`input[aria-label="Digit ${i + 1}"]`, otp[i]); }
  await page.waitForTimeout(500);
  await page.click('button:has-text("Verify")').catch(() => {});
  await page.waitForURL("**/dashboard", { timeout: 8000 }).catch(() => {});
  const url = page.url();
  url.includes("/dashboard") ? ok("verified → landed on dashboard (session active)") : fail(`did not land on dashboard (at ${url})`);
} catch (e) { fail("exception: " + (e?.message ?? e)); } finally {
  await b.close();
  console.log(process.exitCode ? "AUTH UI FLOW: FAIL" : "AUTH UI FLOW: PASS");
}
