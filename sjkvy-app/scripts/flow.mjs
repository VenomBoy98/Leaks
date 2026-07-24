// End-to-end browser flow: login -> role home -> interconnected navigation, with live data.
import { chromium } from "playwright";
const base = "http://127.0.0.1:3000";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await b.newContext({ viewport: { width: 1440, height: 1200 } });
await ctx.route("**/*", (r) => {
  const u = r.request().url();
  return u.includes("127.0.0.1") || u.includes("localhost") || u.startsWith("data:") ? r.continue() : r.abort();
});
const page = await ctx.newPage();

// 1. login as student
await page.goto(base + "/login", { waitUntil: "domcontentloaded" });
await page.waitForSelector("#username", { timeout: 8000 }).catch(() => {});
await page.fill("#username", "student");
await page.fill("#password", "x");
await Promise.all([
  page.waitForURL("**/student-dashboard", { timeout: 10000 }).catch(() => {}),
  page.click('#loginForm button[type="submit"], form button[type="submit"]'),
]);
await page.waitForTimeout(800);
console.log("after login URL:", page.url());
const greet = await page.evaluate(() => (document.querySelector("h1")?.textContent || "").trim());
console.log("dashboard greeting:", greet);
await page.screenshot({ path: "/tmp/flow_student_dashboard.png" });

// 2. interconnected nav: click "Assessments" in the sidebar
const clicked = await page.evaluate(() => {
  const a = [...document.querySelectorAll("a")].find((x) => /assessments/i.test(x.textContent || ""));
  if (a) { a.click(); return a.textContent.trim(); }
  return null;
});
await page.waitForURL("**/assessments", { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(500);
console.log("clicked nav:", clicked, "-> URL:", page.url());
await page.screenshot({ path: "/tmp/flow_assessments.png" });

// 3. logout
const out = await page.evaluate(() => {
  const a = [...document.querySelectorAll("a,button")].find((x) => /sign out|log ?out/i.test(x.textContent || ""));
  if (a) { a.click(); return true; } return false;
});
await page.waitForTimeout(800);
console.log("logout link found:", out, "-> URL:", page.url());

await b.close();
console.log("flow done");
