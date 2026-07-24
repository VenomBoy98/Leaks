# Migration ledger (`scripts/migrate.mjs`)

The migration runner is a **checksum ledger**, not a blind "apply every `.sql` file" loop.
It records every applied migration so a database is never re-initialised, an already-applied
migration is never silently rewritten, and new migrations are picked up exactly once.

## Ledger table

```
app.schema_migrations (
  filename   text PRIMARY KEY,   -- e.g. 0008_contact_enquiry.sql
  checksum   text NOT NULL,      -- sha256 of the file contents at apply time
  applied_at timestamptz NOT NULL DEFAULT now(),
  success    boolean NOT NULL DEFAULT true
)
```

The runner creates `schema app` and this table on first run if they are absent.

## What the runner does

For each `migrations/[0-9]*.sql` in **sorted filename order**:

| Situation | Action |
|-----------|--------|
| Not in the ledger | Apply it in a transaction, then record `filename + checksum + success=true`. |
| In the ledger, `success=true`, checksum matches | **Skip** (already applied). |
| In the ledger, `success=false` (a previous failed attempt) | Re-apply it. |
| In the ledger, **checksum differs** | **HARD FAIL** (exit 2). Applied migrations are immutable — never edit them. |
| Apply throws | Roll back, record `success=false`, exit 3. Nothing is left half-applied. |

Each migration runs inside `BEGIN … COMMIT`, so a failure leaves no partial DDL behind.

## Usage

```bash
# from sjkvy-db/
npm run migrate                          # uses DATABASE_URL, or PGHOST/PGPORT/PGUSER/PGDATABASE
node scripts/migrate.mjs --dir migrations # override the migrations directory
```

Connection: set `DATABASE_URL`, or the standard `PGHOST/PGPORT/PGUSER/PGDATABASE` variables.

## Fresh initialisation

On an empty database the ledger is empty, so **all** migrations apply in order:

```
applying 0000_schema.sql … applying 0010_scan_worker.sql
migrate: applied=9 skipped=0 total=9
```

> The auth adapter / test harness (roles + `auth.uid()`) must be applied **before** the
> migrations, because several `LANGUAGE sql` helpers reference `auth.uid()` at `CREATE` time.
> `deploy/db-init.sh` (prod) and `scripts/setup-test-db.sh` (tests) already do this; the ledger
> runner only owns the migration step.

## Upgrading a pre-existing database (the `--baseline-through` flag)

A database created **before** the ledger existed already contains the objects from
`0000–0005` but has no `app.schema_migrations` rows. Running the plain runner there would try
to re-apply `0000_schema.sql` and fail with `relation "profiles" already exists`.

Adopt such a database into the ledger **once**:

```bash
node scripts/migrate.mjs --baseline-through 0005_worker.sql
```

This **stamps** every migration up to and including `0005_worker.sql` as applied — recording
its checksum **without executing it** — then applies only the newer migrations (`0008–0010`):

```
baseline (stamped, not run) 0000_schema.sql … 0005_worker.sql
baseline: stamped 6 migration(s) through 0005_worker.sql
applying 0008_contact_enquiry.sql … 0010_scan_worker.sql
migrate: applied=3 skipped=6 total=9
```

Every subsequent run (with or without the flag) skips all of them. The flag is idempotent —
once a migration is in the ledger it is never stamped again.

> **Pick the boundary carefully.** `--baseline-through <file>` asserts "every migration up to
> and including `<file>` is *already present* in this database". Only baseline through the last
> migration you know the legacy DB actually contains. Anything after it will be *applied*.

## Adding a future migration after later ones already exist (e.g. `0007_email_auth.sql`)

The intended email/OTP auth migration will be numbered `0007`, but `0008–0010` already ship and
are applied in production. A `0007` filename sorts **before** `0008`, yet the ledger already has
`0008–0010` marked applied. This is safe and requires **no special handling**:

1. Add `migrations/0007_email_auth.sql` to the repo as normal.
2. Deploy and run `node scripts/migrate.mjs`.
3. The runner skips `0000–0005` and `0008–0010` (already in the ledger), sees `0007` is **not**
   in the ledger, and applies it. It is recorded with a fresh `applied_at` — i.e. chronologically
   **after** `0008–0010`, even though it sorts before them.

```
applying 0007_email_auth.sql
migrate: applied=1 skipped=9 total=10
```

**Consequence for authoring `0007`:** because it applies *after* `0008–0010` on existing
databases (but *before* them on brand-new ones, where filename order wins), a late-numbered
migration must be written to be **order-independent** with respect to the higher-numbered ones:

- Do not depend on objects created by `0008–0010`, and do not assume they are absent.
- Use `CREATE … IF NOT EXISTS` / `CREATE OR REPLACE` and additive, self-contained DDL.
- If `0007` genuinely must run before `0008–0010`, it cannot be back-inserted — give it a new
  number that sorts after the highest applied migration (e.g. `0011_email_auth.sql`) instead.

Prefer allocating the **next free number** for genuinely new work; only reuse a gap like `0007`
for a change that is safe to apply in either position.

## Never do this

- **Never edit an applied migration.** Changing its bytes changes its checksum and the runner
  hard-fails by design. Ship a new migration that alters the object instead.
- **Never rename `0008–0010`.** They are applied in real databases; renaming orphans the ledger
  row and the runner would try to apply the "new" filename from scratch.
- **Never baseline past migrations a database does not actually contain** — you would mark
  un-applied DDL as done and the objects would be missing.
