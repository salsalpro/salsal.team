import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getLocale, dictionary, formatDate } from "@/lib/i18n";
import {
  articleMetadata,
  articleStructuredData,
  articleReadingTime,
} from "@/lib/article-seo";
import { articleDetails } from "@/lib/article-content";
import { ArticleBody } from "@/components/public/article-body";
import { getBlogPost, listBlogPosts } from "@/lib/repository";
import { ArticleCards } from "@/components/public/content-cards";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = getLocale(raw);
  const p = await getBlogPost(slug, { publishedOnly: true, language: locale });
  if (!p) notFound();
  return articleMetadata(
    p,
    locale,
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  );
}
export default async function Article({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = getLocale(raw);
  const d = dictionary(locale);
  const p = await getBlogPost(slug, { publishedOnly: true, language: locale });
  if (!p) notFound();
  const details = articleDetails(p.editorial, locale);
  const structured = articleStructuredData(
    p,
    locale,
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  );
  return (
    <>
      <article
        className="container narrow section"
        lang={locale}
        dir={locale === "fa" ? "rtl" : "ltr"}
      >
        <div className="article-hero">
          <Link className="text-link back-link" href={`/${locale}/blog`}>
            {d.blog.back}
          </Link>
          <div>
            <span className="eyebrow">{p.category[locale]}</span>
          </div>
          <h1 style={{ marginTop: 24 }}>{p.title[locale]}</h1>
          <p style={{ marginTop: 24, fontSize: 18 }}>{p.excerpt[locale]}</p>
          <div className="article-meta">
            <span>
              {d.blog.by} {p.author}
            </span>
            <span>·</span>
            <span>{formatDate(p.publishedAt || p.createdAt, locale)}</span>
            <span>
              · {articleReadingTime(p, locale)}{" "}
              {locale === "fa" ? "دقیقه مطالعه" : "min read"}
            </span>
            {p.updatedAt !== p.createdAt && (
              <span>
                {locale === "fa" ? "به‌روزرسانی:" : "Updated:"}{" "}
                {formatDate(p.updatedAt, locale)}
              </span>
            )}
          </div>
        </div>
        {p.cover && (
          <figure className="article-featured-image">
            <Image
              src={p.cover}
              alt={details.coverAlt || p.title[locale]}
              width={900}
              height={500}
              unoptimized={p.cover.startsWith("/api/")}
            />
            {details.coverCaption && (
              <figcaption>{details.coverCaption}</figcaption>
            )}
          </figure>
        )}
        <div className="prose article-rich-content">
          <ArticleBody
            document={details.document}
            text={p.content[locale]}
            title={p.title[locale]}
          />
        </div>
        {details.tags.length > 0 && (
          <p className="article-tags">{details.tags.join(" · ")}</p>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structured).replace(/</g, "\\u003c"),
          }}
        />
      </article>
      <section className="container section" style={{ paddingTop: 0 }}>
        <h2 style={{ marginBottom: 32 }}>{d.blog.related}</h2>
        <ArticleCards
          locale={locale}
          articles={(
            await listBlogPosts({ publishedOnly: true, language: locale })
          )
            .filter((x) => x.id !== p.id)
            .slice(0, 3)}
        />
      </section>
    </>
  );
}
