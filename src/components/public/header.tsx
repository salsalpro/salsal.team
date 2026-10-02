'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useState,Suspense} from 'react';
import {Menu,X} from 'lucide-react';
import {Brand} from './brand';
import {LocaleSwitch} from './locale-switch';
import {dictionary,type Locale} from '@/lib/i18n';
export function Header({locale}: {locale:Locale}) {const d=dictionary(locale);const path=usePathname();const [open,setOpen]=useState(false);const links=[{url:'',label:d.nav.home},{url:'/services',label:d.nav.services},{url:'/portfolio',label:d.nav.portfolio},{url:'/about',label:d.nav.about},{url:'/blog',label:d.nav.blog}];return <header className="site-header"><div className="container"><div className="nav-shell"><Brand href={`/${locale}`}/><nav className="desktop-nav" aria-label={d.nav.menu}>{links.map(x=><Link key={x.url} href={`/${locale}${x.url}`} aria-current={path===`/${locale}${x.url}`?'page':undefined}>{x.label}</Link>)}</nav><div className="nav-actions"><Suspense><LocaleSwitch locale={locale}/></Suspense><Link className="btn btn-dark" href={`/${locale}/contact`}>{d.nav.contact}</Link><button className="mobile-menu-button" aria-label={open?d.nav.close:d.nav.menu} aria-controls="mobile-nav" aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<X size={20}/>:<Menu size={20}/>}</button></div></div><nav id="mobile-nav" className="mobile-nav" data-open={open} aria-label={d.nav.menu} onKeyDown={e=>{if(e.key==='Escape')setOpen(false)}}>{[...links,{url:'/contact',label:d.nav.contact},{url:'/login',label:d.nav.login}].map(x=><Link key={x.url} href={`/${locale}${x.url}`} onClick={()=>setOpen(false)}>{x.label}</Link>)}</nav></div></header>;}
