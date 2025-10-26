import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { TekUpSSOProvider } from '@tekup/sso';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FoodTruck OS - TekUp',
  description: 'Danish compliant point-of-sale and management system for food trucks',
};

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="da">
      <body className={inter.className}>
        <TekUpSSOProvider>
          <QueryClientProvider client={queryClient}>
            {children}
            <Toaster position="top-right" />
          </QueryClientProvider>
        </TekUpSSOProvider>
      </body>
    </html>
  );
}
