// index.ts — process entry point.
import { loadConfig } from './config.js';
import { initDb, closeDb } from './db.js';
import { buildServer } from './server.js';

async function main(): Promise<void> {
  const cfg = loadConfig();
  initDb(cfg.databaseUrl);
  const app = await buildServer(cfg);

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info(`received ${signal}, shutting down`);
    await app.close();
    await closeDb();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await app.listen({ port: cfg.port, host: cfg.host });
}

main().catch((err) => {
  console.error('fatal startup error', err);
  process.exit(1);
});
