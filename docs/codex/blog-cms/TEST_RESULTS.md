# Test results — 2026-10-09

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
