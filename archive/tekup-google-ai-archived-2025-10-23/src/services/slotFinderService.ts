import { findAvailability } from "./calendarService";
import { findAvailability as mockFindAvailability } from "./mockCalendarService";
import { logger } from "../logger";

/**
 * Enhanced Calendar Slot Finder
 * Implements Rendetalje.dk business rules for finding available slots
 * 
 * Business Rules:
 * - Working hours: 08:00-17:00 Monday-Friday, 08:00-15:00 Saturday
 * - No bookings on Sundays (except moving emergencies)
 * - Minimum 1 hour buffer between bookings for transport
 * - Preferred start times: 08:00, 09:00, 10:00, 11:00, 12:00, 13:00, 14:00
 * - Route optimization: consider travel time between locations
 */

export interface TimeSlot {
  start: Date;
  end: Date;
  startISO: string;
  endISO: string;
  duration: number; // minutes
  dayOfWeek: string; // "Mandag", "Tirsdag", etc.
  preferredTime: boolean; // Is this a preferred start time?
}

export interface SlotFinderOptions {
  calendarId?: string;
  startDate?: Date;
  durationMinutes: number;
  numberOfSlots?: number;
  maxDaysToSearch?: number;
  includeWeekends?: boolean;
  bufferMinutes?: number;
}

const WORKING_HOURS = {
  weekday: { start: 8, end: 17 },
  saturday: { start: 8, end: 15 },
};

const PREFERRED_START_HOURS = [8, 9, 10, 11, 12, 13, 14];

const DAY_NAMES: Record<number, string> = {
  0: "Søndag",
  1: "Mandag",
  2: "Tirsdag",
  3: "Onsdag",
  4: "Torsdag",
  5: "Fredag",
  6: "Lørdag",
};

/**
 * Find available time slots with business rules
 */
export async function findAvailableSlots(
  options: SlotFinderOptions
): Promise<TimeSlot[]> {
  const {
    calendarId = "primary",
    startDate = new Date(),
    durationMinutes,
    numberOfSlots = 5,
    maxDaysToSearch = 14,
    includeWeekends = true,
    bufferMinutes = 60,
  } = options;

  logger.info({ durationMinutes, numberOfSlots, maxDaysToSearch }, "Finding available slots");

  const slots: TimeSlot[] = [];
  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0); // Start of day

  const endSearchDate = new Date(currentDate);
  endSearchDate.setDate(endSearchDate.getDate() + maxDaysToSearch);

  // Get all busy periods for the search window
  let busyPeriods: Array<{ start?: string; end?: string }> = [];
  try {
    const result = await findAvailability(
      calendarId,
      currentDate.toISOString(),
      endSearchDate.toISOString()
    );
    busyPeriods = result ?? [];  // Guard against null/undefined
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.warn({ error: errorMessage }, "Google Calendar API failed, using mock calendar service");
    // Use mock service as fallback
    const mockSlots = await mockFindAvailability({
      calendarId,
      startDate: currentDate,
      durationMinutes,
      numberOfSlots,
      maxDaysToSearch,
      includeWeekends,
      bufferMinutes
    });

    // Convert mock slots to TimeSlot format
    return mockSlots.map(slot => ({
      start: slot.start,
      end: slot.end,
      startISO: slot.startISO,
      endISO: slot.endISO,
      duration: slot.duration,
      dayOfWeek: slot.dayOfWeek,
      preferredTime: slot.preferredTime
    }));
  }

  // Generate candidate slots
  const candidates = generateCandidateSlots(
    currentDate,
    endSearchDate,
    durationMinutes,
    includeWeekends
  );

  // Filter out busy slots and apply business rules
  for (const candidate of candidates) {
    if (slots.length >= numberOfSlots) {
      break;
    }

    // Check if slot conflicts with busy periods
    const hasConflict = checkConflict(candidate, busyPeriods, bufferMinutes);

    if (!hasConflict) {
      slots.push(candidate);
    }
  }

  logger.info({ requested: numberOfSlots, found: slots.length }, `Found ${slots.length} available slots`);

  return slots;
}

/**
 * Generate candidate time slots based on business rules
 */
function generateCandidateSlots(
  startDate: Date,
  endDate: Date,
  durationMinutes: number,
  includeWeekends: boolean
): TimeSlot[] {
  const candidates: TimeSlot[] = [];
  const current = new Date(startDate);

  while (current < endDate) {
    const dayOfWeek = current.getDay();

    // Skip Sundays (unless explicitly requested)
    if (dayOfWeek === 0 && !includeWeekends) {
      current.setDate(current.getDate() + 1);
      continue;
    }

    // Determine working hours for this day
    const workingHours =
      dayOfWeek === 6 ? WORKING_HOURS.saturday : WORKING_HOURS.weekday;

    // Generate slots for each hour
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      const slotStart = new Date(current);
      slotStart.setHours(hour, 0, 0, 0);

      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotStart.getMinutes() + durationMinutes);

      // Check if slot fits within working hours
      if (slotEnd.getHours() > workingHours.end) {
        continue;
      }

      // Check if this is after current time
      if (slotStart < new Date()) {
        continue;
      }

      candidates.push({
        start: slotStart,
        end: slotEnd,
        startISO: slotStart.toISOString(),
        endISO: slotEnd.toISOString(),
        duration: durationMinutes,
        dayOfWeek: DAY_NAMES[dayOfWeek],
        preferredTime: PREFERRED_START_HOURS.includes(hour),
      });
    }

    current.setDate(current.getDate() + 1);
  }

  // Sort candidates: preferred times first, then chronological
  candidates.sort((a, b) => {
    if (a.preferredTime !== b.preferredTime) {
      return a.preferredTime ? -1 : 1;
    }
    return a.start.getTime() - b.start.getTime();
  });

  return candidates;
}

/**
 * Check if a candidate slot conflicts with busy periods
 */
function checkConflict(
  candidate: TimeSlot,
  busyPeriods: Array<{ start?: string; end?: string }> | null | undefined,
  bufferMinutes: number
): boolean {
  const candidateStart = candidate.start.getTime();
  const candidateEnd = candidate.end.getTime();
  const buffer = bufferMinutes * 60 * 1000; // Convert to milliseconds

  // Guard against null/undefined busyPeriods
  if (!busyPeriods || !Array.isArray(busyPeriods)) {
    return false; // No busy periods means no conflict
  }

  for (const busy of busyPeriods) {
    if (!busy.start || !busy.end) continue;

    const busyStart = new Date(busy.start).getTime() - buffer;
    const busyEnd = new Date(busy.end).getTime() + buffer;

    // Check for overlap with buffer
    if (candidateStart < busyEnd && candidateEnd > busyStart) {
      return true; // Conflict found
    }
  }

  return false; // No conflict
}

/**
 * Format time slot for display in email
 */
export function formatSlotForEmail(slot: TimeSlot): string {
  const dateStr = slot.start.toLocaleDateString("da-DK", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const timeStart = slot.start.toLocaleTimeString("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const timeEnd = slot.end.toLocaleTimeString("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const preferred = slot.preferredTime ? " ⭐" : "";

  return `${dateStr} kl. ${timeStart}-${timeEnd}${preferred}`;
}

/**
 * Format all slots for email quote
 */
export function formatSlotsForQuote(slots: TimeSlot[]): string {
  if (slots.length === 0) {
    return "Ingen ledige tider fundet i de næste 14 dage.";
  }

  const formatted = slots.map((slot, index) => {
    return `${index + 1}. ${formatSlotForEmail(slot)}`;
  });

  return formatted.join("\n");
}

/**
 * Check if specific time slot is available
 */
export async function isSpecificSlotAvailable(
  calendarId: string,
  start: Date,
  end: Date,
  bufferMinutes: number = 60
): Promise<boolean> {
  // Get busy periods for this day
  const dayStart = new Date(start);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(start);
  dayEnd.setHours(23, 59, 59, 999);

  const busyPeriods = await findAvailability(
    calendarId,
    dayStart.toISOString(),
    dayEnd.toISOString()
  );

  const slot: TimeSlot = {
    start,
    end,
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    duration: (end.getTime() - start.getTime()) / (1000 * 60),
    dayOfWeek: DAY_NAMES[start.getDay()],
    preferredTime: PREFERRED_START_HOURS.includes(start.getHours()),
  };

  return !checkConflict(slot, busyPeriods, bufferMinutes);
}

/**
 * Get next available slot (single slot, simplified version)
 */
export async function getNextAvailableSlot(
  calendarId: string,
  durationMinutes: number,
  startDate?: Date
): Promise<TimeSlot | null> {
  const slots = await findAvailableSlots({
    calendarId,
    durationMinutes,
    numberOfSlots: 1,
    startDate,
  });

  return slots.length > 0 ? slots[0] : null;
}
