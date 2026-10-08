'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { useI18n } from '@/components/providers';
import { cn } from '@/lib/format';

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const styles = {
    primary: 'bg-brand-700 text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-800 hover:shadow-md disabled:translate-y-0 disabled:bg-brand-700/60 disabled:shadow-none',
    secondary: 'border border-stone-300 bg-white text-ink shadow-sm hover:-translate-y-0.5 hover:border-brand-600 hover:bg-brand-50 hover:shadow-md disabled:translate-y-0 dark:border-forest-800 dark:bg-forest-900 dark:text-stone-100 dark:hover:border-brand-600 dark:hover:bg-forest-800',
    ghost: 'text-ink hover:bg-brand-50 dark:text-stone-100 dark:hover:bg-forest-800',
    danger: 'bg-red-700 text-white shadow-sm hover:-translate-y-0.5 hover:bg-red-800 hover:shadow-md disabled:translate-y-0',
  }[variant];
  return (
    <button
      className={cn('inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:cursor-not-allowed', styles, className)}
      {...props}
    />
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block min-w-0 text-sm">
      <span className="mb-1.5 block font-medium text-stone-700 dark:text-stone-200">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-stone-500">{hint}</span> : null}
    </label>
  );
}

export function DateRange({ from, to, fromLabel, toLabel, onFrom, onTo }: {
  from: string;
  to: string;
  fromLabel: string;
  toLabel: string;
  onFrom: (value: string) => void;
  onTo: (value: string) => void;
}) {
  const { t } = useI18n();
  const active = Boolean(from || to);
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <Field label={fromLabel}><TextInput type="date" value={from} onChange={(event) => onFrom(event.target.value)} /></Field>
      <Field label={toLabel}><TextInput type="date" value={to} onChange={(event) => onTo(event.target.value)} /></Field>
      {active ? <Button type="button" variant="secondary" onClick={() => { onFrom(''); onTo(''); }}>{t('common.clear')}</Button> : <span className="hidden sm:block" />}
    </div>
  );
}

const control = 'min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-ink outline-none focus:border-brand-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100';

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, props.className)} {...props} />;
}

export function PasswordInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input className={cn(control, 'pr-12', className)} {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-stone-500 hover:bg-brand-50 hover:text-brand-800 dark:hover:bg-forest-800 dark:hover:text-stone-100"
        aria-label={visible ? 'Hide password' : 'Show password'}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(control, props.className)} {...props} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, 'min-h-24 py-2', props.className)} {...props} />;
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'ok' | 'warn' | 'bad' }) {
  const tones = {
    neutral: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200',
    ok: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
    warn: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
    bad: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  }[tone];
  return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', tones)}>{children}</span>;
}

export function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 px-4 py-12 text-center dark:border-stone-700">
      <p className="text-stone-600 dark:text-stone-300">{title}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-stone-200 dark:bg-stone-800', className)} />;
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[100dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 shadow-card dark:bg-forest-800 sm:max-w-2xl sm:rounded-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" className="min-h-11 rounded-xl px-3 text-sm hover:bg-brand-50 dark:hover:bg-forest-800" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('rounded-2xl border border-stone-200 bg-white p-4 shadow-card transition duration-200 hover:border-brand-200 hover:shadow-lg dark:border-forest-800 dark:bg-forest-800 dark:hover:border-brand-700', className)}>{children}</section>;
}
