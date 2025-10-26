import { redirect } from 'next/navigation'
import TenantSelector from '@/components/TenantSelector'

export default async function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-primary-600 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            TekUp Lead Platform
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Avanceret lead kvalifikation og håndtering for TekUp tenants
          </p>

          <TenantSelector />
        </div>
      </div>
    </div>
  )
}
