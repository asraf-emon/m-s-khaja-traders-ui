import { messages, type MessageKey } from '@/i18n/messages';

export function named(t: (key: MessageKey) => string, key: string) {
  if (Object.prototype.hasOwnProperty.call(messages.en, key)) return t(key as MessageKey);
  return key;
}

export function statusTone(status: string): 'ok' | 'warn' | 'bad' | 'neutral' {
  if (status === 'paid' || status === 'delivered' || status === 'confirmed') return 'ok';
  if (status === 'pending' || status === 'processing' || status === 'shipped') return 'warn';
  if (status === 'cancelled' || status === 'failed' || status === 'refunded') return 'bad';
  return 'neutral';
}
