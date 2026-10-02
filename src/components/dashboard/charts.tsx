import { formatNumber } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

export function BarChart({ data, locale, label }: { data: { label: string; value: number }[]; locale: Locale; label: string }) {
  const maximum = Math.max(...data.map(item => item.value), 1);
  return <div className="workspace-chart" role="img" aria-label={`${label}: ${data.map(item => `${item.label}: ${formatNumber(item.value, locale)}`).join('، ')}`}><div className="workspace-chart-grid"><span>{formatNumber(maximum, locale)}</span><span>{formatNumber(Math.round(maximum / 2), locale)}</span><span>{formatNumber(0, locale)}</span></div><div className="workspace-chart-bars">{data.map((item, index) => <div className="workspace-chart-column" key={`${item.label}-${index}`}><span className="workspace-chart-number">{formatNumber(item.value, locale)}</span><span className="workspace-chart-bar" style={{ height: `${Math.max(2, item.value / maximum * 150)}px` }} /><span className="workspace-chart-label">{item.label}</span></div>)}</div></div>;
}
export function DistributionChart({ data, locale, label }: { data: { label: string; value: number }[]; locale: Locale; label: string }) {
  const total = data.reduce((sum, row) => sum + row.value, 0);
  const colors = ['#7551eb', '#b6a2fa', '#c8cfd9', '#7aa89b', '#decfa9'];
  let offset = 0;
  return <div className="workspace-distribution"><svg viewBox="0 0 150 150" className="workspace-donut" role="img" aria-label={`${label}: ${data.map(item => `${item.label}: ${item.value}`).join(', ')}`}><circle cx="75" cy="75" r="56" fill="none" stroke="#eeedf2" strokeWidth="17" />{data.map((item, index) => { const percent = total ? item.value / total * 100 : 0; const oldOffset = offset; offset += percent; return <circle key={item.label} cx="75" cy="75" r="56" fill="none" stroke={colors[index % colors.length]} strokeWidth="17" pathLength="100" strokeDasharray={`${percent} ${100 - percent}`} strokeDashoffset={-oldOffset} transform="rotate(-90 75 75)" />; })}<text x="75" y="81" textAnchor="middle" className="workspace-donut-total">{formatNumber(total, locale)}</text></svg><ul>{data.map((item, index) => <li key={item.label}><span style={{ background: colors[index % colors.length] }} /><span>{item.label}</span><strong>{formatNumber(item.value, locale)}</strong></li>)}</ul></div>;
}
