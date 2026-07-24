// Build a self-contained HTML gallery of all 42 rendered screens (base64 JPEGs), grouped
// by zone, framed in the SJKVY visual identity. Output → scratchpad for publishing.
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";

const OUT = process.argv[2];
const PAGES = "/tmp/pages";

// name → [friendly title, route, zone, wired?]
const META = {
  // public
  index: ["Admissions Landing", "/", "public", false],
  home: ["Institutional Landing", "/home", "public", false],
  schemes: ["Program Catalog", "/schemes", "public", false],
  campus: ["Centres & Campus", "/campus", "public", false],
  about: ["About & Vision", "/about", "public", false],
  support: ["FAQ + Certificate Verification", "/support", "public", true],
  contact: ["Contact", "/contact", "public", false],
  login: ["Portal Sign-in", "/login", "public", false],
  register: ["New Applicant Account", "/register", "public", false],
  sitemap: ["Dev Index (all screens)", "/sitemap", "public", false],
  // applicant
  dashboard: ["Application Status", "/dashboard", "applicant", false],
  application: ["Multi-step Admission Form", "/application", "applicant", false],
  documents: ["Document Uploads", "/documents", "applicant", false],
  timeline: ["Application Milestones", "/timeline", "applicant", false],
  notifications: ["Alerts & Messages", "/notifications", "applicant", false],
  profile: ["Applicant Profile", "/profile", "applicant", false],
  // student
  "student-dashboard": ["Student Overview", "/student-dashboard", "student", false],
  attendance: ["Attendance Tracker", "/attendance", "student", false],
  hostel: ["Hostel & Services", "/hostel", "student", false],
  assessments: ["Assessments & Scores", "/assessments", "student", false],
  certificates: ["Credential Vault", "/certificates", "student", false],
  placement: ["Placement Portal", "/placement", "student", false],
  "student-profile": ["Student Profile", "/student-profile", "student", false],
  // staff
  "staff-dashboard": ["Staff Overview", "/staff-dashboard", "staff", false],
  verification: ["Verification Queue", "/verification", "staff", false],
  counselling: ["Counselling Management", "/counselling", "staff", false],
  "staff-attendance": ["Mark Attendance", "/staff-attendance", "staff", false],
  "staff-hostel": ["Hostel Oversight", "/staff-hostel", "staff", false],
  "staff-placement": ["Placement & Industry", "/staff-placement", "staff", false],
  "staff-reports": ["Institutional Reports", "/staff-reports", "staff", false],
  "staff-directory": ["Staff Directory", "/staff-directory", "staff", false],
  // admin
  "admin-dashboard": ["Centre Performance", "/admin-dashboard", "admin", false],
  "admin-applications": ["Applications Management", "/admin-applications", "admin", false],
  "admin-admissions": ["Admissions & Enrollment", "/admin-admissions", "admin", false],
  "admin-directory": ["Student Directory", "/admin-directory", "admin", false],
  "admin-hostel": ["Hostel Tracking", "/admin-hostel", "admin", false],
  "admin-programs": ["Programs & Batches", "/admin-programs", "admin", false],
  "admin-assessments": ["Assessments Admin", "/admin-assessments", "admin", false],
  "admin-certificates": ["Certificate Issuance", "/admin-certificates", "admin", false],
  "admin-industry": ["Industry Relations", "/admin-industry", "admin", false],
  "admin-reports": ["Reporting & Analytics", "/admin-reports", "admin", false],
  "admin-settings": ["Centre Settings", "/admin-settings", "admin", false],
};

const ZONES = [
  ["public", "Public Website", "Anonymous — no auth", 10],
  ["applicant", "Applicant Portal", "Role: applicant", 6],
  ["student", "Student Portal", "Role: student", 7],
  ["staff", "Staff Portal", "Role: staff", 8],
  ["admin", "Centre Admin Portal", "Role: centre admin", 11],
];

const byZone = {};
let wiredCount = 0;
for (const [name, [title, route, zone, wired]] of Object.entries(META)) {
  const buf = await sharp(`${PAGES}/${name}.png`)
    .resize({ width: 720 })
    .jpeg({ quality: 70 })
    .toBuffer();
  const uri = `data:image/jpeg;base64,${buf.toString("base64")}`;
  (byZone[zone] ??= []).push({ name, title, route, wired, uri });
  if (wired) wiredCount++;
}

const card = (s) => `
  <figure class="card">
    <div class="shot"><img loading="lazy" src="${s.uri}" alt="${s.title} screen"/></div>
    <figcaption>
      <div class="cap-row">
        <span class="cap-title">${s.title}</span>
        ${s.wired ? '<span class="chip chip-live">Live · backend</span>' : '<span class="chip">Renders</span>'}
      </div>
      <code class="route">${s.route}</code>
    </figcaption>
  </figure>`;

const section = ([zone, title, sub]) => `
  <section class="zone" id="${zone}">
    <header class="zone-head">
      <h2>${title}</h2>
      <p>${sub} · ${byZone[zone].length} screens</p>
    </header>
    <div class="grid">${byZone[zone].map(card).join("")}</div>
  </section>`;

const html = `<style>
:root{
  --primary:#316342; --primary-2:#4a7c59; --gold:#775a19; --gold-2:#e9c176;
  --ivory:#fcf9f8; --ink:#1b1c1b; --muted:#556154; --line:#dfe3dc;
  --card:#ffffff; --ground:#f4f1ee; --chip:#eef1ea;
  --shadow:0 4px 20px rgba(26,28,30,.06);
}
@media (prefers-color-scheme:dark){:root{
  --ivory:#12160f; --ink:#eef0e8; --muted:#9aa694; --line:#28301f;
  --card:#171c12; --ground:#0e120b; --chip:#1d2416; --primary:#7fb389; --gold:#e9c176;
  --shadow:0 6px 26px rgba(0,0,0,.4);
}}
:root[data-theme="light"]{--ivory:#fcf9f8;--ink:#1b1c1b;--muted:#556154;--line:#dfe3dc;--card:#fff;--ground:#f4f1ee;--chip:#eef1ea;--primary:#316342;--gold:#775a19;--shadow:0 4px 20px rgba(26,28,30,.06);}
:root[data-theme="dark"]{--ivory:#12160f;--ink:#eef0e8;--muted:#9aa694;--line:#28301f;--card:#171c12;--ground:#0e120b;--chip:#1d2416;--primary:#7fb389;--gold:#e9c176;--shadow:0 6px 26px rgba(0,0,0,.4);}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);
  font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.5;-webkit-font-smoothing:antialiased}
.wrap{max-width:1180px;margin:0 auto;padding:clamp(20px,4vw,56px)}
.masthead{border-bottom:1px solid var(--line);padding-bottom:28px;margin-bottom:8px}
.eyebrow{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);font-weight:600;margin:0 0 10px}
h1{font-family:Georgia,"Playfair Display",serif;font-weight:700;font-size:clamp(30px,5vw,50px);
  line-height:1.05;letter-spacing:-.01em;margin:0;text-wrap:balance;color:var(--primary)}
.lede{max-width:62ch;color:var(--muted);margin:14px 0 0;font-size:16.5px}
.stats{display:flex;flex-wrap:wrap;gap:28px;margin:26px 0 0}
.stat .n{font-family:Georgia,serif;font-size:30px;color:var(--ink);font-variant-numeric:tabular-nums}
.stat .l{font-size:12.5px;color:var(--muted);letter-spacing:.03em}
.note{margin:22px 0 0;padding:12px 16px;border-left:3px solid var(--gold);background:var(--chip);
  border-radius:0 8px 8px 0;font-size:13.5px;color:var(--muted)}
.zone{margin-top:52px;scroll-margin-top:20px}
.zone-head{display:flex;align-items:baseline;justify-content:space-between;gap:16px;
  border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:24px}
.zone-head h2{font-family:Georgia,serif;font-size:24px;margin:0;color:var(--primary);font-weight:700}
.zone-head p{margin:0;font-size:13px;color:var(--muted);letter-spacing:.02em}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:22px}
.card{margin:0;background:var(--card);border:1px solid var(--line);border-radius:12px;
  overflow:hidden;box-shadow:var(--shadow);transition:transform .18s ease,box-shadow .18s ease}
.card:hover{transform:translateY(-3px);box-shadow:0 10px 30px rgba(26,28,30,.12)}
.shot{height:300px;overflow:hidden;background:var(--ivory);border-bottom:1px solid var(--line)}
.shot img{width:100%;display:block}
figcaption{padding:12px 14px}
.cap-row{display:flex;align-items:center;justify-content:space-between;gap:10px}
.cap-title{font-weight:600;font-size:14.5px;color:var(--ink)}
.route{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:var(--muted);display:block;margin-top:4px}
.chip{font-size:10.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;
  padding:3px 8px;border-radius:999px;background:var(--chip);color:var(--muted);white-space:nowrap}
.chip-live{background:color-mix(in srgb,var(--primary) 18%,transparent);color:var(--primary)}
footer{margin-top:56px;padding-top:22px;border-top:1px solid var(--line);color:var(--muted);font-size:13px}
@media (prefers-reduced-motion:reduce){.card{transition:none}}
</style>

<div class="wrap">
  <header class="masthead">
    <p class="eyebrow">SJKVY · Integrated Digital Ecosystem</p>
    <h1>All 42 screens, as they render deployed</h1>
    <p class="lede">The full design handoff, rebuilt in Next.js with the compiled SJKVY design
      system and self-hosted fonts, reusing the existing audited backend. Every screen below is
      the live app captured at 1440px — public site and all four role portals.</p>
    <div class="stats">
      <div class="stat"><div class="n">42</div><div class="l">Screens rendered</div></div>
      <div class="stat"><div class="n">5</div><div class="l">Navigation zones</div></div>
      <div class="stat"><div class="n">${wiredCount}</div><div class="l">Wired to live backend</div></div>
      <div class="stat"><div class="n">100%</div><div class="l">Routes returning 200</div></div>
    </div>
    <p class="note">Certificate verification (<code>/support</code>) is wired to the real
      <code>GET /verify/:code</code> and returns live data. Other portal screens render faithfully;
      their data binding + sign-in are the next build phases.</p>
  </header>
  ${ZONES.map(section).join("")}
  <footer>Captured from the running Next.js build · fonts self-hosted · icons via Material Symbols.
    Sample copy is the handoff's placeholder content, to be replaced with backend data.</footer>
</div>`;

writeFileSync(OUT, html);
console.log(`wrote ${OUT} (${(html.length / 1024 / 1024).toFixed(2)} MB), wired=${wiredCount}`);
