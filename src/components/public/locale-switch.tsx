"use client";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import type { Locale } from "@/lib/i18n";
const labels = {
  en: { target: "fa", label: "فارسی", title: "تغییر زبان به فارسی" },
  fa: { target: "en", label: "EN", title: "Switch to English" },
} as const;
export function LocaleSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();
  const query = useSearchParams();
  const item = labels[locale];
  const switchingArticle = /^\/(en|fa)\/blog\/[^/]+$/.test(pathname);
  const path = switchingArticle
    ? `/${item.target}/blog`
    : pathname.replace(/^\/(en|fa)(?=\/|$)/, `/${item.target}`);
  if (switchingArticle)
    return (
      <button
        type="button"
        className="locale-switch"
        aria-label={item.title}
        onClick={() => {
          const alternate = Array.from(
            document.querySelectorAll<HTMLLinkElement>(
              'link[rel="alternate"][hreflang]',
            ),
          ).find((link) => link.hreflang === item.target);
          router.push(
            alternate
              ? new URL(alternate.href).pathname
              : `/${item.target}/blog`,
          );
        }}
      >
        <Languages size={15} />
        <span lang={item.target}>{item.label}</span>
      </button>
    );
  return (
    <Link
      href={`${path}${query.size ? "?" + query.toString() : ""}`}
      className="locale-switch"
      hrefLang={item.target}
      aria-label={item.title}
    >
      <Languages size={15} />
      <span lang={item.target}>{item.label}</span>
    </Link>
  );
}
