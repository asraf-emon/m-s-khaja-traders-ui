'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/frames';
import { localized, useI18n } from '@/components/providers';
import { EmptyState, Field, SelectInput, Skeleton, TextInput } from '@/components/ui';
import { useQuery } from '@/hooks/use-query';
import { api } from '@/lib/api';
import type { Category, Paged, Product } from '@/types';

export function CatalogPage() {
  const { t, locale } = useI18n();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [category, setCategory] = useState(params.get('category') ?? '');
  const [sort, setSort] = useState('newest');
  const [stock, setStock] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const categories = useQuery(() => api<Category[]>('/api/categories'), []);
  const query = useMemo(() => {
    const searchParams = new URLSearchParams({ limit: '24', sort });
    if (search.trim()) searchParams.set('search', search.trim());
    if (category) searchParams.set('category', category);
    if (stock) searchParams.set('stock', stock);
    if (minPrice) searchParams.set('minPrice', minPrice);
    if (maxPrice) searchParams.set('maxPrice', maxPrice);
    return searchParams.toString();
  }, [category, maxPrice, minPrice, search, sort, stock]);
  const products = useQuery(() => api<Paged<Product>>(`/api/products?${query}`), [query]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('nav.products')}</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={t('common.search')}><TextInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('common.search')} /></Field>
        <Field label={t('common.category')}>
          <SelectInput value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">{t('common.all')}</option>
            {(categories.data ?? []).map((item) => <option key={item.id} value={item.id}>{localized(locale, item)}</option>)}
          </SelectInput>
        </Field>
        <Field label={t('sort.label')}>
          <SelectInput value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="newest">{t('sort.newest')}</option>
            <option value="price_asc">{t('sort.priceAsc')}</option>
            <option value="price_desc">{t('sort.priceDesc')}</option>
            <option value="name">{t('sort.name')}</option>
          </SelectInput>
        </Field>
        <Field label={t('common.status')}>
          <SelectInput value={stock} onChange={(event) => setStock(event.target.value)}>
            <option value="">{t('common.all')}</option>
            <option value="in">{t('stock.in')}</option>
            <option value="low">{t('stock.low')}</option>
            <option value="out">{t('stock.out')}</option>
          </SelectInput>
        </Field>
        <Field label={t('catalog.min')}><TextInput inputMode="decimal" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} /></Field>
        <Field label={t('catalog.max')}><TextInput inputMode="decimal" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} /></Field>
      </div>
      {products.loading ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-72" />)}</div> : products.error ? <p>{products.error}</p> : products.data?.items.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.data.items.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : <EmptyState title={t('product.none')} />}
    </div>
  );
}
