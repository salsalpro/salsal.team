import type {Metadata} from 'next';
import '@fontsource-variable/manrope';
import '@fontsource-variable/vazirmatn';
import '@/styles/globals.css';
import '@/styles/dashboard.css';
import {getLocale} from '@/lib/i18n';
export const metadata: Metadata = {title:{default:'Salsal — Digital, in harmony.',template:'%s | Salsal'},description:'Strategy, content, and technology. Connected around your next stage of growth.',metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'), icons:{icon:'/icon.svg'}};
export default async function LocaleLayout({children,params}: {children:React.ReactNode;params:Promise<{locale:string}>}) {
 const {locale:input}=await params; const locale=getLocale(input);
 return <html lang={locale} dir={locale==='fa'?'rtl':'ltr'}><body>{children}</body></html>;
}
