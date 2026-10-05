import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
async function main() {
  const { getMigrations } = await import("better-auth/db/migration");
  const { auth } = await import("../src/lib/auth");
  const { migrateDomain } = await import("../src/lib/db");
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
  await migrateDomain();
  console.log("Authentication schema and versioned domain migrations applied.");
}
main()
  .catch(() => {
    console.error(
      "Database setup failed. Check PostgreSQL connection, privileges, and schema.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    const { closeDb } = await import("../src/lib/db");
    await closeDb();
  });
