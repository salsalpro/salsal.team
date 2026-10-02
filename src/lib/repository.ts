import { randomUUID, createHash } from "node:crypto";
import { getDb } from "./db";
import type { BlogPost, ClientService, Deliverable, Lead, Localized, Milestone, Notification, PortfolioProject, Project, Report, Role, ServiceSetting, UserSummary } from "./domain";
import type { BlogInput, LeadInput, PortfolioInput, ProjectInput } from "./validation";
import { serviceIds } from "./validation";

type Row = Record<string, unknown>;
const s = (value: unknown) => String(value ?? "");
const json = <T>(value: unknown): T => JSON.parse(s(value)) as T;
const now = () => new Date().toISOString();
const date = (value: unknown) => typeof value === "number" ? new Date(value).toISOString() : s(value);
const count = (sql: string, ...parameters: unknown[]) => Number((getDb().prepare(sql).get(...parameters) as Row)?.count || 0);

function mapLead(row: Row): Lead {
  return { id: s(row.id), name: s(row.name), email: s(row.email), phone: s(row.phone), company: s(row.company), service: s(row.service), budget: s(row.budget), message: s(row.message), preferredLanguage: row.preferred_language as Lead["preferredLanguage"], contactMethod: row.contact_method as Lead["contactMethod"], status: row.status as Lead["status"], notes: s(row.notes), createdAt: s(row.created_at) };
}
function mapUser(row: Row): UserSummary {
  return { id: s(row.id), name: s(row.name), email: s(row.email), role: row.role as Role, createdAt: date(row.createdAt), emailVerified: Boolean(row.emailVerified), company: s(row.company), phone: s(row.phone), locale: row.locale === "fa" ? "fa" : "en" };
}
function mapDeliverable(row: Row): Deliverable {
  return { id: s(row.id), projectId: s(row.project_id), title: json<Localized>(row.title), filename: s(row.filename), mimeType: s(row.mime_type), size: Number(row.size), createdAt: s(row.created_at), isDemo: Boolean(row.is_demo) };
}
function mapProject(row: Row): Project {
  return { id: s(row.id), clientId: s(row.client_id), clientName: s(row.client_name), title: json<Localized>(row.title), description: json<Localized>(row.description), serviceIds: json<string[]>(row.service_ids), status: row.status as Project["status"], progress: Number(row.progress), stage: json<Localized>(row.stage), startDate: s(row.start_date), deadline: s(row.deadline), notes: s(row.notes), milestones: json<Milestone[]>(row.milestones), deliverables: (getDb().prepare("SELECT id,project_id,title,filename,mime_type,size,created_at,is_demo FROM deliverable WHERE project_id=? ORDER BY created_at DESC").all(row.id) as Row[]).map(mapDeliverable), createdAt: s(row.created_at), updatedAt: s(row.updated_at), isDemo: Boolean(row.is_demo) };
}
function mapService(row: Row): ClientService {
  return { id: s(row.id), userId: s(row.user_id), serviceSlug: s(row.service_slug), package: json<Localized>(row.package), status: row.status as ClientService["status"], startDate: s(row.start_date), endDate: s(row.end_date), progress: Number(row.progress), team: s(row.team), latestUpdate: json<Localized>(row.latest_update), isDemo: Boolean(row.is_demo) };
}
function mapBlog(row: Row): BlogPost {
  return { id: s(row.id), slug: s(row.slug), title: json<Localized>(row.title), excerpt: json<Localized>(row.excerpt), content: json<Localized>(row.content), category: json<Localized>(row.category), author: s(row.author), cover: s(row.cover), published: Boolean(row.published), publishedAt: row.published_at ? s(row.published_at) : null, seoTitle: json<Localized>(row.seo_title), seoDescription: json<Localized>(row.seo_description), createdAt: s(row.created_at), updatedAt: s(row.updated_at), isDemo: Boolean(row.is_demo) };
}
function mapPortfolio(row: Row): PortfolioProject {
  return { id: s(row.id), slug: s(row.slug), title: json<Localized>(row.title), client: s(row.client), industry: json<Localized>(row.industry), services: json<string[]>(row.services), cover: s(row.cover), gallery: json<string[]>(row.gallery), challenge: json<Localized>(row.challenge), approach: json<Localized>(row.approach), solution: json<Localized>(row.solution), result: json<Localized>(row.result), date: s(row.date), isDemo: Boolean(row.is_demo) };
}

export function createLead(input: LeadInput): Lead {
  const id = randomUUID();
  getDb().prepare("INSERT INTO lead(id,name,email,phone,company,service,budget,message,preferred_language,contact_method,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(id, input.name, input.email, input.phone, input.company, input.service, input.budget, input.message, input.preferredLanguage, input.contactMethod, now());
  return mapLead(getDb().prepare("SELECT * FROM lead WHERE id=?").get(id) as Row);
}
export function listLeads(options: { status?: string; search?: string } = {}): Lead[] {
  const where: string[] = []; const params: unknown[] = [];
  if (options.status) { where.push("status=?"); params.push(options.status); }
  if (options.search) { where.push("(name LIKE ? OR email LIKE ? OR company LIKE ?)"); params.push(...Array(3).fill(`%${options.search}%`)); }
  return (getDb().prepare(`SELECT * FROM lead ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY created_at DESC LIMIT 500`).all(...params) as Row[]).map(mapLead);
}
export function updateLead(id: string, status: Lead["status"], notes: string): boolean {
  return getDb().prepare("UPDATE lead SET status=?,notes=? WHERE id=?").run(status, notes, id).changes > 0;
}

export function listUsers(options: { search?: string; role?: string; page?: number; pageSize?: number } = {}) {
  const page = Math.max(1, Math.floor(options.page || 1)); const pageSize = Math.min(100, Math.max(1, options.pageSize || 20));
  const clauses: string[] = []; const params: unknown[] = [];
  if (options.search) { clauses.push('(u.name LIKE ? OR u.email LIKE ?)'); params.push(`%${options.search}%`, `%${options.search}%`); }
  if (options.role) { clauses.push("u.role=?"); params.push(options.role); }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const total = count(`SELECT COUNT(*) AS count FROM "user" u ${where}`, ...params);
  const users = (getDb().prepare(`SELECT u.id,u.name,u.email,u.role,u.createdAt,u.emailVerified,p.company,p.phone,p.locale FROM "user" u LEFT JOIN profile p ON u.id=p.user_id ${where} ORDER BY u.createdAt DESC LIMIT ? OFFSET ?`).all(...params, pageSize, (page - 1) * pageSize) as Row[]).map(mapUser);
  return { users, total, page, pageSize };
}
export function getProfile(id: string): UserSummary | null {
  const row = getDb().prepare('SELECT u.id,u.name,u.email,u.role,u.createdAt,u.emailVerified,p.company,p.phone,p.locale FROM "user" u LEFT JOIN profile p ON u.id=p.user_id WHERE u.id=?').get(id) as Row | undefined;
  return row ? mapUser(row) : null;
}
export function updateProfile(id: string, input: { name: string; company: string; phone: string; locale: string }) {
  getDb().transaction(() => {
    getDb().prepare('UPDATE "user" SET name=?,updatedAt=? WHERE id=?').run(input.name, Date.now(), id);
    getDb().prepare("INSERT INTO profile(user_id,company,phone,locale) VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET company=excluded.company,phone=excluded.phone,locale=excluded.locale").run(id, input.company, input.phone, input.locale);
  })();
  return getProfile(id);
}
export function getUserDetail(id: string) {
  const profile = getProfile(id);
  return profile ? { ...profile, projects: listProjects({ userId: id }), services: listClientServices(id) } : null;
}
export function listProjects(options: { userId?: string; status?: string } = {}): Project[] {
  const clauses: string[] = []; const params: unknown[] = [];
  if (options.userId) { clauses.push("p.client_id=?"); params.push(options.userId); }
  if (options.status) { clauses.push("p.status=?"); params.push(options.status); }
  return (getDb().prepare(`SELECT p.*,u.name AS client_name FROM project p JOIN "user" u ON p.client_id=u.id ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""} ORDER BY p.updated_at DESC LIMIT 500`).all(...params) as Row[]).map(mapProject);
}
/** Callers must supply the authenticated user's id. Admin access is explicitly selected server-side. */
export function getProject(id: string, userId?: string, isAdmin = false): Project | null {
  if (!isAdmin && !userId) return null;
  const row = getDb().prepare(`SELECT p.*,u.name AS client_name FROM project p JOIN "user" u ON p.client_id=u.id WHERE p.id=? ${isAdmin ? "" : "AND p.client_id=?"}`).get(...(isAdmin ? [id] : [id, userId])) as Row | undefined;
  return row ? mapProject(row) : null;
}
export function createProject(input: ProjectInput, isDemo = false): Project {
  const id = randomUUID(); const timestamp = now();
  getDb().prepare("INSERT INTO project(id,client_id,title,description,service_ids,status,progress,stage,start_date,deadline,notes,milestones,created_at,updated_at,is_demo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(id, input.clientId, JSON.stringify(input.title), JSON.stringify(input.description), JSON.stringify(input.serviceIds), input.status, input.progress, JSON.stringify(input.stage), input.startDate, input.deadline, input.notes, JSON.stringify(input.milestones), timestamp, timestamp, Number(isDemo));
  return getProject(id, undefined, true)!;
}
export function updateProject(id: string, input: Partial<ProjectInput>): Project | null {
  const existing = getProject(id, undefined, true); if (!existing) return null;
  const value = { ...existing, ...input };
  getDb().prepare("UPDATE project SET client_id=?,title=?,description=?,service_ids=?,status=?,progress=?,stage=?,start_date=?,deadline=?,notes=?,milestones=?,updated_at=? WHERE id=?").run(value.clientId, JSON.stringify(value.title), JSON.stringify(value.description), JSON.stringify(value.serviceIds), value.status, value.progress, JSON.stringify(value.stage), value.startDate, value.deadline, value.notes, JSON.stringify(value.milestones), now(), id);
  return getProject(id, undefined, true);
}
export function listClientServices(userId: string): ClientService[] {
  return (getDb().prepare("SELECT * FROM client_service WHERE user_id=? ORDER BY start_date DESC").all(userId) as Row[]).map(mapService);
}
export function getDashboardData(userId: string) {
  const projects = listProjects({ userId }); const services = listClientServices(userId);
  const reports: Report[] = (getDb().prepare("SELECT * FROM report WHERE user_id=? ORDER BY created_at DESC").all(userId) as Row[]).map((row) => ({ id: s(row.id), userId: s(row.user_id), projectId: s(row.project_id), title: json<Localized>(row.title), category: s(row.category), period: s(row.period), summary: json<Localized>(row.summary), metrics: json<Report["metrics"]>(row.metrics), createdAt: s(row.created_at), isDemo: Boolean(row.is_demo) }));
  const notifications: Notification[] = (getDb().prepare("SELECT * FROM notification WHERE user_id=? ORDER BY created_at DESC LIMIT 20").all(userId) as Row[]).map((row) => ({ id: s(row.id), userId: s(row.user_id), title: json<Localized>(row.title), message: json<Localized>(row.message), createdAt: s(row.created_at), read: Boolean(row.read) }));
  return { projects, services, reports, notifications, deliverables: projects.flatMap((project) => project.deliverables), stats: { activeProjects: projects.filter((project) => ["active", "review"].includes(project.status)).length, completedProjects: projects.filter((project) => project.status === "completed").length, activeServices: services.filter((service) => service.status === "active").length, averageProgress: projects.length ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length) : 0 } };
}
export function createDeliverable(projectId: string, input: { title: Localized; filename: string; content: string }, isDemo = false): string {
  const id = randomUUID();
  getDb().prepare("INSERT INTO deliverable(id,project_id,title,filename,mime_type,content,size,created_at,is_demo) VALUES (?,?,?,?,?,?,?,?,?)").run(id, projectId, JSON.stringify(input.title), input.filename, input.filename.endsWith(".csv") ? "text/csv" : "text/plain", input.content, Buffer.byteLength(input.content), now(), Number(isDemo));
  return id;
}
export function getAuthorizedDeliverable(id: string, userId: string, isAdmin = false) {
  const row = getDb().prepare(`SELECT d.* FROM deliverable d JOIN project p ON d.project_id=p.id WHERE d.id=? ${isAdmin ? "" : "AND p.client_id=?"}`).get(...(isAdmin ? [id] : [id, userId])) as Row | undefined;
  return row ? { ...mapDeliverable(row), content: s(row.content) } : null;
}

export function listBlogPosts(options: { publishedOnly?: boolean; limit?: number; search?: string } = {}): BlogPost[] {
  const where: string[] = []; const params: unknown[] = [];
  if (options.publishedOnly) where.push("published=1");
  if (options.search) { where.push("(title LIKE ? OR excerpt LIKE ?)"); params.push(`%${options.search}%`, `%${options.search}%`); }
  params.push(Math.min(500, Math.max(1, options.limit || 100)));
  return (getDb().prepare(`SELECT * FROM blog_post ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY COALESCE(published_at,created_at) DESC LIMIT ?`).all(...params) as Row[]).map(mapBlog);
}
export function getBlogPost(slugOrId: string, options: { publishedOnly?: boolean } = {}): BlogPost | null {
  const row = getDb().prepare(`SELECT * FROM blog_post WHERE (slug=? OR id=?) ${options.publishedOnly ? "AND published=1" : ""}`).get(slugOrId, slugOrId) as Row | undefined;
  return row ? mapBlog(row) : null;
}
export function createBlogPost(input: BlogInput, isDemo = false, fixedId?: string): BlogPost {
  const id = fixedId || randomUUID(); const timestamp = now();
  getDb().prepare("INSERT INTO blog_post(id,slug,title,excerpt,content,category,author,cover,published,published_at,seo_title,seo_description,created_at,updated_at,is_demo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(id, input.slug, JSON.stringify(input.title), JSON.stringify(input.excerpt), JSON.stringify(input.content), JSON.stringify(input.category), input.author, input.cover, Number(input.published), input.published ? timestamp : null, JSON.stringify(input.seoTitle), JSON.stringify(input.seoDescription), timestamp, timestamp, Number(isDemo));
  return getBlogPost(id)!;
}
export function updateBlogPost(id: string, input: Partial<BlogInput>): BlogPost | null {
  const existing = getBlogPost(id); if (!existing) return null;
  const value = { ...existing, ...input };
  const publishedAt = value.published ? existing.publishedAt || now() : null;
  getDb().prepare("UPDATE blog_post SET slug=?,title=?,excerpt=?,content=?,category=?,author=?,cover=?,published=?,published_at=?,seo_title=?,seo_description=?,updated_at=? WHERE id=?").run(value.slug, JSON.stringify(value.title), JSON.stringify(value.excerpt), JSON.stringify(value.content), JSON.stringify(value.category), value.author, value.cover, Number(value.published), publishedAt, JSON.stringify(value.seoTitle), JSON.stringify(value.seoDescription), now(), id);
  return getBlogPost(id);
}
export function deleteBlogPost(id: string) { return getDb().prepare("DELETE FROM blog_post WHERE id=?").run(id).changes > 0; }
export function listPortfolio(): PortfolioProject[] { return (getDb().prepare("SELECT * FROM portfolio ORDER BY date DESC").all() as Row[]).map(mapPortfolio); }
export function getPortfolio(slug: string): PortfolioProject | null {
  const row = getDb().prepare("SELECT * FROM portfolio WHERE slug=? OR id=?").get(slug, slug) as Row | undefined;
  return row ? mapPortfolio(row) : null;
}
export function createPortfolio(input: PortfolioInput, isDemo = false, fixedId?: string): PortfolioProject {
  const id = fixedId || randomUUID();
  getDb().prepare("INSERT INTO portfolio(id,slug,title,client,industry,services,cover,gallery,challenge,approach,solution,result,date,is_demo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(id, input.slug, JSON.stringify(input.title), input.client, JSON.stringify(input.industry), JSON.stringify(input.services), input.cover, JSON.stringify(input.gallery), JSON.stringify(input.challenge), JSON.stringify(input.approach), JSON.stringify(input.solution), JSON.stringify(input.result), input.date, Number(isDemo));
  return getPortfolio(id)!;
}
export function updatePortfolio(id: string, input: Partial<PortfolioInput>): PortfolioProject | null {
  const existing = getPortfolio(id); if (!existing) return null; const value = { ...existing, ...input };
  getDb().prepare("UPDATE portfolio SET slug=?,title=?,client=?,industry=?,services=?,cover=?,gallery=?,challenge=?,approach=?,solution=?,result=?,date=? WHERE id=?").run(value.slug, JSON.stringify(value.title), value.client, JSON.stringify(value.industry), JSON.stringify(value.services), value.cover, JSON.stringify(value.gallery), JSON.stringify(value.challenge), JSON.stringify(value.approach), JSON.stringify(value.solution), JSON.stringify(value.result), value.date, id);
  return getPortfolio(id);
}
export function listServiceSettings(): ServiceSetting[] {
  const persisted = getDb().prepare("SELECT * FROM service_setting").all() as Row[];
  return serviceIds.map((slug, index) => { const value = persisted.find((row) => row.slug === slug); return { slug, visible: value ? Boolean(value.visible) : true, sortOrder: value ? Number(value.sort_order) : index }; }).sort((a, b) => a.sortOrder - b.sortOrder);
}
export function updateServiceSetting(slug: string, value: { visible: boolean; sortOrder: number }) {
  getDb().prepare("INSERT INTO service_setting(slug,visible,sort_order) VALUES (?,?,?) ON CONFLICT(slug) DO UPDATE SET visible=excluded.visible,sort_order=excluded.sort_order").run(slug, Number(value.visible), value.sortOrder);
}
export function getAdminOverview() {
  const leadRows = getDb().prepare("SELECT substr(created_at,1,10) AS date,COUNT(*) AS count FROM lead WHERE created_at>=? GROUP BY date ORDER BY date").all(new Date(Date.now() - 30 * 86400000).toISOString()) as { date: string; count: number }[];
  const registrationRows = getDb().prepare('SELECT date(createdAt / 1000,\'unixepoch\') AS date,COUNT(*) AS count FROM "user" WHERE createdAt>=? GROUP BY date ORDER BY date').all(Date.now() - 30 * 86400000) as { date: string; count: number }[];
  const series = (rows: { date: string; count: number }[]) => Array.from({ length: 14 }, (_, index) => { const day = new Date(Date.now() - (13 - index) * 86400000).toISOString().slice(0, 10); return { date: day, count: rows.find((row) => row.date === day)?.count || 0 }; });
  return {
    stats: { users: count('SELECT COUNT(*) AS count FROM "user"'), customers: count('SELECT COUNT(*) AS count FROM "user" WHERE role=\'USER\''), services: serviceIds.length, activeServices: count("SELECT COUNT(*) AS count FROM client_service WHERE status='active'"), projects: count("SELECT COUNT(*) AS count FROM project"), activeProjects: count("SELECT COUNT(*) AS count FROM project WHERE status IN ('active','review')"), completedProjects: count("SELECT COUNT(*) AS count FROM project WHERE status='completed'"), leads: count("SELECT COUNT(*) AS count FROM lead"), newLeads: count("SELECT COUNT(*) AS count FROM lead WHERE status='new'"), blogPosts: count("SELECT COUNT(*) AS count FROM blog_post"), publishedArticles: count("SELECT COUNT(*) AS count FROM blog_post WHERE published=1"), portfolio: count("SELECT COUNT(*) AS count FROM portfolio") },
    leadSeries: series(leadRows), registrationSeries: series(registrationRows),
    projectStatus: getDb().prepare("SELECT status,COUNT(*) AS count FROM project GROUP BY status").all() as { status: string; count: number }[],
    serviceDistribution: getDb().prepare("SELECT service_slug AS slug,COUNT(*) AS count FROM client_service GROUP BY service_slug").all() as { slug: string; count: number }[],
    recentLeads: listLeads().slice(0, 5), recentProjects: listProjects().slice(0, 5),
  };
}

/** SQLite-backed counters work across workers/restarts; no raw IP is persisted. */
export function consumeRateLimit(identifier: string, limit = 5, windowMs = 60 * 60 * 1000): boolean {
  const key = createHash("sha256").update(identifier).digest("hex"); const timestamp = Date.now();
  return getDb().transaction(() => {
    getDb().prepare("DELETE FROM rate_limit WHERE reset_at<?").run(timestamp);
    const row = getDb().prepare("SELECT count FROM rate_limit WHERE key=?").get(key) as { count: number } | undefined;
    if (row && row.count >= limit) return false;
    getDb().prepare("INSERT INTO rate_limit(key,count,reset_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1").run(key, timestamp + windowMs);
    return true;
  })();
}
