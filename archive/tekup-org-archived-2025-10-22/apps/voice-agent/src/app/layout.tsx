import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { VoiceTenantProvider } from '@/contexts/voice-tenant-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TekUp Voice Agent',
  description: 'AI-powered voice assistant for TekUp ecosystem',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="da">
      <body className={inter.className}>
        <VoiceTenantProvider>
          {children}
        </VoiceTenantProvider>
      </body>
    </html>
  );
}