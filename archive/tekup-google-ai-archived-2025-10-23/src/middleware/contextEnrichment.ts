import type { Request, Response, NextFunction } from "express";
import { logger } from "../logger";
import { listRecentMessages } from "../services/gmailService";
import { listUpcomingEvents } from "../services/calendarService";
import type { GmailMessageSummary } from "../services/gmailService";
import type { CalendarEventSummary } from "../services/calendarService";

export interface EnrichedContext {
    recentEmails?: GmailMessageSummary[];
    upcomingEvents?: CalendarEventSummary[];
    contextSummary?: string;
}

/**
 * Middleware that enriches the request with Gmail and Calendar context.
 * This allows the AI to have awareness of recent customer communications
 * and upcoming appointments when processing chat messages.
 */
export function enrichContextMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    // Wrap async logic to avoid promise-returning middleware
    (async () => {
        try {
            // Only enrich context for chat requests
            if (!req.path.includes("/chat")) {
                next();
                return;
            }

            const startTime = Date.now();

            // Fetch recent emails and upcoming events in parallel
            const [recentEmails, upcomingEvents] = await Promise.all([
                listRecentMessages({ maxResults: 5 }).catch((err) => {
                    logger.warn({ err }, "Failed to fetch recent emails for context");
                    return [];
                }),
                listUpcomingEvents({ maxResults: 5 }).catch((err) => {
                    logger.warn({ err }, "Failed to fetch upcoming events for context");
                    return [];
                }),
            ]);

            // Build a human-readable context summary
            const contextSummary = buildContextSummary(recentEmails, upcomingEvents);

            // Attach enriched context to request
            (req as Request & { enrichedContext?: EnrichedContext }).enrichedContext = {
                recentEmails,
                upcomingEvents,
                contextSummary,
            };

            const duration = Date.now() - startTime;
            logger.debug(
                {
                    emailCount: recentEmails.length,
                    eventCount: upcomingEvents.length,
                    duration,
                },
                "Context enrichment complete"
            );

            next();
        } catch (err) {
            // Don't fail the request if context enrichment fails
            logger.error({ err }, "Context enrichment failed");
            next();
        }
    })().catch((err) => {
        // Catch any unhandled errors from the async IIFE
        logger.error({ err }, "Unhandled error in context enrichment");
        next();
    });
}

/**
 * Builds a human-readable summary of the business context
 * from recent emails and upcoming calendar events.
 */
function buildContextSummary(
    emails: GmailMessageSummary[],
    events: CalendarEventSummary[]
): string {
    const parts: string[] = [];

    // Email summary
    if (emails.length > 0) {
        parts.push("📧 RECENT EMAILS:");
        const emailSummaries = emails.map((email, idx) => {
            const date = email.internalDate
                ? new Date(parseInt(email.internalDate)).toLocaleDateString("da-DK", {
                    month: "short",
                    day: "numeric",
                })
                : "Ukendt dato";
            return `${idx + 1}. ${email.from || "Ukendt"} - ${email.subject || "Ingen emne"} (${date})`;
        });
        parts.push(emailSummaries.join("\n"));
    }

    // Calendar summary
    if (events.length > 0) {
        parts.push("\n📅 UPCOMING APPOINTMENTS:");
        const eventSummaries = events.map((event, idx) => {
            const startDate = new Date(event.start).toLocaleDateString("da-DK", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
            return `${idx + 1}. ${event.summary} - ${startDate} (${event.location || "No location"})`;
        });
        parts.push(eventSummaries.join("\n"));
    }

    if (parts.length === 0) {
        return "No recent context available.";
    }

    return parts.join("\n\n");
}

// Extend Express Request type to include enriched context
declare global {
    namespace Express {
        interface Request {
            enrichedContext?: EnrichedContext;
        }
    }
}
