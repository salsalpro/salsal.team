"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { dictionary } from "@/lib/i18n";
export default function NotFound() {
  const params = useParams();
  const locale = params.locale === "fa" ? "fa" : "en";
  const d = dictionary(locale).common;
  return (
    <div
      className="container section"
      style={{
        textAlign: "center",
        minHeight: "65vh",
        display: "grid",
        placeContent: "center",
      }}
    >
      <span className="eyebrow">404</span>
      <h1 style={{ fontSize: 42, marginBlock: 22 }}>{d.notFound}</h1>
      <p>{d.notFoundText}</p>
      <Link className="btn" href={`/${locale}`} style={{ margin: "30px auto" }}>
        {d.backHome}
      </Link>
    </div>
  );
}
