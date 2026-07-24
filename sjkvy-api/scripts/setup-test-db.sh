#!/usr/bin/env bash
# setup-test-db.sh — build a fresh sjkvy_api database for the API integration tests:
# harness roles + migrations 0000–0003 + seed + auth adapter + API login role.
# Requires PostgreSQL 15+ and permission to create databases/roles.
set -euo pipefail
DB=${1:-sjkvy_api}
DBROOT="$(cd "$(dirname "$0")/../../sjkvy-db"; pwd)"
ADAPTER="$(cd "$(dirname "$0")/.."; pwd)/sql/auth_adapter.sql"

# If not already a superuser session, re-exec the DDL under the postgres OS user.
# (On the dev box psql/createdb run as the postgres peer role.)
if [ "${PGSETUP_PRIV:-}" != "1" ] && command -v sudo >/dev/null 2>&1; then
  exec sudo -u postgres env "PATH=$PATH" PGSETUP_PRIV=1 bash "$0" "$DB"
fi

dropdb --if-exists "$DB"; createdb "$DB"
psql -v ON_ERROR_STOP=1 -q "$DB" -f "$DBROOT/tests/plain/00_harness.sql"
# apply every migration in deterministic order (gaps like absent 0006/0007 are fine)
for f in $(ls "$DBROOT"/migrations/[0-9]*.sql | sort); do
  psql -v ON_ERROR_STOP=1 -q "$DB" -f "$f"
done
psql -v ON_ERROR_STOP=1 -q "$DB" -f "$DBROOT/tests/plain/01_seed.sql"
psql -v ON_ERROR_STOP=1 -q "$DB" -f "$ADAPTER"

psql -v ON_ERROR_STOP=1 -q "$DB" <<'SQL'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='sjkvy_api_login') THEN
    CREATE ROLE sjkvy_api_login LOGIN PASSWORD 'apitest';
  END IF;
END $$;
GRANT anon, authenticated, service_role TO sjkvy_api_login;
GRANT USAGE ON SCHEMA app, auth TO sjkvy_api_login;
-- Admin password for the out-of-band test fixture pool (test env only).
ALTER ROLE postgres WITH PASSWORD 'postgres';
SQL
echo "test db '$DB' ready"
