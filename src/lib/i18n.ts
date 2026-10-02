import { notFound } from 'next/navigation';
import { messages, type Messages } from '@/content/messages';
export const locales = ['en', 'fa'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
export const directions: Record<Locale, 'ltr' | 'rtl'> = { en: 'ltr', fa: 'rtl' };
export function isLocale(value: string): value is Locale { return locales.some((locale) => locale === value); }
export function getLocale(value: string): Locale { if (!isLocale(value)) notFound(); return value; }
export function dictionary(locale: Locale): Messages { return messages[locale]; }
export function formatNumber(value: number, locale: Locale, options?: Intl.NumberFormatOptions): string { return new Intl.NumberFormat(locale, options).format(value); }
export function formatDate(value: string | Date, locale: Locale, options?: Intl.DateTimeFormatOptions): string { return new Intl.DateTimeFormat(locale, { year:'numeric', month:'short', day:'numeric', timeZone:'UTC', ...options }).format(new Date(value)); }
