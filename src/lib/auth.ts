import { betterAuth } from "better-auth";
import { getDb } from "./db";

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret || secret.length < 32) {
  throw new Error(
    "Set BETTER_AUTH_SECRET to a random value of at least 32 characters before starting Salsal.",
  );
}

export const auth = betterAuth({
  appName: "Salsal",
baseURL:
  process.env.BETTER_AUTH_URL ||
  "http://127.0.0.1:3000" ||
  "localhost:3000",
  secret,
  database: getDb(),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
        input: false,
      },
    },
  },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  rateLimit: { enabled: true, window: 60, max: 60 },
  advanced: { cookiePrefix: "salsal" },
});
