# Executing this suite (requires real PostgreSQL 15+ — could NOT run in the build sandbox)
The build environment had no PostgreSQL and no network to install one (apt 403 / PyPI unreachable),
so Phases 2–7 were BLOCKED there. On any machine with PostgreSQL 15+:

    cd sjkvy-db
    ./tests/run_all.sh sjkvy_test        # Level 1: migrations 0000→0003, seed, t01–t04
    # Level 2 concurrency (real parallel sessions):
    createdb sjkvy_conc && ./tests/run_all.sh sjkvy_conc >/dev/null
    for s in tests/concurrency/*.sh; do bash "$s" sjkvy_conc; done
    psql sjkvy_conc -c "SELECT name, ok FROM app_test.results WHERE NOT ok;"   # must be empty

Exit code 0 from run_all.sh + empty failure set from concurrency = promote to Supabase staging
per ci/gate.md. Docker one-liner if no local PG:
    docker run --rm -e POSTGRES_PASSWORD=x -e POSTGRES_DB=sjkvy_test -p 5432:5432 postgres:15
    PGHOST=localhost PGUSER=postgres PGPASSWORD=x ./tests/run_all.sh sjkvy_test
