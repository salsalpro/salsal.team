import type { MetadataRoute } from "next";
import {
  listBlogPosts,
  listPortfolio,
  listServiceSettings,
} from "@/lib/repository";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const paths = [
    "",
    "/services",
    "/portfolio",
    "/about",
    "/blog",
    "/contact",
    ...(await listServiceSettings())
      .filter((s) => s.visible)
      .map((s) => `/services/${s.slug}`),
    ...(await listBlogPosts({ publishedOnly: true })).map((p) => `/blog/${p.slug}`),
    ...(await listPortfolio()).map((p) => `/portfolio/${p.slug}`),
  ];
  return paths.flatMap((path) =>
    ["en", "fa"].map((locale) => ({
      url: `${base}/${locale}${path}`,
      alternates: {
        languages: { en: `${base}/en${path}`, fa: `${base}/fa${path}` },
      },
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.7,
    })),
  );
}
