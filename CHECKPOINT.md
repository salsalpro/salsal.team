# Salsal continuation checkpoint

Updated October 3, 2026. Work only in `/home/salsal/Desktop/salsal.team`. This is an existing implementation: **do not scaffold, redesign, replace its architecture, reinstall duplicate dependencies, or rebuild completed sections.** Inspect actual Git status before editing. The continuation began at user-created commit `0ea99ca` (`third limit`). During final checks, the user committed the lead-test fix in `0b53d10` (`commit diring time before the fourth limit`). Preserve both commits and any newer changes.

## Current status

The public website, English/Persian localization, all nine service pages, portfolio/case studies, blog/articles, about, contact inquiry flow, authentication, customer workspace, and admin management are implemented. SQLite persistence, migrations, seed data, ownership checks, role enforcement, content publishing, customer service assignments, private text deliverables, responsive navigation, charts, SEO metadata, and loading/error/empty states are implemented.

The implementation and final verification milestone are complete. The final full browser run passed **10/10 tests in 55.5 seconds**. Lint, TypeScript, all **13 backend tests**, and the production build passed. `VALIDATION.md` records the confirmed results. There is no remaining failed test or required feature work within the implemented local platform scope.

## Last issue and confirmed resolution

The contact-to-admin test in `tests/e2e.spec.ts` clicked a lead link and immediately selected the first `Status` combobox. The trace proved it was still interacting with the **list filter**, before the detail page rendered. The detail editor then correctly displayed its stored `new` status. This was not a persistence or select-state defect.

The test now waits for the lead's detail heading and scopes status/notes interactions to the form containing `Internal notes`. Temporary console diagnostics were removed. This fix is included in user commit `0b53d10`. Keep this precise navigation/locator fix; do not change backend lead updates or add arbitrary waits.

The baseline already includes `FormControls`, a shared native disabled-fieldset readiness guard used by dashboard mutation forms. An earlier hydration hypothesis led to this guard, but it did not explain the failing test. It is already committed and should not prompt another round of UI restructuring.

## Files changed in the current continuation

| File                | Purpose and change                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `tests/e2e.spec.ts` | Full browser coverage; corrected lead-detail navigation timing and scoped selectors.                               |
| `next-env.d.ts`     | Next.js generated route type imports; may change between development and production commands. Do not hand-edit it. |
| `CHECKPOINT.md`     | This continuation guide, status, ownership boundaries, and next actions.                                           |
| `VALIDATION.md`     | Verification evidence, final passing browser result, and deployment boundaries.                                    |

Previous implementation changes are preserved in the baseline commit, including filename-pattern validation, localized authentication rate-limit/server errors, private customer project-note redaction, dynamic service visibility, true unpublished/hidden-page 404 responses, responsive dashboard forms, and owner-only `.data` directory setup. `README.md` documents the full architecture and setup.

## Architecture and file map

- `src/app/(entry)/`: default root redirect to Persian.
- `src/app/[locale]/layout.tsx`: localized document direction, shared CSS, self-hosted fonts, metadata base.
- `src/app/[locale]/(public)/`: home, about, contact, login, services and slug detail, portfolio and slug detail, blog and slug detail. Preserve the reusable service-detail implementation.
- `src/app/[locale]/(workspace)/`: independently protected admin/customer catch-all routes and loading/error boundaries. Admin route composes existing management components.
- `src/app/api/`: Better Auth handlers, public leads, safe profile updates, owner-scoped project/file reads, admin users/services/assignments/leads/projects/deliverables/blog/portfolio endpoints. Each protected handler checks authorization on the server.
- `src/app/sitemap.ts`, `src/app/robots.ts`: crawlable localized public routes.
- `src/components/public/`: existing brand, header/footer, locale switching, ecosystem visualization, contact/auth forms, cards, and sections.
- `src/components/dashboard/`: shell, primitives, charts, customer/admin views, shared forms, and project/blog/portfolio/assignment editors. Reuse these components.
- `src/styles/globals.css`, `src/styles/dashboard.css`: existing light neutral/violet design, responsive breakpoints, RTL layouts, focus states, and reduced motion. Preserve tokens, spacing, and visual identity.
- `src/content/messages.ts`, `dashboard-messages.ts`: bilingual interface dictionaries; `services.ts`: typed nine-service editorial catalog; `fixtures.ts`: replaceable demonstration articles/projects.
- `src/lib/db.ts`, `repository.ts`, `domain.ts`: SQLite connection, SQL/data mapping, domain contracts. `authorization.ts`, `auth.ts`, `auth-client.ts`: Better Auth sessions and server permissions. `validation.ts`: strict Zod input schemas. `i18n.ts`, `catalog.ts`, `metadata.ts`: locale parsing/formatting, visible service lookup, SEO helpers.
- `migrations/001-domain.sql`: profile, lead, project, client service, deliverable, report, notification, blog, portfolio, service settings, rate limits. Better Auth manages its own identity/session schema.
- `scripts/setup-env.mjs`, `db-setup.ts`, `seed.ts`: private local configuration, migrations, optional demo fixtures/accounts. `create-admin.ts`: new administrator provisioning only. `prepare-e2e.mjs`: isolated browser database copy.
- `tests/backend.test.ts`: 13 database/security/API checks. `tests/e2e.spec.ts`, `playwright.config.ts`: Chrome browser workflows on port 3100.
- `public/icon.svg`: existing Salsal icon. Fonts are local Manrope/Vazirmatn packages; visual covers have code-native fallbacks.
- `package.json`, `package-lock.json`, `.npmrc`: existing dependencies/scripts/lock and local npm cache. `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`: framework/type/lint/style configuration. `AGENTS.md`: read relevant installed Next.js docs before framework code changes. `.env.example`, `.gitignore`, `README.md`: setup and private-file exclusions.

Stack: Next.js 16.3.8, React 19.3.0, TypeScript 5.9, Tailwind 4, Better Auth 1.7.7, better-sqlite3, Zod 4, Lucide, ESLint, Node tests via tsx, Playwright, Prettier. Do not add competing solutions.

## Runtime, data, and secrets

Use Node 22.13 or newer. Local `.env.local` is already configured with `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL`, and `DATABASE_PATH`. Do not print or commit its contents. `.data/demo-credentials.json` contains generated demo passwords; do not expose them in logs, screenshots, or Git. `.data` has owner-only directory access; environment and credentials are mode 600.

The default main database is `.data/salsal.sqlite`. It contains seed data and must not be reset or mutated for tests. `npm run test:e2e` copies it to `work/e2e.sqlite` and uses port 3100. Backend tests use separate temporary databases. The browser prep currently requires the default main database path, even when the app supports custom `DATABASE_PATH` values. Existing test reports/traces/screenshots are in ignored `work/` and may contain private demo login data; inspect narrowly rather than dumping them.

Authentication has a real three-attempts-per-ten-seconds sign-in limit. The test helper honors `X-Retry-After` once for HTTP 429. Do not disable security limits to make tests pass. Public contact throttling has its separate persisted counters. `TRUST_PROXY` controls contact-throttle IP extraction only.

## Verified behavior and known boundaries

Confirmed runs passed lint, TypeScript, 13 backend tests, the production build, and all 10 browser tests. The test race is corrected and verified as described above. Both public languages and desktop/mobile/tablet layouts have been visually inspected. The only browser-runner warning was a harmless conflict between terminal color environment flags. There are no remaining known critical runtime errors from the tested routes.

An earlier sandbox prevented Node subprocess output; granting required project-write and local-network permissions resolved it. Do not suppress build/type checks for that environment issue. Current environment permissions may change across turns; inspect before writing.

External email/reset/verification, OAuth, Google/Meta analytics, binary object storage, payments, and support-ticket automation are not connected. Current authenticated deliverables support text/CSV/Markdown. Structured repository content manages service editorial text; admin manages visibility/order and customer assignments. This is a single persistent Node/SQLite deployment, not an Edge/static/multi-instance deployment. These boundaries are documented, not unfinished duplicate implementation tasks.

## Next actions for the next session

1. Inspect `git status`, latest commit, `VALIDATION.md`, and `work/test-results/.last-run.json`. Preserve user changes.
2. The final run passed; do not repeat the full build/test cycle or restart implementation just because this is a new session. If a new change requires browser verification, run `npm run test:e2e` against a matching production build. Keep tests isolated from the main database.
3. If the lead test fails, inspect its exact trace with the detail heading/form scope; do not revisit the disproven hydration-only diagnosis. Fix only evidence-backed issues.
4. Finish `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` as needed after actual changes. Do not run a build concurrently with the browser suite using its output.
5. Keep `VALIDATION.md` and this completed checkpoint accurate when making any future changes. Run `git diff --check` after edits.
6. Start or verify the preview at `http://localhost:3000/fa` and `/en`; use `npm run dev` for development or `npm run start` for an existing production build. Check for an existing listener before starting another server.
7. Provide a concise handoff with project path, implemented features, stack, architecture/docs, run command, environment/database setup, safe credential location, admin URL, executed check results, and external integration boundaries. No deployment was requested. Do not commit or revert user work automatically.

Do not restart the platform, redesign pages, replace the current database/auth/i18n solutions, seed over user content, or generate new versions of completed features.
