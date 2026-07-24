// scanner-index.ts — standalone production scanner worker process (sidecar/cron), separate
// from the API and the browser. Connects to the DB as service_role and drives fn_scan_claim/
// fn_scan_result/fn_scan_fail. If SCANNER_ADAPTER is unset, readiness reports degraded and no
// document is ever marked clean.
import { loadConfig } from '../config.js';
import { initDb, closeDb } from '../db.js';
import { runScannerLoop, ScannerWorker } from './scanner-worker.js';

async function main(): Promise<void> {
  const cfg = loadConfig();
  initDb(cfg.databaseUrl);
  const intervalMs = Number(process.env.SCANNER_INTERVAL_MS ?? 5000);
  const stop = { stopped: false };
  process.on('SIGINT', () => (stop.stopped = true));
  process.on('SIGTERM', () => (stop.stopped = true));
  const readiness = await new ScannerWorker().readiness();
  console.log(JSON.stringify({ msg: 'scanner worker started', intervalMs, readiness }));
  await runScannerLoop(intervalMs, stop, (m) => console.log(JSON.stringify({ msg: m })));
  await closeDb();
}
main().catch((err) => { console.error('scanner fatal', err); process.exit(1); });
