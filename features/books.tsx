'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { localized, useAuth, useI18n } from '@/components/providers';
import { Badge, Button, DateRange, EmptyState, Field, Panel, SelectInput, TextArea, TextInput } from '@/components/ui';
import { useQuery } from '@/hooks/use-query';
import { api } from '@/lib/api';
import { downloadPdf } from '@/lib/pdf';
import { formatBdt, formatDay, withDates } from '@/lib/format';
import { named, statusTone } from '@/lib/labels';
import { ORDER_STATUSES, PAYMENT_METHODS, shop } from '@/lib/shop';
import type { LedgerBook, Party, Product } from '@/types';

async function authed<T>(tokenFn: () => Promise<string | null>, path: string, options: { method?: string; body?: unknown } = {}) {
  const token = await tokenFn();
  if (!token) throw new Error('Sign in required');
  return api<T>(path, { ...options, token });
}

type SaleRow = { id: string; number: string; total: number; dueAmount: number; paidAmount: number; paymentMethod: string; saleDate: string; customer: Party | null };
type PurchaseRow = { id: string; number: string; total: number; dueAmount: number; paidAmount: number; purchaseDate: string; supplier: Party | null };
type OrderRow = { id: string; number: string; customerName: string; phone: string; total: number; paymentMethod: string; paymentStatus: string; orderStatus: string; transactionId: string; createdAt?: string };

export function PurchasesPage() {
  const { t, locale } = useI18n();
  const auth = useAuth();
  const [pending, setPending] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [paid, setPaid] = useState('0');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const suppliers = useQuery(() => authed<Party[]>(auth.token, '/api/suppliers'), [auth.user?.uid]);
  const products = useQuery(() => authed<Product[]>(auth.token, '/api/inventory'), [auth.user?.uid]);
  const rows = useQuery(() => authed<{ items: PurchaseRow[] }>(auth.token, withDates('/api/purchases', from, to)), [auth.user?.uid, from, to]);

  async function save() {
    setPending(true);
    try {
      await authed(auth.token, '/api/purchases', { body: { supplierId, paidAmount: Number(paid), items: [{ productId, quantity: Number(quantity), purchasePrice: Number(price) }] } });
      toast.success(t('purchase.saved'));
      rows.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('nav.purchases')}</h1>
      <DateRange from={from} to={to} fromLabel={t('report.from')} toLabel={t('report.to')} onFrom={setFrom} onTo={setTo} />
      {auth.can('purchases.manage') ? (
        <Panel className="grid gap-3 sm:grid-cols-2">
          <Field label={t('purchase.supplier')}>
            <SelectInput value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
              <option value="">—</option>
              {(suppliers.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </SelectInput>
          </Field>
          <Field label={t('nav.products')}>
            <SelectInput value={productId} onChange={(event) => setProductId(event.target.value)}>
              <option value="">—</option>
              {(products.data ?? []).map((item) => <option key={item.id} value={item.id}>{localized(locale, item)}</option>)}
            </SelectInput>
          </Field>
          <Field label={t('common.quantity')}><TextInput value={quantity} onChange={(event) => setQuantity(event.target.value)} /></Field>
          <Field label={t('productForm.purchase')}><TextInput value={price} onChange={(event) => setPrice(event.target.value)} /></Field>
          <Field label={t('common.paid')}><TextInput value={paid} onChange={(event) => setPaid(event.target.value)} /></Field>
          <Button type="button" disabled={pending} onClick={() => void save()}>{t('purchase.new')}</Button>
        </Panel>
      ) : null}
      {(rows.data?.items ?? []).map((row) => (
        <Panel key={row.id}><p className="font-semibold">{row.number} · {row.supplier?.name}</p><p className="text-sm">{formatDay(row.purchaseDate, locale)} · {formatBdt(row.total)} · {t('common.due')} {formatBdt(row.dueAmount)}</p></Panel>
      ))}
      {!rows.loading && !rows.data?.items.length ? <EmptyState title={from || to ? t('common.noMatch') : t('common.empty')} /> : null}
    </div>
  );
}

export function SalesPage() {
  const { t, locale } = useI18n();
  const auth = useAuth();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({ customerId: '', productId: '', quantity: '1', priceType: 'wholesale', paidAmount: '0', paymentMethod: 'cash', discount: '0' });
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const customers = useQuery(() => authed<Party[]>(auth.token, '/api/customers'), [auth.user?.uid]);
  const products = useQuery(() => authed<Product[]>(auth.token, '/api/sales/meta/products'), [auth.user?.uid]);
  const rows = useQuery(() => authed<{ items: SaleRow[] }>(auth.token, withDates('/api/sales', from, to)), [auth.user?.uid, from, to]);

  async function save() {
    setPending(true);
    try {
      await authed(auth.token, '/api/sales', {
        body: {
          customerId: form.customerId || undefined,
          discount: Number(form.discount),
          paidAmount: Number(form.paidAmount),
          paymentMethod: form.paymentMethod,
          items: [{ productId: form.productId, quantity: Number(form.quantity), priceType: form.priceType }],
        },
      });
      toast.success(t('sale.saved'));
      rows.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('nav.sales')}</h1>
      <DateRange from={from} to={to} fromLabel={t('report.from')} toLabel={t('report.to')} onFrom={setFrom} onTo={setTo} />
      {auth.can('sales.manage') ? (
        <Panel className="grid gap-3 sm:grid-cols-2">
          <Field label={t('sale.customer')}>
            <SelectInput value={form.customerId} onChange={(event) => setForm({ ...form, customerId: event.target.value })}>
              <option value="">—</option>
              {(customers.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </SelectInput>
          </Field>
          <Field label={t('nav.products')}>
            <SelectInput value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })}>
              <option value="">—</option>
              {(products.data ?? []).map((item) => <option key={item.id} value={item.id}>{localized(locale, item)} ({item.stock})</option>)}
            </SelectInput>
          </Field>
          <Field label={t('common.quantity')}><TextInput value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></Field>
          <Field label={t('common.price')}>
            <SelectInput value={form.priceType} onChange={(event) => setForm({ ...form, priceType: event.target.value })}>
              <option value="wholesale">{t('common.wholesale')}</option>
              <option value="retail">{t('common.retail')}</option>
            </SelectInput>
          </Field>
          <Field label={t('sale.discount')}><TextInput value={form.discount} onChange={(event) => setForm({ ...form, discount: event.target.value })} /></Field>
          <Field label={t('common.paid')}><TextInput value={form.paidAmount} onChange={(event) => setForm({ ...form, paidAmount: event.target.value })} /></Field>
          <Field label={t('common.payment')}>
            <SelectInput value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })}>
              {PAYMENT_METHODS.filter((method) => method !== 'stripe').map((method) => <option key={method} value={method}>{named(t, `pay.${method}`)}</option>)}
            </SelectInput>
          </Field>
          <Button type="button" disabled={pending} onClick={() => void save()}>{t('sale.new')}</Button>
        </Panel>
      ) : null}
      {(rows.data?.items ?? []).map((row) => <Panel key={row.id}><p className="font-semibold">{row.number} · {row.customer?.name ?? 'Cash'}</p><p className="text-sm">{formatDay(row.saleDate, locale)} · {formatBdt(row.total)} · {t('common.due')} {formatBdt(row.dueAmount)}</p></Panel>)}
      {!rows.loading && !rows.data?.items.length ? <EmptyState title={from || to ? t('common.noMatch') : t('empty.sales')} /> : null}
    </div>
  );
}

export function OrdersPage() {
  const { t, locale } = useI18n();
  const auth = useAuth();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const rows = useQuery(() => authed<{ items: OrderRow[] }>(auth.token, withDates('/api/orders', from, to)), [auth.user?.uid, from, to]);
  async function update(id: string, orderStatus: string) {
    try {
      await authed(auth.token, `/api/orders/${id}`, { method: 'PATCH', body: { orderStatus } });
      rows.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    }
  }
  async function confirmPayment(id: string) {
    try {
      await authed(auth.token, `/api/orders/${id}`, { method: 'PATCH', body: { paymentStatus: 'paid' } });
      rows.reload();
      toast.success(t('orders.paymentConfirmed'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    }
  }
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">{t('nav.orders')}</h1>
      <DateRange from={from} to={to} fromLabel={t('report.from')} toLabel={t('report.to')} onFrom={setFrom} onTo={setTo} />
      {(rows.data?.items ?? []).map((order) => (
        <Panel key={order.id}>
          <p className="font-semibold">{order.number} · {order.customerName}</p>
          <p className="text-sm text-stone-600 dark:text-stone-300">
            {formatDay(order.createdAt, locale)} · <a className="hover:text-brand-700" href={`tel:${order.phone}`}>{order.phone}</a> · {formatBdt(order.total)} · {named(t, `pay.${order.paymentMethod}`)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone={statusTone(order.orderStatus)}>{named(t, `status.${order.orderStatus}`)}</Badge>
            <Badge tone={statusTone(order.paymentStatus)}>{named(t, `status.${order.paymentStatus}`)}</Badge>
          </div>
          {order.transactionId ? <p className="mt-2 text-sm">{t('checkout.reference')}: {order.transactionId}</p> : null}
          {auth.can('orders.manage') && order.paymentStatus === 'pending' && ['bkash', 'nagad', 'rocket'].includes(order.paymentMethod) ? (
            <Button type="button" className="mt-2" onClick={() => void confirmPayment(order.id)}>{t('orders.confirmPayment')}</Button>
          ) : null}
          {auth.can('orders.manage') ? (
            <SelectInput className="mt-2" aria-label={t('common.status')} value={order.orderStatus} onChange={(event) => void update(order.id, event.target.value)}>
              {ORDER_STATUSES.map((status) => <option key={status} value={status}>{named(t, `status.${status}`)}</option>)}
            </SelectInput>
          ) : null}
        </Panel>
      ))}
      {!rows.loading && !rows.data?.items.length ? <EmptyState title={from || to ? t('common.noMatch') : t('empty.orders')} /> : null}
    </div>
  );
}

export function PartiesPage({ kind }: { kind: 'customers' | 'suppliers' }) {
  const { t } = useI18n();
  const auth = useAuth();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', address: '', businessName: '', notes: '' });
  const manage = kind === 'customers' ? 'customers.manage' : 'suppliers.manage';
  const rows = useQuery(() => authed<Party[]>(auth.token, `/api/${kind}?search=${encodeURIComponent(search)}`), [auth.user?.uid, search, kind]);

  async function save() {
    try {
      await authed(auth.token, `/api/${kind}`, { body: form });
      setForm({ name: '', phone: '', address: '', businessName: '', notes: '' });
      rows.reload();
      toast.success(t('party.saved'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{kind === 'customers' ? t('nav.customers') : t('nav.suppliers')}</h1>
      <TextInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('common.search')} />
      {auth.can(manage) ? (
        <Panel className="grid gap-3 sm:grid-cols-2">
          <Field label={t('common.name')}><TextInput value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
          <Field label={t('common.phone')}><TextInput value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
          {kind === 'suppliers' ? <Field label={t('party.business')}><TextInput value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} /></Field> : null}
          <Field label={t('common.address')}><TextInput value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Field>
          <Field label={t('ledger.notes')}><TextArea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field>
          <Button type="button" onClick={() => void save()}>{kind === 'customers' ? t('party.addCustomer') : t('party.addSupplier')}</Button>
        </Panel>
      ) : null}
      {(rows.data ?? []).map((party) => (
        <Panel key={party.id}>
          <p className="font-semibold">{party.name}</p>
          <p className="text-sm">{party.phone ? <a className="hover:text-brand-700" href={`tel:${party.phone}`}>{party.phone}</a> : '—'} · {party.address || '—'}</p>
          {party.notes ? <p className="mt-1 text-sm">{party.notes}</p> : null}
          <p className="mt-2 text-sm">{t('common.total')} {formatBdt(party.totalPurchases)} · {t('common.paid')} {formatBdt(party.totalPaid)} · {t('common.due')} {formatBdt(party.totalDue)}</p>
        </Panel>
      ))}
      {!rows.loading && !rows.data?.length ? <EmptyState title={search ? t('common.noResults') : t('common.empty')} /> : null}
    </div>
  );
}

export function LedgerPage() {
  const { t } = useI18n();
  const auth = useAuth();
  const [partyType, setPartyType] = useState<'customer' | 'supplier'>('customer');
  const [partyId, setPartyId] = useState('');
  const [notes, setNotes] = useState('');
  const [entry, setEntry] = useState({ direction: 'credit', amount: '', description: '' });
  const [pending, setPending] = useState(false);
  const parties = useQuery(() => authed<Party[]>(auth.token, partyType === 'customer' ? '/api/customers' : '/api/suppliers'), [auth.user?.uid, partyType]);
  const book = useQuery(() => partyId ? authed<LedgerBook>(auth.token, `/api/ledger?partyType=${partyType}&partyId=${partyId}`) : Promise.resolve(null), [auth.user?.uid, partyType, partyId]);

  async function saveNote() {
    if (!partyId) return;
    setPending(true);
    try {
      await authed(auth.token, `/api/${partyType === 'customer' ? 'customers' : 'suppliers'}/${partyId}`, { method: 'PATCH', body: { notes } });
      toast.success(t('party.saved'));
      book.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setPending(false);
    }
  }

  async function addEntry() {
    setPending(true);
    try {
      await authed(auth.token, '/api/ledger', { body: { partyType, partyId, direction: entry.direction, amount: Number(entry.amount), description: entry.description } });
      setEntry({ direction: 'credit', amount: '', description: '' });
      toast.success(t('ledger.saved'));
      book.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setPending(false);
    }
  }

  async function download() {
    if (!book.data?.party) return;
    const current = book.data.party;
    try {
      await downloadPdf(`accounts-book-${current.phone}.pdf`, [
        { kind: 'title', text: partyType === 'customer' ? t('ledger.customerBook') : t('ledger.supplierBook') },
        { kind: 'lines', lines: [t('ledger.history'), current.name, current.phone, current.address, current.businessName, `${t('ledger.current')}: ${formatBdt(current.totalDue)}`, `${t('common.paid')} ${formatBdt(current.totalPaid)} · ${t('common.total')} ${formatBdt(current.totalPurchases)}`, `${t('ledger.notes')}: ${notes || current.notes || '—'}`] },
        {
          kind: 'table',
          headers: [t('common.date'), t('ledger.entryNote'), t('ledger.debit'), t('ledger.credit'), t('ledger.balance')],
          rows: book.data.entries.map((item) => [
            new Date(item.entryDate).toLocaleDateString(),
            item.description,
            item.direction === 'debit' ? formatBdt(item.amount) : '',
            item.direction === 'credit' ? formatBdt(item.amount) : '',
            formatBdt(item.balanceAfter),
          ]),
        },
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    }
  }

  const party = book.data?.party;
  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{partyType === 'customer' ? t('ledger.customerBook') : t('ledger.supplierBook')}</h1>
          <p className="text-sm text-stone-500">{t('ledger.lead')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={!partyId} onClick={() => window.print()}>{t('ledger.print')}</Button>
          <Button type="button" variant="secondary" disabled={!partyId} onClick={() => void download()}>{t('ledger.download')}</Button>
        </div>
      </div>
      <div className="no-print grid gap-3 sm:grid-cols-2">
        <SelectInput value={partyType} onChange={(event) => { setPartyType(event.target.value as 'customer' | 'supplier'); setPartyId(''); }}>
          <option value="customer">{t('ledger.customerBook')}</option>
          <option value="supplier">{t('ledger.supplierBook')}</option>
        </SelectInput>
        <SelectInput value={partyId} onChange={(event) => { setPartyId(event.target.value); const found = (parties.data ?? []).find((item) => item.id === event.target.value); setNotes(found?.notes ?? ''); }}>
          <option value="">{t('ledger.choose')}</option>
          {(parties.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.phone}</option>)}
        </SelectInput>
      </div>
      {!partyId ? <EmptyState title={t('ledger.choose')} /> : book.loading ? <p>{t('common.loading')}</p> : book.data ? (
        <article id="ledger-print" className="space-y-4">
          <Panel>
            <p className="text-sm font-semibold text-brand-700">{shop.name}</p>
            <h2 className="text-xl font-semibold">{party?.name}</h2>
            <p className="text-sm">{party?.phone}</p>
            <p className="text-sm">{party?.address}</p>
            {party?.businessName ? <p className="text-sm">{party.businessName}</p> : null}
            <p className="mt-2 text-lg font-semibold">{t('ledger.current')}: {formatBdt(party?.totalDue)}</p>
            <p className="text-sm">{t('common.paid')} {formatBdt(party?.totalPaid)} · {t('common.total')} {formatBdt(party?.totalPurchases)}</p>
          </Panel>
          <Panel>
            <h3 className="font-semibold">{t('ledger.notes')}</h3>
            <p className="text-xs text-stone-500">{t('ledger.notesHelp')}</p>
            <TextArea className="mt-2" value={notes || party?.notes || ''} onChange={(event) => setNotes(event.target.value)} />
            <div className="no-print mt-2"><Button type="button" disabled={pending} onClick={() => void saveNote()}>{t('common.save')}</Button></div>
            <p className="mt-3 whitespace-pre-wrap text-sm">{notes || party?.notes}</p>
          </Panel>
          {auth.can('ledger.manage') ? (
            <Panel className="no-print grid gap-3 sm:grid-cols-2">
              <Field label={t('ledger.entryNote')}><TextArea value={entry.description} onChange={(event) => setEntry({ ...entry, description: event.target.value })} /></Field>
              <Field label={t('common.price')}><TextInput value={entry.amount} onChange={(event) => setEntry({ ...entry, amount: event.target.value })} /></Field>
              <SelectInput value={entry.direction} onChange={(event) => setEntry({ ...entry, direction: event.target.value })}>
                <option value="debit">{t('ledger.debit')}</option>
                <option value="credit">{t('ledger.credit')}</option>
              </SelectInput>
              <Button type="button" disabled={pending} onClick={() => void addEntry()}>{t('ledger.add')}</Button>
            </Panel>
          ) : null}
          <h3 className="text-lg font-semibold">{t('ledger.history')}</h3>
          {!book.data.entries.length ? <EmptyState title={t('ledger.empty')} /> : (
            <>
              <div className="mobile-cards grid gap-2 md:hidden">
                {book.data.entries.map((item) => (
                  <Panel key={item.id}>
                    <p className="text-xs text-stone-500">{new Date(item.entryDate).toLocaleString()}</p>
                    <p className="whitespace-pre-wrap">{item.description}</p>
                    <p className="font-semibold">{item.direction === 'debit' ? '+' : '-'}{formatBdt(item.amount)}</p>
                    <p className="text-sm">{t('ledger.balance')}: {formatBdt(item.balanceAfter)}</p>
                  </Panel>
                ))}
              </div>
              <table className="ledger-table hidden w-full text-left text-sm md:table">
                <thead>
                  <tr className="border-b border-stone-300">
                    <th className="py-2 pr-2">{t('common.date')}</th>
                    <th className="py-2 pr-2">{t('ledger.entryNote')}</th>
                    <th className="py-2 pr-2">{t('ledger.debit')}</th>
                    <th className="py-2 pr-2">{t('ledger.credit')}</th>
                    <th className="py-2">{t('ledger.balance')}</th>
                  </tr>
                </thead>
                <tbody>
                  {book.data.entries.map((item) => (
                    <tr key={item.id} className="border-b border-stone-200 align-top dark:border-stone-800">
                      <td className="py-2 pr-2">{new Date(item.entryDate).toLocaleDateString()}</td>
                      <td className="whitespace-pre-wrap py-2 pr-2">{item.description}</td>
                      <td className="py-2 pr-2">{item.direction === 'debit' ? formatBdt(item.amount) : ''}</td>
                      <td className="py-2 pr-2">{item.direction === 'credit' ? formatBdt(item.amount) : ''}</td>
                      <td className="py-2">{formatBdt(item.balanceAfter)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </article>
      ) : null}
    </div>
  );
}
