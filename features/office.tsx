'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ProfitChart } from '@/components/charts';
import { useAuth, useI18n } from '@/components/providers';
import Link from 'next/link';
import { Badge, Button, DateRange, EmptyState, Field, Panel, SelectInput, TextInput } from '@/components/ui';
import { useQuery } from '@/hooks/use-query';
import { api } from '@/lib/api';
import { downloadPdf } from '@/lib/pdf';
import { formatBdt, formatDay, withDates } from '@/lib/format';
import { named, statusTone } from '@/lib/labels';
import { API_URL, PAYMENT_METHODS } from '@/lib/shop';
import type { Party, PublicSettings } from '@/types';

async function authed<T>(tokenFn: () => Promise<string | null>, path: string, options: { method?: string; body?: unknown; form?: FormData } = {}) {
  const token = await tokenFn();
  if (!token) throw new Error('Sign in required');
  return api<T>(path, { ...options, token });
}

export function ExpensesPage() {
  const { t, locale } = useI18n();
  const auth = useAuth();
  const [form, setForm] = useState({ title: '', category: 'General', amount: '', expenseDate: new Date().toISOString().slice(0, 10), note: '' });
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const rows = useQuery(() => authed<{ id: string; title: string; category: string; amount: number; note: string; expenseDate?: string }[]>(auth.token, withDates('/api/expenses', from, to)), [auth.user?.uid, from, to]);
  async function save() {
    try {
      await authed(auth.token, '/api/expenses', { body: { ...form, amount: Number(form.amount) } });
      toast.success(t('expense.saved'));
      rows.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    }
  }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('nav.expenses')}</h1>
      <DateRange from={from} to={to} fromLabel={t('report.from')} toLabel={t('report.to')} onFrom={setFrom} onTo={setTo} />
      {auth.can('expenses.manage') ? (
        <Panel className="grid gap-3 sm:grid-cols-2">
          <Field label={t('common.name')}><TextInput value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field>
          <Field label={t('common.category')}><TextInput value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></Field>
          <Field label={t('common.price')}><TextInput value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></Field>
          <Field label={t('common.date')}><TextInput type="date" value={form.expenseDate} onChange={(event) => setForm({ ...form, expenseDate: event.target.value })} /></Field>
          <Field label={t('common.note')}><TextInput value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></Field>
          <Button type="button" onClick={() => void save()}>{t('expense.add')}</Button>
        </Panel>
      ) : null}
      {(rows.data ?? []).map((row) => <Panel key={row.id}><p className="font-semibold">{row.title}</p><p className="text-sm">{formatDay(row.expenseDate, locale)} · {row.category} · {formatBdt(row.amount)}</p>{row.note ? <p className="text-sm">{row.note}</p> : null}</Panel>)}
      {!rows.loading && !rows.data?.length ? <EmptyState title={from || to ? t('common.noMatch') : t('common.empty')} /> : null}
    </div>
  );
}

export function PaymentsPage() {
  const { t, locale } = useI18n();
  const auth = useAuth();
  const [partyType, setPartyType] = useState<'customer' | 'supplier'>('customer');
  const [form, setForm] = useState({ partyId: '', amount: '', method: 'cash', transactionId: '', note: '' });
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const parties = useQuery(() => authed<Party[]>(auth.token, partyType === 'customer' ? '/api/customers' : '/api/suppliers'), [auth.user?.uid, partyType]);
  const rows = useQuery(() => authed<{ id: string; partyName: string; amount: number; method: string; note: string; status: string; paidAt?: string }[]>(auth.token, withDates('/api/payments', from, to)), [auth.user?.uid, from, to]);
  async function save() {
    try {
      await authed(auth.token, '/api/payments', { body: { ...form, partyType, amount: Number(form.amount) } });
      toast.success(t('payment.saved'));
      rows.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    }
  }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('nav.payments')}</h1>
      <DateRange from={from} to={to} fromLabel={t('report.from')} toLabel={t('report.to')} onFrom={setFrom} onTo={setTo} />
      {auth.can('payments.manage') ? (
        <Panel className="grid gap-3 sm:grid-cols-2">
          <Field label={t('ledger.choose')}>
            <SelectInput value={partyType} onChange={(event) => setPartyType(event.target.value as 'customer' | 'supplier')}>
              <option value="customer">{t('nav.customers')}</option>
              <option value="supplier">{t('nav.suppliers')}</option>
            </SelectInput>
          </Field>
          <Field label={t('common.name')}>
            <SelectInput value={form.partyId} onChange={(event) => setForm({ ...form, partyId: event.target.value })}>
              <option value="">—</option>
              {(parties.data ?? []).map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}
            </SelectInput>
          </Field>
          <Field label={t('common.price')}><TextInput inputMode="decimal" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></Field>
          <Field label={t('common.payment')}>
            <SelectInput value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value })}>
              {PAYMENT_METHODS.filter((method) => method !== 'stripe').map((method) => <option key={method} value={method}>{named(t, `pay.${method}`)}</option>)}
            </SelectInput>
          </Field>
          <Field label={t('checkout.reference')}><TextInput value={form.transactionId} onChange={(event) => setForm({ ...form, transactionId: event.target.value })} /></Field>
          <Field label={t('common.note')}><TextInput value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></Field>
          <Button type="button" onClick={() => void save()}>{t('payment.add')}</Button>
        </Panel>
      ) : null}
      {(rows.data ?? []).map((row) => (
        <Panel key={row.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">{row.partyName || '—'} · {formatBdt(row.amount)}</p>
            <Badge tone={statusTone(row.status)}>{named(t, `status.${row.status}`)}</Badge>
          </div>
          <p className="text-sm">{formatDay(row.paidAt, locale)} · {named(t, `pay.${row.method}`)}</p>
          {row.note ? <p className="text-sm">{row.note}</p> : null}
        </Panel>
      ))}
      {!rows.loading && !rows.data?.length ? <EmptyState title={from || to ? t('common.noMatch') : t('common.empty')} /> : null}
    </div>
  );
}

type Report = {
  sales: number; purchase: number; revenue: number; cost: number; profit: number; margin: number; expenses: number; netProfit: number;
  bestsellers: { name: string; quantity: number; revenue: number }[];
  customerDues: { id: string; name: string; due: number }[];
  supplierDues: { id: string; name: string; due: number }[];
  inventory: { id: string; name: string; stock: number; unit: string; stockValue: number }[];
};

export function ReportsPage() {
  const { t } = useI18n();
  const auth = useAuth();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const report = useQuery(() => authed<Report>(auth.token, `/api/reports/summary?from=${from}&to=${to}`), [auth.user?.uid, from, to]);
  const data = report.data;
  async function download(type: string) {
    if (!data) return;
    try {
      const token = await auth.token();
      if (!token) return;
      const lines = await api<{ columns: string[]; rows: string[][] }>(`/api/reports/export?type=${type}&from=${from}&to=${to}`, { token });
      await downloadPdf(`${type}-report.pdf`, [
        { kind: 'title', text: t('report.title') },
        { kind: 'lines', lines: [
          `${t('report.from')}: ${from || '—'} · ${t('report.to')}: ${to || '—'}`,
          `${t('dash.sales')}: ${formatBdt(data.sales)}`,
          `${t('dash.cost')}: ${formatBdt(data.cost)}`,
          `${t('report.net')}: ${formatBdt(data.netProfit)}`,
        ] },
        { kind: 'title', text: t('report.best') },
        { kind: 'table', headers: [t('common.name'), t('common.quantity'), t('dash.sales')], rows: data.bestsellers.map((item) => [item.name, String(item.quantity), formatBdt(item.revenue)]) },
        { kind: 'title', text: type },
        { kind: 'table', headers: lines.columns, rows: lines.rows },
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    }
  }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('report.title')}</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('report.from')}><TextInput type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></Field>
        <Field label={t('report.to')}><TextInput type="date" value={to} onChange={(event) => setTo(event.target.value)} /></Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={!data} onClick={() => void download('sales')}>{t('common.download')}</Button>
      </div>
      {report.loading ? <p>{t('common.loading')}</p> : report.error ? <p>{report.error}</p> : data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Panel><p className="text-sm">{t('dash.sales')}</p><p className="text-xl font-semibold">{formatBdt(data.sales)}</p></Panel>
            <Panel><p className="text-sm">{t('dash.cost')}</p><p className="text-xl font-semibold">{formatBdt(data.cost)}</p></Panel>
            <Panel><p className="text-sm">{t('report.net')}</p><p className="text-xl font-semibold">{formatBdt(data.netProfit)}</p></Panel>
          </div>
          <Panel><ProfitChart sales={data.sales} cost={data.cost} profit={data.profit} margin={data.margin} /></Panel>
          <Panel>
            <h2 className="mb-2 font-semibold">{t('report.best')}</h2>
            {data.bestsellers.map((item) => <p key={item.name} className="text-sm">{item.name} · {item.quantity} · {formatBdt(item.revenue)}</p>)}
          </Panel>
          <Panel>
            <h2 className="mb-2 font-semibold">{t('report.customerDues')}</h2>
            {data.customerDues.map((item) => <p key={item.id} className="text-sm">{item.name} · {formatBdt(item.due)}</p>)}
            {!data.customerDues.length ? <EmptyState title={t('common.empty')} /> : null}
          </Panel>
        </>
      ) : null}
    </div>
  );
}

export function AuditPage() {
  const { t } = useI18n();
  const auth = useAuth();
  const rows = useQuery(() => authed<{ id: string; userEmail: string; action: string; entity: string; createdAt: string }[]>(auth.token, '/api/audit'), [auth.user?.uid]);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t('nav.admin')}</h1>
        <Link href="/admin/staff" className="inline-flex min-h-11 items-center rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white">{t('nav.staff')}</Link>
      </div>
      <h2 className="text-lg font-semibold">{t('audit.title')}</h2>
      {(rows.data ?? []).map((row) => <Panel key={row.id}><p className="font-semibold">{row.action} · {row.entity}</p><p className="text-sm">{row.userEmail} · {new Date(row.createdAt).toLocaleString()}</p></Panel>)}
      {!rows.loading && !rows.data?.length ? <EmptyState title={t('common.empty')} /> : null}
    </div>
  );
}

export function SettingsPage() {
  const { t } = useI18n();
  const auth = useAuth();
  const current = useQuery(() => authed<PublicSettings>(auth.token, '/api/settings'), [auth.user?.uid]);
  const [form, setForm] = useState<PublicSettings | null>(null);
  const value = form ?? current.data;
  async function save() {
    if (!value) return;
    try {
      await authed(auth.token, '/api/settings', {
        method: 'PATCH',
        body: {
          onlineOrderingEnabled: value.onlineOrderingEnabled,
          deliveryCharge: value.deliveryCharge,
          taxPercent: value.taxPercent,
          bkashNumber: value.manualPayments.bkash,
          nagadNumber: value.manualPayments.nagad,
          rocketNumber: value.manualPayments.rocket,
          bankName: value.bank.bankName,
          bankBranch: value.bank.branch,
          bankAccountName: value.bank.accountName,
          bankAccountNumber: value.bank.accountNumber,
          bankRoutingNumber: value.bank.routingNumber,
        },
      });
      toast.success(t('settings.saved'));
      setForm(null);
      current.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    }
  }
  async function uploadQr(method: 'bkash' | 'nagad' | 'rocket', file: File) {
    if (!value) return;
    try {
      const data = new FormData();
      data.set('file', file);
      const saved = await authed<PublicSettings>(auth.token, `/api/settings/qr/${method}`, { method: 'POST', form: data });
      setForm({ ...value, paymentQr: saved.paymentQr });
      toast.success(t('settings.qrSaved'));
      current.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    }
  }
  if (!value) return <p>{current.loading ? t('common.loading') : current.error}</p>;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('nav.settings')}</h1>
      <Panel className="space-y-3">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={value.onlineOrderingEnabled} onChange={(event) => setForm({ ...value, onlineOrderingEnabled: event.target.checked })} />{t('settings.online')}</label>
        <Field label={t('settings.delivery')}><TextInput value={value.deliveryCharge} onChange={(event) => setForm({ ...value, deliveryCharge: Number(event.target.value) })} /></Field>
        <Field label={t('settings.tax')}><TextInput value={value.taxPercent} onChange={(event) => setForm({ ...value, taxPercent: Number(event.target.value) })} /></Field>
        <Field label="bKash"><TextInput value={value.manualPayments.bkash} onChange={(event) => setForm({ ...value, manualPayments: { ...value.manualPayments, bkash: event.target.value } })} /></Field>
        <Field label="Nagad"><TextInput value={value.manualPayments.nagad} onChange={(event) => setForm({ ...value, manualPayments: { ...value.manualPayments, nagad: event.target.value } })} /></Field>
        <Field label="Rocket"><TextInput value={value.manualPayments.rocket} onChange={(event) => setForm({ ...value, manualPayments: { ...value.manualPayments, rocket: event.target.value } })} /></Field>
        <div className="space-y-2">
          <p className="text-sm font-semibold">{t('settings.qr')}</p>
          <p className="text-sm text-stone-500">{t('settings.qrHelp')}</p>
          {(['bkash', 'nagad', 'rocket'] as const).map((method) => (
            <Field key={method} label={t(`pay.${method}`)}>
              {value.paymentQr?.[method] ? (
                <img src={`${API_URL}/api/settings/public/qr/${method}?v=${encodeURIComponent(value.paymentQr[method])}`} alt="" className="h-36 w-36 rounded-xl border border-stone-200 bg-white object-contain p-2" />
              ) : null}
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="block w-full text-sm"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (file) void uploadQr(method, file);
                }}
              />
            </Field>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold">{t('settings.bank')}</p>
          <Field label={t('settings.bankName')}><TextInput value={value.bank.bankName} onChange={(event) => setForm({ ...value, bank: { ...value.bank, bankName: event.target.value } })} /></Field>
          <Field label={t('settings.branch')}><TextInput value={value.bank.branch} onChange={(event) => setForm({ ...value, bank: { ...value.bank, branch: event.target.value } })} /></Field>
          <Field label={t('settings.accountName')}><TextInput value={value.bank.accountName} onChange={(event) => setForm({ ...value, bank: { ...value.bank, accountName: event.target.value } })} /></Field>
          <Field label={t('settings.accountNumber')}><TextInput value={value.bank.accountNumber} onChange={(event) => setForm({ ...value, bank: { ...value.bank, accountNumber: event.target.value } })} /></Field>
          <Field label={t('settings.routing')}><TextInput value={value.bank.routingNumber} onChange={(event) => setForm({ ...value, bank: { ...value.bank, routingNumber: event.target.value } })} /></Field>
        </div>
        <Button type="button" onClick={() => void save()}>{t('common.save')}</Button>
      </Panel>
    </div>
  );
}
