'use client'

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: LucideIcon
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  loading?: boolean
}

const colorClasses = {
  blue: 'text-blue-600 bg-blue-50',
  green: 'text-green-600 bg-green-50',
  yellow: 'text-yellow-600 bg-yellow-50',
  red: 'text-red-600 bg-red-50',
  purple: 'text-purple-600 bg-purple-50',
}

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color = 'blue',
  loading = false,
}: KPICardProps) {
  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
          </div>
          <div className="h-12 w-12 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    )
  }

  const isPositiveChange = change !== undefined && change >= 0
  const changeColor = isPositiveChange ? 'text-green-600' : 'text-red-600'

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change !== undefined && (
            <p className={cn('text-sm mt-1', changeColor)}>
              {isPositiveChange ? '+' : ''}{change.toFixed(1)}%
              {changeLabel && (
                <span className="text-gray-500 ml-1">{changeLabel}</span>
              )}
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', colorClasses[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}