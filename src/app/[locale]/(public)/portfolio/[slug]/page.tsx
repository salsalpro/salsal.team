import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getLocale, dictionary, formatDate } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { getPortfolio, listPortfolio } from "@/lib/repository";
import { getService } from "@/content/services";
import { CtaPanel, ProjectCover } from "@/components/public/sections";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = getLocale(raw);
  const p = (await getPortfolio(slug));
  if (!p) notFound();
  return pageMetadata(
    locale,
    `/portfolio/${slug}`,
    p.title[locale],
    p.challenge[locale],
  );
}
export default async function Project({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = getLocale(raw);
  const d = dictionary(locale);
  const t = d.portfolio;
  const p = (await getPortfolio(slug));
  if (!p) notFound();
  const index = (await listPortfolio()).findIndex((x) => x.id === p.id);
  return (
    <div className="container">
      <div className="page-hero">
        <Link className="text-link" href={`/${locale}/portfolio`}>
          {t.allProjects}
        </Link>
        <h1>{p.title[locale]}</h1>
        <p>{p.industry[locale]}</p>
      </div>
      {p.isDemo && <p className="demo-note">{d.common.sampleNotice}</p>}
      {p.cover ? (
        <Image
          className="project-detail-cover"
          src={p.cover}
          alt={p.title[locale]}
          width={1200}
          height={600}
          style={{ objectFit: "cover", width: "100%", borderRadius: 20 }}
        />
      ) : (
        <ProjectCover
          locale={locale}
          index={Math.max(0, index)}
          large
          client={p.client}
          industry={p.industry[locale]}
          isDemo={p.isDemo}
        />
      )}
      <div className="stats-row">
        <div>
          <strong>{p.client}</strong>
          <span>{t.client}</span>
        </div>
        <div>
          <strong style={{ fontSize: 18 }}>
            {p.services
              .map((s) => getService(locale, s)?.name || s)
              .join(" · ")}
          </strong>
          <span>{t.services}</span>
        </div>
        <div>
          <strong style={{ fontSize: 22 }}>
            {formatDate(p.date, locale, {
              year: "numeric",
              month: "long",
              day: undefined,
            })}
          </strong>
          <span>{t.date}</span>
        </div>
      </div>
      <section className="section project-details-grid">
        {[
          { title: t.challenge, text: p.challenge[locale] },
          { title: t.approach, text: p.approach[locale] },
          { title: t.solution, text: p.solution[locale] },
        ].map((x) => (
          <div key={x.title}>
            <h2>{x.title}</h2>
            <p>{x.text}</p>
          </div>
        ))}
      </section>
      <div className="page-panel" style={{ marginBottom: 60 }}>
        <h2>{t.result}</h2>
        <p>{p.result[locale]}</p>
      </div>
      {p.gallery.length > 0 && (
        <div className="work-grid section">
          {p.gallery.map((src, i) => (
            <Image
              key={src}
              src={src}
              width={600}
              height={400}
              alt={`${p.title[locale]} ${i + 1}`}
              style={{ borderRadius: 15, width: "100%" }}
            />
          ))}
        </div>
      )}
      <CtaPanel locale={locale} />
    </div>
  );
}
