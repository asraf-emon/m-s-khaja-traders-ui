'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, Moon, ShoppingBag, Sun, X } from 'lucide-react';
import { localized, useAuth, useCart, useI18n, useTheme } from '@/components/providers';
import { Badge, Button } from '@/components/ui';
import { shop } from '@/lib/shop';
import { formatBdt } from '@/lib/format';
import { named } from '@/lib/labels';
import type { Product } from '@/types';
import { toast } from 'sonner';

export function stockTone(status: string) {
  if (status === 'out') return 'bad' as const;
  if (status === 'low') return 'warn' as const;
  return 'ok' as const;
}

export function ProductCard({ product }: { product: Product }) {
  const { t, locale } = useI18n();
  const cart = useCart();
  const image = product.images[0]?.secureUrl;
  const disabled = product.stockStatus === 'out';
  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg dark:border-forest-800 dark:bg-forest-800 dark:hover:border-brand-700">
      <Link href={`/products/${product.id}`} className="block aspect-[4/3] w-full overflow-hidden bg-stone-100 dark:bg-forest-900">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={localized(locale, product)} className="h-full w-full object-cover transition duration-300 hover:scale-105" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-brand-50 text-3xl font-semibold text-brand-800 dark:bg-forest-900 dark:text-brand-100">
            {localized(locale, product).slice(0, 1)}
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs text-stone-500">{product.category ? localized(locale, product.category) : '—'} · {named(t, `unit.${product.unit}`)}</p>
        <Link href={`/products/${product.id}`} className="line-clamp-2 font-semibold transition hover:text-brand-700 dark:hover:text-brand-200">{localized(locale, product)}</Link>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-lg font-semibold text-accent-600">{formatBdt(product.sellingPrice)}</p>
            <p className="text-xs text-stone-500">{t('common.wholesale')} {formatBdt(product.wholesalePrice)}</p>
          </div>
          <Badge tone={stockTone(product.stockStatus)}>{t(product.stockStatus === 'out' ? 'stock.out' : product.stockStatus === 'low' ? 'stock.low' : 'stock.in')}</Badge>
        </div>
        <Button
          type="button"
          disabled={disabled}
          onClick={() => {
            cart.add({
              productId: product.id,
              name: product.name,
              nameBn: product.nameBn,
              unit: product.unit,
              price: product.sellingPrice,
              quantity: 1,
              stock: product.stock,
              image,
            });
            toast.success(t('product.added'));
          }}
        >
          {t('product.add')}
        </Button>
      </div>
    </article>
  );
}

export function BrandMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/mark.png" alt="" className={`object-contain ${className}`} />
  );
}

export function Wordmark({ className = 'h-auto w-full' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.png" alt="M/S Khaja Traders" className={`aspect-[1119/769] object-contain ${className}`} />
  );
}

export function SiteFooter() {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-stone-200 bg-white px-4 py-8 text-sm dark:border-forest-800 dark:bg-forest-900">
      <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-[1.2fr_1fr]">
        <div className="min-w-0">
          <div className="mb-3 w-full max-w-[220px] rounded-xl bg-white p-2">
            <Wordmark />
          </div>
          <p className="font-semibold">{shop.name}</p>
          <p className="mt-1 text-stone-600 dark:text-stone-300">{shop.address}</p>
          <p className="mt-2 text-stone-500">{t('footer.place')}</p>
        </div>
        <div className="min-w-0 sm:text-right">
          {shop.phones.map((phone) => (
            <p key={phone}><a className="hover:text-brand-700 dark:hover:text-brand-200" href={`tel:${phone}`}>{phone}</a></p>
          ))}
          <a className="text-brand-700 hover:text-accent-600 dark:text-brand-200" href={shop.facebook}>{t('home.facebook')}</a>
          <p className="mt-4 font-semibold">© {year} {shop.name}. {t('footer.rights')}</p>
          <p className="mt-2">{t('footer.credit')} Asraf Emon</p>
          <p><a className="break-all hover:text-brand-700 dark:hover:text-brand-200" href="mailto:asrafemonbd97@gmail.com">asrafemonbd97@gmail.com</a></p>
          <p><a className="hover:text-brand-700 dark:hover:text-brand-200" href="tel:01644271458">01644271458</a></p>
        </div>
      </div>
    </footer>
  );
}

export function StoreFrame({ children }: { children: React.ReactNode }) {
  const { t, locale, setLocale } = useI18n();
  const { theme, toggle } = useTheme();
  const cart = useCart();
  const [query, setQuery] = useState('');
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-paper/95 backdrop-blur dark:border-forest-800 dark:bg-forest-950/95">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-2 rounded-xl pr-1 hover:bg-brand-50 dark:hover:bg-forest-800">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-stone-200">
              <BrandMark />
            </span>
            <span className="truncate text-sm font-semibold sm:text-base">{shop.name}</span>
          </Link>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <button type="button" className="min-h-11 rounded-xl px-2 text-sm font-semibold hover:bg-brand-50 hover:text-brand-800 dark:hover:bg-forest-800" onClick={() => setLocale(locale === 'en' ? 'bn' : 'en')}>
              {locale === 'en' ? 'বাংলা' : 'EN'}
            </button>
            <button type="button" aria-label={t('theme.toggle')} className="grid h-11 w-11 place-items-center rounded-xl hover:bg-brand-50 hover:text-brand-800 dark:hover:bg-forest-800" onClick={toggle}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link href="/cart" className="relative grid h-11 w-11 place-items-center rounded-xl hover:bg-brand-50 hover:text-brand-800 dark:hover:bg-forest-800" aria-label={t('nav.cart')}>
              <ShoppingBag size={18} />
              {cart.count > 0 ? <span className="absolute right-1 top-1 rounded-full bg-accent-500 px-1.5 text-[10px] font-bold text-white">{cart.count}</span> : null}
            </Link>
            <Link href="/login" className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-semibold hover:bg-brand-50 hover:text-brand-800 sm:inline-flex dark:hover:bg-forest-800">{t('nav.login')}</Link>
          </div>
        </div>
        <form action="/products" className="mx-auto max-w-6xl px-4 pb-3">
          <input name="q" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('common.search')} className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm transition focus:border-brand-700 focus:ring-2 focus:ring-brand-100 dark:border-forest-800 dark:bg-forest-900 dark:focus:ring-brand-900" />
        </form>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3 text-sm font-medium">
          {[
            ['/', t('nav.home')],
            ['/products', t('nav.products')],
            ['/categories', t('nav.categories')],
            ['/cart', t('nav.cart')],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="shrink-0 whitespace-nowrap rounded-lg px-2 py-2 text-stone-600 hover:bg-brand-50 hover:text-brand-800 dark:text-stone-300 dark:hover:bg-forest-800 dark:hover:text-brand-100">{label}</Link>
          ))}
          <Link href="/login" className="shrink-0 whitespace-nowrap rounded-lg px-2 py-2 text-stone-600 hover:bg-brand-50 hover:text-brand-800 sm:hidden dark:text-stone-300 dark:hover:bg-forest-800">{t('nav.login')}</Link>
        </nav>
      </header>
      <main className="mx-auto min-w-0 max-w-6xl px-4 py-6">{children}</main>
      <SiteFooter />
    </div>
  );
}

const links: { href: string; key: 'nav.dashboard' | 'nav.products' | 'nav.categories' | 'nav.inventory' | 'nav.purchases' | 'nav.sales' | 'nav.orders' | 'nav.customers' | 'nav.suppliers' | 'nav.ledger' | 'nav.expenses' | 'nav.payments' | 'nav.reports' | 'nav.staff' | 'nav.admin' | 'nav.settings'; group: 'nav.group.shop' | 'nav.group.trade' | 'nav.group.accounts' | 'nav.group.office'; permission?: string; adminOnly?: boolean }[] = [
  { href: '/admin', key: 'nav.dashboard', group: 'nav.group.shop' },
  { href: '/admin/products', key: 'nav.products', group: 'nav.group.shop', permission: 'products.view' },
  { href: '/admin/categories', key: 'nav.categories', group: 'nav.group.shop', permission: 'products.view' },
  { href: '/admin/inventory', key: 'nav.inventory', group: 'nav.group.shop', permission: 'inventory.view' },
  { href: '/admin/purchases', key: 'nav.purchases', group: 'nav.group.trade', permission: 'purchases.view' },
  { href: '/admin/sales', key: 'nav.sales', group: 'nav.group.trade', permission: 'sales.view' },
  { href: '/admin/orders', key: 'nav.orders', group: 'nav.group.trade', permission: 'orders.view' },
  { href: '/admin/customers', key: 'nav.customers', group: 'nav.group.trade', permission: 'customers.view' },
  { href: '/admin/suppliers', key: 'nav.suppliers', group: 'nav.group.trade', permission: 'suppliers.view' },
  { href: '/admin/ledger', key: 'nav.ledger', group: 'nav.group.accounts', permission: 'ledger.view' },
  { href: '/admin/expenses', key: 'nav.expenses', group: 'nav.group.accounts', permission: 'expenses.view' },
  { href: '/admin/payments', key: 'nav.payments', group: 'nav.group.accounts', permission: 'payments.view' },
  { href: '/admin/reports', key: 'nav.reports', group: 'nav.group.accounts', permission: 'reports.view' },
  { href: '/admin/staff', key: 'nav.staff', group: 'nav.group.office', adminOnly: true },
  { href: '/admin/audit', key: 'nav.admin', group: 'nav.group.office', permission: 'audit.view' },
  { href: '/admin/settings', key: 'nav.settings', group: 'nav.group.office', permission: 'settings.manage' },
];

export function AdminFrame({ children, pathname }: { children: React.ReactNode; pathname: string }) {
  const { t, locale, setLocale } = useI18n();
  const { theme, toggle } = useTheme();
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const visible = links.filter((link) => {
    if (link.adminOnly && auth.profile?.role !== 'ADMIN') return false;
    return !link.permission || auth.can(link.permission);
  });
  const groups = ['nav.group.shop', 'nav.group.trade', 'nav.group.accounts', 'nav.group.office'] as const;
  const current = visible.find((link) => link.href === '/admin' ? pathname === '/admin' : pathname === link.href || pathname.startsWith(`${link.href}/`));
  const nav = (
    <nav className="flex flex-col gap-4 p-3">
      {groups.map((group) => {
        const items = visible.filter((link) => link.group === group);
        if (!items.length) return null;
        return (
          <div key={group}>
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">{t(group)}</p>
            <div className="flex flex-col gap-1">
              {items.map((link) => {
                const active = link.href === '/admin' ? pathname === '/admin' : pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={`min-h-11 rounded-xl px-3 py-2 text-sm font-medium ${active ? 'bg-brand-700 text-white shadow-sm' : 'text-stone-700 hover:bg-brand-50 hover:text-brand-800 dark:text-stone-200 dark:hover:bg-forest-800 dark:hover:text-brand-100'}`}>
                    {t(link.key)}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
  const account = (
    <div className="border-t border-stone-200 p-3 text-xs dark:border-forest-800">
      <p className="truncate font-medium">{auth.profile?.name}</p>
      <p className="truncate text-stone-500">{auth.profile?.role === 'ADMIN' ? t('role.admin') : t('role.staff')}</p>
      <button type="button" className="mt-2 min-h-11 rounded-lg px-2 text-sm font-semibold hover:bg-brand-50 hover:text-brand-800 dark:hover:bg-forest-800" onClick={() => void auth.signOut()}>{t('auth.signOut')}</button>
    </div>
  );
  return (
    <div className="min-h-screen bg-paper dark:bg-forest-950">
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-stone-200 bg-white dark:border-forest-800 dark:bg-forest-900 lg:flex">
        <Link href="/" className="block px-3 py-3">
          <span className="block rounded-2xl bg-white p-2 shadow-sm ring-1 ring-stone-200">
            <Wordmark className="h-auto w-full" />
          </span>
        </Link>
        <div className="min-h-0 flex-1 overflow-y-auto">{nav}</div>
        {account}
      </aside>
      {open ? (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label={t('common.close')} onClick={() => setOpen(false)} />
          <aside className="relative h-full w-[min(18rem,88vw)] overflow-y-auto bg-white dark:bg-forest-900">
            <div className="bg-white p-3">
              <Wordmark className="h-auto w-full" />
            </div>
            {nav}
            {account}
          </aside>
        </div>
      ) : null}
      <div className="flex min-h-screen min-w-0 flex-col lg:pl-64">
        <header className="no-print sticky top-0 z-20 flex items-center gap-2 border-b border-stone-200 bg-paper/95 px-4 py-3 backdrop-blur dark:border-forest-800 dark:bg-forest-950/95">
          <button type="button" className="grid h-11 w-11 place-items-center rounded-xl hover:bg-brand-50 dark:hover:bg-forest-800 lg:hidden" aria-label={t('nav.menu')} onClick={() => setOpen(true)}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white ring-1 ring-stone-200 lg:hidden">
            <BrandMark className="h-8 w-8" />
          </span>
          <p className="truncate text-sm font-semibold">{current ? t(current.key) : shop.name}</p>
          <div className="ml-auto flex items-center">
            <button type="button" className="min-h-11 rounded-xl px-2 text-sm font-semibold hover:bg-brand-50 hover:text-brand-800 dark:hover:bg-forest-800" onClick={() => setLocale(locale === 'en' ? 'bn' : 'en')}>{locale === 'en' ? 'বাংলা' : 'EN'}</button>
            <button type="button" aria-label={t('theme.toggle')} className="grid h-11 w-11 place-items-center rounded-xl hover:bg-brand-50 dark:hover:bg-forest-800" onClick={toggle}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
