# SJKVY App (Next.js) — full-platform frontend

Next.js (App Router) + compiled Tailwind implementation of the SJKVY Integrated Digital
Ecosystem design handoff (42 screens: public site + Applicant/Student/Staff/Centre-Admin
portals), wired to the **existing** audited backend (`../sjkvy-api` over `../sjkvy-db`) —
not a new backend. Replaces the prototype's CDN Tailwind and `support.js` nav shim with a
compiled build and real routing + middleware role guards.

## Status (phased build)

| Zone | Screens | Rendered | Nav/routing | Backend wiring |
|---|---|---|---|---|
| **Public** | 10 | ✅ verbatim | ✅ real routes | ✅ certificate verification → live `GET /verify/:code`; catalogue client ready |
| Applicant | 6 | ✅ render (via dynamic route) | ✅ routes + middleware guard | ⏳ next phase |
| Student | 7 | ✅ render | ✅ | ⏳ |
| Staff | 8 | ✅ render | ✅ | ⏳ |
| Admin | 11 | ✅ render | ✅ | ⏳ |

All 42 screens build and are reachable at `/<name>` (index → `/`). Portal routes are already
protected by `src/middleware.ts` (redirect to `/login` without a session, wrong-role →
that role's home). What remains is **auth sign-in wiring** (login → session cookie) and
**per-screen data binding** for the four portals — done zone by zone.

## Architecture

- **Design tokens** — `tailwind.config.ts`, ported verbatim from the handoff's inline
  `tailwind.config` (colors, radii, spacing, type scale). Compiled, not CDN.
- **Screens** — `scripts/convert-handoff.mjs` extracts each `app/*.html` into
  `src/screens/generated/<name>.ts` (exact body + scoped CSS + `data-portal` + title) and a
  `src/screens/registry.ts`. Regenerate with `npm run convert`.
- **Renderer** — `src/components/HandoffScreen.tsx` (client) renders a screen's exact markup
  + scoped CSS, and re-wires the behaviors the prototype's stripped `<script>`/`support.js`
  provided: FAQ accordion, in-page anchors, **navigation** (via `src/lib/nav-map.ts`), and
  the certificate-verification form → live API.
- **Routing** — one dynamic route `src/app/[[...screen]]/page.tsx` resolves the slug to a
  screen (statically generated for all 42).
- **Role guard** — `src/middleware.ts` maps each screen to its zone and enforces auth/role
  server-side (the README's "enforce at the middleware layer, not the client").
- **Backend client** — `src/lib/api.ts` targets the existing `sjkvy-api`
  (`NEXT_PUBLIC_API_BASE_URL`, default `http://127.0.0.1:8080`).

## Run

```bash
# 1. backend (see ../sjkvy-api + ../sjkvy-db): Postgres migrated/seeded, API on :8080
# 2. this app:
npm install
npm run convert          # generate screens from the handoff (already committed)
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8080 npm run dev   # http://127.0.0.1:3000
```

Visit `/support`, enter `SJKVY-2024-8842` → live "Valid Certificate Found".

## Prototype shortcuts removed (per handoff README)
1. CDN Tailwind → compiled Tailwind build. ✅
2. `support.js` nav shim → real Next.js routing + `middleware.ts` role guards. ✅
3. "All Screens" debug button / `sitemap.html` → not injected; `sitemap` route is dev-only. ✅
4. Static sample copy → being bound to backend data zone by zone (public done). ⏳
5. No auth → middleware role guard in place; sign-in wiring is the next phase. ⏳

## Next phases
1. **Auth:** wire `/login` + `/register` to a session (role cookie the middleware already
   reads); the existing API validates JWTs from an external provider — integrate that or a
   dev issuer for local sign-in.
2. **Applicant → Student → Staff → Admin** portals: bind each screen's lists/forms to the
   existing API domains (applications, documents, attendance, assessments, certificates,
   hostel, placement, notifications, admin).
3. **Deploy:** Vercel + managed Postgres; public pages static/ISR, portals auth-gated.
