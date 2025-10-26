#!/usr/bin/env node

import { syncCalendar, getCalendarSyncStatus } from "../services/calendarSyncService";
import { logger } from "../logger";

/**
 * Calendar Synchronization CLI Tool
 * 
 * Commands:
 * - sync: Perform full calendar synchronization
 * - status: Show sync status
 * - google-to-db: Sync from Google Calendar to database
 * - db-to-google: Sync from database to Google Calendar
 */

async function performSync(options: any = {}): Promise<void> {
    console.log("\n🔄 Starting Calendar Synchronization\n");
    console.log("━".repeat(80));

    try {
        const result = await syncCalendar(options);

        if (result.success) {
            console.log("✅ Calendar synchronization completed successfully!");
            console.log("");
            console.log("📊 Results:");
            console.log(`   Events processed: ${result.eventsProcessed}`);
            console.log(`   Events created: ${result.eventsCreated}`);
            console.log(`   Events updated: ${result.eventsUpdated}`);
            console.log(`   Events deleted: ${result.eventsDeleted}`);
            console.log(`   Errors: ${result.errors.length}`);
            console.log(`   Processing time: ${result.lastSyncTime.toLocaleString("da-DK")}`);
            
            if (result.errors.length > 0) {
                console.log("");
                console.log("⚠️  Errors encountered:");
                result.errors.forEach((error, index) => {
                    console.log(`   ${index + 1}. ${error}`);
                });
            }
        } else {
            console.log("❌ Calendar synchronization failed!");
            console.log("");
            console.log("Errors:");
            result.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }

    } catch (error) {
        console.error("❌ Synchronization failed:", error);
        logger.error({ error }, "Calendar sync tool failed");
    }

    console.log("\n" + "━".repeat(80));
}

async function showStatus(): Promise<void> {
    console.log("\n📊 Calendar Synchronization Status\n");
    console.log("━".repeat(80));

    try {
        const status = await getCalendarSyncStatus();

        console.log("📅 Last Sync:");
        console.log(`   ${status.lastSync ? status.lastSync.toLocaleString("da-DK") : "Never"}`);
        console.log("");
        console.log("📈 Statistics:");
        console.log(`   Google Calendar events: ${status.totalEvents}`);
        console.log(`   Database bookings: ${status.totalBookings}`);
        console.log(`   Sync errors: ${status.syncErrors}`);
        console.log("");

        if (status.lastSync) {
            const timeSinceSync = Date.now() - status.lastSync.getTime();
            const hoursSinceSync = Math.floor(timeSinceSync / (1000 * 60 * 60));
            
            if (hoursSinceSync > 24) {
                console.log("⚠️  Warning: Last sync was more than 24 hours ago");
            } else if (hoursSinceSync > 1) {
                console.log("ℹ️  Last sync was " + hoursSinceSync + " hours ago");
            } else {
                console.log("✅ Calendar is up to date");
            }
        } else {
            console.log("⚠️  Warning: Calendar has never been synchronized");
        }

    } catch (error) {
        console.error("❌ Failed to get sync status:", error);
        logger.error({ error }, "Failed to get calendar sync status");
    }

    console.log("\n" + "━".repeat(80));
}

async function syncGoogleToDb(): Promise<void> {
    console.log("\n🔄 Syncing Google Calendar to Database\n");
    await performSync({ syncDirection: "google_to_db" });
}

async function syncDbToGoogle(): Promise<void> {
    console.log("\n🔄 Syncing Database to Google Calendar\n");
    await performSync({ syncDirection: "db_to_google" });
}

// Main CLI handler
async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const command = args[0];

    try {
        switch (command) {
            case "sync":
                await performSync();
                break;

            case "status":
                await showStatus();
                break;

            case "google-to-db":
                await syncGoogleToDb();
                break;

            case "db-to-google":
                await syncDbToGoogle();
                break;

            default:
                console.log("\n📅 Calendar Synchronization Tool\n");
                console.log("Usage: npm run calendar:sync <command> [options]\n");
                console.log("Commands:");
                console.log("  sync                    - Perform full bidirectional sync");
                console.log("  status                  - Show synchronization status");
                console.log("  google-to-db           - Sync from Google Calendar to database");
                console.log("  db-to-google           - Sync from database to Google Calendar");
                console.log("");
                console.log("Examples:");
                console.log("  npm run calendar:sync sync");
                console.log("  npm run calendar:sync status");
                console.log("  npm run calendar:sync google-to-db");
                console.log("  npm run calendar:sync db-to-google");
                console.log("");
                break;
        }
    } catch (error) {
        console.error("\n❌ Unexpected error:", error);
        logger.error({ error }, "Calendar sync tool failed");
        process.exit(1);
    }
}

// Run CLI
main().catch((err) => {
    console.error("❌ Fatal error:", err);
    logger.error({ err }, "Calendar sync tool fatal error");
    process.exit(1);
});
