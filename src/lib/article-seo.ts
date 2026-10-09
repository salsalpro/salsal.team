import type { Metadata, MetadataRoute } from "next";
import type { BlogPost } from "./domain";
import {
  articleDetails,
  readingMinutes,
  readableText,
  type ArticleLanguage,
  type ArticleNode,
} from "./article-content";
export function articleLanguages(
  post: Pick<BlogPost, "primaryLanguage" | "title" | "content">,
): ArticleLanguage[] {
  return (
    post.primaryLanguage ? [post.primaryLanguage] : (["en", "fa"] as const)
  ).filter((l) => !!post.title[l]?.trim() && !!post.content[l]?.trim());
}
export function effectiveArticleSeo(
  post: Pick<
    BlogPost,
    | "slug"
    | "title"
    | "excerpt"
    | "cover"
    | "seoTitle"
    | "seoDescription"
    | "editorial"
  >,
  language: ArticleLanguage,
  base: string,
) {
  const d = articleDetails(post.editorial, language);
  const absolute = (path: string) =>
    path ? new URL(path, base).toString() : "";
  const url = new URL(`/${language}/blog/${post.slug}`, base).toString();
  const title = post.seoTitle[language] || post.title[language];
  const description = post.seoDescription[language] || post.excerpt[language];
  return {
    title,
    description,
    url,
    canonical: d.canonical || url,
    noindex: d.noindex,
    sitemap: d.sitemap,
    ogTitle: d.ogTitle || title,
    ogDescription: d.ogDescription || description,
    ogImage: absolute(d.ogImage || post.cover),
    twitterTitle: d.twitterTitle || d.ogTitle || title,
    twitterDescription: d.twitterDescription || d.ogDescription || description,
    twitterImage: absolute(d.twitterImage || d.ogImage || post.cover),
  };
}
export function articleMetadata(
  post: BlogPost,
  language: ArticleLanguage,
  base: string,
): Metadata {
  const seo = effectiveArticleSeo(post, language, base);
  const languages = Object.fromEntries(
    articleLanguages(post).map((l) => [
      l,
      effectiveArticleSeo(post, l, base).canonical,
    ]),
  );
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.canonical, languages },
    robots: { index: !seo.noindex, follow: true },
    openGraph: {
      type: "article",
      title: seo.ogTitle,
      description: seo.ogDescription,
      url: seo.canonical,
      siteName: "Salsal",
      locale: language === "fa" ? "fa_IR" : "en_US",
      publishedTime: post.publishedAt || undefined,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      ...(seo.ogImage
        ? {
            images: [
              {
                url: seo.ogImage,
                alt: articleDetails(post.editorial, language).coverAlt,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: seo.twitterImage ? "summary_large_image" : "summary",
      title: seo.twitterTitle,
      description: seo.twitterDescription,
      ...(seo.twitterImage ? { images: [seo.twitterImage] } : {}),
    },
  };
}
export function articleStructuredData(
  post: BlogPost,
  language: ArticleLanguage,
  base: string,
) {
  const seo = effectiveArticleSeo(post, language, base);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title[language],
    description: post.excerpt[language],
    url: seo.canonical,
    mainEntityOfPage: seo.canonical,
    ...(post.cover ? { image: new URL(post.cover, base).toString() } : {}),
    datePublished: post.publishedAt || undefined,
    dateModified: post.updatedAt,
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: "Salsal" },
    inLanguage: language,
  };
}
export function articleSitemap(
  posts: BlogPost[],
  base: string,
): MetadataRoute.Sitemap {
  const result: MetadataRoute.Sitemap = [];
  for (const post of posts) {
    if (!post.published) continue;
    const eligible = articleLanguages(post).filter((l) => {
      const s = effectiveArticleSeo(post, l, base);
      return !s.noindex && s.sitemap && s.url === s.canonical;
    });
    const languages = Object.fromEntries(
      eligible.map((l) => [l, effectiveArticleSeo(post, l, base).canonical]),
    );
    for (const l of eligible)
      result.push({
        url: effectiveArticleSeo(post, l, base).canonical,
        lastModified: post.updatedAt,
        alternates: { languages },
        changeFrequency: "monthly",
        priority: 0.7,
      });
  }
  return result;
}
export function articleSeoChecks(
  post: Pick<
    BlogPost,
    | "title"
    | "excerpt"
    | "content"
    | "seoTitle"
    | "seoDescription"
    | "cover"
    | "editorial"
  >,
  language: ArticleLanguage,
): string[] {
  const d = articleDetails(post.editorial, language);
  const issues: string[] = [];
  if (!post.seoDescription[language]) issues.push("metaDescription");
  if ((post.seoTitle[language] || post.title[language]).length > 65)
    issues.push("longTitle");
  if (!post.cover) issues.push("featuredImage");
  else if (!d.coverAlt) issues.push("imageAlt");
  let previous = 1;
  let internal = false;
  function visit(n: ArticleNode) {
    if (n.type === "heading") {
      const level = Number(n.attrs?.level);
      if (level === 1 || level > previous + 1) issues.push("headings");
      previous = level;
    }
    if (n.type === "image" && !n.attrs?.alt) issues.push("imageAlt");
    if (
      n.marks?.some((m) => {
        if (m.type !== "link") return false;
        const href = String(m.attrs?.href || "");
        if (href.startsWith("/") || href.startsWith("#")) return true;
        try {
          return (
            new URL(href).origin ===
            new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
              .origin
          );
        } catch {
          return false;
        }
      })
    )
      internal = true;
    n.content?.forEach(visit);
  }
  if (d.document) visit(d.document);
  if (!internal) issues.push("internalLinks");
  if (
    d.focusKeyphrase &&
    !(post.title[language] + " " + post.content[language])
      .toLocaleLowerCase()
      .includes(d.focusKeyphrase.toLocaleLowerCase())
  )
    issues.push("keyphrase");
  if (
    d.secondaryKeyphrases.some(
      (k) =>
        !post.content[language]
          .toLocaleLowerCase()
          .includes(k.toLocaleLowerCase()),
    )
  )
    issues.push("secondaryKeyphrases");
  return [...new Set(issues)];
}
export function articleReadingTime(
  post: Pick<BlogPost, "content" | "editorial">,
  language: ArticleLanguage,
) {
  const d = articleDetails(post.editorial, language);
  return readingMinutes(
    d.document ? readableText(d.document) : post.content[language],
    language,
  );
}
