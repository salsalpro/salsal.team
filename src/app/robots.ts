import type {MetadataRoute} from 'next';
export default function robots():MetadataRoute.Robots {const base=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';return {rules:{userAgent:'*',allow:'/',disallow:['/api/','/en/admin','/fa/admin','/en/dashboard','/fa/dashboard','/en/login','/fa/login']},sitemap:`${base}/sitemap.xml`};}
