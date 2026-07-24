import { chromium } from "playwright";
const base = process.argv[2] ?? "http://127.0.0.1:3000";
const exe = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const b = await chromium.launch({ executablePath: exe });
const page = await b.newPage({ viewport: { width: 1440, height: 1000 } });

const shots = [
  ["/", "index"],
  ["/schemes", "schemes"],
  ["/login", "login"],
  ["/support", "support"],
];
for (const [route, name] of shots) {
  await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(700);
  const h = await page.evaluate(() => (document.querySelector("h1,h2,.font-display-lg,.font-display-md")?.textContent || "").trim().slice(0, 50));
  console.log(`${route.padEnd(12)} h="${h}" nodes=${await page.evaluate(() => document.querySelectorAll("*").length)}`);
  await page.screenshot({ path: `/tmp/next_${name}.png`, fullPage: false });
}

// Certificate verification against the live backend
await page.goto(base + "/support", { waitUntil: "domcontentloaded" });
await page.waitForSelector("#certId", { timeout: 8000 }).catch(() => {});
await page.fill("#certId", "SJKVY-2024-8842");
await page.click('#verifyForm button[type="submit"]');
await page.waitForFunction(() => {
  const r = document.querySelector("#verifyResult");
  return r && !r.classList.contains("hidden");
}, { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(400);
const res = await page.evaluate(() => {
  const r = document.querySelector("#verifyResult");
  return { icon: r?.querySelector(".material-symbols-outlined")?.textContent?.trim(),
    lines: r ? Array.from(r.querySelectorAll("p")).map((p) => p.textContent.trim()) : [] };
});
console.log("VERIFY =>", JSON.stringify(res));
const el = await page.$("#verifyResult");
if (el) await el.scrollIntoViewIfNeeded();
await page.screenshot({ path: "/tmp/next_verify.png", fullPage: false });

await b.close();
console.log("done");
