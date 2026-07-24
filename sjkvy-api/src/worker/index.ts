// worker/index.ts — standalone notification worker process. Runs as a sidecar/cron,
// separate from the API. Connects to the same database as service_role and drives the
// verified outbox/delivery functions. No business logic lives here.
import { loadConfig } from '../config.js';
import { initDb, closeDb } from '../db.js';
import { runWorkerLoop } from './notification-worker.js';

async function main(): Promise<void> {
  const cfg = loadConfig();
  initDb(cfg.databaseUrl);
  const intervalMs = Number(process.env.WORKER_INTERVAL_MS ?? 5000);
  const stop = { stopped: false };
  const shutdown = () => {
    stop.stopped = true;
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ msg: 'notification worker started', intervalMs }));
  await runWorkerLoop(intervalMs, stop, (m) =>
    console.log(JSON.stringify({ msg: m })),
  );
  await closeDb();
}

main().catch((err) => {
  console.error('worker fatal', err);
  process.exit(1);
});
