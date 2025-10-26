#!/usr/bin/env node

/**
 * CONFLICT MANAGER CLI
 * 
 * Commands:
 *   scan         - Scan recent emails for conflicts
 *   list         - List all active conflicts
 *   escalate     - Manually escalate a lead to Jonas
 *   test         - Test conflict detection with samples
 *   stats        - Show conflict statistics
 * 
 * Usage:
 *   npm run conflict:scan
 *   npm run conflict:list
 *   npm run conflict:escalate <leadId>
 *   npm run conflict:test
 *   npm run conflict:stats
 */

import { analyzeEmailForConflict, getConflictSummary as _getConflictSummary, testConflictDetection } from "../services/conflictDetectionService";
import type { ConflictDetectionResult } from "../types/conflict";
import { getActiveConflicts, manuallyEscalateLead } from "../services/escalationService";
import { generateDeescalationResponse } from "../services/deescalationTemplates";
import { listRecentMessages } from "../services/gmailService";
import { logger } from "../logger";

const COMMANDS = ["scan", "list", "escalate", "test", "stats"] as const;
type Command = (typeof COMMANDS)[number];

async function main() {
    const command = process.argv[2] as Command;
    const args = process.argv.slice(3);

    if (!command || !COMMANDS.includes(command)) {
        console.error(`❌ Invalid command: ${command || "(none)"}`);
        console.log(`
🚨 RenOS CONFLICT MANAGER

Available commands:
  scan         - Scan recent emails for conflicts
  list         - List all active conflicts
  escalate     - Manually escalate a lead to Jonas
  test         - Test conflict detection with samples
  stats        - Show conflict statistics

Usage:
  npm run conflict:scan
  npm run conflict:list
  npm run conflict:escalate <leadId>
  npm run conflict:test
  npm run conflict:stats
        `);
        process.exit(1);
    }

    switch (command) {
        case "scan":
            await handleScan();
            break;
        case "list":
            await handleList();
            break;
        case "escalate":
            await handleEscalate(args[0]);
            break;
        case "test":
            handleTest();
            break;
        case "stats":
            await handleStats();
            break;
    }
}

/**
 * Scan recent emails for conflicts
 */
async function handleScan() {
    console.log("🔍 Scanning recent emails for conflicts...\n");

    try {
        // Get recent messages (last 50)
        const messages = await listRecentMessages({ maxResults: 50 });

        console.log(`📧 Analyzing ${messages.length} recent emails...\n`);

        let conflictCount = 0;
        const conflicts: Array<{ email: string; result: ConflictDetectionResult }> = [];

        for (const message of messages) {
            const emailText = message.body || message.snippet || "";
            const result = analyzeEmailForConflict(emailText);

            if (result.hasConflict) {
                conflictCount++;
                conflicts.push({
                    email: message.from || "Unknown",
                    result,
                });

                const emoji =
                    result.severity === "critical"
                        ? "🚨"
                        : result.severity === "high"
                            ? "⚠️"
                            : result.severity === "medium"
                                ? "⚡"
                                : "💡";

                console.log(
                    `${emoji} CONFLICT DETECTED - ${result.severity.toUpperCase()}`
                );
                console.log(`   From:     ${message.from || "Unknown"}`);
                console.log(`   Subject:  ${message.subject || "No subject"}`);
                console.log(`   Score:    ${result.score}`);
                console.log(
                    `   Keywords: ${result.matchedKeywords.map((k) => k.keyword).join(", ")}`
                );
                console.log(`   Action:   ${result.recommendedAction}`);
                console.log("");
            }
        }

        console.log("═══════════════════════════════════════");
        console.log(`📊 SCAN RESULTS`);
        console.log("═══════════════════════════════════════");
        console.log(`Total emails:  ${messages.length}`);
        console.log(`Conflicts:     ${conflictCount}`);
        console.log(
            `Conflict rate: ${messages.length > 0 ? ((conflictCount / messages.length) * 100).toFixed(1) : 0}%`
        );
        console.log("═══════════════════════════════════════");

        if (conflictCount > 0) {
            console.log("\n⚠️  ACTION REQUIRED:");
            console.log(
                `   ${conflictCount} email(s) contain conflict indicators`
            );
            console.log("   Review these emails carefully");
            console.log("   Consider manual escalation for high/critical cases");
        } else {
            console.log("\n✅ No conflicts detected in recent emails");
        }
    } catch (error) {
        console.error("❌ Error scanning emails:", error);
        logger.error({ error }, "Failed to scan emails for conflicts");
        process.exit(1);
    }
}

/**
 * List all active conflicts
 */
async function handleList() {
    console.log("📋 Active conflicts...\n");

    try {
        const conflicts = await getActiveConflicts();

        if (conflicts.length === 0) {
            console.log("✅ No active conflicts");
            return;
        }

        console.log(`Found ${conflicts.length} active conflict(s):\n`);

        for (const conflict of conflicts) {
            console.log(`🚨 ${conflict.customerName || conflict.customerEmail}`);
            console.log(`   Email:    ${conflict.customerEmail}`);
            console.log(`   Lead ID:  ${conflict.leadId}`);
            console.log(`   Thread:   ${conflict.threadId}`);
            console.log(
                `   Created:  ${conflict.createdAt.toLocaleString("da-DK")}`
            );
            console.log("");
        }

        console.log("💡 TIP: Review these in Gmail with 'conflict' label");
        console.log(
            "💡 TIP: Use 'npm run conflict:escalate <leadId>' to escalate manually"
        );
    } catch (error) {
        console.error("❌ Error listing conflicts:", error);
        logger.error({ error }, "Failed to list conflicts");
        process.exit(1);
    }
}

/**
 * Manually escalate a lead
 */
async function handleEscalate(leadId?: string) {
    if (!leadId) {
        console.error("❌ Lead ID required");
        console.log("\nUsage: npm run conflict:escalate <leadId>");
        process.exit(1);
    }

    console.log(`📤 Escalating lead ${leadId} to Jonas...\n`);

    try {
        const notification = await manuallyEscalateLead(leadId);

        console.log("✅ Escalation successful!\n");
        console.log("═══════════════════════════════════════");
        console.log("📧 ESCALATION NOTIFICATION");
        console.log("═══════════════════════════════════════");
        console.log(`Customer:     ${notification.customerName}`);
        console.log(`Email:        ${notification.customerEmail}`);
        console.log(`Severity:     ${notification.severity.toUpperCase()}`);
        console.log(`Score:        ${notification.conflictScore}`);
        console.log(
            `Escalated:    ${notification.escalatedAt.toLocaleString("da-DK")}`
        );
        console.log(
            `Jonas notified: ${notification.jonasNotified ? "✅ Yes" : "❌ No"}`
        );
        console.log("═══════════════════════════════════════");

        if (notification.jonasNotified) {
            console.log("\n✅ Jonas has been notified via email");
        } else {
            console.log("\n⚠️  Notification failed - contact Jonas manually");
        }
    } catch (error) {
        console.error("❌ Error escalating lead:", error);
        logger.error({ error, leadId }, "Failed to escalate lead");
        process.exit(1);
    }
}

/**
 * Test conflict detection
 */
function handleTest() {
    console.log("🧪 Testing conflict detection...\n");

    const testResults = testConflictDetection();

    console.log("═══════════════════════════════════════");
    console.log("🧪 CONFLICT DETECTION TESTS");
    console.log("═══════════════════════════════════════\n");

    for (let i = 0; i < testResults.length; i++) {
        const { test, result } = testResults[i];

        const emoji =
            result.severity === "critical"
                ? "🚨"
                : result.severity === "high"
                    ? "⚠️"
                    : result.severity === "medium"
                        ? "⚡"
                        : result.severity === "low"
                            ? "💡"
                            : "✅";

        console.log(`${emoji} TEST ${i + 1}: ${result.severity || "none"}`);
        console.log(`   Input:  "${test}"`);
        console.log(`   Score:  ${result.score}`);

        if (result.hasConflict) {
            console.log(
                `   Keywords: ${result.matchedKeywords.map((k) => k.keyword).join(", ")}`
            );
            console.log(`   Action: ${result.recommendedAction}`);

            // Generate sample response
            const response = generateDeescalationResponse(
                "Test Kunde",
                result.severity
            );
            console.log(`   Response: ${response.subject}`);
        } else {
            console.log("   Result: No conflict");
        }

        console.log("");
    }

    console.log("═══════════════════════════════════════");
    console.log("✅ All tests completed");
}

/**
 * Show conflict statistics
 */
async function handleStats() {
    console.log("📊 Conflict statistics...\n");

    try {
        const conflicts = await getActiveConflicts();

        const now = new Date();
        const last24h = conflicts.filter(
            (c) =>
                now.getTime() - c.createdAt.getTime() < 24 * 60 * 60 * 1000
        ).length;
        const last7d = conflicts.filter(
            (c) =>
                now.getTime() - c.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000
        ).length;

        console.log("═══════════════════════════════════════");
        console.log("📊 CONFLICT STATISTICS");
        console.log("═══════════════════════════════════════\n");

        console.log(`Total active conflicts: ${conflicts.length}`);
        console.log(`Last 24 hours:          ${last24h}`);
        console.log(`Last 7 days:            ${last7d}`);
        console.log("");

        if (conflicts.length > 0) {
            console.log("📅 Recent conflicts:");
            conflicts.slice(0, 5).forEach((c) => {
                console.log(
                    `   • ${c.customerName || c.customerEmail} (${c.createdAt.toLocaleDateString("da-DK")})`
                );
            });
        } else {
            console.log("✅ No active conflicts - great job!");
        }

        console.log("\n═══════════════════════════════════════");
    } catch (error) {
        console.error("❌ Error fetching statistics:", error);
        logger.error({ error }, "Failed to fetch conflict statistics");
        process.exit(1);
    }
}

// Run CLI
main().catch((error) => {
    console.error("❌ Fatal error:", error);
    logger.error({ error }, "Fatal error in conflict manager");
    process.exit(1);
});
