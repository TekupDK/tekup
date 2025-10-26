import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/sidebar';
import { TenantSwitcher } from '@/components/tenant-switcher';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TekUp Agents Hub',
  description: 'Overblik, styring og personalisering af AI agents',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="da">
      <body className={inter.className}>
        <Sidebar />
        <div className="md:pl-64">
          <div className="p-4 border-b border-white/10 flex justify-end">
            <TenantSwitcher />
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
