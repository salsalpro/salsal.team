import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Plus } from 'lucide-react';
import { requireAdmin } from '@/lib/authorization';
import { getAdminOverview, getBlogPost, getPortfolio, getProject, getUserDetail, listBlogPosts, listLeads, listPortfolio, listProjects, listServiceSettings, listUsers } from '@/lib/repository';
import { formatDate, getLocale } from '@/lib/i18n';
import { getServices } from '@/content/services';
import { dashboardMessages } from '@/content/dashboard-messages';
import { DashboardShell } from '@/components/dashboard/shell';
import { AdminOverview, BlogList, LeadFilters, LeadTable, PortfolioList, ProjectsTable, UserDetail, UsersView } from '@/components/dashboard/admin-views';
import { DemoNotice, PageHeading, Panel, StatusBadge } from '@/components/dashboard/primitives';
import { LeadEditor, ServiceEditor } from '@/components/dashboard/forms';
import { BlogEditor } from '@/components/dashboard/blog-editor';
import { ProjectEditor } from '@/components/dashboard/project-editor';
import { DeliverableEditor, PortfolioEditor } from '@/components/dashboard/portfolio-editor';
import { DeliverablesList } from '@/components/dashboard/customer-views';

export const metadata: Metadata = { title: 'Agency workspace | Salsal', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ locale: string; section?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
export default async function AdminPage({ params, searchParams }: Props) {
  const { locale: rawLocale, section = [] } = await params; const locale = getLocale(rawLocale); const session = await requireAdmin(locale); const t = dashboardMessages(locale);
  const query = await searchParams; const search = typeof query.search === 'string' ? query.search.slice(0, 100) : ''; const status = typeof query.status === 'string' ? query.status : ''; const role = query.role === 'USER' || query.role === 'ADMIN' ? query.role : ''; const parsedPage = Number(query.page); const page = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
  const path = section[0] ?? ''; const id = section[1]; if (section.length > 2 || (id && !['users', 'leads', 'projects', 'blog', 'portfolio'].includes(path))) notFound();
  const services = getServices(locale); const serviceOptions = services.map(service => ({ slug: service.slug, title: service.name })); const titles = Object.fromEntries(serviceOptions.map(service => [service.slug, service.title]));
  let content;
  switch (path) {
    case '': content = <AdminOverview data={getAdminOverview()} locale={locale} />; break;
    case 'users': { if (id) { const user = getUserDetail(id); if (!user) notFound(); content = <UserDetail user={user} locale={locale} serviceTitles={titles} />; } else content = <UsersView data={listUsers({ search, role, page, pageSize: 12 })} search={search} role={role} locale={locale} />; break; }
    case 'leads': { const leads = listLeads({ search, status }); if (id) { const lead = listLeads().find(item => item.id === id); if (!lead) notFound(); content = <><Link href={`/${locale}/admin/leads`} className="workspace-back-link">← {t.leads}</Link><PageHeading title={lead.name} description={lead.company} action={<StatusBadge status={lead.status} locale={locale} />} /><div className="workspace-grid-main"><Panel title={t.details}><dl className="workspace-detail-list"><div><dt>{t.email}</dt><dd dir="ltr">{lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : '—'}</dd></div><div><dt>{t.phone}</dt><dd dir="ltr">{lead.phone || '—'}</dd></div><div><dt>{t.requestedService}</dt><dd>{titles[lead.service] ?? lead.service}</dd></div><div><dt>{t.budget}</dt><dd>{lead.budget || '—'}</dd></div><div><dt>{t.preferredLanguage}</dt><dd>{lead.preferredLanguage === 'fa' ? 'فارسی' : 'English'}</dd></div><div><dt>{t.created}</dt><dd>{formatDate(lead.createdAt, locale)}</dd></div></dl><h3 className="workspace-subheading">{t.message}</h3><p className="workspace-message">{lead.message}</p></Panel><Panel title={t.manage}><LeadEditor lead={lead} locale={locale} /></Panel></div></>; } else content = <><PageHeading title={t.leads} /><Panel><LeadFilters locale={locale} search={search} status={status} /><LeadTable leads={leads} locale={locale} /></Panel></>; break; }
    case 'services': content = <><PageHeading title={t.serviceManagement} description={t.serviceManagementCopy} /><Panel>{listServiceSettings().map(setting => <ServiceEditor key={setting.slug} setting={setting} title={titles[setting.slug] ?? setting.slug} locale={locale} />)}</Panel></>; break;
    case 'projects': { if (id) { const project = id === 'new' ? undefined : getProject(id, session.user.id, true); if (id !== 'new' && !project) notFound(); const clients = listUsers({ pageSize: 100 }).users; if (project && !clients.some(client => client.id === project.clientId)) { const client = getUserDetail(project.clientId); if (client) clients.push(client); } content = <><Link className="workspace-back-link" href={`/${locale}/admin/projects`}>← {t.projects}</Link><PageHeading title={project ? project.title[locale] : t.newProject} />{project?.isDemo && <DemoNotice locale={locale} />}<Panel title={t.manage}><ProjectEditor project={project ?? undefined} clients={clients} services={serviceOptions} locale={locale} /></Panel>{project && <><Panel title={t.deliverables}><DeliverablesList deliverables={project.deliverables} locale={locale} /></Panel><Panel title={`${t.add} · ${t.deliverables}`}><DeliverableEditor projectId={project.id} locale={locale} /></Panel></>}</>; } else content = <><PageHeading title={t.projects} action={<Link href={`/${locale}/admin/projects/new`} className="workspace-button primary"><Plus size={16} />{t.createProject}</Link>} /><Panel><ProjectsTable projects={listProjects()} locale={locale} /></Panel></>; break; }
    case 'blog': { if (id) { const post = id === 'new' ? undefined : getBlogPost(id); if (id !== 'new' && !post) notFound(); content = <><Link className="workspace-back-link" href={`/${locale}/admin/blog`}>← {t.blog}</Link><PageHeading title={post ? t.editArticle : t.newArticle} />{post?.isDemo && <DemoNotice locale={locale} />}<Panel><BlogEditor post={post ?? undefined} locale={locale} /></Panel></>; } else content = <BlogList posts={listBlogPosts()} locale={locale} />; break; }
    case 'portfolio': { if (id) { const project = id === 'new' ? undefined : getPortfolio(id); if (id !== 'new' && !project) notFound(); content = <><Link className="workspace-back-link" href={`/${locale}/admin/portfolio`}>← {t.portfolio}</Link><PageHeading title={project ? project.title[locale] : `${t.add} · ${t.portfolio}`} />{project?.isDemo && <DemoNotice locale={locale} />}<Panel><PortfolioEditor project={project ?? undefined} services={serviceOptions} locale={locale} /></Panel></>; } else content = <PortfolioList projects={listPortfolio()} locale={locale} />; break; }
    default: notFound();
  }
  return <DashboardShell locale={locale} admin user={session.user}>{content}</DashboardShell>;
}
