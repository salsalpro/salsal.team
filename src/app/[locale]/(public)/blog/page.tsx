import { getLocale, dictionary } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { listBlogPosts } from "@/lib/repository";
import { ArticleCards } from "@/components/public/content-cards";
import { CtaPanel } from "@/components/public/sections";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = getLocale((await params).locale);
  const d = dictionary(locale).blog;
  return pageMetadata(locale, "/blog", `${d.title} ${d.accent}`, d.description);
}
export default async function Blog({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = getLocale((await params).locale);
  const d = dictionary(locale).blog;
  return (
    <div className="container">
      <div className="page-hero">
        <span className="eyebrow">{d.eyebrow}</span>
        <h1>
          {d.title}
          <br />
          <span style={{ color: "var(--purple)" }}>{d.accent}</span>
        </h1>
        <p>{d.description}</p>
      </div>
      <section className="section" style={{ paddingTop: 20 }}>
        <ArticleCards
          locale={locale}
          articles={(await listBlogPosts({ publishedOnly: true }))}
        />
      </section>
      <CtaPanel locale={locale} />
    </div>
  );
}
