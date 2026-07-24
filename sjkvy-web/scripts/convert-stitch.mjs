// convert-stitch.mjs — extract each Stitch export's page body + scoped <style> into a
// generated TS module. The shared <header>/<footer>/<script> are removed (the React shell
// provides Header/Footer and behaviors); the page's exact markup + CSS are preserved
// verbatim so the rendered output is pixel-identical to the Stitch source.
//
// Output: src/pages/generated/<name>.ts  exporting { html, css }.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const RAW = join(here, "../../_stitch_raw");
const OUT = join(here, "../src/pages/generated");
mkdirSync(OUT, { recursive: true });

// Optional URL→local-path map produced by `npm run localize-images`. When present, remote
// Stitch CDN image URLs are rewritten to the bundled local copies (identical images, served
// locally) so the site is self-contained. Absent → pages keep the original remote URLs.
const MAP_FILE = join(here, "image-map.json");
const imageMap = existsSync(MAP_FILE) ? JSON.parse(readFileSync(MAP_FILE, "utf8")) : {};
function localizeImages(s) {
  let out = s;
  for (const [remote, local] of Object.entries(imageMap)) out = out.split(remote).join(local);
  return out;
}

// dir prefix -> { name, chrome }. chrome=false renders standalone (login: no site nav).
const PAGES = [
  { dir: "7af712e6-stitch_sjkvy_integrated_digital_ecosystem", name: "home", chrome: true },
  { dir: "6b066b22-stitch_sjkvy_integrated_digital_ecosystem_3", name: "about", chrome: true },
  { dir: "bfd22d63-stitch_sjkvy_integrated_digital_ecosystem_1", name: "programs", chrome: true },
  { dir: "c30c5d7b-stitch_sjkvy_integrated_digital_ecosystem_2", name: "campus", chrome: true },
  { dir: "fb0f60e3-stitch_sjkvy_integrated_digital_ecosystem_4", name: "admission", chrome: true },
  { dir: "0b15496d-stitch_sjkvy_integrated_digital_ecosystem_5", name: "faqCertificate", chrome: true },
  { dir: "e9c8a0b1-stitch_sjkvy_integrated_digital_ecosystem_6", name: "contact", chrome: true },
  { dir: "30c2beb1-stitch_sjkvy_integrated_digital_ecosystem_7", name: "login", chrome: false },
];

function slice(html, tag) {
  const re = new RegExp(`<${tag}[\\s\\S]*?<\\/${tag}>`, "gi");
  return html.replace(re, "");
}
function bodyInner(html) {
  const m = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return m ? m[1] : html;
}
function styleInner(html) {
  const m = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  return m ? m[1].trim() : "";
}
function esc(s) {
  // Safe for a TS template literal.
  return s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

for (const p of PAGES) {
  const file = join(RAW, p.dir, "code.html");
  const html = readFileSync(file, "utf8");
  const css = styleInner(html);
  let body = bodyInner(html);
  // PRESERVE PIXEL-FOR-PIXEL: keep the entire exported body verbatim (header, nav,
  // aside sidebar, footer, everything). The ONLY removals are the inline <script>
  // (behaviors are re-wired in React) and the <style> (extracted above and re-injected
  // scoped, so it is not lost — just relocated). Nothing visual is stripped or altered.
  body = slice(body, "script");
  body = slice(body, "style");
  body = localizeImages(body.trim());
  const out = `// GENERATED from Stitch export ${p.dir} — do not edit by hand.
// Regenerate with: npm run convert
export const html = \`${esc(body)}\`;
export const css = \`${esc(css)}\`;
`;
  writeFileSync(join(OUT, `${p.name}.ts`), out);
  console.log(`wrote generated/${p.name}.ts  (html ${body.length}b, css ${css.length}b)`);
}
console.log("done");
