import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { getDb, migrateDomain } from "../src/lib/db";
import {
  blogSchema,
  leadSchema,
  projectSchema,
  deliverableSchema,
} from "../src/lib/validation";
import {
  createProject,
  createDeliverable,
  getProject,
  getAuthorizedDeliverable,
  listProjects,
  createBlogPost,
  updateBlogPost,
  getBlogPost,
  listBlogPosts,
  consumeRateLimit,
  createLead,
  listLeads,
  updateLead,
  getProfile,
  updateProfile,
  getAdminOverview,
} from "../src/lib/repository";

const directory = path.join(process.cwd(), "work", `test-${randomUUID()}`);
mkdirSync(directory, { recursive: true });
process.env.DATABASE_PATH = path.join(directory, "test.sqlite");
process.env.BETTER_AUTH_SECRET = randomBytes(32).toString("hex");
process.env.BETTER_AUTH_URL = "http://localhost:3000";

const localized = { en: "Test title", fa: "عنوان آزمایشی" };
let ownerId = "";
let strangerId = "";
let adminCookie = "";
let userCookie = "";

before(async () => {
  const { auth } = await import("../src/lib/auth");
  const { getMigrations } = await import("better-auth/db/migration");
  await (await getMigrations(auth.options)).runMigrations();
  migrateDomain();
  for (const [index, email] of [
    "owner@example.test",
    "stranger@example.test",
    "admin@example.test",
  ].entries()) {
    const body = {
      name: `Test ${index}`,
      email,
      password: "ValidTestPassword-2049",
      role: "ADMIN",
    };
    const result = await auth.api.signUpEmail({ body });
    assert.equal(
      getProfile(result.user.id)?.role,
      "USER",
      "a browser-supplied role must never create an administrator",
    );
    if (index === 0) ownerId = result.user.id;
    if (index === 1) strangerId = result.user.id;
    if (index === 2)
      getDb()
        .prepare("UPDATE \"user\" SET role='ADMIN' WHERE id=?")
        .run(result.user.id);
    const response = await auth.api.signInEmail({
      body: { email, password: body.password },
      asResponse: true,
    });
    const cookie = response.headers
      .getSetCookie()
      .map((entry) => entry.split(";")[0])
      .join("; ");
    if (index === 0) userCookie = cookie;
    if (index === 2) adminCookie = cookie;
  }
});
after(() => {
  getDb().close();
  rmSync(directory, { recursive: true, force: true });
});

test("migrations are repeatable and tracked", () => {
  migrateDomain();
  assert.equal(
    (
      getDb()
        .prepare("SELECT COUNT(*) AS count FROM schema_migration")
        .get() as { count: number }
    ).count,
    1,
  );
});

test("Better Auth ISO timestamps are represented correctly in profiles and registration analytics", () => {
  const profile = getProfile(ownerId)!;
  assert.ok(Math.abs(Date.parse(profile.createdAt) - Date.now()) < 60000);
  const registrations = getAdminOverview().registrationSeries;
  assert.equal(
    registrations.reduce((total, day) => total + day.count, 0),
    3,
  );
});

test("lead validation rejects missing contact, invalid service and injected fields", () => {
  const valid = {
    name: "Client",
    email: "hello@example.test",
    service: "seo",
    message: "We need a considered search strategy for our website.",
  };
  assert.equal(leadSchema.safeParse(valid).success, true);
  assert.equal(
    leadSchema.safeParse({ ...valid, email: "", contactMethod: "email" })
      .success,
    false,
  );
  assert.equal(
    leadSchema.safeParse({ ...valid, role: "ADMIN" }).success,
    false,
  );
  assert.equal(
    leadSchema.safeParse({ ...valid, service: "unknown" }).success,
    false,
  );
  assert.equal(
    leadSchema.safeParse({ ...valid, website: "spam" }).success,
    false,
  );
});

test("project reads and downloads enforce ownership", () => {
  const project = createProject(
    projectSchema.parse({
      clientId: ownerId,
      title: localized,
      description: localized,
      serviceIds: ["seo"],
      stage: localized,
      startDate: "2026-10-01",
      deadline: "2026-11-01",
      notes: "Internal staff-only strategy review",
    }),
  );
  const deliverableId = createDeliverable(project.id, {
    title: localized,
    filename: "strategy.txt",
    content: "Private client strategy",
  });
  assert.equal(getProject(project.id, strangerId), null);
  assert.equal(getProject(project.id), null);
  assert.equal(getProject(project.id, ownerId)?.id, project.id);
  assert.equal(getProject(project.id, undefined, true)?.id, project.id);
  assert.equal(listProjects({ userId: strangerId }).length, 0);
  assert.equal(getAuthorizedDeliverable(deliverableId, strangerId), null);
  assert.equal(
    getAuthorizedDeliverable(deliverableId, ownerId)?.content,
    "Private client strategy",
  );
  assert.equal(
    deliverableSchema.safeParse({
      title: localized,
      filename: "../../secret.txt",
      content: "x",
    }).success,
    false,
  );
});

test("draft blog content is excluded from public lookup and listing", () => {
  const post = createBlogPost(
    blogSchema.parse({
      slug: "test-article",
      title: localized,
      excerpt: localized,
      content: localized,
      category: localized,
      author: "Salsal",
      seoTitle: localized,
      seoDescription: localized,
    }),
  );
  assert.equal(getBlogPost(post.slug, { publishedOnly: true }), null);
  assert.equal(listBlogPosts({ publishedOnly: true }).length, 0);
  assert.equal(getBlogPost(post.id)?.published, false);
  updateBlogPost(post.id, { published: true });
  assert.equal(getBlogPost(post.slug, { publishedOnly: true })?.id, post.id);
  updateBlogPost(post.id, { published: false });
  assert.equal(getBlogPost(post.slug, { publishedOnly: true }), null);
  assert.equal(listBlogPosts({ publishedOnly: true }).length, 0);
});

test("lead workflow and admin counts use persisted application records", () => {
  const lead = createLead(
    leadSchema.parse({
      name: "Prospective client",
      email: "hello@example.test",
      service: "seo",
      message: "We need a considered search strategy for our website.",
    }),
  );
  updateLead(lead.id, "qualified", "Discovery call complete");
  assert.equal(
    listLeads({ status: "qualified" })[0].notes,
    "Discovery call complete",
  );
  assert.equal(getAdminOverview().stats.leads, 1);
});

test("rate limit persists counters and denies calls past allowance", () => {
  assert.equal(consumeRateLimit("test", 2), true);
  assert.equal(consumeRateLimit("test", 2), true);
  assert.equal(consumeRateLimit("test", 2), false);
});

test("profile update accepts only the selected account and exposes no password data", async () => {
  const profile = updateProfile(ownerId, {
    name: "Updated owner",
    company: "Example",
    phone: "12345",
    locale: "fa",
  });
  assert.equal(profile?.name, "Updated owner");
  assert.equal(profile?.role, "USER");
  assert.equal("password" in (profile || {}), false);
  assert.equal(getProfile(strangerId)?.name, "Test 1");
  const { PATCH } = await import("../src/app/api/profile/route");
  const injection = await PATCH(
    new Request("http://localhost:3000/api/profile", {
      method: "PATCH",
      headers: { cookie: userCookie, "content-type": "application/json" },
      body: JSON.stringify({
        name: "Updated owner",
        role: "ADMIN",
        id: strangerId,
        email: "changed@example.test",
        password: "new-password",
      }),
    }),
  );
  assert.equal(injection.status, 400);
  assert.equal(getProfile(ownerId)?.role, "USER");
  assert.equal(getProfile(ownerId)?.email, "owner@example.test");
});

test("admin API independently denies anonymous and regular users", async () => {
  const { GET } = await import("../src/app/api/admin/users/route");
  assert.equal(
    (await GET(new Request("http://localhost:3000/api/admin/users"))).status,
    401,
  );
  assert.equal(
    (
      await GET(
        new Request("http://localhost:3000/api/admin/users", {
          headers: { cookie: userCookie },
        }),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await GET(
        new Request("http://localhost:3000/api/admin/users", {
          headers: { cookie: adminCookie },
        }),
      )
    ).status,
    200,
  );
});

test("authenticated writes reject a cross-origin request", async () => {
  const { PATCH } = await import("../src/app/api/profile/route");
  const response = await PATCH(
    new Request("http://localhost:3000/api/profile", {
      method: "PATCH",
      headers: {
        cookie: userCookie,
        "content-type": "application/json",
        origin: "https://untrusted.example",
      },
      body: JSON.stringify({ name: "Attacker" }),
    }),
  );
  assert.equal(response.status, 403);
});

test("project and file HTTP routes return 404 for another user's resources", async () => {
  const { auth } = await import("../src/lib/auth");
  const response = await auth.api.signInEmail({
    body: {
      email: "stranger@example.test",
      password: "ValidTestPassword-2049",
    },
    asResponse: true,
  });
  const cookie = response.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .join("; ");
  const project = listProjects({ userId: ownerId })[0];
  const { GET: getProjectRoute } =
    await import("../src/app/api/projects/[id]/route");
  const { GET: getFileRoute } =
    await import("../src/app/api/deliverables/[id]/route");
  assert.equal(
    (
      await getProjectRoute(
        new Request(`http://localhost:3000/api/projects/${project.id}`, {
          headers: { cookie },
        }),
        { params: Promise.resolve({ id: project.id }) },
      )
    ).status,
    404,
  );
  const ownerResponse = await getProjectRoute(
    new Request(`http://localhost:3000/api/projects/${project.id}`, {
      headers: { cookie: userCookie },
    }),
    { params: Promise.resolve({ id: project.id }) },
  );
  const adminResponse = await getProjectRoute(
    new Request(`http://localhost:3000/api/projects/${project.id}`, {
      headers: { cookie: adminCookie },
    }),
    { params: Promise.resolve({ id: project.id }) },
  );
  assert.equal(ownerResponse.status, 200);
  assert.equal(
    ((await ownerResponse.json()) as { project: { notes: string } }).project
      .notes,
    "",
  );
  assert.equal(
    ((await adminResponse.json()) as { project: { notes: string } }).project
      .notes,
    "Internal staff-only strategy review",
  );
  assert.equal(
    (
      await getFileRoute(
        new Request(
          `http://localhost:3000/api/deliverables/${project.deliverables[0].id}`,
          { headers: { cookie } },
        ),
        { params: Promise.resolve({ id: project.deliverables[0].id }) },
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await getFileRoute(
        new Request(
          `http://localhost:3000/api/deliverables/${project.deliverables[0].id}`,
          { headers: { cookie: userCookie } },
        ),
        { params: Promise.resolve({ id: project.deliverables[0].id }) },
      )
    ).status,
    200,
  );
});

test("an existing session loses admin API access immediately after demotion", async () => {
  const { GET } = await import("../src/app/api/admin/users/route");
  getDb()
    .prepare("UPDATE \"user\" SET role='USER' WHERE email=?")
    .run("admin@example.test");
  assert.equal(
    (
      await GET(
        new Request("http://localhost:3000/api/admin/users", {
          headers: { cookie: adminCookie },
        }),
      )
    ).status,
    403,
  );
});

test("service assignments require admin and stay scoped to the selected customer", async () => {
  getDb()
    .prepare("UPDATE \"user\" SET role='ADMIN' WHERE email=?")
    .run("admin@example.test");
  const { POST } =
    await import("../src/app/api/admin/users/[id]/services/route");
  const { PATCH } =
    await import("../src/app/api/admin/users/[id]/services/[serviceId]/route");
  const input = {
    serviceSlug: "seo",
    package: localized,
    status: "active",
    startDate: "2026-10-01",
    endDate: "2027-01-01",
    progress: 10,
    team: "Studio",
    latestUpdate: localized,
  };
  const request = (cookie: string, body: unknown = input, method = "POST") =>
    new Request(`http://localhost:3000/api/admin/users/${ownerId}/services`, {
      method,
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  assert.equal(
    (await POST(request(""), { params: Promise.resolve({ id: ownerId }) }))
      .status,
    401,
  );
  assert.equal(
    (
      await POST(request(userCookie), {
        params: Promise.resolve({ id: ownerId }),
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await POST(request(adminCookie, { ...input, userId: strangerId }), {
        params: Promise.resolve({ id: ownerId }),
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await POST(request(adminCookie, { ...input, endDate: "2026-09-01" }), {
        params: Promise.resolve({ id: ownerId }),
      })
    ).status,
    400,
  );
  const response = await POST(request(adminCookie), {
    params: Promise.resolve({ id: ownerId }),
  });
  assert.equal(response.status, 201);
  const { service } = (await response.json()) as {
    service: { id: string; userId: string; isDemo: boolean };
  };
  assert.equal(service.userId, ownerId);
  assert.equal(service.isDemo, false);
  assert.equal(
    (
      await PATCH(request("", { progress: 40 }, "PATCH"), {
        params: Promise.resolve({ id: ownerId, serviceId: service.id }),
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await PATCH(request(userCookie, { progress: 40 }, "PATCH"), {
        params: Promise.resolve({ id: ownerId, serviceId: service.id }),
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await PATCH(request(adminCookie, { progress: 40 }, "PATCH"), {
        params: Promise.resolve({ id: strangerId, serviceId: service.id }),
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await PATCH(request(adminCookie, { startDate: "2028-01-01" }, "PATCH"), {
        params: Promise.resolve({ id: ownerId, serviceId: service.id }),
      })
    ).status,
    400,
  );
  const update = await PATCH(request(adminCookie, { progress: 40 }, "PATCH"), {
    params: Promise.resolve({ id: ownerId, serviceId: service.id }),
  });
  assert.equal(update.status, 200);
  assert.equal(
    ((await update.json()) as { service: { progress: number } }).service
      .progress,
    40,
  );
});
