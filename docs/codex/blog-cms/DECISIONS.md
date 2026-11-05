# Decisions

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

D10: Fix the confirmed online schema/code mismatch through reviewed production migration rather than replacing DATABASE_URL or hiding query failures. Inspect partial schema state and recoverability first. Preserve user instruction to leave deployment running. Denied browser access must not be bypassed; continue via a user-connected Neon integration.

## Earlier local implementation handoff (historical)
2026-10-09, phase 2.
D01: Preserve localized legacy fields and nullable primary_language (null reserves both versions), plus per-locale editorial JSONB. Avoid split/backfill and preserve original IDs/URLs. Reversible code; keep data columns.
D02: Add Tiptap StarterKit/Image/TableKit: textarea has no rich-text machinery; no editor dependencies installed. JSON allowlist + React rendering prevents HTML execution. Preserve plaintext fallback, convert only when saving a deliberately edited version. Installed versions will be pinned together.
D03: Use private Vercel Blob; server decodes/re-encodes PNG/JPEG/WebP using sharp, random IDs. Serve through article image endpoint: admin preview or published-reference authorization. Private draft assets cannot be fetched anonymously. No deletion during replacement/removal. This adds only article storage, no media platform. See https://vercel.com/docs/vercel-blob/using-blob-sdk and https://tiptap.dev/docs/editor/getting-started/install/nextjs . Token unavailable; external durability unverified.
D04: Preserve author display-name model rather than adding parallel authors/users. Validate attribution as text; no user ID association exists to dereference.
D05: Locale partial unique slug indexes reserve both languages for legacy articles. Necessary removal of global unique constraint preserves every row; permits same slug for distinct language records. Rollback to old ambiguous slug lookup requires collision check.

D06: Extract/re-export unchanged ApiError class to avoid repository importing session/auth bootstrap while preserving existing authorization imports. Shared mutation hook gets opt-in success callback and server-error text only for article form; all existing callers unchanged. Homepage modification is a single article-query language filter, necessary to avoid blank/wrong-locale article cards; no homepage JSX/design changed. Locale switch behavior changes only for article detail pages: follow actual hreflang or route to target-language blog listing.


D07: Browser traces proved the fast publication selector could change before its React handler was committed during client navigation (selection completed before BlogEditor mount, no handler event). Gate article controls on Tiptap onCreate, key editor by article identity, and merge delayed body updates into current state. Keep the shared FormControls hydration behavior unchanged for unrelated forms. Tests now assert the PATCH publication payload/result and use distinct repeated-test records.
D08: Accept Tiptap's bounded link `title` attribute (including null) and render it as escaped text. The previous strict allowlist rejected actual pasted Tiptap JSON and forced a plaintext preview. Retain all URL/node/attribute restrictions and add a real clipboard browser regression.

D09: Final saved-runtime check found BETTER_AUTH_URL used a bare localhost value; installed Better Auth rejects schemes other than HTTP(S), blocking admin CMS access. Corrected only this private ignored local setting to match existing NEXT_PUBLIC_SITE_URL origin. This is a necessary local CMS runtime dependency, not an auth/role rewrite; no secrets or production environment values changed. get-session and protected admin redirect checked afterward.
