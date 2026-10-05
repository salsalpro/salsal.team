import { loadEnvConfig } from "@next/env";
import { randomBytes, randomUUID } from "node:crypto";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  chmodSync,
  renameSync,
} from "node:fs";
import path from "node:path";

loadEnvConfig(process.cwd());

async function main() {
  if (process.env.NODE_ENV === "production")
    throw new Error("Demo seeding is disabled in production.");
  const { auth } = await import("../src/lib/auth");
  const { query, transaction } = await import("../src/lib/db");
  const { articleSeeds, portfolioSeeds } =
    await import("../src/content/fixtures");
  const {
    createBlogPost,
    createPortfolio,
    getBlogPost,
    getPortfolio,
    createProject,
    listProjects,
    createDeliverable,
    createLead,
  } = await import("../src/lib/repository");
  const { blogSchema, portfolioSchema } = await import("../src/lib/validation");
  for (const { id, ...post } of articleSeeds)
    if (!(await getBlogPost(post.slug)) && !(await getBlogPost(id)))
      await createBlogPost(blogSchema.parse(post), true, id);
  for (const { id, ...project } of portfolioSeeds)
    if (!(await getPortfolio(project.slug)) && !(await getPortfolio(id)))
      await createPortfolio(portfolioSchema.parse(project), true, id);
  if (process.env.SEED_DEMO_ACCOUNTS === "false") {
    console.log("Public demonstration content seeded. No accounts created.");
    return;
  }

  const credentialPath = path.resolve(
    process.env.DEMO_CREDENTIAL_PATH || ".data/demo-credentials.json",
  );
  type Credential = {
    email: string;
    password: string;
    role: "ADMIN" | "USER";
    id: string;
  };
  const previous: Credential[] = existsSync(credentialPath)
    ? JSON.parse(readFileSync(credentialPath, "utf8")).accounts
    : [];
  const accounts: Credential[] = [];
  const saveCredentials = () => {
    const temporaryPath = `${credentialPath}.tmp`;
    writeFileSync(
      temporaryPath,
      JSON.stringify(
        {
          warning:
            "Local development accounts only. Do not publish this file or use these accounts in production.",
          accounts,
        },
        null,
        2,
      ),
      { mode: 0o600 },
    );
    chmodSync(temporaryPath, 0o600);
    renameSync(temporaryPath, credentialPath);
  };
  for (const account of [
    {
      role: "ADMIN" as const,
      name: "Salsal Studio",
      email: process.env.DEMO_ADMIN_EMAIL || "admin@demo.salsal.test",
      password: process.env.DEMO_ADMIN_PASSWORD,
    },
    {
      role: "USER" as const,
      name: "Aria Mehr",
      email: process.env.DEMO_CLIENT_EMAIL || "client@demo.salsal.test",
      password: process.env.DEMO_CLIENT_PASSWORD,
    },
  ]) {
    const existing = (
      await query('SELECT id,role FROM "user" WHERE email=$1', [account.email])
    ).rows[0] as { id: string; role: string } | undefined;
    if (existing) {
      if (existing.role !== account.role)
        throw new Error(
          `An existing account has a different role: ${account.email}. Choose a different demo address.`,
        );
      accounts.push(
        previous.find(
          (credential) =>
            credential.email === account.email && credential.id === existing.id,
        ) || {
          email: account.email,
          password: "Previously configured; password was not changed.",
          role: account.role,
          id: existing.id,
        },
      );
      continue;
    }
    const password = account.password || randomBytes(24).toString("base64url");
    if (password.length < 12)
      throw new Error(
        "Demo account passwords must have at least 12 characters.",
      );
    const result = await auth.api.signUpEmail({
      body: { name: account.name, email: account.email, password },
    });
    await query('UPDATE "user" SET role=$1 WHERE id=$2', [
      account.role,
      result.user.id,
    ]);
    accounts.push({
      role: account.role,
      email: account.email,
      password,
      id: result.user.id,
    });
    saveCredentials();
  }
  saveCredentials();
  const client = accounts.find((account) => account.role === "USER")!;
  await query(
    "INSERT INTO profile(user_id,company,phone,locale) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING",
    [client.id, "Orbit Studio · Demo", "+98 21 5550 1200", "en"],
  );
  await transaction(async () => {
    if (!(await listProjects({ userId: client.id })).length) {
      const launch = await createProject(
        {
          clientId: client.id,
          title: {
            en: "Orbit digital launch",
            fa: "راه‌اندازی دیجیتال اوربیت",
          },
          description: {
            en: "A demonstration of a coordinated website, search and content engagement.",
            fa: "نمونه‌ای از پروژه هماهنگ وب‌سایت، جستجو و محتوا.",
          },
          serviceIds: ["digital-marketing", "web-development", "seo"],
          status: "active",
          progress: 68,
          stage: { en: "Design & development", fa: "طراحی و توسعه" },
          startDate: "2026-09-01",
          deadline: "2026-10-30",
          notes:
            "Demonstration project. Replace with an actual client engagement.",
          milestones: [
            {
              id: "discovery",
              title: {
                en: "Discovery & positioning",
                fa: "شناخت و جایگاه‌یابی",
              },
              completed: true,
            },
            {
              id: "strategy",
              title: { en: "Marketing strategy", fa: "استراتژی بازاریابی" },
              completed: true,
            },
            {
              id: "build",
              title: { en: "Website implementation", fa: "پیاده‌سازی وب‌سایت" },
              completed: false,
            },
            {
              id: "launch",
              title: { en: "Launch & measurement", fa: "انتشار و سنجش" },
              completed: false,
            },
          ],
        },
        true,
      );
      await createProject(
        {
          clientId: client.id,
          title: {
            en: "Autumn content collection",
            fa: "مجموعه محتوای پاییزی",
          },
          description: {
            en: "Sample social content planning and production workflow.",
            fa: "نمونه روند برنامه‌ریزی و تولید محتوای شبکه‌های اجتماعی.",
          },
          serviceIds: ["instagram-marketing", "photography", "video-editing"],
          status: "review",
          progress: 90,
          stage: { en: "Client review", fa: "بازبینی مشتری" },
          startDate: "2026-09-10",
          deadline: "2026-10-12",
          notes: "Demonstration engagement.",
          milestones: [
            {
              id: "plan",
              title: { en: "Content plan", fa: "برنامه محتوا" },
              completed: true,
            },
            {
              id: "shoot",
              title: { en: "Production day", fa: "روز تولید" },
              completed: true,
            },
            {
              id: "review",
              title: { en: "Final review", fa: "بازبینی نهایی" },
              completed: false,
            },
          ],
        },
        true,
      );
      await createDeliverable(
        launch.id,
        {
          title: {
            en: "Marketing strategy brief",
            fa: "خلاصه استراتژی بازاریابی",
          },
          filename: "orbit-strategy-demo.txt",
          content:
            "SALSAL — DEMONSTRATION DELIVERABLE\n\nOrbit digital launch\n\nThis is a fictional project brief for evaluating the Salsal client portal.\n\n1. Align audiences, offers and landing pages.\n2. Plan a coherent content calendar.\n3. Define conversion events before launch.\n4. Review first-party performance data together.\n\nNo real campaign metrics or external integrations are represented.\n",
        },
        true,
      );
      const timestamp = new Date().toISOString();
      await query(
        "INSERT INTO report(id,user_id,project_id,title,category,period,summary,metrics,created_at,is_demo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,1)",
        [
          randomUUID(),
          client.id,
          launch.id,
          JSON.stringify({
            en: "Launch readiness review",
            fa: "گزارش آمادگی انتشار",
          }),
          "website",
          "September 2026",
          JSON.stringify({
            en: "A sample project delivery report. The figures describe demo project tasks, not live site traffic.",
            fa: "نمونه گزارش تحویل پروژه؛ اعداد مربوط به وظایف نمایشی هستند، نه ترافیک واقعی سایت.",
          }),
          JSON.stringify([
            {
              label: { en: "Milestones completed", fa: "مراحل تکمیل‌شده" },
              value: "2 / 4",
            },
            {
              label: { en: "Project progress", fa: "پیشرفت پروژه" },
              value: "68%",
            },
          ]),
          timestamp,
        ],
      );
      await query(
        "INSERT INTO notification(id,user_id,title,message,created_at) VALUES ($1,$2,$3,$4,$5)",
        [
          randomUUID(),
          client.id,
          JSON.stringify({
            en: "Your strategy brief is ready",
            fa: "خلاصه استراتژی شما آماده است",
          }),
          JSON.stringify({
            en: "Review the demonstration brief in your deliverables.",
            fa: "خلاصه نمایشی را در فایل‌های تحویلی بررسی کنید.",
          }),
          timestamp,
        ],
      );
      for (const [index, slug] of [
        "digital-marketing",
        "seo",
        "instagram-marketing",
      ].entries()) {
        await query(
          "INSERT INTO client_service(id,user_id,service_slug,package,status,start_date,end_date,progress,team,latest_update,is_demo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,1)",
          [
            randomUUID(),
            client.id,
            slug,
            JSON.stringify({ en: "Studio partnership", fa: "همکاری استودیو" }),
            "active",
            "2026-09-01",
            "2026-12-01",
            [68, 42, 90][index],
            "Salsal Studio",
            JSON.stringify({
              en: "Sample work is in progress. Your team will share the next review.",
              fa: "کار نمونه در حال انجام است. تیم زمان بازبینی بعدی را اعلام می‌کند.",
            }),
          ],
        );
      }
    }
    if (!(await query("SELECT id FROM lead LIMIT 1", [])).rows[0]) {
      for (const entry of [
        {
          name: "Mina Rahimi (Demo)",
          company: "Forma — Demo",
          service: "web-development" as const,
          message:
            "Demonstration consultation: we are planning a considered website for our design studio.",
        },
        {
          name: "Daniel Park (Demo)",
          company: "Frame — Demo",
          service: "photography" as const,
          message:
            "Demonstration consultation: we need a cohesive campaign photography direction for a product launch.",
        },
        {
          name: "Sara Azadi (Demo)",
          company: "Orbit — Demo",
          service: "digital-marketing" as const,
          message:
            "Demonstration consultation: we want to connect our content strategy and campaign measurement.",
        },
      ])
        await createLead({
          ...entry,
          email: `${entry.company.split(" ")[0].toLowerCase()}@example.test`,
          phone: "",
          budget: "To discuss",
          preferredLanguage: "en",
          contactMethod: "email",
        });
    }
  });
  console.log(
    "Development fixtures seeded. Generated credentials are saved privately in .data/demo-credentials.json.",
  );
}
main()
  .catch(() => {
    console.error(
      "Database script failed. Check PostgreSQL connection and schema; no credentials were logged.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    const { closeDb } = await import("../src/lib/db");
    await closeDb();
  });
