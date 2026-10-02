'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent, type ReactNode } from 'react';
import { CheckCircle2, LoaderCircle } from 'lucide-react';
import type { Locale } from '@/lib/i18n';
import type { Lead, ServiceSetting, UserSummary } from '@/lib/domain';
import { dashboardMessages, statusLabel } from '@/content/dashboard-messages';

export function useMutation(locale: Locale) {
  const router = useRouter();
  const t = dashboardMessages(locale);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  async function mutate(url: string, body: unknown, method = 'PATCH') {
    setPending(true); setFeedback(null);
    try { const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }); const result: { error?: string } = await response.json(); if (!response.ok) { setFeedback({ type: 'error', message: t.error }); return false; } if (result.error) { setFeedback({ type: 'error', message: t.error }); return false; } setFeedback({ type: 'success', message: t.saved }); router.refresh(); return true; }
    catch { setFeedback({ type: 'error', message: t.error }); return false; }
    finally { setPending(false); }
  }
  return { pending, feedback, mutate, setFeedback };
}
export function MutationFeedback({ feedback }: { feedback: { type: 'success' | 'error'; message: string } | null }) { return feedback ? <p className={`workspace-form-feedback ${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.type === 'success' && <CheckCircle2 size={16} />}{feedback.message}</p> : null; }
export function SaveButton({ pending, locale, children }: { pending: boolean; locale: Locale; children?: ReactNode }) { const t = dashboardMessages(locale); return <button className="workspace-button primary" type="submit" disabled={pending}>{pending && <LoaderCircle className="workspace-spin" size={16} />}{pending ? t.saving : children ?? t.save}</button>; }
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) { return <label className="workspace-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }

export function ProfileForm({ user, locale }: { user: UserSummary; locale: Locale }) {
  const t = dashboardMessages(locale); const mutation = useMutation(locale);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); await mutation.mutate('/api/profile', { name: data.get('name'), company: data.get('company'), phone: data.get('phone'), locale }); }
  return <form onSubmit={submit} className="workspace-form"><div className="workspace-form-grid"><Field label={t.name}><input name="name" required minLength={2} maxLength={100} autoComplete="name" defaultValue={user.name} /></Field><Field label={t.email} hint={t.emailHint}><input type="email" value={user.email} readOnly dir="ltr" /></Field><Field label={t.company}><input name="company" maxLength={150} autoComplete="organization" defaultValue={user.company} /></Field><Field label={t.phone}><input name="phone" maxLength={40} type="tel" autoComplete="tel" defaultValue={user.phone} dir="ltr" /></Field></div><MutationFeedback feedback={mutation.feedback} /><SaveButton pending={mutation.pending} locale={locale} /></form>;
}
export function LeadEditor({ lead, locale }: { lead: Lead; locale: Locale }) {
  const t = dashboardMessages(locale); const mutation = useMutation(locale);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); await mutation.mutate(`/api/admin/leads/${lead.id}`, { status: data.get('status'), notes: data.get('notes') }); }
  return <form onSubmit={submit} className="workspace-form"><Field label={t.status}><select name="status" defaultValue={lead.status}>{['new', 'contacted', 'qualified', 'converted', 'closed'].map(status => <option key={status} value={status}>{statusLabel(status, locale)}</option>)}</select></Field><Field label={t.notes}><textarea name="notes" rows={5} maxLength={5000} defaultValue={lead.notes} /></Field><MutationFeedback feedback={mutation.feedback} /><SaveButton pending={mutation.pending} locale={locale} /></form>;
}
export function ServiceEditor({ setting, title, locale }: { setting: ServiceSetting; title: string; locale: Locale }) {
  const t = dashboardMessages(locale); const mutation = useMutation(locale);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); await mutation.mutate(`/api/admin/services/${setting.slug}`, { visible: data.get('visible') === 'on', sortOrder: Number(data.get('sortOrder')) }); }
  return <form onSubmit={submit} className="workspace-service-editor"><div><strong>{title}</strong><small dir="ltr">/{setting.slug}</small></div><label className="workspace-checkbox"><input type="checkbox" name="visible" defaultChecked={setting.visible} /><span>{t.visible}</span></label><Field label={t.ordering}><input name="sortOrder" type="number" min={0} max={100} defaultValue={setting.sortOrder} /></Field><SaveButton pending={mutation.pending} locale={locale} /><MutationFeedback feedback={mutation.feedback} /></form>;
}
