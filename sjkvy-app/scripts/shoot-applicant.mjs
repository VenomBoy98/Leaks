import { chromium } from "playwright";
import { SignJWT } from "jose";
const base = "http://127.0.0.1:3000";
const secret = new TextEncoder().encode("dev-local-jwt-secret-please-change-32chars");
const tok = await new SignJWT({role:"authenticated"}).setProtectedHeader({alg:"HS256"}).setSubject("a0000000-0000-0000-0000-00000000000a").setIssuedAt().setExpirationTime("1h").sign(secret);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await b.newContext({ viewport: { width: 1440, height: 1100 } });
await ctx.addCookies([
  { name: "sjkvy_token", value: tok, url: base },
  { name: "sjkvy_role", value: "applicant", url: base },
]);
const page = await ctx.newPage();
for (const [route, name] of [["/dashboard","dashboard"],["/documents","documents"],["/application","application"],["/notifications","notifications"]]) {
  await page.goto(base+route, { waitUntil: "networkidle", timeout: 20000 }).catch(()=>{});
  await page.waitForTimeout(1200);
  const h = await page.evaluate(()=>document.querySelector('[data-testid=app-ref], h1, h2')?.textContent?.trim());
  console.log(route.padEnd(14), JSON.stringify(h));
  await page.screenshot({ path: `/tmp/appl_${name}.png` });
}
await b.close(); console.log("done");
