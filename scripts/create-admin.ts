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
  const { query } = await import("../src/lib/db");
  if ((await query('SELECT id FROM "user" WHERE email=$1', [email])).rows[0])
    throw new Error(
      "This account already exists. No account or role was changed.",
    );
  const result = await auth.api.signUpEmail({
    body: { email, name, password },
  });
  await query("UPDATE \"user\" SET role='ADMIN' WHERE id=$1", [result.user.id]);
  console.log("Administrator created. Sign in through /en/login or /fa/login.");
}
main()
  .catch(() => {
    console.error(
      "Unable to create administrator. Check configuration, schema, and account uniqueness.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    const { closeDb } = await import("../src/lib/db");
    await closeDb();
  });
