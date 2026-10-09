"use client";
import Image from "next/image";
import type { BlogInput } from "@/lib/validation";
import type { Locale } from "@/lib/i18n";
import {
  articleDetails,
  safeArticleImage,
  type ArticleDetails,
} from "@/lib/article-content";
import { articleSeoChecks, effectiveArticleSeo } from "@/lib/article-seo";
import { articleMessages } from "@/content/article-messages";
import { Field } from "./forms";
export function ArticleSeoFields({
  value,
  language,
  locale,
  change,
  changeDetails,
}: {
  value: BlogInput;
  language: Locale;
  locale: Locale;
  change: (next: BlogInput) => void;
  changeDetails: (next: ArticleDetails) => void;
}) {
  const t = articleMessages(locale);
  const d = articleDetails(value.editorial, language);
  const seo = effectiveArticleSeo(
    value,
    language,
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  );
  const checks = articleSeoChecks(value, language);
  const labels: Record<string, string> = {
    metaDescription: t.metaDescription,
    longTitle: t.longTitle,
    featuredImage: t.featuredImage,
    imageAlt: t.imageAltCheck,
    headings: t.headings,
    internalLinks: t.internalLinks,
    keyphrase: t.keyphrase,
    secondaryKeyphrases: t.secondaryKeyphrasesCheck,
  };
  return (
    <details className="article-section">
      <summary>{t.seo}</summary>
      <div className="workspace-form-grid">
        <Field label={t.seoTitle}>
          <input
            name="seoTitle"
            maxLength={200}
            value={value.seoTitle[language]}
            onChange={(e) =>
              change({
                ...value,
                seoTitle: { ...value.seoTitle, [language]: e.target.value },
              })
            }
          />
        </Field>
        <Field label={t.seoDescription}>
          <textarea
            name="seoDescription"
            maxLength={500}
            value={value.seoDescription[language]}
            onChange={(e) =>
              change({
                ...value,
                seoDescription: {
                  ...value.seoDescription,
                  [language]: e.target.value,
                },
              })
            }
          />
        </Field>
        <Field label={t.focusKeyphrase}>
          <input
            name="focusKeyphrase"
            maxLength={150}
            value={d.focusKeyphrase}
            onChange={(e) =>
              changeDetails({ ...d, focusKeyphrase: e.target.value })
            }
          />
        </Field>
        <Field label={t.secondaryKeyphrases}>
          <input
            key={language}
            name="secondaryKeyphrases"
            defaultValue={d.secondaryKeyphrases.join(", ")}
            onChange={(e) =>
              changeDetails({
                ...d,
                secondaryKeyphrases: e.target.value
                  .split(/[,،]/)
                  .map((v) => v.trim())
                  .filter(Boolean),
              })
            }
          />
        </Field>
        <Field label={t.canonical}>
          <input
            name="canonical"
            type="url"
            maxLength={2000}
            dir="ltr"
            value={d.canonical}
            placeholder={seo.url}
            onChange={(e) => changeDetails({ ...d, canonical: e.target.value })}
          />
        </Field>
        {(
          [
            "ogTitle",
            "ogDescription",
            "ogImage",
            "twitterTitle",
            "twitterDescription",
            "twitterImage",
          ] as const
        ).map((key) => (
          <Field key={key} label={t[key]}>
            <input
              name={key}
              maxLength={
                key.endsWith("Image")
                  ? 300
                  : key.endsWith("Description")
                    ? 500
                    : 200
              }
              value={d[key]}
              dir={key.endsWith("Image") ? "ltr" : "auto"}
              onChange={(e) => changeDetails({ ...d, [key]: e.target.value })}
            />
          </Field>
        ))}
      </div>
      <label className="workspace-checkbox">
        <input
          name="noindex"
          type="checkbox"
          checked={d.noindex}
          onChange={(e) => changeDetails({ ...d, noindex: e.target.checked })}
        />
        <span>{t.noindex}</span>
      </label>
      <label className="workspace-checkbox">
        <input
          name="sitemap"
          type="checkbox"
          checked={d.sitemap}
          onChange={(e) => changeDetails({ ...d, sitemap: e.target.checked })}
        />
        <span>{t.sitemap}</span>
      </label>
      <div className="workspace-form-grid article-seo-previews">
        <section aria-label={t.searchPreview}>
          <h3>{t.searchPreview}</h3>
          <strong>{seo.title}</strong>
          <small dir="ltr">{seo.canonical}</small>
          <p>{seo.description}</p>
        </section>
        <section aria-label={t.socialPreview}>
          <h3>{t.socialPreview}</h3>
          {safeArticleImage(d.ogImage || value.cover) && (
            <Image
              src={d.ogImage || value.cover}
              alt={d.coverAlt}
              width={300}
              height={160}
              unoptimized
            />
          )}
          <strong>{seo.ogTitle}</strong>
          <p>{seo.ogDescription}</p>
        </section>
      </div>
      <h3>{t.checklist}</h3>
      {checks.length ? (
        <ul>
          {checks.map((key) => (
            <li key={key}>{labels[key]}</li>
          ))}
        </ul>
      ) : (
        <p>{t.clearChecks}</p>
      )}
    </details>
  );
}
