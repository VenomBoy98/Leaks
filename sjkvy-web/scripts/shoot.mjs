import { chromium } from "playwright";
const base = process.argv[2] ?? "http://127.0.0.1:4173";
const routes = [
  ["/", "home"],
  ["/programs", "programs"],
  ["/campus", "campus"],
  ["/admission", "admission"],
  ["/faq", "faq"],
  ["/login", "login"],
];
const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM || undefined,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
for (const [route, name] of routes) {
  await page.goto(base + route, { waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(800);
  // report the rendered hero text + a computed color to prove the design system applied
  const info = await page.evaluate(() => {
    const h = document.querySelector("h1, h2, .font-display");
    const primaryEl = document.querySelector(".text-primary, .bg-primary, .font-display");
    const cs = primaryEl ? getComputedStyle(primaryEl) : null;
    return {
      firstHeading: (h?.textContent || "").trim().slice(0, 60),
      bodyFont: getComputedStyle(document.body).fontFamily,
      sampleColor: cs ? cs.color : "",
      nodeCount: document.querySelectorAll("*").length,
    };
  });
  console.log(`${route.padEnd(14)} nodes=${info.nodeCount} heading="${info.firstHeading}" bodyFont=${info.bodyFont}`);
  await page.screenshot({ path: `/tmp/shot_${name}.png`, fullPage: false });
}
await browser.close();
console.log("screenshots in /tmp/shot_*.png");
