import {Header} from '@/components/public/header';
import {Footer} from '@/components/public/footer';
import {getLocale,dictionary} from '@/lib/i18n';
export default async function PublicLayout({children,params}: {children:React.ReactNode;params:Promise<{locale:string}>}) {const locale=getLocale((await params).locale);return <><a className="skip-link" href="#main">{dictionary(locale).common.skipToContent}</a><Header locale={locale}/><main id="main">{children}</main><Footer locale={locale}/></>;}
