import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { query } from "./db";
import type { Locale, Role } from "./domain";

import { ApiError } from "./api-error";
export { ApiError } from "./api-error";

export async function getSession(requestHeaders?: Headers) {
  const session = await auth.api.getSession({
    headers: requestHeaders || (await headers()),
  });
  if (!session) return null;
  // Consult the database for every permission decision, including after a role change.
  const user = (
    await query('SELECT role FROM "user" WHERE id = $1', [session.user.id])
  ).rows[0] as { role: Role } | undefined;
  if (!user) return null;
  return { ...session, user: { ...session.user, role: user.role } };
}

export async function requireUser(locale: Locale = "en") {
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  return session;
}
export const requireSession = requireUser;

export async function requireAdmin(locale: Locale = "en") {
  const session = await requireUser(locale);
  if (session.user.role !== "ADMIN") redirect(`/${locale}/dashboard`);
  return session;
}

export async function requireApiUser(request: Request, admin = false) {
  const session = await getSession(request.headers);
  if (!session) throw new ApiError(401, "Authentication required.");
  if (admin && session.user.role !== "ADMIN")
    throw new ApiError(403, "Administrator access required.");
  return session.user;
}

export function verifyOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const allowedOrigin = new URL(process.env.BETTER_AUTH_URL || request.url)
    .origin;
  if (
    (origin && origin !== allowedOrigin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    throw new ApiError(403, "Request origin is not allowed.");
  }
}
