import { existsSync, writeFileSync, mkdirSync, chmodSync } from "node:fs";
import { randomBytes } from "node:crypto";
mkdirSync(".data", { recursive: true, mode: 0o700 });
chmodSync(".data", 0o700);
if (!existsSync(".env.local")) {
  writeFileSync(
    ".env.local",
    `BETTER_AUTH_SECRET=${randomBytes(48).toString("base64url")}\nBETTER_AUTH_URL=http://localhost:3000\nNEXT_PUBLIC_SITE_URL=http://localhost:3000\nDATABASE_URL=\n`,
    { mode: 0o600 },
  );
  console.log("Created private local environment configuration.");
} else console.log("Existing local environment preserved.");

console.log("Set DATABASE_URL in the private environment before applying PostgreSQL migrations.");
