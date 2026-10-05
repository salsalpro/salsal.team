import { testDatabase } from "./scripts/test-database";
import { defineConfig } from "@playwright/test";
import { randomBytes } from "node:crypto";
// Playwright loads this configuration in workers too. Share the parent's schema.
const database =
  process.env.E2E_SCHEMA && process.env.E2E_DATABASE_URL
    ? { schema: process.env.E2E_SCHEMA, url: process.env.E2E_DATABASE_URL }
    : testDatabase("e2e");
process.env.DATABASE_URL = database.url;
process.env.E2E_SCHEMA = database.schema;
process.env.E2E_DATABASE_URL = database.url;
const testSecret = randomBytes(48).toString("base64url");
export default defineConfig({
  globalTeardown: "./scripts/cleanup-e2e.ts",
  testDir: "./tests",
  testMatch: "e2e.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 10000 },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "work/playwright-report" }],
  ],
  outputDir: "work/test-results",
  use: {
    baseURL: "http://localhost:3100",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: {
      executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
      args: ["--no-sandbox"],
    },
  },
  webServer: {
    command:
      "node --import tsx scripts/prepare-e2e.mjs && node --import tsx scripts/seed.ts && npm run start -- --port 3100",
    url: "http://localhost:3100/en",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      DATABASE_URL: database.url,
      TEST_DATABASE_URL: process.env.TEST_DATABASE_URL!,
      E2E_SCHEMA: database.schema,
      DEMO_CREDENTIAL_PATH: "work/e2e-credentials.json",
      SEED_DEMO_ACCOUNTS: "true",
      DEMO_ADMIN_EMAIL: "admin@demo.salsal.test",
      DEMO_CLIENT_EMAIL: "client@demo.salsal.test",
      DEMO_ADMIN_PASSWORD: randomBytes(24).toString("base64url"),
      DEMO_CLIENT_PASSWORD: randomBytes(24).toString("base64url"),
      BETTER_AUTH_SECRET: testSecret,
      BETTER_AUTH_URL: "http://localhost:3100",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3100",
      TMPDIR: `${process.cwd()}/work/tmp`,
    },
  },
});
