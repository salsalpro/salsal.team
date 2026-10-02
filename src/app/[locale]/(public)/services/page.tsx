import {getLocale,dictionary} from '@/lib/i18n';
import {pageMetadata} from '@/lib/metadata';
import {ServiceCards,CtaPanel} from '@/components/public/sections';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{locale:string}>}){const locale=getLocale((await params).locale);const d=dictionary(locale).services;return pageMetadata(locale,'/services',`${d.title} ${d.accent}`,d.description);}
export default async function Services({params}:{params:Promise<{locale:string}>}){const locale=getLocale((await params).locale);const t=dictionary(locale).services;return <div className="container"><div className="page-hero"><span className="eyebrow">{t.eyebrow}</span><h1>{t.title}<br/><span style={{color:'var(--purple)'}}>{t.accent}</span></h1><p>{t.description}</p></div><section className="section" style={{paddingTop:20}}><ServiceCards locale={locale}/></section><CtaPanel locale={locale}/></div>}
