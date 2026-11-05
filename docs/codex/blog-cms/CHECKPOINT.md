# Checkpoint — 2026-10-09

## Manual repair handoff — 2026-10-09 (latest)

User requested exact manual steps as an alternative to connecting the agent. Prepared **NEON_MANUAL_REPAIR.md** (Persian console instructions) and **NEON_MANUAL_REPAIR.sql** (unchanged repository002 SQL wrapped in an atomic transaction, advisory/table locks, timeout, baseline/partial-schema guards, migration tracking and original-article count/fingerprint preservation). Existing migrations/002-blog-cms.sql and all application code are unchanged.

Four isolated tests on the dedicated synthetic PostgreSQL55432 passed: full migration with bilingual legacy-field preservation and locale uniqueness; repeat execution stops; partial schema stops without additional changes; forced failure after DDL rolls back columns/indexes/constraint/history. Test harness: /tmp/salsal-verify-neon-manual-repair.mjs, generated disposable schemas cleaned. No main local or online data mutated. Local tests do not verify actual Neon state.

Next: user follows manual guide to identify the correct production target, preserve an untouched schema+data recovery branch, create a separate test branch, run the whole SQL there, then run it on the production branch only after test/recovery checks. No new push/deployment or DATABASE_URL change is needed for applying this schema migration to the current app. If any STOP/error occurs, roll back and inspect the non-secret message; never remove guards. Actual online execution, backup availability and live recovery remain UNVERIFIED. Agent browser denial remains in force; manual user actions do not authorize bypassing it.

Changed in this milestone: two new manual runbook/SQL files plus these six CMS checkpoint documents and root CHECKPOINT.md. No new dependency, application changes, commits, deployments or production writes. If user supplies execution results, start by reading schema/history and runtime logs; do not assume migration succeeded from the absence of a reply.


## Production incident — 2026-10-09 (current priority)

The production incident below supersedes the earlier local-only handoff. Preserve completed CMS implementation; do not rebuild. The owner committed/pushed CMS as `cad5a71b9b7e5af0b71f15df10ee149893f3a25e`; the agent did not commit, push or deploy. Selected target is Vercel project **salsal.team**, https://salsalteam.vercel.app, project `prj_twXMHNdZceowKiYLDqbXtVc25W0K`, team `team_NLOmqjIG8zKKOkCpaXmttaQq`. Its CMS deployment `dpl_6BcA3ZE2dZ9gs1NfUyp5TCJaNnWG` reached READY, but `/fa` fails with HTTP500.

**Confirmed Vercel runtime error:** `column "primary_language" does not exist`, PostgreSQL `42703`, error digest `2366591631`. The deployed application queries that column when listing home-page articles. React441 is the production Server Components error wrapper. The deployed database is missing at least this required column; the full schema/migration history is not yet inspected. Do not assume all of002 is absent or blindly rerun partially applied SQL.

User explicitly said **Leave the deployment running**, then requested a repair. No cancellation/rollback, production schema write, environment change, seed/import or data replacement was performed. Neon connection is still missing: integration search returned installed=false; no NEON_API_KEY or saved Neon CLI configuration exists. Attempt to open console.neon.tech was denied by browser security policy, reported as user permission declined. Do not retry that browser action through another surface or extract credentials through alternate channels. A separately authorized Neon integration connection is needed before database work can continue.

Vercel DATABASE_URL exists as a sensitive metadata entry scoped to production and preview; its value was unavailable from the official API. Effective Neon project/branch/database and preview isolation remain unverified. Do not change that URL to localhost. No production backup or restore point has been verified. Local002 verification does not prove online readiness.

### Exact next steps

1. Have the user install/connect the previously suggested Neon integration using their existing account; never request a connection string or password in chat. Confirm that connection before using its tools. Browser access was denied and cannot be bypassed.
2. Match the Neon production project/branch/database to the selected Vercel target. Inspect blog_post columns, constraints/indexes, blog_image and schema_migration in a READ ONLY transaction. Check actual migration history only after confirming its table exists. Read-only SQL draft: /tmp/salsal-cms-online-read-only-preflight.sql (temporary; review before executing).
3. Review migrations/002-blog-cms.sql against the actual schema. It adds primary_language/editorial, locale unique indexes and blog_image while preserving legacy fields. If the online schema is partially modified, prepare a specifically reviewed forward repair instead of blindly rerunning002. Preserve records, identifiers, bilingual content and online credentials.
4. Verify a usable production recovery point and test the exact migration on an isolated Neon branch; verify preview is bound to that branch before any test writes. Compare original article fields before/after and validate both locales. No local-to-production import, reset, seed, destructive down migration or SQLite transfer.
5. Present the exact production migration action, isolation/test evidence and recovery strategy for approval required by the original execution brief. Do not ask for approval of speculative SQL. Apply only the approved action, then verify /fa and /en, blog/legacy pages, auth/admin access and absence of the runtime SQL error. Existing code does not auto-migrate on request startup. npm run db:setup also runs auth migrations and must not be used blindly as an incident fix.
6. After restoring the site, resume CMS-04-02/CMS-05-02 real private Blob lifecycle verification. Existing editor/language/SEO/public features and their local passing tests must be preserved. Do not treat deployment READY or serialized image references as provider verification.

### This milestone: changed files and checks

Documentation only; no application, SQL migration, dependency, private env or Git config changes:

- CHECKPOINT.md: routes continuation to the confirmed production incident.
- docs/codex/blog-cms/CHECKPOINT.md: root cause, current blocker, exact next steps and file inventory.
- docs/codex/blog-cms/RESUME.md: starts the next session at Neon access/schema inspection.
- docs/codex/blog-cms/TASKS.md: distinguishes completed runtime diagnosis from blocked repair.
- docs/codex/blog-cms/MASTER_PLAN.md: records current deployment/schema prerequisite and safe repair order.
- docs/codex/blog-cms/DECISIONS.md: records evidence, leave-running instruction and denied browser access.
- docs/codex/blog-cms/TEST_RESULTS.md: records actual production SQL error separately from historical local passing suites.

Read-only Vercel log retrieval succeeded using existing authenticated CLI access. Production migration, recovery verification and post-repair checks are NOT_RUN. Historical local Node26/26, Playwright13/13, publication stress5/5, lint/typecheck/build passes remain historical; they were not rerun for this documentation-only milestone. Run git diff --check and confirm only these seven documentation files changed. No secrets included.

## Earlier local implementation handoff (historical)

## Current state
Repository **/home/salsal/Desktop/salsal.team**, branch main, baseline HEAD **546cc124b431f1718f2c91db558d9921073c2e2f**. Initially clean; all listed current edits are the CMS upgrade. No commit/push/production migration/deployment performed. Overall **PARTIALLY_COMPLETE** because mandatory real-storage/media tests need configuration.

Completed implementation: additive article persistence, strict rich JSON validation/rendering, Tiptap editor, bilingual labels, new primary-language workflow plus legacy bilingual editing, category/tag reuse, image upload/private proxy, media captions/alt fields, SEO metadata/previews/JSON-LD/sitemap/robots, filters, draft/publish/unpublish, unsaved link/unload warnings and stale-save guard. Existing auth/roles/site/dashboard identity retained. All 47 delivery source/config/checkpoint files, plus the ignored local environment correction and audit artifacts, are described in MASTER_PLAN.md; no hidden source changes outside that inventory.

Last completed task CMS-10-01: final local checks/handoff completed. Current and earliest unfinished task CMS-04-02 BLOCKED: BLOB_READ_WRITE_TOKEN missing. CMS-05-02 and CMS-10-02 depend on it. Last verified feature task CMS-09-01. No production access/configuration has been verified.

## Verified and fixed
- Final Node **26/26 PASS**, lint PASS, typecheck PASS, isolated production build PASS.
- Rich Persian/English clipboard → preview → save → reload → edit → save → reload → public metadata/rendering cycles PASS; toolbar and legacy/unsaved/invalid upload scenarios PASS in earlier full runs.
- Basic publication intermittent failure resolved by article-only initialization gate. Trace showed selectOption completed before the React handler mounted (no onChange event); onCreate now enables controls. Functional body patches preserve current other edits; record key prevents wrong-article state reuse. Final targeted stress **5/5 PASS**. Final full suite **13/13 PASS**.
- Formatted paste previously rejected because actual Tiptap link JSON includes title:null. Bounded title allowed and escaped; rich JSON/browser regression PASS. Temporary diagnostics removed.
- Screenshots of both language editors inspected. Responsive no-overflow assertions at 320/768/1024/1440px.

## Data and runtime safety
- Saved application PostgreSQL: .data/postgres-local, 127.0.0.1:55433; private .env.local configured. Three original bilingual articles preserved.
- Separate synthetic tests: work/postgres/data, 127.0.0.1:55432. All Node/browser/build fixtures use disposable schemas there; never main data.
- 002-blog-cms.sql applied locally after private full pg_dump and pg_restore --list catalog check. All original fields of all three legacy articles SHA-compared identical before/after. Private recovery manifest .data/blog-cms-upgrade.json and .data/backups. Full restore NOT_RUN. Production NOT_TOUCHED.
- Original SQLite/WAL/backups retained. Existing transfer utility only supports 001; never run it against expanded schema or bypass its guards. Local transfer already completed.
- No Blob token/provider object configured/uploaded. Validation/auth/privacy/503 tests PASS; actual durable provider upload/get remains BLOCKED, not mocked as passed.

## Final local runtime
Dev is running at http://localhost:3000 (listens127.0.0.1). /fa, /fa/contact and six legacy article locale URLs verified200. Local private BETTER_AUTH_URL had a missing scheme; corrected only that ignored setting to the existing localhost HTTP origin because it blocked CMS auth bootstrap. Auth source, secrets, roles and other environment settings preserved. get-session now200; anonymous admin response streams a login redirect and contains no article form. No owner account created/promoted or private credentials used. Main counts remain3 articles,3 legacy bilingual,2 migrations. next-env.d.ts is unchanged against baseline.

## Exact next actions
1. Configure a private Blob store/token in the intended local/preview environment without exposing it. Recheck only presence; never print credentials. Current value still missing.
2. Continue CMS-04-02 and CMS-05-02 with isolated article data: actual upload → draft preview/save/reload → featured replace/remove, inline alt/caption → second reload → publish/public retrieval → unpublish/private denial → restart/retrieval, both languages. Include social-image references. Do not mark passed from existing serialization/security tests.
3. Reconcile checkpoint statuses and only mark COMPLETE after mandatory provider/media scenarios pass. Keep production migration/deployment gated on explicit authorization and reviewed recoverability; no destructive cleanup.

## Commands and limits
Use Node22 project npm scripts. For tests set TEST_DATABASE_URL to the dedicated test PostgreSQL URL (synthetic salsal_test role on port55432/postgres). Build helper work/verify-build.mjs creates/disposes an initialized isolated schema; use NEXT_PUBLIC_SITE_URL=http://localhost:3100 for production browser test build. Never build concurrently with dev server; do not reset/import/seed main DB. Do not print private environment/credentials/backups. Native link prompt/confirm retained; SPA browser back is not universally guarded. Unreferenced private objects intentionally retained, no GC. Pre-existing Next stream-closed warnings during rapid navigation remain; no framework rewrite included.
