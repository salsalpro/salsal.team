import { richDocumentSchema } from "../src/lib/article-content";
import { test as base, expect, type Page } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";
import { query, closeDb } from "../src/lib/db";
const test = base.extend<{ runtimeErrors: string[] }>({
  runtimeErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (
          message.type() === "error" &&
          /hydration|hydrating|uncaught|react error/i.test(message.text())
        )
          errors.push(message.text());
      });
      await use(errors);
      expect(errors, "No browser runtime or hydration errors").toEqual([]);
    },
    { auto: true },
  ],
});
type TestAccount = {
  email: string;
  password: string;
  role: string;
  id: string;
};
let admin: TestAccount;
let client: TestAccount;
test.beforeAll(() => {
  const accounts: TestAccount[] = JSON.parse(
    readFileSync("work/e2e-credentials.json", "utf8"),
  ).accounts;
  admin = accounts.find((account) => account.role === "ADMIN")!;
  client = accounts.find((account) => account.role === "USER")!;
});
test.afterAll(closeDb);
const slugs = [
  "digital-marketing",
  "instagram-marketing",
  "social-media",
  "seo",
  "web-development",
  "wordpress",
  "video-editing",
  "videography",
  "photography",
];
async function signIn(page: Page, account = client) {
  await page.goto("/en/login");
  await page.getByLabel("Email address", { exact: true }).fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  const submit = async () => {
    const response = page.waitForResponse(
      (result) =>
        result.url().endsWith("/api/auth/sign-in/email") &&
        result.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    return response;
  };
  let response = await submit();
  if (response.status() === 429) {
    // The production sign-in guard permits three attempts per ten seconds.
    // Honor its cooldown when independent workflows share this test server.
    const retryAfter = Number(response.headers()["x-retry-after"]);
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(10);
    await new Promise((resolve) =>
      setTimeout(resolve, retryAfter * 1000 + 100),
    );
    response = await submit();
  }
  expect(response.status(), "Seeded account sign-in succeeds").toBe(200);
  await expect(page).toHaveURL(
    account.role === "ADMIN" ? /\/en\/admin$/ : /\/en\/dashboard$/,
  );
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
}
test("English and Persian public routes, metadata, content and mobile layouts", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const locale of ["en", "fa"]) {
    await page.goto(`/${locale}`);
    await expect(page.locator("html")).toHaveAttribute(
      "dir",
      locale === "fa" ? "rtl" : "ltr",
    );
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new RegExp(`/${locale}$`),
    );
    await noOverflow(page);
    for (const route of [
      "services",
      "portfolio",
      "blog",
      "about",
      "contact",
      ...slugs.map((s) => `services/${s}`),
      "portfolio/forma-brand-experience",
      "blog/before-you-measure-decide-what-matters",
    ]) {
      const response = await page.goto(`/${locale}/${route}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toBeVisible();
      await noOverflow(page);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}`);
    await noOverflow(page);
    mkdirSync("work/screenshots", { recursive: true });
    await page.screenshot({
      path: `work/screenshots/home-${locale}-mobile.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({
      path: `work/screenshots/home-${locale}-desktop.png`,
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
  const sitemap = await page.request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain('hreflang="fa"');
  expect((await page.request.get("/robots.txt")).status()).toBe(200);
});
test("locale switching preserves route and service inquiry; mobile navigation works", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/contact?service=seo");
  await page.getByRole("link", { name: "تغییر زبان به فارسی" }).click();
  await expect(page).toHaveURL("/fa/contact?service=seo");
  await expect(page.locator("#service")).toHaveValue("seo");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await noOverflow(page);
  await page.getByRole("button", { name: "باز کردن منو", exact: true }).click();
  await expect(page.locator("#mobile-nav")).toBeVisible();
  await page
    .locator("#mobile-nav")
    .getByRole("link", { name: "تخصص‌های ما" })
    .click();
  await expect(page).toHaveURL("/fa/services");
  await expect(page.locator("#mobile-nav")).toBeHidden();
});
test("contact validation, loading, success and persisted admin lead workflow", async ({
  page,
}) => {
  await page.goto("/en/contact");
  await page.getByRole("button", { name: "Send project inquiry" }).click();
  await expect(page.locator('.form-error[role="alert"]')).toContainText(
    "check",
  );
  await page.getByLabel("Full name").fill("Browser Test Inquiry");
  await page.getByLabel("Email address").fill("browser-inquiry@example.test");
  await page.getByLabel("What can we help with?").selectOption("seo");
  await page
    .getByLabel("Tell us a little more")
    .fill(
      "We would like a clear SEO strategy for our new bilingual business website.",
    );
  await page.route("**/api/leads", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.continue();
  });
  await page.getByRole("button", { name: "Send project inquiry" }).click();
  await expect(
    page.getByRole("button", { name: "Sending your inquiry…" }),
  ).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("has been received");
  await page.unroute("**/api/leads");
  await signIn(page, admin);
  await page.goto("/en/admin/leads");
  await page
    .getByRole("link", { name: "Browser Test Inquiry", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Browser Test Inquiry", exact: true }),
  ).toBeVisible();
  const editor = page
    .locator("form")
    .filter({ has: page.getByLabel("Internal notes") });
  await editor
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("qualified");
  await editor
    .getByLabel("Internal notes")
    .fill("Consultation reviewed during isolated browser test.");
  await expect(
    editor.getByRole("combobox", { name: "Status", exact: true }),
  ).toHaveValue("qualified");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Changes saved");
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Status", exact: true }),
  ).toHaveValue("qualified");
});
test("signup, empty account, server role enforcement and cross-account isolation", async ({
  page,
}) => {
  await page.goto("/en/dashboard");
  await expect(page).toHaveURL("/en/login");
  await page.goto("/fa/admin");
  await expect(page).toHaveURL("/fa/login");
  await page.goto("/en/login");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByLabel("Full name").fill("Browser Empty Account");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("browser-empty@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("BrowserSecurePassword2026!");
  await page.getByLabel("Confirm password").fill("BrowserSecurePassword2026!");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page).toHaveURL("/en/dashboard");
  await expect(
    page.getByText("A new project starts here.").first(),
  ).toBeVisible();
  await page.goto("/en/admin");
  await expect(page).toHaveURL("/en/dashboard");
  expect((await page.request.get("/api/admin/users")).status()).toBe(403);
  const project = (
    await query(
      "SELECT p.id FROM project p JOIN deliverable d ON d.project_id=p.id WHERE p.client_id=$1 ORDER BY p.id LIMIT 1",
      [client.id],
    )
  ).rows[0] as { id: string };
  const file = (
    await query("SELECT id FROM deliverable WHERE project_id=$1 LIMIT 1", [
      project.id,
    ])
  ).rows[0] as { id: string };
  expect((await page.request.get(`/api/projects/${project.id}`)).status()).toBe(
    404,
  );
  expect(
    (await page.request.get(`/api/deliverables/${file.id}`)).status(),
  ).toBe(404);
  await page.goto(`/en/dashboard/projects/${project.id}`);
  await expect(
    page.getByText("This page has moved beyond the frame."),
  ).toBeVisible();
});
test("customer routes, private file download, profile, RTL dashboard and signout", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await signIn(page);
  for (const section of [
    "",
    "services",
    "projects",
    "reports",
    "deliverables",
    "profile",
  ]) {
    await page.goto(`/en/dashboard${section ? "/" + section : ""}`);
    await expect(page.locator("h1")).toBeVisible();
    await noOverflow(page);
  }
  await page
    .getByLabel("Company", { exact: true })
    .fill("Browser Verified Company");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toContainText("Changes saved");
  await page.reload();
  await expect(page.getByLabel("Company", { exact: true })).toHaveValue(
    "Browser Verified Company",
  );
  await page.goto("/en/dashboard/deliverables");
  const href = await page
    .getByRole("link", { name: "Open file" })
    .first()
    .getAttribute("href");
  const file = await page.request.get(href!);
  expect(file.status()).toBe(200);
  expect(file.headers()["content-disposition"]).toContain("attachment");
  expect(await file.text()).toContain("DEMONSTRATION");
  await page.goto("/en/dashboard");
  await page.screenshot({
    path: "work/screenshots/customer-en-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/fa/dashboard");
  await noOverflow(page);
  await page.screenshot({
    path: "work/screenshots/customer-fa-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "باز کردن فهرست" }).click();
  await expect(page.locator(".workspace-sidebar")).toBeVisible();
  await page
    .locator(".workspace-nav")
    .getByRole("link", { name: "پروژه‌ها", exact: true })
    .click();
  await expect(page).toHaveURL("/fa/dashboard/projects");
  await noOverflow(page);
  await page.goto("/en/dashboard");
  await page.locator(".workspace-account-menu summary").click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/en/login");
  expect((await page.request.get("/api/profile")).status()).toBe(401);
  expect(errors).toEqual([]);
});
test("admin routes, user search, single-language article create, publish and unpublish", async ({
  page,
}, testInfo) => {
  const slug = `browser-editorial-test-${testInfo.repeatEachIndex}`;
  const title = `Browser editorial test ${testInfo.repeatEachIndex}`;
  await signIn(page, admin);
  for (const section of [
    "",
    "users",
    "leads",
    "projects",
    "services",
    "blog",
    "portfolio",
  ]) {
    const r = await page.goto(`/en/admin${section ? "/" + section : ""}`);
    expect(r?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    await noOverflow(page);
  }
  await page.goto("/en/admin/users");
  await page.getByLabel("Search name or email").fill(client.email);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.goto("/en/admin/blog/new");
  await page.getByLabel("Article language", { exact: true }).selectOption("en");
  for (const [name, value] of Object.entries({
    title,
    slug,
    excerpt: "A browser-created article for testing publication.",
    category: "Strategy",
  }))
    await page.locator(`[name="${name}"]`).fill(value);
  await page
    .getByRole("textbox", { name: "Article body", exact: true })
    .fill(
      "A complete test article written to verify the real administration flow.",
    );
  await page
    .getByRole("button", { name: "Create article", exact: true })
    .click();
  await expect(page).toHaveURL("/en/admin/blog");
  expect((await page.request.get(`/en/blog/${slug}`)).status()).toBe(404);
  await page.getByRole("link", { name: title, exact: true }).click();
  await page
    .getByLabel("Publication status", { exact: true })
    .selectOption("published");
  await expect(
    page.getByLabel("Publication status", { exact: true }),
  ).toHaveValue("published");
  const publication = page.waitForResponse(
    (response) =>
      response.url().includes("/api/admin/blog/") &&
      response.request().method() === "PATCH",
  );
  await page.getByRole("button", { name: "Save changes" }).click();
  const published = await publication;
  expect(published.status()).toBe(200);
  expect((await published.json()).post.published).toBe(true);
  await expect(page.locator(".workspace-form-feedback.success")).toContainText(
    "Changes saved",
  );
  expect((await page.request.get(`/en/blog/${slug}`)).status()).toBe(200);
  expect((await page.request.get(`/fa/blog/${slug}`)).status()).toBe(404);
  await page
    .getByLabel("Publication status", { exact: true })
    .selectOption("unpublished");
  const unpublication = page.waitForResponse(
    (response) =>
      response.url().includes("/api/admin/blog/") &&
      response.request().method() === "PATCH",
  );
  await page.getByRole("button", { name: "Save changes" }).click();
  const unpublished = await unpublication;
  expect(unpublished.status()).toBe(200);
  expect((await unpublished.json()).post.published).toBe(false);
  await expect(page.locator(".workspace-form-feedback.success")).toContainText(
    "Changes saved",
  );
  expect((await page.request.get(`/en/blog/${slug}`)).status()).toBe(404);
  const id = (await published.json()).post.id;
  expect(
    (
      await page.request.delete(`/api/admin/blog/${id}`, {
        headers: { origin: "http://localhost:3100" },
      })
    ).status(),
  ).toBe(200);
});
test("admin project creation, milestones, deliverable and service visibility", async ({
  page,
}) => {
  await signIn(page, admin);
  await page.goto("/en/admin/projects/new");
  for (const [name, value] of Object.entries({
    titleEn: "Browser project",
    titleFa: "پروژه مرورگر",
    descriptionEn: "A browser-created client project.",
    descriptionFa: "پروژه مشتری ساخته‌شده با مرورگر.",
    stageEn: "Discovery",
    stageFa: "شناخت",
    startDate: "2026-10-02",
    deadline: "2026-11-02",
    progress: "12",
  }))
    await page.locator(`[name="${name}"]`).fill(value);
  await page.locator('[name="clientId"]').selectOption(client.id);
  await page.locator('[name="serviceIds"][value="seo"]').check();
  await page.getByRole("button", { name: "Add milestone" }).click();
  await page.getByLabel("Milestone · English").fill("Research");
  await page.getByLabel("Milestone · فارسی").fill("پژوهش");
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(page).toHaveURL("/en/admin/projects");
  await page
    .getByRole("link", { name: "Browser project", exact: true })
    .click();
  await expect(page.getByLabel("Milestone · English")).toHaveValue("Research");
  await page.goto("/en/admin/services");
  const form = page.locator("form").filter({ hasText: "Photography" });
  await form.getByLabel("Visible on website").uncheck();
  await form.getByRole("button", { name: "Save changes" }).click();
  await expect(form.getByRole("status")).toContainText("Changes saved");
  expect((await page.request.get("/en/services/photography")).status()).toBe(
    404,
  );
  expect(await (await page.request.get("/en")).text()).not.toContain(
    'href="/en/services/photography"',
  );
  expect(await (await page.request.get("/en/contact")).text()).not.toContain(
    'value="photography"',
  );
  await form.getByLabel("Visible on website").check();
  await form.getByRole("button", { name: "Save changes" }).click();
  await expect(form.getByRole("status")).toContainText("Changes saved");
  expect((await page.request.get("/en/services/photography")).status()).toBe(
    200,
  );
  await page.goto("/en/admin");
  await page.screenshot({
    path: "work/screenshots/admin-en-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/fa/admin");
  await noOverflow(page);
  await page.screenshot({
    path: "work/screenshots/admin-fa-tablet.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/fa/admin/leads");
  await noOverflow(page);
  await page.screenshot({
    path: "work/screenshots/admin-fa-mobile.png",
    fullPage: true,
  });
});
test("contact server failure state and unknown routes have useful recovery", async ({
  page,
}) => {
  await page.goto("/en/contact");
  await page.getByLabel("Full name").fill("Error State");
  await page.getByLabel("Email address").fill("error@example.test");
  await page.getByLabel("What can we help with?").selectOption("seo");
  await page
    .getByLabel("Tell us a little more")
    .fill("A valid message that exercises the server failure feedback.");
  await page.route("**/api/leads", (route) =>
    route.fulfill({ status: 503, contentType: "application/json", body: "{}" }),
  );
  await page.getByRole("button", { name: "Send project inquiry" }).click();
  await expect(page.locator('.form-error[role="alert"]')).toContainText(
    "couldn’t save",
  );
  await expect(
    page.getByRole("button", { name: "Send project inquiry" }),
  ).toBeEnabled();
  await page.goto("/en/services/nonexistent");
  await expect(page.getByRole("link", { name: "Back to home" })).toBeVisible();
});
test("sign-in explains rate limits and server failures in both languages", async ({
  page,
}) => {
  let status = 429;
  await page.route("**/api/auth/sign-in/email", (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Authentication temporarily unavailable.",
      }),
    }),
  );
  for (const locale of ["en", "fa"]) {
    await page.goto(`/${locale}/login`);
    await page.locator('[name="email"]').fill("test@example.test");
    await page.locator('[name="password"]').fill("UnusedTestPassword2026!");
    status = 429;
    await page.locator('button[type="submit"]').click();
    const alert = page.locator('.form-error[role="alert"]');
    await expect(alert).toContainText(
      locale === "en" ? "Too many attempts" : "تعداد تلاش‌ها زیاد است",
    );
    status = 503;
    await page.locator('button[type="submit"]').click();
    await expect(alert).not.toContainText(
      locale === "en" ? "Too many attempts" : "تعداد تلاش‌ها زیاد است",
    );
    await expect(alert).not.toContainText(
      locale === "en" ? "incorrect" : "صحیح نیست",
    );
    await expect(alert).toBeVisible();
  }
});
test("admin assignments, deliverable creation and portfolio edits reach the right views", async ({
  page,
}) => {
  await signIn(page, admin);
  await page.goto(`/en/admin/users/${client.id}`);
  await page
    .getByRole("button", { name: "+ Assign a service", exact: true })
    .click();
  const assignment = page.locator(".workspace-assignment-new form");
  await assignment.locator('[name="serviceSlug"]').selectOption("photography");
  for (const [name, value] of Object.entries({
    packageEn: "Browser production package",
    packageFa: "بسته تولید مرورگر",
    startDate: "2026-10-03",
    endDate: "2026-11-03",
    updateEn: "Initial production scope agreed.",
    updateFa: "دامنه اولیه تولید تأیید شد.",
  }))
    await assignment.locator(`[name="${name}"]`).fill(value);
  await assignment
    .getByRole("button", { name: "Assign a service", exact: true })
    .click();
  await expect(
    page.getByText("Browser production package", { exact: true }),
  ).toBeVisible();
  const project = (
    await query(
      "SELECT id FROM project WHERE client_id=$1 AND is_demo=1 LIMIT 1",
      [client.id],
    )
  ).rows[0] as { id: string };
  await page.goto(`/en/admin/projects/${project.id}`);
  const delivery = page
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "Add deliverable" }) });
  await delivery.locator('[name="titleEn"]').fill("Browser private brief");
  await delivery.locator('[name="titleFa"]').fill("خلاصه خصوصی مرورگر");
  await delivery.locator('[name="filename"]').fill("unsafe/file.txt");
  expect(
    await delivery
      .locator('[name="filename"]')
      .evaluate((input: HTMLInputElement) => input.validity.patternMismatch),
  ).toBe(true);
  await delivery.locator('[name="filename"]').fill("browser-private-brief.txt");
  await delivery
    .locator('[name="content"]')
    .fill("Authorized client-only browser test brief.");
  await delivery.getByRole("button", { name: "Add deliverable" }).click();
  await expect(delivery.getByRole("status")).toContainText("Changes saved");
  await expect(
    page.getByText("Browser private brief", { exact: true }),
  ).toBeVisible();
  await page.goto("/en/admin/portfolio/new");
  for (const [name, value] of Object.entries({
    titleEn: "Browser portfolio story",
    titleFa: "نمونه کار مرورگر",
    slug: "browser-portfolio-story",
    client: "Browser Brand",
    industryEn: "Design",
    industryFa: "طراحی",
    challengeEn: "A clear and authentic customer journey.",
    challengeFa: "مسیر روشن برای مشتریان.",
    approachEn: "Research the audience and define a shared brief.",
    approachFa: "پژوهش مخاطب و تعریف بریف مشترک.",
    solutionEn: "A coherent bilingual website.",
    solutionFa: "وب‌سایت دو زبانه و منسجم.",
    resultEn: "A test concept with no claimed business results.",
    resultFa: "طرح آزمایشی بدون ادعای نتایج تجاری.",
    date: "2026-10-03",
  }))
    await page.locator(`[name="${name}"]`).fill(value);
  await page.locator('[name="services"][value="web-development"]').check();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL("/en/admin/portfolio");
  await page.goto("/fa/portfolio/browser-portfolio-story");
  await expect(page.locator("h1")).toHaveText("نمونه کار مرورگر");
  await expect(
    page.getByText("Browser Brand", { exact: true }).first(),
  ).toBeVisible();
  await page.context().clearCookies();
  await signIn(page);
  await page.goto("/en/dashboard/services");
  await expect(
    page.getByText("Browser production package", { exact: true }),
  ).toBeVisible();
  await page.goto("/en/dashboard/deliverables");
  const row = page.locator("tr").filter({ hasText: "Browser private brief" });
  const href = await row
    .getByRole("link", { name: "Open file" })
    .getAttribute("href");
  expect(await (await page.request.get(href!)).text()).toBe(
    "Authorized client-only browser test brief.",
  );
});

test("rich Persian and English drafts persist through reload, edit, SEO, preview and publication", async ({
  page,
  context,
}) => {
  test.setTimeout(120000);
  await signIn(page, admin);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  for (const language of ["fa", "en"] as const) {
    const title =
      language === "fa"
        ? "مقاله فارسی برای بررسی کامل مدیریت محتوا"
        : "Rich English publishing workflow";
    const slug = `rich-browser-${language}`;
    await page.goto("/en/admin/blog/new");
    await page.getByLabel("Article title", { exact: true }).fill(title);
    await expect(
      page.getByText(
        `Detected language: ${language === "fa" ? "فارسی" : "English"}`,
        { exact: false },
      ),
    ).toBeVisible();
    await page
      .getByLabel("Article language", { exact: true })
      .selectOption(language);
    await page.getByLabel("URL slug", { exact: true }).fill(slug);
    await page.getByLabel("Excerpt", { exact: true }).fill(title + " excerpt");
    await page.getByLabel("Category", { exact: true }).fill("Editorial");
    await page
      .getByLabel("Tags (comma separated)", { exact: true })
      .fill("Growth, SEO");
    const body = page.getByRole("textbox", {
      name: "Article body",
      exact: true,
    });
    await expect(body).toHaveAttribute(
      "dir",
      language === "fa" ? "rtl" : "ltr",
    );
    const html = `<h2>${title}</h2><p><strong>Bold</strong> <em>Italic</em> <u>Underline</u> <s>Strike</s> <a href="/en/blog">Internal link</a> <a href="https://example.test/">External link</a></p><ul><li>Bullet item</li></ul><ol><li>Numbered item</li></ol><blockquote><p>Editorial quotation</p></blockquote><pre><code>const value = 42;</code></pre><hr><table><tbody><tr><th>Header</th><td>Persistent cell</td></tr></tbody></table>`;
    await page.evaluate(
      async ({ html, title }) => {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([title], { type: "text/plain" }),
          }),
        ]);
      },
      { html, title },
    );
    await body.click();
    await page.keyboard.press("Control+V");
    await expect(body.locator("table")).toBeVisible();
    await expect(body.locator("strong")).toHaveText("Bold");
    const actualDocument = await body.evaluate((element) =>
      (
        element as HTMLElement & { editor: { getJSON(): unknown } }
      ).editor.getJSON(),
    );
    expect(
      richDocumentSchema.safeParse(actualDocument).success,
      JSON.stringify(actualDocument),
    ).toBe(true);
    await page.getByText("SEO and sharing", { exact: true }).click();
    for (const [name, value] of Object.entries({
      seoTitle: title + " SEO",
      seoDescription: "A persisted description for search engines.",
      focusKeyphrase: "Editorial",
      secondaryKeyphrases: "SEO, Growth",
      canonical: `http://localhost:3100/${language}/blog/${slug}`,
      ogTitle: "Social preview title",
      ogDescription: "Social preview description",
      twitterTitle: "X preview title",
      twitterDescription: "X preview description",
    }))
      await page.locator(`[name="${name}"]`).fill(value);
    await page
      .getByRole("button", { name: "Preview article", exact: true })
      .click();
    await expect(
      page
        .getByRole("region", { name: "Preview article", exact: true })
        .locator("table"),
    ).toBeVisible();
    await expect(
      page.getByText("Unsaved changes", { exact: true }),
    ).toBeVisible();
    for (const width of [320, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await noOverflow(page);
    }
    await page.screenshot({
      path: `work/screenshots/cms-${language}-editor.png`,
      fullPage: true,
    });
    const created = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/admin/blog") && r.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: "Create article", exact: true })
      .click();
    const response = await created;
    expect(response.status()).toBe(201);
    const { post } = await response.json();
    await expect(page).toHaveURL("/en/admin/blog");
    await page.goto(`/en/admin/blog/${post.id}`);
    await expect(
      page.getByLabel("Article language", { exact: true }),
    ).toHaveValue(language);
    await expect(page.getByLabel("Article title", { exact: true })).toHaveValue(
      title,
    );
    await expect(
      page
        .getByRole("textbox", { name: "Article body", exact: true })
        .locator("table"),
    ).toBeVisible();
    await expect(
      page.getByLabel("Tags (comma separated)", { exact: true }),
    ).toHaveValue("Growth, SEO");
    await page.getByText("SEO and sharing", { exact: true }).click();
    await expect(page.locator('[name="ogTitle"]')).toHaveValue(
      "Social preview title",
    );
    await expect(page.locator('[name="secondaryKeyphrases"]')).toHaveValue(
      "SEO, Growth",
    );
    await page
      .locator('[name="seoDescription"]')
      .fill("Edited persisted description.");
    await page
      .getByLabel("Publication status", { exact: true })
      .selectOption("published");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(
      page.locator(".workspace-form-feedback.success"),
    ).toBeVisible();
    await page.reload();
    await page.getByText("SEO and sharing", { exact: true }).click();
    await expect(page.locator('[name="seoDescription"]')).toHaveValue(
      "Edited persisted description.",
    );
    const persisted = (
      await query<{
        editorial: Record<
          "fa" | "en",
          { document: { content: { type: string }[] } }
        >;
        primary_language: string;
        published: number;
      }>(
        "SELECT editorial,primary_language,published FROM blog_post WHERE id=$1",
        [post.id],
      )
    ).rows[0];
    expect(persisted.primary_language).toBe(language);
    expect(persisted.published).toBe(1);
    expect(
      persisted.editorial[language].document.content.some(
        (n: { type: string }) => n.type === "table",
      ),
    ).toBe(true);
    const publicResponse = await page.goto(`/${language}/blog/${slug}`);
    expect(publicResponse?.status()).toBe(200);
    await expect(page.locator("article")).toHaveAttribute(
      "dir",
      language === "fa" ? "rtl" : "ltr",
    );
    await expect(page.locator("article table")).toBeVisible();
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "Edited persisted description.",
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "Social preview title",
    );
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
      "content",
      "X preview title",
    );
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(
      1,
    );
    const jsonLd = JSON.parse(
      (await page
        .locator('script[type="application/ld+json"]')
        .textContent()) || "{}",
    );
    expect(jsonLd.inLanguage).toBe(language);
    expect(
      (
        await page.request.get(
          `/${language === "fa" ? "en" : "fa"}/blog/${slug}`,
        )
      ).status(),
    ).toBe(404);
    const sitemap = await (await page.request.get("/sitemap.xml")).text();
    expect(sitemap).toContain(`http://localhost:3100/${language}/blog/${slug}`);
    expect(sitemap).not.toContain(
      `/${language === "fa" ? "en" : "fa"}/blog/${slug}`,
    );
    await page.goto(`/en/admin/blog/${post.id}`);
    await page.getByText("SEO and sharing", { exact: true }).click();
    await page
      .getByLabel("Exclude from search indexing", { exact: true })
      .check();
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(
      page.locator(".workspace-form-feedback.success"),
    ).toBeVisible();
    await page.goto(`/${language}/blog/${slug}`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    expect(await (await page.request.get("/sitemap.xml")).text()).not.toContain(
      `/blog/${slug}`,
    );
    await page.goto(`/en/admin/blog/${post.id}`);
    await page
      .getByLabel("Publication status", { exact: true })
      .selectOption("unpublished");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(
      page.locator(".workspace-form-feedback.success"),
    ).toBeVisible();
    expect((await page.request.get(`/${language}/blog/${slug}`)).status()).toBe(
      404,
    );
  }
  await page.goto("/en/admin/blog");
  await page.getByLabel("Article language", { exact: true }).selectOption("fa");
  await page
    .getByLabel("Publication status", { exact: true })
    .selectOption("unpublished");
  await page
    .getByRole("button", { name: "Search articles", exact: true })
    .click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page
    .getByRole("link", {
      name: "مقاله فارسی برای بررسی کامل مدیریت محتوا",
      exact: true,
    })
    .click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page).toHaveURL("/en/admin/blog");
  expect(
    (await query("SELECT id FROM blog_post WHERE slug='rich-browser-fa'"))
      .rowCount,
  ).toBe(0);
});

test("legacy bilingual editor, unsaved navigation and image validation feedback", async ({
  page,
}) => {
  await signIn(page, admin);
  await page.goto("/en/admin/blog/blog-measurement");
  await expect(page.getByText(/Legacy bilingual article/)).toBeVisible();
  const original = await page
    .getByLabel("Article title", { exact: true })
    .inputValue();
  await page.getByLabel("Article language", { exact: true }).selectOption("fa");
  await expect(
    page.getByLabel("Article title", { exact: true }),
  ).not.toHaveValue(original);
  await page.getByLabel("Article language", { exact: true }).selectOption("en");
  await expect(page.getByLabel("Article title", { exact: true })).toHaveValue(
    original,
  );
  await page
    .getByLabel("Article title", { exact: true })
    .fill(original + " unsaved");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.locator(".workspace-back-link").click();
  await expect(page).toHaveURL("/en/admin/blog/blog-measurement");
  await page.getByText("Media", { exact: true }).click();
  await page
    .getByLabel("Featured image", { exact: true })
    .setInputFiles({
      name: "fake.png",
      mimeType: "image/png",
      buffer: Buffer.from("<svg onload='alert(1)'/>"),
    });
  await expect(page.locator(".article-upload [role=alert]")).toContainText(
    "not a supported",
  );
  const denied = await page.request.post("/api/admin/blog/images", {
    headers: { origin: "https://untrusted.test" },
    multipart: {
      file: {
        name: "fake.png",
        mimeType: "image/png",
        buffer: Buffer.from("not pixels"),
      },
    },
  });
  expect(denied.status()).toBe(403);
});

test("rich editor toolbar headings, marks, links, tables and undo/redo", async ({
  page,
}) => {
  await signIn(page, admin);
  await page.goto("/en/admin/blog/new");
  await expect(page.getByText("Unsaved changes", { exact: true })).toHaveCount(
    0,
  );
  const body = page.getByRole("textbox", { name: "Article body", exact: true });
  await body.fill("Formatting example");
  await body.press("Control+A");
  for (const name of ["Bold", "Italic", "Underline", "Strikethrough"])
    await page.getByRole("button", { name, exact: true }).click();
  for (const tag of ["strong", "em", "u", "s"])
    await expect(body.locator(tag)).toContainText("Formatting example");
  for (const level of [1, 2, 3, 4, 5, 6]) {
    await page
      .getByRole("combobox", { name: "Paragraph", exact: true })
      .selectOption(String(level));
    await expect(
      body.locator(`h${level}`).filter({ hasText: "Formatting example" }),
    ).toContainText("Formatting example");
  }
  await page
    .getByRole("combobox", { name: "Paragraph", exact: true })
    .selectOption("p");
  page.once("dialog", (d) => d.accept("/en/services/seo"));
  await page.getByRole("button", { name: "Link", exact: true }).click();
  await expect(body.locator("a")).toHaveAttribute("href", "/en/services/seo");
  await body.click();
  await body.press("Control+End");
  await page.getByRole("button", { name: "Insert table", exact: true }).click();
  await expect(body.locator("tr")).toHaveCount(3);
  await body.locator("th").first().click();
  // ProseMirror groups history within 500ms; begin an independent table action.
  await page.waitForTimeout(600);
  await page
    .getByRole("button", { name: "Add table row", exact: true })
    .click();
  await expect(body.locator("tr")).toHaveCount(4);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(body.locator("tr")).toHaveCount(3);
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(body.locator("tr")).toHaveCount(4);
  await page
    .getByRole("button", { name: "Add table column", exact: true })
    .click();
  await expect(body.locator("tr").first().locator("th,td")).toHaveCount(4);
  await page
    .getByRole("button", { name: "Delete table column", exact: true })
    .click();
  await expect(body.locator("tr").first().locator("th,td")).toHaveCount(3);
  await page
    .getByRole("button", { name: "Delete table row", exact: true })
    .click();
  await expect(body.locator("tr")).toHaveCount(3);
  await page.getByRole("button", { name: "Remove table", exact: true }).click();
  await expect(body.locator("table")).toHaveCount(0);
});
