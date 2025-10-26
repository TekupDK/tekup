import { google, calendar_v3 } from "googleapis";
import { logger } from "../logger";
import { getGoogleAuthClient } from "../services/googleAuth";
import { googleConfig, isLiveMode } from "../config";

interface DuplicateGroup {
    key: string;
    events: calendar_v3.Schema$Event[];
}

/**
 * Deduplicate Calendar Events
 * Finds and optionally removes duplicate events from Google Calendar
 */
async function deduplicateCalendar(): Promise<void> {
    console.log("\n🔍 Deduplicate Calendar Events\n");

    const calendarId = googleConfig.GOOGLE_CALENDAR_ID || "primary";
    const isDryRun = !isLiveMode;

    if (isDryRun) {
        console.log("⚠️  DRY-RUN MODE - No events will be deleted");
    } else {
        console.log("🔴 LIVE MODE - Events will be permanently deleted");
    }

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

        // Fetch all events from now to 30 days forward
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

        // Group events by duplicate key (summary + start + end + location)
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
            const group = eventGroups.get(key);
            if (group) {
                group.push(event);
            }
        }

        // Find duplicates (groups with more than 1 event)
        const duplicates: DuplicateGroup[] = [];
        for (const [key, group] of eventGroups.entries()) {
            if (group.length > 1) {
                duplicates.push({ key, events: group });
            }
        }

        if (duplicates.length === 0) {
            console.log("✅ No duplicate events found!");
            return;
        }

        console.log(`🔍 Found ${duplicates.length} duplicate groups:\n`);

        let totalDeleted = 0;

        for (const duplicate of duplicates) {
            const firstEvent = duplicate.events[0];
            const duplicateCount = duplicate.events.length - 1;

            console.log(`📌 ${firstEvent.summary || "Untitled"}`);
            console.log(
                `   📍 ${firstEvent.location || "No location"}`
            );
            console.log(
                `   🕐 ${formatDate(
                    firstEvent.start?.dateTime || firstEvent.start?.date || ""
                )}`
            );
            console.log(`   🔢 ${duplicateCount + 1} instances (${duplicateCount} duplicates)`);

            // Keep the first event, delete the rest
            for (let i = 1; i < duplicate.events.length; i++) {
                const eventToDelete = duplicate.events[i];
                if (!eventToDelete.id) {
                    console.log(`   ⚠️  Event ${i + 1} has no ID, skipping`);
                    continue;
                }

                if (isDryRun) {
                    console.log(
                        `   🗑️  [DRY-RUN] Would delete duplicate ${i} (ID: ${eventToDelete.id})`
                    );
                } else {
                    try {
                        await calendar.events.delete({
                            calendarId,
                            eventId: eventToDelete.id,
                        });
                        console.log(`   ✅ Deleted duplicate ${i} (ID: ${eventToDelete.id})`);
                        totalDeleted++;
                    } catch (error) {
                        console.log(`   ❌ Failed to delete duplicate ${i}: ${error}`);
                        logger.error({ error, eventId: eventToDelete.id }, "Failed to delete duplicate");
                    }
                }
            }

            console.log("");
        }

        console.log("\n📊 Summary:");
        console.log(`   Total duplicate groups: ${duplicates.length}`);
        console.log(
            `   Events ${isDryRun ? "would be" : ""} deleted: ${totalDeleted}`
        );

        if (isDryRun) {
            console.log(
                "\n💡 To actually delete duplicates, set RUN_MODE=live in .env"
            );
        } else {
            console.log("\n✅ Deduplication complete!");
        }
    } catch (error) {
        console.error("❌ Error during deduplication:", error);
        logger.error({ error }, "Failed to deduplicate calendar");
        process.exit(1);
    }
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("da-DK", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: "Europe/Copenhagen",
    }).format(date);
}

// Run the deduplication
deduplicateCalendar().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
