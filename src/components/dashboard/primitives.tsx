import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Clock3,
  Inbox,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { formatDate, formatNumber } from "@/lib/i18n";
import type { Project } from "@/lib/domain";
import { dashboardMessages, statusLabel } from "@/content/dashboard-messages";

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="workspace-heading">
      <div>
        {eyebrow && <div className="workspace-eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
  id,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`workspace-panel ${className}`}>
      {(title || action) && (
        <div className="workspace-panel-heading">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="workspace-empty">
      <span>
        <Inbox size={25} />
      </span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}
export function DemoNotice({ locale }: { locale: Locale }) {
  const t = dashboardMessages(locale);
  return (
    <div className="workspace-demo-notice">
      <Sparkles size={18} />
      <div>
        <strong>{t.demo}</strong>
        <span>{t.demoCopy}</span>
      </div>
    </div>
  );
}
export function DemoBadge({ locale }: { locale: Locale }) {
  return (
    <span className="workspace-demo-badge">
      {dashboardMessages(locale).demoBadge}
    </span>
  );
}
export function StatusBadge({
  status,
  locale,
}: {
  status: string;
  locale: Locale;
}) {
  return (
    <span className={`workspace-status status-${status.toLowerCase()}`}>
      <span />
      {statusLabel(status, locale)}
    </span>
  );
}
export function Metric({
  label,
  value,
  icon,
  detail,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  detail?: string;
}) {
  return (
    <div className="workspace-metric">
      <div>
        <span>{label}</span>
        {icon}
      </div>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}
export function ProgressBar({
  value,
  label,
  locale,
}: {
  value: number;
  label?: string;
  locale: Locale;
}) {
  const progress = Math.min(100, Math.max(0, value));
  return (
    <div className="workspace-progress">
      <div>
        <span>{label ?? dashboardMessages(locale).progress}</span>
        <strong>{formatNumber(progress, locale)}%</strong>
      </div>
      <progress
        value={progress}
        max={100}
        aria-label={label ?? dashboardMessages(locale).progress}
      />
    </div>
  );
}
export function TextLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="workspace-text-link">
      {children}
      <ArrowUpRight size={15} />
    </Link>
  );
}
export function ProjectCard({
  project,
  locale,
  admin = false,
}: {
  project: Project;
  locale: Locale;
  admin?: boolean;
}) {
  const t = dashboardMessages(locale);
  return (
    <article className="workspace-project-card">
      <div className="workspace-project-top">
        <span className="workspace-project-icon">
          <Sparkles size={21} />
        </span>
        <StatusBadge status={project.status} locale={locale} />
      </div>
      <h3>
        <Link
          href={`/${locale}/${admin ? "admin" : "dashboard"}/projects/${project.id}`}
        >
          {project.title[locale]}
        </Link>
      </h3>
      <p>{project.description[locale]}</p>
      <div className="workspace-project-labels">
        {project.isDemo && <DemoBadge locale={locale} />}
        <span>{project.stage[locale]}</span>
      </div>
      <ProgressBar value={project.progress} locale={locale} />
      <div className="workspace-project-footer">
        <span>
          <Clock3 size={14} />
          {formatDate(project.deadline, locale)}
        </span>
        <Link
          href={`/${locale}/${admin ? "admin" : "dashboard"}/projects/${project.id}`}
          aria-label={`${t.viewProject}: ${project.title[locale]}`}
        >
          <ArrowRight size={18} />
        </Link>
      </div>
    </article>
  );
}
export function Milestones({
  project,
  locale,
}: {
  project: Project;
  locale: Locale;
}) {
  const t = dashboardMessages(locale);
  return project.milestones.length ? (
    <ol className="workspace-milestones">
      {project.milestones.map((milestone) => (
        <li
          key={milestone.id}
          className={milestone.completed ? "is-complete" : ""}
        >
          <span className="milestone-check">
            {milestone.completed ? <Check size={14} /> : <span />}
          </span>
          <div>
            <strong>{milestone.title[locale]}</strong>
            <span>{milestone.completed ? t.allDone : t.pending}</span>
          </div>
        </li>
      ))}
    </ol>
  ) : (
    <EmptyState title={t.noMilestones} />
  );
}
export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="workspace-table-wrap">{children}</div>;
}
