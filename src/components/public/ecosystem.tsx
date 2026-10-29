import Link from "next/link";
import { dictionary, type Locale } from "@/lib/i18n";
import { getVisibleServices } from "@/lib/catalog";
import { ServiceIcon } from "./service-icon";
import { BrandLogo } from "./brand-logo";
const slugs = [
  "instagram-marketing",
  "seo",
  "web-development",
  "video-editing",
  "photography",
  "videography",
];
export async function Ecosystem({ locale }: { locale: Locale }) {
  const d = dictionary(locale).home;
  const services = (await getVisibleServices(locale));
  return (
    <div className="ecosystem" aria-label={d.systemTitle}>
      <svg
        className="ecosystem-lines"
        viewBox="0 0 1100 398"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="line" x1="0" x2="1">
            <stop stopColor="#e5ddf4" />
            <stop offset=".5" stopColor="#a78bdd" />
            <stop offset="1" stopColor="#e5ddf4" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="url(#line)" strokeWidth="1.2">
          <path d="M155 64C340 64 325 154 550 154S770 64 945 64" />
          <path d="M75 179C270 179 370 154 550 154S810 179 1025 179" />
          <path d="M175 298C340 298 350 154 550 154S765 298 925 298" />
        </g>
        <g fill="#fbf9ff" stroke="#bda3ea">
          <circle cx="324" cy="104" r="3" />
          <circle cx="793" cy="102" r="3" />
          <circle cx="321" cy="164" r="3" />
          <circle cx="793" cy="164" r="3" />
          <circle cx="336" cy="243" r="3" />
          <circle cx="786" cy="243" r="3" />
        </g>
      </svg>
      {slugs.map((slug, i) => {
        const service = services.find((item) => item.slug === slug);
        if (!service) return null;
        return (
          <Link
            key={slug}
            className={`eco-node eco-${i}`}
            href={`/${locale}/services/${slug}`}
          >
            <span>
              <ServiceIcon name={slug} size={20} />
            </span>
            <strong>{service?.name}</strong>
          </Link>
        );
      })}
      <div className="eco-center">
        <div className="eco-core">
          <span className="brand-mark">
            <BrandLogo compact />
          </span>
          <span>
            {d.centralLabel} {d.centralAccent}
          </span>
        </div>
      </div>
      <p className="eco-caption">{d.centralCaption}</p>
    </div>
  );
}
export function MiniOrbit({ locale }: { locale: Locale }) {
  const d = dictionary(locale).home;
  return (
    <div className="mini-orbit" aria-hidden="true">
      <div className="orbit-ring" />
      <div className="orbit-ring" />
      <div className="orbit-ring" />
      <span className="brand-mark">
        <BrandLogo compact />
      </span>
      <span className="orbit-label ol-1">{d.nodeContent}</span>
      <span className="orbit-label ol-2">{d.nodeAnalytics}</span>
      <span className="orbit-label ol-3">{d.nodeBranding}</span>
    </div>
  );
}
