import { format, parseISO, isValid } from 'date-fns';
import { useUI } from '../store';
export const money = (value, compact = false) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: useUI.getState().currency,
    maximumFractionDigits: 0,
    ...(compact ? { notation: 'compact' } : {}),
  }).format(value || 0);
export const number = (value) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0);
export const date = (value, pattern = 'dd MMM yyyy') =>
  value && isValid(parseISO(String(value))) ? format(parseISO(String(value)), pattern) : '—';
export const initials = (name) =>
  (name || 'Creator')
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();
export const pathFor = (resource) =>
  ['revenue', 'expenses'].includes(resource) ? `/finance/${resource}` : `/${resource}`;
export function exportCSV(rows, name) {
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))].filter(
    (k) => !['_id', 'owner', '__v', 'deletedAt'].includes(k),
  );
  const cell = (value) =>
    '"' +
    String(value ?? '')
      .replace(/^\s*[=+@-]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  const text = [
    keys.map(cell).join(','),
    ...rows.map((r) =>
      keys.map((k) => cell(typeof r[k] === 'object' ? JSON.stringify(r[k]) : r[k])).join(','),
    ),
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `creatoros-${name}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}