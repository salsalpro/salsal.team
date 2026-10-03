import Link from "next/link";
import { dictionary, type Locale } from "@/lib/i18n";
import { getVisibleServices } from "@/lib/catalog";
import { ServiceIcon } from "./service-icon";
const slugs = [
  "instagram-marketing",
  "seo",
  "web-development",
  "video-editing",
  "photography",
  "videography",
];
export function Ecosystem({ locale }: { locale: Locale }) {
  const d = dictionary(locale).home;
  const services = getVisibleServices(locale);
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
            <svg viewBox="0 0 32 32" fill="none">
              <path
                d="M24 8H14c-5 0-7 2-7 5s3 4 7 4h4c3 0 5 1 5 4s-3 4-7 4H7M8 24h10c5 0 7-2 7-5s-3-4-7-4h-4c-3 0-5-1-5-4s3-4 7-4h9"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
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
        <ServiceIcon name="digital-marketing" size={38} />
      </span>
      <span className="orbit-label ol-1">{d.nodeContent}</span>
      <span className="orbit-label ol-2">{d.nodeAnalytics}</span>
      <span className="orbit-label ol-3">{d.nodeBranding}</span>
    </div>
  );
}
