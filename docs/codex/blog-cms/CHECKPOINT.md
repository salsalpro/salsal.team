# Checkpoint — 2026-10-09

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
