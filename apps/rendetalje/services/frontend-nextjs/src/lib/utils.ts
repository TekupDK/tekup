import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'DKK'): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(date: string | Date, format: 'short' | 'long' | 'time' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  switch (format) {
    case 'long':
      return new Intl.DateTimeFormat('da-DK', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(dateObj)
    case 'time':
      return new Intl.DateTimeFormat('da-DK', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(dateObj)
    default:
      return new Intl.DateTimeFormat('da-DK').format(dateObj)
  }
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) {
    return `${mins} min`
  }
  
  return mins === 0 ? `${hours} t` : `${hours} t ${mins} min`
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'text-success-600 bg-success-50'
    case 'in_progress':
      return 'text-primary-600 bg-primary-50'
    case 'scheduled':
    case 'confirmed':
      return 'text-warning-600 bg-warning-50'
    case 'cancelled':
      return 'text-danger-600 bg-danger-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

export function getStatusText(status: string): string {
  switch (status.toLowerCase()) {
    case 'scheduled':
      return 'Planlagt'
    case 'confirmed':
      return 'Bekræftet'
    case 'in_progress':
      return 'I gang'
    case 'completed':
      return 'Færdig'
    case 'cancelled':
      return 'Aflyst'
    case 'rescheduled':
      return 'Omplanlagt'
    default:
      return status
  }
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}