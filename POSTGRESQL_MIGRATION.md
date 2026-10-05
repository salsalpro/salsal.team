# SQLite → PostgreSQL migration runbook

Project: `/home/salsal/Desktop/salsal.team`. Baseline/rollback application revision: `9942ab9`. No deployment or production cutover has been performed.

## Inspection checkpoint and scope

The mandatory 14-part no-edit inspection report was delivered before any edits, with a clean working tree. Inspection found a synchronous `better-sqlite3` singleton, centralized raw SQL, explicit migrations, Better Auth database sessions, SQLite WAL, and database consumers in API handlers/server-rendered routes/scripts/tests. No ORM, auto-increment IDs, deployment manifests, or verified backup existed. `.data/salsal.sqlite` contains existing accounts and domain records; production provenance is unknown. An external production SQLite source is supported by the same commands below.

The migration preserves raw SQL, roles/ownership checks, IDs, constraints, API shapes, validation and rendering. `pg` provides a bounded process-wide pool; transaction context keeps every repository operation on the same checked-out client. Runtime has no SQLite/filesystem database dependency. `better-sqlite3` and its types remain development/migration dependencies only. Existing dependency versions are retained. All database-backed callers await results. Existing domain integer flags and JSON/text/date strings remain unchanged; Better Auth manages native PostgreSQL boolean/timestamptz fields. Camel-case auth columns and `user` are quoted. `rate_limit.reset_at` is BIGINT for epoch milliseconds. Atomic conditional UPSERT preserves concurrent throttle enforcement; ILIKE preserves case-insensitive search. There are no serial/identity columns or sequences to reset.

One pre-existing issue directly blocked migration verification: the login form discarded its auth response through `&& console.log(credentials)`. Only the three response-assignment lines were corrected. No authentication policy or UI redesign was included.

## Requirements and configuration

- Node 22.x, npm, PostgreSQL (verified with 16.15), and an operator-managed database/role.
- Set `DATABASE_URL` privately to a PostgreSQL URL containing the database/user/host and any required TLS options. Never put a live URL in Git, shell history, reports, or command arguments.
- `DATABASE_POOL_MAX` defaults to 5 per process; tune the total across all instances to the provider limit. The pool is reused across requests and development reloads; connections have bounded acquisition and idle timeouts.
- Keep the existing `BETTER_AUTH_SECRET`, auth URL and public URL when moving data. Changing the secret would invalidate existing cookies even though sessions were imported.
- `DATABASE_PATH` is no longer a runtime input. Retain the original value and private environment snapshot for rollback. `.env.local` was intentionally not modified by this task.
- For provider TLS, use its validated connection parameters/CA. No certificate-validation bypass is added.
- Setup commands load the private `.env.local`; deployment environments can securely provision that file or use the underlying `node --import tsx scripts/db-setup.ts` command with environment variables.
- A normal local PostgreSQL installation works; Docker is optional. Create an empty application database and a separate disposable test database using your normal PostgreSQL administration tools, then save their URLs privately. Test commands require `TEST_DATABASE_URL` and never silently fall back to the application URL.

```bash
npm ci
# Save DATABASE_URL and existing auth settings in the private environment first.
npm run setup
# Optional, DEVELOPMENT EMPTY DATABASE ONLY; never seed before importing real data.
npm run db:seed
npm run dev
```

`npm run setup` preserves existing private configuration, creates one if missing, then applies explicit auth/domain migrations. A new file has a blank DATABASE_URL that the operator must fill. `npm run db:setup` is repeatable; request startup does not migrate the schema. Keep migrations an operator job, not a per-request/serverless initialization step.

## Back up before cutover

1. Schedule a deployment-level maintenance/write-freeze window. Stop old app instances and background writers for the **final** backup/import. Do not add dual writes or leave old SQLite and new PostgreSQL instances accepting traffic together.
2. Securely retain the original SQLite main file **and WAL**, previous application release `9942ab9`, lockfile, Node environment, and private environment/secrets. A raw copy of only the main file can omit committed WAL records.
3. Use the SQLite online backup API via this command; choose a **new** destination every time. It opens the source read-only, verifies SQLite integrity and foreign keys, includes WAL records, and verifies the resulting backup. It refuses to overwrite an existing path.

```bash
npm run db:sqlite -- backup /absolute/path/source.sqlite /absolute/private/path/final.sqlite
```

The backup and adjacent `.manifest.json` are private (mode 600). The manifest records source path, creation time, table counts and SHA-256. Copy both off-host to restricted, encrypted storage and verify the copied checksum. The source is never deleted. A failed backup can leave an incomplete destination; it has no verified manifest—retain for diagnosis and retry to a new path, never mistake it for a completed backup.

The local inspection source was backed up successfully to `.data/backups/pre-postgres-2026-10-04.sqlite` with its manifest. Source main-file and WAL hashes remained unchanged. This is a **local** verified backup; it is not evidence of a current production backup.

4. If the intended PostgreSQL target already contains important data, back it up before schema changes. Use libpq service/password files or protected environment inputs, not a password-containing command line:

```bash
pg_dump --format=custom --file=/absolute/private/path/target-before.dump
pg_restore --list /absolute/private/path/target-before.dump
```

Configure libpq privately to select the intended target. Listing the dump is only a structural check; restore into a separate disposable database and compare counts/constraints to verify restorability. Do not restore over a live database. The import below refuses populated application tables; prefer a new dedicated empty database over clearing an existing target. Inspect that target's other schemas/data before running setup. No automatic truncate/drop is part of migration tooling.

## Initialize, import and validate

Install development dependencies on the controlled migration machine because the one-time importer needs SQLite. Runtime-only deployments can use `npm ci --omit=dev` after producing the application build.

1. Point private `DATABASE_URL` at the intended **empty** PostgreSQL target. Apply schema:

```bash
npm run db:setup
```

2. Import the verified final SQLite backup (manifest required):

```bash
npm run db:sqlite -- import /absolute/private/path/final.sqlite
```

3. Verify again before allowing application writes:

```bash
npm run db:sqlite -- verify /absolute/private/path/final.sqlite
```

Import recognizes the current 001-domain schema and exact known tables/columns. It preserves every source ID, email, hash, role, token/session, nullable field, status, JSON string and relationship. Auth dates normalize to the same UTC instant, including legacy millisecond values; auth booleans convert explicitly. Domain values retain their representation. Migration version names must match; target migration application timestamps describe PostgreSQL setup and are not copied from SQLite.

All inserts run in one PostgreSQL transaction with constraints enabled and application tables exclusively locked. **Every table's count and deterministic digest of all columns/rows** is compared before commit, not merely a sample. Digest values and sensitive records are never printed. Primary keys, credential bytes and role values are included in equality checks. Foreign keys are validated both in the source and by PostgreSQL insertion constraints. Output contains only stage/result and counts.

- Failed import: PostgreSQL rolls back all imported rows. Source remains intact. Correct the reported stage's schema/data/connection issue and retry; do not alter the only source copy.
- Successful import: a second import refuses the now-populated target without modifying it. Use `verify` for repeated checks; it is read-only and uses a consistent snapshot.
- Verification failure: keep writes frozen and investigate. Do not cut over. Preserve source/backup/target for comparison.
- Runtime logins and mutations change sessions/data; full equality verification is expected to differ after those writes. Run equality checks immediately before controlled smoke tests.
- Current importer reads each table into memory for deterministic comparison. It is verified for this project's size. Review capacity before using it for a substantially larger external database; do not substitute partial unchecked import batches.

## Cutover and rollback

1. Confirm final write freeze and verified SQLite backup. Confirm PostgreSQL target state/backup and compatible schema.
2. Import and verify; exercise authentication using a designated migrated test account, admin permission checks, ownership denial and critical CRUD in a restricted staging/smoke-test window.
3. Deploy this PostgreSQL-compatible release with DATABASE_URL and preserved auth settings. Route all traffic to that release only after checks pass. Do not run old and new releases as active writers against different databases.
4. Monitor database connection failures, request failures, auth/admin access and critical API results. Keep original SQLite and backups for the **entire operator-approved rollback window**, at minimum until validation and operational acceptance are complete; this tooling never deletes them.

Rollback triggers: mismatched data/IDs/hashes, missing relationships, failed migrated login/admin access, unreliable PostgreSQL connections, critical API failures or any incomplete import.

**Before accepting new PostgreSQL-only writes:** stop the new deployment, restore the previous release `9942ab9` and its original private environment (`DATABASE_PATH`, unchanged auth secret/origins), and reconnect it to the preserved original SQLite database/WAL or a verified consistent SQLite backup. Reopen traffic only to the old deployment. Merely changing DATABASE_URL on the new code does not restore SQLite support; the previous release is required. Preserve the failed PostgreSQL target for diagnosis.

**After accepting PostgreSQL-only writes:** freeze writes first and back up PostgreSQL. Identify/reconcile those new or changed users, sessions and domain records before restoring the old service. There is no automated reverse-import/dual-write feature, and switching straight back would lose new writes. Prefer correcting PostgreSQL in place when that avoids data loss. If a previously populated PostgreSQL target needs restoration, restore its verified dump into a separate replacement database, validate it and change the deployment connection during maintenance; do not blindly overwrite live tables.

## Node/serverless and Vercel

No existing Vercel deployment was found. The implementation uses the Node runtime; `pg` is not an Edge driver. Database requests no longer rely on writable local storage. Seed credentials and backup artifacts remain operator/test-machine files, not production request dependencies.

For Vercel or another serverless host, supply DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL and NEXT_PUBLIC_SITE_URL in the correct environment. Prefer the provider's supported pooled URL for runtime, budget `DATABASE_POOL_MAX` across concurrent function instances, and use a direct/session-compatible connection for setup/import/backup when required by the provider. Keep TLS verification enabled. Deployment must initialize the database before serving traffic. Better Auth performs its native schema checks during build/module initialization, so provide a reachable initialized build/staging database rather than production credentials where possible. This is existing provider behavior, not an added data-generating build step. No vendor-specific service or infrastructure was introduced or deployed.

## Verification commands

With private TEST_DATABASE_URL set to a disposable PostgreSQL database:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Build uses the configured initialized DATABASE_URL; browser tests create their own fresh schema and synthetic fixture accounts, then clean up only their generated schema. Backend/migration tests likewise create/drop unique test schemas. Tests never copy the user's main SQLite database or reuse its passwords. Browser artifacts may contain synthetic credentials and remain ignored under work/. A hard-killed runner can leave its uniquely named `salsal_test_*` schema; verify its origin before manually cleaning it up. See VALIDATION.md for actual executed results and remaining deployment limitations.

## Changed-file audit

All paths below are relative to the repository root. This list includes every final modified/created tracked-source or documentation file; ignored test artifacts are not product changes.

| File | Migration reason |
| --- | --- |
| `.env.example` | Replace runtime SQLite path with private PostgreSQL and test URL/pool configuration. |
| `CHECKPOINT.md` | Point existing handoff to the user-requested migration checkpoint. |
| `CODEX_MIGRATION_CHECKPOINT.md` | Record verified progress, database state and safe continuation action. |
| `POSTGRESQL_MIGRATION.md` | Document inspection, architecture, backup/import/validation/cutover/rollback and this file audit. |
| `README.md` | Correct database setup, testing and deployment instructions. |
| `VALIDATION.md` | Record executed PostgreSQL checks, resolved failures and unverified deployment boundaries. |
| `migrations/001-domain.sql` | Quote auth user references and preserve epoch expiry range with BIGINT. |
| `next.config.ts` | Externalize pg instead of the SQLite runtime driver. |
| `package-lock.json` | Lock required PostgreSQL dependencies and SQLite development placement; synchronize existing Node engine declaration. |
| `package.json` | Add pg/types, retain SQLite only for migration/tests, add transfer command. |
| `playwright.config.ts` | Run synthetic PostgreSQL fixtures with a single shared schema across server/workers and scoped cleanup. |
| `scripts/cleanup-e2e.ts` | Clean up only the generated browser-test schema. |
| `scripts/create-admin.ts` | Await PostgreSQL account lookup/role update, close pool and avoid logging raw driver errors. |
| `scripts/db-setup.ts` | Await domain migrations and close pool; retain native Better Auth setup. |
| `scripts/prepare-e2e.mjs` | Replace main SQLite copy with a fresh isolated PostgreSQL schema. |
| `scripts/seed.ts` | Use awaited PostgreSQL statements/transactions and a separate test credential path. |
| `scripts/setup-env.mjs` | Generate a blank private DATABASE_URL instead of a SQLite path. |
| `scripts/sqlite-transfer.ts` | Verified WAL-safe backup plus atomic empty-target import/full-record validation and read-only verification. |
| `scripts/test-database.ts` | Allocate explicitly configured unique PostgreSQL test schemas. |
| `src/app/[locale]/(public)/blog/[slug]/page.tsx` | Await existing database reads in page/metadata functions; preserve routes and rendered markup. |
| `src/app/[locale]/(public)/blog/page.tsx` | Await existing database reads in page/metadata functions; preserve routes and rendered markup. |
| `src/app/[locale]/(public)/contact/page.tsx` | Await existing database reads in page/metadata functions; preserve routes and rendered markup. |
| `src/app/[locale]/(public)/page.tsx` | Await existing database reads in page/metadata functions; preserve routes and rendered markup. |
| `src/app/[locale]/(public)/portfolio/[slug]/page.tsx` | Await existing database reads in page/metadata functions; preserve routes and rendered markup. |
| `src/app/[locale]/(public)/portfolio/page.tsx` | Await existing database reads in page/metadata functions; preserve routes and rendered markup. |
| `src/app/[locale]/(public)/services/[slug]/page.tsx` | Await existing database reads in page/metadata functions; preserve routes and rendered markup. |
| `src/app/[locale]/(workspace)/admin/[[...section]]/page.tsx` | Await existing database reads in page/metadata functions; preserve routes and rendered markup. |
| `src/app/[locale]/(workspace)/dashboard/[[...section]]/page.tsx` | Await existing database reads in page/metadata functions; preserve routes and rendered markup. |
| `src/app/api/_utils.ts` | Recognize PostgreSQL constraint codes while preserving existing 409 response. |
| `src/app/api/admin/blog/[id]/route.ts` | Await existing repository calls so errors, authorization and JSON responses reflect completed PostgreSQL operations. |
| `src/app/api/admin/blog/route.ts` | Await existing repository calls so errors, authorization and JSON responses reflect completed PostgreSQL operations. |
| `src/app/api/admin/leads/[id]/route.ts` | Await existing repository calls so errors, authorization and JSON responses reflect completed PostgreSQL operations. |
| `src/app/api/admin/leads/route.ts` | Await existing repository calls so errors, authorization and JSON responses reflect completed PostgreSQL operations. |
| `src/app/api/admin/portfolio/[id]/route.ts` | Await existing repository calls so errors, authorization and JSON responses reflect completed PostgreSQL operations. |
| `src/app/api/admin/portfolio/route.ts` | Await existing repository calls so errors, authorization and JSON responses reflect completed PostgreSQL operations. |
| `src/app/api/admin/projects/[id]/deliverables/route.ts` | Await existing repository calls so errors, authorization and JSON responses reflect completed PostgreSQL operations. |
| `src/app/api/admin/projects/[id]/route.ts` | Await existing repository calls so errors, authorization and JSON responses reflect completed PostgreSQL operations. |
| `src/app/api/admin/projects/route.ts` | Await existing repository calls so errors, authorization and JSON responses reflect completed PostgreSQL operations. |
| `src/app/api/admin/services/[id]/route.ts` | Await existing repository calls so errors, authorization and JSON responses reflect completed PostgreSQL operations. |
| `src/app/api/admin/users/[id]/route.ts` | Await existing repository calls so errors, authorization and JSON responses reflect completed PostgreSQL operations. |
| `src/app/api/admin/users/[id]/services/[serviceId]/route.ts` | Await existing repository calls so errors, authorization and JSON responses reflect completed PostgreSQL operations. |
| `src/app/api/admin/users/[id]/services/route.ts` | Await existing repository calls so errors, authorization and JSON responses reflect completed PostgreSQL operations. |
| `src/app/api/admin/users/route.ts` | Await existing repository calls so errors, authorization and JSON responses reflect completed PostgreSQL operations. |
| `src/app/api/deliverables/[id]/route.ts` | Await existing repository calls so errors, authorization and JSON responses reflect completed PostgreSQL operations. |
| `src/app/api/leads/route.ts` | Await existing repository calls so errors, authorization and JSON responses reflect completed PostgreSQL operations. |
| `src/app/api/profile/route.ts` | Await existing repository calls so errors, authorization and JSON responses reflect completed PostgreSQL operations. |
| `src/app/api/projects/[id]/route.ts` | Await existing repository calls so errors, authorization and JSON responses reflect completed PostgreSQL operations. |
| `src/app/sitemap.ts` | Await database-backed sitemap sources. |
| `src/components/dashboard/admin-views.tsx` | Use Awaited repository return types; no rendering changes. |
| `src/components/dashboard/customer-views.tsx` | Use Awaited repository return type; no rendering changes. |
| `src/components/public/auth-form.tsx` | Three-line pre-existing response-discard/logging correction required to verify migrated authentication. |
| `src/components/public/ecosystem.tsx` | Await database service visibility; no markup changes. |
| `src/components/public/footer.tsx` | Await database service visibility; no markup changes. |
| `src/components/public/sections.tsx` | Await database service visibility; no markup changes. |
| `src/lib/authorization.ts` | Await authoritative database role lookup; preserve permission decisions. |
| `src/lib/catalog.ts` | Await service settings while preserving ordering/visibility behavior. |
| `src/lib/db.ts` | Replace synchronous file connection with pg pool/query/transaction and explicit migrations. |
| `src/lib/repository.ts` | Convert raw SQL/parameters/results/transactions and required asynchronous return values. |
| `tests/backend.test.ts` | Run existing security/persistence checks against isolated PostgreSQL and await operations. |
| `tests/e2e.spec.ts` | Use synthetic PostgreSQL credentials/queries and explicitly select a project that has a deliverable. |
| `tests/migration.test.ts` | Verify WAL backup, all-table import/rollback/retry, migrated credentials/sessions, constraints and concurrent counters. |

Reviewed the final git diff. Changes are limited to PostgreSQL migration/configuration, safe data transfer/recovery, verification, and the explicitly documented three-line authentication verification blocker. No intentional design, CSS, Tailwind, layout, typography, animation, responsiveness, product-feature or unrelated architecture changes were introduced.
