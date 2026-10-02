import {redirect} from 'next/navigation';
import {getSession} from '@/lib/authorization';
import {getLocale,dictionary} from '@/lib/i18n';
import {AuthForm} from '@/components/public/auth-form';
import {MiniOrbit} from '@/components/public/ecosystem';
export const metadata={title:'Client portal',robots:{index:false,follow:false}};
export default async function Login({params}:{params:Promise<{locale:string}>}){const locale=getLocale((await params).locale);const session=await getSession();if(session)redirect(`/${locale}/${session.user.role==='ADMIN'?'admin':'dashboard'}`);const d=dictionary(locale).auth;return <div className="container"><div className="auth-layout"><div className="auth-story"><div><span className="eyebrow">SALSAL / WORKSPACE</span><h1 style={{marginTop:22}}>{d.protected}</h1><p>{d.protectedDescription}</p></div><MiniOrbit locale={locale}/></div><AuthForm locale={locale}/></div></div>}
