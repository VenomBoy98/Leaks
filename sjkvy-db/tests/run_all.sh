#!/usr/bin/env bash
# SJKVY DB test runner — Level 1 (pgTAP-style plain) + Level 2 (concurrency) + verdict.
# Requires PostgreSQL 15+. If absent, emits BLOCKED (does NOT fabricate a pass).
set -uo pipefail
DB=${1:-sjkvy_test}; ROOT="$(cd "$(dirname "$0")/.."; pwd)"; cd "$ROOT"
if ! command -v psql >/dev/null || ! command -v initdb >/dev/null 2>&1; then
  if ! command -v pg_ctl >/dev/null 2>&1; then
    echo "RESULT: BLOCKED — PostgreSQL 15+ not available in this environment."
    echo "Static+semantic readiness gates: run ci/static_checks.py && ci/semantic_check.py"
    exit 3
  fi
fi
echo "== readiness gates =="
python3 ci/static_checks.py   || { echo "STATIC GATE FAIL"; exit 1; }
python3 ci/semantic_check.py  || { echo "SEMANTIC GATE FAIL"; exit 1; }
echo "== fresh db =="
dropdb --if-exists "$DB"; createdb "$DB"
psql -v ON_ERROR_STOP=1 -q "$DB" -f tests/plain/00_harness.sql   || { echo "HARNESS FAIL"; exit 1; }
# Apply EVERY migration in deterministic filename order (numeric prefixes; an absent
# 0006/0007 is fine, new migrations 0008+ are picked up automatically, each exactly once).
for f in $(ls migrations/[0-9]*.sql | sort); do
  echo "-- apply $(basename "$f")"; psql -v ON_ERROR_STOP=1 -q "$DB" -f "$f" \
    || { echo "MIGRATION $f FAILED — verdict NO-GO"; exit 2; }
done
psql -v ON_ERROR_STOP=1 -q "$DB" -f tests/plain/01_seed.sql || { echo "SEED FAIL"; exit 1; }
echo "== level 1 =="
for t in tests/plain/t0*.sql; do echo "-- $t"; psql -q "$DB" -f "$t"; done
echo "== level 2 (concurrency) =="
psql -v ON_ERROR_STOP=1 -q "$DB" -f tests/concurrency/_prep.sql || echo "prep warn"
for s in seat_race bed_race waitlist_race claim_race idem_race; do
  [ -f "tests/concurrency/$s.sh" ] && { echo "-- $s"; bash "tests/concurrency/$s.sh" "$DB"; }
done
echo "== results =="
psql -q "$DB" -c "SELECT ok, count(*) FROM app_test.results GROUP BY ok ORDER BY ok;"
psql -q "$DB" -c "SELECT name, detail FROM app_test.results WHERE NOT ok ORDER BY seq;"
FAIL=$(psql -qtA "$DB" -c "SELECT count(*) FROM app_test.results WHERE NOT ok")
TOTAL=$(psql -qtA "$DB" -c "SELECT count(*) FROM app_test.results")
echo "TOTAL=$TOTAL FAIL=$FAIL"
if [ "$FAIL" = "0" ]; then echo "VERDICT: GO (all $TOTAL runtime assertions passed)"; exit 0
else echo "VERDICT: NO-GO ($FAIL failing assertions — fix-forward per phase 6)"; exit 2; fi
