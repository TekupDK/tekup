'use client'

import Link from 'next/link'

const QuickActions = () => {
  const actions = [
    {
      title: 'Ny Bestilling',
      description: 'Opret en ny manuel bestilling',
      icon: '➕',
      href: '/orders/new',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'Tilføj Menu Item',
      description: 'Tilføj ny ret til menuen',
      icon: '🍽️',
      href: '/menu/new',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'Lager Check',
      description: 'Tjek lagerstatus og bestellinger',
      icon: '📦',
      href: '/inventory',
      color: 'bg-yellow-600 hover:bg-yellow-700'
    },
    {
      title: 'Ny Medarbejder',
      description: 'Tilføj medarbejder til systemet',
      icon: '👤',
      href: '/staff/new',
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      title: 'Dagens Rapport',
      description: 'Se dagens salgsrapport',
      icon: '📊',
      href: '/reports/daily',
      color: 'bg-indigo-600 hover:bg-indigo-700'
    },
    {
      title: 'Indstillinger',
      description: 'Restaurant konfiguration',
      icon: '⚙️',
      href: '/settings',
      color: 'bg-gray-600 hover:bg-gray-700'
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          ⚡ Hurtige Handlinger
        </h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className={`${action.color} text-white p-4 rounded-lg transition-colors group block`}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{action.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white group-hover:text-gray-100">
                    {action.title}
                  </h4>
                  <p className="text-sm text-gray-100 group-hover:text-gray-200">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default QuickActions