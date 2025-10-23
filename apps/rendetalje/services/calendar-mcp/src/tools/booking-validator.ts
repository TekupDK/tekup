/**
 * RenOS Calendar Intelligence MCP - Booking Validator Tool
 * Tool 1: validate_booking_date
 * Tool 2: check_booking_conflicts
 */

import { z } from 'zod';
import { logger } from '../utils/logger.js';
import {
  ValidateBookingDateSchema,
  CheckBookingConflictsSchema,
  BookingValidationResult,
} from '../types.js';
import { validateDateWeekdayMatch, validateWeekendBooking } from '../validators/date-validator.js';
import { applyFailSafe, generateSuggestion } from '../validators/fail-safe.js';
import { checkConflicts } from '../integrations/google-calendar.js';
import { getCustomerIntelligence } from '../integrations/supabase.js';
import config from '../config.js';

/**
 * Tool 1: Validate Booking Date
 * Stops all "28. oktober er mandag" fejl (det er tirsdag!)
 */
export async function validateBookingDate(
  input: z.infer<typeof ValidateBookingDateSchema>
): Promise<BookingValidationResult> {
  logger.info('Validating booking date', input);

  const warnings = [];
  const errors = [];
  let hasCustomerHistory = false;
  let hasLearnedPattern = false;

  // Step 1: Validate date/weekday match
  if (input.expectedDayName) {
    const dateCheck = validateDateWeekdayMatch(input.date, input.expectedDayName);
    if (!dateCheck.valid) {
      errors.push(...dateCheck.errors);
    }
  }

  // Step 2: Check weekend booking
  const weekendCheck = validateWeekendBooking(
    input.date,
    config.business.weekendBookingsEnabled
  );
  
  if (!weekendCheck.valid) {
    errors.push(...weekendCheck.errors);
  }
  warnings.push(...weekendCheck.warnings);

  // Step 3: Check customer fixed schedule pattern
  if (input.customerId) {
    try {
      const intelligence = await getCustomerIntelligence(input.customerId);
      
      if (intelligence) {
        hasCustomerHistory = true;

        // Check fixed schedule
        if (intelligence.fixedSchedule) {
          hasLearnedPattern = true;
          const bookingDate = new Date(input.date);
          const bookingDayOfWeek = bookingDate.getDay();

          if (bookingDayOfWeek !== intelligence.fixedSchedule.dayOfWeek) {
            warnings.push({
              type: 'pattern_violation' as const,
              message: `Afviger fra kundens faste mønster: ${intelligence.customerName} booker normalt om ${['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'][intelligence.fixedSchedule.dayOfWeek]}`,
              severity: 'medium' as const,
              data: {
                customerId: input.customerId,
                customerName: intelligence.customerName,
                fixedDayOfWeek: intelligence.fixedSchedule.dayOfWeek,
                bookingDayOfWeek,
                confidence: intelligence.fixedSchedule.confidence,
              },
            });
          }
        }

        // Check preferred days
        if (intelligence.preferences.preferredDays && intelligence.preferences.preferredDays.length > 0) {
          const bookingDayOfWeek = new Date(input.date).getDay();
          if (!intelligence.preferences.preferredDays.includes(bookingDayOfWeek)) {
            warnings.push({
              type: 'pattern_violation' as const,
              message: `${intelligence.customerName} foretrækker normalt andre ugedage`,
              severity: 'low' as const,
            });
          }
        }

        // Check avoid weekends preference
        if (intelligence.preferences.avoidWeekends) {
          const isWeekendBooking = new Date(input.date).getDay() === 0 || new Date(input.date).getDay() === 6;
          if (isWeekendBooking) {
            warnings.push({
              type: 'pattern_violation' as const,
              message: `${intelligence.customerName} undgår normalt weekend-bookinger`,
              severity: 'high' as const,
            });
          }
        }
      }
    } catch (error) {
      logger.warn('Could not fetch customer intelligence', { customerId: input.customerId });
    }
  }

  // Apply fail-safe checks
  const result = applyFailSafe(
    {
      valid: errors.length === 0,
      warnings,
      errors,
    },
    {
      hasCustomerHistory,
      hasLearnedPattern,
    }
  );

  // Generate suggestion
  result.suggestion = generateSuggestion(result);

  logger.info('Booking date validation complete', {
    valid: result.valid,
    confidence: result.confidence,
    requiresManualReview: result.requiresManualReview,
    errorCount: errors.length,
    warningCount: warnings.length,
  });

  return result;
}

/**
 * Tool 2: Check Booking Conflicts
 * 0 dobbeltbookinger garanteret
 */
export async function checkBookingConflicts(
  input: z.infer<typeof CheckBookingConflictsSchema>
): Promise<BookingValidationResult> {
  logger.info('Checking booking conflicts', input);

  const warnings = [];
  const errors = [];

  try {
    const conflictResult = await checkConflicts(
      input.startTime,
      input.endTime,
      input.excludeBookingId
    );

    if (conflictResult.hasConflict) {
      const conflictDetails = conflictResult.conflicts.map(c => 
        `${c.summary} (${c.start.dateTime})`
      ).join(', ');

      errors.push({
        type: 'double_booking' as const,
        message: `DOBBELTBOOKING DETEKTERET! Konflikter: ${conflictDetails}`,
        field: 'time',
        data: {
          conflicts: conflictResult.conflicts.map(c => ({
            id: c.id,
            summary: c.summary,
            start: c.start.dateTime,
            end: c.end.dateTime,
          })),
        },
      });

      logger.warn('Double booking detected!', {
        startTime: input.startTime,
        endTime: input.endTime,
        conflictCount: conflictResult.conflicts.length,
      });
    }
  } catch (error) {
    logger.error('Failed to check conflicts (calendar API error)', error);
    
    // If we can't check, we must require manual review for safety
    warnings.push({
      type: 'pattern_violation' as const,
      message: 'Kunne ikke verificere mod kalender - tjek manuelt for dobbeltbooking!',
      severity: 'high' as const,
    });
  }

  // Apply fail-safe
  const result = applyFailSafe({
    valid: errors.length === 0,
    warnings,
    errors,
  });

  result.suggestion = generateSuggestion(result);

  logger.info('Conflict check complete', {
    valid: result.valid,
    confidence: result.confidence,
    hasConflicts: errors.length > 0,
  });

  return result;
}

export default {
  validateBookingDate,
  checkBookingConflicts,
};

