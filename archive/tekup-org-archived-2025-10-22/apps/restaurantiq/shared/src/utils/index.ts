/**
 * Shared utility functions for RestaurantIQ
 * Danish localization, currency formatting, and common operations
 */

import { CurrencyAmount, DateString, DateTimeString } from '../types/core';

// ============================================================================
// CURRENCY UTILITIES (Danish Kroner - DKK)
// ============================================================================

/**
 * Convert øre (minor unit) to kroner for display
 * @param ore Amount in øre (integer)
 * @returns Amount in kroner (decimal)
 */
export const oreToKroner = (ore: CurrencyAmount): number => {
  return ore / 100;
};

/**
 * Convert kroner to øre for storage
 * @param kroner Amount in kroner (decimal)
 * @returns Amount in øre (integer)
 */
export const kronerToOre = (kroner: number): CurrencyAmount => {
  return Math.round(kroner * 100);
};

/**
 * Format currency amount for Danish display
 * @param ore Amount in øre
 * @param showDecimals Whether to show decimal places
 * @returns Formatted string like "123,45 kr" or "123 kr"
 */
export const formatDanishCurrency = (
  ore: CurrencyAmount,
  showDecimals: boolean = true
): string => {
  const kroner = oreToKroner(ore);
  
  if (!showDecimals && kroner % 1 === 0) {
    return `${kroner.toLocaleString('da-DK')} kr`;
  }
  
  return `${kroner.toLocaleString('da-DK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} kr`;
};

/**
 * Parse Danish currency string to øre
 * @param currencyString String like "123,45 kr" or "123.45"
 * @returns Amount in øre
 */
export const parseDanishCurrency = (currencyString: string): CurrencyAmount => {
  // Remove "kr", spaces, and normalize decimal separators
  const normalized = currencyString
    .replace(/\s*kr\s*/gi, '')
    .replace(/\./g, '') // Remove thousand separators
    .replace(',', '.'); // Replace Danish decimal comma with dot
  
  const kroner = parseFloat(normalized);
  if (isNaN(kroner)) {
    throw new Error(`Invalid currency format: ${currencyString}`);
  }
  
  return kronerToOre(kroner);
};

// ============================================================================
// DATE & TIME UTILITIES (Danish timezone and formatting)
// ============================================================================

/**
 * Get current Danish date/time in Copenhagen timezone
 * @returns ISO string in Danish timezone
 */
export const getDanishNow = (): DateTimeString => {
  return new Date().toLocaleString('sv-SE', {
    timeZone: 'Europe/Copenhagen',
  }).replace(' ', 'T') + 'Z';
};

/**
 * Get current Danish date (YYYY-MM-DD)
 * @returns Date string in Danish timezone
 */
export const getDanishToday = (): DateString => {
  return new Date().toLocaleDateString('sv-SE', {
    timeZone: 'Europe/Copenhagen',
  });
};

/**
 * Format date for Danish display
 * @param dateString ISO date string or Date object
 * @returns Formatted date like "15. januar 2024"
 */
export const formatDanishDate = (dateString: DateString | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  return date.toLocaleDateString('da-DK', {
    timeZone: 'Europe/Copenhagen',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Format datetime for Danish display
 * @param dateTimeString ISO datetime string or Date object
 * @returns Formatted datetime like "15. jan 2024 kl. 14:30"
 */
export const formatDanishDateTime = (dateTimeString: DateTimeString | Date): string => {
  const date = typeof dateTimeString === 'string' ? new Date(dateTimeString) : dateTimeString;
  
  const dateStr = date.toLocaleDateString('da-DK', {
    timeZone: 'Europe/Copenhagen',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  
  const timeStr = date.toLocaleTimeString('da-DK', {
    timeZone: 'Europe/Copenhagen',
    hour: '2-digit',
    minute: '2-digit',
  });
  
  return `${dateStr} kl. ${timeStr}`;
};

/**
 * Get Danish weekday name
 * @param date Date object or date string
 * @returns Danish weekday name
 */
export const getDanishWeekday = (date: Date | DateString): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('da-DK', {
    timeZone: 'Europe/Copenhagen',
    weekday: 'long',
  });
};

/**
 * Check if a date is a Danish holiday
 * @param date Date to check
 * @returns Boolean indicating if it's a holiday
 */
export const isDanishHoliday = (date: Date | DateString): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const year = dateObj.getFullYear();
  
  // Fixed holidays (MM-DD format)
  const fixedHolidays = [
    '01-01', // Nytårsdag
    '06-05', // Grundlovsdag
    '12-24', // Juleaftensdag
    '12-25', // 1. juledag
    '12-26', // 2. juledag
    '12-31', // Nytårsaftensdag
  ];
  
  const dateStr = `${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
  
  if (fixedHolidays.includes(dateStr)) {
    return true;
  }
  
  // Easter-based holidays (complex calculation - simplified version)
  // In production, use a proper Easter calculation library
  const easterDates = getEasterDates(year);
  const currentDate = dateObj.getTime();
  
  return easterDates.some(easterDate => easterDate.getTime() === currentDate);
};

/**
 * Calculate Easter-based Danish holidays for a given year
 * @param year Year to calculate for
 * @returns Array of Date objects for Easter-based holidays
 */
function getEasterDates(year: number): Date[] {
  // Simplified Easter calculation (use proper library in production)
  // This is a basic approximation
  const easter = new Date(year, 3, 20); // Approximation
  
  return [
    new Date(easter.getTime() - 7 * 24 * 60 * 60 * 1000), // Palmesøndag
    new Date(easter.getTime() - 3 * 24 * 60 * 60 * 1000), // Skærtorsdag
    new Date(easter.getTime() - 2 * 24 * 60 * 60 * 1000), // Langfredag
    easter, // Påskedag
    new Date(easter.getTime() + 1 * 24 * 60 * 60 * 1000), // 2. påskedag
    new Date(easter.getTime() + 26 * 24 * 60 * 60 * 1000), // Store bededag
    new Date(easter.getTime() + 39 * 24 * 60 * 60 * 1000), // Kristi himmelfartsdag
    new Date(easter.getTime() + 49 * 24 * 60 * 60 * 1000), // Pinsedag
    new Date(easter.getTime() + 50 * 24 * 60 * 60 * 1000), // 2. pinsedag
  ];
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate Danish CVR number
 * @param cvr CVR number string
 * @returns Boolean indicating if CVR is valid
 */
export const validateDanishCVR = (cvr: string): boolean => {
  // Remove spaces and check format
  const cleanCVR = cvr.replace(/\s/g, '');
  
  if (!/^\d{8}$/.test(cleanCVR)) {
    return false;
  }
  
  // Checksum validation (simplified)
  const weights = [2, 7, 6, 1, 2, 7, 6, 1];
  let sum = 0;
  
  for (let i = 0; i < 8; i++) {
    sum += parseInt(cleanCVR[i]) * weights[i];
  }
  
  return sum % 11 === 0;
};

/**
 * Validate Danish phone number
 * @param phone Phone number string
 * @returns Boolean indicating if phone number is valid
 */
export const validateDanishPhone = (phone: string): boolean => {
  // Remove spaces and special characters
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Check format: 8 digits or +45 followed by 8 digits
  return /^(\+45)?\d{8}$/.test(cleanPhone);
};

/**
 * Format Danish phone number for display
 * @param phone Raw phone number
 * @returns Formatted phone number like "+45 12 34 56 78"
 */
export const formatDanishPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  if (cleanPhone.startsWith('+45')) {
    const number = cleanPhone.substring(3);
    return `+45 ${number.substring(0, 2)} ${number.substring(2, 4)} ${number.substring(4, 6)} ${number.substring(6, 8)}`;
  } else if (cleanPhone.length === 8) {
    return `+45 ${cleanPhone.substring(0, 2)} ${cleanPhone.substring(2, 4)} ${cleanPhone.substring(4, 6)} ${cleanPhone.substring(6, 8)}`;
  }
  
  return phone; // Return original if invalid format
};

// ============================================================================
// BUSINESS LOGIC UTILITIES
// ============================================================================

/**
 * Calculate Danish MOMS (VAT) from amount
 * @param netAmount Net amount in øre
 * @param vatRate VAT rate as percentage (default 25%)
 * @returns VAT amount in øre
 */
export const calculateDanishMOMS = (
  netAmount: CurrencyAmount,
  vatRate: number = 25
): CurrencyAmount => {
  return Math.round(netAmount * (vatRate / 100));
};

/**
 * Calculate net amount from gross amount including MOMS
 * @param grossAmount Gross amount in øre
 * @param vatRate VAT rate as percentage (default 25%)
 * @returns Net amount in øre
 */
export const calculateNetFromGross = (
  grossAmount: CurrencyAmount,
  vatRate: number = 25
): CurrencyAmount => {
  return Math.round(grossAmount / (1 + vatRate / 100));
};

/**
 * Calculate profit margin percentage
 * @param revenue Revenue in øre
 * @param cost Cost in øre
 * @returns Margin percentage (0-100)
 */
export const calculateMarginPercentage = (
  revenue: CurrencyAmount,
  cost: CurrencyAmount
): number => {
  if (revenue === 0) return 0;
  return Math.round(((revenue - cost) / revenue) * 100 * 100) / 100; // Round to 2 decimals
};

/**
 * Calculate working hours between two times
 * @param startTime Time in HH:mm format
 * @param endTime Time in HH:mm format
 * @returns Hours worked as decimal
 */
export const calculateWorkingHours = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  let endMinutes = endHour * 60 + endMin;
  
  // Handle overnight shifts
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }
  
  return (endMinutes - startMinutes) / 60;
};

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Capitalize first letter of each word (Danish-aware)
 * @param str String to capitalize
 * @returns Capitalized string
 */
export const capitalizeDanish = (str: string): string => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Generate a slug from Danish text
 * @param text Text to slugify
 * @returns URL-safe slug
 */
export const createDanishSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[æåä]/g, 'a')
    .replace(/[øö]/g, 'o')
    .replace(/[é]/g, 'e')
    .replace(/[ü]/g, 'u')
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
};

/**
 * Truncate text with Danish-aware ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @returns Truncated text with "..."
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Sort array of objects by Danish collation
 * @param array Array to sort
 * @param key Key to sort by
 * @param order Sort order
 * @returns Sorted array
 */
export const sortByDanish = <T>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  const collator = new Intl.Collator('da-DK', {
    sensitivity: 'base',
    numeric: true,
  });
  
  return [...array].sort((a, b) => {
    const valueA = String(a[key]);
    const valueB = String(b[key]);
    
    const result = collator.compare(valueA, valueB);
    return order === 'desc' ? -result : result;
  });
};

/**
 * Group array by key with Danish sorting
 * @param array Array to group
 * @param keyFn Function to get grouping key
 * @returns Grouped object
 */
export const groupByDanish = <T>(
  array: T[],
  keyFn: (item: T) => string
): Record<string, T[]> => {
  const groups: Record<string, T[]> = {};
  
  for (const item of array) {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  }
  
  // Sort group keys in Danish collation
  const sortedGroups: Record<string, T[]> = {};
  const sortedKeys = Object.keys(groups).sort((a, b) => 
    new Intl.Collator('da-DK').compare(a, b)
  );
  
  for (const key of sortedKeys) {
    sortedGroups[key] = groups[key];
  }
  
  return sortedGroups;
};

// ============================================================================
// CONSTANTS
// ============================================================================

export const DANISH_CONSTANTS = {
  CURRENCY: {
    CODE: 'DKK',
    SYMBOL: 'kr',
    MINOR_UNIT: 'øre',
    DECIMALS: 2,
  },
  LOCALE: {
    CODE: 'da-DK',
    LANGUAGE: 'da',
    COUNTRY: 'DK',
  },
  TIMEZONE: {
    NAME: 'Europe/Copenhagen',
    OFFSET_WINTER: '+01:00',
    OFFSET_SUMMER: '+02:00',
  },
  BUSINESS: {
    STANDARD_VAT_RATE: 25,
    CVR_LENGTH: 8,
    PHONE_LENGTH: 8,
    POSTAL_CODE_LENGTH: 4,
  },
  LABOR: {
    MAX_WEEKLY_HOURS: 48,
    MAX_DAILY_HOURS: 10,
    MIN_DAILY_REST: 11,
    OVERTIME_MULTIPLIER: 1.5,
  },
} as const;

export default {
  // Currency
  oreToKroner,
  kronerToOre,
  formatDanishCurrency,
  parseDanishCurrency,
  
  // Date/Time
  getDanishNow,
  getDanishToday,
  formatDanishDate,
  formatDanishDateTime,
  getDanishWeekday,
  isDanishHoliday,
  
  // Validation
  validateDanishCVR,
  validateDanishPhone,
  formatDanishPhone,
  
  // Business Logic
  calculateDanishMOMS,
  calculateNetFromGross,
  calculateMarginPercentage,
  calculateWorkingHours,
  
  // String Utilities
  capitalizeDanish,
  createDanishSlug,
  truncateText,
  
  // Array Utilities
  sortByDanish,
  groupByDanish,
  
  // Constants
  DANISH_CONSTANTS,
};
