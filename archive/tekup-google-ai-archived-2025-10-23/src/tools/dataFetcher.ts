#!/usr/bin/env node
/**
 * Data Fetcher Tool
 * 
 * CLI tool to fetch and display Gmail messages and Calendar events
 * for better context and testing purposes.
 * 
 * Usage:
 *   npm run data:fetch
 *   npm run data:fetch gmail
 *   npm run data:fetch calendar
 */

import { logger } from "../logger";
import { listRecentMessages } from "../services/gmailService";
import { listUpcomingEvents } from "../services/calendarService";
import { googleConfig } from "../config";

interface FetchOptions {
    service?: "gmail" | "calendar" | "all";
    maxResults?: number;
}

async function fetchGmailData(maxResults: number = 10): Promise<void> {
    logger.info("📧 Fetching Gmail messages...");

    try {
        const messages = await listRecentMessages({ maxResults });

        if (messages.length === 0) {
            logger.info("No messages found.");
            return;
        }

        logger.info(`Found ${messages.length} messages:\n`);

        for (const msg of messages) {
            console.log("─".repeat(80));
            console.log(`ID: ${msg.id}`);
            console.log(`Thread: ${msg.threadId}`);
            console.log(`From: ${msg.from || "N/A"}`);
            console.log(`Subject: ${msg.subject || "N/A"}`);
            console.log(`Date: ${msg.internalDate || "N/A"}`);
            console.log(`Snippet: ${msg.snippet}`);
            console.log();
        }

        console.log("─".repeat(80));
    } catch (error) {
        logger.error({ err: error }, "Failed to fetch Gmail messages");
        throw error;
    }
}

async function fetchCalendarData(maxResults: number = 10): Promise<void> {
    logger.info("📅 Fetching Calendar events...");

    try {
        const now = new Date();
        const future = new Date(now);
        future.setDate(now.getDate() + 30); // Next 30 days

        const events = await listUpcomingEvents({
            timeMin: now.toISOString(),
            timeMax: future.toISOString(),
            maxResults,
        });

        // Guard against null/undefined
        if (!events || events.length === 0) {
            logger.info("No upcoming events found.");
            return;
        }

        logger.info(`Found ${events.length} upcoming events:\n`);

        for (const event of events) {
            console.log("─".repeat(80));
            console.log(`ID: ${event.id}`);
            console.log(`Summary: ${event.summary}`);
            console.log(`Start: ${event.start || "N/A"}`);
            console.log(`End: ${event.end || "N/A"}`);
            if (event.location) {
                console.log(`Location: ${event.location}`);
            }
            console.log();
        }

        console.log("─".repeat(80));
    } catch (error) {
        logger.error({ err: error }, "Failed to fetch Calendar events");
        throw error;
    }
}

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const service = (args[0] as FetchOptions["service"]) || "all";

    // Parse maxResults with proper validation to prevent NaN
    let maxResults = 10; // default
    if (args[1]) {
        const parsed = parseInt(args[1], 10);
        if (!isNaN(parsed) && parsed > 0) {
            maxResults = parsed;
        } else {
            logger.warn({ input: args[1] }, "Invalid maxResults value, using default: 10");
        }
    }

    logger.info({
        service,
        maxResults,
        runMode: googleConfig.RUN_MODE,
    }, "Starting data fetch");

    console.log("\n🔍 RenOS Data Fetcher\n");
    console.log(`Mode: ${googleConfig.RUN_MODE.toUpperCase()}`);
    console.log(`Service: ${service}`);
    console.log(`Max Results: ${maxResults}\n`);

    try {
        if (service === "gmail" || service === "all") {
            await fetchGmailData(maxResults);
            console.log();
        }

        if (service === "calendar" || service === "all") {
            await fetchCalendarData(maxResults);
            console.log();
        }

        logger.info("✅ Data fetch complete");
        process.exit(0);
    } catch (error) {
        logger.error({ err: error }, "❌ Data fetch failed");
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    main().catch((error) => {
        logger.error({ err: error }, "Fatal error in data fetcher");
        process.exit(1);
    });
}

export { fetchGmailData, fetchCalendarData };
