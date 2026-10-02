'use client';
import {useParams} from 'next/navigation';
import {dictionary} from '@/lib/i18n';
export default function ErrorPage({reset}:{reset:()=>void}){const params=useParams();const locale=params.locale==='fa'?'fa':'en';const d=dictionary(locale).common;return <div className="container section"><div className="empty-state" role="alert"><h1 style={{fontSize:30}}>{d.error}</h1><button className="btn" onClick={reset} style={{marginTop:24}}>{d.retry}</button></div></div>}
