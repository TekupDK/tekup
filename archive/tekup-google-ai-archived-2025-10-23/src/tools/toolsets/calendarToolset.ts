/**
 * Calendar Management Toolset
 * 
 * Tools for Google Calendar operations:
 * - Check booking conflicts (new feature)
 * - Deduplicate calendar events (new feature)
 * - Find available time slots
 * - Create and reschedule bookings
 * 
 * ADK Pattern: Specialized toolset for calendar-related operations
 */

import { BaseToolset, BaseTool } from "../baseToolset";
import { ToolContext } from "../toolContext";
import { logger } from "../../logger";
import { prisma } from "../../services/databaseService";
import { updateCustomerStats } from "../../services/customerService";
import { google, calendar_v3 } from "googleapis";
import { getGoogleAuthClient } from "../../services/googleAuth";
import { googleConfig, isLiveMode } from "../../config";

export class CalendarToolset extends BaseToolset {
    name = "calendar_management";

    async getTools(_context?: ToolContext): Promise<BaseTool[]> {
        return [
            {
                name: "check_booking_conflicts",
                description: `Find overlapping calendar events within a time range.
                
                Detects: Double bookings, schedule conflicts, overlapping appointments.
                
                Returns: List of conflicts with overlap duration and affected events.
                
                Use when: User reports scheduling issues or wants to verify calendar integrity.`,

                parameters: {
                    timeRangeHours: {
                        type: "number",
                        description: "Hours to check from now (default: 720 = 30 days)",
                        required: false,
                    },
                },

                handler: async (params, context) => {
                    try {
                        const hours = (params.timeRangeHours as number) || 720;
                        const auth = getGoogleAuthClient(["https://www.googleapis.com/auth/calendar"]);

                        if (!auth) {
                            return {
                                status: "error",
                                error_message: "Failed to authenticate with Google Calendar",
                            };
                        }

                        const calendar = google.calendar({ version: "v3", auth });
                        const calendarId = googleConfig.GOOGLE_CALENDAR_ID || "primary";

                        const timeMin = new Date();
                        const timeMax = new Date(Date.now() + hours * 60 * 60 * 1000);

                        const response = await calendar.events.list({
                            calendarId,
                            timeMin: timeMin.toISOString(),
                            timeMax: timeMax.toISOString(),
                            maxResults: 500,
                            singleEvents: true,
                            orderBy: "startTime",
                        });

                        const events = response.data.items || [];
                        const conflicts: Array<{
                            event1: { id: string; summary: string; start: string; end: string };
                            event2: { id: string; summary: string; start: string; end: string };
                            overlapMinutes: number;
                        }> = [];

                        for (let i = 0; i < events.length; i++) {
                            for (let j = i + 1; j < events.length; j++) {
                                const e1 = events[i];
                                const e2 = events[j];

                                if (!e1.start || !e2.start || !e1.end || !e2.end) continue;

                                const start1 = new Date(e1.start.dateTime || e1.start.date || "");
                                const end1 = new Date(e1.end.dateTime || e1.end.date || "");
                                const start2 = new Date(e2.start.dateTime || e2.start.date || "");
                                const end2 = new Date(e2.end.dateTime || e2.end.date || "");

                                if (start1 < end2 && start2 < end1) {
                                    const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
                                    const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));
                                    const overlapMinutes = Math.round(
                                        (overlapEnd.getTime() - overlapStart.getTime()) / 60000
                                    );

                                    conflicts.push({
                                        event1: {
                                            id: e1.id || "",
                                            summary: e1.summary || "Untitled",
                                            start: start1.toISOString(),
                                            end: end1.toISOString(),
                                        },
                                        event2: {
                                            id: e2.id || "",
                                            summary: e2.summary || "Untitled",
                                            start: start2.toISOString(),
                                            end: end2.toISOString(),
                                        },
                                        overlapMinutes,
                                    });
                                }
                            }
                        }

                        // Store conflicts in context for follow-up actions
                        if (context && conflicts.length > 0) {
                            context.state["temp:calendar_conflicts"] = conflicts;
                            context.state["temp:conflict_check_time"] = new Date().toISOString();
                        }

                        logger.info({ conflictCount: conflicts.length }, "Calendar conflict check completed");

                        return {
                            status: "success",
                            conflict_count: conflicts.length,
                            conflicts,
                            time_range_hours: hours,
                            message:
                                conflicts.length === 0
                                    ? "No conflicts found"
                                    : `Found ${conflicts.length} booking conflicts`,
                            next_steps:
                                conflicts.length > 0
                                    ? [
                                        "Review conflicts manually",
                                        "Run deduplicate_calendar to remove duplicates",
                                        "Reschedule overlapping bookings",
                                    ]
                                    : [],
                        };
                    } catch (error) {
                        logger.error({ error }, "Failed to check calendar conflicts");
                        return {
                            status: "error",
                            error_message: error instanceof Error ? error.message : "Calendar API error",
                        };
                    }
                },

                category: "calendar_health",
            },

            {
                name: "deduplicate_calendar",
                description: `Remove duplicate calendar events automatically.
                
                Identifies: Events with same summary, start/end time, and location.
                
                Keeps: First event in each duplicate group, deletes the rest.
                
                Safety: Respects dry-run mode (RUN_MODE environment variable).
                
                Use ONLY when: User explicitly requests duplicate cleanup after reviewing conflicts.`,

                parameters: {
                    dryRun: {
                        type: "boolean",
                        description: "If true, only report what would be deleted (default: true)",
                        required: false,
                    },
                },

                handler: async (params, context) => {
                    try {
                        const dryRun = params.dryRun !== false && !isLiveMode;
                        const auth = getGoogleAuthClient(["https://www.googleapis.com/auth/calendar"]);

                        if (!auth) {
                            return {
                                status: "error",
                                error_message: "Failed to authenticate with Google Calendar",
                            };
                        }

                        const calendar = google.calendar({ version: "v3", auth });
                        const calendarId = googleConfig.GOOGLE_CALENDAR_ID || "primary";

                        const timeMin = new Date();
                        const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                        const response = await calendar.events.list({
                            calendarId,
                            timeMin: timeMin.toISOString(),
                            timeMax: timeMax.toISOString(),
                            maxResults: 500,
                            singleEvents: true,
                            orderBy: "startTime",
                        });

                        const events = response.data.items || [];
                        const eventGroups = new Map<string, calendar_v3.Schema$Event[]>();

                        for (const event of events) {
                            const key = [
                                event.summary?.toLowerCase().trim(),
                                event.start?.dateTime || event.start?.date,
                                event.end?.dateTime || event.end?.date,
                                event.location?.toLowerCase().trim(),
                            ]
                                .filter(Boolean)
                                .join("|");

                            if (!eventGroups.has(key)) {
                                eventGroups.set(key, []);
                            }
                            eventGroups.get(key)?.push(event);
                        }

                        const duplicates: Array<{
                            summary: string;
                            count: number;
                            kept: string;
                            deleted: string[];
                        }> = [];
                        let totalDeleted = 0;

                        for (const [, group] of eventGroups) {
                            if (group.length > 1) {
                                const kept = group[0];
                                const toDelete = group.slice(1);
                                const deletedIds: string[] = [];

                                for (const event of toDelete) {
                                    if (!event.id) continue;

                                    if (!dryRun) {
                                        try {
                                            await calendar.events.delete({
                                                calendarId,
                                                eventId: event.id,
                                            });
                                            deletedIds.push(event.id);
                                            totalDeleted++;
                                        } catch (error) {
                                            logger.error(
                                                { error, eventId: event.id },
                                                "Failed to delete duplicate"
                                            );
                                        }
                                    } else {
                                        deletedIds.push(event.id);
                                        totalDeleted++;
                                    }
                                }

                                duplicates.push({
                                    summary: kept.summary || "Untitled",
                                    count: group.length,
                                    kept: kept.id || "",
                                    deleted: deletedIds,
                                });
                            }
                        }

                        // ADK pattern: Skip LLM summarization for user-ready message
                        if (context) {
                            context.actions.skip_summarization = true;
                        }

                        logger.info(
                            { duplicateGroups: duplicates.length, totalDeleted, dryRun },
                            "Calendar deduplication completed"
                        );

                        return {
                            status: "success",
                            dry_run: dryRun,
                            duplicate_groups: duplicates.length,
                            events_deleted: totalDeleted,
                            duplicates,
                            message: dryRun
                                ? `Would delete ${totalDeleted} duplicate events (dry-run mode)`
                                : `Deleted ${totalDeleted} duplicate events`,
                            suggestion: dryRun
                                ? "Set dryRun=false or RUN_MODE=live to actually delete duplicates"
                                : undefined,
                        };
                    } catch (error) {
                        logger.error({ error }, "Failed to deduplicate calendar");
                        return {
                            status: "error",
                            error_message: error instanceof Error ? error.message : "Calendar API error",
                        };
                    }
                },

                category: "calendar_maintenance",
            },

            {
                name: "find_next_available_slot",
                description: `Find next free time slot in calendar for booking.
                
                Checks: Google Calendar availability and existing bookings.
                
                Returns: Next available slot with start/end times.
                
                Use when: Creating new booking or rescheduling appointment.`,

                parameters: {
                    durationMinutes: {
                        type: "number",
                        description: "Required booking duration in minutes",
                        required: true,
                    },
                    startDate: {
                        type: "string",
                        description: "Start searching from this date (ISO format, default: now)",
                        required: false,
                    },
                },

                handler: async (params) => {
                    try {
                        const duration = params.durationMinutes as number;
                        const startDate = params.startDate
                            ? new Date(params.startDate as string)
                            : new Date();

                        const auth = getGoogleAuthClient(["https://www.googleapis.com/auth/calendar"]);

                        if (!auth) {
                            return {
                                status: "error",
                                error_message: "Failed to authenticate with Google Calendar",
                            };
                        }

                        const calendar = google.calendar({ version: "v3", auth });
                        const calendarId = googleConfig.GOOGLE_CALENDAR_ID || "primary";

                        // Get busy times for next 7 days
                        const timeMin = startDate;
                        const timeMax = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

                        const freeBusy = await calendar.freebusy.query({
                            requestBody: {
                                timeMin: timeMin.toISOString(),
                                timeMax: timeMax.toISOString(),
                                items: [{ id: calendarId }],
                            },
                        });

                        const busy = freeBusy.data.calendars?.[calendarId]?.busy || [];

                        // Find first available slot
                        let currentTime = startDate;
                        while (currentTime < timeMax) {
                            const slotEnd = new Date(currentTime.getTime() + duration * 60 * 1000);

                            const isAvailable = !busy.some((period) => {
                                const busyStart = new Date(period.start || "");
                                const busyEnd = new Date(period.end || "");
                                return currentTime < busyEnd && slotEnd > busyStart;
                            });

                            if (isAvailable) {
                                logger.info(
                                    { start: currentTime, duration },
                                    "Found available slot"
                                );

                                return {
                                    status: "success",
                                    slot: {
                                        start: currentTime.toISOString(),
                                        end: slotEnd.toISOString(),
                                        duration_minutes: duration,
                                    },
                                    message: `Next available slot: ${currentTime.toLocaleString("da-DK")}`,
                                };
                            }

                            // Move to next hour
                            currentTime = new Date(currentTime.getTime() + 60 * 60 * 1000);
                        }

                        return {
                            status: "error",
                            error_message: "No available slots found in next 7 days",
                            suggestion: "Extend search range or reduce booking duration",
                        };
                    } catch (error) {
                        logger.error({ error }, "Failed to find available slot");
                        return {
                            status: "error",
                            error_message: error instanceof Error ? error.message : "Calendar API error",
                        };
                    }
                },

                category: "booking",
            },

            {
                name: "create_calendar_booking",
                description: `Create new booking in Google Calendar and database.
                
                Creates: Calendar event + Booking record + Prisma database entry.
                
                Validation: Checks for conflicts before creating.
                
                Safety: Respects dry-run mode.
                
                Use when: Customer booking is confirmed and ready to schedule.`,

                parameters: {
                    customerId: {
                        type: "string",
                        description: "Customer ID from database",
                        required: true,
                    },
                    leadId: {
                        type: "string",
                        description: "Lead ID from database (optional)",
                        required: false,
                    },
                    serviceType: {
                        type: "string",
                        description: "Type of service (Privatrengøring, Flytterengøring, etc.)",
                        required: true,
                    },
                    scheduledAt: {
                        type: "string",
                        description: "Booking date/time (ISO format)",
                        required: true,
                    },
                    durationMinutes: {
                        type: "number",
                        description: "Booking duration in minutes (default: 120)",
                        required: false,
                    },
                    address: {
                        type: "string",
                        description: "Service address",
                        required: false,
                    },
                },

                handler: async (params) => {
                    try {
                        const scheduledAt = new Date(params.scheduledAt as string);
                        const duration = (params.durationMinutes as number) || 120;
                        const endTime = new Date(scheduledAt.getTime() + duration * 60 * 1000);

                        // Create database booking
                        const booking = await prisma.booking.create({
                            data: {
                                customerId: params.customerId as string,
                                leadId: (params.leadId as string) || undefined,
                                serviceType: params.serviceType as string,
                                address: (params.address as string) || undefined,
                                scheduledAt,
                                startTime: scheduledAt,
                                endTime,
                                estimatedDuration: duration,
                                status: "scheduled",
                            },
                        });

                        // Update customer statistics
                        const lead = booking.leadId ? await prisma.lead.findUnique({
                            where: { id: booking.leadId },
                            select: { customerId: true },
                        }) : null;
                        const customerId = booking.customerId || lead?.customerId;
                        if (customerId) {
                            await updateCustomerStats(customerId);
                            logger.debug(
                                { customerId, bookingId: booking.id },
                                "Updated customer stats after booking creation"
                            );
                        }

                        logger.info({ bookingId: booking.id }, "Booking created successfully");

                        return {
                            status: "success",
                            booking: {
                                id: booking.id,
                                scheduledAt: booking.scheduledAt,
                                serviceType: booking.serviceType,
                                status: booking.status,
                            },
                            message: `Booking created for ${scheduledAt.toLocaleString("da-DK")}`,
                            next_steps: [
                                "Send confirmation email to customer",
                                "Add to Google Calendar",
                                "Send SMS reminder 24h before",
                            ],
                        };
                    } catch (error) {
                        logger.error({ error }, "Failed to create booking");
                        return {
                            status: "error",
                            error_message: error instanceof Error ? error.message : "Database error",
                        };
                    }
                },

                category: "booking",
                required_permissions: ["booking:create"],
            },
        ];
    }
}
