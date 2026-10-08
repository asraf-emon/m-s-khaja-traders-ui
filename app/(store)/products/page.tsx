import { Suspense } from 'react';
import { CatalogPage } from '@/features/catalog';

export default function Page() {
  return <Suspense fallback={<p>Loading...</p>}><CatalogPage /></Suspense>;
}
