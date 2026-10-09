"use client";
import { useState } from "react";
import { articleMessages } from "@/content/article-messages";
import type { Locale } from "@/lib/i18n";
export function ArticleImageUpload({
  locale,
  label,
  onUploaded,
  onBusy,
}: {
  locale: Locale;
  label?: string;
  onUploaded: (src: string) => void;
  onBusy?: (busy: boolean) => void;
}) {
  const t = articleMessages(locale);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="article-upload">
      <label className="workspace-field">
        <span>{label || t.upload}</span>
        <input
          aria-label={label || t.upload}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          onChange={async (event) => {
            const field = event.currentTarget;
            const file = field.files?.[0];
            if (!file) return;
            setBusy(true);
            onBusy?.(true);
            setError("");
            try {
              const data = new FormData();
              data.set("file", file);
              const response = await fetch("/api/admin/blog/images", {
                method: "POST",
                body: data,
              });
              const result = await response.json();
              if (!response.ok || !result.image?.src)
                throw Error(result.error || t.saveError);
              onUploaded(result.image.src);
            } catch (e) {
              setError(e instanceof Error ? e.message : t.saveError);
            } finally {
              setBusy(false);
              onBusy?.(false);
              field.value = "";
            }
          }}
        />
        <small>{t.imageHelp}</small>
      </label>
      {busy && <p role="status">{t.uploading}</p>}
      {error && (
        <p className="workspace-form-feedback error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
