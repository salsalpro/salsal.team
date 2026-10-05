import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  FolderKanban,
  Layers3,
  Plus,
  TrendingUp,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { formatDate, formatNumber } from "@/lib/i18n";
import type { ClientService, Deliverable, Project, Report } from "@/lib/domain";
import { getDashboardData } from "@/lib/repository";
import { dashboardMessages } from "@/content/dashboard-messages";
import {
  DemoBadge,
  DemoNotice,
  EmptyState,
  Metric,
  Milestones,
  PageHeading,
  Panel,
  ProgressBar,
  ProjectCard,
  StatusBadge,
  TableWrap,
  TextLink,
} from "./primitives";
import { BarChart } from "./charts";

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
export function CustomerOverview({
  data,
  locale,
}: {
  data: DashboardData;
  locale: Locale;
}) {
  const t = dashboardMessages(locale);
  const activeProjects = data.projects.filter(
    (project) => project.status !== "completed",
  );
  return (
    <>
      <PageHeading
        eyebrow={t.overview}
        title={t.welcome}
        description={t.welcomeCopy}
        action={
          <Link
            className="workspace-button primary"
            href={`/${locale}/contact`}
          >
            {t.contactTeam}
            <ArrowUpRight size={16} />
          </Link>
        }
      />
      {data.projects.some((project) => project.isDemo) && (
        <DemoNotice locale={locale} />
      )}
      <div className="workspace-metrics">
        <Metric
          label={t.activeProjects}
          value={formatNumber(data.stats.activeProjects, locale)}
          icon={<FolderKanban size={18} />}
        />
        <Metric
          label={t.activeServices}
          value={formatNumber(data.stats.activeServices, locale)}
          icon={<Layers3 size={18} />}
        />
        <Metric
          label={t.averageProgress}
          value={`${formatNumber(data.stats.averageProgress, locale)}%`}
          icon={<TrendingUp size={18} />}
        />
        <Metric
          label={t.completedProjects}
          value={formatNumber(data.stats.completedProjects, locale)}
          icon={<CheckCircle2 size={18} />}
        />
      </div>
      <div className="workspace-grid-main">
        <Panel
          title={t.projectProgress}
          subtitle={t.progressCopy}
          action={
            <TextLink href={`/${locale}/dashboard/projects`}>
              {t.viewAll}
            </TextLink>
          }
        >
          {data.projects.length ? (
            <BarChart
              data={data.projects
                .slice(0, 5)
                .map((project) => ({
                  label: project.title[locale],
                  value: project.progress,
                }))}
              locale={locale}
              label={t.progressSummary}
            />
          ) : (
            <EmptyState title={t.noProjects} description={t.noProjectsCopy} />
          )}
        </Panel>
        <Panel title={t.nextSteps}>
          {activeProjects.length ? (
            <div className="workspace-upcoming">
              {activeProjects.flatMap((project) =>
                project.milestones
                  .filter((item) => !item.completed)
                  .slice(0, 1)
                  .map((item) => (
                    <Link
                      key={item.id}
                      href={`/${locale}/dashboard/projects/${project.id}`}
                    >
                      <span>
                        <Plus size={16} />
                      </span>
                      <div>
                        <strong>{item.title[locale]}</strong>
                        <small>{project.title[locale]}</small>
                      </div>
                      <ArrowUpRight size={16} />
                    </Link>
                  )),
              )}
              {!activeProjects.some((project) =>
                project.milestones.some((item) => !item.completed),
              ) && <EmptyState title={t.noMilestones} />}
            </div>
          ) : (
            <EmptyState title={t.noProjects} />
          )}
        </Panel>
      </div>
      <div className="workspace-section-heading">
        <h2>{t.projects}</h2>
        <TextLink href={`/${locale}/dashboard/projects`}>{t.viewAll}</TextLink>
      </div>
      {data.projects.length ? (
        <div className="workspace-project-grid">
          {data.projects.slice(0, 3).map((project) => (
            <ProjectCard key={project.id} project={project} locale={locale} />
          ))}
        </div>
      ) : (
        <Panel>
          <EmptyState title={t.noProjects} description={t.noProjectsCopy} />
        </Panel>
      )}
      <div className="workspace-grid-main">
        <Panel title={t.recentUpdates} id="activity">
          {data.notifications.length ? (
            <ul className="workspace-activity">
              {data.notifications.slice(0, 5).map((notification) => (
                <li key={notification.id}>
                  <span className="workspace-activity-icon">
                    <Bell size={17} />
                  </span>
                  <div>
                    <strong>{notification.title[locale]}</strong>
                    <p>{notification.message[locale]}</p>
                    <small>{formatDate(notification.createdAt, locale)}</small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title={t.noUpdates} />
          )}
        </Panel>
        <Panel
          title={t.reports}
          action={
            <TextLink href={`/${locale}/dashboard/reports`}>
              {t.viewAll}
            </TextLink>
          }
        >
          {data.reports.length ? (
            <div className="workspace-mini-list">
              {data.reports.slice(0, 3).map((report) => (
                <Link
                  key={report.id}
                  href={`/${locale}/dashboard/reports#${report.id}`}
                >
                  <FileText size={20} />
                  <span>
                    <strong>{report.title[locale]}</strong>
                    <small>{report.period}</small>
                  </span>
                  <ArrowUpRight size={16} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title={t.noReports} />
          )}
        </Panel>
      </div>
    </>
  );
}
export function CustomerServices({
  services,
  titles,
  locale,
}: {
  services: ClientService[];
  titles: Record<string, string>;
  locale: Locale;
}) {
  const t = dashboardMessages(locale);
  return (
    <>
      <PageHeading title={t.services} description={t.servicesCopy} />
      {services.some((service) => service.isDemo) && (
        <DemoNotice locale={locale} />
      )}
      {services.length ? (
        <div className="workspace-project-grid">
          {services.map((service) => (
            <article key={service.id} className="workspace-project-card">
              <div className="workspace-project-top">
                <span className="workspace-project-icon">
                  <BriefcaseBusiness size={21} />
                </span>
                <StatusBadge status={service.status} locale={locale} />
              </div>
              <h3>{titles[service.serviceSlug] ?? service.serviceSlug}</h3>
              <p>{service.package[locale]}</p>
              {service.isDemo && <DemoBadge locale={locale} />}
              <ProgressBar value={service.progress} locale={locale} />
              <dl className="workspace-detail-list">
                <div>
                  <dt>{t.started}</dt>
                  <dd>{formatDate(service.startDate, locale)}</dd>
                </div>
                <div>
                  <dt>{t.deadline}</dt>
                  <dd>{formatDate(service.endDate, locale)}</dd>
                </div>
                <div>
                  <dt>{t.contactTeam}</dt>
                  <dd>{service.team}</dd>
                </div>
              </dl>
              <div className="workspace-service-update">
                {service.latestUpdate[locale]}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Panel>
          <EmptyState title={t.noServices} description={t.noServicesCopy} />
        </Panel>
      )}
    </>
  );
}
export function CustomerProjects({
  projects,
  locale,
}: {
  projects: Project[];
  locale: Locale;
}) {
  const t = dashboardMessages(locale);
  return (
    <>
      <PageHeading title={t.projects} description={t.projectsCopy} />
      {projects.some((project) => project.isDemo) && (
        <DemoNotice locale={locale} />
      )}
      {projects.length ? (
        <div className="workspace-project-grid">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} locale={locale} />
          ))}
        </div>
      ) : (
        <Panel>
          <EmptyState title={t.noProjects} description={t.noProjectsCopy} />
        </Panel>
      )}
    </>
  );
}
export function CustomerProjectDetail({
  project,
  locale,
}: {
  project: Project;
  locale: Locale;
}) {
  const t = dashboardMessages(locale);
  return (
    <>
      <Link
        className="workspace-back-link"
        href={`/${locale}/dashboard/projects`}
      >
        {t.projects}
      </Link>
      <PageHeading
        title={project.title[locale]}
        description={project.description[locale]}
        action={<StatusBadge status={project.status} locale={locale} />}
      />
      {project.isDemo && <DemoNotice locale={locale} />}
      <div className="workspace-grid-main">
        <Panel title={t.milestones}>
          <Milestones project={project} locale={locale} />
        </Panel>
        <Panel title={t.summary}>
          <ProgressBar value={project.progress} locale={locale} />
          <dl className="workspace-detail-list">
            <div>
              <dt>{t.stage}</dt>
              <dd>{project.stage[locale]}</dd>
            </div>
            <div>
              <dt>{t.startDate}</dt>
              <dd>{formatDate(project.startDate, locale)}</dd>
            </div>
            <div>
              <dt>{t.deadline}</dt>
              <dd>{formatDate(project.deadline, locale)}</dd>
            </div>
          </dl>
        </Panel>
      </div>
      <Panel title={t.deliverables}>
        <DeliverablesList deliverables={project.deliverables} locale={locale} />
      </Panel>
    </>
  );
}
export function CustomerReports({
  reports,
  locale,
}: {
  reports: Report[];
  locale: Locale;
}) {
  const t = dashboardMessages(locale);
  return (
    <>
      <PageHeading title={t.reports} description={t.reportsCopy} />
      {reports.some((report) => report.isDemo) && (
        <DemoNotice locale={locale} />
      )}
      {reports.length ? (
        <div className="workspace-report-grid">
          {reports.map((report) => (
            <Panel
              key={report.id}
              title={report.title[locale]}
              subtitle={`${t.reportPeriod}: ${report.period}`}
              id={report.id}
              action={report.isDemo ? <DemoBadge locale={locale} /> : undefined}
            >
              <p className="workspace-report-summary">
                {report.summary[locale]}
              </p>
              <dl className="workspace-report-metrics">
                {report.metrics.map((metric, index) => (
                  <div key={index}>
                    <dt>{metric.label[locale]}</dt>
                    <dd>{metric.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="workspace-report-footer">
                <span>{formatDate(report.createdAt, locale)}</span>
                <TextLink
                  href={`/${locale}/dashboard/projects/${report.projectId}`}
                >
                  {t.viewProject}
                </TextLink>
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        <Panel>
          <EmptyState title={t.noReports} description={t.noReportsCopy} />
        </Panel>
      )}
      <p className="workspace-source-note">{t.sourceNote}</p>
    </>
  );
}
export function DeliverablesList({
  deliverables,
  locale,
}: {
  deliverables: Deliverable[];
  locale: Locale;
}) {
  const t = dashboardMessages(locale);
  return deliverables.length ? (
    <TableWrap>
      <table className="workspace-table">
        <thead>
          <tr>
            <th>{t.deliverables}</th>
            <th>{t.created}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {deliverables.map((file) => (
            <tr key={file.id}>
              <td>
                <div className="workspace-table-title">
                  <FileText size={20} />
                  <div>
                    <strong>{file.title[locale]}</strong>
                    <small dir="ltr">
                      {file.filename} ·{" "}
                      {formatNumber(
                        Math.max(1, Math.ceil(file.size / 1024)),
                        locale,
                      )}{" "}
                      KB
                    </small>
                  </div>
                  {file.isDemo && <DemoBadge locale={locale} />}
                </div>
              </td>
              <td>{formatDate(file.createdAt, locale)}</td>
              <td>
                <a
                  className="workspace-button small"
                  href={`/api/deliverables/${file.id}`}
                >
                  <ArrowDownToLine size={15} />
                  {t.download}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  ) : (
    <EmptyState title={t.noDeliverables} description={t.noDeliverablesCopy} />
  );
}
