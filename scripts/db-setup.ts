import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
async function main() {
  const { getMigrations } = await import("better-auth/db/migration");
  const { auth } = await import("../src/lib/auth");
  const { migrateDomain } = await import("../src/lib/db");
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
  migrateDomain();
  console.log("Authentication schema and versioned domain migrations applied.");
}
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
