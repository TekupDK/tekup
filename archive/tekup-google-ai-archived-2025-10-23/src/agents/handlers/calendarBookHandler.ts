import { z } from "zod";
import { createCalendarEvent, isTimeSlotAvailable, findNextAvailableSlot } from "../../services/calendarService";
import { sendBookingConfirmation, sendRescheduleNotification } from "../../services/bookingConfirmation";
import type { TaskHandler, ExecutionAction } from "./types";
import { logger } from "../../logger";

const BookingLeadSchema = z.object({
    name: z.string().default("Kunde"),
    email: z.string().email().optional(),
    address: z.string().optional(),
});

const StartSchema = z.object({
    dateTime: z.string().optional(),
    date: z.string().optional(),
});

const BookingPayloadSchema = z
    .object({
        summary: z.string().default("Rendetalje.dk rengøringsbesøg"),
        lead: BookingLeadSchema.default(BookingLeadSchema.parse({})),
        start: StartSchema.optional(),
        durationMinutes: z.coerce.number().int().positive().default(60),
        calendarId: z.string().optional(),
        context: z.record(z.any()).optional(),
        checkAvailability: z.boolean().default(true), // Auto-check availability
        sendConfirmation: z.boolean().default(true), // Auto-send confirmation email
    })
    .default({
        summary: "Rendetalje.dk rengøringsbesøg",
        lead: BookingLeadSchema.parse({}),
        durationMinutes: 60,
        checkAvailability: true,
        sendConfirmation: true,
    });

export const handleCalendarBook: TaskHandler = async (task) => {
    const payload = BookingPayloadSchema.parse(task.payload ?? {});
    const calendarId = payload.calendarId ?? "primary";

    const rawStart = payload.start;
    const preferred = rawStart?.dateTime ?? (rawStart?.date ? `${rawStart.date}T09:00:00` : null);
    const startCandidate = preferred ? new Date(preferred) : null;
    const fallbackStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
    let start = startCandidate && !Number.isNaN(startCandidate.getTime()) ? startCandidate : fallbackStart;
    let end = new Date(start.getTime() + payload.durationMinutes * 60 * 1000);
    let wasRescheduled = false;
    const originalStart = start.toISOString();

    // Check availability before booking (if enabled)
    if (payload.checkAvailability) {
        logger.debug(
            { requestedStart: start.toISOString(), durationMinutes: payload.durationMinutes },
            "Checking calendar availability before booking"
        );

        const availability = await isTimeSlotAvailable(
            calendarId,
            start.toISOString(),
            end.toISOString()
        );

        if (!availability.available) {
            logger.warn(
                { conflicts: availability.conflicts.length, requestedStart: start.toISOString() },
                "Requested time slot not available, finding alternative"
            );

            // Find next available slot
            const alternative = await findNextAvailableSlot(
                calendarId,
                payload.durationMinutes,
                start,
                14 // Search next 14 days
            );

            if (!alternative) {
                return {
                    taskId: task.id,
                    provider: task.provider,
                    status: "failed",
                    detail: "Ingen ledige tidspunkter fundet i de næste 14 dage",
                } satisfies ExecutionAction;
            }

            // Update to alternative time slot
            start = new Date(alternative.start);
            end = new Date(alternative.end);
            wasRescheduled = true;

            logger.info(
                { originalStart: startCandidate?.toISOString(), newStart: start.toISOString() },
                "Booking rescheduled to available time slot"
            );
        } else {
            logger.info({ requestedStart: start.toISOString() }, "Time slot is available");
        }
    }

    const attendees = payload.lead.email
        ? [
            {
                email: payload.lead.email,
                displayName: payload.lead.name,
            },
        ]
        : undefined;

    const result = await createCalendarEvent({
        summary: payload.summary,
        description: JSON.stringify({ lead: payload.lead, context: payload.context }),
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
        attendees,
        location: payload.lead.address,
        calendarId,
    });

    const formatter = new Intl.DateTimeFormat("da-DK", { dateStyle: "medium", timeStyle: "short" });
    const detail = result.dryRun
        ? "Kalenderbooking klar til gennemgang"
        : `Kalenderbooking oprettet (${formatter.format(new Date(result.start))} - ${formatter.format(
            new Date(result.end)
        )})`;

    logger.info(
        {
            eventId: result.id,
            start: result.start,
            end: result.end,
            leadEmail: payload.lead.email,
            wasRescheduled,
        },
        "Calendar booking completed"
    );

    // Send confirmation email (if enabled and not dry-run)
    if (payload.sendConfirmation && !result.dryRun && payload.lead.email) {
        try {
            if (wasRescheduled) {
                const rescheduleNotif = await sendRescheduleNotification({
                    lead: payload.lead as any,
                    eventId: result.id,
                    originalStart,
                    start: result.start,
                    end: result.end,
                    location: payload.lead.address,
                    htmlLink: result.htmlLink,
                    durationMinutes: payload.durationMinutes,
                    reason: "Det oprindelige tidspunkt var ikke ledigt",
                });

                logger.info(
                    { leadEmail: payload.lead.email, subject: rescheduleNotif.subject },
                    "Reschedule notification prepared"
                );
            } else {
                const confirmation = await sendBookingConfirmation({
                    lead: payload.lead as any,
                    eventId: result.id,
                    start: result.start,
                    end: result.end,
                    location: payload.lead.address,
                    htmlLink: result.htmlLink,
                    durationMinutes: payload.durationMinutes,
                });

                logger.info(
                    { leadEmail: payload.lead.email, subject: confirmation.subject },
                    "Booking confirmation prepared"
                );
            }
        } catch (err) {
            logger.error(
                { err, leadEmail: payload.lead.email },
                "Failed to send confirmation email (booking still created)"
            );
            // Don't fail the entire booking if email fails
        }
    }

    return {
        taskId: task.id,
        provider: task.provider,
        status: result.dryRun ? "queued" : "success",
        detail,
    } satisfies ExecutionAction;
};
