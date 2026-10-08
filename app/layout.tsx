import type { Metadata, Viewport } from 'next';
import { Noto_Sans_Bengali, Source_Sans_3 } from 'next/font/google';
import { Providers } from '@/components/providers';
import { shop } from '@/lib/shop';
import './globals.css';

const sans = Source_Sans_3({ subsets: ['latin'], variable: '--font-sans' });
const bengali = Noto_Sans_Bengali({ subsets: ['bengali'], weight: ['400', '600', '700'], variable: '--font-bn' });

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: { default: shop.name, template: `%s · ${shop.name}` },
  description: 'Wholesale grocery inventory and product catalog for M/S Khaja Traders, Tongi, Gazipur.',
  openGraph: {
    title: shop.name,
    description: 'Trusted wholesale trading in Tongi, Gazipur.',
    url: shop.facebook,
    images: ['/logo.png'],
  },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#17632f' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${bengali.variable} bg-paper font-sans text-ink antialiased dark:bg-forest-950 dark:text-stone-100`}>
        <script dangerouslySetInnerHTML={{ __html: "try{if(localStorage.getItem('khaja-theme')==='dark')document.documentElement.classList.add('dark');var l=localStorage.getItem('khaja-locale');if(l==='bn')document.documentElement.lang='bn';}catch(e){}" }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
