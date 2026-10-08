'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { localized, useCart, useI18n } from '@/components/providers';
import { Button, EmptyState, Field, SelectInput, TextArea, TextInput } from '@/components/ui';
import { useQuery } from '@/hooks/use-query';
import { api } from '@/lib/api';
import { formatBdt } from '@/lib/format';
import { named } from '@/lib/labels';
import { API_URL, DISTRICTS } from '@/lib/shop';
import type { Category, PublicSettings } from '@/types';

export function CategoriesPage() {
  const { t, locale } = useI18n();
  const categories = useQuery(() => api<Category[]>('/api/categories'), []);
  if (categories.loading) return <p>{t('common.loading')}</p>;
  if (categories.error) return <p>{categories.error}</p>;
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">{t('nav.categories')}</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(categories.data ?? []).map((category) => (
          <Link key={category.id} href={`/products?category=${category.id}`} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg dark:border-forest-800 dark:bg-forest-800 dark:hover:border-brand-700">
            <h2 className="font-semibold">{localized(locale, category)}</h2>
            <p className="mt-1 text-sm text-stone-500">{locale === 'bn' && category.descriptionBn ? category.descriptionBn : category.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function CartPage() {
  const { t, locale } = useI18n();
  const cart = useCart();
  if (!cart.lines.length) return <EmptyState title={t('cart.empty')} action={<Link href="/products" className="font-semibold text-brand-700">{t('nav.products')}</Link>} />;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('cart.title')}</h1>
      {cart.lines.map((line) => (
        <div key={line.productId} className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 transition hover:border-brand-200 dark:border-forest-800 dark:bg-forest-800 dark:hover:border-brand-700">
          <div className="h-20 w-24 overflow-hidden rounded-xl bg-stone-100">
            {line.image ? <img src={line.image} alt="" className="h-full w-full object-cover" /> : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{localized(locale, line)}</p>
            <p className="text-sm text-stone-500">{formatBdt(line.price)} / {named(t, `unit.${line.unit}`)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={() => cart.setQty(line.productId, line.quantity - 1)}>-</Button>
            <span className="w-8 text-center">{line.quantity}</span>
            <Button type="button" variant="secondary" onClick={() => cart.setQty(line.productId, line.quantity + 1)}>+</Button>
          </div>
          <p className="font-semibold">{formatBdt(line.price * line.quantity)}</p>
          <button type="button" className="text-sm text-red-700" onClick={() => cart.remove(line.productId)}>{t('cart.remove')}</button>
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-semibold">{t('common.total')}: {formatBdt(cart.total)}</p>
        <Link href="/checkout" className="inline-flex min-h-11 items-center rounded-xl bg-brand-700 px-4 font-semibold text-white">{t('cart.checkout')}</Link>
      </div>
    </div>
  );
}

function WalletPay({ method, number, version, transactionId, onTransactionId }: {
  method: 'bkash' | 'nagad' | 'rocket';
  number: string;
  version: string;
  transactionId: string;
  onTransactionId: (value: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 dark:border-forest-800 dark:bg-forest-900">
      <div>
        <p className="font-semibold">{t('checkout.scan')} · {t(`pay.${method}`)}</p>
        <p className="mt-1 text-sm text-stone-500">{t('checkout.scanHelp')}</p>
      </div>
      {number ? <p className="text-lg font-semibold tracking-wide">{number}</p> : null}
      {version ? (
        <img
          src={`${API_URL}/api/settings/public/qr/${method}?v=${encodeURIComponent(version)}`}
          alt={t(`pay.${method}`)}
          className="mx-auto h-56 w-56 rounded-xl border border-stone-200 bg-white object-contain p-2"
        />
      ) : <p className="text-sm text-stone-500">{t('checkout.qrMissing')}</p>}
      <Field label={t('checkout.reference')}>
        <TextInput required value={transactionId} onChange={(event) => onTransactionId(event.target.value)} />
      </Field>
      <p className="text-sm text-stone-500">{t('checkout.pendingNote')}</p>
    </div>
  );
}

export function CheckoutPage() {
  const { t } = useI18n();
  const cart = useCart();
  const router = useRouter();
  const settings = useQuery(() => api<PublicSettings>('/api/settings/public'), []);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({ customerName: '', phone: '', email: '', address: '', district: 'Gazipur', area: '', note: '', paymentMethod: 'cash', transactionId: '' });
  const delivery = settings.data?.deliveryCharge ?? 0;
  const total = cart.total + delivery;

  async function place() {
    if (!settings.data?.onlineOrderingEnabled) {
      toast.error(t('checkout.disabled'));
      return;
    }
    setPending(true);
    try {
      const result = await api<{ order: { number: string; phone: string }; checkoutUrl: string | null }>('/api/orders', {
        body: {
          ...form,
          email: form.email || undefined,
          items: cart.lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
        },
      });
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      cart.clear();
      router.push(`/order-confirmation?order=${encodeURIComponent(result.order.number)}&phone=${encodeURIComponent(result.order.phone)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setPending(false);
    }
  }

  if (!cart.lines.length) return <EmptyState title={t('cart.empty')} />;
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void place(); }}>
        <h1 className="text-2xl font-semibold">{t('checkout.title')}</h1>
        <p className="text-sm text-stone-500">{t('checkout.guest')}</p>
        {!settings.data?.onlineOrderingEnabled && settings.data ? <p className="rounded-xl bg-amber-100 p-3 text-sm">{t('checkout.disabled')}</p> : null}
        <Field label={t('common.name')}><TextInput required value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} /></Field>
        <Field label={t('common.phone')}><TextInput required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
        <Field label={t('checkout.email')}><TextInput type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
        <Field label={t('common.address')}><TextArea required value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('checkout.district')}>
            <SelectInput value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value })}>
              {DISTRICTS.map((district) => <option key={district}>{district}</option>)}
            </SelectInput>
          </Field>
          <Field label={t('checkout.area')}><TextInput required value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })} /></Field>
        </div>
        <Field label={t('common.note')}><TextArea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></Field>
        <Field label={t('common.payment')}>
          <SelectInput value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })}>
            <option value="cash">{t('pay.cash')}</option>
            <option value="bkash">{t('pay.bkash')}</option>
            <option value="nagad">{t('pay.nagad')}</option>
            <option value="rocket">{t('pay.rocket')}</option>
            <option value="bank_transfer">{t('pay.bank_transfer')}</option>
            <option value="credit_card">{t('pay.credit_card')}</option>
            <option value="debit_card">{t('pay.debit_card')}</option>
          </SelectInput>
        </Field>
        {form.paymentMethod === 'bank_transfer' && settings.data ? (
          <div className="space-y-1 rounded-2xl border border-stone-200 bg-white p-4 text-sm dark:border-forest-800 dark:bg-forest-900">
            <p className="font-semibold">{t('checkout.bankTitle')}</p>
            <p className="text-stone-500">{t('checkout.bankHelp')}</p>
            <p><span className="text-stone-500">{t('settings.bankName')}: </span>{settings.data.bank.bankName}</p>
            <p><span className="text-stone-500">{t('settings.branch')}: </span>{settings.data.bank.branch}</p>
            <p><span className="text-stone-500">{t('settings.accountName')}: </span>{settings.data.bank.accountName}</p>
            <p><span className="text-stone-500">{t('settings.accountNumber')}: </span>{settings.data.bank.accountNumber}</p>
            <p><span className="text-stone-500">{t('settings.routing')}: </span>{settings.data.bank.routingNumber}</p>
          </div>
        ) : null}
        {form.paymentMethod === 'bkash' || form.paymentMethod === 'nagad' || form.paymentMethod === 'rocket' ? (
          <WalletPay
            method={form.paymentMethod}
            number={settings.data?.manualPayments[form.paymentMethod] ?? ''}
            version={settings.data?.paymentQr?.[form.paymentMethod] ?? ''}
            transactionId={form.transactionId}
            onTransactionId={(transactionId) => setForm({ ...form, transactionId })}
          />
        ) : null}
        {form.paymentMethod === 'credit_card' || form.paymentMethod === 'debit_card' ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm dark:border-forest-800 dark:bg-forest-900">
            <p className="font-semibold">{t(`pay.${form.paymentMethod}`)} · Stripe</p>
            <p className="mt-1 text-stone-500">{settings.data?.cardPaymentsEnabled ? t('checkout.cardHelp') : t('checkout.cardMissing')}</p>
          </div>
        ) : null}
        {form.paymentMethod === 'bank_transfer' ? (
          <Field label={t('checkout.reference')}>
            <TextInput required value={form.transactionId} onChange={(event) => setForm({ ...form, transactionId: event.target.value })} />
          </Field>
        ) : null}
        <Button type="submit" disabled={pending}>{pending ? t('common.loading') : t('checkout.place')}</Button>
      </form>
      <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-forest-800">
        {cart.lines.map((line) => <p key={line.productId} className="flex justify-between gap-3 text-sm"><span className="min-w-0">{line.name} × {line.quantity}</span><span>{formatBdt(line.price * line.quantity)}</span></p>)}
        <p className="mt-3 flex justify-between text-sm"><span>{t('checkout.delivery')}</span><span>{formatBdt(delivery)}</span></p>
        <p className="mt-2 flex justify-between font-semibold"><span>{t('common.total')}</span><span>{formatBdt(total)}</span></p>
      </aside>
    </div>
  );
}

export function ConfirmationPage() {
  const { t } = useI18n();
  const params = useSearchParams();
  const order = params.get('order') ?? '';
  const phone = params.get('phone') ?? '';
  const result = useQuery(async () => {
    if (!order || !phone) throw new Error('Missing order');
    return api<{ number: string; total: number; paymentStatus: string; orderStatus: string; paymentMethod: string }>(`/api/orders/track?order=${encodeURIComponent(order)}&phone=${encodeURIComponent(phone)}`);
  }, [order, phone]);
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-forest-800">
      <h1 className="text-2xl font-semibold">{t('order.track')}</h1>
      {result.loading ? <p className="mt-3">{t('common.loading')}</p> : result.error ? <p className="mt-3">{t('order.missing')}</p> : result.data ? (
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-3"><dt>{t('order.number')}</dt><dd className="font-semibold">{result.data.number}</dd></div>
          <div className="flex justify-between gap-3"><dt>{t('common.total')}</dt><dd>{formatBdt(result.data.total)}</dd></div>
          <div className="flex justify-between gap-3"><dt>{t('common.status')}</dt><dd>{named(t, `status.${result.data.orderStatus}`)} · {named(t, `status.${result.data.paymentStatus}`)}</dd></div>
          {result.data.paymentStatus === 'pending' && ['bkash', 'nagad', 'rocket'].includes(result.data.paymentMethod) ? <p className="pt-2 text-stone-500">{t('checkout.pendingNote')}</p> : null}
        </dl>
      ) : null}
    </div>
  );
}
