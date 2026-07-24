// scanner-worker.ts — production document scanner. Runs as a trusted backend worker
// (service_role), NOT reachable from any browser. Claims PENDING document versions via
// fn_scan_claim (FOR UPDATE SKIP LOCKED, attempt-limited, timeout-reclaimable), reads the
// stored object THROUGH THE STORAGE DRIVER (local / s3 / supabase) under a hard size + time
// limit, scans with the configured adapter, and records the verdict via fn_scan_result. Only
// this identity can set CLEAN/FLAGGED. FLAGGED objects are quarantined (best-effort — the DB
// also marks them non-servable). Failures are retried up to the limit, then FAILED (never CLEAN).
import { callFn, queryRead, type Actor } from '../db.js';
import { getScanAdapter, type ScanAdapter } from './scanner-adapter.js';
import { buildStorageFromEnv, type StorageService } from '../storage/index.js';

const SERVICE: Actor = { role: 'service_role', uid: null };
const MAX_BYTES = Number(process.env.SCANNER_MAX_BYTES ?? 10 * 1024 * 1024);
const MAX_ATTEMPTS = Number(process.env.SCANNER_MAX_ATTEMPTS ?? 3);
const READ_TIMEOUT_MS = Number(process.env.SCANNER_READ_TIMEOUT_MS ?? 15000);

interface ClaimRow { o_version_id: string; o_storage_path: string; o_size_bytes: number; o_attempts: number }

export class ScannerWorker {
  private adapter: ScanAdapter | null;
  private storage: StorageService;
  constructor(adapter: ScanAdapter | null = getScanAdapter(), storage: StorageService = buildStorageFromEnv()) {
    this.adapter = adapter;
    this.storage = storage;
  }

  // Health/readiness without leaking paths or document data. Degraded unless BOTH an adapter is
  // configured AND the driver can actually read object bytes back to the worker.
  async readiness(): Promise<{ adapter: string; driver: string; ready: boolean; degraded: boolean }> {
    const adapterReady = this.adapter ? await this.adapter.ready().catch(() => false) : false;
    const canRead = typeof this.storage.driver.readObject === 'function';
    const ready = adapterReady && canRead;
    return { adapter: this.adapter?.name ?? 'none', driver: this.storage.driver.kind, ready, degraded: !ready };
  }

  async tick(batch = 10): Promise<{ scanned: number; clean: number; flagged: number; failed: number; degraded: boolean }> {
    const health = await this.readiness();
    if (health.degraded) return { scanned: 0, clean: 0, flagged: 0, failed: 0, degraded: true };
    const rows = await queryRead<ClaimRow>(SERVICE, 'SELECT * FROM app.fn_scan_claim($1,$2)', [batch, MAX_ATTEMPTS]);
    let clean = 0, flagged = 0, failed = 0;
    for (const r of rows) {
      try {
        // Bounded read through the driver: rejects oversize objects and times out slow reads.
        const bytes = await this.storage.driver.readObject!(r.o_storage_path, { maxBytes: MAX_BYTES, timeoutMs: READ_TIMEOUT_MS });
        const verdict = await this.adapter!.scan(bytes);
        await callFn(SERVICE, 'fn_scan_result', [r.o_version_id, verdict]); // trusted verdict record
        await callFn(SERVICE, 'fn_scan_done', [r.o_version_id]);
        if (verdict === 'FLAGGED') {
          await this.storage.driver.quarantine?.(r.o_storage_path).catch(() => {}); // defence in depth
          flagged++;
        } else {
          clean++;
        }
      } catch (e) {
        failed++;
        await callFn(SERVICE, 'fn_scan_fail', [r.o_version_id, String((e as Error).message ?? e), MAX_ATTEMPTS]).catch(() => {});
      }
    }
    return { scanned: rows.length, clean, flagged, failed, degraded: false };
  }
}

export async function runScannerLoop(intervalMs: number, stop: { stopped: boolean }, log: (m: string) => void): Promise<void> {
  const w = new ScannerWorker();
  const health = await w.readiness();
  log(`scanner readiness: ${JSON.stringify(health)}`);
  while (!stop.stopped) {
    const r = await w.tick().catch((e) => { log(`scanner tick error ${String(e)}`); return null; });
    if (r && r.scanned) log(`scanner tick ${JSON.stringify(r)}`);
    await new Promise((res) => setTimeout(res, intervalMs));
  }
}
