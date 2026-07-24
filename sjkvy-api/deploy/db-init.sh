#!/usr/bin/env bash
# db-init.sh — runs once on first Postgres container init (mounted into
# /docker-entrypoint-initdb.d). Applies the verified, FROZEN migrations 0000–0003 plus
# the auth adapter, then creates the least-privileged API login role. Order matters:
# roles + auth.uid() must exist BEFORE the migrations, because several LANGUAGE sql
# helpers reference auth.uid() at CREATE time.
set -euo pipefail
PSQL=(psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB")
MIG=/sjkvy-db/migrations
SQL=/sjkvy-api-sql

echo "[db-init] auth adapter (roles + auth.uid)"
"${PSQL[@]}" -f "$SQL/auth_adapter.sql"

echo "[db-init] migration ledger (app.schema_migrations)"
"${PSQL[@]}" <<'SQL'
CREATE SCHEMA IF NOT EXISTS app;
CREATE TABLE IF NOT EXISTS app.schema_migrations (
  filename   text PRIMARY KEY,
  checksum   text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  success    boolean NOT NULL DEFAULT true
);
SQL

echo "[db-init] applying all migrations in order (0000-0005 frozen core + 0008+ additive)"
# Apply each migration and record it in the ledger (sha256 matches scripts/migrate.mjs, so a
# later `node scripts/migrate.mjs` run skips these instead of re-applying them). A fresh
# container is guaranteed empty, so we apply unconditionally here; incremental upgrades of a
# live database go through scripts/migrate.mjs.
for f in $(ls "$MIG"/[0-9]*.sql | sort); do
  base=$(basename "$f"); csum=$(sha256sum "$f" | cut -d' ' -f1)
  echo "  - $base"
  "${PSQL[@]}" -f "$f"
  "${PSQL[@]}" -c "INSERT INTO app.schema_migrations (filename, checksum, success) VALUES ('$base','$csum',true) ON CONFLICT (filename) DO UPDATE SET checksum=EXCLUDED.checksum, applied_at=now(), success=true;"
done

echo "[db-init] API login role"
: "${API_DB_PASSWORD:?API_DB_PASSWORD must be set}"
"${PSQL[@]}" <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='sjkvy_api_login') THEN
    CREATE ROLE sjkvy_api_login LOGIN;
  END IF;
END \$\$;
ALTER ROLE sjkvy_api_login WITH PASSWORD '${API_DB_PASSWORD}';
GRANT anon, authenticated, service_role TO sjkvy_api_login;
GRANT USAGE ON SCHEMA app, auth TO sjkvy_api_login;
SQL

echo "[db-init] done"
