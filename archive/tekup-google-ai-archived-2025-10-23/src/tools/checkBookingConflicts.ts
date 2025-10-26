import { google } from "googleapis";
import { logger } from "../logger";
import { getGoogleAuthClient } from "../services/googleAuth";
import { googleConfig } from "../config";

interface ConflictEvent {
    id: string;
    summary: string;
    start: Date;
    end: Date;
    location?: string;
    attendees?: string[];
}

interface Conflict {
    event1: ConflictEvent;
    event2: ConflictEvent;
    overlapMinutes: number;
}

/**
 * Check for Booking Conflicts
 * Detects overlapping events in Google Calendar
 */
async function checkConflicts(): Promise<void> {
    console.log("\n⚠️  Booking Conflict Checker\n");

    const calendarId = googleConfig.GOOGLE_CALENDAR_ID || "primary";
    console.log(`📅 Calendar: ${calendarId}\n`);

    try {
        // Initialize Google Calendar client
        const auth = getGoogleAuthClient([
            "https://www.googleapis.com/auth/calendar",
        ]);

        if (!auth) {
            console.error("❌ Failed to authenticate with Google Calendar");
            return;
        }

        const calendar = google.calendar({ version: "v3", auth });

        // Fetch events from now to 30 days forward
        const timeMin = new Date().toISOString();
        const timeMax = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString();

        console.log("📥 Fetching calendar events...");
        const response = await calendar.events.list({
            calendarId,
            timeMin,
            timeMax,
            maxResults: 500,
            singleEvents: true,
            orderBy: "startTime",
        });

        const events = response.data.items || [];
        console.log(`   Found ${events.length} events\n`);

        // Convert to ConflictEvent format
        const conflictEvents: ConflictEvent[] = events
            .filter((e) => e.start && e.end && e.id)
            .map((e) => {
                const startDateTime = e.start?.dateTime || e.start?.date || "";
                const endDateTime = e.end?.dateTime || e.end?.date || "";
                return {
                    id: e.id || "",
                    summary: e.summary || "Untitled",
                    start: new Date(startDateTime),
                    end: new Date(endDateTime),
                    location: e.location || undefined,
                    attendees: e.attendees?.map((a) => a.email || "").filter(Boolean),
                };
            });

        // Find conflicts (overlapping events)
        const conflicts: Conflict[] = [];

        for (let i = 0; i < conflictEvents.length; i++) {
            for (let j = i + 1; j < conflictEvents.length; j++) {
                const e1 = conflictEvents[i];
                const e2 = conflictEvents[j];

                // Check if events overlap
                if (e1.start < e2.end && e2.start < e1.end) {
                    const overlapStart = new Date(
                        Math.max(e1.start.getTime(), e2.start.getTime())
                    );
                    const overlapEnd = new Date(
                        Math.min(e1.end.getTime(), e2.end.getTime())
                    );
                    const overlapMinutes = Math.round(
                        (overlapEnd.getTime() - overlapStart.getTime()) / 60000
                    );

                    conflicts.push({
                        event1: e1,
                        event2: e2,
                        overlapMinutes,
                    });
                }
            }
        }

        if (conflicts.length === 0) {
            console.log("✅ No booking conflicts found!");
            return;
        }

        console.log(`⚠️  Found ${conflicts.length} conflicts:\n`);

        // Group conflicts by day
        const conflictsByDay = new Map<string, Conflict[]>();
        for (const conflict of conflicts) {
            const day = conflict.event1.start.toLocaleDateString("da-DK");
            if (!conflictsByDay.has(day)) {
                conflictsByDay.set(day, []);
            }
            const dayConflicts = conflictsByDay.get(day);
            if (dayConflicts) {
                dayConflicts.push(conflict);
            }
        }

        // Print conflicts grouped by day
        for (const [day, dayConflicts] of conflictsByDay.entries()) {
            console.log(`📅 ${day} - ${dayConflicts.length} conflict(s)`);
            console.log("─".repeat(60));

            for (const conflict of dayConflicts) {
                const { event1, event2, overlapMinutes } = conflict;

                console.log(`\n⚠️  CONFLICT (${overlapMinutes} minutes overlap):`);
                console.log(`   1️⃣  ${event1.summary}`);
                console.log(`       🕐 ${formatTime(event1.start)} - ${formatTime(event1.end)}`);
                if (event1.location) {
                    console.log(`       📍 ${event1.location}`);
                }

                console.log(`   2️⃣  ${event2.summary}`);
                console.log(`       🕐 ${formatTime(event2.start)} - ${formatTime(event2.end)}`);
                if (event2.location) {
                    console.log(`       📍 ${event2.location}`);
                }

                // Suggest resolution
                console.log(`\n   💡 Resolution:`);
                if (event1.summary === event2.summary && event1.location === event2.location) {
                    console.log(`      → Likely a duplicate - consider deleting one`);
                } else if (event1.location && event2.location && event1.location === event2.location) {
                    console.log(`      → Same location - reschedule one of them`);
                } else if (!event1.location || !event2.location) {
                    console.log(`      → Missing location info - verify if conflict is real`);
                } else {
                    console.log(`      → Different locations - may be for different staff members`);
                }
            }

            console.log("");
        }

        console.log("\n📊 Summary:");
        console.log(`   Total conflicts: ${conflicts.length}`);
        console.log(`   Days affected: ${conflictsByDay.size}`);

        // Calculate total overlap time
        const totalOverlapMinutes = conflicts.reduce(
            (sum, c) => sum + c.overlapMinutes,
            0
        );
        const totalOverlapHours = (totalOverlapMinutes / 60).toFixed(1);
        console.log(`   Total overlap time: ${totalOverlapHours} hours`);

        console.log("\n💡 Next steps:");
        console.log("   1. Review each conflict manually");
        console.log("   2. Run deduplicate tool: npm run calendar:deduplicate");
        console.log("   3. Reschedule overlapping bookings");
    } catch (error) {
        console.error("❌ Error checking conflicts:", error);
        logger.error({ error }, "Failed to check calendar conflicts");
        process.exit(1);
    }
}

function formatTime(date: Date): string {
    return new Intl.DateTimeFormat("da-DK", {
        timeStyle: "short",
        timeZone: "Europe/Copenhagen",
    }).format(date);
}

// Run conflict checker
checkConflicts().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
