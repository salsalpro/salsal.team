import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { dictionary, type Locale } from "@/lib/i18n";
import { getVisibleServices } from "@/lib/catalog";
import { ServiceIcon } from "./service-icon";
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
export function ServiceCards({
  locale,
  limit,
}: {
  locale: Locale;
  limit?: number;
}) {
  const d = dictionary(locale);
  const services = getVisibleServices(locale);
  return (
    <div className="service-grid">
      {services.slice(0, limit).map((s, i) => (
        <Link
          href={`/${locale}/services/${s.slug}`}
          className={`service-card ${i === 0 ? "featured" : ""}`}
          key={s.slug}
        >
          <span className="card-index">{String(i + 1).padStart(2, "0")}</span>
          <div className="service-icon">
            <ServiceIcon name={s.slug} />
          </div>
          <h3>{s.name}</h3>
          <p>{s.tagline}</p>
          <span className="text-link">
            {d.common.learnMore}
            <Plus size={14} />
          </span>
        </Link>
      ))}
    </div>
  );
}
export function CtaPanel({ locale }: { locale: Locale }) {
  const d = dictionary(locale).home;
  return (
    <>
      <div className="cta-panel">
        <div>
          <span className="eyebrow">{d.ctaEyebrow}</span>
          <h2 style={{ marginTop: 14 }}>
            {d.ctaTitle}{" "}
            <span style={{ color: "var(--purple)" }}>{d.ctaAccent}</span>
          </h2>
          <p>{d.ctaDescription}</p>
        </div>
        <Link className="btn" href={`/${locale}/contact`}>
          {d.ctaButton}
        </Link>
      </div>
      <div className="values-list">
        {d.capabilityLabels.slice(0, 3).map((s) => (
          <span key={s}>
            <Check size={12} />
            {s}
          </span>
        ))}
      </div>
    </>
  );
}
export function ProjectCover({
  index = 0,
  large = false,
  locale,
  client,
  industry,
  isDemo = false,
}: {
  index?: number;
  large?: boolean;
  locale: Locale;
  client?: string;
  industry?: string;
  isDemo?: boolean;
}) {
  return (
    <div
      className={`project-cover cover-${index % 3} ${large ? "project-detail-cover" : ""}`}
    >
      {isDemo && (
        <span className="concept-tag">{dictionary(locale).common.concept}</span>
      )}
      <div className="project-word">
        {client || "Salsal"}
        <small>{industry}</small>
      </div>
    </div>
  );
}
