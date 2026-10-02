import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { getDb, migrateDomain } from "../src/lib/db";
import { blogSchema, leadSchema, projectSchema, deliverableSchema } from "../src/lib/validation";
import { createProject, createDeliverable, getProject, getAuthorizedDeliverable, listProjects, createBlogPost, getBlogPost, listBlogPosts, consumeRateLimit, createLead, listLeads, updateLead, getProfile, updateProfile, getAdminOverview } from "../src/lib/repository";

const directory = path.join(process.cwd(), "work", `test-${randomUUID()}`);
mkdirSync(directory, { recursive: true });
process.env.DATABASE_PATH = path.join(directory, "test.sqlite");
process.env.BETTER_AUTH_SECRET = randomBytes(32).toString("hex");
process.env.BETTER_AUTH_URL = "http://localhost:3000";

const localized = { en: "Test title", fa: "عنوان آزمایشی" };
let ownerId = ""; let strangerId = ""; let adminCookie = ""; let userCookie = "";

before(async () => {
  const { auth } = await import("../src/lib/auth");
  const { getMigrations } = await import("better-auth/db/migration");
  await (await getMigrations(auth.options)).runMigrations();
  migrateDomain();
  for (const [index, email] of ["owner@example.test", "stranger@example.test", "admin@example.test"].entries()) {
    const body = { name: `Test ${index}`, email, password: "ValidTestPassword-2049", role: "ADMIN" };
    const result = await auth.api.signUpEmail({ body });
    assert.equal(getProfile(result.user.id)?.role, "USER", "a browser-supplied role must never create an administrator");
    if (index === 0) ownerId = result.user.id;
    if (index === 1) strangerId = result.user.id;
    if (index === 2) getDb().prepare('UPDATE "user" SET role=\'ADMIN\' WHERE id=?').run(result.user.id);
    const response = await auth.api.signInEmail({ body: { email, password: body.password }, asResponse: true });
    const cookie = response.headers.getSetCookie().map((entry) => entry.split(";")[0]).join("; ");
    if (index === 0) userCookie = cookie;
    if (index === 2) adminCookie = cookie;
  }
});
after(() => { getDb().close(); rmSync(directory, { recursive: true, force: true }); });

test("migrations are repeatable and tracked", () => {
  migrateDomain();
  assert.equal((getDb().prepare("SELECT COUNT(*) AS count FROM schema_migration").get() as { count: number }).count, 1);
});

test("lead validation rejects missing contact, invalid service and injected fields", () => {
  const valid = { name: "Client", email: "hello@example.test", service: "seo", message: "We need a considered search strategy for our website." };
  assert.equal(leadSchema.safeParse(valid).success, true);
  assert.equal(leadSchema.safeParse({ ...valid, email: "", contactMethod: "email" }).success, false);
  assert.equal(leadSchema.safeParse({ ...valid, role: "ADMIN" }).success, false);
  assert.equal(leadSchema.safeParse({ ...valid, service: "unknown" }).success, false);
  assert.equal(leadSchema.safeParse({ ...valid, website: "spam" }).success, false);
});

test("project reads and downloads enforce ownership", () => {
  const project = createProject(projectSchema.parse({ clientId: ownerId, title: localized, description: localized, serviceIds: ["seo"], stage: localized, startDate: "2026-10-01", deadline: "2026-11-01" }));
  const deliverableId = createDeliverable(project.id, { title: localized, filename: "strategy.txt", content: "Private client strategy" });
  assert.equal(getProject(project.id, strangerId), null);
  assert.equal(getProject(project.id), null);
  assert.equal(getProject(project.id, ownerId)?.id, project.id);
  assert.equal(getProject(project.id, undefined, true)?.id, project.id);
  assert.equal(listProjects({ userId: strangerId }).length, 0);
  assert.equal(getAuthorizedDeliverable(deliverableId, strangerId), null);
  assert.equal(getAuthorizedDeliverable(deliverableId, ownerId)?.content, "Private client strategy");
  assert.equal(deliverableSchema.safeParse({ title: localized, filename: "../../secret.txt", content: "x" }).success, false);
});

test("draft blog content is excluded from public lookup and listing", () => {
  const post = createBlogPost(blogSchema.parse({ slug: "test-article", title: localized, excerpt: localized, content: localized, category: localized, author: "Salsal", seoTitle: localized, seoDescription: localized }));
  assert.equal(getBlogPost(post.slug, { publishedOnly: true }), null);
  assert.equal(listBlogPosts({ publishedOnly: true }).length, 0);
  assert.equal(getBlogPost(post.id)?.published, false);
});

test("lead workflow and admin counts use persisted application records", () => {
  const lead = createLead(leadSchema.parse({ name: "Prospective client", email: "hello@example.test", service: "seo", message: "We need a considered search strategy for our website." }));
  updateLead(lead.id, "qualified", "Discovery call complete");
  assert.equal(listLeads({ status: "qualified" })[0].notes, "Discovery call complete");
  assert.equal(getAdminOverview().stats.leads, 1);
});

test("rate limit persists counters and denies calls past allowance", () => {
  assert.equal(consumeRateLimit("test", 2), true);
  assert.equal(consumeRateLimit("test", 2), true);
  assert.equal(consumeRateLimit("test", 2), false);
});

test("profile update accepts only the selected account and exposes no password data", () => {
  const profile = updateProfile(ownerId, { name: "Updated owner", company: "Example", phone: "12345", locale: "fa" });
  assert.equal(profile?.name, "Updated owner");
  assert.equal(profile?.role, "USER");
  assert.equal("password" in (profile || {}), false);
  assert.equal(getProfile(strangerId)?.name, "Test 1");
});

test("admin API independently denies anonymous and regular users", async () => {
  const { GET } = await import("../src/app/api/admin/users/route");
  assert.equal((await GET(new Request("http://localhost:3000/api/admin/users"))).status, 401);
  assert.equal((await GET(new Request("http://localhost:3000/api/admin/users", { headers: { cookie: userCookie } }))).status, 403);
  assert.equal((await GET(new Request("http://localhost:3000/api/admin/users", { headers: { cookie: adminCookie } }))).status, 200);
});

test("authenticated writes reject a cross-origin request", async () => {
  const { PATCH } = await import("../src/app/api/profile/route");
  const response = await PATCH(new Request("http://localhost:3000/api/profile", { method: "PATCH", headers: { cookie: userCookie, "content-type": "application/json", origin: "https://untrusted.example" }, body: JSON.stringify({ name: "Attacker" }) }));
  assert.equal(response.status, 403);
});
