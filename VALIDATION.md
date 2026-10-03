# Salsal validation

Validation date: October 3, 2026. Project: `~/Desktop/salsal.team`.

## Environment and commands

Node.js 22.23.3, npm 10.9.9, Next.js 16.3.8, and local Google Chrome.

| Command             | Result                                                                           |
| ------------------- | -------------------------------------------------------------------------------- |
| `npm run setup`     | Passed; local environment and schema prepared, existing configuration preserved. |
| `npm run db:seed`   | Passed; replaceable demo content and development accounts prepared.              |
| `npm run lint`      | Passed.                                                                          |
| `npm run typecheck` | Passed.                                                                          |
| `npm test`          | Passed: 13 backend tests.                                                        |
| `npm run build`     | Passed; production routes compiled.                                              |
| `npm run test:e2e`  | Passed: all 10 browser tests (55.5 seconds).                                     |
| `git diff --check`  | Passed.                                                                          |

An initial restricted-environment build could not spawn the TypeScript subprocess. After the required local execution/network permissions were granted, the normal production build passed without disabling type checking.

The final browser failure was a test navigation race: the test selected the lead list's status filter before the detail editor loaded. Waiting for the detail heading and scoping controls to its editor resolved it. The final run verified that status and notes persist after a reload. No lead persistence rewrite was required. The runner emitted only a terminal-color environment warning (`NO_COLOR` with `FORCE_COLOR`); all checks completed successfully.

## Coverage

Backend checks exercise repeatable migrations, timestamp mapping, strict input validation, owner-scoped project/file access, draft visibility, persisted leads and rate limits, safe profile updates, anonymous/customer admin denial, cross-origin rejection, immediate privilege demotion, and customer-specific service assignments. They use a temporary database, never the main development database.

The browser suite covers both public locales and all nine services, representative case studies/articles, localized document direction and metadata, sitemap/robots, locale and query preservation, mobile navigation, consultation form validation/loading/success/error states, lead management, registration, empty workspaces, role separation, cross-account isolation, customer routes, private downloads, profile persistence, sign-out, admin navigation/search, bilingual article publishing, project milestones, service visibility, service assignments, deliverable creation, and portfolio creation. It also verifies localized authentication errors, invalid filename rejection, page runtime/hydration errors, and horizontal page overflow on tested routes.

Browser mutations use the copied database `work/e2e.sqlite`. The suite honors the production sign-in rate limiter; it does not disable authentication protection. Reports are in `work/playwright-report/` and screenshots in `work/screenshots/`. Test artifacts are private development output, ignored by Git.

Visual inspection covered English and Persian homepages, customer and admin workspaces, desktop layouts, 390px mobile layouts, and the 768px tablet admin layout. Layouts were checked for readable text, RTL alignment, navigation, chart rendering, and scrollable mobile tables. This is practical application QA, not a formal accessibility certification or performance/load audit.

## Local handoff

Use `npm run dev` for development, or `npm run build` followed by `npm run start` for the production server. Open `/en` or `/fa` on `http://localhost:3000`. Login is at `/:locale/login`; administrators open `/:locale/admin` and customers open `/:locale/dashboard`.

The existing local environment is already configured. No external database account is required. Generated demo credentials are in the private, Git-ignored `.data/demo-credentials.json`. See `README.md` for environment variables and secure non-demo admin provisioning with `npm run admin:create`.

## Deployment boundaries

The current runtime targets one Node server with persistent SQLite storage. Transactional email, password reset/email verification, OAuth providers, Google/Meta reporting, binary object storage, payments, and support-ticket automation are not connected. File delivery currently supports authenticated text, Markdown, and CSV files. Service editorial content is maintained in the typed repository catalog; administrators control service visibility/order and customer assignments. Seed case studies and workspace metrics are explicitly demonstrations, not claimed client results or live external analytics.

Before public deployment, supply production URLs/secrets, provision HTTPS and persistent storage/backups, connect any required external services, and replace demonstration content with approved business content. See `README.md` for the full setup and architecture.
