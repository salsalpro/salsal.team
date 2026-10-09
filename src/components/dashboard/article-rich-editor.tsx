"use client";
import { useEffect, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { articleMessages } from "@/content/article-messages";
import {
  legacyDocument,
  safeArticleImage,
  safeLink,
  type ArticleNode,
} from "@/lib/article-content";
import type { Locale } from "@/lib/i18n";
import { ArticleImageUpload } from "./article-image-upload";
const CaptionImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      caption: {
        default: "",
        parseHTML: (element) =>
          element.closest("figure")?.querySelector("figcaption")?.textContent ||
          element.getAttribute("data-caption") ||
          "",
        renderHTML: (attrs) => ({ "data-caption": attrs.caption }),
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "figure",
      ["img", HTMLAttributes],
      ["figcaption", String(HTMLAttributes["data-caption"] || "")],
    ];
  },
});
export function ArticleRichEditor({
  document,
  text,
  language,
  locale,
  onChange,
  onBusy,
  onReady,
  disabled = false,
}: {
  document?: ArticleNode | null;
  text: string;
  language: Locale;
  locale: Locale;
  onChange: (doc: ArticleNode) => void;
  onBusy: (busy: boolean) => void;
  onReady: () => void;
  disabled?: boolean;
}) {
  const t = articleMessages(locale);
  const [notice, setNotice] = useState("");
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, isAllowedUri: (url) => safeLink(url) },
      }),
      CaptionImage.configure({ allowBase64: false }),
      TableKit.configure({ table: { resizable: false } }),
    ],
    content: document || legacyDocument(text),
    editorProps: {
      attributes: {
        class: "article-rich-content",
        role: "textbox",
        "aria-label": t.body,
        "aria-multiline": "true",
        dir: language === "fa" ? "rtl" : "ltr",
        lang: language,
      },
      transformPastedHTML(html) {
        const dom = new DOMParser().parseFromString(html, "text/html");
        let removed = false;
        for (const image of dom.querySelectorAll("img"))
          if (!safeArticleImage(image.getAttribute("src") || "")) {
            image.remove();
            removed = true;
          }
        for (const link of dom.querySelectorAll("a"))
          if (!safeLink(link.getAttribute("href") || "")) {
            link.removeAttribute("href");
            removed = true;
          }
        dom
          .querySelectorAll("script,style,iframe,object,embed")
          .forEach((n) => {
            n.remove();
            removed = true;
          });
        if (removed) setNotice(t.pasteWarning);
        return dom.body.innerHTML;
      },
    },
    onCreate: () => onReady(),
    onUpdate: ({ editor }) => onChange(editor.getJSON() as ArticleNode),
    onSelectionUpdate: ({ editor }) => {
      if (editor.isActive("image")) {
        const attrs = editor.getAttributes("image");
        setAlt(String(attrs.alt || ""));
        setCaption(String(attrs.caption || ""));
      }
    },
  });
  useEffect(() => {
    if (editor && editor.isEditable === disabled)
      editor.setEditable(!disabled, false);
  }, [editor, disabled]);
  useEditorState({ editor, selector: (ctx) => ctx.editor?.state });
  if (!editor)
    return (
      <p role="status">
        {locale === "fa" ? "در حال آماده‌سازی ویرایشگر…" : "Loading editor…"}
      </p>
    );
  const button = (
    label: string,
    action: () => void,
    active = false,
    disabled = false,
  ) => (
    <button
      key={label}
      type="button"
      className="workspace-button"
      aria-pressed={active}
      disabled={disabled}
      onClick={action}
    >
      {label}
    </button>
  );
  return (
    <div className="article-editor">
      <div className="article-editor-toolbar" role="group" aria-label={t.body}>
        <label>
          <span className="sr-only">{t.paragraph}</span>
          <select
            aria-label={t.paragraph}
            value={
              editor.isActive("heading")
                ? String(editor.getAttributes("heading").level)
                : "p"
            }
            onChange={(e) => {
              if (e.target.value === "p")
                editor.chain().focus().setParagraph().run();
              else
                editor
                  .chain()
                  .focus()
                  .setHeading({
                    level: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6,
                  })
                  .run();
            }}
          >
            <option value="p">{t.paragraph}</option>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option value={n} key={n}>
                H{n}
              </option>
            ))}
          </select>
        </label>
        {button(
          t.bold,
          () => {
            editor.chain().focus().toggleBold().run();
          },
          editor.isActive("bold"),
        )}
        {button(
          t.italic,
          () => {
            editor.chain().focus().toggleItalic().run();
          },
          editor.isActive("italic"),
        )}
        {button(
          t.underline,
          () => {
            editor.chain().focus().toggleUnderline().run();
          },
          editor.isActive("underline"),
        )}
        {button(
          t.strike,
          () => {
            editor.chain().focus().toggleStrike().run();
          },
          editor.isActive("strike"),
        )}
        {button(
          t.bulletList,
          () => {
            editor.chain().focus().toggleBulletList().run();
          },
          editor.isActive("bulletList"),
        )}
        {button(
          t.orderedList,
          () => {
            editor.chain().focus().toggleOrderedList().run();
          },
          editor.isActive("orderedList"),
        )}
        {button(
          t.quote,
          () => {
            editor.chain().focus().toggleBlockquote().run();
          },
          editor.isActive("blockquote"),
        )}
        {button(
          t.code,
          () => {
            editor.chain().focus().toggleCodeBlock().run();
          },
          editor.isActive("codeBlock"),
        )}
        {button(t.separator, () => {
          editor.chain().focus().setHorizontalRule().run();
        })}
        {button(
          t.link,
          () => {
            const href = window.prompt(
              t.linkPrompt,
              String(editor.getAttributes("link").href || ""),
            );
            if (href === null) return;
            if (!href)
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
            else if (safeLink(href))
              editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href })
                .run();
            else setNotice(t.linkPrompt);
          },
          editor.isActive("link"),
        )}
        {button(t.table, () => {
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run();
        })}
        {editor.isActive("table") && (
          <>
            {button(t.addRow, () => {
              editor.chain().focus().addRowAfter().run();
            })}
            {button(t.addColumn, () => {
              editor.chain().focus().addColumnAfter().run();
            })}
            {button(t.deleteRow, () => {
              editor.chain().focus().deleteRow().run();
            })}
            {button(t.deleteColumn, () => {
              editor.chain().focus().deleteColumn().run();
            })}
            {button(t.removeTable, () => {
              editor.chain().focus().deleteTable().run();
            })}
          </>
        )}
        {button(
          t.undo,
          () => {
            editor.chain().focus().undo().run();
          },
          false,
          !editor.can().undo(),
        )}
        {button(
          t.redo,
          () => {
            editor.chain().focus().redo().run();
          },
          false,
          !editor.can().redo(),
        )}
      </div>
      <EditorContent editor={editor} />
      {notice && <p role="status">{notice}</p>}
      <details className="article-section">
        <summary>{t.insertImage}</summary>
        <div className="workspace-form-grid">
          <label className="workspace-field">
            <span>{t.imageAlt}</span>
            <input
              value={alt}
              maxLength={500}
              onChange={(e) => setAlt(e.target.value)}
            />
          </label>
          <label className="workspace-field">
            <span>{t.caption}</span>
            <input
              value={caption}
              maxLength={1000}
              onChange={(e) => setCaption(e.target.value)}
            />
          </label>
        </div>
        <ArticleImageUpload
          locale={locale}
          onBusy={onBusy}
          onUploaded={(src) => {
            editor
              .chain()
              .focus()
              .insertContent({ type: "image", attrs: { src, alt, caption } })
              .run();
          }}
        />
        {editor.isActive("image") &&
          button(t.applyImage, () => {
            editor
              .chain()
              .focus()
              .updateAttributes("image", { alt, caption })
              .run();
          })}
      </details>
    </div>
  );
}
