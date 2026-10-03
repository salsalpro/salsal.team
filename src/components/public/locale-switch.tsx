"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";
import type { Locale } from "@/lib/i18n";
const labels = {
  en: { target: "fa", label: "فارسی", title: "تغییر زبان به فارسی" },
  fa: { target: "en", label: "EN", title: "Switch to English" },
} as const;
export function LocaleSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const query = useSearchParams();
  const item = labels[locale];
  const path = pathname.replace(/^\/(en|fa)(?=\/|$)/, `/${item.target}`);
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
