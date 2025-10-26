import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rendetalje OS - Professionel Rengøringsstyring',
  description: 'Tekup Ecosystem - Professionel rengøringsstyring med AI integration',
  keywords: 'rengøring, cleaning, management, Tekup, Aarhus, Danmark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="da">
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: 'linear-gradient(135deg, #1e293b 0%, #7c3aed 50%, #1e293b 100%)',
        minHeight: '100vh',
      }}>
        {children}
      </body>
    </html>
  )
}
