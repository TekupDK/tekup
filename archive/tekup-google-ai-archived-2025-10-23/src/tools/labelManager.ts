/**
 * Label Management CLI Tool
 * 
 * Usage:
 *  npm run label:init              # Create all labels in Gmail
 *  npm run label:list              # List all RenOS labels
 *  npm run label:apply <threadId> <label>  # Apply label to thread
 *  npm run label:status <threadId>          # Get thread label status
 *  npm run label:threads <label>            # Get all threads with label
 *  npm run label:sync              # Sync labels between Gmail and DB
 */

import {
    ensureLabelsExist,
    applyLabelToThread,
    getThreadLabelStatus,
    getThreadsByLabel,
    syncLabelsWithDatabase,
} from "../services/labelService";
import {
    getAllLabels,
    getLabelConfig,
    type LeadStatusLabel,
} from "../types/labels";
import { logger } from "../logger";

async function main() {
    const command = process.argv[2];

    if (!command) {
        console.log(`
📋 LABEL MANAGEMENT COMMANDS
═════════════════════════════════════════════════════

Commands:
  init                          Create all RenOS labels in Gmail
  list                          List all RenOS label definitions
  apply <threadId> <label>      Apply label to a Gmail thread
  status <threadId>             Get current label status for thread
  threads <label>               Get all threads with a specific label
  sync                          Sync labels between Gmail and database

Examples:
  npm run label:init
  npm run label:list
  npm run label:apply 18f123abc new_lead
  npm run label:status 18f123abc
  npm run label:threads quote_sent
  npm run label:sync
        `.trim());
        process.exit(0);
    }

    try {
        switch (command) {
            case "init":
                await handleInit();
                break;

            case "list":
                handleList();
                break;

            case "apply":
                await handleApply();
                break;

            case "status":
                await handleStatus();
                break;

            case "threads":
                await handleThreads();
                break;

            case "sync":
                await handleSync();
                break;

            default:
                console.error(`❌ Unknown command: ${command}`);
                process.exit(1);
        }

        process.exit(0);
    } catch (error) {
        logger.error({ error, command }, "Label management command failed");
        console.error("\n❌ Error:", error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

/**
 * Initialize all labels in Gmail
 */
async function handleInit() {
    console.log("\n🏷️  Initializing RenOS Labels in Gmail...\n");
    console.log("=".repeat(60));

    const labelMap = await ensureLabelsExist();

    console.log("\n✅ All labels verified/created:\n");

    for (const [labelName, labelId] of labelMap.entries()) {
        const config = getLabelConfig(labelName);
        console.log(`  ${config.displayName}`);
        console.log(`    ID: ${labelId}`);
        console.log(`    Status: ${labelName}`);
        console.log(`    Description: ${config.description}`);
        console.log();
    }

    console.log("=".repeat(60));
    console.log(`\n✅ Success! Created/verified ${labelMap.size} labels\n`);
}

/**
 * List all label definitions
 */
function handleList() {
    console.log("\n📋 RenOS LABEL WORKFLOW\n");
    console.log("=".repeat(60));

    const labels = getAllLabels();

    for (const labelName of labels) {
        const config = getLabelConfig(labelName);

        console.log(`\n${config.displayName}`);
        console.log(`  Status: ${labelName}`);
        console.log(`  Description: ${config.description}`);
        console.log(`  Color: ${config.color.backgroundColor}`);

        if (config.nextStates.length > 0) {
            console.log(`  Next States: ${config.nextStates.join(", ")}`);
        } else {
            console.log(`  Next States: [Terminal State]`);
        }
    }

    console.log("\n" + "=".repeat(60));
    console.log("\nWORKFLOW:");
    console.log("new_lead → quote_sent → awaiting_response → booked → completed");
    console.log("                              ↓");
    console.log("                       follow_up_needed");
    console.log();
}

/**
 * Apply label to thread
 */
async function handleApply() {
    const threadId = process.argv[3];
    const label = process.argv[4] as LeadStatusLabel;

    if (!threadId || !label) {
        console.error("❌ Usage: npm run label:apply <threadId> <label>");
        console.error("   Example: npm run label:apply 18f123abc quote_sent");
        process.exit(1);
    }

    // Validate label
    const allLabels = getAllLabels();
    if (!allLabels.includes(label)) {
        console.error(`❌ Invalid label: ${label}`);
        console.error(`   Valid labels: ${allLabels.join(", ")}`);
        process.exit(1);
    }

    console.log(`\n🏷️  Applying label to thread...\n`);
    console.log("=".repeat(60));
    console.log(`Thread ID: ${threadId}`);
    console.log(`Label: ${label}`);
    console.log("=".repeat(60));

    const result = await applyLabelToThread(threadId, label, "CLI manual apply");

    if (result.success) {
        console.log("\n✅ Label applied successfully!");
        console.log(`   Label ID: ${result.labelId}`);
        console.log(`   Thread ID: ${result.threadId}`);
    } else {
        console.error(`\n❌ Failed to apply label: ${result.error}`);
        process.exit(1);
    }
}

/**
 * Get thread label status
 */
async function handleStatus() {
    const threadId = process.argv[3];

    if (!threadId) {
        console.error("❌ Usage: npm run label:status <threadId>");
        console.error("   Example: npm run label:status 18f123abc");
        process.exit(1);
    }

    console.log(`\n📊 Thread Label Status\n`);
    console.log("=".repeat(60));
    console.log(`Thread ID: ${threadId}`);
    console.log("=".repeat(60));

    const status = await getThreadLabelStatus(threadId);

    if (status.currentLabel) {
        const config = getLabelConfig(status.currentLabel);
        console.log(`\nCurrent Label: ${config.displayName}`);
        console.log(`  Status: ${status.currentLabel}`);
        console.log(`  Description: ${config.description}`);

        if (config.nextStates.length > 0) {
            console.log(`\nValid Next States:`);
            for (const nextState of config.nextStates) {
                const nextConfig = getLabelConfig(nextState);
                console.log(`  • ${nextConfig.displayName} (${nextState})`);
            }
        } else {
            console.log(`\nThis is a terminal state (no further transitions)`);
        }
    } else {
        console.log(`\n⚠️  No RenOS status label found on this thread`);
    }

    if (status.hasMultipleStatusLabels) {
        console.log(`\n⚠️  WARNING: Thread has multiple status labels (should only have one)`);
    }

    console.log(`\nAll Labels: ${status.allLabels.length} total`);
}

/**
 * Get threads with label
 */
async function handleThreads() {
    const label = process.argv[3] as LeadStatusLabel;

    if (!label) {
        console.error("❌ Usage: npm run label:threads <label>");
        console.error("   Example: npm run label:threads quote_sent");
        process.exit(1);
    }

    // Validate label
    const allLabels = getAllLabels();
    if (!allLabels.includes(label)) {
        console.error(`❌ Invalid label: ${label}`);
        console.error(`   Valid labels: ${allLabels.join(", ")}`);
        process.exit(1);
    }

    const config = getLabelConfig(label);

    console.log(`\n📊 Threads with Label: ${config.displayName}\n`);
    console.log("=".repeat(60));

    const threadIds = await getThreadsByLabel(label);

    if (threadIds.length === 0) {
        console.log("\n⚠️  No threads found with this label");
    } else {
        console.log(`\nFound ${threadIds.length} threads:\n`);
        for (const threadId of threadIds.slice(0, 20)) {
            console.log(`  • ${threadId}`);
        }

        if (threadIds.length > 20) {
            console.log(`\n  ... and ${threadIds.length - 20} more`);
        }
    }

    console.log("\n" + "=".repeat(60));
}

/**
 * Sync labels between Gmail and database
 */
async function handleSync() {
    console.log(`\n🔄 Syncing Labels between Gmail and Database...\n`);
    console.log("=".repeat(60));

    await syncLabelsWithDatabase();

    console.log("\n" + "=".repeat(60));
    console.log("\n✅ Sync complete!\n");
}

// Run main
void main();
