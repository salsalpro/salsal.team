# Tasks — 2026-10-09

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

| ID | Description | Status | Evidence / next dependency |
|---|---|---|---|
| CMS-10-03 | Diagnose production HTTP500 | COMPLETED | Vercel runtime confirms missing primary_language, code42703 |
| CMS-10-04 | Inspect Neon and restore schema compatibility | BLOCKED | user-connected Neon access, actual schema/history, verified recovery, isolated migration test and approved production action required |

Current priority is CMS-10-04; provider tests CMS-04-02/CMS-05-02 remain blocked and follow the production incident. Earlier task IDs/statuses below are retained as implementation history.

## Earlier local implementation handoff (historical)

The implementation and local verification can complete independently of provider/production readiness. Mandatory real-media verification remains blocked; overall delivery is PARTIALLY_COMPLETE until it passes. Existing IDs retained; dependent provider checks split explicitly.

| ID | Phase | Description | Dependencies | Status | Acceptance / verification |
|---|---|---|---|---|---|
| CMS-01-01 | 1 | Inspect architecture and preserve baseline | none | COMPLETED | clean starting Git state; existing article/schema/storage/auth/SEO paths inspected |
| CMS-02-01 | 2 | Record minimal plan and decisions | CMS-01-01 | COMPLETED | six checkpoints, additive data plan and scope exceptions documented |
| CMS-03-01 | 3 | Compatible fields, validation, persistence | CMS-02-01 | COMPLETED | both-language round trips, unchanged legacy rows, locale conflicts, stale-save protection |
| CMS-04-01 | 4 | Implement secure upload and retrieval | CMS-03-01 | COMPLETED | raster decode/re-encode, bounds, role/origin checks, reference privacy and missing-config tests PASS |
| CMS-04-02 | 4 | Verify real durable private storage | CMS-04-01 | BLOCKED | requires private BLOB_READ_WRITE_TOKEN; provider upload/get/restart/public/unpublish lifecycle not run |
| CMS-05-01 | 5 | Structured editor and safe renderer | CMS-03-01 | COMPLETED | real clipboard rich content, toolbar, tables/links/code/lists, undo/redo and preview/reload PASS |
| CMS-05-02 | 5 | Verify uploaded featured/inline media in browser | CMS-04-02,CMS-05-01 | BLOCKED | actual image upload/edit/replace/remove/alt/caption/save/reload in both languages required |
| CMS-06-01 | 6 | Primary language and legacy editing | CMS-05-01 | COMPLETED | auto detection/manual override/RTL/LTR, bilingual legacy toggle/preservation PASS |
| CMS-07-01 | 7 | SEO/JSON-LD/sitemap/previews/checks | CMS-03-01 | COMPLETED | persisted fields, actual browser metadata/indexing/sitemap and Node resolver tests PASS; real uploaded social-image retrieval depends on CMS-04-02 |
| CMS-08-01 | 8 | Admin filters and publication workflows | CMS-06-01 | COMPLETED | create/save/publish/unpublish/filters/delete; fast navigation publication 5/5 stress runs PASS |
| CMS-09-01 | 9 | Public rendering and compatibility | CMS-07-01 | COMPLETED | both rich-language public pages and legacy/public/auth regression scenarios PASS; provider media covered separately |
| CMS-10-01 | 10 | Final local checks and continuation documents | CMS-08-01,CMS-09-01 | COMPLETED | final browser13/13, Node26/26, lint/typecheck/build/diff PASS; saved local runtime verified; inventory and rollout recorded |
| CMS-10-02 | 10 | Provider preview and production readiness | CMS-04-02,CMS-05-02,CMS-10-01 | BLOCKED | real configured storage, approved production backup/migration/deployment verification required |

Earliest unfinished task: CMS-04-02. Current task: CMS-04-02 (BLOCKED); local handoff task CMS-10-01 completed. Do not mark blocked image tasks complete based on serialization or negative-path tests.
