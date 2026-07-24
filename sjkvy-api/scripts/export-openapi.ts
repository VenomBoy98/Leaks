// export-openapi.ts — build the server and dump its OpenAPI document to openapi.json.
// Runs without a DB connection (routes are registered from the static manifest).
import { writeFileSync } from 'node:fs';
import { loadConfig } from '../src/config.js';
import { buildServer } from '../src/server.js';

async function main(): Promise<void> {
  // No runtime auth here; provide dev-mode dummies so config validation passes.
  process.env.NODE_ENV ??= 'development';
  process.env.DATABASE_URL ??= 'postgres://unused@localhost:5432/unused';
  process.env.JWT_SECRET ??= 'export-only-not-a-real-secret';
  process.env.STORAGE_URL_SIGNING_SECRET ??= 'export-only-not-a-real-secret';
  const app = await buildServer(loadConfig());
  await app.ready();
  const doc = app.swagger();
  writeFileSync('openapi.json', JSON.stringify(doc, null, 2));
  await app.close();
  const paths = Object.keys((doc as { paths: Record<string, unknown> }).paths).length;
  console.log(`wrote openapi.json (${paths} paths)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
