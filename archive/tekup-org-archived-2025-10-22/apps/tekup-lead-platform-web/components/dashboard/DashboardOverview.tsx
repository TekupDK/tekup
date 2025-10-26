'use client'

import { ChartBarIcon, UserGroupIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline'

interface DashboardOverviewProps {
  tenant: string
}

const getMetricsForTenant = (tenant: string) => {
  const metrics = {
    rendetalje: {
      totalLeads: 156,
      qualifiedLeads: 89,
      convertedLeads: 23,
      avgResponseTime: 2.3,
      qualificationRate: 89,
      conversionRate: 26,
      revenue: 145600
    },
    'foodtruck-fiesta': {
      totalLeads: 78,
      qualifiedLeads: 45,
      convertedLeads: 12,
      avgResponseTime: 4.1,
      qualificationRate: 75,
      conversionRate: 27,
      revenue: 89400
    },
    'tekup-corporate': {
      totalLeads: 234,
      qualifiedLeads: 167,
      convertedLeads: 45,
      avgResponseTime: 1.2,
      qualificationRate: 92,
      conversionRate: 27,
      revenue: 567800
    }
  }
  return metrics[tenant as keyof typeof metrics] || metrics.rendetalje
}

export default function DashboardOverview({ tenant }: DashboardOverviewProps) {
  const metrics = getMetricsForTenant(tenant)

  const stats = [
    {
      name: 'Total Leads',
      value: metrics.totalLeads,
      change: '+12%',
      changeType: 'positive',
      icon: UserGroupIcon,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      name: 'Qualified Leads',
      value: metrics.qualifiedLeads,
      change: '+8%',
      changeType: 'positive', 
      icon: CheckCircleIcon,
      color: 'text-green-600 bg-green-100',
    },
    {
      name: 'Converted',
      value: metrics.convertedLeads,
      change: '+15%',
      changeType: 'positive',
      icon: ChartBarIcon,
      color: 'text-purple-600 bg-purple-100',
    },
    {
      name: 'Avg Response',
      value: `${metrics.avgResponseTime}h`,
      change: '-23%',
      changeType: 'positive',
      icon: ClockIcon,
      color: 'text-orange-600 bg-orange-100',
    },
  ]

  return (
    <div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional metrics for Rendetalje */}
      {tenant === 'rendetalje' && (
        <div className="mt-6 bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Rendetalje Specifikt
            </h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.qualificationRate}%
                </div>
                <div className="text-sm text-gray-500">
                  Kvalifikationsrate
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(metrics.revenue).toLocaleString('da-DK')} kr
                </div>
                <div className="text-sm text-gray-500">
                  Estimeret omsætning
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {metrics.conversionRate}%
                </div>
                <div className="text-sm text-gray-500">
                  Konverteringsrate
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
