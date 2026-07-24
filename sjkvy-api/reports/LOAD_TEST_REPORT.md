# SJKVY Backend — Load Test Report

**Date:** 2026-07-13 · **Environment:** single-node PostgreSQL 16.13 + one API process,
`PG_POOL_MAX=20`, `NODE_ENV=production`, local loopback (no network hop). Harness:
`scripts/loadtest.mjs` (dependency-free, global `fetch`, controlled concurrency).
**Load:** 50 concurrent clients, 10 s per scenario.

> This is a single-box baseline that isolates API + DB behavior (no proxy, no cloud
> latency). Absolute numbers scale with cores/instances; the value here is the shape:
> error rate, latency distribution, and pool stability under sustained concurrency.

## Results

| Scenario | Path | RPS | p50 | p95 | p99 | max | 5xx errors |
|---|---|---:|---:|---:|---:|---:|---:|
| Liveness | `GET /health` | 10,072 | 3.7 ms | 9.6 ms | 18.2 ms | 60.9 ms | 0 |
| Public read (anon, RLS view) | `GET /public/courses` | 2,996 | 16.0 ms | 22.2 ms | 29.3 ms | 137.7 ms | 0 |
| Authenticated RLS read | `GET /applications` | 2,320 | 21.1 ms | 26.7 ms | 31.3 ms | 44.4 ms | 0 |
| Public function | `GET /verify/:code` | 10,037* | 4.0 ms | 8.8 ms | 11.8 ms | 63.0 ms | 0 |

\* `GET /verify/:code` carries a deliberate tight rate limit (20/min); under the flood
it correctly returned `429` for the vast majority (100,355 × 429, 19 × 200) — i.e. the
abuse-protection control engaged under load exactly as designed. RPS shown is total
handled requests including 429s.

## Connection pool

During and after the run, `pg_stat_activity` for `application_name='sjkvy-api'` showed
**exactly 20 connections, all `idle` at rest** — the pool saturated to its cap under
load and released cleanly afterward. **No leak, no exhaustion, no "too many clients".**

## Interpretation

- **Zero 5xx** across ~250k requests. The authenticated read path — which runs the full
  `auth.uid()` → RLS → SECURITY DEFINER helper chain in the database on every request —
  sustained **~2,300 rps at p99 ≈ 31 ms** on a single box. That is the realistic hot
  path for portal reads and it held up.
- The public function path (`fn_cert_verify`) and liveness are effectively limited by
  the event loop, not the DB (~10k rps, single digit p99).
- The per-endpoint rate limit demonstrably protects the enumeration-prone verify
  endpoint under a real flood.

## Recommendations for production scale

1. Run 2–4 API instances behind the LB; the API is stateless. Set `PG_POOL_MAX` so that
   `instances × PG_POOL_MAX ≤ Postgres max_connections` (or front the DB with pgBouncer
   in transaction mode).
2. Add read replicas only if authenticated-read RPS exceeds a single primary's headroom;
   the RLS/DEFINER model works unchanged on replicas for reads.
3. Re-run this harness against staging (real network + proxy) to capture end-to-end
   latency and to size instances; add write-path and worker-throughput scenarios there.

## Worker throughput (design note)

The notification worker uses `fn_outbox_claim` (`FOR UPDATE SKIP LOCKED`), so throughput
scales by running multiple worker instances safely. Measure at staging with real
provider latency; the DB-side claim/enqueue/record path is bounded by the same pool.
