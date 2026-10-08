import { Suspense } from 'react';
import { ConfirmationPage } from '@/features/commerce';

export default function Page() {
  return <Suspense fallback={<p className="p-4">Loading...</p>}><ConfirmationPage /></Suspense>;
}
