import { randomUUID, createHash } from "node:crypto";
import { query, transaction } from "./db";
import type {
  BlogPost,
  ClientService,
  Deliverable,
  Lead,
  Localized,
  Milestone,
  Notification,
  PortfolioProject,
  Project,
  Report,
  Role,
  ServiceSetting,
  UserSummary,
} from "./domain";
import type {
  BlogInput,
  LeadInput,
  PortfolioInput,
  ProjectInput,
  ServiceAssignmentInput,
} from "./validation";
import { serviceIds } from "./validation";

type Row = Record<string, unknown>;
const s = (value: unknown) => String(value ?? "");
const json = <T>(value: unknown): T => JSON.parse(s(value)) as T;
const now = () => new Date().toISOString();
const date = (value: unknown) =>
  value instanceof Date
    ? value.toISOString()
    : typeof value === "number"
      ? new Date(value).toISOString()
      : s(value);
const count = async (sql: string, ...parameters: unknown[]) =>
  Number(((await query(sql, [...parameters])).rows[0] as Row)?.count || 0);

function mapLead(row: Row): Lead {
  return {
    id: s(row.id),
    name: s(row.name),
    email: s(row.email),
    phone: s(row.phone),
    company: s(row.company),
    service: s(row.service),
    budget: s(row.budget),
    message: s(row.message),
    preferredLanguage: row.preferred_language as Lead["preferredLanguage"],
    contactMethod: row.contact_method as Lead["contactMethod"],
    status: row.status as Lead["status"],
    notes: s(row.notes),
    createdAt: s(row.created_at),
  };
}
function mapUser(row: Row): UserSummary {
  return {
    id: s(row.id),
    name: s(row.name),
    email: s(row.email),
    role: row.role as Role,
    createdAt: date(row.createdAt),
    emailVerified: Boolean(row.emailVerified),
    company: s(row.company),
    phone: s(row.phone),
    locale: row.locale === "fa" ? "fa" : "en",
  };
}
function mapDeliverable(row: Row): Deliverable {
  return {
    id: s(row.id),
    projectId: s(row.project_id),
    title: json<Localized>(row.title),
    filename: s(row.filename),
    mimeType: s(row.mime_type),
    size: Number(row.size),
    createdAt: s(row.created_at),
    isDemo: Boolean(row.is_demo),
  };
}
async function mapProject(row: Row): Promise<Project> {
  return {
    id: s(row.id),
    clientId: s(row.client_id),
    clientName: s(row.client_name),
    title: json<Localized>(row.title),
    description: json<Localized>(row.description),
    serviceIds: json<string[]>(row.service_ids),
    status: row.status as Project["status"],
    progress: Number(row.progress),
    stage: json<Localized>(row.stage),
    startDate: s(row.start_date),
    deadline: s(row.deadline),
    notes: s(row.notes),
    milestones: json<Milestone[]>(row.milestones),
    deliverables: (
      (
        await query(
          "SELECT id,project_id,title,filename,mime_type,size,created_at,is_demo FROM deliverable WHERE project_id=$1 ORDER BY created_at DESC",
          [row.id],
        )
      ).rows as Row[]
    ).map(mapDeliverable),
    createdAt: s(row.created_at),
    updatedAt: s(row.updated_at),
    isDemo: Boolean(row.is_demo),
  };
}
function mapService(row: Row): ClientService {
  return {
    id: s(row.id),
    userId: s(row.user_id),
    serviceSlug: s(row.service_slug),
    package: json<Localized>(row.package),
    status: row.status as ClientService["status"],
    startDate: s(row.start_date),
    endDate: s(row.end_date),
    progress: Number(row.progress),
    team: s(row.team),
    latestUpdate: json<Localized>(row.latest_update),
    isDemo: Boolean(row.is_demo),
  };
}
function mapBlog(row: Row): BlogPost {
  return {
    id: s(row.id),
    slug: s(row.slug),
    title: json<Localized>(row.title),
    excerpt: json<Localized>(row.excerpt),
    content: json<Localized>(row.content),
    category: json<Localized>(row.category),
    author: s(row.author),
    cover: s(row.cover),
    published: Boolean(row.published),
    publishedAt: row.published_at ? s(row.published_at) : null,
    seoTitle: json<Localized>(row.seo_title),
    seoDescription: json<Localized>(row.seo_description),
    createdAt: s(row.created_at),
    updatedAt: s(row.updated_at),
    isDemo: Boolean(row.is_demo),
  };
}
function mapPortfolio(row: Row): PortfolioProject {
  return {
    id: s(row.id),
    slug: s(row.slug),
    title: json<Localized>(row.title),
    client: s(row.client),
    industry: json<Localized>(row.industry),
    services: json<string[]>(row.services),
    cover: s(row.cover),
    gallery: json<string[]>(row.gallery),
    challenge: json<Localized>(row.challenge),
    approach: json<Localized>(row.approach),
    solution: json<Localized>(row.solution),
    result: json<Localized>(row.result),
    date: s(row.date),
    isDemo: Boolean(row.is_demo),
  };
}

export async function createLead(input: LeadInput): Promise<Lead> {
  const id = randomUUID();
  await query(
    "INSERT INTO lead(id,name,email,phone,company,service,budget,message,preferred_language,contact_method,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
    [
      id,
      input.name,
      input.email,
      input.phone,
      input.company,
      input.service,
      input.budget,
      input.message,
      input.preferredLanguage,
      input.contactMethod,
      now(),
    ],
  );
  return mapLead(
    (await query("SELECT * FROM lead WHERE id=$1", [id])).rows[0] as Row,
  );
}
export async function listLeads(
  options: { status?: string; search?: string } = {},
): Promise<Lead[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (options.status) {
    where.push(`status=$${params.length + 1}`);
    params.push(options.status);
  }
  if (options.search) {
    where.push(
      `(name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 2} OR company ILIKE $${params.length + 3})`,
    );
    params.push(...Array(3).fill(`%${options.search}%`));
  }
  return (
    (
      await query(
        `SELECT * FROM lead ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY created_at DESC LIMIT 500`,
        [...params],
      )
    ).rows as Row[]
  ).map(mapLead);
}
export async function updateLead(
  id: string,
  status: Lead["status"],
  notes: string,
): Promise<boolean> {
  return (
    (
      await query("UPDATE lead SET status=$1,notes=$2 WHERE id=$3", [
        status,
        notes,
        id,
      ])
    ).rowCount! > 0
  );
}

export async function listUsers(
  options: {
    search?: string;
    role?: string;
    page?: number;
    pageSize?: number;
  } = {},
) {
  const page = Number.isFinite(options.page)
    ? Math.max(1, Math.min(100000, Math.floor(options.page!)))
    : 1;
  const pageSize = Number.isFinite(options.pageSize)
    ? Math.min(100, Math.max(1, Math.floor(options.pageSize!)))
    : 20;
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (options.search) {
    clauses.push(
      `(u.name ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 2})`,
    );
    params.push(`%${options.search}%`, `%${options.search}%`);
  }
  if (options.role) {
    clauses.push(`u.role=$${params.length + 1}`);
    params.push(options.role);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const total = await count(
    `SELECT COUNT(*) AS count FROM "user" u ${where}`,
    ...params,
  );
  const users = (
    (
      await query(
        `SELECT u.id,u.name,u.email,u.role,u."createdAt",u."emailVerified",p.company,p.phone,p.locale FROM "user" u LEFT JOIN profile p ON u.id=p.user_id ${where} ORDER BY u."createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, pageSize, (page - 1) * pageSize],
      )
    ).rows as Row[]
  ).map(mapUser);
  return { users, total, page, pageSize };
}
export async function getProfile(id: string): Promise<UserSummary | null> {
  const row = (
    await query(
      'SELECT u.id,u.name,u.email,u.role,u."createdAt",u."emailVerified",p.company,p.phone,p.locale FROM "user" u LEFT JOIN profile p ON u.id=p.user_id WHERE u.id=$1',
      [id],
    )
  ).rows[0] as Row | undefined;
  return row ? mapUser(row) : null;
}
export async function updateProfile(
  id: string,
  input: { name: string; company: string; phone: string; locale: string },
) {
  await transaction(async () => {
    await query('UPDATE "user" SET name=$1,"updatedAt"=$2 WHERE id=$3', [
      input.name,
      now(),
      id,
    ]);
    await query(
      "INSERT INTO profile(user_id,company,phone,locale) VALUES ($1,$2,$3,$4) ON CONFLICT(user_id) DO UPDATE SET company=excluded.company,phone=excluded.phone,locale=excluded.locale",
      [id, input.company, input.phone, input.locale],
    );
  });
  return await getProfile(id);
}
export async function getUserDetail(id: string) {
  const profile = await getProfile(id);
  return profile
    ? {
        ...profile,
        projects: await listProjects({ userId: id }),
        services: await listClientServices(id),
      }
    : null;
}
export async function listProjects(
  options: { userId?: string; status?: string } = {},
): Promise<Project[]> {
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (options.userId) {
    clauses.push(`p.client_id=$${params.length + 1}`);
    params.push(options.userId);
  }
  if (options.status) {
    clauses.push(`p.status=$${params.length + 1}`);
    params.push(options.status);
  }
  return Promise.all(
    (
      (
        await query(
          `SELECT p.*,u.name AS client_name FROM project p JOIN "user" u ON p.client_id=u.id ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""} ORDER BY p.updated_at DESC LIMIT 500`,
          [...params],
        )
      ).rows as Row[]
    ).map(mapProject),
  );
}
/** Callers must supply the authenticated user's id. Admin access is explicitly selected server-side. */
export async function getProject(
  id: string,
  userId?: string,
  isAdmin = false,
): Promise<Project | null> {
  if (!isAdmin && !userId) return null;
  const row = (
    await query(
      `SELECT p.*,u.name AS client_name FROM project p JOIN "user" u ON p.client_id=u.id WHERE p.id=$1 ${isAdmin ? "" : "AND p.client_id=$2"}`,
      [...(isAdmin ? [id] : [id, userId])],
    )
  ).rows[0] as Row | undefined;
  return row ? await mapProject(row) : null;
}
export async function createProject(
  input: ProjectInput,
  isDemo = false,
): Promise<Project> {
  const id = randomUUID();
  const timestamp = now();
  await query(
    "INSERT INTO project(id,client_id,title,description,service_ids,status,progress,stage,start_date,deadline,notes,milestones,created_at,updated_at,is_demo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)",
    [
      id,
      input.clientId,
      JSON.stringify(input.title),
      JSON.stringify(input.description),
      JSON.stringify(input.serviceIds),
      input.status,
      input.progress,
      JSON.stringify(input.stage),
      input.startDate,
      input.deadline,
      input.notes,
      JSON.stringify(input.milestones),
      timestamp,
      timestamp,
      Number(isDemo),
    ],
  );
  return (await getProject(id, undefined, true))!;
}
export async function updateProject(
  id: string,
  input: Partial<ProjectInput>,
): Promise<Project | null> {
  const existing = await getProject(id, undefined, true);
  if (!existing) return null;
  const value = { ...existing, ...input };
  await query(
    "UPDATE project SET client_id=$1,title=$2,description=$3,service_ids=$4,status=$5,progress=$6,stage=$7,start_date=$8,deadline=$9,notes=$10,milestones=$11,updated_at=$12 WHERE id=$13",
    [
      value.clientId,
      JSON.stringify(value.title),
      JSON.stringify(value.description),
      JSON.stringify(value.serviceIds),
      value.status,
      value.progress,
      JSON.stringify(value.stage),
      value.startDate,
      value.deadline,
      value.notes,
      JSON.stringify(value.milestones),
      now(),
      id,
    ],
  );
  return await getProject(id, undefined, true);
}
export async function listClientServices(
  userId: string,
): Promise<ClientService[]> {
  return (
    (
      await query(
        "SELECT * FROM client_service WHERE user_id=$1 ORDER BY start_date DESC",
        [userId],
      )
    ).rows as Row[]
  ).map(mapService);
}
export async function getClientService(
  id: string,
  userId: string,
): Promise<ClientService | null> {
  const row = (
    await query("SELECT * FROM client_service WHERE id=$1 AND user_id=$2", [
      id,
      userId,
    ])
  ).rows[0] as Row | undefined;
  return row ? mapService(row) : null;
}
export async function createServiceAssignment(
  userId: string,
  input: ServiceAssignmentInput,
): Promise<ClientService> {
  const id = randomUUID();
  await query(
    "INSERT INTO client_service(id,user_id,service_slug,package,status,start_date,end_date,progress,team,latest_update) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
    [
      id,
      userId,
      input.serviceSlug,
      JSON.stringify(input.package),
      input.status,
      input.startDate,
      input.endDate,
      input.progress,
      input.team,
      JSON.stringify(input.latestUpdate),
    ],
  );
  return (await getClientService(id, userId))!;
}
export async function updateServiceAssignment(
  id: string,
  userId: string,
  input: Partial<ServiceAssignmentInput>,
): Promise<ClientService | null> {
  const existing = await getClientService(id, userId);
  if (!existing) return null;
  const value = { ...existing, ...input };
  await query(
    "UPDATE client_service SET service_slug=$1,package=$2,status=$3,start_date=$4,end_date=$5,progress=$6,team=$7,latest_update=$8 WHERE id=$9 AND user_id=$10",
    [
      value.serviceSlug,
      JSON.stringify(value.package),
      value.status,
      value.startDate,
      value.endDate,
      value.progress,
      value.team,
      JSON.stringify(value.latestUpdate),
      id,
      userId,
    ],
  );
  return await getClientService(id, userId);
}
export async function getDashboardData(userId: string) {
  const projects = await listProjects({ userId });
  const services = await listClientServices(userId);
  const reports: Report[] = (
    (
      await query(
        "SELECT * FROM report WHERE user_id=$1 ORDER BY created_at DESC",
        [userId],
      )
    ).rows as Row[]
  ).map((row) => ({
    id: s(row.id),
    userId: s(row.user_id),
    projectId: s(row.project_id),
    title: json<Localized>(row.title),
    category: s(row.category),
    period: s(row.period),
    summary: json<Localized>(row.summary),
    metrics: json<Report["metrics"]>(row.metrics),
    createdAt: s(row.created_at),
    isDemo: Boolean(row.is_demo),
  }));
  const notifications: Notification[] = (
    (
      await query(
        "SELECT * FROM notification WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20",
        [userId],
      )
    ).rows as Row[]
  ).map((row) => ({
    id: s(row.id),
    userId: s(row.user_id),
    title: json<Localized>(row.title),
    message: json<Localized>(row.message),
    createdAt: s(row.created_at),
    read: Boolean(row.read),
  }));
  return {
    projects,
    services,
    reports,
    notifications,
    deliverables: projects.flatMap((project) => project.deliverables),
    stats: {
      activeProjects: projects.filter((project) =>
        ["active", "review"].includes(project.status),
      ).length,
      completedProjects: projects.filter(
        (project) => project.status === "completed",
      ).length,
      activeServices: services.filter((service) => service.status === "active")
        .length,
      averageProgress: projects.length
        ? Math.round(
            projects.reduce((sum, project) => sum + project.progress, 0) /
              projects.length,
          )
        : 0,
    },
  };
}
export async function createDeliverable(
  projectId: string,
  input: { title: Localized; filename: string; content: string },
  isDemo = false,
): Promise<string> {
  const id = randomUUID();
  await query(
    "INSERT INTO deliverable(id,project_id,title,filename,mime_type,content,size,created_at,is_demo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
    [
      id,
      projectId,
      JSON.stringify(input.title),
      input.filename,
      input.filename.endsWith(".csv") ? "text/csv" : "text/plain",
      input.content,
      Buffer.byteLength(input.content),
      now(),
      Number(isDemo),
    ],
  );
  return id;
}
export async function getAuthorizedDeliverable(
  id: string,
  userId: string,
  isAdmin = false,
) {
  const row = (
    await query(
      `SELECT d.* FROM deliverable d JOIN project p ON d.project_id=p.id WHERE d.id=$1 ${isAdmin ? "" : "AND p.client_id=$2"}`,
      [...(isAdmin ? [id] : [id, userId])],
    )
  ).rows[0] as Row | undefined;
  return row ? { ...mapDeliverable(row), content: s(row.content) } : null;
}

export async function listBlogPosts(
  options: { publishedOnly?: boolean; limit?: number; search?: string } = {},
): Promise<BlogPost[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (options.publishedOnly) where.push("published=1");
  if (options.search) {
    where.push(
      `(title ILIKE $${params.length + 1} OR excerpt ILIKE $${params.length + 2})`,
    );
    params.push(`%${options.search}%`, `%${options.search}%`);
  }
  params.push(Math.min(500, Math.max(1, options.limit || 100)));
  return (
    (
      await query(
        `SELECT * FROM blog_post ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY COALESCE(published_at,created_at) DESC LIMIT $${params.length}`,
        [...params],
      )
    ).rows as Row[]
  ).map(mapBlog);
}
export async function getBlogPost(
  slugOrId: string,
  options: { publishedOnly?: boolean } = {},
): Promise<BlogPost | null> {
  const row = (
    await query(
      `SELECT * FROM blog_post WHERE (slug=$1 OR id=$2) ${options.publishedOnly ? "AND published=1" : ""}`,
      [slugOrId, slugOrId],
    )
  ).rows[0] as Row | undefined;
  return row ? mapBlog(row) : null;
}
export async function createBlogPost(
  input: BlogInput,
  isDemo = false,
  fixedId?: string,
): Promise<BlogPost> {
  const id = fixedId || randomUUID();
  const timestamp = now();
  await query(
    "INSERT INTO blog_post(id,slug,title,excerpt,content,category,author,cover,published,published_at,seo_title,seo_description,created_at,updated_at,is_demo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)",
    [
      id,
      input.slug,
      JSON.stringify(input.title),
      JSON.stringify(input.excerpt),
      JSON.stringify(input.content),
      JSON.stringify(input.category),
      input.author,
      input.cover,
      Number(input.published),
      input.published ? timestamp : null,
      JSON.stringify(input.seoTitle),
      JSON.stringify(input.seoDescription),
      timestamp,
      timestamp,
      Number(isDemo),
    ],
  );
  return (await getBlogPost(id))!;
}
export async function updateBlogPost(
  id: string,
  input: Partial<BlogInput>,
): Promise<BlogPost | null> {
  const existing = await getBlogPost(id);
  if (!existing) return null;
  const value = { ...existing, ...input };
  const publishedAt = value.published ? existing.publishedAt || now() : null;
  await query(
    "UPDATE blog_post SET slug=$1,title=$2,excerpt=$3,content=$4,category=$5,author=$6,cover=$7,published=$8,published_at=$9,seo_title=$10,seo_description=$11,updated_at=$12 WHERE id=$13",
    [
      value.slug,
      JSON.stringify(value.title),
      JSON.stringify(value.excerpt),
      JSON.stringify(value.content),
      JSON.stringify(value.category),
      value.author,
      value.cover,
      Number(value.published),
      publishedAt,
      JSON.stringify(value.seoTitle),
      JSON.stringify(value.seoDescription),
      now(),
      id,
    ],
  );
  return await getBlogPost(id);
}
export async function deleteBlogPost(id: string) {
  return (await query("DELETE FROM blog_post WHERE id=$1", [id])).rowCount! > 0;
}
export async function listPortfolio(): Promise<PortfolioProject[]> {
  return (
    (await query("SELECT * FROM portfolio ORDER BY date DESC", []))
      .rows as Row[]
  ).map(mapPortfolio);
}
export async function getPortfolio(
  slug: string,
): Promise<PortfolioProject | null> {
  const row = (
    await query("SELECT * FROM portfolio WHERE slug=$1 OR id=$2", [slug, slug])
  ).rows[0] as Row | undefined;
  return row ? mapPortfolio(row) : null;
}
export async function createPortfolio(
  input: PortfolioInput,
  isDemo = false,
  fixedId?: string,
): Promise<PortfolioProject> {
  const id = fixedId || randomUUID();
  await query(
    "INSERT INTO portfolio(id,slug,title,client,industry,services,cover,gallery,challenge,approach,solution,result,date,is_demo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)",
    [
      id,
      input.slug,
      JSON.stringify(input.title),
      input.client,
      JSON.stringify(input.industry),
      JSON.stringify(input.services),
      input.cover,
      JSON.stringify(input.gallery),
      JSON.stringify(input.challenge),
      JSON.stringify(input.approach),
      JSON.stringify(input.solution),
      JSON.stringify(input.result),
      input.date,
      Number(isDemo),
    ],
  );
  return (await getPortfolio(id))!;
}
export async function updatePortfolio(
  id: string,
  input: Partial<PortfolioInput>,
): Promise<PortfolioProject | null> {
  const existing = await getPortfolio(id);
  if (!existing) return null;
  const value = { ...existing, ...input };
  await query(
    "UPDATE portfolio SET slug=$1,title=$2,client=$3,industry=$4,services=$5,cover=$6,gallery=$7,challenge=$8,approach=$9,solution=$10,result=$11,date=$12 WHERE id=$13",
    [
      value.slug,
      JSON.stringify(value.title),
      value.client,
      JSON.stringify(value.industry),
      JSON.stringify(value.services),
      value.cover,
      JSON.stringify(value.gallery),
      JSON.stringify(value.challenge),
      JSON.stringify(value.approach),
      JSON.stringify(value.solution),
      JSON.stringify(value.result),
      value.date,
      id,
    ],
  );
  return await getPortfolio(id);
}
export async function listServiceSettings(): Promise<ServiceSetting[]> {
  const persisted = (await query("SELECT * FROM service_setting", []))
    .rows as Row[];
  return serviceIds
    .map((slug, index) => {
      const value = persisted.find((row) => row.slug === slug);
      return {
        slug,
        visible: value ? Boolean(value.visible) : true,
        sortOrder: value ? Number(value.sort_order) : index,
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
export async function updateServiceSetting(
  slug: string,
  value: { visible: boolean; sortOrder: number },
) {
  await query(
    "INSERT INTO service_setting(slug,visible,sort_order) VALUES ($1,$2,$3) ON CONFLICT(slug) DO UPDATE SET visible=excluded.visible,sort_order=excluded.sort_order",
    [slug, Number(value.visible), value.sortOrder],
  );
}
export async function getAdminOverview() {
  const leadRows = (
    await query(
      "SELECT substr(created_at,1,10) AS date,COUNT(*) AS count FROM lead WHERE created_at>=$1 GROUP BY date ORDER BY date",
      [new Date(Date.now() - 30 * 86400000).toISOString()],
    )
  ).rows as {
    date: string;
    count: number;
  }[];
  // Auth uses timestamptz in PostgreSQL; group in UTC as the existing ISO series does.
  const registrationDate = `to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD')`;
  const registrationRows = (
    await query(
      `SELECT ${registrationDate} AS date,COUNT(*) AS count FROM "user" WHERE ${registrationDate}>=$1 GROUP BY date ORDER BY date`,
      [new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)],
    )
  ).rows as {
    date: string;
    count: number;
  }[];
  const series = (rows: { date: string; count: number }[]) =>
    Array.from({ length: 14 }, (_, index) => {
      const day = new Date(Date.now() - (13 - index) * 86400000)
        .toISOString()
        .slice(0, 10);
      return {
        date: day,
        count: Number(rows.find((row) => row.date === day)?.count || 0),
      };
    });
  return {
    stats: {
      users: await count('SELECT COUNT(*) AS count FROM "user"'),
      customers: await count(
        "SELECT COUNT(*) AS count FROM \"user\" WHERE role='USER'",
      ),
      services: serviceIds.length,
      activeServices: await count(
        "SELECT COUNT(*) AS count FROM client_service WHERE status='active'",
      ),
      projects: await count("SELECT COUNT(*) AS count FROM project"),
      activeProjects: await count(
        "SELECT COUNT(*) AS count FROM project WHERE status IN ('active','review')",
      ),
      completedProjects: await count(
        "SELECT COUNT(*) AS count FROM project WHERE status='completed'",
      ),
      leads: await count("SELECT COUNT(*) AS count FROM lead"),
      newLeads: await count(
        "SELECT COUNT(*) AS count FROM lead WHERE status='new'",
      ),
      blogPosts: await count("SELECT COUNT(*) AS count FROM blog_post"),
      publishedArticles: await count(
        "SELECT COUNT(*) AS count FROM blog_post WHERE published=1",
      ),
      portfolio: await count("SELECT COUNT(*) AS count FROM portfolio"),
    },
    leadSeries: series(leadRows),
    registrationSeries: series(registrationRows),
    projectStatus: (
      await query(
        "SELECT status,COUNT(*)::integer AS count FROM project GROUP BY status",
        [],
      )
    ).rows as { status: string; count: number }[],
    serviceDistribution: (
      await query(
        "SELECT service_slug AS slug,COUNT(*)::integer AS count FROM client_service GROUP BY service_slug",
        [],
      )
    ).rows as { slug: string; count: number }[],
    recentLeads: (await listLeads()).slice(0, 5),
    recentProjects: (await listProjects()).slice(0, 5),
  };
}

/** Atomic PostgreSQL counters work across workers/restarts; no raw IP is persisted. */
export async function consumeRateLimit(
  identifier: string,
  limit = 5,
  windowMs = 60 * 60 * 1000,
): Promise<boolean> {
  const key = createHash("sha256").update(identifier).digest("hex");
  const timestamp = Date.now();
  await query("DELETE FROM rate_limit WHERE reset_at<$1", [timestamp]);
  const result = await query(
    `INSERT INTO rate_limit(key,count,reset_at) VALUES ($1,1,$2)
     ON CONFLICT(key) DO UPDATE SET
       count=CASE WHEN rate_limit.reset_at<$3 THEN 1 ELSE rate_limit.count+1 END,
       reset_at=CASE WHEN rate_limit.reset_at<$3 THEN EXCLUDED.reset_at ELSE rate_limit.reset_at END
     WHERE rate_limit.reset_at<$3 OR rate_limit.count<$4 RETURNING key`,
    [key, timestamp + windowMs, timestamp, limit],
  );
  return result.rowCount === 1;
}
