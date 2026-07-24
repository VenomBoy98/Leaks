# Document scanner worker

Uploaded documents are **never** trusted on arrival. The upload path records a version as
`PENDING` only. A separate, trusted worker — running as `service_role`, unreachable from any
browser — reads the stored bytes **through the storage driver**, scans them, and records the
verdict (`CLEAN` / `FLAGGED`) via the database's `fn_scan_result`. Only this identity can move
a version out of `PENDING`. `FLAGGED` and `PENDING` versions are non-servable
(`fn_authorize_doc_view` refuses them), and a `FLAGGED` object is additionally quarantined out
of its servable key.

Run it as a sidecar/cron process, distinct from the API:

```bash
npm run scan-worker    # tsx src/worker/scanner-index.ts
```

## How a version is processed

1. `fn_scan_claim(batch, maxAttempts)` claims up to `batch` `PENDING` versions with
   `FOR UPDATE SKIP LOCKED` (safe across many workers) and reclaims rows whose in-flight scan
   timed out. Each claim increments an attempt counter.
2. The worker reads the object via `driver.readObject(storage_path, { maxBytes, timeoutMs })`
   — a **bounded** read (see below). Bytes flow storage → worker, never through a client.
3. The configured adapter classifies the bytes → `CLEAN` or `FLAGGED`.
4. `fn_scan_result(version_id, verdict)` records the trusted verdict; `fn_scan_done(version_id)`
   closes the job. A `FLAGGED` object is moved via `driver.quarantine(storage_path)`.
5. Any error (read timeout, oversize object, adapter/network failure) calls
   `fn_scan_fail(version_id, reason, maxAttempts)`. The version is retried until `maxAttempts`,
   then marked `FAILED` — **never** silently `CLEAN`.

If no adapter is configured, or the driver cannot read bytes back, the worker is **DEGRADED**:
it claims nothing and no document is ever marked clean.

## Storage-driver read (works with local, S3, and Supabase)

The worker does not touch the filesystem directly. It reads through whichever
`STORAGE_DRIVER` the deployment uses, so the same code path serves self-hosted and cloud:

- **local** — stats the object, refuses anything over `maxBytes` before reading a byte, and
  races both filesystem calls against `timeoutMs`. Quarantine renames under `.quarantine/`.
- **s3 / supabase** — mints a short-lived presigned GET and streams it with `boundedFetch`:
  rejects up front when `Content-Length` exceeds the cap, hard-stops mid-stream if a lying or
  absent length overflows the cap, and aborts after `timeoutMs`. Bytes never buffer past the cap.

## Configuration

### Adapter selection

| Variable | Values | Default | Meaning |
|----------|--------|---------|---------|
| `SCANNER_ADAPTER` | `clamav` \| `fake` \| *(unset)* | *(unset → DEGRADED)* | `clamav` for production; `fake` flags EICAR only (dev/tests); unset = degraded, nothing cleaned. |

### ClamAV (`SCANNER_ADAPTER=clamav`)

Talks to `clamd` over TCP using the INSTREAM protocol; `ready()` PINGs it (expects `PONG`).

| Variable | Default | Meaning |
|----------|---------|---------|
| `CLAMAV_HOST` | `127.0.0.1` | `clamd` host. |
| `CLAMAV_PORT` | `3310` | `clamd` TCP port. |

Operational timeouts inside the adapter: readiness PING times out at **2 s**; a scan times out
at **30 s** (a `clamd` that stalls raises an error → the version is retried, not cleaned). Keep
`clamd`'s `StreamMaxLength` at or above `SCANNER_MAX_BYTES` so a legitimate large file is not
truncated. Health is observable via the worker's startup `readiness` log
(`{ adapter, driver, ready, degraded }`).

### Read limits and retry accounting

| Variable | Default | Meaning |
|----------|---------|---------|
| `SCANNER_MAX_BYTES` | `10485760` (10 MB) | Hard cap on object size read for scanning; larger → `fn_scan_fail`. |
| `SCANNER_READ_TIMEOUT_MS` | `15000` | Timeout for fetching object bytes from storage. |
| `SCANNER_MAX_ATTEMPTS` | `3` | Retries before a version is dead-lettered `FAILED`. |
| `SCANNER_INTERVAL_MS` | `5000` | Poll interval between claim batches. |

### Storage selection (shared with the API)

`STORAGE_DRIVER` = `local` (default) \| `s3` \| `supabase`, with the same driver env the API
uses (`S3_BUCKET`/`S3_REGION`/`AWS_*`, or `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/
`STORAGE_BUCKET`). For **local** dev the worker reads from `STORAGE_DIR`, falling back to
`SJKVY_DOC_STORAGE` (the dir the Next BFF upload route writes to) so both sides share one root
without extra config. In production both API and worker point at the same object store, so the
worker reads exactly what the client uploaded.

## Security invariants

- The upload route only ever records `PENDING`; it can **never** set `CLEAN`.
- Only the worker's `service_role` credential (never present in the browser) can call
  `fn_scan_result`.
- `PENDING`/`FLAGGED` versions are not viewable and cannot satisfy submission requirements.
- Read is bounded (size + timeout) so a hostile or corrupt object cannot exhaust the worker.
- `storage_path` is never returned to any client.
