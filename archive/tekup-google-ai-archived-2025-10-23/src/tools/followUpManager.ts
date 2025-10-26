#!/usr/bin/env node

/**
 * FOLLOW-UP MANAGER CLI
 * 
 * Commands:
 *   check     - List all leads needing follow-up
 *   send      - Send follow-ups (dry-run by default)
 *   send-live - Send follow-ups (LIVE MODE)
 *   stats     - Show follow-up statistics
 * 
 * Usage:
 *   npm run follow:check
 *   npm run follow:send
 *   npm run follow:send-live
 *   npm run follow:stats
 */

import {
    findLeadsNeedingFollowUp,
    sendAllFollowUps,
    getFollowUpStatistics
} from "../services/followUpService";
import { logger } from "../logger";

const COMMANDS = ["check", "send", "send-live", "stats"] as const;
type Command = (typeof COMMANDS)[number];

async function main() {
    const command = process.argv[2] as Command;

    if (!command || !COMMANDS.includes(command)) {
        console.error(`❌ Invalid command: ${command || "(none)"}`);
        console.log(`
📧 RenOS FOLLOW-UP MANAGER

Available commands:
  check      - List all leads needing follow-up
  send       - Send follow-ups (DRY-RUN mode)
  send-live  - Send follow-ups (LIVE mode - actually sends emails)
  stats      - Show follow-up statistics

Usage:
  npm run follow:check
  npm run follow:send
  npm run follow:send-live
  npm run follow:stats
        `);
        process.exit(1);
    }

    switch (command) {
        case "check":
            await handleCheck();
            break;
        case "send":
            await handleSend(true); // Dry-run mode
            break;
        case "send-live":
            await handleSend(false); // Live mode
            break;
        case "stats":
            await handleStats();
            break;
    }
}

/**
 * Check which leads need follow-up
 */
async function handleCheck() {
    console.log("🔍 Checking for leads needing follow-up...\n");

    try {
        const leads = await findLeadsNeedingFollowUp();

        if (leads.length === 0) {
            console.log("✅ No leads need follow-up at this time");
            return;
        }

        console.log(`📋 Found ${leads.length} lead(s) needing follow-up:\n`);

        for (const lead of leads) {
            const attemptEmoji = lead.nextAttemptNumber === 1 ? "🥇" :
                lead.nextAttemptNumber === 2 ? "🥈" : "🥉";

            console.log(`${attemptEmoji} LEAD: ${lead.customerName}`);
            console.log(`   Email:    ${lead.customerEmail}`);
            console.log(`   ThreadId: ${lead.emailThreadId || "N/A"}`);
            console.log(`   Days:     ${lead.daysSinceLastEmail} dage siden sidste email`);
            console.log(`   Attempt:  #${lead.nextAttemptNumber} af 3`);
            console.log(`   Last:     ${lead.lastEmailDate.toLocaleString("da-DK")}`);
            console.log(`   Reason:   ${lead.reason}`);
            console.log("");
        }

        console.log("💡 TIP: Use 'npm run follow:send' to send follow-ups (dry-run)");
        console.log("⚠️  WARNING: Use 'npm run follow:send-live' to ACTUALLY send emails");

    } catch (error) {
        console.error("❌ Error checking for follow-ups:", error);
        logger.error({ error }, "Failed to check for follow-ups");
        process.exit(1);
    }
}

/**
 * Send follow-ups (with dry-run option)
 */
async function handleSend(dryRun: boolean) {
    const mode = dryRun ? "DRY-RUN" : "LIVE";
    console.log(`📧 Sending follow-ups (${mode} mode)...\n`);

    if (!dryRun) {
        console.log("⚠️  WARNING: LIVE MODE ENABLED - EMAILS WILL BE SENT!");
        console.log("Press Ctrl+C within 3 seconds to cancel...\n");
        await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    try {
        const results = await sendAllFollowUps(dryRun);

        if (results.length === 0) {
            console.log("✅ No follow-ups needed at this time");
            return;
        }

        console.log(`\n📊 RESULTS (${results.length} follow-ups):\n`);

        let successCount = 0;
        let queuedCount = 0;
        let failedCount = 0;

        for (const result of results) {
            const emoji = result.sent && !result.error ? "✅" :
                !result.sent && !result.error ? "⏳" : "❌";

            console.log(`${emoji} ${result.customerEmail}`);
            console.log(`   Status:   ${result.sent ? "Sent" : "Failed"}`);
            console.log(`   Attempt:  #${result.attemptNumber}`);

            if (result.error) {
                console.log(`   Error:    ${result.error}`);
            }

            if (result.nextFollowUpDate) {
                console.log(`   Next:     ${result.nextFollowUpDate.toLocaleString("da-DK")}`);
            }

            if (dryRun) {
                console.log(`   [DRY-RUN] Email would be sent`);
            }

            console.log("");

            if (result.sent && !result.error) successCount++;
            if (!result.sent && !result.error) queuedCount++;
            if (result.error) failedCount++;
        }

        console.log("═══════════════════════════════════════");
        console.log(`✅ Success: ${successCount}`);
        console.log(`⏳ Queued:  ${queuedCount}`);
        console.log(`❌ Failed:  ${failedCount}`);
        console.log("═══════════════════════════════════════");

        if (dryRun) {
            console.log("\n💡 TIP: Use 'npm run follow:send-live' to actually send these emails");
        } else {
            console.log("\n✅ Follow-ups sent successfully!");
        }

    } catch (error) {
        console.error("❌ Error sending follow-ups:", error);
        logger.error({ error }, "Failed to send follow-ups");
        process.exit(1);
    }
}

/**
 * Show follow-up statistics
 */
async function handleStats() {
    console.log("📊 Follow-up statistics...\n");

    try {
        const stats = await getFollowUpStatistics();

        console.log("═══════════════════════════════════════");
        console.log("📧 FOLLOW-UP STATISTICS");
        console.log("═══════════════════════════════════════");
        console.log("");

        console.log(`📥 Total Leads Awaiting Response: ${stats.awaitingResponse}`);
        console.log(`🔔 Leads Needing Follow-up:       ${stats.needsFollowUp}`);
        console.log("");

        console.log("📈 Breakdown by Attempt Number:");
        console.log(`   🥇 Attempt 1 (Day 5):  ${stats.attempt1} leads`);
        console.log(`   🥈 Attempt 2 (Day 10): ${stats.attempt2} leads`);
        console.log(`   🥉 Attempt 3 (Day 15): ${stats.attempt3} leads`);
        console.log(`   🛑 Max Attempts:       ${stats.maxAttemptsReached} leads`);
        console.log("");

        const conversionRate = stats.awaitingResponse > 0
            ? ((stats.awaitingResponse - stats.needsFollowUp) / stats.awaitingResponse * 100).toFixed(1)
            : "0.0";

        console.log(`💡 Response Rate: ${conversionRate}% of leads responded before follow-up needed`);
        console.log("");

        if (stats.needsFollowUp > 0) {
            console.log("⚡ ACTION NEEDED:");
            console.log(`   ${stats.needsFollowUp} leads are ready for follow-up`);
            console.log(`   Run: npm run follow:send (dry-run) or npm run follow:send-live`);
        } else {
            console.log("✅ All leads are up-to-date - no follow-ups needed");
        }

        console.log("═══════════════════════════════════════");

    } catch (error) {
        console.error("❌ Error fetching statistics:", error);
        logger.error({ error }, "Failed to fetch follow-up statistics");
        process.exit(1);
    }
}

// Run CLI
main().catch((error) => {
    console.error("❌ Fatal error:", error);
    logger.error({ error }, "Fatal error in follow-up manager");
    process.exit(1);
});
