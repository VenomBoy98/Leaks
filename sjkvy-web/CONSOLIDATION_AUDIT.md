# SJKVY Frontend — Batch 1 Consolidation Audit

**Date:** 2026-07-16 · **Scope:** merge 8 Stitch exports into ONE React + TypeScript +
Tailwind application, preserving the Stitch design exactly. Frontend-only (no backend).

> **CORRECTION (supersedes §2/§7 below):** Per the pixel-for-pixel preservation directive,
> the initial consolidation of a single shared Header/Footer was **reverted**. That shell
> had relabeled the navigation (Stitch's *Schemes/Centers/Resources/Success Stories* →
> *Home/About/…*) and stripped the app-shell `<aside>` sidebars from Programs/About/Campus
> — both are "reinterpret/restyle" changes and are not allowed. **Every page now renders
> its FULL exported body verbatim** (its own exact header, nav labels, sidebar, footer).
> The only genuinely shared/consolidated assets are those that were byte-identical to
> begin with: the Tailwind design system, the Google Fonts, the base CSS utilities, and
> the behavior re-wiring (`StitchContent`). See `PROJECT_MEMORY.md` → "Preservation model".
> Validation: my Programs render was compared against the original Stitch `screen.png` and
> matches (nav, sidebar, hero, cards, CTA, footer); the only differences are external
> images/icon-font glyphs the sandbox proxy blocks in headless (they load in a browser).

## 1. Inputs audited (8 Stitch ZIPs → 9 routes)

| Stitch export | Page | Route(s) |
|---|---|---|
| 7af712e6 (base) | Homepage — Institutional Excellence | `/` |
| 6b066b22 (_3) | About — The Vision Behind SJKVY | `/about` |
| bfd22d63 (_1) | Programs — Master Your Craft | `/programs` |
| c30c5d7b (_2) | Campus Life | `/campus` |
| fb0f60e3 (_4) | Admission & Benefits | `/admission` |
| 0b15496d (_5) | FAQ & Certificate Verification (combined) | `/faq`, `/certificate-verification` |
| e9c8a0b1 (_6) | Contact | `/contact` |
| 30c2beb1 (_7) | Applicant Login (standalone) | `/login` |

Each export was a single `code.html` (Tailwind via CDN + inline config), a `DESIGN.md`,
and a screenshot. No React, no shared build — 8 separate documents.

## 2. What was consolidated (duplication removed)

| Duplicated across 8 exports | Consolidated into |
|---|---|
| Inline `tailwind.config` (47 colors, spacing, radius, fonts) ×8 | ONE `tailwind.config.js` (byte-extracted, verbatim) |
| Google Fonts links ×8 | ONE `index.html` |
| `<header>` nav ×7 (near-identical) | ONE `components/layout/Header.tsx` |
| `<footer>` ×7 | ONE `components/layout/Footer.tsx` |
| Shared CSS utilities (material-symbols, museum-shadow, glass-*, silk-*) ×8 | ONE `styles/index.css` |
| Scroll-reveal / stagger / accordion / smooth-scroll `<script>` ×8 | ONE `lib/StitchContent.tsx` |
| Ad-hoc buttons/cards/inputs repeated | `components/ui/index.tsx` primitives + `lib/tokens.ts` |

## 3. Fidelity method (why it looks identical)

- The Tailwind config is extracted **verbatim** from Stitch (47 color tokens, custom
  `spacing`/`borderRadius`/`fontFamily`), so every class resolves to the same value —
  including Stitch's `rounded-full: 0.75rem` override and its undefined typography
  utilities (kept as no-ops, exactly as under the CDN). Same `forms` + `container-queries`
  plugins.
- Each page's **exact body markup** and its **scoped `<style>`** are preserved and rendered
  through `StitchContent`, which injects the page CSS only while mounted (so page-specific
  animation classes — e.g. `.stagger-in`, defined differently per page — never collide).
- Stitch's inline behaviors are re-wired in React: IntersectionObserver reveal
  (`.reveal-up`→active, `.stagger-in`→visible), FAQ accordion (`.accordion-item.active`),
  and in-page anchor smooth-scroll.
- **Verified:** production build (55 modules), typecheck clean, all 9 routes serve 200,
  design tokens present in the built CSS (`bg-primary` = #316342, `h-topbar-height` = 72px,
  `rounded-full` = .75rem), and headless screenshots confirm the shell, typography
  (Playfair/Inter), colors, and layouts render as designed.

## 4. Components extracted

- **Layout shell:** `Header`, `Footer`, `Layout` (real React, exact Stitch styling).
- **Content renderer:** `StitchContent` (scoped CSS + behavior re-wiring).
- **Reusable UI primitives (for future batches):** `Button` (primary/outline), `Card`,
  `Container`, `Section`, `Input`, `Icon` — built on the design tokens; the public pages
  render Stitch markup verbatim and don't depend on them (zero-drift guarantee).
- **Design tokens:** `lib/tokens.ts` (colors/fonts/spacing/radius) mirroring the config.

## 5. Folder structure

```
sjkvy-web/
  index.html                 fonts + root
  tailwind.config.js         design system (verbatim from Stitch)
  src/
    main.tsx  App.tsx        entry + router (lazy, code-split)
    styles/index.css         Tailwind + shared utilities
    components/
      layout/{Header,Footer,Layout}.tsx
      ui/index.tsx           Button/Card/Container/Section/Input/Icon
    lib/{StitchContent.tsx, tokens.ts}
    pages/                   thin page components (one per route)
      generated/*.ts         exact Stitch body + scoped CSS (npm run convert)
  scripts/{convert-stitch.mjs, shoot.mjs}
  PROJECT_MEMORY.md          persistent context for batches 2–6
```

## 6. Routing structure
`/` `/about` `/programs` `/campus` `/admission` `/faq` `/certificate-verification`
`/contact` (all inside `<Layout>`), `/login` (standalone), `*` → home. Lazy-loaded per
route.

## 7. Consolidation decisions (stakeholder confirmation welcome)
1. **Nav labels:** Stitch shipped placeholder nav (Schemes/Centers/Resources/Success
   Stories) unrelated to the actual pages. The unified Header uses the real page labels in
   the **identical Stitch style** so the site is navigable. Styling is untouched; only
   label text/targets were wired.
2. **Login is standalone** (no site header/footer), matching its Stitch export.
3. **Mobile nav:** none in Stitch (nav hidden < md); preserved. A mobile menu is a
   recommended future enhancement (would be a design addition, so deferred).
4. **FAQ + Certificate Verification** share one export; both routes render it.

## 8. Remaining pages expected from future Stitch batches
Per the roadmap, upcoming batches will add the **Applicant / Student / Staff / Centre
Admin portals and dashboards**, plus any dedicated pages (e.g. a standalone Certificate
Verification, registration, program detail). Those extend THIS project per
`PROJECT_MEMORY.md` — no restart. Backend wiring is a later phase.

## 9. Not done (per phase rules)
No backend calls, no APIs, no auth logic, no dashboards, no invented pages, no mock
servers, no redesign. Frontend consolidation only.
