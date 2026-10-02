import type {Metadata} from 'next';
import type {Locale} from './i18n';
export function pageMetadata(locale:Locale,path:string,title:string,description:string):Metadata {const base=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';return {title,description,alternates:{canonical:`${base}/${locale}${path}`,languages:{en:`${base}/en${path}`,fa:`${base}/fa${path}`,'x-default':`${base}/fa${path}`}},openGraph:{title:`${title} | Salsal`,description,url:`${base}/${locale}${path}`,siteName:'Salsal',locale:locale==='fa'?'fa_IR':'en_US',type:'website'}};}
