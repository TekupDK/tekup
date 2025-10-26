import type React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  title: 'Tekup - Unified IT Support, CRM og AI-assisterede Leads',
  description:
    'Multi-tenant SMB IT-support SaaS platform med CRM integration og AI-drevet lead management. Automatiser lead-kvalificering og skalér sikkert.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
