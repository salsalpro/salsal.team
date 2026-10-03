import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.ADMIN_NAME?.trim() || "Salsal administrator";
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12)
    throw new Error(
      "Provide ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) in your private environment. ADMIN_NAME is optional.",
    );
  const { auth } = await import("../src/lib/auth");
  const { getDb } = await import("../src/lib/db");
  const db = getDb();
  if (db.prepare('SELECT id FROM "user" WHERE email=?').get(email))
    throw new Error(
      "This account already exists. No account or role was changed.",
    );
  const result = await auth.api.signUpEmail({
    body: { email, name, password },
  });
  db.prepare("UPDATE \"user\" SET role='ADMIN' WHERE id=?").run(result.user.id);
  console.log("Administrator created. Sign in through /en/login or /fa/login.");
}
main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Unable to create administrator.",
  );
  process.exitCode = 1;
});
