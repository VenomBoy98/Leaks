// scanner-worker.ts — production document scanner. Runs as a trusted backend worker
// (service_role), NOT reachable from any browser. Claims PENDING document versions via
// fn_scan_claim (FOR UPDATE SKIP LOCKED, attempt-limited, timeout-reclaimable), reads the
// stored object under a strict size limit, scans with the configured adapter, and records the
// verdict via fn_scan_result. Only this identity can set CLEAN/FLAGGED. FLAGGED objects are
// quarantined. Failures are retried up to the limit, then marked FAILED (never CLEAN).
import { readFile, stat, mkdir, rename } from 'node:fs/promises';
import { join, normalize, dirname } from 'node:path';
import { callFn, queryRead, type Actor } from '../db.js';
import { getScanAdapter, type ScanAdapter } from './scanner-adapter.js';

const SERVICE: Actor = { role: 'service_role', uid: null };
const MAX_BYTES = Number(process.env.SCANNER_MAX_BYTES ?? 10 * 1024 * 1024);
const MAX_ATTEMPTS = Number(process.env.SCANNER_MAX_ATTEMPTS ?? 3);
const STORAGE_ROOT = normalize(process.env.SJKVY_DOC_STORAGE ?? join(process.cwd(), '.storage'));
const QUARANTINE = join(STORAGE_ROOT, '.quarantine');

interface ClaimRow { o_version_id: string; o_storage_path: string; o_size_bytes: number; o_attempts: number }

export class ScannerWorker {
  private adapter: ScanAdapter | null;
  constructor(adapter: ScanAdapter | null = getScanAdapter()) { this.adapter = adapter; }

  // Health/readiness without leaking paths or document data.
  async readiness(): Promise<{ adapter: string; ready: boolean; degraded: boolean }> {
    const ready = this.adapter ? await this.adapter.ready().catch(() => false) : false;
    return { adapter: this.adapter?.name ?? 'none', ready, degraded: !ready };
  }

  async tick(batch = 10): Promise<{ scanned: number; clean: number; flagged: number; failed: number; degraded: boolean }> {
    const health = await this.readiness();
    if (health.degraded) return { scanned: 0, clean: 0, flagged: 0, failed: 0, degraded: true };
    const rows = await queryRead<ClaimRow>(SERVICE, 'SELECT * FROM app.fn_scan_claim($1,$2)', [batch, MAX_ATTEMPTS]);
    let clean = 0, flagged = 0, failed = 0;
    for (const r of rows) {
      try {
        // path containment — never read outside the storage root
        const full = normalize(join(STORAGE_ROOT, r.o_storage_path));
        if (!full.startsWith(STORAGE_ROOT + '/') && full !== STORAGE_ROOT) throw new Error('path escape');
        const st = await stat(full);
        if (st.size > MAX_BYTES) throw new Error('object exceeds size limit');
        const bytes = await readFile(full);
        const verdict = await this.adapter!.scan(bytes);
        await callFn(SERVICE, 'fn_scan_result', [r.o_version_id, verdict]); // trusted verdict record
        await callFn(SERVICE, 'fn_scan_done', [r.o_version_id]);
        if (verdict === 'FLAGGED') { await this.quarantine(full); flagged++; } else clean++;
      } catch (e) {
        failed++;
        await callFn(SERVICE, 'fn_scan_fail', [r.o_version_id, String((e as Error).message ?? e), MAX_ATTEMPTS]).catch(() => {});
      }
    }
    return { scanned: rows.length, clean, flagged, failed, degraded: false };
  }

  private async quarantine(full: string): Promise<void> {
    try {
      const dest = join(QUARANTINE, full.slice(STORAGE_ROOT.length + 1));
      await mkdir(dirname(dest), { recursive: true });
      await rename(full, dest); // move flagged object out of servable storage
    } catch {
      /* best-effort: the doc is already non-servable (not CLEAN) */
    }
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
