import { mkdirSync } from "node:fs";
import { createTestSchema, dropTestSchema } from "./test-database.ts";
mkdirSync("work/tmp", { recursive: true });
const schema = process.env.E2E_SCHEMA;
if (!schema || !process.env.DATABASE_URL || !process.env.TEST_DATABASE_URL)
  throw new Error("Browser tests require an isolated PostgreSQL test schema.");
await createTestSchema(schema);
try {
  const { getMigrations } = await import("better-auth/db/migration");
  const { auth } = await import("../src/lib/auth.ts");
  const { migrateDomain, closeDb } = await import("../src/lib/db.ts");
  await (await getMigrations(auth.options)).runMigrations();
  await migrateDomain();
  await closeDb();
  // Seed is run by the parent command with a test-only credential output path.
  console.log("Prepared isolated PostgreSQL browser-test schema.");
} catch {
  await dropTestSchema(schema);
  throw new Error("Unable to prepare PostgreSQL browser-test schema.");
}
