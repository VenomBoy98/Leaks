# SJKVY Web — Project Memory (read before every future Stitch batch)

This file is the persistent context for the frontend consolidation. **Batches 2–6 extend
THIS project — do not restart, do not re-scaffold, do not change the design system.**

## What this project is
One React + TypeScript + Vite + Tailwind application built from Stitch exports.
The Stitch HTML is the CANONICAL VISUAL SOURCE and is preserved **pixel-for-pixel**.

## Preservation model (authoritative — do not violate)
Each page renders its FULL exported body **verbatim** — its own header, nav (with Stitch's
exact labels, e.g. Schemes/Centers/Resources/Success Stories), any app-shell sidebar
(`<aside>`), content, and footer. Nothing is stripped, relabeled, restyled, simplified,
or reinterpreted. We do NOT impose a shared Header/Footer/shell (an earlier attempt did
and was reverted — it changed nav labels and removed sidebars, which is forbidden).
Only two things are converted to make it run in React:
  1. inline `<script>` behaviors → re-wired in `lib/StitchContent.tsx` (reveal, stagger,
     FAQ accordion, in-page smooth scroll) with NO markup change;
  2. unambiguous cross-page routing (brand "SJKVY" → `/`, "Portal Login" → `/login`) via
     click delegation — again, zero visual change.
Backend integration (later phases) must likewise not change any pixel.

## Established conventions (keep these)
- **Design system:** `tailwind.config.js` is byte-extracted from Stitch (47 colors, custom
  spacing/borderRadius, Playfair/Inter fonts). NEVER alter token values. `rounded-full`
  is intentionally `0.75rem` (Stitch override), not a circle. Plugins: forms,
  container-queries (same as Stitch's CDN).
- **Fonts:** loaded in `index.html` (Playfair Display, Inter, Material Symbols Outlined).
- **Global CSS:** `src/styles/index.css` — Tailwind + shared static utilities only.
- **Page rendering:** each Stitch page's FULL body markup + its scoped `<style>` live in
  `src/pages/generated/<name>.ts` (produced by `npm run convert` from `../_stitch_raw`;
  the converter strips ONLY `<script>` and `<style>` — everything visual is kept verbatim,
  including headers/navs/sidebars/footers). A thin page component renders them via
  `src/lib/StitchContent.tsx` (scoped CSS injection + behavior re-wiring). Pixel-faithful.
- **No shared shell.** Pages carry their own exact chrome (per the preservation model).
  There is no Header/Footer/Layout component (removed). A unified shell would require
  restyling and is NOT permitted without explicit approval / new Stitch exports.
- **Routing:** `src/App.tsx`, lazy-loaded, per-route code splitting; each route renders
  its page directly (no wrapper).
- **Reusable primitives:** `components/ui/index.tsx` + `lib/tokens.ts` exist for FUTURE
  batch UI (portals/dashboards). The public pages do NOT use them (verbatim rendering).

## How to add a batch
1. Drop the new Stitch export dirs into `../_stitch_raw/`.
2. Add them to the `PAGES` map in `scripts/convert-stitch.mjs` (name + `chrome` flag).
3. `npm run convert` → generates `src/pages/generated/<name>.ts`.
4. Add a thin page component in `src/pages/` + a route in `src/App.tsx`.
5. Extend the Header nav only if the batch adds top-level pages (keep Stitch styling).
6. `npm run typecheck && npm run build`; screenshot-verify with `scripts/shoot.mjs`.

## Open decisions (carry forward)
- **Nav IA:** Stitch shipped placeholder nav labels (Schemes/Centers/Resources/Success
  Stories) that don't map to the page set. The unified Header uses the real page labels in
  the identical Stitch style. Confirm final IA with stakeholders when portal batches land.
- **Mobile nav:** Stitch has no mobile menu (nav hidden < md). Preserved as-is; a
  hamburger menu is a recommended future enhancement (would be a design addition).
- **FAQ + Certificate Verification** share one Stitch export; both routes render it. Split
  into two pages if a dedicated cert-verification export arrives.

## Guardrails (unchanged from the phase brief)
Do NOT: redesign, restyle, connect the backend, add auth/API logic, invent pages, add
mock servers. This project is frontend consolidation only until told otherwise.

## Backend integration (Batch 1 — public endpoints only)
The public site now talks to the SJKVY backend (`../sjkvy-api` over `../sjkvy-db`) for its
PUBLIC (anon) features, WITHOUT changing any Stitch pixel. See `RUN_FULLSTACK.md`.
- **API client:** `src/lib/api.ts` (base URL from `VITE_API_BASE_URL`, see `.env.example`).
- **Certificate verification** (`FaqCertificatePage`): the `#verifyForm` (a Stitch mock) is
  wired to `GET /verify/:code`. Same button spinner, same `#verifyResult` card, same classes;
  only the card's text/icon are filled from live data (valid → holder/course/date; unknown →
  "No Valid Certificate Found"). Wiring lives in the page component; `StitchContent` is
  untouched (a plain ref wrapper is used to reach the injected DOM).
- **Course catalogue:** `listCourses()` → `GET /public/courses` is available but NOT injected
  into the marketing cards (that would restyle the design). For the future application flow.
- **Login / Contact:** intentionally NOT faked — the API is not the auth authority (external
  provider issues JWTs; no password/credential store) and there is no contact endpoint. Both
  forms are left exactly as designed. Real wiring needs a provider / a new enquiry endpoint.
- Guardrail update: backend integration is now permitted, but it must never alter a pixel —
  wire behavior into existing Stitch markup slots; never add/restyle UI to fit an API.

## Images are local (self-contained)
`npm run localize-images` downloads every Stitch CDN image into `public/img/` and writes
`scripts/image-map.json`; `convert-stitch.mjs` applies that map so generated pages use local
paths. Identical images, served locally (the Stitch temporary CDN can expire). `_stitch_raw/`
stays pristine. Re-run `localize-images` then `convert` if a new batch adds images.

## Current state (Batch 1)
Pages: Home, About, Programs, Campus, Admission, FAQ, Certificate Verification, Contact,
Login. Images local (39). Certificate verification wired to the live API. Build green,
typecheck clean, full-stack run verified (DB + API + web) with real cert lookups + rendered
images.
