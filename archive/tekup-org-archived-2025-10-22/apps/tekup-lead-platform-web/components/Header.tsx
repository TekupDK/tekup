'use client'

import { useState } from 'react'
import { BellIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

interface HeaderProps {
  tenant: string
}

const getTenantInfo = (tenant: string) => {
  const info = {
    rendetalje: {
      name: 'Rendetalje',
      domain: 'Rengøring • Aarhus',
    },
    'foodtruck-fiesta': {
      name: 'Foodtruck Fiesta',
      domain: 'Mobile madservice',
    },
    'tekup-corporate': {
      name: 'TekUp Corporate',
      domain: 'Enterprise incidents',
    }
  }
  return info[tenant as keyof typeof info] || info.rendetalje
}

export default function Header({ tenant }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const tenantInfo = getTenantInfo(tenant)

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left section */}
          <div className="flex items-center">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {tenantInfo.name} Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                {tenantInfo.domain}
              </p>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {/* Quick stats */}
            <div className="hidden lg:flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">89%</div>
                <div className="text-xs text-gray-500">Qualification Rate</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">2.3h</div>
                <div className="text-xs text-gray-500">Avg Response</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600">23</div>
                <div className="text-xs text-gray-500">Active Leads</div>
              </div>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                className="p-2 text-gray-400 hover:text-gray-500 relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <BellIcon className="h-6 w-6" />
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900">Notifikationer</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    <div className="p-4 hover:bg-gray-50">
                      <div className="flex">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">SLA overtrædt</p>
                          <p className="text-xs text-gray-500">Lead #1234 - Rendetalje - 4h forsinket</p>
                          <p className="text-xs text-gray-400">2 min siden</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 hover:bg-gray-50">
                      <div className="flex">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">Nyt kvalificeret lead</p>
                          <p className="text-xs text-gray-500">Flytterengøring - Aarhus C</p>
                          <p className="text-xs text-gray-400">15 min siden</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 hover:bg-gray-50">
                      <div className="flex">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">Booking bekræftet</p>
                          <p className="text-xs text-gray-500">Kunde accepterede tidspunkt</p>
                          <p className="text-xs text-gray-400">1t siden</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-t border-gray-200">
                    <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                      Se alle notifikationer
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="flex items-center">
              <button className="flex items-center text-sm text-gray-700 hover:text-gray-900">
                <UserCircleIcon className="h-8 w-8 text-gray-400 mr-2" />
                <span className="hidden md:block">TekUp Admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
