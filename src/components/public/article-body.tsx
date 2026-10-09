import { createElement, Fragment, type ReactNode } from "react";
import Image from "next/image";
import {
  legacyDocument,
  richDocumentSchema,
  safeArticleImage,
  safeLink,
  type ArticleNode,
} from "@/lib/article-content";
/** No stored HTML is executed. Unsupported legacy JSON falls back to its original prose. */
export function ArticleBody({
  document,
  text,
  title = "",
}: {
  document?: ArticleNode | null;
  text: string;
  title?: string;
}) {
  const parsed = document ? richDocumentSchema.safeParse(document) : null;
  const root = parsed?.success ? parsed.data : legacyDocument(text);
  function render(node: ArticleNode, key: number): ReactNode {
    const children = node.content?.map(render);
    if (node.type === "text") {
      const marked = (node.marks || []).reduce<ReactNode>((child, mark) => {
        const tags: Record<string, string> = {
          bold: "strong",
          italic: "em",
          underline: "u",
          strike: "s",
          code: "code",
        };
        if (mark.type === "link")
          return typeof mark.attrs?.href === "string" &&
            safeLink(mark.attrs.href) ? (
            <a
              href={mark.attrs.href}
              title={
                typeof mark.attrs.title === "string"
                  ? mark.attrs.title
                  : undefined
              }
              rel="noopener noreferrer"
            >
              {child}
            </a>
          ) : (
            child
          );
        return tags[mark.type]
          ? createElement(tags[mark.type], null, child)
          : child;
      }, node.text);
      return <Fragment key={key}>{marked}</Fragment>;
    }
    if (node.type === "doc") return children;
    if (node.type === "image") {
      const src = String(node.attrs?.src || "");
      if (!safeArticleImage(src)) return null;
      return (
        <figure key={key}>
          <Image
            src={src}
            alt={String(node.attrs?.alt || "")}
            width={900}
            height={500}
            unoptimized={src.startsWith("/api/")}
          />
          {node.attrs?.caption ? (
            <figcaption>{String(node.attrs.caption)}</figcaption>
          ) : null}
        </figure>
      );
    }
    if (node.type === "heading") {
      // The template owns H1; a repeated title is omitted, other body H1s become H2.
      const level = Number(node.attrs?.level || 2);
      if (
        level === 1 &&
        node.content
          ?.map((n) => n.text || "")
          .join("")
          .trim() === title.trim()
      )
        return null;
      return createElement(
        `h${Math.max(2, level)}`,
        { key, dir: String(node.attrs?.dir || "auto") },
        children,
      );
    }
    if (node.type === "codeBlock")
      return (
        <pre key={key} dir="ltr">
          <code>{children}</code>
        </pre>
      );
    if (node.type === "table")
      return (
        <div className="article-table-scroll" key={key}>
          <table>
            <tbody>{children}</tbody>
          </table>
        </div>
      );
    const tags: Record<string, string> = {
      paragraph: "p",
      bulletList: "ul",
      orderedList: "ol",
      listItem: "li",
      blockquote: "blockquote",
      horizontalRule: "hr",
      hardBreak: "br",
      tableRow: "tr",
      tableCell: "td",
      tableHeader: "th",
    };
    const tag = tags[node.type];
    if (!tag) return null;
    return createElement(
      tag,
      {
        key,
        ...(node.type === "orderedList"
          ? { start: Number(node.attrs?.start || 1) }
          : {}),
        ...(["tableCell", "tableHeader"].includes(node.type)
          ? {
              colSpan: Number(node.attrs?.colspan || 1),
              rowSpan: Number(node.attrs?.rowspan || 1),
            }
          : {}),
        ...(node.type === "paragraph" && node.attrs?.dir
          ? { dir: String(node.attrs.dir) }
          : {}),
      },
      ...(["br", "hr"].includes(tag) ? [] : [children]),
    );
  }
  return <>{render(root, 0)}</>;
}
