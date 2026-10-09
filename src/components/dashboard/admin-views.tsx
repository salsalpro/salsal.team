import { articleMessages } from "@/content/article-messages";
import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  FileText,
  FolderKanban,
  MessageSquare,
  Plus,
  Search,
  Users,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { formatDate, formatNumber } from "@/lib/i18n";
import type {
  BlogPost,
  ClientService,
  Lead,
  PortfolioProject,
  Project,
  UserSummary,
} from "@/lib/domain";
import { getAdminOverview, listUsers } from "@/lib/repository";
import { dashboardMessages, statusLabel } from "@/content/dashboard-messages";
import { BarChart, DistributionChart } from "./charts";
import { ServiceAssignments } from "./service-assignment-editor";
import {
  DemoBadge,
  DemoNotice,
  EmptyState,
  Metric,
  PageHeading,
  Panel,
  ProgressBar,
  StatusBadge,
  TableWrap,
  TextLink,
} from "./primitives";

type Overview = Awaited<ReturnType<typeof getAdminOverview>>;
export function AdminOverview({
  data,
  locale,
}: {
  data: Overview;
  locale: Locale;
}) {
  const t = dashboardMessages(locale);
  return (
    <>
      <PageHeading
        eyebrow={t.overview}
        title={t.adminWelcome}
        description={t.adminCopy}
        action={
          <Link
            className="workspace-button primary"
            href={`/${locale}/admin/projects/new`}
          >
            <Plus size={16} />
            {t.createProject}
          </Link>
        }
      />
      {data.recentProjects.some((project) => project.isDemo) && (
        <DemoNotice locale={locale} />
      )}
      <div className="workspace-metrics">
        <Metric
          label={t.totalUsers}
          value={formatNumber(data.stats.users, locale)}
          icon={<Users size={18} />}
        />
        <Metric
          label={t.activeProjects}
          value={formatNumber(data.stats.activeProjects, locale)}
          icon={<FolderKanban size={18} />}
        />
        <Metric
          label={t.totalLeads}
          value={formatNumber(data.stats.leads, locale)}
          icon={<MessageSquare size={18} />}
        />
        <Metric
          label={t.publishedArticles}
          value={formatNumber(data.stats.publishedArticles, locale)}
          icon={<FileText size={18} />}
        />
      </div>
      <div className="workspace-grid-main">
        <Panel title={t.leadVolume} subtitle={t.leadVolumeCopy}>
          <BarChart
            label={t.leadsSummary}
            data={data.leadSeries.map((point) => ({
              label: formatDate(point.date, locale, {
                year: undefined,
                month: "short",
                day: "numeric",
              }),
              axisLabel: formatDate(point.date, locale, {
                year: undefined,
                month: undefined,
                day: "numeric",
              }),
              value: point.count,
            }))}
            locale={locale}
          />
        </Panel>
        <Panel title={t.projectDistribution}>
          <DistributionChart
            label={t.projectSummary}
            data={data.projectStatus.map((item) => ({
              label: statusLabel(item.status, locale),
              value: item.count,
            }))}
            locale={locale}
          />
        </Panel>
      </div>
      <p className="workspace-source-note">{t.sourceNote}</p>
      <Panel
        id="activity"
        title={t.recentLeads}
        action={
          <TextLink href={`/${locale}/admin/leads`}>{t.viewAll}</TextLink>
        }
      >
        <LeadTable leads={data.recentLeads} locale={locale} />
      </Panel>
      <Panel
        title={t.projects}
        action={
          <TextLink href={`/${locale}/admin/projects`}>{t.viewAll}</TextLink>
        }
      >
        <ProjectsTable projects={data.recentProjects} locale={locale} />
      </Panel>
      <div className="workspace-metrics workspace-secondary-metrics">
        <Metric
          label={t.totalServices}
          value={formatNumber(data.stats.services, locale)}
          icon={<BriefcaseBusiness size={17} />}
        />
        <Metric
          label={t.activeServices}
          value={formatNumber(data.stats.activeServices, locale)}
        />
        <Metric
          label={t.completedProjects}
          value={formatNumber(data.stats.completedProjects, locale)}
        />
        <Metric
          label={t.portfolio}
          value={formatNumber(data.stats.portfolio, locale)}
        />
      </div>
    </>
  );
}
export function ProjectsTable({
  projects,
  locale,
}: {
  projects: Project[];
  locale: Locale;
}) {
  const t = dashboardMessages(locale);
  return projects.length ? (
    <TableWrap>
      <table className="workspace-table">
        <thead>
          <tr>
            <th>{t.projects}</th>
            <th>{t.client}</th>
            <th>{t.status}</th>
            <th>{t.progress}</th>
            <th>{t.deadline}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td>
                <Link
                  className="workspace-table-primary"
                  href={`/${locale}/admin/projects/${project.id}`}
                >
                  {project.title[locale]}
                </Link>
                {project.isDemo && <DemoBadge locale={locale} />}
              </td>
              <td>{project.clientName}</td>
              <td>
                <StatusBadge status={project.status} locale={locale} />
              </td>
              <td className="workspace-progress-cell">
                <ProgressBar value={project.progress} locale={locale} />
              </td>
              <td>{formatDate(project.deadline, locale)}</td>
              <td>
                <TextLink href={`/${locale}/admin/projects/${project.id}`}>
                  {t.edit}
                </TextLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  ) : (
    <EmptyState title={t.noProjects} description={t.noProjectsCopy} />
  );
}
export function LeadTable({
  leads,
  locale,
}: {
  leads: Lead[];
  locale: Locale;
}) {
  const t = dashboardMessages(locale);
  return leads.length ? (
    <TableWrap>
      <table className="workspace-table">
        <thead>
          <tr>
            <th>{t.name}</th>
            <th>{t.company}</th>
            <th>{t.status}</th>
            <th>{t.created}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td>
                <Link
                  className="workspace-table-primary"
                  href={`/${locale}/admin/leads/${lead.id}`}
                >
                  {lead.name}
                </Link>
                <small className="workspace-table-subtext" dir="ltr">
                  {lead.email || lead.phone}
                </small>
              </td>
              <td>{lead.company || "—"}</td>
              <td>
                <StatusBadge status={lead.status} locale={locale} />
              </td>
              <td>{formatDate(lead.createdAt, locale)}</td>
              <td>
                <TextLink href={`/${locale}/admin/leads/${lead.id}`}>
                  {t.details}
                </TextLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  ) : (
    <EmptyState title={t.noLeads} description={t.noLeadsCopy} />
  );
}
export function LeadFilters({
  locale,
  search,
  status,
}: {
  locale: Locale;
  search: string;
  status: string;
}) {
  const t = dashboardMessages(locale);
  return (
    <form className="workspace-filters">
      <label className="workspace-search">
        <Search size={17} />
        <input
          aria-label={t.searchLeads}
          type="search"
          name="search"
          defaultValue={search}
          placeholder={t.searchLeads}
        />
      </label>
      <label className="workspace-filter-select">
        <span>{t.status}</span>
        <select name="status" defaultValue={status}>
          <option value="">{t.all}</option>
          {["new", "contacted", "qualified", "converted", "closed"].map(
            (value) => (
              <option key={value} value={value}>
                {statusLabel(value, locale)}
              </option>
            ),
          )}
        </select>
      </label>
      <button className="workspace-button" type="submit">
        {t.search}
      </button>
    </form>
  );
}
export function UsersView({
  data,
  locale,
  search,
  role,
}: {
  data: Awaited<ReturnType<typeof listUsers>>;
  locale: Locale;
  search: string;
  role: string;
}) {
  const t = dashboardMessages(locale);
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  function pageHref(page: number) {
    const params = new URLSearchParams({ search, role, page: String(page) });
    return `/${locale}/admin/users?${params}`;
  }
  return (
    <>
      <PageHeading
        title={t.users}
        description={`${formatNumber(data.total, locale)} ${t.totalUsers}`}
      />
      <Panel>
        <form className="workspace-filters">
          <label className="workspace-search">
            <Search size={17} />
            <input
              aria-label={t.searchUsers}
              name="search"
              type="search"
              placeholder={t.searchUsers}
              defaultValue={search}
            />
          </label>
          <label className="workspace-filter-select">
            <span>{t.role}</span>
            <select name="role" defaultValue={role}>
              <option value="">{t.all}</option>
              <option value="USER">{t.customerRole}</option>
              <option value="ADMIN">{t.adminRole}</option>
            </select>
          </label>
          <button type="submit" className="workspace-button">
            {t.search}
          </button>
        </form>
        {data.users.length ? (
          <TableWrap>
            <table className="workspace-table">
              <thead>
                <tr>
                  <th>{t.name}</th>
                  <th>{t.company}</th>
                  <th>{t.role}</th>
                  <th>{t.joined}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="workspace-table-title">
                        <span className="workspace-avatar">
                          {user.name.slice(0, 1)}
                        </span>
                        <div>
                          <Link
                            className="workspace-table-primary"
                            href={`/${locale}/admin/users/${user.id}`}
                          >
                            {user.name}
                          </Link>
                          <small dir="ltr">{user.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>{user.company || "—"}</td>
                    <td>
                      <StatusBadge status={user.role} locale={locale} />
                    </td>
                    <td>{formatDate(user.createdAt, locale)}</td>
                    <td>
                      <TextLink href={`/${locale}/admin/users/${user.id}`}>
                        {t.details}
                      </TextLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <EmptyState title={t.noUsers} />
        )}
        <div className="workspace-pagination">
          <span>
            {t.page} {formatNumber(data.page, locale)} {t.of}{" "}
            {formatNumber(pages, locale)}
          </span>
          <div>
            {data.page > 1 && (
              <Link
                className="workspace-button small"
                href={pageHref(data.page - 1)}
              >
                {t.previous}
              </Link>
            )}
            {data.page < pages && (
              <Link
                className="workspace-button small"
                href={pageHref(data.page + 1)}
              >
                {t.next}
              </Link>
            )}
          </div>
        </div>
      </Panel>
    </>
  );
}
export function UserDetail({
  user,
  locale,
  serviceTitles,
}: {
  user: UserSummary & { projects: Project[]; services: ClientService[] };
  locale: Locale;
  serviceTitles: Record<string, string>;
}) {
  const t = dashboardMessages(locale);
  return (
    <>
      <Link className="workspace-back-link" href={`/${locale}/admin/users`}>
        {t.users}
      </Link>
      <PageHeading
        title={user.name}
        description={user.email}
        action={<StatusBadge status={user.role} locale={locale} />}
      />
      <div className="workspace-grid-main">
        <Panel title={t.account}>
          <dl className="workspace-detail-list">
            <div>
              <dt>{t.email}</dt>
              <dd dir="ltr">{user.email}</dd>
            </div>
            <div>
              <dt>{t.company}</dt>
              <dd>{user.company || "—"}</dd>
            </div>
            <div>
              <dt>{t.phone}</dt>
              <dd dir="ltr">{user.phone || "—"}</dd>
            </div>
            <div>
              <dt>{t.joined}</dt>
              <dd>{formatDate(user.createdAt, locale)}</dd>
            </div>
          </dl>
        </Panel>
        <Panel title={t.assignedServices}>
          {user.services.length ? (
            <ul className="workspace-assigned-services">
              {user.services.map((service) => (
                <li key={service.id}>
                  <strong>
                    {serviceTitles[service.serviceSlug] ?? service.serviceSlug}
                  </strong>
                  <StatusBadge status={service.status} locale={locale} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title={t.noAssignedServices} />
          )}
        </Panel>
      </div>
      <Panel title={t.assignedServices}>
        <ServiceAssignments
          userId={user.id}
          assignments={user.services}
          services={Object.entries(serviceTitles).map(([slug, title]) => ({
            slug,
            title,
          }))}
          locale={locale}
        />
      </Panel>
      <Panel title={t.projects}>
        <ProjectsTable projects={user.projects} locale={locale} />
      </Panel>
    </>
  );
}
export function BlogList({
  posts,
  locale,
  filters,
}: {
  posts: BlogPost[];
  locale: Locale;
  filters?: { search: string; language: string; status: string };
}) {
  const t = dashboardMessages(locale);
  const a = articleMessages(locale);
  return (
    <>
      <PageHeading
        title={t.blog}
        action={
          <Link
            className="workspace-button primary"
            href={`/${locale}/admin/blog/new`}
          >
            <Plus size={16} />
            {t.createArticle}
          </Link>
        }
      />
      <form className="workspace-filters" method="get">
        <input
          className="workspace-filter-select"
          type="search"
          name="q"
          aria-label={a.search}
          placeholder={a.search}
          defaultValue={filters?.search}
        />
        <select
          className="workspace-filter-select"
          name="language"
          aria-label={a.language}
          defaultValue={filters?.language || ""}
        >
          <option value="">{a.allLanguages}</option>
          <option value="fa">فارسی</option>
          <option value="en">English</option>
        </select>
        <select
          className="workspace-filter-select"
          name="status"
          aria-label={a.status}
          defaultValue={filters?.status || ""}
        >
          <option value="">{a.allStatuses}</option>
          <option value="draft">{a.draft}</option>
          <option value="published">{a.published}</option>
          <option value="unpublished">{a.unpublished}</option>
        </select>
        <button type="submit" className="workspace-button">
          {a.search}
        </button>
      </form>
      <Panel>
        {posts.length ? (
          <TableWrap>
            <table className="workspace-table">
              <thead>
                <tr>
                  <th>{t.blog}</th>
                  <th>{t.author}</th>
                  <th>{t.status}</th>
                  <th>{t.created}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <Link
                        className="workspace-table-primary"
                        href={`/${locale}/admin/blog/${post.id}`}
                      >
                        {post.title[post.primaryLanguage || locale]}
                      </Link>
                      <small className="workspace-table-subtext">
                        {post.category[post.primaryLanguage || locale]}
                      </small>
                      {post.isDemo && <DemoBadge locale={locale} />}
                    </td>
                    <td>{post.author}</td>
                    <td>
                      <StatusBadge
                        status={
                          post.published
                            ? "published"
                            : post.editorial.unpublished
                              ? "unpublished"
                              : "draft"
                        }
                        locale={locale}
                      />
                    </td>
                    <td>{formatDate(post.createdAt, locale)}</td>
                    <td>
                      <div className="workspace-table-actions">
                        <TextLink href={`/${locale}/admin/blog/${post.id}`}>
                          {t.edit}
                        </TextLink>
                        {post.published && (
                          <Link
                            className="workspace-icon-button"
                            href={`/${post.primaryLanguage || locale}/blog/${post.slug}`}
                            aria-label={t.publicPage}
                          >
                            <ArrowUpRight size={17} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <EmptyState title={t.noArticles} description={t.noArticlesCopy} />
        )}
      </Panel>
    </>
  );
}
export function PortfolioList({
  projects,
  locale,
}: {
  projects: PortfolioProject[];
  locale: Locale;
}) {
  const t = dashboardMessages(locale);
  return (
    <>
      <PageHeading
        title={t.portfolio}
        action={
          <Link
            className="workspace-button primary"
            href={`/${locale}/admin/portfolio/new`}
          >
            <Plus size={16} />
            {t.add}
          </Link>
        }
      />
      <Panel>
        {projects.length ? (
          <TableWrap>
            <table className="workspace-table">
              <thead>
                <tr>
                  <th>{t.portfolio}</th>
                  <th>{t.client}</th>
                  <th>{t.created}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <Link
                        className="workspace-table-primary"
                        href={`/${locale}/admin/portfolio/${project.id}`}
                      >
                        {project.title[locale]}
                      </Link>
                      {project.isDemo && <DemoBadge locale={locale} />}
                    </td>
                    <td>{project.client}</td>
                    <td>{formatDate(project.date, locale)}</td>
                    <td>
                      <div className="workspace-table-actions">
                        <TextLink
                          href={`/${locale}/admin/portfolio/${project.id}`}
                        >
                          {t.edit}
                        </TextLink>
                        <Link
                          className="workspace-icon-button"
                          href={`/${locale}/portfolio/${project.slug}`}
                          aria-label={t.publicPage}
                        >
                          <ArrowUpRight size={17} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <EmptyState title={t.noPortfolio} description={t.noPortfolioCopy} />
        )}
      </Panel>
    </>
  );
}
