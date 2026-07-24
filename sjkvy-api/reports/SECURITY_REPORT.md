# SJKVY Backend — Security Report (Phase 6)

**Date:** 2026-07-13 · **Method:** penetration-style probes executed against a running
production-mode API (`scripts/security-probe.mjs`) on a fresh seeded database, plus the
static/runtime security suites from earlier phases. This report records **executed
results**, not assertions.

## 1. Penetration-style probes — 12/12 PASS (live server)

| # | Probe | Expected | Result |
|---|---|---|---|
| 1 | Unauthenticated read of a protected endpoint | 401 | ✅ |
| 2 | Tampered JWT (valid shape, broken signature) | 401 | ✅ |
| 3 | Expired JWT | 401 | ✅ |
| 4 | Foreign-signed JWT (attacker secret) | 401 | ✅ |
| 5 | Privilege-escalation claim (`role: service_role`) | 403 | ✅ |
| 6 | User token on a `[SYS]` job endpoint | 401 | ✅ |
| 7 | IDOR: user B reading user A's data | 0 rows (RLS) | ✅ |
| 8 | SQL injection in `verify/:code` path param | uniform `{valid:false}` | ✅ |
| 9 | Path traversal object key at finalize (`../../etc/passwd`) | 4xx | ✅ (422) |
| 10 | Oversized JSON body (2 MB vs 1 MB limit) | 413/400 | ✅ (413) |
| 11 | Forged storage gateway token | 403 | ✅ |
| 12 | Error envelope leaks no SQL/table/stack internals | clean | ✅ |

SQL injection is structurally impossible: every DB call is a parameterized function
invocation or a bound-parameter SELECT (no string concatenation of user input). Probe 8
confirms it behaviorally.

## 2. OWASP API Security Top 10 (2023) — status

Full control mapping is in `PHASE5_SECURITY_REVIEW.md`; Phase 6 adds **executed
evidence** for the authentication, authorization, and resource-consumption items:

- **API1 BOLA / API5 BFLA:** probes 5–7 confirm object- and function-level authorization
  (RLS scoping, role fixed by endpoint, `[SYS]` gating).
- **API2 Auth:** probes 1–4 confirm signature/expiry/issuer verification and rejection of
  forged/tampered/escalated tokens.
- **API4 Resource consumption:** load test shows the per-endpoint rate limit engaging
  under flood; probe 10 confirms the body-size limit; the pool held at cap.
- **API8 Misconfiguration:** fail-fast startup rejected placeholder secrets (observed
  live during load-test setup); probe 12 confirms non-leaky errors.

## 3. Secret management

- ✅ No secrets in code or image; `.env` git-ignored; `.dockerignore` excludes it.
- ✅ Production startup **aborts** on missing/weak/placeholder secrets (verified live).
- ✅ `service_role` holds zero table grants; the API connects as least-privileged
  `sjkvy_api_login`; the worker resolves data only through narrow `[SYS]` definer reads.
- 📋 Operator: store secrets in a manager (Secrets Manager / Vault / Doppler); rotate
  `JWT_SECRET`, `SERVICE_TOKEN`, `STORAGE_URL_SIGNING_SECRET`, provider keys on a
  schedule; scope cloud credentials (S3 bucket-only IAM; Supabase service key server-only).

## 4. Storage security

- ✅ S3 driver uses SigV4 presigned URLs — signature correctness **proven offline**
  against AWS's published example vector (`test/s3-sigv4.unit.test.ts`).
- ✅ Supabase driver uses native signed URLs (service-role key, server-only).
- ✅ `storage_path` never returned to clients; authorization via `fn_authorize_doc_view`
  (owner/checker/admission only, audited); path traversal blocked (probe 9).
- 🔧 Wire real AV scanning to `POST /documents/:versionId/scan-result` before go-live;
  FLAGGED versions never become current.

## 5. Backups & disaster recovery (operator checklist)

- 📋 **Database:** nightly `pg_dump` or managed PITR (Supabase/RDS). **Verify a restore**
  into a scratch instance quarterly and after every schema migration. RPO target ≤ 24 h
  (tighten with PITR/WAL archiving); RTO validated by a timed restore drill.
- 📋 **Object store:** enable versioning + lifecycle on the bucket; back up with the same
  retention as the DB (keys are recorded in `app.document_versions`).
- 📋 **DR runbook:** documented failover (promote replica / restore snapshot), secret
  re-provisioning, and a smoke test (`/ready`, one authenticated read, one signed
  download) before returning traffic.

## 6. Residual items (must close before production)

1. 🔧 Validate storage (S3/Supabase), auth provider (JWKS), and notification providers
   against real services at staging (INTEGRATION_GUIDES + staging report).
2. 🔧 Real AV scanning + signed provider delivery webhooks.
3. 📋 Backup/restore drill and DR runbook rehearsal; `/metrics` network restriction;
   WAF/CDN in front of the proxy.

## Verdict
No High/Critical finding. All 12 live probes pass; static + runtime security suites pass
(DB 81/81; API 46/46). Residual items are integration/operational and enumerated above.
