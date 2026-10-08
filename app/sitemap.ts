import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'http://localhost:3000';
  return ['', '/products', '/categories', '/cart', '/checkout'].map((path) => ({
    url: `${base}${path || '/'}`,
    changeFrequency: 'daily',
    priority: path === '' ? 1 : 0.7,
  }));
}
