import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { getLocale, dictionary } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { listBlogPosts, listPortfolio } from "@/lib/repository";
import { getVisibleServices } from "@/lib/catalog";
import { Ecosystem, MiniOrbit } from "@/components/public/ecosystem";
import {
  CtaPanel,
  SectionHeading,
  ServiceCards,
} from "@/components/public/sections";
import {
  PortfolioCards,
  ArticleCards,
} from "@/components/public/content-cards";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = getLocale((await params).locale);
  const d = dictionary(locale);
  return pageMetadata(
    locale,
    "",
    `${d.home.title} ${d.home.titleAccent}`,
    d.home.description,
  );
}
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = getLocale((await params).locale);
  const d = dictionary(locale);
  const h = d.home;
  const projects = listPortfolio().slice(0, 3);
  const articles = listBlogPosts({ publishedOnly: true, limit: 3 });
  return (
    <>
      <section className="hero">
        <div className="container">
          <span className="pill hero-tag">
            <i />
            {h.eyebrow}
          </span>
          <h1>
            {h.title}
            <br />
            <em>{h.titleAccent}</em>
          </h1>
          <p>{h.description}</p>
          <div className="hero-buttons">
            <Link className="btn" href={`/${locale}/contact`}>
              {h.primaryCta}
              <Plus size={15} />
            </Link>
            <Link className="btn btn-secondary" href={`/${locale}/portfolio`}>
              {h.secondaryCta}
            </Link>
          </div>
          <p className="hero-footnote">
            <span />
            {h.systemTitle}
            <span />
          </p>
          <Ecosystem locale={locale} />
          <div className="proof-strip">
            <span>{h.systemLabel}</span>
            <span className="proof-divider" />
            {h.capabilityLabels.map((c) => (
              <strong key={c}>{c}</strong>
            ))}
          </div>
        </div>
      </section>
      <div className="container">
        <section className="manifesto">
          <div>
            <span className="eyebrow">{h.whyEyebrow}</span>
            <h2>
              {h.statementBefore}
              <br />
              <em>{h.statementAccent}</em>
            </h2>
            <p style={{ marginTop: 22, maxWidth: 535 }}>{h.statementAfter}</p>
            <Link href={`/${locale}/about`} className="text-link">
              {d.nav.about}
              <Plus size={14} />
            </Link>
          </div>
          <MiniOrbit locale={locale} />
        </section>
      </div>
      <section className="section container">
        <SectionHeading
          eyebrow={h.servicesEyebrow}
          title={`${h.servicesTitle} ${h.servicesAccent}`}
          description={h.servicesDescription}
        />
        <ServiceCards locale={locale} limit={6} />
        <div className="all-services">
          {getVisibleServices(locale)
            .slice(6)
            .map((s) => (
              <Link key={s.slug} href={`/${locale}/services/${s.slug}`}>
                {s.name}
              </Link>
            ))}
          <Link href={`/${locale}/services`}>{h.servicesCta} +</Link>
        </div>
      </section>
      <section className="section container" style={{ paddingTop: 0 }}>
        <SectionHeading
          eyebrow={h.workEyebrow}
          title={`${h.workTitle} ${h.workAccent}`}
          action={
            <Link className="text-link" href={`/${locale}/portfolio`}>
              {h.workCta}
              <Plus size={14} />
            </Link>
          }
        />
        <PortfolioCards locale={locale} projects={projects} />
        <p style={{ fontSize: 11, marginTop: 20 }}>{d.common.sampleNotice}</p>
      </section>
      <section className="section process-section">
        <div className="container">
          <SectionHeading
            eyebrow={h.processEyebrow}
            title={`${h.processTitle} ${h.processAccent}`}
          />
          <div className="process-grid">
            {h.processSteps.map((s) => (
              <div key={s.number}>
                <span className="process-number">{s.number}</span>
                <h3>{s.title}</h3>
                <p>{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="split-intro">
          <div>
            <span className="eyebrow">{h.principlesEyebrow}</span>
            <h2 style={{ marginTop: 18 }}>{h.principlesTitle}</h2>
          </div>
          <p>{h.principlesDescription}</p>
        </div>
        <div className="service-grid" style={{ marginTop: 35 }}>
          {h.whyCards.map((c) => (
            <div className="service-card" key={c.number}>
              <Sparkles
                size={23}
                color="var(--purple)"
                style={{ marginBottom: 25 }}
              />
              <h3>{c.title}</h3>
              <p>{c.description}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="section container" style={{ paddingTop: 0 }}>
        <SectionHeading
          eyebrow={h.insightsEyebrow}
          title={`${h.insightsTitle} ${h.insightsAccent}`}
          action={
            <Link className="text-link" href={`/${locale}/blog`}>
              {h.insightsCta}
              <Plus size={14} />
            </Link>
          }
        />
        <ArticleCards articles={articles} locale={locale} />
      </section>
      <div className="container">
        <CtaPanel locale={locale} />
      </div>
    </>
  );
}
