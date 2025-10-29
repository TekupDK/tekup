import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TekupAI - Intelligent AI Assistant with Memory',
  description: 'Advanced AI assistant powered by Claude with persistent memory and MCP integrations',
  keywords: ['AI', 'Assistant', 'Claude', 'Memory', 'MCP', 'Chat'],
  authors: [{ name: 'Tekup' }],
  openGraph: {
    title: 'TekupAI',
    description: 'Intelligent AI Assistant with Memory',
    type: 'website',
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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
