# PostgreSQL migration validation

Validation completed October 5, 2026 in `/home/salsal/Desktop/salsal.team`, against baseline `9942ab9`. Node 22.23.3, Next 16.3.8, PostgreSQL 16.15, pg 8.23.1, local Google Chrome. Tests use isolated PostgreSQL schemas and synthetic accounts; no main application records were changed.

## Executed checks

| Check | Actual result |
| --- | --- |
| `npm install pg --save`, PostgreSQL types, SQLite moved to development dependencies | Passed. Final lockfile preserves every pre-existing package version. Added only pg/types and their dependency tree; unrelated bundled-package metadata removed. |
| `npm ci --dry-run --ignore-scripts --no-audit --no-fund` | Passed lockfile/install-plan verification; this is a dry run, not a second full installation. |
| `npm run lint` | Passed. |
| `npm run typecheck` | Passed. |
| `npm test` with dedicated `TEST_DATABASE_URL` | **17/17 passed**, including 13 existing backend checks and 4 migration/PostgreSQL tests. |
| `npm run build`, invoked by ignored `work/verify-build.mjs` with a newly initialized isolated schema | Passed. Final build had no missing-schema warnings. |
| `npm run test:e2e` with dedicated `TEST_DATABASE_URL` | **10/10 passed**, approximately one minute. |
| `npm run db:sqlite -- backup .data/salsal.sqlite .data/backups/pre-postgres-2026-10-04.sqlite` | Passed October 4; WAL-aware backup, SQLite integrity/foreign-key checks, counts and private manifest created. |
| Source and backup digest checks | Original SQLite main file and WAL still match inspection hashes; backup SHA-256 matches its manifest on October 5. |
| `node --import tsx work/verify-restore.mjs` | Synthetic PostgreSQL custom-format dump, `pg_restore --list`, actual restore to a separate temporary database, record and constraint-count comparison passed. Only the script's own test resources were cleaned up. |
| `node work/audit-jsx.cjs` | All 15 modified TSX files preserve JSX structure when required await expressions are disregarded. No style/layout files changed. |
| `git diff --check` | Passed. |

The private environment remained unchanged. Commands used an isolated rootless PostgreSQL cluster in ignored `work/postgres`, not a production connection. The verification cluster was cleanly stopped after all checks. Build and restore verification helpers are ignored local audit artifacts, not application dependencies.

## What the tests verify

- Repeatable domain migrations, PostgreSQL connectivity, native auth timestamps/booleans and UTC analytics.
- Registration, login, duplicate email/case normalization, incorrect credentials, stored roles, retained migrated password hashes and existing sessions.
- Public role injection denial, strict profile updates, unauthorized admin API denial, origin checks, immediate permission revocation, customer-specific projects/files and service assignments.
- Public localized routes/content, contact-to-admin lead persistence, profile, sign-out, blog publishing, portfolio/project editing, assignments and deliverables, service visibility, mobile/RTL rendering, and existing localized error feedback.
- SQLite WAL backup verification, all-table import with ID/full-record comparison, nullable fields and integer flags, foreign-key/unique constraints, failed import rollback followed by safe retry, refusal of an occupied target, and unchanged backup/source contents.
- Same-connection transaction rollback and atomic concurrent counters: exactly five of twenty simultaneous requests are allowed for a five-request limit.

The import fixture covers every domain table; auth credentials/sessions are real synthetic Better Auth records. Full equality is checked before subsequent login writes change session data. Neither importer nor tests print passwords/hashes/session contents.

## Failures investigated and resolved

1. Test schema validator initially rejected the digit in `e2e`; corrected to accept the generated prefix.
2. Playwright reloads configuration in workers. Creating a fresh schema name each time made worker SQL target a schema different from the server. Workers now inherit the parent's schema/URL.
3. A test used an unordered project query and assumed that project's deliverable existed. PostgreSQL selected a different valid project. The test now explicitly joins deliverables when selecting its cross-account-access fixture. Application behavior was not changed to satisfy this assumption.
4. The first build used an uninitialized verification database and emitted Better Auth schema warnings. The final build initialized an isolated schema first and passed without those warnings.
5. The existing login form had a three-line expression that discarded the auth response and logged credentials; restoring typed response assignment was necessary to verify migrated registration/login. No broader auth or UI changes were made.

## Warnings and unverified deployment boundaries

- The browser server emitted Next.js `The destination stream closed early` messages during the rapid-navigation suite. All route/UI assertions passed and the browser runtime/hydration-error fixture found no errors. These server log messages were not hidden or treated as proof of a database failure; their framework-level cause was not investigated outside migration scope.
- The runner emitted the terminal `NO_COLOR`/`FORCE_COLOR` warning. Better Auth logged the expected invalid-password warning for the negative credential test.
- No production/Vercel deployment, provider TLS/pooler configuration, load test, live production PostgreSQL import or live cutover was performed. The operator must provide the actual destination and use the runbook.
- The local verified SQLite backup is not a claim that an external production source is current/backed up. Obtain a fresh write-frozen backup for final cutover.
- PostgreSQL dump/restore was verified with synthetic data, not an existing production target. Production backup restorability remains an operator responsibility.
- `DATABASE_URL` is required before this migrated application can run locally or in production. Existing `.env.local` still contains the old SQLite configuration and was preserved for rollback. The implementation has not silently switched it.

See [POSTGRESQL_MIGRATION.md](POSTGRESQL_MIGRATION.md) for setup, import/verify, cutover and rollback; [CODEX_MIGRATION_CHECKPOINT.md](CODEX_MIGRATION_CHECKPOINT.md) is the continuation state.
