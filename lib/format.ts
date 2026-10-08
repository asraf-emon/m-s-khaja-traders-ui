export function formatBdt(amount: number | null | undefined) {
  if (amount == null || Number.isNaN(amount)) return '—';
  const formatted = new Intl.NumberFormat('en-BD', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `৳${formatted}`;
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function formatDay(value?: string | null, locale: 'en' | 'bn' = 'en') {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB');
}

export function withDates(path: string, from: string, to: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();
  return query ? `${path}${path.includes('?') ? '&' : '?'}${query}` : path;
}

export function stockLabelKey(status: string) {
  if (status === 'out') return 'stock.out';
  if (status === 'low') return 'stock.low';
  return 'stock.in';
}
