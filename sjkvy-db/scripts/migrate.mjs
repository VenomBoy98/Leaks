// migrate.mjs — checksum-ledger migration runner. Records every applied migration
// (filename, sha256, applied_at, success) in app.schema_migrations. Fresh databases apply
// all migrations in deterministic filename order; already-applied ones are skipped; a changed
// checksum for an already-applied migration is a HARD FAILURE. Unknown files are never marked
// applied without running. Usage: node scripts/migrate.mjs [--dir migrations]
import { readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const MIG_DIR = process.argv.includes("--dir") ? process.argv[process.argv.indexOf("--dir") + 1] : join(here, "../migrations");
const sha = (s) => createHash("sha256").update(s).digest("hex");

const conn = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : { host: process.env.PGHOST, port: Number(process.env.PGPORT ?? 5432), user: process.env.PGUSER, database: process.env.PGDATABASE };
const client = new pg.Client(conn);

async function main() {
  await client.connect();
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS app;
    CREATE TABLE IF NOT EXISTS app.schema_migrations (
      filename   text PRIMARY KEY,
      checksum   text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now(),
      success    boolean NOT NULL DEFAULT true
    );`);

  const files = readdirSync(MIG_DIR).filter((f) => /^[0-9].*\.sql$/.test(f)).sort();
  const applied = new Map((await client.query("SELECT filename, checksum, success FROM app.schema_migrations")).rows.map((r) => [r.filename, r]));

  // --baseline-through <filename>: adopt a PRE-EXISTING database into the ledger. Every
  // migration up to and including <filename> is STAMPED as applied (its checksum recorded)
  // WITHOUT being executed, because those objects already exist in this database. A subsequent
  // run then applies only the newer, not-yet-present migrations. Use this exactly once when
  // introducing the ledger to a legacy DB (e.g. an existing 0000–0005 install gaining 0008+).
  const bIdx = process.argv.indexOf("--baseline-through");
  if (bIdx !== -1) {
    const through = process.argv[bIdx + 1];
    if (!through || !files.includes(through)) {
      console.error(`FATAL: --baseline-through requires an existing migration filename (got ${through ?? "<none>"}).`);
      process.exit(2);
    }
    let stamped = 0;
    for (const f of files) {
      if (!applied.has(f)) {
        const csum = sha(readFileSync(join(MIG_DIR, f), "utf8"));
        await client.query(
          `INSERT INTO app.schema_migrations (filename, checksum, success) VALUES ($1,$2,true) ON CONFLICT (filename) DO NOTHING`,
          [f, csum],
        );
        applied.set(f, { filename: f, checksum: csum, success: true });
        stamped++;
        console.log(`baseline (stamped, not run) ${f}`);
      }
      if (f === through) break;
    }
    console.log(`baseline: stamped ${stamped} migration(s) through ${through}`);
  }

  let ran = 0, skipped = 0;
  for (const f of files) {
    const sql = readFileSync(join(MIG_DIR, f), "utf8");
    const csum = sha(sql);
    const prev = applied.get(f);
    if (prev) {
      if (prev.checksum !== csum) {
        console.error(`FATAL: checksum changed for already-applied migration ${f}. Aborting (do not rewrite applied migrations).`);
        process.exit(2);
      }
      if (prev.success) { skipped++; continue; }
    }
    console.log(`applying ${f}`);
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        `INSERT INTO app.schema_migrations (filename, checksum, success) VALUES ($1,$2,true)
         ON CONFLICT (filename) DO UPDATE SET checksum=EXCLUDED.checksum, applied_at=now(), success=true`,
        [f, csum],
      );
      await client.query("COMMIT");
      ran++;
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      // record the failure without marking success
      await client.query(
        `INSERT INTO app.schema_migrations (filename, checksum, success) VALUES ($1,$2,false)
         ON CONFLICT (filename) DO UPDATE SET checksum=EXCLUDED.checksum, applied_at=now(), success=false`,
        [f, csum],
      ).catch(() => {});
      console.error(`FAILED ${f}: ${e.message}`);
      process.exit(3);
    }
  }
  console.log(`migrate: applied=${ran} skipped=${skipped} total=${files.length}`);
  await client.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
