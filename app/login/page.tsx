'use client';

import { signInWithEmailAndPassword } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/components/providers';
import { SiteFooter, Wordmark } from '@/components/frames';
import { Button, Field, PasswordInput, TextInput } from '@/components/ui';
import { firebaseConfigured, getFirebaseAuth } from '@/lib/firebase';

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const auth = getFirebaseAuth();
    if (!auth) return;
    setPending(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/admin');
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
      const badPassword = code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found') || code.includes('invalid-email');
      toast.error(badPassword ? t('auth.badCredentials') : t('auth.failed'));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8">
      <Link href="/" className="mb-6 block w-full max-w-[280px] rounded-2xl bg-white p-3 shadow-card ring-1 ring-stone-200">
        <Wordmark />
      </Link>
      <h1 className="text-2xl font-semibold">{t('nav.login')}</h1>
      {!firebaseConfigured() ? <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm dark:bg-amber-950">{t('auth.missing')}</p> : (
        <form className="mt-4 space-y-3" onSubmit={(event) => void submit(event)}>
          <Field label={t('auth.email')}><TextInput type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></Field>
          <Field label={t('auth.password')}><PasswordInput required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></Field>
          <Button type="submit" disabled={pending}>{pending ? t('common.loading') : t('auth.signIn')}</Button>
        </form>
      )}
    </main>
    <SiteFooter />
    </div>
  );
}
