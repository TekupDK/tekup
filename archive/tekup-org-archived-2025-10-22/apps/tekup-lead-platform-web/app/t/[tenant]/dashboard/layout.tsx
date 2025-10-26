import { notFound } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

// Define available tenants
const AVAILABLE_TENANTS = ['test-tenant', 'rendetalje', 'foodtruck-fiesta', 'tekup-corporate']

interface TenantLayoutProps {
  children: React.ReactNode
  params: Promise<{ tenant: string }>
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { tenant } = await params

  if (!AVAILABLE_TENANTS.includes(tenant)) {
    notFound()
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar tenant={tenant} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header tenant={tenant} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
