'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'

const tenants = [
  {
    id: 'rendetalje',
    name: 'Rendetalje',
    description: 'Rengøringsvirksomhed i Aarhus',
    domain: 'cleaning',
    color: 'bg-blue-600',
    stats: { leads: 156, qualified: 89, converted: 23 }
  },
  {
    id: 'foodtruck-fiesta',
    name: 'Foodtruck Fiesta',
    description: 'Mobile madservice',
    domain: 'food_service',
    color: 'bg-orange-600',
    stats: { leads: 78, qualified: 45, converted: 12 }
  },
  {
    id: 'tekup-corporate',
    name: 'TekUp Corporate',
    description: 'B2B incident management',
    domain: 'enterprise',
    color: 'bg-purple-600',
    stats: { leads: 234, qualified: 167, converted: 45 }
  }
]

export default function TenantSelector() {
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null)
  const router = useRouter()

  const handleTenantSelect = (tenantId: string) => {
    setSelectedTenant(tenantId)
    router.push(`/t/${tenantId}/dashboard`)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tenants.map((tenant) => (
          <div
            key={tenant.id}
            className={clsx(
              'relative rounded-lg border-2 p-6 cursor-pointer transition-all duration-200',
              'hover:border-primary-300 hover:shadow-lg',
              selectedTenant === tenant.id 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-gray-200 bg-white hover:bg-gray-50'
            )}
            onClick={() => handleTenantSelect(tenant.id)}
          >
            <div className="flex items-center mb-4">
              <div className={clsx('w-12 h-12 rounded-lg flex items-center justify-center', tenant.color)}>
                <span className="text-white font-semibold text-xl">
                  {tenant.name.charAt(0)}
                </span>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {tenant.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {tenant.description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-lg font-bold text-gray-900">
                  {tenant.stats.leads}
                </div>
                <div className="text-xs text-gray-500">
                  Leads
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-2">
                <div className="text-lg font-bold text-blue-900">
                  {tenant.stats.qualified}
                </div>
                <div className="text-xs text-blue-500">
                  Qualified
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-2">
                <div className="text-lg font-bold text-green-900">
                  {tenant.stats.converted}
                </div>
                <div className="text-xs text-green-500">
                  Converted
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500 capitalize">
                {tenant.domain.replace('_', ' ')}
              </span>
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Vælg en tenant for at se lead dashboard
        </p>
      </div>
    </div>
  )
}
