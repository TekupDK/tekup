/**
 * RenOS Calendar Intelligence MCP - Date Validator
 * Stops "28. oktober er mandag" fejl (det er tirsdag!)
 */

import { format, parse, getDay } from 'date-fns';
import { da } from 'date-fns/locale';
import { logger } from '../utils/logger.js';
import { ValidationWarning, ValidationError } from '../types.js';

const DANISH_WEEKDAYS = [
  'søndag',
  'mandag',
  'tirsdag',
  'onsdag',
  'torsdag',
  'fredag',
  'lørdag',
];

/**
 * Validate that a date matches the expected weekday
 */
export function validateDateWeekdayMatch(
  dateString: string,
  expectedDayName?: string
): {
  valid: boolean;
  actualDayName: string;
  expectedDayName?: string;
  errors: ValidationError[];
} {
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return {
        valid: false,
        actualDayName: '',
        expectedDayName,
        errors: [{
          type: 'invalid_date',
          message: `Ugyldig dato: ${dateString}`,
          field: 'date',
        }],
      };
    }

    const dayIndex = getDay(date);
    const actualDayName = DANISH_WEEKDAYS[dayIndex]!;

    if (!expectedDayName) {
      // No expected day to validate against
      return {
        valid: true,
        actualDayName,
        errors: [],
      };
    }

    const normalizedExpected = expectedDayName.toLowerCase().trim();
    const matches = actualDayName === normalizedExpected;

    if (!matches) {
      const formattedDate = format(date, 'd. MMMM', { locale: da });
      
      return {
        valid: false,
        actualDayName,
        expectedDayName: normalizedExpected,
        errors: [{
          type: 'invalid_date' as const,
          message: `Fejl: ${formattedDate} er ${actualDayName}, ikke ${normalizedExpected}!`,
          field: 'date',
          data: {
            date: dateString,
            actualDay: actualDayName,
            expectedDay: normalizedExpected,
          },
        }],
      };
    }

    logger.debug('Date/weekday validation passed', {
      date: dateString,
      dayName: actualDayName,
    });

    return {
      valid: true,
      actualDayName,
      expectedDayName: normalizedExpected,
      errors: [],
    };
  } catch (error) {
    logger.error('Date validation error', error, { dateString, expectedDayName });
    
    return {
      valid: false,
      actualDayName: '',
      expectedDayName,
      errors: [{
        type: 'invalid_date',
        message: `Kunne ikke validere dato: ${dateString}`,
        field: 'date',
      }],
    };
  }
}

/**
 * Check if date is a weekend
 */
export function isWeekend(dateString: string): boolean {
  const date = new Date(dateString);
  const dayIndex = getDay(date);
  return dayIndex === 0 || dayIndex === 6; // Sunday or Saturday
}

/**
 * Validate weekend booking based on business rules
 */
export function validateWeekendBooking(
  dateString: string,
  weekendBookingsEnabled: boolean
): {
  valid: boolean;
  warnings: ValidationWarning[];
  errors: ValidationError[];
} {
  if (!isWeekend(dateString)) {
    return { valid: true, warnings: [], errors: [] };
  }

  const dayName = DANISH_WEEKDAYS[getDay(new Date(dateString))]!;
  const formattedDate = format(new Date(dateString), 'd. MMMM', { locale: da });

  if (!weekendBookingsEnabled) {
    return {
      valid: false,
      warnings: [],
      errors: [{
        type: 'weekend_blocked',
        message: `Weekend-booking blokeret: ${formattedDate} (${dayName}). I arbejder ikke i weekenden!`,
        field: 'date',
        data: {
          date: dateString,
          dayName,
        },
      }],
    };
  }

  return {
    valid: true,
    warnings: [{
      type: 'weekend_booking',
      message: `Weekend-booking: ${formattedDate} (${dayName}). Er dette korrekt?`,
      severity: 'high',
      data: {
        date: dateString,
        dayName,
      },
    }],
    errors: [],
  };
}

/**
 * Format date in Danish
 */
export function formatDateDanish(dateString: string): string {
  const date = new Date(dateString);
  return format(date, "EEEE 'd.' d. MMMM yyyy", { locale: da });
}

export default {
  validateDateWeekdayMatch,
  isWeekend,
  validateWeekendBooking,
  formatDateDanish,
  DANISH_WEEKDAYS,
};

