import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistance, parseISO } from 'date-fns';
import { da } from 'date-fns/locale';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date to Danish locale
 */
export function formatDate(date: string | Date, formatStr: string = 'PPP'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: da });
}

/**
 * Format date to relative time (e.g., "for 2 timer siden")
 */
export function formatRelative(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true, locale: da });
}

/**
 * Format time (HH:mm)
 */
export function formatTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'HH:mm');
}

/**
 * Format currency to DKK
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} min`;
  }

  if (mins === 0) {
    return `${hours} t`;
  }

  return `${hours} t ${mins} min`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Generate random color for avatar
 */
export function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-cyan-500',
  ];

  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Danish format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+45)?[0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Format phone number to Danish format
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 8) {
    return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 8)}`;
  }

  if (cleaned.length === 10 && cleaned.startsWith('45')) {
    return `+45 ${cleaned.substring(2, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8, 10)}`;
  }

  return phone;
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): (...funcArgs: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...funcArgs: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...funcArgs);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if booking times conflict
 */
export function hasTimeConflict(
  startTime1: Date | string,
  endTime1: Date | string,
  startTime2: Date | string,
  endTime2: Date | string
): boolean {
  const start1 = typeof startTime1 === 'string' ? parseISO(startTime1) : startTime1;
  const end1 = typeof endTime1 === 'string' ? parseISO(endTime1) : endTime1;
  const start2 = typeof startTime2 === 'string' ? parseISO(startTime2) : startTime2;
  const end2 = typeof endTime2 === 'string' ? parseISO(endTime2) : endTime2;

  return start1 < end2 && start2 < end1;
}

/**
 * Calculate end time from start time and duration
 */
export function calculateEndTime(startTime: Date | string, durationMinutes: number): Date {
  const start = typeof startTime === 'string' ? parseISO(startTime) : startTime;
  return new Date(start.getTime() + durationMinutes * 60000);
}
