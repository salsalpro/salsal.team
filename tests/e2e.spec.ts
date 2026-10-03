import { test as base, expect, type Page } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";
import Database from "better-sqlite3";
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
const accounts: {
  email: string;
  password: string;
  role: string;
  id: string;
}[] = JSON.parse(readFileSync(".data/demo-credentials.json", "utf8")).accounts;
const admin = accounts.find((a) => a.role === "ADMIN")!;
const client = accounts.find((a) => a.role === "USER")!;
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
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("qualified");
  await page
    .getByLabel("Internal notes")
    .fill("Consultation reviewed during isolated browser test.");
  await expect(
    page.getByRole("combobox", { name: "Status", exact: true }),
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
  const db = new Database("work/e2e.sqlite", { readonly: true });
  const project = db
    .prepare("SELECT id FROM project WHERE client_id=? LIMIT 1")
    .get(client.id) as { id: string };
  const file = db
    .prepare("SELECT id FROM deliverable WHERE project_id=? LIMIT 1")
    .get(project.id) as { id: string };
  db.close();
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
test("admin routes, user search, bilingual article create, publish and unpublish", async ({
  page,
}) => {
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
  for (const [name, value] of Object.entries({
    titleEn: "Browser editorial test",
    titleFa: "مقاله آزمایشی مرورگر",
    slug: "browser-editorial-test",
    excerptEn: "A browser-created bilingual article for testing publication.",
    excerptFa: "مقاله دو زبانه برای بررسی گردش انتشار در مرورگر.",
    contentEn:
      "A complete test article written to verify the real administration flow.",
    contentFa:
      "محتوای کامل آزمایشی برای بررسی روند واقعی مدیریت و انتشار مقاله.",
    categoryEn: "Strategy",
    categoryFa: "استراتژی",
  }))
    await page.locator(`[name="${name}"]`).fill(value);
  await page
    .getByRole("button", { name: "Create article", exact: true })
    .click();
  await expect(page).toHaveURL("/en/admin/blog");
  expect(
    (await page.request.get("/en/blog/browser-editorial-test")).status(),
  ).toBe(404);
  await page
    .getByRole("link", { name: "Browser editorial test", exact: true })
    .click();
  await page.getByLabel("Publish article", { exact: true }).check();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toContainText("Changes saved");
  expect(
    (await page.request.get("/fa/blog/browser-editorial-test")).status(),
  ).toBe(200);
  await page.getByLabel("Publish article", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toContainText("Changes saved");
  expect(
    (await page.request.get("/en/blog/browser-editorial-test")).status(),
  ).toBe(404);
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
  const db = new Database("work/e2e.sqlite", { readonly: true });
  const project = db
    .prepare("SELECT id FROM project WHERE client_id=? AND is_demo=1 LIMIT 1")
    .get(client.id) as { id: string };
  db.close();
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
