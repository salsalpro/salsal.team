# Goal
SQLite / better-sqlite3 → PostgreSQL migration for salsal.team, preserving behavior and minimizing changes.

# Completed
Mandatory initial no-edit inspection/report before implementation and resume no-edit inspection/report completed. Runtime conversion, all necessary async callers, PostgreSQL schema compatibility, isolated tests, WAL-aware backup/import/validation, rollback runbook and README are complete. Final diff and JSX structure audited. No commit/push/deployment performed.

# Current State
Updated October 5, 2026. Project `/home/salsal/Desktop/salsal.team`, branch main, baseline/rollback commit `9942ab9`. Migration is implemented and verified locally. Build/lint/types pass, 17 backend/migration and 10 browser tests pass. No remaining known migration test failures. Production cutover is intentionally pending an operator-selected DATABASE_URL and final source backup. Existing code must not be rebuilt/redesigned.

# Files Changed
See the exhaustive per-file reasons in POSTGRESQL_MIGRATION.md. Core: db.ts (pg singleton, query, same-connection transaction, explicit migrations), repository.ts (SQL/async), authorization/catalog/API/server-page callers (await only), domain migration (quoted auth table/BIGINT). Public server components change only async behavior; dashboard types use Awaited. The auth form's pre-existing three-line response-discard/credential-log bug was corrected only because it blocked auth verification. Tests/scripts/config/manifests/docs adapted for PG and safe migration. No styles/layout markup/routes/validation/role policy changed. SQLite stays development-only for transfer/tests; original installed package versions retained.

# Database State
Original `.data/salsal.sqlite` AND WAL remain unchanged against initial hashes. Verified backup `.data/backups/pre-postgres-2026-10-04.sqlite` and adjacent private manifest retained and digest rechecked. No real data imported into PG or switched. `.env.local` preserved; operator must set DATABASE_URL before running the new app. Synthetic local PostgreSQL 16.15 cluster is under ignored work/postgres, used port 55432 for verification and was cleanly stopped after checks; it is not a production service. Synthetic dump retained privately in work/verified-postgres.dump. Import requires empty initialized target, validates every row atomically, rejects repeat import into occupied target; verify is read-only.

# Verification Completed
npm run lint: pass. npm run typecheck: pass. npm test with dedicated TEST_DATABASE_URL: 17/17 pass. npm run build via work/verify-build.mjs with initialized isolated schema: pass, no missing-schema warnings. npm run test:e2e: 10/10 pass (~1 minute). SQLite backup/source integrity: pass. Synthetic PostgreSQL dump/restore and constraints comparison via work/verify-restore.mjs: pass. Dependency-version comparison and lockfile dry run: pass. JSX AST audit: all 15 changed TSX files preserve rendering structure ignoring awaits. git diff --check: pass. See VALIDATION.md for commands/warnings/limits.

# Remaining Work
Operator deployment only: select/provision actual PostgreSQL target, keep auth secret stable, freeze SQLite writers, take fresh verified source backup, initialize EMPTY target, import+verify, run restricted smoke checks, then switch traffic. No production/provider TLS/pooler/load checks have been performed. Keep SQLite/previous release/private environment until rollback window closes. PostgreSQL-only writes require reconciliation before returning to SQLite.

# Next Action
Configure the operator-selected private DATABASE_URL and follow POSTGRESQL_MIGRATION.md's cutover procedure. Do not restart completed implementation or rerun the backup command using the occupied backup path.

# Important Warnings
Do not reset/reseed/delete main SQLite, its WAL or backups. Do not discard uncommitted migration changes. Do not resume unrelated auth/UI feature work. No commits/push/deploy authorized. Older CHECKPOINT.md points here. Previous browser failures were test schema sharing and unordered fixture selection, both resolved; do not rewrite application logic for them. Next emitted stream-closed messages during rapid browser navigation, but all assertions/runtime-error checks passed; framework cause remains uninvestigated outside migration scope. Restore helpers operate only on synthetic local resources. No production rollback was executed.

To rerun checks using the existing isolated local cluster, start its saved binaries/data from the project root (do not initialize a new cluster):

```bash
LD_LIBRARY_PATH="$PWD/work/postgres/runtime/usr/lib/x86_64-linux-gnu" work/postgres/runtime/usr/lib/postgresql/16/bin/pg_ctl -D work/postgres/data -l work/postgres/server.log -o "-h 127.0.0.1 -p 55432 -k $PWD/work/postgres" start
```

This loopback-only cluster uses a synthetic `salsal_test` role and `postgres` test database; no production credentials. Set TEST_DATABASE_URL privately for test commands. The cluster contains no migrated main application data. Stop it with the same pg_ctl path and `-D work/postgres/data -m fast stop` afterward.

## Local runtime activation in progress — October 5
User reported /fa HTTP 500 because DATABASE_URL is absent. Confirmed private env still has only DATABASE_PATH, Next dev is on port 3000, and no PG server is running. Authorized fix: create a separate persistent local PG cluster under .data/postgres-local (port 55433, password authentication), retain the verification cluster separately, take a fresh WAL-safe source backup, initialize a NEW empty local application DB, import/verify before changing private env, preserve original env backup, then verify existing app routes. Never delete/reset SQLite or import twice into an occupied target. Runtime activation is local only, not production.
