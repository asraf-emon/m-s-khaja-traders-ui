'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminFrame } from '@/components/frames';
import { useAuth, useI18n } from '@/components/providers';
import { Button } from '@/components/ui';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (auth.ready && !auth.user) router.replace('/login');
  }, [auth.ready, auth.user, router]);

  if (!auth.ready) return <p className="p-6">{t('common.loading')}</p>;
  if (!auth.user) return <p className="p-6">{t('common.loading')}</p>;
  if (!auth.profile) {
    return (
      <div className="p-6">
        <p>{t('auth.denied')}</p>
        <Button type="button" className="mt-3" onClick={() => void auth.signOut()}>{t('auth.signOut')}</Button>
      </div>
    );
  }
  return <AdminFrame pathname={pathname}>{children}</AdminFrame>;
}
