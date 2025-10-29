import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(prefix = 'id') {
  const random = Math.random().toString(36).slice(2, 8);
  const timestamp = Date.now().toString(36);
  return `${prefix}_${random}_${timestamp}`;
}

export function formatDate(
  date: string | number | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
) {
  try {
    const value = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat('en-US', options).format(value);
  } catch (error) {
    console.warn('Failed to format date:', error);
    return '';
  }
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isBrowser() {
  return typeof window !== 'undefined';
}
