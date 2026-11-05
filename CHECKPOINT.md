# Salsal continuation checkpoint

## Logo publication attempt — 2026-10-29 (latest)

User explicitly requested sending/publishing the logo update. Logo source changes committed locally on main as **4e1a940** (Replace site branding with supplied Salsal logo): only public/icon.svg, src/components/public/brand-logo.tsx, brand.tsx, ecosystem.tsx and src/styles/globals.css. Database/manual SQL/checkpoint documents were deliberately not included. Initial fetch showed local HEAD and origin/main both cad5a71 before this commit. Targeted ESLint and diff checks passed again; earlier typecheck and responsive logo preview passed.

Push to https://github.com/salsalpro/salsal.team.git failed because no HTTPS credentials were available. gh auth status confirmed no authenticated GitHub host; no token env variables or SSH agent identities. An interactive official gh auth login device flow is waiting for the user (exec session36034). User has been given the official GitHub device login page and temporary code; do not store the code in checkpoint. No password/token was requested in chat. A GitHub plugin search showed not installed and previously suggested recently; no duplicate suggestion issued. Do not bypass SSH host verification or authentication.

Before push, https://salsalteam.vercel.app/fa returned200 but did not contain the new wordmark viewBox; historical Oct9 database incident is not currently observed on that public page. Vercel API lookup timed out, so no deployment status has been inferred. No new deployment was triggered by this failed push.

Next: after user completes device login, poll session36034 or gh auth status, then run gh auth setup-git if needed and git push origin main. Verify the exact 4e1a940 commit reaches origin/main and then verify Vercel production deployment/public HTML contains the new logo (viewBox0 0 936 244) and favicon matches public/icon.svg. Preserve all unrelated uncommitted checkpoint/manual SQL files; do not push them or alter the database. Never claim live publication from a local commit or a push attempt alone.


## Latest task — Salsal supplied logo replacement, 2026-10-29

Completed in repository code; not committed, pushed or deployed. Replaced the generic drawn mark and typed word with a vector trace of the owner's supplied /home/salsal/Downloads/42427(1).jpg. Entire black artwork is the long logo; its first symbol is the compact logo. Transparent inline vectors inherit existing light/dark colors and retain the original letterforms. No database or production operations.

Files in this milestone:
- src/components/public/brand-logo.tsx (new): shared full/compact traced SVG, decorative because parent brand links already carry the Salsal accessible name.
- src/components/public/brand.tsx: renders the full artwork, automatically updating header, footer and workspace sidebar.
- src/components/public/ecosystem.tsx: compact artwork replaces the old ecosystem mark and MiniOrbit's generic marketing icon.
- src/styles/globals.css: full logo sizing140px desktop/120px mobile; existing compact containers/theme preserved.
- public/icon.svg: favicon uses the compact supplied symbol with padding.
- CHECKPOINT.md: this handoff. Earlier uncommitted CMS checkpoint/manual SQL files were preserved, not modified by the logo task.

Verification: targeted ESLint PASS; npm run typecheck PASS; git diff --check PASS. Isolated browser preview rendered the actual Brand/BrandLogo components with existing CSS at320/768/1024/1440px: no horizontal overflow, nonzero SVG dimensions, accessible Salsal link names and no page errors. Desktop/mobile screenshots inspected at /tmp/salsal-brand-1440.png and /tmp/salsal-brand-320.png. This was a logo preview, not a full live app/database regression. Typegen's unrelated next-env.d.ts change was restored to its previously clean HEAD content. Temporary tracing tools installed only under /tmp/salsal-logo-tools; no project dependency changes.

Next: review/publish the current change only when requested. No logo implementation work remains. Prior production database issue below is historical and was not re-checked in this logo task; do not assume its current online status.


Latest: user requested a manual repair route. See [manual Neon guide](docs/codex/blog-cms/NEON_MANUAL_REPAIR.md) and [guarded SQL](docs/codex/blog-cms/NEON_MANUAL_REPAIR.sql). Four isolated migration/guard/rollback tests PASS; actual Neon execution and production recovery remain unverified. Agent has not written production data. Preserve a separate recovery branch, test on another branch, then use the whole reviewed SQL on the correct production database. Stop on any error.

Current priority: **production HTTP500 repair**. Start with [CMS CHECKPOINT](docs/codex/blog-cms/CHECKPOINT.md), then [RESUME](docs/codex/blog-cms/RESUME.md), TASKS and actual Git state. Repository: /home/salsal/Desktop/salsal.team; preserve completed implementation.

Owner committed/pushed CMS as cad5a71b9b7e5af0b71f15df10ee149893f3a25e. Selected Vercel project salsal.team / https://salsalteam.vercel.app deployed it automatically. Deployment is READY but /fa fails with500. Vercel logs confirm `column "primary_language" does not exist` (PostgreSQL42703). React441 is the server-render failure wrapper.

User said Leave the deployment running and subsequently requested repair. Agent did not commit, push, cancel, roll back, change production environment or write production data. Neon integration is not connected; browser access to console.neon.tech was denied and must not be bypassed. Online schema/history/recovery remain unverified. Next: user-connected Neon access, read-only schema inspection, verified recovery, exact isolated migration test, then approval for the concrete production action. Do not run db:setup blindly, reset/seed/import local data or replace the production URL with localhost.

Core CMS implementation is locally verified; provider media tests remain blocked. Local PostgreSQL55433 has three preserved bilingual articles and001+002; this does not establish online state. Original SQLite/WAL/backups remain. Historical PostgreSQL runbooks are CODEX_MIGRATION_CHECKPOINT.md and POSTGRESQL_MIGRATION.md; do not rerun their completed local transfer instructions.
