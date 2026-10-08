import type { Metadata } from 'next';
import { HomePage } from '@/features/home';
import { shop } from '@/lib/shop';

export const metadata: Metadata = {
  title: shop.name,
  description: 'Trusted wholesale grocery trading in Tongi, Gazipur. M/S Khaja Traders product catalog and shop contact.',
};

export default function Page() {
  return <HomePage />;
}
