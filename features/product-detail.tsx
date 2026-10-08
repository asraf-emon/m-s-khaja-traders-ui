'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { stockTone } from '@/components/frames';
import { localized, useCart, useI18n } from '@/components/providers';
import { Badge, Button, Skeleton } from '@/components/ui';
import { useQuery } from '@/hooks/use-query';
import { api } from '@/lib/api';
import { formatBdt } from '@/lib/format';
import { named } from '@/lib/labels';
import type { Product } from '@/types';

export function ProductDetail({ id }: { id: string }) {
  const { t, locale } = useI18n();
  const cart = useCart();
  const router = useRouter();
  const product = useQuery(() => api<Product>(`/api/products/${id}`), [id]);
  const [index, setIndex] = useState(0);
  const [qty, setQty] = useState(1);
  if (product.loading) return <Skeleton className="h-96" />;
  if (product.error || !product.data) return <p>{product.error || t('product.none')}</p>;
  const item = product.data;
  const image = item.images[index] ?? item.images[0];
  const add = () => {
    cart.add({ productId: item.id, name: item.name, nameBn: item.nameBn, unit: item.unit, price: item.sellingPrice, quantity: qty, stock: item.stock, image: image?.secureUrl });
    toast.success(t('product.added'));
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="min-w-0">
        <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-stone-100 dark:bg-stone-800">
          {image ? <img src={image.secureUrl} alt={localized(locale, item)} className="h-full w-full object-cover" /> : null}
        </div>
        {item.images.length > 1 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {item.images.map((photo, photoIndex) => (
              <button key={photo.publicId} type="button" className="h-16 w-20 shrink-0 overflow-hidden rounded-lg" onClick={() => setIndex(photoIndex)}>
                <img src={photo.secureUrl} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-stone-500">{item.category ? localized(locale, item.category) : ''}</p>
        <h1 className="mt-1 text-3xl font-semibold">{localized(locale, item)}</h1>
        <p className="mt-2 text-sm text-stone-500">{t('product.sku')}: {item.sku}</p>
        <p className="mt-4 text-3xl font-semibold text-accent-600">{formatBdt(item.sellingPrice)}</p>
        <p className="text-sm text-stone-500">{t('common.wholesale')} {formatBdt(item.wholesalePrice)} / {named(t, `unit.${item.unit}`)}</p>
        <div className="mt-3"><Badge tone={stockTone(item.stockStatus)}>{t('product.stock')}: {item.stock} {named(t, `unit.${item.unit}`)}</Badge></div>
        <p className="mt-4 whitespace-pre-wrap text-stone-700 dark:text-stone-200">{locale === 'bn' && item.descriptionBn ? item.descriptionBn : item.description}</p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <input type="number" min={1} max={item.stock} value={qty} onChange={(event) => setQty(Number(event.target.value))} className="h-11 w-24 rounded-xl border border-stone-300 px-3 dark:border-stone-700 dark:bg-stone-900" />
          <Button type="button" disabled={item.stock <= 0} onClick={add}>{t('product.add')}</Button>
          <Button type="button" variant="secondary" disabled={item.stock <= 0} onClick={() => { add(); router.push('/checkout'); }}>{t('product.buy')}</Button>
        </div>
      </div>
    </div>
  );
}
