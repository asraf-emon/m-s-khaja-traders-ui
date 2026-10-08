'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ProfitChart, TrendChart } from '@/components/charts';
import { ProductCard } from '@/components/frames';
import { localized, useAuth, useI18n } from '@/components/providers';
import { Badge, Button, DateRange, EmptyState, Field, Modal, Panel, SelectInput, Skeleton, TextArea, TextInput } from '@/components/ui';
import { useQuery } from '@/hooks/use-query';
import { api } from '@/lib/api';
import { formatBdt, formatDay, withDates } from '@/lib/format';
import { named } from '@/lib/labels';
import { UNITS } from '@/lib/shop';
import type { Category, DashboardStats, Paged, Product } from '@/types';

async function withToken<T>(tokenFn: () => Promise<string | null>, path: string, options: { method?: string; body?: unknown; form?: FormData } = {}) {
  const token = await tokenFn();
  if (!token) throw new Error('Sign in required');
  return api<T>(path, { ...options, token });
}

export function DashboardPage() {
  const { t } = useI18n();
  const auth = useAuth();
  const stats = useQuery(() => withToken<DashboardStats>(auth.token, '/api/dashboard/stats'), [auth.user?.uid]);
  if (stats.loading) return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24" />)}</div>;
  if (stats.error || !stats.data) return <p>{stats.error || t('common.error')}</p>;
  const data = stats.data;
  const cards = [
    [t('dash.todaySales'), data.today.sales],
    [t('dash.todayPurchase'), data.today.purchase],
    [t('dash.todayProfit'), data.today.profit],
    [t('dash.totalSales'), data.totals.sales],
    [t('dash.totalPurchase'), data.totals.purchase],
    [t('dash.totalDue'), data.totals.due],
    [t('dash.customers'), data.totals.customers],
    [t('dash.products'), data.totals.products],
    [t('dash.low'), data.totals.lowStock],
    [t('dash.pending'), data.totals.pendingOrders],
  ] as const;
  const moneyLabels = new Set<string>([t('dash.todaySales'), t('dash.todayPurchase'), t('dash.todayProfit'), t('dash.totalSales'), t('dash.totalPurchase'), t('dash.totalDue')]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t('nav.dashboard')}</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <Panel key={label}>
            <p className="text-sm text-stone-500">{label}</p>
            <p className="mt-1 text-xl font-semibold">{moneyLabels.has(label) ? formatBdt(typeof value === 'number' ? value : null) : value ?? '—'}</p>
          </Panel>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="mb-2 font-semibold">{t('dash.profit')}</h2>
          {data.profit ? <ProfitChart sales={data.profit.sales} cost={data.profit.cost} profit={data.profit.profit} margin={data.profit.margin} /> : <p className="text-sm text-stone-500">{t('dash.hidden')}</p>}
        </Panel>
        <Panel>
          <h2 className="mb-2 font-semibold">{t('dash.trend')}</h2>
          <TrendChart points={data.trend.map((point) => ({ date: point.date, sales: point.sales }))} />
        </Panel>
      </div>
      <Panel>
        <h2 className="mb-3 font-semibold">{t('dash.low')}</h2>
        {data.lowStock.length ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">{data.lowStock.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <EmptyState title={t('common.empty')} />}
      </Panel>
    </div>
  );
}

const emptyProduct = { name: '', nameBn: '', sku: '', barcode: '', categoryId: '', unit: 'kg', purchasePrice: '', sellingPrice: '', wholesalePrice: '', minimumSellingPrice: '', stock: '0', minimumStock: '5', description: '', descriptionBn: '', status: 'active', isFeatured: false };

export function ProductsPage() {
  const { t, locale } = useI18n();
  const auth = useAuth();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [files, setFiles] = useState<FileList | null>(null);
  const [pending, setPending] = useState(false);
  const categories = useQuery(() => withToken<Category[]>(auth.token, '/api/categories/manage'), [auth.user?.uid]);
  const products = useQuery(() => withToken<Paged<Product>>(auth.token, `/api/products/manage?search=${encodeURIComponent(search)}`), [auth.user?.uid, search]);

  function edit(product: Product) {
    setEditing(product.id);
    setForm({
      name: product.name,
      nameBn: product.nameBn,
      sku: product.sku,
      barcode: product.barcode ?? '',
      categoryId: product.category?.id ?? '',
      unit: product.unit,
      purchasePrice: String(product.purchasePrice ?? ''),
      sellingPrice: String(product.sellingPrice),
      wholesalePrice: String(product.wholesalePrice),
      minimumSellingPrice: String(product.minimumSellingPrice ?? ''),
      stock: String(product.stock),
      minimumStock: String(product.minimumStock ?? 0),
      description: product.description,
      descriptionBn: product.descriptionBn,
      status: product.status,
      isFeatured: product.isFeatured,
    });
    setOpen(true);
  }

  async function remove(id: string) {
    try {
      await withToken(auth.token, `/api/products/${id}`, { method: 'DELETE' });
      toast.success(t('common.delete'));
      products.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    }
  }

  async function save() {
    setPending(true);
    try {
      const body = {
        ...form,
        purchasePrice: Number(form.purchasePrice),
        sellingPrice: Number(form.sellingPrice),
        wholesalePrice: Number(form.wholesalePrice),
        minimumSellingPrice: Number(form.minimumSellingPrice || form.purchasePrice),
        stock: Number(form.stock),
        minimumStock: Number(form.minimumStock),
        isFeatured: form.isFeatured,
      };
      const saved = editing
        ? await withToken<Product>(() => auth.token(), `/api/products/${editing}`, { method: 'PATCH', body })
        : await withToken<Product>(() => auth.token(), '/api/products', { body });
      if (files?.length) {
        const formData = new FormData();
        Array.from(files).forEach((file) => formData.append('images', file));
        await withToken(auth.token, `/api/products/${saved.id}/images`, { form: formData });
      }
      toast.success(t('productForm.saved'));
      setOpen(false);
      products.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t('nav.products')}</h1>
        {auth.can('products.manage') ? <Button type="button" onClick={() => { setEditing(null); setForm(emptyProduct); setOpen(true); }}>{t('productForm.add')}</Button> : null}
      </div>
      <TextInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('common.search')} />
      {products.loading ? <Skeleton className="h-40" /> : products.error ? <p>{products.error}</p> : (
        <div className="grid gap-3">
          {(products.data?.items ?? []).map((product) => (
            <div key={product.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 transition hover:border-brand-200 dark:border-forest-800 dark:bg-forest-800 dark:hover:border-brand-700">
              <div className="h-16 w-20 overflow-hidden rounded-lg bg-stone-100">{product.images[0] ? <img src={product.images[0].secureUrl} alt="" className="h-full w-full object-cover" /> : null}</div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{localized(locale, product)}</p>
                <p className="text-sm text-stone-500">{product.sku} · {formatBdt(product.sellingPrice)} · {product.stock} {named(t, `unit.${product.unit}`)}</p>
              </div>
              {auth.can('products.manage') ? <Button type="button" variant="secondary" onClick={() => edit(product)}>{t('common.edit')}</Button> : null}
              {auth.can('products.manage') ? <Button type="button" variant="danger" onClick={() => void remove(product.id)}>{t('common.delete')}</Button> : null}
            </div>
          ))}
          {!products.data?.items.length ? <EmptyState title={t('product.none')} /> : null}
        </div>
      )}
      {open ? (
        <Modal title={editing ? t('productForm.edit') : t('productForm.add')} onClose={() => setOpen(false)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('common.name')}><TextInput value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
            <Field label={t('productForm.nameBn')}><TextInput value={form.nameBn} onChange={(event) => setForm({ ...form, nameBn: event.target.value })} /></Field>
            <Field label="SKU"><TextInput value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} /></Field>
            <Field label={t('productForm.barcode')}><TextInput value={form.barcode} onChange={(event) => setForm({ ...form, barcode: event.target.value })} /></Field>
            <Field label={t('common.category')}>
              <SelectInput value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
                <option value="">—</option>
                {(categories.data ?? []).map((category) => <option key={category.id} value={category.id}>{localized(locale, category)}</option>)}
              </SelectInput>
            </Field>
            <Field label={t('common.unit')}>
              <SelectInput value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })}>
                {UNITS.map((unit) => <option key={unit} value={unit}>{named(t, `unit.${unit}`)}</option>)}
              </SelectInput>
            </Field>
            <Field label={t('productForm.purchase')}><TextInput inputMode="decimal" value={form.purchasePrice} onChange={(event) => setForm({ ...form, purchasePrice: event.target.value })} /></Field>
            <Field label={t('productForm.wholesale')}><TextInput inputMode="decimal" value={form.wholesalePrice} onChange={(event) => setForm({ ...form, wholesalePrice: event.target.value })} /></Field>
            <Field label={t('productForm.selling')}><TextInput inputMode="decimal" value={form.sellingPrice} onChange={(event) => setForm({ ...form, sellingPrice: event.target.value })} /></Field>
            <Field label={t('productForm.minimumPrice')}><TextInput inputMode="decimal" value={form.minimumSellingPrice} onChange={(event) => setForm({ ...form, minimumSellingPrice: event.target.value })} /></Field>
            <Field label={editing ? t('product.stock') : t('productForm.opening')}><TextInput inputMode="decimal" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} /></Field>
            <Field label={t('productForm.minimumStock')}><TextInput inputMode="decimal" value={form.minimumStock} onChange={(event) => setForm({ ...form, minimumStock: event.target.value })} /></Field>
            <Field label={t('productForm.description')}><TextArea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
            <Field label={t('productForm.images')}><input type="file" accept="image/*" multiple className="block w-full text-sm" onChange={(event) => setFiles(event.target.files)} /></Field>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="button" disabled={pending} onClick={() => void save()}>{pending ? t('common.loading') : t('common.save')}</Button>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

export function CategoriesAdmin() {
  const { t, locale } = useI18n();
  const auth = useAuth();
  const [name, setName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const categories = useQuery(() => withToken<Category[]>(auth.token, '/api/categories/manage'), [auth.user?.uid]);
  async function add() {
    try {
      await withToken(auth.token, '/api/categories', { body: { name, nameBn } });
      setName('');
      setNameBn('');
      categories.reload();
      toast.success(t('party.saved'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    }
  }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('nav.categories')}</h1>
      {auth.can('categories.manage') ? (
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder={t('common.name')} />
          <TextInput value={nameBn} onChange={(event) => setNameBn(event.target.value)} placeholder={t('productForm.nameBn')} />
          <Button type="button" onClick={() => void add()}>{t('common.add')}</Button>
        </div>
      ) : null}
      <div className="grid gap-2">
        {(categories.data ?? []).map((category) => <Panel key={category.id}><p className="font-semibold">{localized(locale, category)}</p><Badge tone={category.status === 'active' ? 'ok' : 'neutral'}>{category.status === 'active' ? t('staff.active') : t('staff.inactive')}</Badge></Panel>)}
      </div>
    </div>
  );
}

export function InventoryPage() {
  const { t, locale } = useI18n();
  const auth = useAuth();
  const [form, setForm] = useState({ productId: '', type: 'adjustment', direction: 'in', quantity: '1', note: '' });
  const [pending, setPending] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const products = useQuery(() => withToken<Product[]>(auth.token, '/api/inventory'), [auth.user?.uid]);
  const history = useQuery(() => withToken<{ items: { id: string; type: string; quantityChange: number; note: string; product: { name: string; nameBn?: string } | null; createdAt: string }[] }>(auth.token, withDates('/api/inventory/history', from, to)), [auth.user?.uid, from, to]);

  async function adjust() {
    setPending(true);
    try {
      await withToken(auth.token, '/api/inventory/adjust', { body: { ...form, quantity: Number(form.quantity) } });
      toast.success(t('party.saved'));
      products.reload();
      history.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('nav.inventory')}</h1>
      {auth.can('inventory.manage') ? (
        <Panel className="grid gap-3 sm:grid-cols-2">
          <Field label={t('nav.products')}>
            <SelectInput value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })}>
              <option value="">—</option>
              {(products.data ?? []).map((product) => <option key={product.id} value={product.id}>{localized(locale, product)}</option>)}
            </SelectInput>
          </Field>
          <Field label={t('common.status')}>
            <SelectInput value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
              <option value="adjustment">{t('inventory.adjust')}</option>
              <option value="damage">{t('inventory.damage')}</option>
              <option value="return">{t('inventory.return')}</option>
            </SelectInput>
          </Field>
          {form.type === 'adjustment' ? (
            <Field label={t('inventory.in')}>
              <SelectInput value={form.direction} onChange={(event) => setForm({ ...form, direction: event.target.value })}>
                <option value="in">{t('inventory.in')}</option>
                <option value="out">{t('inventory.out')}</option>
              </SelectInput>
            </Field>
          ) : null}
          <Field label={t('common.quantity')}><TextInput value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></Field>
          <Field label={t('common.note')}><TextInput value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></Field>
          <Button type="button" disabled={pending} onClick={() => void adjust()}>{t('common.save')}</Button>
        </Panel>
      ) : null}
      <div className="grid gap-2">
        {(products.data ?? []).map((product) => (
          <div key={product.id} className="flex flex-wrap justify-between gap-2 rounded-xl border border-stone-200 bg-white p-3 transition hover:border-brand-200 dark:border-forest-800 dark:bg-forest-800 dark:hover:border-brand-700">
            <span className="font-medium">{localized(locale, product)}</span>
            <span>{product.stock} {named(t, `unit.${product.unit}`)}</span>
          </div>
        ))}
      </div>
      <h2 className="font-semibold">{t('inventory.history')}</h2>
      <DateRange from={from} to={to} fromLabel={t('report.from')} toLabel={t('report.to')} onFrom={setFrom} onTo={setTo} />
      <div className="mobile-cards grid gap-2 md:hidden">
        {(history.data?.items ?? []).map((item) => <Panel key={item.id}><p>{item.product ? localized(locale, item.product) : '—'}</p><p>{formatDay(item.createdAt, locale)} · {named(t, item.type === 'adjustment' ? 'inventory.adjust' : `inventory.${item.type}`)} {item.quantityChange > 0 ? `+${item.quantityChange}` : item.quantityChange}</p><p className="text-sm">{item.note}</p></Panel>)}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500 dark:border-stone-800">
              <th className="py-2 font-semibold">{t('common.date')}</th>
              <th className="font-semibold">{t('nav.products')}</th>
              <th className="font-semibold">{t('common.status')}</th>
              <th className="font-semibold">{t('common.quantity')}</th>
              <th className="font-semibold">{t('common.note')}</th>
            </tr>
          </thead>
          <tbody>
            {(history.data?.items ?? []).map((item) => <tr key={item.id} className="border-b border-stone-200 dark:border-stone-800"><td className="py-2">{formatDay(item.createdAt, locale)}</td><td>{item.product?.name}</td><td>{named(t, item.type === 'adjustment' ? 'inventory.adjust' : `inventory.${item.type}`)}</td><td>{item.quantityChange > 0 ? `+${item.quantityChange}` : item.quantityChange}</td><td>{item.note}</td></tr>)}
          </tbody>
        </table>
      </div>
      {!history.loading && !history.data?.items.length ? <EmptyState title={from || to ? t('common.noMatch') : t('common.empty')} /> : null}
    </div>
  );
}
