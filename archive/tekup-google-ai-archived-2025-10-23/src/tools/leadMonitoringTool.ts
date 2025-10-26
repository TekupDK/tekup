#!/usr/bin/env ts-node

/**
 * Lead Monitoring Test Tool
 *
 * Usage:
 *   npm run leads:check      - Check for new leads once
 *   npm run leads:monitor    - Start monitoring (runs every 20 min)
 *   npm run leads:list       - List all stored leads
 */

import {
    checkForNewLeads,
    startLeadMonitoring,
    getLeads,
    getMonitoringStats,
} from "../services/leadMonitor";
import { logger } from "../logger";

const command = process.argv[2] || "check";

async function checkOnce(): Promise<void> {
    console.log("🔍 Checking for new Leadmail.no leads...\n");

    const newLeads = await checkForNewLeads();

    if (newLeads.length === 0) {
        console.log("✅ No new leads found\n");
    } else {
        console.log(`✅ Found ${newLeads.length} new lead(s):\n`);

        for (const lead of newLeads) {
            console.log("─".repeat(80));
            console.log(`📧 Lead ID: ${lead.emailId}`);
            console.log(`👤 Name: ${lead.name || "Unknown"}`);
            console.log(`📍 Source: ${lead.source}`);
            console.log(`🏠 Task Type: ${lead.taskType || "Not specified"}`);
            console.log(`📐 Property: ${lead.propertyType || "Unknown"}`);
            if (lead.squareMeters) {
                console.log(`📏 Size: ${lead.squareMeters} m²`);
            }
            if (lead.address) {
                console.log(`🗺️  Address: ${lead.address}`);
            }
            if (lead.email) {
                console.log(`✉️  Email: ${lead.email}`);
            }
            if (lead.phone) {
                console.log(`📞 Phone: ${lead.phone}`);
            }
            console.log(`⏰ Received: ${lead.receivedAt.toLocaleString("da-DK")}`);
            console.log("─".repeat(80));
            console.log();
        }
    }

    const stats = getMonitoringStats();
    console.log("📊 Statistics:");
    console.log(`   Total leads stored: ${stats.totalLeads}`);
    console.log(`   Processed email IDs: ${stats.processedEmailIds}`);
    console.log();
}

function startMonitoring(): Promise<never> {
    console.log("🚀 Starting Lead Monitoring Service...\n");
    console.log("📅 Schedule: Every 20 minutes");
    console.log("📧 Watching for: Leadmail.no emails");
    console.log("🔔 Notifications: Enabled\n");

    const task = startLeadMonitoring("*/20 * * * *");

    console.log("✅ Monitoring started successfully!");
    console.log("Press Ctrl+C to stop...\n");

    // Keep the process running
    process.on("SIGINT", () => {
        console.log("\n\n🛑 Stopping lead monitoring...");
        void task.stop();
        console.log("✅ Monitoring stopped");
        process.exit(0);
    });

    // Return a never-resolving promise to keep process alive
    return new Promise<never>(() => { /* keep alive */ });
}

function listLeads(): void {
    console.log("📋 All Stored Leads:\n");

    const leads = getLeads();

    if (leads.length === 0) {
        console.log("No leads found. Run 'npm run leads:check' first.\n");
        return;
    }

    console.log(`Total: ${leads.length} lead(s)\n`);

    for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        console.log(`${i + 1}. ${lead.name || "Unknown"} - ${lead.source}`);
        console.log(`   ${lead.taskType || "No task type"}`);
        console.log(`   Received: ${lead.receivedAt.toLocaleString("da-DK")}`);
        console.log();
    }

    const stats = getMonitoringStats();
    console.log("📊 Statistics:");
    console.log(`   Total leads: ${stats.totalLeads}`);
    console.log(`   Processed emails: ${stats.processedEmailIds}`);
    console.log();
}

async function main(): Promise<void> {
    try {
        switch (command) {
            case "check":
                await checkOnce();
                process.exit(0);
                break;
            case "monitor":
                await startMonitoring();
                break;
            case "list":
                listLeads();
                process.exit(0);
                break;
            default:
                console.log("Unknown command. Use: check, monitor, or list");
                process.exit(1);
        }
    } catch (err) {
        logger.error({ err }, "Lead monitoring tool failed");
        console.error("\n❌ Error:", err);
        process.exit(1);
    }
}

void main().catch((err) => {
    logger.error({ err }, "Lead monitoring tool failed");
    console.error("\n❌ Error:", err);
    process.exit(1);
});
