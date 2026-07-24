// Screenshot all 42 screens. Portal screens are auth-gated by middleware, so we set the
// matching role cookie per zone before navigating.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const base = process.argv[2] ?? "http://127.0.0.1:3000";
const exe = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
mkdirSync("/tmp/pages", { recursive: true });

const ZONE = {
  applicant: ["dashboard", "application", "documents", "timeline", "notifications", "profile"],
  student: ["student-dashboard", "attendance", "hostel", "assessments", "certificates", "placement", "student-profile"],
  staff: ["staff-dashboard", "verification", "counselling", "staff-attendance", "staff-hostel", "staff-placement", "staff-reports", "staff-directory"],
  admin: ["admin-dashboard", "admin-applications", "admin-admissions", "admin-directory", "admin-hostel", "admin-programs", "admin-assessments", "admin-certificates", "admin-industry", "admin-reports", "admin-settings"],
};
const roleOf = (name) => {
  for (const [role, names] of Object.entries(ZONE)) if (names.includes(name)) return role;
  return null; // public
};
const PUBLIC = ["index", "home", "schemes", "campus", "about", "support", "contact", "login", "register", "sitemap"];
const ALL = [...PUBLIC, ...Object.values(ZONE).flat()];

const b = await chromium.launch({ executablePath: exe });
const ctx = await b.newContext({ viewport: { width: 1440, height: 1600 }, deviceScaleFactor: 1 });
// Abort external (non-localhost) requests so blocked CDN images don't stall the page.
// Fonts are self-hosted locally, so this doesn't affect typography or icons.
await ctx.route("**/*", (route) => {
  const u = route.request().url();
  if (u.includes("127.0.0.1") || u.includes("localhost") || u.startsWith("data:")) return route.continue();
  return route.abort();
});
const page = await ctx.newPage();

let ok = 0;
for (const name of ALL) {
  const role = roleOf(name);
  await ctx.clearCookies();
  if (role) await ctx.addCookies([{ name: "sjkvy_role", value: role, url: base }]);
  const path = name === "index" ? "/" : `/${name}`;
  const resp = await page.goto(base + path, { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => null);
  // Force load animations to their final state so nothing is captured mid-fade.
  await page.addStyleTag({
    content:
      ".stagger-in,.reveal-up{opacity:1!important;transform:none!important;animation:none!important}" +
      "*{animation-duration:0s!important;transition:none!important}",
  }).catch(() => {});
  await page.waitForTimeout(300);
  const finalUrl = page.url();
  await page.screenshot({ path: `/tmp/pages/${name}.png`, fullPage: true });
  const redirected = !finalUrl.endsWith(path) && !(name === "index" && finalUrl.replace(base, "") === "/");
  console.log(`${name.padEnd(20)} ${role ?? "public"} http=${resp?.status() ?? "?"}${redirected ? "  REDIRECT->" + finalUrl.replace(base, "") : ""}`);
  ok++;
}
await b.close();
console.log(`\ncaptured ${ok} screens -> /tmp/pages/`);
