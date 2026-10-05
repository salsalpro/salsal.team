import { getLocale, dictionary } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { getVisibleServices } from "@/lib/catalog";
import { ContactForm } from "@/components/public/contact-form";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = getLocale((await params).locale);
  const d = dictionary(locale).contact;
  return pageMetadata(
    locale,
    "/contact",
    `${d.title} ${d.accent}`,
    d.description,
  );
}
export default async function Contact({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const locale = getLocale((await params).locale);
  const t = dictionary(locale).contact;
  const query = await searchParams;
  const services = (await getVisibleServices(locale)).map(({ slug, name }) => ({
    slug,
    name,
  }));
  return (
    <div className="container">
      <div className="page-hero">
        <span className="eyebrow">{t.eyebrow}</span>
        <h1>
          {t.title}
          <br />
          <span style={{ color: "var(--purple)" }}>{t.accent}</span>
        </h1>
        <p>{t.description}</p>
      </div>
      <section className="contact-layout section" style={{ paddingTop: 20 }}>
        <div className="contact-aside">
          <h2>{t.noteTitle}</h2>
          <p>{t.note}</p>
          <h3 style={{ marginTop: 45 }}>{t.nextTitle}</h3>
          {t.nextSteps.map((step, i) => (
            <div className="contact-step" key={step}>
              <span>0{i + 1}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>
        <ContactForm
          locale={locale}
          services={services}
          selectedService={
            services.some((s) => s.slug === query.service) ? query.service : ""
          }
        />
      </section>
    </div>
  );
}
