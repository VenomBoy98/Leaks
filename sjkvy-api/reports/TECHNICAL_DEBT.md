# SJKVY Backend — Technical Debt Report

Deliberately small. The backend was built test-first with a strict architecture, so debt
is low. Items are ranked; none is blocking for v1.0. "Effort" is rough dev-days.

## Nice-to-have (opportunistic)

| ID | Item | Rationale | Effort | Risk |
|---|---|---|---|---|
| N1 | Combine the two per-request `SET`s (`request.jwt.claims` + role) into one round-trip using `SELECT set_config('request.jwt.claims',$1,true), set_config('role',$2,true)` | Saves ~1 DB round-trip per request; equivalent semantics to `SET LOCAL ROLE`. **Not done** because the current path is proven fast (~2,320 rps) and this touches the security-critical role assignment — change only with full suite + probe re-run. | 0.5 | med (security path) |
| N2 | Move `src/storage-routes.ts` → `src/storage/routes.ts` | Cohesion with the `storage/` folder. Pure move + import update. | 0.25 | low |
| N3 | Add ESLint + Prettier + a `lint` script and CI step | Enforce style/lint automatically (today: tsc + conventions only). | 0.5 | low |
| N4 | `fn_profile_phone` resolver ([SYS], like `fn_profile_email`) | The SMS channel currently relies on the phone carried in the notification row; a resolver would let SMS target a profile id uniformly. | 0.5 | low |
| N5 | Push channel (FCM/APNs) provider | `PUSH` currently maps to the mock; wire a real provider when mobile ships. | 1 | low |
| N6 | Per-operation error-code → HTTP-status annotations in OpenAPI | `errors[]` exist in the manifest; surface them as documented per-status responses beyond the generic 4xx/5xx. | 0.5 | low |
| N7 | Structured request/response sampling in logs (opt-in) | Aids debugging at low volume; must keep PII redaction. | 0.5 | low |

## Deferred by design (not debt — external dependencies)

| ID | Item | Status |
|---|---|---|
| D1 | Live validation of auth provider / S3 / Supabase / email / SMS | Code complete; needs staging credentials (Phase-6 staging checklist). |
| D2 | Antivirus scanner wiring to `POST /documents/:vid/scan-result` | Hook exists; connect ClamAV/Lambda in production. |
| D3 | Provider delivery-webhook signature verification | Add when the real providers are wired. |
| D4 | Backup/restore drill + DR runbook rehearsal | Operator task (SECURITY_REPORT §5). |

## Explicitly NOT debt (intentional design)
- 3 round-trips on the hot path (identity model) — measured fast; N1 is optional.
- `service_role` has zero table grants — this is the security model, not a limitation.
- Frozen migrations 0000–0003 — immutability is intentional (byte-verified).
- Bounded list reads (`LIMIT 200`) — deliberate; pagination is a frontend concern.

## Trend
Phase 7 removed 3 dead exports and improved OpenAPI completeness with **no behavior
change**. The codebase is 4,155 LOC across 35 well-separated modules with 48 tests
(DB 81 assertions + API 46 + unit 2) and three runnable validation tools. Debt is
minimal and fully catalogued above.
