import { google, calendar_v3 } from "googleapis";
import { nanoid } from "nanoid";
import { googleConfig, isLiveMode } from "../config";
import { logger } from "../logger";
import { getGoogleAuthClient } from "./googleAuth";
import { prisma } from "./databaseService";
import { updateCustomerStats } from "./customerService";
import { cache, CacheKeys, CacheTTL } from "./cacheService";
import { withTimeCheck } from "./dateTimeService";

const calendarScopes = ["https://www.googleapis.com/auth/calendar"];

export interface CalendarEventInput {
    summary: string;
    description: string;
    start: calendar_v3.Schema$EventDateTime;
    end: calendar_v3.Schema$EventDateTime;
    attendees?: calendar_v3.Schema$EventAttendee[];
    location?: string;
    calendarId?: string;
}

export interface CalendarActionResult {
    id: string;
    start: string;
    end: string;
    htmlLink?: string;
    dryRun: boolean;
}

export interface CalendarListOptions {
    calendarId?: string;
    maxResults?: number;
    timeMin?: string;
    timeMax?: string;
    query?: string;
}

export interface CalendarEventSummary {
    id: string;
    summary?: string | null;
    start: string;
    end: string;
    location?: string | null;
    attendees?: calendar_v3.Schema$EventAttendee[];
    htmlLink?: string | undefined;
}

export interface RescheduleSuggestion {
    start: string;
    end: string;
    dryRun: boolean;
    busySlots: calendar_v3.Schema$TimePeriod[];
}

function createCalendarClient(): calendar_v3.Calendar | null {
    const auth = getGoogleAuthClient(calendarScopes);
    if (!auth) {
        return null;
    }
    return google.calendar({ version: "v3", auth });
}

export async function findAvailability(
    calendarId: string,
    timeMin: string,
    timeMax: string
): Promise<calendar_v3.Schema$TimePeriod[]> {
    // Check cache first
    const cacheKey = CacheKeys.availability(calendarId, timeMin, timeMax);
    const cached = cache.get<calendar_v3.Schema$TimePeriod[]>(cacheKey);
    if (cached) {
        return cached;
    }

    const calendar = createCalendarClient();
    if (!calendar) {
        logger.debug({ calendarId, timeMin, timeMax }, "Skipping availability lookup (dry-run)");
        return [];
    }

    const response = await calendar.freebusy.query({
        requestBody: {
            timeMin,
            timeMax,
            items: [{ id: calendarId }],
        },
    });

    const busySlots = response.data.calendars?.[calendarId]?.busy ?? [];

    // Cache the result
    cache.set(cacheKey, busySlots, CacheTTL.availability);

    return busySlots;
}

export async function createCalendarEvent(
    input: CalendarEventInput
): Promise<CalendarActionResult> {
    const calendar = createCalendarClient();
    const calendarId = input.calendarId ?? "primary";

    if (!calendar || !isLiveMode) {
        const fakeId = nanoid();
        logger.info({ input, fakeId }, "Created calendar event (dry-run)");
        return {
            id: fakeId,
            start: input.start.dateTime ?? input.start.date ?? "",
            end: input.end.dateTime ?? input.end.date ?? "",
            dryRun: true,
        };
    }

    const { data } = await calendar.events.insert({
        calendarId,
        requestBody: {
            summary: input.summary,
            description: input.description,
            start: input.start,
            end: input.end,
            attendees: input.attendees,
            location: input.location,
            source: {
                title: googleConfig.ORGANISATION_NAME,
                url: "https://rendetalje.dk",
            },
        },
    });

    logger.info({ eventId: data.id }, "Calendar event created");

    // Invalidate relevant caches
    cache.invalidatePattern(`^calendar:(list|availability|nextslot):${calendarId}`);

    return {
        id: data.id ?? nanoid(),
        start: data.start?.dateTime ?? data.start?.date ?? "",
        end: data.end?.dateTime ?? data.end?.date ?? "",
        htmlLink: data.htmlLink ?? undefined,
        dryRun: false,
    };
}

/**
 * Update an existing calendar event
 */
export async function updateCalendarEvent(
    eventId: string,
    input: Partial<CalendarEventInput> & { calendarId?: string }
): Promise<CalendarActionResult> {
    const calendar = createCalendarClient();
    const calendarId = input.calendarId ?? "primary";

    if (!calendar || !isLiveMode) {
        logger.info({ eventId, input }, "Updated calendar event (dry-run)");
        return {
            id: eventId,
            start: input.start?.dateTime ?? input.start?.date ?? "",
            end: input.end?.dateTime ?? input.end?.date ?? "",
            dryRun: true,
        };
    }

    const { data } = await calendar.events.patch({
        calendarId,
        eventId,
        requestBody: {
            ...(input.summary && { summary: input.summary }),
            ...(input.description && { description: input.description }),
            ...(input.start && { start: input.start }),
            ...(input.end && { end: input.end }),
            ...(input.attendees && { attendees: input.attendees }),
            ...(input.location !== undefined && { location: input.location }),
        },
    });

    logger.info({ eventId }, "Calendar event updated");

    // Invalidate relevant caches
    cache.invalidatePattern(`^calendar:(list|availability|nextslot):${calendarId}`);

    return {
        id: data.id ?? eventId,
        start: data.start?.dateTime ?? data.start?.date ?? "",
        end: data.end?.dateTime ?? data.end?.date ?? "",
        htmlLink: data.htmlLink ?? undefined,
        dryRun: false,
    };
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(
    eventId: string,
    calendarId: string = "primary"
): Promise<boolean> {
    const calendar = createCalendarClient();

    if (!calendar || !isLiveMode) {
        logger.info({ eventId, calendarId }, "Deleted calendar event (dry-run)");
        return true;
    }

    try {
        await calendar.events.delete({
            calendarId,
            eventId,
        });

        logger.info({ eventId, calendarId }, "Calendar event deleted");

        // Invalidate relevant caches
        cache.invalidatePattern(`^calendar:(list|availability|nextslot):${calendarId}`);

        return true;
    } catch (error) {
        logger.error({ error, eventId, calendarId }, "Failed to delete calendar event");
        return false;
    }
}

export async function listUpcomingEvents(
    options: CalendarListOptions = {}
): Promise<CalendarEventSummary[]> {
    const calendarId = options.calendarId ?? "primary";
    const timeMin = options.timeMin ?? new Date().toISOString();
    const validMaxResults = options.maxResults && !isNaN(options.maxResults) && options.maxResults > 0
        ? options.maxResults
        : 5;

    // Check cache first
    const cacheKey = CacheKeys.eventList(calendarId, timeMin, options.timeMax);
    const cached = cache.get<CalendarEventSummary[]>(cacheKey);
    if (cached) {
        return cached;
    }

    const calendar = createCalendarClient();
    if (!calendar) {
        logger.debug({ options }, "Skipping calendar event fetch (dry-run)");
        return [];
    }

    const { data } = await calendar.events.list({
        calendarId,
        maxResults: validMaxResults,
        timeMin,
        timeMax: options.timeMax,
        q: options.query,
        singleEvents: true,
        orderBy: "startTime",
    });

    const events = data.items ?? [];

    const results = events.map((event) => ({
        id: event.id ?? "",
        summary: event.summary ?? null,
        start: event.start?.dateTime ?? event.start?.date ?? "",
        end: event.end?.dateTime ?? event.end?.date ?? "",
        attendees: event.attendees,
        htmlLink: event.htmlLink ?? undefined,
        location: event.location,
    } satisfies CalendarEventSummary)).filter((event) => event.start !== "" && event.end !== "");

    // Cache the results
    cache.set(cacheKey, results, CacheTTL.eventList);

    return results;
}

export async function suggestRescheduleSlot(
    calendarId: string,
    windowStart: string,
    windowEnd: string,
    durationMinutes: number
): Promise<RescheduleSuggestion | null> {
    const busySlots = await findAvailability(calendarId, windowStart, windowEnd);

    const windowStartDate = new Date(windowStart);
    const windowEndDate = new Date(windowEnd);
    const durationMs = durationMinutes * 60 * 1000;

    if (Number.isNaN(windowStartDate.getTime()) || Number.isNaN(windowEndDate.getTime())) {
        throw new Error("Invalid window provided for reschedule suggestion");
    }

    // ✅ FIX: Start from business hours (08:00) not current time
    let candidate = new Date(windowStartDate);

    // If before 8 AM, move to 8 AM same day
    if (candidate.getHours() < 8) {
        candidate.setHours(8, 0, 0, 0);
    }
    // If after 5 PM, move to 8 AM next day
    else if (candidate.getHours() >= 17) {
        candidate.setDate(candidate.getDate() + 1);
        candidate.setHours(8, 0, 0, 0);
    }

    const normalizedBusy = (busySlots || [])
        .map((slot) => ({
            start: slot.start ? new Date(slot.start) : null,
            end: slot.end ? new Date(slot.end) : null,
        }))
        .filter((slot): slot is { start: Date; end: Date } => Boolean(slot.start && slot.end))
        .sort((a, b) => a.start.getTime() - b.start.getTime());

    for (const slot of normalizedBusy) {
        if (candidate.getTime() + durationMs <= slot.start.getTime()) {
            break;
        }

        if (candidate.getTime() < slot.end.getTime()) {
            candidate = new Date(slot.end);

            // ✅ FIX: After moving past busy slot, ensure we're still in business hours
            if (candidate.getHours() >= 17) {
                // Move to next day 8 AM
                candidate.setDate(candidate.getDate() + 1);
                candidate.setHours(8, 0, 0, 0);
            } else if (candidate.getHours() < 8) {
                // Move to 8 AM same day
                candidate.setHours(8, 0, 0, 0);
            }
        }

        if (candidate.getTime() >= windowEndDate.getTime()) {
            return null;
        }
    }

    if (candidate.getTime() + durationMs > windowEndDate.getTime()) {
        return null;
    }

    // ✅ FIX: Final check - ensure suggested slot ends before 5 PM
    const potentialEnd = new Date(candidate.getTime() + durationMs);
    if (potentialEnd.getHours() >= 17) {
        // Slot would end after 5 PM, move to next day
        candidate.setDate(candidate.getDate() + 1);
        candidate.setHours(8, 0, 0, 0);

        // Re-check if still within search window
        if (candidate.getTime() >= windowEndDate.getTime()) {
            return null;
        }
    }

    const suggestionStart = candidate.toISOString();
    const suggestionEnd = new Date(candidate.getTime() + durationMs).toISOString();

    return {
        start: suggestionStart,
        end: suggestionEnd,
        dryRun: !isLiveMode,
        busySlots,
    };
}

/**
 * Check if a specific time slot is available
 */
export async function isTimeSlotAvailable(
    calendarId: string,
    requestedStart: string,
    requestedEnd: string
): Promise<{ available: boolean; conflicts: Array<{ start: string; end: string }> }> {
    logger.debug(
        { calendarId, requestedStart, requestedEnd },
        "Checking time slot availability"
    );

    const busySlots = await findAvailability(calendarId, requestedStart, requestedEnd);

    const requestedStartDate = new Date(requestedStart);
    const requestedEndDate = new Date(requestedEnd);

    if (Number.isNaN(requestedStartDate.getTime()) || Number.isNaN(requestedEndDate.getTime())) {
        throw new Error("Invalid time slot provided for availability check");
    }

    // Guard against null/undefined busySlots
    const safeBusySlots = busySlots ?? [];

    const conflicts = safeBusySlots
        .filter((slot) => {
            if (!slot.start || !slot.end) return false;

            const busyStart = new Date(slot.start);
            const busyEnd = new Date(slot.end);

            // Check for overlap: slot overlaps if it starts before requested end AND ends after requested start
            return busyStart.getTime() < requestedEndDate.getTime() &&
                busyEnd.getTime() > requestedStartDate.getTime();
        })
        .map((slot) => ({
            start: slot.start,
            end: slot.end,
        }));

    const available = conflicts.length === 0;

    logger.info(
        { available, conflictsCount: conflicts.length },
        "Time slot availability checked"
    );

    return { available, conflicts };
}

/**
 * Find next available time slot (starting from given date)
 * 
 * KRITISK fra MEMORY_9, MEMORY_10:
 * MUST verify current time before searching for available slots
 */
export async function findNextAvailableSlot(
    calendarId: string,
    durationMinutes: number,
    searchStartDate: Date = new Date(),
    maxDaysToSearch: number = 14
): Promise<{ start: string; end: string } | null> {
    // 🕐 MANDATORY TIME CHECK before ANY date calculations
    return withTimeCheck(async (currentTime) => {
        logger.debug(
            {
                calendarId,
                durationMinutes,
                searchStartDate,
                maxDaysToSearch,
                verifiedCurrentTime: currentTime.date
            },
            "🕐 Finding next available time slot with verified current time"
        );

        const searchStart = searchStartDate.toISOString();
        const searchEnd = new Date(searchStartDate.getTime() + maxDaysToSearch * 24 * 60 * 60 * 1000).toISOString();

        const suggestion = await suggestRescheduleSlot(
            calendarId,
            searchStart,
            searchEnd,
            durationMinutes
        );

        if (!suggestion) {
            logger.warn(
                { calendarId, durationMinutes, maxDaysToSearch },
                "No available slot found in search window"
            );
            return null;
        }

        logger.info(
            { start: suggestion.start, end: suggestion.end },
            "Next available slot found"
        );

        return {
            start: suggestion.start,
            end: suggestion.end,
        };
    }, "findNextAvailableSlot");
}

// ============================================================================
// DATABASE PERSISTENCE FUNCTIONS
// ============================================================================

export interface CreateBookingInput {
    leadId: string;
    quoteId?: string;
    startTime: Date;
    endTime: Date;
    status?: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled";
    notes?: string;
    googleEventId?: string;
}

export interface UpdateBookingInput {
    startTime?: Date;
    endTime?: Date;
    status?: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled";
    notes?: string;
    googleEventId?: string;
}

export interface BookingRecord {
    id: string;
    leadId: string | null;
    quoteId: string | null;
    startTime: Date | null;
    endTime: Date | null;
    status: string;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateBookingWithCalendarInput {
    leadId: string;
    quoteId?: string;
    summary: string;
    description: string;
    startTime: Date;
    endTime: Date;
    attendees?: calendar_v3.Schema$EventAttendee[];
    location?: string;
    calendarId?: string;
    notes?: string;
}

export interface BookingWithCalendarResult {
    booking: BookingRecord;
    calendarEvent: CalendarActionResult;
}

/**
 * Create both a Google Calendar event AND a database booking record
 * This is the recommended high-level function for creating bookings
 */
export async function createBookingWithCalendar(
    input: CreateBookingWithCalendarInput
): Promise<BookingWithCalendarResult> {
    try {
        // Step 1: Create Google Calendar event
        const calendarEvent = await createCalendarEvent({
            summary: input.summary,
            description: input.description,
            start: {
                dateTime: input.startTime.toISOString(),
                timeZone: "Europe/Copenhagen",
            },
            end: {
                dateTime: input.endTime.toISOString(),
                timeZone: "Europe/Copenhagen",
            },
            attendees: input.attendees,
            location: input.location,
            calendarId: input.calendarId,
        });

        // Step 2: Create database booking record
        const booking = await createBookingRecord({
            leadId: input.leadId,
            quoteId: input.quoteId,
            startTime: input.startTime,
            endTime: input.endTime,
            status: "scheduled",
            notes: input.notes
                ? `${input.notes}\n\nGoogle Calendar Event ID: ${calendarEvent.id}`
                : `Google Calendar Event ID: ${calendarEvent.id}`,
        });

        logger.info(
            {
                bookingId: booking.id,
                calendarEventId: calendarEvent.id,
                leadId: input.leadId,
            },
            "Booking created with calendar event and database record"
        );

        return { booking, calendarEvent };
    } catch (error) {
        logger.error(
            { error, input },
            "Failed to create booking with calendar event"
        );
        throw error;
    }
}

/**
 * Create a new booking record in the database
 */
export async function createBookingRecord(
    input: CreateBookingInput
): Promise<BookingRecord> {
    try {
        const booking = await prisma.booking.create({
            data: {
                leadId: input.leadId,
                quoteId: input.quoteId ?? null,
                startTime: input.startTime,
                endTime: input.endTime,
                status: input.status ?? "scheduled",
                notes: input.notes ?? null,
            },
        });

        // Update customer statistics
        const lead = await prisma.lead.findUnique({
            where: { id: input.leadId },
            select: { customerId: true },
        });
        if (lead?.customerId) {
            await updateCustomerStats(lead.customerId);
            logger.debug(
                { customerId: lead.customerId, bookingId: booking.id },
                "Updated customer stats after booking creation"
            );
        }

        logger.info(
            { bookingId: booking.id, leadId: input.leadId, startTime: input.startTime },
            "Booking record created in database"
        );

        return booking;
    } catch (error) {
        logger.error(
            { error, input },
            "Failed to create booking record in database"
        );
        throw error;
    }
}

/**
 * Update an existing booking record
 */
export async function updateBookingStatus(
    bookingId: string,
    input: UpdateBookingInput
): Promise<BookingRecord> {
    try {
        const booking = await prisma.booking.update({
            where: { id: bookingId },
            data: {
                ...(input.startTime && { startTime: input.startTime }),
                ...(input.endTime && { endTime: input.endTime }),
                ...(input.status && { status: input.status }),
                ...(input.notes !== undefined && { notes: input.notes }),
            },
        });

        logger.info(
            { bookingId, updates: input },
            "Booking record updated in database"
        );

        return booking;
    } catch (error) {
        logger.error(
            { error, bookingId, input },
            "Failed to update booking record in database"
        );
        throw error;
    }
}

/**
 * Query bookings with filters
 */
export async function queryBookings(filters: {
    leadId?: string;
    status?: string;
    startAfter?: Date;
    startBefore?: Date;
}): Promise<BookingRecord[]> {
    try {
        const bookings = await prisma.booking.findMany({
            where: {
                ...(filters.leadId && { leadId: filters.leadId }),
                ...(filters.status && { status: filters.status }),
                ...(filters.startAfter && { startTime: { gte: filters.startAfter } }),
                ...(filters.startBefore && { startTime: { lte: filters.startBefore } }),
            },
            orderBy: {
                startTime: "asc",
            },
        });

        logger.debug(
            { filters, count: bookings.length },
            "Bookings queried from database"
        );

        return bookings;
    } catch (error) {
        logger.error(
            { error, filters },
            "Failed to query bookings from database"
        );
        throw error;
    }
}

/**
 * Get a single booking by ID
 */
export async function getBookingById(bookingId: string): Promise<BookingRecord | null> {
    try {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
        });

        return booking;
    } catch (error) {
        logger.error(
            { error, bookingId },
            "Failed to get booking from database"
        );
        throw error;
    }
}

/**
 * Delete a booking record
 */
export async function deleteBooking(bookingId: string): Promise<boolean> {
    try {
        await prisma.booking.delete({
            where: { id: bookingId },
        });

        logger.info(
            { bookingId },
            "Booking record deleted from database"
        );

        return true;
    } catch (error) {
        logger.error(
            { error, bookingId },
            "Failed to delete booking from database"
        );
        return false;
    }
}
