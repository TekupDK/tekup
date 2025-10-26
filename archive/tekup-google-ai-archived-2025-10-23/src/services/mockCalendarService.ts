import { logger } from "../logger";

/**
 * Mock Calendar Service for Testing
 * Provides mock calendar functionality when Google Calendar API is not available
 */

export interface MockTimeSlot {
  start: Date;
  end: Date;
  startISO: string;
  endISO: string;
  duration: number;
  dayOfWeek: string;
  preferredTime: boolean;
}

export interface MockAvailabilityOptions {
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
 * Mock implementation of findAvailability
 * Generates realistic available slots for testing
 */
export function findAvailability(options: MockAvailabilityOptions): Promise<MockTimeSlot[]> {
  logger.info("Using mock calendar service for testing");
  
  const {
    startDate = new Date(),
    durationMinutes,
    numberOfSlots = 5,
    maxDaysToSearch = 14,
    includeWeekends = false,
    bufferMinutes: _bufferMinutes = 60
  } = options;

  const slots: MockTimeSlot[] = [];
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  const endSearchDate = new Date(currentDate);
  endSearchDate.setDate(endSearchDate.getDate() + maxDaysToSearch);

  // Generate mock available slots
  while (slots.length < numberOfSlots && currentDate < endSearchDate) {
    const dayOfWeek = currentDate.getDay();
    
    // Skip Sundays unless explicitly included
    if (dayOfWeek === 0 && !includeWeekends) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // Skip past dates
    if (currentDate < new Date()) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // Generate slots for this day
    const daySlots = generateDaySlots(currentDate, durationMinutes, _bufferMinutes);
    slots.push(...daySlots);

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Sort by preferred times first, then chronologically
  slots.sort((a, b) => {
    if (a.preferredTime && !b.preferredTime) return -1;
    if (!a.preferredTime && b.preferredTime) return 1;
    return a.start.getTime() - b.start.getTime();
  });

  return Promise.resolve(slots.slice(0, numberOfSlots));
}

function generateDaySlots(date: Date, durationMinutes: number, _bufferMinutes: number): MockTimeSlot[] {
  const dayOfWeek = date.getDay();
  const slots: MockTimeSlot[] = [];
  
  // Get working hours for this day
  const workingHours = dayOfWeek === 6 ? WORKING_HOURS.saturday : WORKING_HOURS.weekday;
  
  // Generate slots for preferred hours
  for (const hour of PREFERRED_START_HOURS) {
    if (hour < workingHours.start || hour >= workingHours.end) continue;
    
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);
    
    // Skip if slot would go beyond working hours
    if (slotEnd.getHours() > workingHours.end) continue;
    
    // Skip if slot is in the past
    if (slotStart < new Date()) continue;
    
    const dayName = DAY_NAMES[dayOfWeek];
    const isPreferred = PREFERRED_START_HOURS.includes(hour);
    
    slots.push({
      start: slotStart,
      end: slotEnd,
      startISO: slotStart.toISOString(),
      endISO: slotEnd.toISOString(),
      duration: durationMinutes,
      dayOfWeek: dayName,
      preferredTime: isPreferred
    });
  }
  
  return slots;
}

/**
 * Mock implementation of checkConflict
 * Always returns false (no conflicts) for testing
 */
export function checkConflict(
  _startTime: Date,
  _endTime: Date,
  _calendarId?: string
): Promise<boolean> {
  logger.info("Mock calendar service - no conflicts detected");
  return Promise.resolve(false);
}

/**
 * Mock implementation of createEvent
 * Logs the event creation for testing
 */
export function createEvent(
  title: string,
  startTime: Date,
  endTime: Date,
  description?: string,
  _calendarId?: string
): Promise<{ id: string; htmlLink: string }> {
  logger.info({
    title,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    description
  }, "Mock calendar service - event creation logged");
  
  return Promise.resolve({
    id: `mock-event-${Date.now()}`,
    htmlLink: `https://calendar.google.com/event?eid=mock-event-${Date.now()}`
  });
}