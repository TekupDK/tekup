import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Tekup AI Solutions - AI Transformation for Danish SMVs',
  description: 'Transform din virksomhed med AI-drevet automation og voice agents. Specialist i multi-business platforms og danske voice commands.',
  keywords: ['AI automation', 'voice agents', 'Danish SMV', 'business automation', 'multi-business platform'],
  authors: [{ name: 'Tekup AI Solutions' }],
  openGraph: {
    title: 'Tekup AI Solutions - AI Transformation for Danish SMVs',
    description: 'Transform din virksomhed med AI-drevet automation og voice agents.',
    url: 'https://tekup.dk',
    siteName: 'Tekup AI Solutions',
    locale: 'da_DK',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tekup AI Solutions - AI Transformation for Danish SMVs',
    description: 'Transform din virksomhed med AI-drevet automation og voice agents.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="da">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  )
}