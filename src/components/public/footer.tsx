import Link from "next/link";
import { Brand } from "./brand";
import { dictionary, type Locale } from "@/lib/i18n";
import { getVisibleServices } from "@/lib/catalog";
export function Footer({ locale }: { locale: Locale }) {
  const d = dictionary(locale);
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Brand href={`/${locale}`} light />
            <p>{d.home.description}</p>
          </div>
          <div className="footer-links">
            <div>
              <strong>{d.nav.services}</strong>
              {getVisibleServices(locale)
                .slice(0, 4)
                .map((s) => (
                  <Link href={`/${locale}/services/${s.slug}`} key={s.slug}>
                    {s.name}
                  </Link>
                ))}
            </div>
            <div>
              <strong>Salsal</strong>
              <Link href={`/${locale}/about`}>{d.nav.about}</Link>
              <Link href={`/${locale}/portfolio`}>{d.nav.portfolio}</Link>
              <Link href={`/${locale}/blog`}>{d.nav.blog}</Link>
              <Link href={`/${locale}/contact`}>{d.nav.contact}</Link>
            </div>
            <div>
              <strong>{d.nav.dashboard}</strong>
              <Link href={`/${locale}/login`}>{d.nav.login}</Link>
              <Link href={`/${locale}/dashboard`}>{d.nav.dashboard}</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Salsal</span>
          <span>{d.home.centralCaption}</span>
        </div>
      </div>
    </footer>
  );
}
