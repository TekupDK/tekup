import { google, calendar_v3 } from "googleapis";
import { getGoogleAuthClient } from "./googleAuth";
import { prisma } from "./databaseService";
import { updateCustomerStats } from "./customerService";
import { logger } from "../logger";
import { isLiveMode } from "../config";

/**
 * Calendar Synchronization Service
 * 
 * Provides 1:1 synchronization between Google Calendar and RenOS database
 * Ensures all calendar events are properly tracked and managed
 */

export interface CalendarSyncOptions {
    calendarId?: string;
    syncDirection?: "bidirectional" | "google_to_db" | "db_to_google";
    forceSync?: boolean;
    maxEvents?: number;
}

export interface SyncResult {
    success: boolean;
    eventsProcessed: number;
    eventsCreated: number;
    eventsUpdated: number;
    eventsDeleted: number;
    errors: string[];
    lastSyncTime: Date;
}

class CalendarSyncService {
    private calendar: calendar_v3.Calendar | null = null;

    constructor() {
        this.initializeCalendar();
    }

    private initializeCalendar(): void {
        const auth = getGoogleAuthClient(["https://www.googleapis.com/auth/calendar"]);
        if (auth) {
            this.calendar = google.calendar({ version: "v3", auth });
        }
    }

    /**
     * Perform full calendar synchronization
     */
    async syncCalendar(options: CalendarSyncOptions = {}): Promise<SyncResult> {
        const {
            calendarId = "primary",
            syncDirection = "bidirectional",
            forceSync = false,
            maxEvents = 1000
        } = options;

        logger.info(
            { calendarId, syncDirection, forceSync, maxEvents },
            "Starting calendar synchronization"
        );

        const result: SyncResult = {
            success: true,
            eventsProcessed: 0,
            eventsCreated: 0,
            eventsUpdated: 0,
            eventsDeleted: 0,
            errors: [],
            lastSyncTime: new Date()
        };

        try {
            if (!this.calendar || !isLiveMode) {
                logger.warn("Calendar sync skipped - dry run mode or no calendar access");
                return result;
            }

            // Get all Google Calendar events
            const googleEvents = await this.fetchGoogleCalendarEvents(calendarId, maxEvents);
            logger.info({ eventCount: googleEvents.length }, "Fetched Google Calendar events");

            // Get all database bookings with calendar events
            const dbBookings = await this.fetchDatabaseBookings();
            logger.info({ bookingCount: dbBookings.length }, "Fetched database bookings");

            // Create maps for efficient lookup
            const googleEventMap = new Map(
                googleEvents.map(event => [event.id, event])
            );
            const dbBookingMap = new Map(
                dbBookings
                    .filter(booking => booking.calendarEventId)
                    .map(booking => [booking.calendarEventId!, booking])
            );

            // Process synchronization based on direction
            switch (syncDirection) {
                case "google_to_db":
                    await this.syncGoogleToDatabase(googleEventMap, dbBookingMap, result);
                    break;
                case "db_to_google":
                    await this.syncDatabaseToGoogle(googleEventMap, dbBookingMap, result);
                    break;
                case "bidirectional":
                default:
                    await this.syncBidirectional(googleEventMap, dbBookingMap, result);
                    break;
            }

            // Update last sync time
            await this.updateLastSyncTime(result.lastSyncTime);

            logger.info(
                {
                    processed: result.eventsProcessed,
                    created: result.eventsCreated,
                    updated: result.eventsUpdated,
                    deleted: result.eventsDeleted,
                    errors: result.errors.length
                },
                "Calendar synchronization completed"
            );

        } catch (error) {
            logger.error({ error }, "Calendar synchronization failed");
            result.success = false;
            result.errors.push(`Sync failed: ${error instanceof Error ? error.message : String(error)}`);
        }

        return result;
    }

    /**
     * Fetch Google Calendar events
     */
    private async fetchGoogleCalendarEvents(
        calendarId: string,
        maxResults: number
    ): Promise<calendar_v3.Schema$Event[]> {
        if (!this.calendar) {
            return [];
        }

        const response = await this.calendar.events.list({
            calendarId,
            maxResults,
            timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
            timeMax: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // Next 90 days
            singleEvents: true,
            orderBy: "startTime"
        });

        return response.data.items || [];
    }

    /**
     * Fetch database bookings
     */
    private async fetchDatabaseBookings() {
        return await prisma.booking.findMany({
            where: {
                calendarEventId: { not: null },
                status: { not: "cancelled" }
            },
            include: {
                customer: true,
                lead: true
            }
        });
    }

    /**
     * Bidirectional synchronization
     */
    private async syncBidirectional(
        googleEventMap: Map<string, calendar_v3.Schema$Event>,
        dbBookingMap: Map<string, any>,
        result: SyncResult
    ): Promise<void> {
        // 1. Update existing bookings with Google Calendar changes
        for (const [eventId, googleEvent] of googleEventMap) {
            const dbBooking = dbBookingMap.get(eventId);
            if (dbBooking) {
                await this.updateBookingFromGoogleEvent(dbBooking, googleEvent, result);
            } else {
                // Google event not in database - create booking
                await this.createBookingFromGoogleEvent(googleEvent, result);
            }
        }

        // 2. Create Google Calendar events for database bookings without calendar events
        for (const [eventId, dbBooking] of dbBookingMap) {
            if (!googleEventMap.has(eventId)) {
                await this.createGoogleEventFromBooking(dbBooking, result);
            }
        }

        // 3. Handle deleted events
        for (const [eventId, dbBooking] of dbBookingMap) {
            if (!googleEventMap.has(eventId)) {
                await this.handleDeletedGoogleEvent(dbBooking, result);
            }
        }
    }

    /**
     * Sync from Google Calendar to database
     */
    private async syncGoogleToDatabase(
        googleEventMap: Map<string, calendar_v3.Schema$Event>,
        dbBookingMap: Map<string, any>,
        result: SyncResult
    ): Promise<void> {
        for (const [eventId, googleEvent] of googleEventMap) {
            const dbBooking = dbBookingMap.get(eventId);
            if (dbBooking) {
                await this.updateBookingFromGoogleEvent(dbBooking, googleEvent, result);
            } else {
                await this.createBookingFromGoogleEvent(googleEvent, result);
            }
        }
    }

    /**
     * Sync from database to Google Calendar
     */
    private async syncDatabaseToGoogle(
        googleEventMap: Map<string, calendar_v3.Schema$Event>,
        dbBookingMap: Map<string, any>,
        result: SyncResult
    ): Promise<void> {
        for (const [eventId, dbBooking] of dbBookingMap) {
            if (!googleEventMap.has(eventId)) {
                await this.createGoogleEventFromBooking(dbBooking, result);
            }
        }
    }

    /**
     * Update database booking from Google Calendar event
     */
    private async updateBookingFromGoogleEvent(
        dbBooking: any,
        googleEvent: calendar_v3.Schema$Event,
        result: SyncResult
    ): Promise<void> {
        try {
            const googleStart = googleEvent.start?.dateTime || googleEvent.start?.date;
            const googleEnd = googleEvent.end?.dateTime || googleEvent.end?.date;

            if (!googleStart || !googleEnd) {
                result.errors.push(`Invalid dates for event ${googleEvent.id}`);
                return;
            }

            const googleStartDate = new Date(googleStart);
            const googleEndDate = new Date(googleEnd);
            const dbStartDate = new Date(dbBooking.startTime);
            const dbEndDate = new Date(dbBooking.endTime);

            // Check if update is needed
            const needsUpdate = 
                googleStartDate.getTime() !== dbStartDate.getTime() ||
                googleEndDate.getTime() !== dbEndDate.getTime() ||
                googleEvent.summary !== dbBooking.serviceType ||
                googleEvent.location !== dbBooking.address;

            if (needsUpdate) {
                await prisma.booking.update({
                    where: { id: dbBooking.id },
                    data: {
                        startTime: googleStartDate,
                        endTime: googleEndDate,
                        serviceType: googleEvent.summary || dbBooking.serviceType,
                        address: googleEvent.location || dbBooking.address,
                        notes: googleEvent.description || dbBooking.notes
                    }
                });

                result.eventsUpdated++;
                logger.info(
                    { bookingId: dbBooking.id, eventId: googleEvent.id },
                    "Updated booking from Google Calendar event"
                );
            }

            result.eventsProcessed++;
        } catch (error) {
            result.errors.push(`Failed to update booking ${dbBooking.id}: ${error}`);
        }
    }

    /**
     * Create database booking from Google Calendar event
     */
    private async createBookingFromGoogleEvent(
        googleEvent: calendar_v3.Schema$Event,
        result: SyncResult
    ): Promise<void> {
        try {
            const googleStart = googleEvent.start?.dateTime || googleEvent.start?.date;
            const googleEnd = googleEvent.end?.dateTime || googleEvent.end?.date;

            if (!googleStart || !googleEnd) {
                result.errors.push(`Invalid dates for event ${googleEvent.id}`);
                return;
            }

            const startDate = new Date(googleStart);
            const endDate = new Date(googleEnd);
            const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (60 * 1000));

            // Try to find existing customer by email from attendees
            let customerId: string | undefined;
            if (googleEvent.attendees && googleEvent.attendees.length > 0) {
                const attendeeEmail = googleEvent.attendees[0].email;
                if (attendeeEmail) {
                    const customer = await prisma.customer.findUnique({
                        where: { email: attendeeEmail }
                    });
                    customerId = customer?.id;
                }
            }

            const booking = await prisma.booking.create({
                data: {
                    calendarEventId: googleEvent.id!,
                    calendarLink: googleEvent.htmlLink,
                    startTime: startDate,
                    endTime: endDate,
                    scheduledAt: startDate,
                    estimatedDuration: durationMinutes,
                    serviceType: googleEvent.summary || "Google Calendar Event",
                    address: googleEvent.location,
                    status: "scheduled",
                    notes: googleEvent.description,
                    customerId
                }
            });

            // Update customer statistics if booking is linked to customer
            if (customerId) {
                await updateCustomerStats(customerId);
                logger.debug(
                    { customerId, bookingId: booking.id },
                    "Updated customer stats after calendar sync booking creation"
                );
            }

            result.eventsCreated++;
            logger.info(
                { bookingId: booking.id, eventId: googleEvent.id },
                "Created booking from Google Calendar event"
            );
        } catch (error) {
            result.errors.push(`Failed to create booking from event ${googleEvent.id}: ${error}`);
        }
    }

    /**
     * Create Google Calendar event from database booking
     */
    private async createGoogleEventFromBooking(
        dbBooking: any,
        result: SyncResult
    ): Promise<void> {
        try {
            if (!this.calendar) {
                result.errors.push("Calendar service not available");
                return;
            }

            const event = await this.calendar.events.insert({
                calendarId: "primary",
                requestBody: {
                    summary: dbBooking.serviceType || "Rendetalje.dk Booking",
                    description: dbBooking.notes || `Booking ID: ${dbBooking.id}`,
                    start: {
                        dateTime: dbBooking.startTime.toISOString(),
                        timeZone: "Europe/Copenhagen"
                    },
                    end: {
                        dateTime: dbBooking.endTime.toISOString(),
                        timeZone: "Europe/Copenhagen"
                    },
                    location: dbBooking.address,
                    attendees: dbBooking.customer?.email ? [{
                        email: dbBooking.customer.email,
                        displayName: dbBooking.customer.name
                    }] : undefined
                }
            });

            // Update booking with Google Calendar event ID
            await prisma.booking.update({
                where: { id: dbBooking.id },
                data: {
                    calendarEventId: event.data.id,
                    calendarLink: event.data.htmlLink
                }
            });

            result.eventsCreated++;
            logger.info(
                { bookingId: dbBooking.id, eventId: event.data.id },
                "Created Google Calendar event from booking"
            );
        } catch (error) {
            result.errors.push(`Failed to create Google Calendar event for booking ${dbBooking.id}: ${error}`);
        }
    }

    /**
     * Handle deleted Google Calendar events
     */
    private async handleDeletedGoogleEvent(
        dbBooking: any,
        result: SyncResult
    ): Promise<void> {
        try {
            // Mark booking as cancelled if Google Calendar event was deleted
            await prisma.booking.update({
                where: { id: dbBooking.id },
                data: {
                    status: "cancelled",
                    notes: (dbBooking.notes || "") + "\n\n[SYNC] Google Calendar event was deleted"
                }
            });

            result.eventsDeleted++;
            logger.info(
                { bookingId: dbBooking.id },
                "Marked booking as cancelled - Google Calendar event deleted"
            );
        } catch (error) {
            result.errors.push(`Failed to handle deleted event for booking ${dbBooking.id}: ${error}`);
        }
    }

    /**
     * Update last sync time
     */
    private async updateLastSyncTime(syncTime: Date): Promise<void> {
        try {
            await prisma.analytics.upsert({
                where: {
                    date_metric: {
                        date: new Date(syncTime.toDateString()),
                        metric: "calendar_sync"
                    }
                },
                update: {
                    value: syncTime.getTime(),
                    metadata: { lastSync: syncTime.toISOString() }
                },
                create: {
                    date: new Date(syncTime.toDateString()),
                    metric: "calendar_sync",
                    value: syncTime.getTime(),
                    metadata: { lastSync: syncTime.toISOString() }
                }
            });
        } catch (error) {
            logger.warn({ error }, "Failed to update last sync time");
        }
    }

    /**
     * Get sync status
     */
    async getSyncStatus(): Promise<{
        lastSync: Date | null;
        totalEvents: number;
        totalBookings: number;
        syncErrors: number;
    }> {
        try {
            const lastSyncRecord = await prisma.analytics.findUnique({
                where: {
                    date_metric: {
                        date: new Date(new Date().toDateString()),
                        metric: "calendar_sync"
                    }
                }
            });

            const lastSync = lastSyncRecord ? new Date(lastSyncRecord.value) : null;

            const [totalEvents, totalBookings] = await Promise.all([
                this.calendar ? this.getGoogleCalendarEventCount() : 0,
                prisma.booking.count({
                    where: { status: { not: "cancelled" } }
                })
            ]);

            return {
                lastSync,
                totalEvents,
                totalBookings,
                syncErrors: 0
            };
        } catch (error) {
            logger.error({ error }, "Failed to get sync status");
            return {
                lastSync: null,
                totalEvents: 0,
                totalBookings: 0,
                syncErrors: 1
            };
        }
    }

    /**
     * Get Google Calendar event count
     */
    private async getGoogleCalendarEventCount(): Promise<number> {
        if (!this.calendar) return 0;

        try {
            const response = await this.calendar.events.list({
                calendarId: "primary",
                maxResults: 1,
                timeMin: new Date().toISOString()
            });

            return response.data.items?.length || 0;
        } catch (error) {
            logger.error({ error }, "Failed to get Google Calendar event count");
            return 0;
        }
    }
}

// Export singleton instance
export const calendarSyncService = new CalendarSyncService();

// Export convenience functions
export async function syncCalendar(options?: CalendarSyncOptions): Promise<SyncResult> {
    return calendarSyncService.syncCalendar(options);
}

export async function getCalendarSyncStatus() {
    return calendarSyncService.getSyncStatus();
}
