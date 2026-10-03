import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/authorization";
import { getDashboardData, getProfile, getProject } from "@/lib/repository";
import { getLocale } from "@/lib/i18n";
import { getServices } from "@/content/services";
import { dashboardMessages } from "@/content/dashboard-messages";
import { DashboardShell } from "@/components/dashboard/shell";
import {
  CustomerOverview,
  CustomerProjectDetail,
  CustomerProjects,
  CustomerReports,
  CustomerServices,
  DeliverablesList,
} from "@/components/dashboard/customer-views";
import {
  DemoNotice,
  PageHeading,
  Panel,
} from "@/components/dashboard/primitives";
import { ProfileForm } from "@/components/dashboard/forms";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = getLocale((await params).locale);
  return {
    title: `${dashboardMessages(locale).customer} | Salsal`,
    robots: { index: false, follow: false },
  };
}
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string; section?: string[] }> };
export default async function DashboardPage({ params }: Props) {
  const { locale: rawLocale, section = [] } = await params;
  const locale = getLocale(rawLocale);
  const session = await requireUser(locale);
  const t = dashboardMessages(locale);
  const path = section[0] ?? "";
  if (section.length > 2 || (section.length === 2 && path !== "projects"))
    notFound();
  const data = getDashboardData(session.user.id);
  const titles = Object.fromEntries(
    getServices(locale).map((service) => [service.slug, service.name]),
  );
  let content;
  switch (path) {
    case "":
      content = <CustomerOverview data={data} locale={locale} />;
      break;
    case "services":
      content = (
        <CustomerServices
          services={data.services}
          titles={titles}
          locale={locale}
        />
      );
      break;
    case "projects": {
      if (section[1]) {
        const project = getProject(section[1], session.user.id);
        if (!project) notFound();
        content = <CustomerProjectDetail project={project} locale={locale} />;
      } else
        content = <CustomerProjects projects={data.projects} locale={locale} />;
      break;
    }
    case "reports":
      content = <CustomerReports reports={data.reports} locale={locale} />;
      break;
    case "deliverables":
      content = (
        <>
          <PageHeading
            title={t.deliverables}
            description={t.deliverablesCopy}
          />
          {data.deliverables.some((file) => file.isDemo) && (
            <DemoNotice locale={locale} />
          )}
          <Panel>
            <DeliverablesList
              deliverables={data.deliverables}
              locale={locale}
            />
          </Panel>
        </>
      );
      break;
    case "profile": {
      const profile = getProfile(session.user.id);
      if (!profile) notFound();
      content = (
        <>
          <PageHeading title={t.profile} description={t.profileCopy} />
          <Panel title={t.account}>
            <ProfileForm user={profile} locale={locale} />
          </Panel>
        </>
      );
      break;
    }
    default:
      notFound();
  }
  return (
    <DashboardShell locale={locale} user={session.user}>
      {content}
    </DashboardShell>
  );
}
