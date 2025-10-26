import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { JarvisProvider } from '@/providers/jarvis-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Jarvis - Tekup AI Assistant',
  description: 'Complete AI Assistant integrated with Tekup ecosystem - Voice, Chat, and Consciousness',
  keywords: ['AI', 'Assistant', 'Voice', 'Chat', 'Tekup', 'Danish', 'Business'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="da" className="dark">
      <body className={`${inter.className} bg-jarvis-dark text-white antialiased`}>
        <JarvisProvider>
          {children}
        </JarvisProvider>
      </body>
    </html>
  );
}