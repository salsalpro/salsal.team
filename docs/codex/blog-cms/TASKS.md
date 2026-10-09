# Tasks — 2026-10-09

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
