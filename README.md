# Salsal

A bilingual digital agency platform with a public website, customer workspace, and administration area. The project lives at `~/Desktop/salsal.team`.

English and Persian share one application and one database. Persian uses RTL layouts and Vazirmatn; English uses LTR layouts and Manrope. Fonts are served locally.

## Run locally

Use Node.js **22.x**, npm and PostgreSQL. Save a private `DATABASE_URL` for an empty local database. `better-sqlite3` is retained only for one-time data transfer and migration tests; installing development dependencies may require native build tools.

```bash
cd ~/Desktop/salsal.team
npm ci
node scripts/setup-env.mjs
# Set DATABASE_URL in .env.local before continuing.
npm run setup
npm run db:seed   # Optional development content and accounts
npm run dev
```

Open `http://localhost:3000/en` or `http://localhost:3000/fa`. Use `localhost` consistently for authentication because it must match the configured auth origin.

`npm run setup` creates `.data/` with owner-only access (and tightens that directory's permissions if it already exists), generates a random authentication secret in a private `.env.local` when that file does not exist, and applies database migrations. It preserves an existing environment file. A PostgreSQL database must be available before migrations run. Existing SQLite installations must follow [POSTGRESQL_MIGRATION.md](POSTGRESQL_MIGRATION.md) instead of seeding a migration target.

The optional seed inserts three clearly labeled fictional portfolio concepts, three bilingual articles, and demonstration workspace records. Generated account passwords are stored privately in **`.data/demo-credentials.json`**; do not publish or commit that file. The seed does not overwrite existing account passwords. Set `SEED_DEMO_ACCOUNTS=false` before seeding to add public content without creating accounts.

Sign in at `/en/login` or `/fa/login`; the same screen offers registration. The development administrator opens `/en/admin` or `/fa/admin`, and the customer opens `/en/dashboard` or `/fa/dashboard`. New registrations receive the `USER` role and an empty workspace until work is assigned.

## Stack

| Area           | Implementation                                                   |
| -------------- | ---------------------------------------------------------------- |
| Application    | Next.js 16.3.8 App Router, React 19.3.0, TypeScript 5.9          |
| Styling        | Tailwind CSS 4, shared CSS design tokens, Lucide icons           |
| Authentication | Better Auth 1.7.7, email/password, database sessions             |
| Persistence    | PostgreSQL through `pg`, ordered SQL migrations          |
| Validation     | Zod 4, strict server-side request schemas                        |
| Localization   | Typed English/Persian dictionaries and localized content records |
| Verification   | ESLint 9, TypeScript, Node test runner, Playwright               |

Exact resolved dependency versions are recorded in `package-lock.json`. Most pages render on the server; interactive forms, navigation, and management controls use focused client components. Dashboard charts use lightweight application components rather than an additional charting dependency.

## What is included

- Responsive public pages with a connected Digital Marketing visualization, nine service detail pages, portfolio concepts, articles, about, contact, and authentication.
- A validated consultation form that persists requests for admin review, with loading, error, and success feedback.
- Customer overview, assigned services, projects and milestones, reports, authenticated deliverables, profile editing, and recent updates.
- Administration for users, lead status and notes, project progress and milestones, text deliverables, service visibility/order, bilingual articles, and portfolio entries.
- Application-data charts, localized metadata, canonical/language alternates, sitemap, robots configuration, keyboard focus, reduced-motion support, and localized loading/empty/error screens.

Concepts and seeded project figures are demonstration data. Dashboard charts describe stored application records; they do not represent live Google, Meta, or external traffic analytics.

## Routes

Replace `:locale` with `en` or `fa`.

| Area          | Routes                                                                                                                              |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Public        | `/:locale`, `/:locale/about`, `/:locale/contact`, `/:locale/login`                                                                  |
| Services      | `/:locale/services`, `/:locale/services/:slug`                                                                                      |
| Work          | `/:locale/portfolio`, `/:locale/portfolio/:slug`                                                                                    |
| Articles      | `/:locale/blog`, `/:locale/blog/:slug`                                                                                              |
| Customer      | `/:locale/dashboard`, plus `/services`, `/projects`, `/projects/:id`, `/reports`, `/deliverables`, `/profile`                       |
| Administrator | `/:locale/admin`, plus `/users`, `/leads`, `/services`, `/projects`, `/blog`, `/portfolio`, and supported record detail/edit routes |
| Backend       | `/api/auth/*`, `/api/leads`, `/api/profile`, `/api/projects/:id`, `/api/deliverables/:id`, `/api/admin/*`                           |

Service slugs are `digital-marketing`, `instagram-marketing`, `social-media`, `seo`, `web-development`, `wordpress`, `video-editing`, `videography`, and `photography`.

## Code organization

```text
src/app/                 Public/workspace routes, metadata routes, and API handlers
src/components/public/   Marketing pages, navigation, and public forms
src/components/dashboard/ Workspace shell, charts, tables, and management forms
src/content/             Typed dictionaries, nine service definitions, seed fixtures
src/lib/                 Authentication, authorization, domain types, validation,
                         database connection, repository, and locale utilities
migrations/              Ordered domain SQL migrations
scripts/                 Environment setup, migration, seed, and browser-test setup
tests/                   Backend and browser checks
public/                  Public static assets
.data/                   Retained SQLite sources/backups and demo credentials (ignored)
work/                    Private test artifacts and optional local test server (ignored)
```

Service editorial content is deliberately maintained in `src/content/services.ts`; the database stores service visibility and ordering. This keeps a small catalog maintainable without introducing a second CMS. Blog and portfolio content live in the database and are read through the same repository used by admin editing. `src/content/fixtures.ts` is seed input, not a separate public content source.

Localized content uses `{ en, fa }` fields. Interface copy comes from typed dictionaries in `src/content/`; locale parsing, direction, and number/date formatting are centralized in `src/lib/i18n.ts`. Locale-prefixed links and the language switch preserve the current page.

## Database and authorization

The database is selected by the private `DATABASE_URL`. A reused, bounded PostgreSQL pool supplies asynchronous parameterized queries; transactions keep one checked-out connection. Foreign keys and existing constraints remain enforced. Better Auth manages its user, account, session, and verification schema; the application migrations manage leads, projects, milestones, assigned services, reports, notifications, deliverables, content, and service settings. Migration application is explicit:

```bash
npm run db:setup
```

The repository centralizes SQL and record mapping. Private project and deliverable reads are scoped to the authenticated owner; administrator access is explicitly checked on the server. Roles are read from the database for authorization and cannot be supplied during public registration. Admin pages and API mutations enforce `ADMIN` separately from the client interface.

Request handlers validate untrusted data, constrain file references and payload sizes, check request origins, and return bounded error messages. Public lead submission includes a honeypot and persisted rate limiting. Rich article content is stored as plain text rather than trusted HTML. Deliverables currently support authenticated, database-backed text/Markdown/CSV downloads.

For a non-demo administrator, put `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD` in the private environment or a protected CI secret; `ADMIN_NAME` is optional. Do not type a password into a command that will be retained in shell history. After applying database migrations, run:

```bash
npm run admin:create
```

This creates a new administrator and prints no credentials. It refuses to modify any existing account or role. There is no public role-promotion endpoint. Remove the bootstrap password from the environment after provisioning, and do not enable demo accounts in production.

## Environment

See `.env.example`. Local setup generates the auth secret and local origins; the operator supplies PostgreSQL URLs. Deployment must supply the real URLs and preserve the existing auth secret when migrating data.

| Variable                                      | Purpose                                                                                                                                                                          |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`                          | Random secret, at least 32 characters; keep private and stable across restarts.                                                                                                  |
| `BETTER_AUTH_URL`                             | Authentication origin, locally `http://localhost:3000`.                                                                                                                          |
| `NEXT_PUBLIC_SITE_URL`                        | Public canonical origin used in metadata and sitemap.                                                                                                                            |
| `DATABASE_URL` | Private PostgreSQL connection URL; required for runtime/setup/build. |
| `DATABASE_POOL_MAX` | Per-process pool maximum, default 5; size within provider limits. |
| `TEST_DATABASE_URL` | Dedicated disposable PostgreSQL database for isolated test schemas. |
| `TRUST_PROXY`                                 | Controls the contact form's IP-based throttle only. Default `false` shares a 30-per-hour bucket. Enable only behind an ingress that replaces client-supplied forwarding headers. |
| `SEED_DEMO_ACCOUNTS`                          | Set to `false` to seed public content only. Used by the development seed command.                                                                                                |
| `DEMO_ADMIN_EMAIL`, `DEMO_CLIENT_EMAIL`       | Optional development account email overrides.                                                                                                                                    |
| `DEMO_ADMIN_PASSWORD`, `DEMO_CLIENT_PASSWORD` | Optional development passwords; otherwise random passwords are generated.                                                                                                        |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | Private inputs for one-time `npm run admin:create`; name is optional.                                                                                                            |
| `CHROME_PATH`                                 | Optional browser executable for Playwright; current default is `/usr/bin/google-chrome`.                                                                                         |

`.env.local`, database files, generated credentials, and test artifacts are ignored by Git. There are no committed production credentials. Authentication has its own Better Auth rate limits; `TRUST_PROXY` does not configure those. The deployment ingress must replace untrusted forwarding headers for authentication requests as well.

## Verification commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

`npm run format` applies the project’s Prettier formatting.

The browser suite uses the production build on port `3100`, so build first against an initialized database. Export `TEST_DATABASE_URL` privately to a dedicated PostgreSQL test database before running backend/browser tests. Tests create unique schemas, synthetic accounts and fixtures, and remove only their own schemas; they never copy the main SQLite database or use its credentials. Browser fixture credentials are stored privately in ignored `work/e2e-credentials.json`. `CHROME_PATH` can select a compatible installed browser. Interrupted runs may leave a generated test schema; identify it before cleaning it up.

See [VALIDATION.md](VALIDATION.md) for executed checks, browser coverage, results, and deployment boundaries.

## Deployment and external integrations

For a Node server connected to PostgreSQL:

```bash
npm ci
npm run db:setup
npm run build
npm run start
```

Supply production environment variables before migration/build/start. The npm database command expects `.env.local` to exist; provision it securely from the deployment environment. The server binds to `127.0.0.1`; put an HTTPS reverse proxy in front of it. Configure the public/auth URLs to the same deployment origin.

Runtime database operations no longer depend on writable local disk. This remains a Node application, not a static export or Edge database implementation. Use provider-supported pooling/TLS and budget connections across serverless instances. Apply schema explicitly before serving traffic. See [POSTGRESQL_MIGRATION.md](POSTGRESQL_MIGRATION.md) for verified backups, existing-data transfer, write freeze, cutover, rollback, and Vercel considerations. No production deployment was performed by the migration task.

The following are integration boundaries, not connected services:

- Transactional email, password reset, email verification, and OAuth providers.
- Google Analytics, Search Console, Google Ads, Meta, and other external reporting APIs.
- Binary upload/object storage for images, video, PDFs, and larger project assets; current deliverables are text-based.
- Automated lead emails, payments, subscriptions, and a full support-ticket workflow.

The platform runs locally without those credentials. Configure and validate the services your deployment needs before presenting them as available to customers. Replace demo content and business policy copy with approved material before a public launch.
