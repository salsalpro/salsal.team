"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Locale } from "@/lib/i18n";
import type { BlogPost } from "@/lib/domain";
import { blogSchema, type BlogInput } from "@/lib/validation";
import {
  articleDetails,
  detectArticleLanguage,
  readableText,
  safeArticleImage,
  type ArticleDetails,
} from "@/lib/article-content";
import { articleReadingTime } from "@/lib/article-seo";
import { dashboardMessages } from "@/content/dashboard-messages";
import { articleMessages } from "@/content/article-messages";
import {
  Field,
  FormControls,
  MutationFeedback,
  SaveButton,
  useMutation,
} from "./forms";
import { ArticleRichEditor } from "./article-rich-editor";
import { ArticleImageUpload } from "./article-image-upload";
import { ArticleSeoFields } from "./article-seo-fields";
import { ArticleBody } from "../public/article-body";
function initial(post: BlogPost | undefined, locale: Locale): BlogInput {
  const empty = () => ({ en: "", fa: "" });
  return {
    slug: post?.slug || "",
    title: post?.title || empty(),
    excerpt: post?.excerpt || empty(),
    content: post?.content || empty(),
    category: post?.category || empty(),
    author: post?.author || "Salsal Studio",
    cover: post?.cover || "",
    published: post?.published || false,
    seoTitle: post?.seoTitle || empty(),
    seoDescription: post?.seoDescription || empty(),
    primaryLanguage: post ? post.primaryLanguage : locale,
    editorial: post?.editorial || { languageMode: "auto", unpublished: false },
  };
}
export function BlogEditor({
  post,
  locale,
  taxonomy = { categories: [], tags: [] },
}: {
  post?: BlogPost;
  locale: Locale;
  taxonomy?: { categories: string[]; tags: string[] };
}) {
  const t = dashboardMessages(locale);
  const a = articleMessages(locale);
  const router = useRouter();
  const mutation = useMutation(locale);
  const [value, setValue] = useState(() => initial(post, locale));
  const [legacyLanguage, setLegacyLanguage] = useState<Locale>(locale);
  const language = value.primaryLanguage || legacyLanguage;
  const details = articleDetails(value.editorial, language);
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [baseline, setBaseline] = useState(() =>
    JSON.stringify(initial(post, locale)),
  );
  const dirty = JSON.stringify(value) !== baseline;
  const dirtyRef = useRef(dirty);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);
  const version = useRef(post?.updatedAt);
  function moveLanguage(current: BlogInput, next: Locale): BlogInput {
    const old = current.primaryLanguage!;
    const moved = {
      ...current,
      primaryLanguage: next,
      editorial: { ...current.editorial, [next]: current.editorial[old] },
    };
    for (const field of [
      "title",
      "excerpt",
      "content",
      "category",
      "seoTitle",
      "seoDescription",
    ] as const)
      moved[field] = { en: "", fa: "", [next]: current[field][old] };
    if (next !== old) delete moved.editorial[old];
    return moved;
  }
  function changeLanguage(next: Locale, current = value) {
    if (!current.primaryLanguage) {
      setLegacyLanguage(next);
      return;
    }
    setValue(moveLanguage(current, next));
  }
  function resolveLanguage(next: BlogInput) {
    if (
      next.primaryLanguage &&
      next.editorial.languageMode === "auto" &&
      !post?.publishedAt
    ) {
      const lang = next.primaryLanguage;
      const detected = detectArticleLanguage(
        next.title[lang] +
          " " +
          (next.editorial[lang]?.document
            ? readableText(next.editorial[lang]!.document!)
            : next.content[lang]),
      );
      if (detected && detected !== lang) return moveLanguage(next, detected);
    }
    return next;
  }
  function change(next: BlogInput) {
    setValue(resolveLanguage(next));
  }
  function changeDetails(patch: Partial<ArticleDetails>) {
    // Editor transactions can arrive after another form control has changed.
    // Merge only changed fields into the latest article to preserve other edits.
    setValue((current) => {
      const next = { ...articleDetails(current.editorial, language), ...patch };
      return resolveLanguage({
        ...current,
        editorial: { ...current.editorial, [language]: next },
        ...(patch.document
          ? {
              content: {
                ...current.content,
                [language]: readableText(patch.document),
              },
            }
          : {}),
      });
    });
  }
  useEffect(() => {
    function unload(event: BeforeUnloadEvent) {
      if (dirtyRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    }
    function navigation(event: MouseEvent) {
      const link =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (
        dirtyRef.current &&
        link &&
        !link.hasAttribute("download") &&
        !window.confirm(a.leaveConfirm)
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigation, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigation, true);
    };
  }, [a.leaveConfirm]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = blogSchema.safeParse(value);
    if (!parsed.success) {
      mutation.setFeedback({
        type: "error",
        message: parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .slice(0, 5)
          .join(" · "),
      });
      return;
    }
    if (
      value.published &&
      value.editorial.languageMode === "auto" &&
      !detectArticleLanguage(
        value.title[language] + " " + value.content[language],
      )
    ) {
      mutation.setFeedback({ type: "error", message: a.unknown });
      return;
    }
    await mutation.mutate(
      post ? `/api/admin/blog/${post.id}` : "/api/admin/blog",
      {
        ...parsed.data,
        ...(post ? { expectedUpdatedAt: version.current } : {}),
      },
      post ? "PATCH" : "POST",
      (result) => {
        const saved = result.post as BlogPost;
        const next = initial(saved, locale);
        setValue(next);
        setBaseline(JSON.stringify(next));
        dirtyRef.current = false;
        version.current = saved.updatedAt;
        if (!post) router.push(`/${locale}/admin/blog`);
      },
      true,
    );
  }
  async function remove() {
    if (!post || !window.confirm(t.deleteConfirm)) return;
    await mutation.mutate(
      `/api/admin/blog/${post.id}`,
      undefined,
      "DELETE",
      () => {
        dirtyRef.current = false;
        router.push(`/${locale}/admin/blog`);
      },
    );
  }
  const detected = detectArticleLanguage(
    value.title[language] + " " + value.content[language],
  );
  const status = value.published
    ? "published"
    : value.editorial.unpublished
      ? "unpublished"
      : "draft";
  return (
    <form onSubmit={submit} className="workspace-form article-cms-form">
      <FormControls pending={!editorReady || mutation.pending || uploading}>
        {dirty && <p role="status">{a.unsaved}</p>}
        {!value.primaryLanguage && <p>{a.legacy}</p>}
        <div className="workspace-form-grid">
          <Field label={a.language}>
            <select
              name="language"
              aria-label={a.language}
              value={
                value.primaryLanguage && value.editorial.languageMode === "auto"
                  ? "auto"
                  : language
              }
              onChange={(e) => {
                if (e.target.value === "auto")
                  change({
                    ...value,
                    editorial: { ...value.editorial, languageMode: "auto" },
                  });
                else if (value.primaryLanguage)
                  changeLanguage(e.target.value as Locale, {
                    ...value,
                    editorial: { ...value.editorial, languageMode: "manual" },
                  });
                else setLegacyLanguage(e.target.value as Locale);
              }}
            >
              {value.primaryLanguage && <option value="auto">{a.auto}</option>}
              <option value="fa">فارسی</option>
              <option value="en">English</option>
            </select>
          </Field>
          <p>
            {a.detected}:{" "}
            {detected === "fa"
              ? "فارسی"
              : detected === "en"
                ? "English"
                : a.unknown}{" "}
            · {articleReadingTime(value, language)} {a.reading}
          </p>
          <Field label={a.title}>
            <input
              required
              name="title"
              maxLength={300}
              value={value.title[language]}
              dir={language === "fa" ? "rtl" : "ltr"}
              onChange={(e) =>
                change({
                  ...value,
                  title: { ...value.title, [language]: e.target.value },
                })
              }
            />
          </Field>
          <Field label={t.slug}>
            <input
              required
              name="slug"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              minLength={3}
              maxLength={150}
              dir="ltr"
              value={value.slug}
              onChange={(e) => change({ ...value, slug: e.target.value })}
            />
          </Field>
          <Field label={a.excerpt}>
            <textarea
              name="excerpt"
              rows={3}
              maxLength={1000}
              value={value.excerpt[language]}
              dir={language === "fa" ? "rtl" : "ltr"}
              onChange={(e) =>
                change({
                  ...value,
                  excerpt: { ...value.excerpt, [language]: e.target.value },
                })
              }
            />
          </Field>
          <Field label={t.author}>
            <input
              required
              name="author"
              maxLength={100}
              value={value.author}
              onChange={(e) => change({ ...value, author: e.target.value })}
            />
          </Field>
          <Field label={a.category}>
            <input
              name="category"
              list="article-categories"
              maxLength={100}
              value={value.category[language]}
              onChange={(e) =>
                change({
                  ...value,
                  category: { ...value.category, [language]: e.target.value },
                })
              }
            />
            <datalist id="article-categories">
              {taxonomy.categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label={a.tags}>
            <input
              key={language}
              name="tags"
              list="article-tags"
              defaultValue={details.tags.join(", ")}
              onChange={(e) =>
                changeDetails({
                  ...details,
                  tags: e.target.value
                    .split(/[,،]/)
                    .map((v) => v.trim())
                    .filter(Boolean),
                })
              }
            />
            <datalist id="article-tags">
              {taxonomy.tags.map((tag) => (
                <option key={tag} value={tag} />
              ))}
            </datalist>
          </Field>
        </div>
        <h2>{a.content}</h2>
        <ArticleRichEditor
          key={language}
          document={details.document}
          text={value.content[language]}
          language={language}
          locale={locale}
          onChange={(document) => changeDetails({ document })}
          onBusy={setUploading}
          onReady={() => setEditorReady(true)}
          disabled={mutation.pending || uploading}
        />
        <details className="article-section">
          <summary>{a.media}</summary>
          <ArticleImageUpload
            locale={locale}
            label={a.cover}
            onBusy={setUploading}
            onUploaded={(cover) => change({ ...value, cover })}
          />
          <div className="workspace-form-grid">
            <Field label={a.imagePath}>
              <input
                name="cover"
                dir="ltr"
                value={value.cover}
                maxLength={300}
                onChange={(e) => change({ ...value, cover: e.target.value })}
              />
            </Field>
            <Field label={a.coverAlt}>
              <input
                name="coverAlt"
                value={details.coverAlt}
                maxLength={500}
                onChange={(e) =>
                  changeDetails({ ...details, coverAlt: e.target.value })
                }
              />
            </Field>
            <Field label={a.coverCaption}>
              <input
                name="coverCaption"
                value={details.coverCaption}
                maxLength={1000}
                onChange={(e) =>
                  changeDetails({ ...details, coverCaption: e.target.value })
                }
              />
            </Field>
          </div>
          {safeArticleImage(value.cover) && (
            <Image
              src={value.cover}
              alt={details.coverAlt}
              width={600}
              height={320}
              unoptimized
            />
          )}
          {value.cover && (
            <button
              type="button"
              className="workspace-button"
              onClick={() => change({ ...value, cover: "" })}
            >
              {a.removeImage}
            </button>
          )}
        </details>
        <ArticleSeoFields
          value={value}
          language={language}
          locale={locale}
          change={change}
          changeDetails={changeDetails}
        />
        <h2>{a.publishing}</h2>
        <Field label={a.status}>
          <select
            name="status"
            aria-label={a.status}
            value={status}
            onChange={(e) => {
              change({
                ...value,
                published: e.target.value === "published",
                editorial: {
                  ...value.editorial,
                  unpublished: e.target.value === "unpublished",
                },
              });
            }}
          >
            <option value="draft">{a.draft}</option>
            <option value="published">{a.published}</option>
            <option value="unpublished">{a.unpublished}</option>
          </select>
        </Field>
        {post && (
          <p>
            {a.timestamps}: <time>{post.createdAt}</time> /{" "}
            <time>{post.updatedAt}</time> /{" "}
            <time>{post.publishedAt || "—"}</time>
          </p>
        )}
        <MutationFeedback feedback={mutation.feedback} />
        <div className="workspace-form-actions">
          <SaveButton pending={mutation.pending || uploading} locale={locale}>
            {post ? t.save : t.createArticle}
          </SaveButton>
          <button
            className="workspace-button"
            type="button"
            onClick={() => setPreview(!preview)}
            aria-expanded={preview}
          >
            {preview ? a.closePreview : a.preview}
          </button>
          {post && (
            <button
              type="button"
              className="workspace-button danger"
              onClick={remove}
            >
              {t.delete}
            </button>
          )}
        </div>
        {preview && (
          <section
            className="article-preview article-rich-content"
            aria-label={a.preview}
            lang={language}
            dir={language === "fa" ? "rtl" : "ltr"}
          >
            <h2>{value.title[language]}</h2>
            <p>{value.excerpt[language]}</p>
            {safeArticleImage(value.cover) && (
              <figure>
                <Image
                  src={value.cover}
                  alt={details.coverAlt}
                  width={900}
                  height={500}
                  unoptimized
                />
                {details.coverCaption && (
                  <figcaption>{details.coverCaption}</figcaption>
                )}
              </figure>
            )}
            <ArticleBody
              document={details.document}
              text={value.content[language]}
              title={value.title[language]}
            />
          </section>
        )}
      </FormControls>
    </form>
  );
}
