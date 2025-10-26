'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import {
  HomeIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  CalendarIcon,
  PhoneIcon,
  DocumentChartBarIcon,
  BellIcon,
} from '@heroicons/react/24/outline'

interface SidebarProps {
  tenant: string
}

const getTenantConfig = (tenant: string) => {
  const configs = {
    rendetalje: {
      name: 'Rendetalje',
      color: 'bg-blue-600',
      navigation: [
        { name: 'Dashboard', href: `/t/${tenant}/dashboard`, icon: HomeIcon },
        { name: 'Leads', href: `/t/${tenant}/leads`, icon: UserGroupIcon },
        { name: 'Kalender', href: `/t/${tenant}/calendar`, icon: CalendarIcon },
        { name: 'Kvalifikation', href: `/t/${tenant}/qualification`, icon: DocumentChartBarIcon },
        { name: 'SLA & Handlinger', href: `/t/${tenant}/sla`, icon: BellIcon },
        { name: 'Analytics', href: `/t/${tenant}/analytics`, icon: ChartBarIcon },
        { name: 'Indstillinger', href: `/t/${tenant}/settings`, icon: CogIcon },
      ]
    },
    'foodtruck-fiesta': {
      name: 'Foodtruck Fiesta',
      color: 'bg-orange-600',
      navigation: [
        { name: 'Dashboard', href: `/t/${tenant}/dashboard`, icon: HomeIcon },
        { name: 'Events', href: `/t/${tenant}/events`, icon: CalendarIcon },
        { name: 'Bookings', href: `/t/${tenant}/bookings`, icon: UserGroupIcon },
        { name: 'Analytics', href: `/t/${tenant}/analytics`, icon: ChartBarIcon },
        { name: 'Settings', href: `/t/${tenant}/settings`, icon: CogIcon },
      ]
    },
    'tekup-corporate': {
      name: 'TekUp Corporate',
      color: 'bg-purple-600',
      navigation: [
        { name: 'Dashboard', href: `/t/${tenant}/dashboard`, icon: HomeIcon },
        { name: 'Incidents', href: `/t/${tenant}/incidents`, icon: BellIcon },
        { name: 'Clients', href: `/t/${tenant}/clients`, icon: UserGroupIcon },
        { name: 'Analytics', href: `/t/${tenant}/analytics`, icon: ChartBarIcon },
        { name: 'Settings', href: `/t/${tenant}/settings`, icon: CogIcon },
      ]
    }
  }
  return configs[tenant as keyof typeof configs] || configs.rendetalje
}

export default function Sidebar({ tenant }: SidebarProps) {
  const pathname = usePathname()
  const config = getTenantConfig(tenant)

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200 overflow-y-auto">
        {/* Logo/Brand */}
        <div className="flex items-center flex-shrink-0 px-4">
          <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center mr-3', config.color)}>
            <span className="text-white font-semibold text-lg">
              {config.name.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {config.name}
            </h1>
            <p className="text-xs text-gray-500">
              Lead Platform
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 pb-4 mt-6 space-y-1">
          {config.navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  isActive
                    ? 'bg-primary-50 border-r-2 border-primary-600 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-l-lg transition-colors duration-200'
                )}
              >
                <item.icon
                  className={clsx(
                    isActive
                      ? 'text-primary-500'
                      : 'text-gray-400 group-hover:text-gray-500',
                    'mr-3 flex-shrink-0 h-5 w-5'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            TekUp Lead Platform v0.1.0
          </div>
        </div>
      </div>
    </div>
  )
}
