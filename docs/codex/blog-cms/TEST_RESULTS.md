# Test results — 2026-10-09

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

| Production check | Result / evidence |
|---|---|
| CMS deployment | READY, commit cad5a71; build success did not prove runtime health |
| /fa request | FAIL: HTTP500 |
| Runtime SQL diagnosis | CONFIRMED: missing primary_language; code42703; digest2366591631 |
| Actual Neon schema/history/recovery | NOT_RUN: no connected access |
| Production migration/post-repair verification | NOT_RUN |
| Browser Neon access | DENIED: security policy reported user permission declined; no bypass attempted |

No production data was modified. Local tests below establish local implementation only; original NOT_RUN production statements describe the earlier local stopping point, not the later log inspection.

## Earlier local implementation handoff (historical)

## Final verified result

| Check | Result | Environment / evidence |
|---|---|---|
| Repository architecture/baseline inspection | PASS | clean initial main at 546cc124b431f1718f2c91db558d9921073c2e2f; 3 bilingual articles |
| Node integration/unit suite | **26/26 PASS**, 0 failures/skips | final npm test, isolated schemas on dedicated synthetic PostgreSQL 55432; includes original regression tests and 9 CMS tests |
| Full Playwright suite | **13/13 PASS**, 0 failures | final npm run test:e2e, isolated schema/seeded synthetic accounts; 1.1m |
| Immediate navigation / publish stress | **5/5 PASS** | same genuine browser flow repeated with distinct records, asserted PATCH status/result |
| ESLint | PASS | final npm run lint |
| Typecheck | PASS | final npm run typecheck |
| Production build | PASS | isolated initialized build schema; NEXT_PUBLIC_SITE_URL=http://localhost:3100 |
| Git diff whitespace / scope audit | PASS | git diff --check; homepage only article-query language filter; unrelated formatting hunks removed; generated next-env.d.ts restored by dev |
| Existing dependency versions | PASS | no pre-existing installed dependency versions changed; Tiptap/Blob/direct sharp additions pinned |
| Both-language editor visual review | PASS | work/screenshots/cms-fa-editor.png and cms-en-editor.png inspected; same workspace identity |
| Responsive editor checks | PASS | page overflow asserted at 320/768/1024/1440px, both content languages |
| Local migration legacy preservation | PASS | full private pg_dump + catalog check; original fields of all 3 bilingual articles hash-identical after 002 |
| Local saved app runtime | PASS | dev on port3000; /fa, /fa/contact and all 6 legacy language article URLs return200; saved DB still 3/3 legacy records and 2 migrations |
| Local auth bootstrap / admin protection | PASS | corrected missing scheme in private local auth URL; get-session200; anonymous admin HTML redirects to /fa/login and contains no article form |
| Full backup restore | NOT_RUN | pg_restore catalog readability verified; actual restoration not performed |
| Real Blob upload/get/durability | **BLOCKED** | missing private BLOB_READ_WRITE_TOKEN; no provider success simulated/claimed |
| Real featured/inline/social image browser cycle | **BLOCKED** | depends on configured private provider; serialized image refs and negative paths do not prove retrieval |
| Preview/production environment verification | NOT_RUN | no configured preview/provider or production authorization; production not touched |

## What the tests actually establish
- CMS Node round trip compares submitted metadata to fresh database reads for both languages, every editorial key and original title/slug/excerpt/category/author/cover/SEO fields. Editing, publication, timestamps, stale saves, locale duplicates and legacy claims are checked.
- Actual clipboard HTML enters Tiptap and validates as the server document type, then preview/save/reload/edit/save/reload/public output is checked for Persian and English. Formats include headings, bold/italic/underline/strike, links, lists, quote, code, separator and table. A separate toolbar scenario exercises H1–H6, marks, table row/column insertion/deletion, links and undo/redo.
- Public metadata assertions cover saved description, OG/X titles, JSON-LD language, real alternates, correct-locale URLs, noindex, sitemap removal and unpublish404. Node tests cover canonical overrides, all social fields, safe rendering and sitemap eligibility.
- Legacy editor toggles languages without dropping the other version; unsaved internal navigation can be dismissed. Wrong MIME/decoded raster, oversized input, cross-origin and non-admin uploads are denied. Actual pixel decoding/re-encoding uses sharp in Node tests.
- Media reference authorization is tested without accessing the provider: only typed published references authorize public access; mentioning a URL in prose does not. Draft/removed references remain private. Synthetic /images/test.webp asserts serialization, not file existence/delivery.
- Original browser regressions cover both public locales, navigation, contact loading/success/error, signup/default roles, ownership isolation, customer/profile/private downloads/signout, admin users/projects/services/assignments/deliverables/portfolio and sign-in error feedback.

## Reproduction
Run from /home/salsal/Desktop/salsal.team with Node22 and project dependencies. Set TEST_DATABASE_URL to the **dedicated test database**, never the saved application/production database. Current synthetic cluster is loopback port55432, role salsal_test, database postgres. Test helpers create/drop individual schemas; seeding is confined to those schemas.

1. npm run lint
2. npm run typecheck
3. TEST_DATABASE_URL=… npm test
4. NEXT_PUBLIC_SITE_URL=http://localhost:3100 TEST_DATABASE_URL=… node --import tsx work/verify-build.mjs (ignored existing build helper initializes/disposes its own schema)
5. TEST_DATABASE_URL=… npm run test:e2e
6. Optional publication stress: same Playwright command with --grep 'admin routes, user search' --repeat-each=5

Do not run build concurrently with the final dev server. Build artifacts for e2e use the port3100 public URL; do not deploy that build. Final dev is running against private .env.local on port3000.

## Investigation history (resolved, not current failures)
- Initial browser auth origin mismatch (3000 config vs3100 server) denied writes. Corrected only Playwright test env; auth code preserved.
- Wrapped select/file labels included nested content; explicit article aria-labels fixed exact accessible names.
- Tiptap link title:null was rejected by strict schema, causing plaintext preview. Allowlisted bounded title, escaped renderer support and actual clipboard regression fixed it.
- Toolbar assertions overconstrained empty trailing headings and grouped undo history; corrected locator and separated native history groups.
- Full run initially12/13: published select was accepted before its client handler mounted, then reset to draft. Trace confirmed no onChange event. Article-only onCreate readiness gate fixed it; latest-state document patches and per-record key also protect edits. Subsequent5/5 stress and13/13 full suite PASS.
- Earlier stress attempts reused slugs/titles and produced test-data conflicts after a failure; distinct repeat records and cleanup fixed isolation. Temporary diagnostic console statements removed.
- Pre-existing Next “destination stream closed early” server messages during rapid navigation and NO_COLOR warnings remain. Browser page-error/hydration checks pass. No unrelated framework modification was made to suppress them.
