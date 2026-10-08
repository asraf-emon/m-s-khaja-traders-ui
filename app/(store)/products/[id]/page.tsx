import type { Metadata } from 'next';
import { ProductDetail } from '@/features/product-detail';
import { API_URL } from '@/lib/shop';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const response = await fetch(`${API_URL}/api/products/${id}`, { next: { revalidate: 60 } });
    const json = await response.json() as { success: boolean; data?: { name: string; description: string; images?: { secureUrl: string }[] } };
    if (!json.success || !json.data) return { title: 'Product' };
    return {
      title: json.data.name,
      description: json.data.description,
      openGraph: { images: json.data.images?.[0] ? [json.data.images[0].secureUrl] : [] },
    };
  } catch {
    return { title: 'Product' };
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetail id={id} />;
}
