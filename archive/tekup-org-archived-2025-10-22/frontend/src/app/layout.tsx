import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'TekUp - Restaurant Management Platform',
    template: '%s | TekUp',
  },
  description: 'AI-powered restaurant management platform for modern restaurants',
  keywords: [
    'restaurant management',
    'AI analytics',
    'menu management',
    'order tracking',
    'restaurant dashboard',
  ],
  authors: [{ name: 'TekUp Team' }],
  creator: 'TekUp',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tekup.com',
    title: 'TekUp - Restaurant Management Platform',
    description: 'AI-powered restaurant management platform for modern restaurants',
    siteName: 'TekUp',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TekUp - Restaurant Management Platform',
    description: 'AI-powered restaurant management platform for modern restaurants',
    creator: '@tekup',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}