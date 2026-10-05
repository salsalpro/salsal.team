import { Info } from "lucide-react";
import { getLocale, dictionary } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { listPortfolio } from "@/lib/repository";
import { PortfolioCards } from "@/components/public/content-cards";
import { CtaPanel } from "@/components/public/sections";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = getLocale((await params).locale);
  const d = dictionary(locale).portfolio;
  return pageMetadata(
    locale,
    "/portfolio",
    `${d.title} ${d.accent}`,
    d.description,
  );
}
export default async function Portfolio({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = getLocale((await params).locale);
  const d = dictionary(locale);
  const t = d.portfolio;
  const projects = (await listPortfolio());
  return (
    <div className="container">
      <div className="page-hero">
        <span className="eyebrow">{t.eyebrow}</span>
        <h1>
          {t.title}
          <br />
          <span style={{ color: "var(--purple)" }}>{t.accent}</span>
        </h1>
        <p>{t.description}</p>
      </div>
      <section className="section" style={{ paddingTop: 20 }}>
        {projects.some((p) => p.isDemo) && (
          <p className="demo-note">
            <Info size={16} />
            {d.common.sampleNotice}
          </p>
        )}
        {projects.length ? (
          <PortfolioCards locale={locale} projects={projects} />
        ) : (
          <div className="empty-state">
            <p>{d.common.empty}</p>
          </div>
        )}
      </section>
      <CtaPanel locale={locale} />
    </div>
  );
}
