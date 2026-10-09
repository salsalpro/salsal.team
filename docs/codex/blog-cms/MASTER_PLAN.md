# Blog CMS master plan
Scope: existing article CMS only; preserve dashboard/site identity, Better Auth, all unrelated business logic, and every legacy language version. No production writes/deployments/commits.

## Verified baseline — 2026-10-09
Repository /home/salsal/Desktop/salsal.team, main, HEAD 546cc124b431f1718f2c91db558d9921073c2e2f; initially clean. Previous PostgreSQL migration is committed. Three local articles, all bilingual; only 001-domain.sql applied. Local activation recovery manifest exists; saved local PostgreSQL cluster started successfully. No Blob token configured. No production database accessed or backup status verified.
- blog-editor.tsx: paired required textareas, cover path only; no installed rich editor or upload implementation. Verified upload root cause: absent workflow, API, and storage integration; cover validator rejects everything outside /images/.
- repository.ts/domain.ts/validation.ts: localized JSON strings, global slug uniqueness, integer published flag, author display name, plain paragraph/## content.
- admin/blog APIs: existing backend role check and origin validation, JSON error envelope. Reuse them.
- public blog/[slug]: plain rendering; metadata and sitemap advertise both languages unconditionally; no social overrides or editorial checks.
- Tests: Node integration, isolated PostgreSQL schemas, Playwright, lint/typecheck/build. Existing migration importer intentionally supports original schema only.

## Minimal implementation and phases
1 Inspection/checkpoints; 2 decisions and safety plan; 3 additive article fields, validation and transactional persistence; 4 validated durable Blob uploads; 5 Tiptap editor + safe JSON renderer; 6 primary-language and legacy bilingual editing; 7 SEO resolution/metadata/sitemap; 8 admin filters/feedback; 9 public compatibility; 10 verification/docs.
Add nullable primary_language and JSONB editorial data (per-language documents, media text, tags and SEO; shared publication state). Keep original localized text fields for legacy compatibility, preserving unedited translation. No rewrite/backfill of existing content. Slug indexes reserve both locales for legacy rows and one for single-language rows. All public lookups require exact slug, locale and published flag; admin lookups by ID remain supported.
Tiptap is necessary: current textarea cannot satisfy formatted paste/tables/undo/structured editing. Use StarterKit, Image and TableKit only. Render allowlisted JSON as React elements, never stored HTML. Keep plain legacy fallback.
Storage: server-validated raster images decoded/re-encoded with sharp, private Blob store, authenticated preview URLs; public retrieval only for images referenced by a published article. This avoids leaking draft media. Token configuration blocks provider verification, not independent work. No runtime filesystem persistence.

## Verification and acceptance
All editable fields: input → validation → API → DB → fresh read → editor/public output. Node integration tests: two-language persistence, legacy preservation, duplicate slugs, publication, XSS/URL rejection, authorization, upload bounds. Playwright: real writing/save/reload/edit/preview and output; existing regression suite. lint/types/build/diff. Record unavailable provider/production checks honestly.

## Safety / rollout / rollback
Author 002 only; never rewrite 001. Apply first in isolated schemas; local app migration only after backup. No production migration without reviewed recovery and approval. Unique indexes replace global slug constraint; older application rollback is ambiguous if two new single-language records share a slug: resolve collisions before rollback. Keep added columns and media on rollback; never drop language data or delete Blob objects automatically. Deploy migration before new code with controlled write freeze; old app must not write new-model records. Configure BLOB_READ_WRITE_TOKEN in intended environments before provider testing. Production backup/TLS/provider verification remain unverified.
Definition of Done: all mandatory editor/media/language/publishing/SEO/security/persistence scenarios verified; blocked external verification prevents COMPLETE.


## Editable-field verification map
| Inputs / derived values | Validation and persistence | Fresh-read output / evidence |
|---|---|---|
| title, slug, excerpt, category, author | blogSchema, validateArticle, original blog_post columns | Node both-language round trips; browser form reload/public title/excerpt; duplicates return 409 |
| rich body, headings/marks/lists/quotes/code/tables/links | bounded richDocumentSchema → editorial[locale].document plus readable original content | browser clipboard → preview → save → reload → edit → reload → safe public React renderer; toolbar test |
| language auto/manual, legacy language toggle | primary_language nullable; editorial.languageMode; legacy cannot drop a version | language detection/override/directions and bilingual legacy browser/Node checks |
| tags | per-language editorial.tags; trimmed/deduplicated/bounded | existing-taxonomy choices, browser reload, public tags; Node round trip |
| featured cover path, alt/caption; inline image src/alt/caption | articleImageSchema / strict image node; uploaded UUID must exist in blog_image | Node serialization/authorization/renderer checks PASS; actual uploaded image browser cycle BLOCKED |
| SEO title/description | existing localized seo_title / seo_description, optional empty defaults | browser persisted metadata, shared search preview resolver, Node round trip |
| focus/secondary keyphrases | bounded editorial fields | browser reload, Node round trip, optional checks only (no ranking claims) |
| canonical | validated HTTP(S) URL or empty fallback | shared editor/public resolver, browser canonical/metadata and Node override behavior |
| noindex, sitemap inclusion | per-locale booleans | browser robots and sitemap inclusion/exclusion; Node checks |
| Open Graph and Twitter/X title/description/image | bounded strings / safe article image refs | browser text metadata + Node all-field round trip; actual uploaded social-image retrieval BLOCKED |
| draft/published/unpublished, created/updated/first-published dates | server-managed timestamps, editorial.unpublished, published; expectedUpdatedAt stale-save guard | browser public 200/404, status filters/confirmed delete; Node concurrency/date retention |
| reading time, SEO suggestions, previews | derived from readable text / effectiveArticleSeo, not separate saved truth | language/reading Node check; browser preview/direction/content |

## Operational rollout and recovery
1. Configure a **private** Vercel Blob store and BLOB_READ_WRITE_TOKEN privately for each intended environment. Never expose the token via NEXT_PUBLIC_*, source, chat, or logs. No token has been supplied; no real provider object has been uploaded by this session.
2. Complete CMS-04-02 and CMS-05-02 on isolated article data with authorized test storage: PNG/JPEG/WebP upload → preview → draft save → reload → edit/save/reload in both languages; featured replacement/removal, inline alt/caption, social-image refs, restart durability, published anonymous retrieval and unpublish denial. Preserve objects, including unreferenced uploads. Negative-path tests do not prove this lifecycle.
3. Before production: obtain explicit migration/deployment authorization, verify a current production backup and usable restore point, review 002 SQL against actual schema, coordinate a write freeze, apply 002 before new application code, verify both locales and image lifecycle, then release writes. No production inspection, backup, migration, deployment, or provider environment has been verified here.
4. The existing SQLite transfer utility deliberately targets **001 only**. If a transfer is still needed elsewhere, use the pre-CMS baseline release 546cc124b431f1718f2c91db558d9921073c2e2f and its reviewed migration runbook to complete transfer first, then apply 002. Do not bypass target guards, reset data, or run that importer against the expanded schema. The local transfer is already complete; do not re-import.
5. Local 002 was applied after a private full pg_dump and pg_restore --list catalog check. Every original field of all three bilingual articles compared unchanged. Recovery manifest: .data/blog-cms-upgrade.json; backup under .data/backups. Catalog readability is verified; full restore NOT_RUN. Do not restore over current writes casually.
6. Prefer fixing forward. For a necessary code rollback, first preserve the complete current diff and review a prior build. Retain additive columns, structured documents, and media. Check `SELECT slug,count(*) FROM blog_post GROUP BY slug HAVING count(*)>1` before running older code: locale-specific duplicate slugs are ambiguous to its lookup. Older code cannot edit the rich model safely; freeze editorial writes. Never automatically down-migrate, drop columns/tables, delete objects, or overwrite post-migration data from an old backup. A restored recovery point needs an approved plan for writes since that point.

## Known operational limits
- Storage provider verification is blocked on configuration. Durable images are required for full completion; no filesystem/base64/fake-success substitute was added.
- Blob put and database insert are separate systems. If insertion fails after upload, an unreferenced private object can remain. This implementation intentionally retains objects and has no automatic garbage collection.
- Unsaved edits are guarded for document links and full-page unload. Browser SPA history/back behavior is not a universal navigation blocker; no autosave exists.
- Taxonomy suggestions use up to 500 recent articles; the existing admin listing is bounded (100 default), without a new pagination platform. Sitemap and image-reference authorization are unbounded where completeness matters.
- Native prompt is used for links; native confirm for deletion/unsaved links, retaining the project's lightweight feedback style.
- Pre-existing Next “destination stream closed early” messages occur during rapid navigation; no framework/auth rewrite is included.

## Complete changed-file inventory
Paths relative to /home/salsal/Desktop/salsal.team. All tracked feature edits and new files are listed; ignored runtime/test artifacts are not delivery source. next-env.d.ts is generated and has returned to its baseline dev reference.

| File | Why needed |
|---|---|
| `.env.example` | Documents the private Blob token; no secret values. |
| `CHECKPOINT.md` | Points continuation to the current CMS checkpoint and disambiguates historical migration status. |
| `docs/codex/blog-cms/CHECKPOINT.md` | Current implementation, commands, limits and unfinished work. |
| `docs/codex/blog-cms/DECISIONS.md` | Evidence and reasons for implementation/scope choices. |
| `docs/codex/blog-cms/MASTER_PLAN.md` | Architecture, field coverage, full file inventory and safe rollout/recovery plan. |
| `docs/codex/blog-cms/RESUME.md` | Exact next-session starting point without rebuilding. |
| `docs/codex/blog-cms/TASKS.md` | Dependency-aware task IDs with verified/blocking status. |
| `docs/codex/blog-cms/TEST_RESULTS.md` | Actual checks, historical failures/fixes and external verification gaps. |
| `migrations/002-blog-cms.sql` | Additive editorial/language/media schema and locale uniqueness; legacy rows preserved. |
| `package-lock.json` | Locks only necessary new dependency graph; existing versions preserved. |
| `package.json` | Pins compatible Tiptap editor extensions, Blob SDK and direct sharp dependency. |
| `playwright.config.ts` | Aligns isolated test authentication origin with server port 3100; production auth unchanged. |
| `src/app/[locale]/(public)/blog/[slug]/page.tsx` | Uses exact published locale, structured body, media text, SEO and JSON-LD in existing template. |
| `src/app/[locale]/(public)/blog/page.tsx` | Filters articles to the requested language. |
| `src/app/[locale]/(public)/page.tsx` | Adds language to the existing homepage article query only. |
| `src/app/[locale]/(workspace)/admin/[[...section]]/page.tsx` | Supplies article taxonomy and filters; keys editor by article identity. |
| `src/app/api/admin/blog/[id]/route.ts` | Returns article-specific locale-slug conflict message on update. |
| `src/app/api/admin/blog/images/route.ts` | Admin/origin-protected bounded raster upload to private Blob and media record. |
| `src/app/api/admin/blog/route.ts` | Returns article-specific locale-slug conflict message on create. |
| `src/app/api/blog-images/[id]/route.ts` | Authorizes private draft previews or published image references; no-store retrieval. |
| `src/app/sitemap.ts` | Uses eligible published language versions, indexing flags and canonical rules for articles. |
| `src/components/dashboard/admin-views.tsx` | Adds article search/language/status filters and correct article titles/public links. |
| `src/components/dashboard/article-image-upload.tsx` | Existing-style file control with loading and actionable error feedback. |
| `src/components/dashboard/article-rich-editor.tsx` | Tiptap toolbar/paste/tables/images, safe URLs, RTL/LTR and initialization readiness. |
| `src/components/dashboard/article-seo-fields.tsx` | Persisted article metadata fields, derived previews and optional suggestions. |
| `src/components/dashboard/blog-editor.tsx` | Continues existing form with language, rich content, media, SEO, preview and safe save/delete state. |
| `src/components/dashboard/forms.tsx` | Adds opt-in article success callback/server feedback; unrelated callers retain behavior. |
| `src/components/public/article-body.tsx` | Renders allowlisted document JSON as escaped React elements; legacy text fallback. |
| `src/components/public/content-cards.tsx` | Suppresses unavailable-language article cards only. |
| `src/components/public/locale-switch.tsx` | Article detail switch uses real alternate or target blog listing; other routes unchanged. |
| `src/content/article-messages.ts` | Persian and English editor labels/help/feedback. |
| `src/content/dashboard-messages.ts` | Adds unpublished article status label in both locales. |
| `src/content/fixtures.ts` | Updates article seed type for optional CMS defaults; seed values unchanged. |
| `src/lib/api-error.ts` | Holds unchanged error class without importing auth/session bootstrap into persistence. |
| `src/lib/article-content.ts` | Strict document/media/metadata schemas, readable text and language detection. |
| `src/lib/article-seo.ts` | One resolver for previews, metadata, canonical/hreflang, JSON-LD, sitemap and reading time. |
| `src/lib/article-upload.ts` | Bounds multipart body and verifies/re-encodes actual raster pixels. |
| `src/lib/authorization.ts` | Re-exports the same error class; access checks/roles/authentication unchanged. |
| `src/lib/domain.ts` | Types primary language and editorial data on BlogPost. |
| `src/lib/repository.ts` | Transactional article validation/persistence, locale lookups, filters/taxonomy and published image references. |
| `src/lib/validation.ts` | Article-only bounded schemas and optional optimistic version; other schemas preserved. |
| `src/styles/dashboard.css` | Appends article-only controls/editor/preview rules using workspace tokens. |
| `src/styles/globals.css` | Appends rich-article media/table/code rules, preserving existing prose defaults. |
| `tests/backend.test.ts` | Tracks the second repeatable migration. |
| `tests/blog-cms.test.ts` | Both-language persistence, legacy retention, authorization, media validation/privacy and SEO/rendering integration. |
| `tests/e2e.spec.ts` | Real rich writing/reload/publish/SEO, toolbar, legacy and responsive browser regressions. |
| `tests/migration.test.ts` | Keeps existing SQLite importer tests on their supported pre-CMS 001 target. |


## Ignored local configuration and generated artifacts
- `.env.local`: only the local BETTER_AUTH_URL scheme corrected to the existing localhost HTTP origin, required to initialize authentication for the CMS. Private credentials, database URL and all other settings preserved; not committed or printed.
- `work/cms-file-inventory.py`: one-time audit that checks every changed/new delivery path has a documented reason; ignored, not application runtime.
- `work/apply-local-blog-cms.mjs`: one-time local-only backup/migration/hash-verification helper with loopback55433 guard; do not rerun/import/reset blindly. `work/verify-build.mjs`: existing isolated build helper used for verification, not a production migration tool.
- `work/screenshots/`, `work/test-results/`, `work/playwright-report/`, `.next/`, test cluster work/postgres/, local PostgreSQL files and private backups under .data/: generated runtime/verification material, not delivery source. No generated binaries, credentials, database dumps or reports added to Git.
