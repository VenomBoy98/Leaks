#!/usr/bin/env bash
# run-tests.sh — build a fresh database and run each integration suite against it.
# The two suites both consume the seeded applicants A/B, so each runs on its own fresh
# build (mirroring the DB layer's separate level-1 / level-2 databases in run_all.sh).
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.."; pwd)"
DBROOT="$(cd "$HERE/../sjkvy-db"; pwd)"
DB=${1:-sjkvy_api}
export TEST_DATABASE_URL="postgres://sjkvy_api_login:apitest@127.0.0.1:5432/$DB"
export ADMIN_DATABASE_URL="postgres://postgres:postgres@127.0.0.1:5432/$DB"

build() { bash "$HERE/scripts/setup-test-db.sh" "$DB" >/dev/null; }

echo "== unit: s3 sigv4 (no DB) =="
npx vitest run test/s3-sigv4.unit.test.ts --reporter=dot

echo "== suite 1: api.integration =="
build
npx vitest run test/api.integration.test.ts --reporter=dot

echo "== suite 2: production.integration =="
build
npx vitest run test/production.integration.test.ts --reporter=dot

echo "== suite 3: catalogue.integration =="
build
npx vitest run test/catalogue.integration.test.ts --reporter=dot

echo "== suite 4: worker.integration =="
build
npx vitest run test/worker.integration.test.ts --reporter=dot

echo "== suite 5: concurrency.integration =="
build
npx vitest run test/concurrency.integration.test.ts --reporter=dot

echo "ALL API SUITES PASSED"
