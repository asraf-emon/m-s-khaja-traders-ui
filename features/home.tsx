'use client';

import Link from 'next/link';
import { ProductCard } from '@/components/frames';
import { localized, useI18n } from '@/components/providers';
import { EmptyState, Skeleton } from '@/components/ui';
import { useQuery } from '@/hooks/use-query';
import { api } from '@/lib/api';
import { shop } from '@/lib/shop';
import type { Category, Paged, Product } from '@/types';

export function HomePage() {
  const { t, locale } = useI18n();
  const categories = useQuery(() => api<Category[]>('/api/categories'), []);
  const products = useQuery(() => api<Paged<Product>>('/api/products?featured=true&limit=8'), []);
  return (
    <div className="space-y-10">
      <section className="grid items-center gap-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-card dark:border-forest-800 dark:bg-forest-800 sm:p-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-200">{shop.name}</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">{t('home.tagline')}</h1>
          <p className="mt-3 max-w-xl text-stone-600 dark:text-stone-300">{t('home.lead')}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/products" className="inline-flex min-h-11 items-center rounded-xl bg-brand-700 px-4 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-800 hover:shadow-md">{t('home.shopCta')}</Link>
            <a href={`tel:${shop.phones[0]}`} className="inline-flex min-h-11 items-center rounded-xl border border-stone-300 px-4 font-semibold hover:-translate-y-0.5 hover:border-brand-600 hover:bg-brand-50 dark:border-forest-800 dark:hover:bg-forest-900">{t('home.call')}</a>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-3 ring-1 ring-stone-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt={shop.name} className="mx-auto h-auto w-full max-w-md object-contain" />
        </div>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-semibold">{t('home.categories')}</h2>
        {categories.loading ? <Skeleton className="h-28" /> : categories.error ? <p>{categories.error}</p> : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(categories.data ?? []).map((category) => (
              <Link key={category.id} href={`/products?category=${category.id}`} className="min-w-0 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg dark:border-forest-800 dark:bg-forest-800 dark:hover:border-brand-700">
                <p className="font-semibold">{localized(locale, category)}</p>
                <p className="mt-1 line-clamp-2 text-sm text-stone-500">{locale === 'bn' && category.descriptionBn ? category.descriptionBn : category.description}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
      <section>
        <h2 className="mb-4 text-xl font-semibold">{t('home.featured')}</h2>
        {products.loading ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-72" />)}</div> : products.error ? <p>{products.error}</p> : (products.data?.items.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.data.items.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : <EmptyState title={t('product.none')} />)}
      </section>
      <section className="rounded-2xl bg-brand-800 p-5 text-white shadow-card">
        <h2 className="text-lg font-semibold">{t('home.visit')}</h2>
        <p className="mt-2">{shop.address}</p>
        <p className="mt-2">{shop.phones.join(' · ')}</p>
        <p className="mt-2 text-sm text-emerald-100">{t('home.hoursNote')}</p>
      </section>
    </div>
  );
}
