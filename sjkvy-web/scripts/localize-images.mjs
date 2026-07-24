// localize-images.mjs — download every remote Stitch image into public/img/ and emit a
// URL→local-path map (scripts/image-map.json) that convert-stitch.mjs applies when it
// generates the pages. This makes the site self-contained: the exact same images, served
// locally, so nothing breaks when Stitch's temporary CDN expires. Visual output is
// unchanged. Re-runnable (skips files already downloaded).
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const RAW = join(here, "../../_stitch_raw");
const IMG_DIR = join(here, "../public/img");
const MAP_FILE = join(here, "image-map.json");
mkdirSync(IMG_DIR, { recursive: true });

const URL_RE = /https:\/\/lh3\.googleusercontent\.com\/[A-Za-z0-9_/=-]+/g;

// Collect every unique remote URL across all Stitch exports.
const urls = new Set();
for (const dir of readdirSync(RAW, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  const f = join(RAW, dir.name, "code.html");
  if (!existsSync(f)) continue;
  for (const m of readFileSync(f, "utf8").matchAll(URL_RE)) urls.add(m[0]);
}
console.log(`found ${urls.size} unique remote images`);

const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const map = existsSync(MAP_FILE) ? JSON.parse(readFileSync(MAP_FILE, "utf8")) : {};

let ok = 0;
let fail = 0;
for (const url of urls) {
  if (map[url] && existsSync(join(here, "..", "public", map[url].replace(/^\//, "")))) {
    ok++;
    continue;
  }
  const name = createHash("sha1").update(url).digest("hex").slice(0, 16);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ext = EXT[(res.headers.get("content-type") || "").split(";")[0].trim()] || "jpg";
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(join(IMG_DIR, `${name}.${ext}`), buf);
    map[url] = `/img/${name}.${ext}`;
    ok++;
    process.stdout.write(".");
  } catch (e) {
    fail++;
    console.log(`\n  FAIL ${url.slice(0, 60)}… : ${e.message}`);
  }
}
writeFileSync(MAP_FILE, JSON.stringify(map, null, 2));
console.log(`\ndownloaded/kept ${ok}, failed ${fail}. map → scripts/image-map.json`);
if (fail > 0) process.exitCode = 1;
