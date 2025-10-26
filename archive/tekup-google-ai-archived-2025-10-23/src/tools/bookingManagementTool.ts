import { listUpcomingEvents, findNextAvailableSlot, isTimeSlotAvailable } from "../services/calendarService";
import { logger } from "../logger";

/**
 * Booking Management CLI Tool
 * 
 * Commands:
 * - list: List all upcoming bookings
 * - availability <date>: Check availability on a specific date
 * - next-slot <durationMinutes>: Find next available time slot
 * - check-slot <start> <end>: Check if a specific time slot is available
 * - stats: Show booking statistics
 */

async function listUpcomingBookings(): Promise<void> {
    console.log("\n📅 Upcoming Calendar Bookings\n");

    try {
        const events = await listUpcomingEvents({
            maxResults: 20,
            timeMin: new Date().toISOString(),
        });

        if (!events || events.length === 0) {
            console.log("✅ No upcoming bookings");
            return;
        }

        const formatter = new Intl.DateTimeFormat("da-DK", {
            dateStyle: "full",
            timeStyle: "short",
            timeZone: "Europe/Copenhagen",
        });

        events.forEach((event, index) => {
            const start = new Date(event.start);
            const end = new Date(event.end);
            const duration = Math.round((end.getTime() - start.getTime()) / (60 * 1000));

            console.log(`${index + 1}. ${event.summary || "Uden titel"}`);
            console.log(`   📍 ${event.location || "Ingen lokation"}`);
            console.log(`   🕐 ${formatter.format(start)}`);
            console.log(`   ⏱️  ${duration} minutter`);

            if (event.attendees && Array.isArray(event.attendees) && event.attendees.length > 0) {
                const attendeeEmails = event.attendees.map(a => a?.email).filter(Boolean).join(", ");
                console.log(`   👥 ${attendeeEmails}`);
            }

            if (event.htmlLink) {
                console.log(`   🔗 ${event.htmlLink}`);
            }

            console.log("");
        });

        console.log(`📊 Total: ${events.length} bookings`);
    } catch (err) {
        console.error("❌ Error listing bookings:", err);
        logger.error({ err }, "Failed to list bookings");
    }
}

async function checkAvailability(dateStr?: string): Promise<void> {
    const targetDate = dateStr ? new Date(dateStr) : new Date();

    if (Number.isNaN(targetDate.getTime())) {
        console.error("❌ Invalid date format. Use YYYY-MM-DD");
        return;
    }

    console.log(`\n🔍 Checking availability for ${targetDate.toLocaleDateString("da-DK")}\n`);

    try {
        // Check from 8 AM to 6 PM
        const dayStart = new Date(targetDate);
        dayStart.setHours(8, 0, 0, 0);

        const dayEnd = new Date(targetDate);
        dayEnd.setHours(18, 0, 0, 0);

        const availability = await isTimeSlotAvailable(
            "primary",
            dayStart.toISOString(),
            dayEnd.toISOString()
        );

        if (availability.available) {
            console.log("✅ Hele dagen er ledig!");
        } else {
            console.log("⚠️ Der er optaget i følgende tidsrum:");

            const formatter = new Intl.DateTimeFormat("da-DK", {
                timeStyle: "short",
                timeZone: "Europe/Copenhagen",
            });

            availability.conflicts.forEach((conflict, index) => {
                const start = new Date(conflict.start);
                const end = new Date(conflict.end);
                console.log(
                    `   ${index + 1}. ${formatter.format(start)} - ${formatter.format(end)}`
                );
            });
        }

        console.log("\n💡 Use 'npm run booking:next-slot <minutes>' to find next available time");
    } catch (err) {
        console.error("❌ Error checking availability:", err);
        logger.error({ err }, "Failed to check availability");
    }
}

async function findNextSlot(durationStr?: string): Promise<void> {
    const durationMinutes = durationStr ? parseInt(durationStr, 10) : 120;

    if (Number.isNaN(durationMinutes) || durationMinutes <= 0) {
        console.error("❌ Invalid duration. Use a positive number of minutes");
        return;
    }

    console.log(`\n🔎 Finding next available ${durationMinutes}-minute slot...\n`);

    try {
        const nextSlot = await findNextAvailableSlot(
            "primary",
            durationMinutes,
            new Date(),
            14 // Search next 14 days
        );

        if (!nextSlot) {
            console.log("❌ No available slots found in the next 14 days");
            return;
        }

        const formatter = new Intl.DateTimeFormat("da-DK", {
            dateStyle: "full",
            timeStyle: "short",
            timeZone: "Europe/Copenhagen",
        });

        const start = new Date(nextSlot.start);
        const end = new Date(nextSlot.end);

        console.log("✅ Next available slot:");
        console.log(`   🕐 Start: ${formatter.format(start)}`);
        console.log(`   🕑 End: ${formatter.format(end)}`);
        console.log(`   ⏱️  Duration: ${durationMinutes} minutes`);
        console.log("");
        console.log("💡 Copy these values to create a booking:");
        console.log(`   Start: ${nextSlot.start}`);
        console.log(`   End: ${nextSlot.end}`);
    } catch (err) {
        console.error("❌ Error finding next slot:", err);
        logger.error({ err }, "Failed to find next slot");
    }
}

async function checkSpecificSlot(startStr?: string, endStr?: string): Promise<void> {
    if (!startStr || !endStr) {
        console.error("❌ Usage: npm run booking:check-slot <start-iso> <end-iso>");
        console.log("Example: npm run booking:check-slot 2025-10-01T09:00:00Z 2025-10-01T11:00:00Z");
        return;
    }

    const start = new Date(startStr);
    const end = new Date(endStr);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        console.error("❌ Invalid date format. Use ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)");
        return;
    }

    console.log("\n🔍 Checking time slot availability...\n");

    try {
        const formatter = new Intl.DateTimeFormat("da-DK", {
            dateStyle: "full",
            timeStyle: "short",
            timeZone: "Europe/Copenhagen",
        });

        console.log(`   Start: ${formatter.format(start)}`);
        console.log(`   End: ${formatter.format(end)}`);
        console.log("");

        const availability = await isTimeSlotAvailable(
            "primary",
            start.toISOString(),
            end.toISOString()
        );

        if (availability.available) {
            console.log("✅ Time slot is available!");
        } else {
            console.log("❌ Time slot is NOT available");
            console.log("\nConflicts:");

            availability.conflicts.forEach((conflict, index) => {
                const conflictStart = new Date(conflict.start);
                const conflictEnd = new Date(conflict.end);
                console.log(
                    `   ${index + 1}. ${formatter.format(conflictStart)} - ${formatter.format(conflictEnd)}`
                );
            });
        }
    } catch (err) {
        console.error("❌ Error checking slot:", err);
        logger.error({ err }, "Failed to check specific slot");
    }
}

async function showBookingStats(): Promise<void> {
    console.log("\n📊 Booking Statistics\n");

    try {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const [pastWeek, nextWeek] = await Promise.all([
            listUpcomingEvents({
                timeMin: oneWeekAgo.toISOString(),
                timeMax: now.toISOString(),
                maxResults: 100,
            }),
            listUpcomingEvents({
                timeMin: now.toISOString(),
                timeMax: oneWeekFromNow.toISOString(),
                maxResults: 100,
            }),
        ]);

        console.log("📈 Last 7 days:");
        console.log(`   Total bookings: ${pastWeek.length}`);

        if (pastWeek.length > 0) {
            const totalMinutes = pastWeek.reduce((sum, event) => {
                const start = new Date(event.start).getTime();
                const end = new Date(event.end).getTime();
                return sum + (end - start) / (60 * 1000);
            }, 0);

            const avgMinutes = Math.round(totalMinutes / pastWeek.length);
            console.log(`   Total time: ${Math.round(totalMinutes / 60)} hours`);
            console.log(`   Average duration: ${avgMinutes} minutes`);
        }

        console.log("");
        console.log("📅 Next 7 days:");
        console.log(`   Upcoming bookings: ${nextWeek.length}`);

        if (nextWeek.length > 0) {
            const totalMinutes = nextWeek.reduce((sum, event) => {
                const start = new Date(event.start).getTime();
                const end = new Date(event.end).getTime();
                return sum + (end - start) / (60 * 1000);
            }, 0);

            console.log(`   Scheduled time: ${Math.round(totalMinutes / 60)} hours`);
        }

        console.log("");
        console.log("💡 Use 'npm run booking:list' to see all upcoming bookings");
    } catch (err) {
        console.error("❌ Error showing stats:", err);
        logger.error({ err }, "Failed to show booking stats");
    }
}

// Main CLI handler
async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case "list":
            await listUpcomingBookings();
            break;

        case "availability":
            await checkAvailability(args[1]);
            break;

        case "next-slot":
            await findNextSlot(args[1]);
            break;

        case "check-slot":
            await checkSpecificSlot(args[1], args[2]);
            break;

        case "stats":
            await showBookingStats();
            break;

        default:
            console.log("\n📅 Booking Management Tool\n");
            console.log("Usage: npm run booking:<command> [args]\n");
            console.log("Commands:");
            console.log("  list                      - List all upcoming bookings");
            console.log("  availability [date]       - Check availability (default: today)");
            console.log("  next-slot [minutes]       - Find next available slot (default: 120 min)");
            console.log("  check-slot <start> <end>  - Check if specific time slot is available");
            console.log("  stats                     - Show booking statistics");
            console.log("");
            console.log("Examples:");
            console.log("  npm run booking:list");
            console.log("  npm run booking:availability 2025-10-01");
            console.log("  npm run booking:next-slot 90");
            console.log("  npm run booking:check-slot 2025-10-01T09:00:00Z 2025-10-01T11:00:00Z");
            console.log("  npm run booking:stats");
    }
}

// Run CLI
main().catch((err) => {
    console.error("❌ Unexpected error:", err);
    logger.error({ err }, "CLI tool failed");
    process.exit(1);
});
