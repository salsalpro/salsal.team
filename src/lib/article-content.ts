import { z } from "zod";

export type ArticleLanguage = "fa" | "en";
export type ArticleNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: ArticleNode[];
};
export function safeLink(value: string): boolean {
  if (!value || /[\s\\\u0000-\u001f]/u.test(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (value.startsWith("#")) return true;
  try {
    const url = new URL(value);
    return (
      ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
export function safeArticleImage(value: string): boolean {
  return (
    /^\/api\/blog-images\/[a-f0-9-]{36}$/.test(value) ||
    (/^\/images\/[a-zA-Z0-9_./-]+$/.test(value) && !value.includes(".."))
  );
}
export const articleImageSchema = z
  .string()
  .max(300)
  .refine(
    (v) => !v || safeArticleImage(v),
    "Select an uploaded article image or a local /images/ asset.",
  );
export const canonicalSchema = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => {
    if (!v) return true;
    try {
      const u = new URL(v);
      return (
        ["https:", "http:"].includes(u.protocol) &&
        !u.username &&
        !u.password &&
        !u.hash &&
        !/[\s\\]/.test(v)
      );
    } catch {
      return false;
    }
  }, "Enter an absolute HTTP(S) canonical URL without credentials or a fragment.");

const nodeAttributes: Record<string, string[]> = {
  doc: [],
  text: [],
  paragraph: ["dir"],
  heading: ["level", "dir"],
  bulletList: [],
  orderedList: ["start", "type"],
  listItem: [],
  blockquote: [],
  codeBlock: ["language"],
  horizontalRule: [],
  hardBreak: [],
  image: ["src", "alt", "title", "caption", "width", "height"],
  table: [],
  tableRow: [],
  tableCell: ["colspan", "rowspan", "colwidth", "align"],
  tableHeader: ["colspan", "rowspan", "colwidth", "align"],
};
const blocks = [
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  "image",
  "table",
];
const children: Record<string, string[]> = {
  doc: blocks,
  paragraph: ["text", "hardBreak"],
  heading: ["text", "hardBreak"],
  bulletList: ["listItem"],
  orderedList: ["listItem"],
  listItem: blocks,
  blockquote: blocks,
  codeBlock: ["text"],
  table: ["tableRow"],
  tableRow: ["tableCell", "tableHeader"],
  tableCell: blocks,
  tableHeader: blocks,
};
function checkDocument(value: unknown): ArticleNode {
  let count = 0;
  function check(raw: unknown, depth: number): ArticleNode {
    if (
      ++count > 4000 ||
      depth > 32 ||
      !raw ||
      typeof raw !== "object" ||
      Array.isArray(raw)
    )
      throw Error();
    const n = raw as ArticleNode;
    if (
      !(n.type in nodeAttributes) ||
      Object.keys(n).some(
        (k) => !["type", "attrs", "content", "text", "marks"].includes(k),
      )
    )
      throw Error();
    if (
      n.text !== undefined &&
      (n.type !== "text" ||
        typeof n.text !== "string" ||
        !n.text.length ||
        n.text.length > 200000)
    )
      throw Error();
    if (n.type === "text" && n.text === undefined) throw Error();
    if (n.attrs !== undefined) {
      if (
        !n.attrs ||
        typeof n.attrs !== "object" ||
        Array.isArray(n.attrs) ||
        Object.keys(n.attrs).some((k) => !nodeAttributes[n.type].includes(k))
      )
        throw Error();
      for (const [key, val] of Object.entries(n.attrs)) {
        if (val == null) continue;
        if (
          [
            "src",
            "alt",
            "title",
            "caption",
            "language",
            "dir",
            "type",
            "align",
          ].includes(key) &&
          (typeof val !== "string" || val.length > 2000)
        )
          throw Error();
        if (
          ["level", "start", "width", "height", "colspan", "rowspan"].includes(
            key,
          ) &&
          (!Number.isInteger(val) || Number(val) < 1 || Number(val) > 10000)
        )
          throw Error();
        if (
          key === "colwidth" &&
          (!Array.isArray(val) ||
            val.length > 30 ||
            val.some((v) => !Number.isInteger(v) || v < 1 || v > 10000))
        )
          throw Error();
      }
      if (
        n.attrs.dir != null &&
        !["rtl", "ltr", "auto"].includes(String(n.attrs.dir))
      )
        throw Error();
      if (
        n.attrs.align != null &&
        !["left", "right", "center"].includes(String(n.attrs.align))
      )
        throw Error();
    }
    if (
      n.type === "heading" &&
      ![1, 2, 3, 4, 5, 6].includes(Number(n.attrs?.level))
    )
      throw Error();
    if (
      n.type === "image" &&
      (typeof n.attrs?.src !== "string" || !safeArticleImage(n.attrs.src))
    )
      throw Error();
    if (n.marks !== undefined) {
      if (n.type !== "text" || !Array.isArray(n.marks) || n.marks.length > 6)
        throw Error();
      for (const mark of n.marks) {
        if (
          !mark ||
          !["bold", "italic", "underline", "strike", "code", "link"].includes(
            mark.type,
          ) ||
          Object.keys(mark).some((k) => !["type", "attrs"].includes(k))
        )
          throw Error();
        if (mark.type === "link") {
          if (
            !mark.attrs ||
            typeof mark.attrs.href !== "string" ||
            !safeLink(mark.attrs.href) ||
            Object.keys(mark.attrs).some(
              (k) => !["href", "target", "rel", "class", "title"].includes(k),
            )
          )
            throw Error();
          if (
            Object.values(mark.attrs).some(
              (v) => v != null && (typeof v !== "string" || v.length > 2000),
            )
          )
            throw Error();
        } else if (mark.attrs && Object.keys(mark.attrs).length) throw Error();
      }
    }
    if (n.content !== undefined) {
      if (
        !Array.isArray(n.content) ||
        !children[n.type] ||
        n.content.some((c) => !children[n.type].includes(c?.type))
      )
        throw Error();
      n.content.forEach((c) => check(c, depth + 1));
    }
    return n;
  }
  const result = check(value, 0);
  if (result.type !== "doc" || JSON.stringify(result).length > 220000)
    throw Error();
  return result;
}
export const richDocumentSchema = z
  .unknown()
  .transform((value, ctx): ArticleNode => {
    try {
      return checkDocument(value);
    } catch {
      ctx.addIssue({
        code: "custom",
        message:
          "Unsupported or unsafe article content. Check links, images and formatting.",
      });
      return z.NEVER;
    }
  });
export function readableText(node: ArticleNode): string {
  if (node.type === "text") return node.text || "";
  if (node.type === "hardBreak") return "\n";
  return (node.content || [])
    .map(readableText)
    .join(
      ["paragraph", "heading", "codeBlock"].includes(node.type) ? "" : "\n",
    );
}
export function legacyDocument(text: string): ArticleNode {
  return {
    type: "doc",
    content: text
      .split(/\n\n+/)
      .filter(Boolean)
      .map((p) => {
        const heading = /^(#{1,6}) ([\s\S]*)$/.exec(p);
        return {
          type: heading ? "heading" : "paragraph",
          ...(heading ? { attrs: { level: heading[1].length } } : {}),
          content: [{ type: "text", text: heading ? heading[2] : p }],
        };
      }),
  };
}
export function detectArticleLanguage(text: string): ArticleLanguage | null {
  const fa = (
    text.match(
      /[\u0621-\u063a\u0641-\u064a\u067e\u0686\u0698\u06a9\u06af\u06cc]/g,
    ) || []
  ).length;
  const en = (text.match(/[a-z]/gi) || []).length;
  if (fa >= 3 && fa / (fa + en) >= 0.2) return "fa";
  return en >= 5 ? "en" : null;
}
/** 180 Persian / 220 English words per minute; readable prose only. */
export function readingMinutes(
  text: string,
  language: ArticleLanguage,
): number {
  const words = text.trim().split(/\s+/u).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / (language === "fa" ? 180 : 220)));
}
export const articleDetailsSchema = z
  .object({
    document: richDocumentSchema.nullable().default(null),
    coverAlt: z.string().trim().max(500).default(""),
    coverCaption: z.string().trim().max(1000).default(""),
    tags: z
      .array(z.string().trim().min(1).max(60))
      .max(30)
      .transform((v) => [...new Set(v)])
      .default([]),
    focusKeyphrase: z.string().trim().max(150).default(""),
    secondaryKeyphrases: z
      .array(z.string().trim().min(1).max(150))
      .max(10)
      .default([]),
    canonical: canonicalSchema.default(""),
    noindex: z.boolean().default(false),
    sitemap: z.boolean().default(true),
    ogTitle: z.string().trim().max(200).default(""),
    ogDescription: z.string().trim().max(500).default(""),
    ogImage: articleImageSchema.default(""),
    twitterTitle: z.string().trim().max(200).default(""),
    twitterDescription: z.string().trim().max(500).default(""),
    twitterImage: articleImageSchema.default(""),
  })
  .strict();
export type ArticleDetails = z.infer<typeof articleDetailsSchema>;
export const editorialSchema = z
  .object({
    en: articleDetailsSchema.optional(),
    fa: articleDetailsSchema.optional(),
    languageMode: z.enum(["auto", "manual"]).default("manual"),
    unpublished: z.boolean().default(false),
  })
  .strict();
export type ArticleEditorial = z.infer<typeof editorialSchema>;
export function articleDetails(
  editorial: ArticleEditorial,
  language: ArticleLanguage,
): ArticleDetails {
  return editorial[language] || articleDetailsSchema.parse({});
}
export function articleImageReferences(post: {
  cover: string;
  editorial: ArticleEditorial;
}): string[] {
  const result = [post.cover];
  function visit(node: ArticleNode) {
    if (node.type === "image" && typeof node.attrs?.src === "string")
      result.push(node.attrs.src);
    node.content?.forEach(visit);
  }
  for (const language of ["en", "fa"] as const) {
    const d = post.editorial[language];
    if (d) {
      result.push(d.ogImage, d.twitterImage);
      if (d.document) visit(d.document);
    }
  }
  return [...new Set(result.filter(Boolean))];
}
