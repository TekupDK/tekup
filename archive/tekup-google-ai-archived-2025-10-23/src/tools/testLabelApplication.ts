#!/usr/bin/env node
/**
 * Test Label Application Tool
 * 
 * Tests automatic label application after email actions
 */

import { applyEmailActionLabel } from "../services/emailResponseGenerator";
import { logger } from "../logger";

async function main() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log(`
📋 Test Label Application Tool

Usage:
  npm run label:test <threadId> <action>

Actions:
  - quote_sent: After sending quote to customer
  - booked: After booking confirmed
  - follow_up_needed: When follow-up is required
  - completed: After job finished

Examples:
  npm run label:test thread_abc123 quote_sent
  npm run label:test thread_xyz789 booked
        `);
        process.exit(1);
    }

    const [threadId, action] = args;

    // Validate action
    const validActions = ["quote_sent", "booked", "follow_up_needed", "completed"];
    if (!validActions.includes(action)) {
        console.error(`❌ Invalid action: ${action}`);
        console.error(`Valid actions: ${validActions.join(", ")}`);
        process.exit(1);
    }

    console.log(`\n🧪 Testing label application...`);
    console.log(`Thread ID: ${threadId}`);
    console.log(`Action: ${action}\n`);

    try {
        const success = await applyEmailActionLabel(
            threadId,
            action as "quote_sent" | "booked" | "follow_up_needed" | "completed",
            `CLI test: ${action}`
        );

        if (success) {
            console.log(`\n✅ SUCCESS: Label "${action}" applied to thread ${threadId}`);
        } else {
            console.log(`\n⚠️ FAILED: Could not apply label "${action}" to thread ${threadId}`);
        }
    } catch (error) {
        console.error(`\n❌ ERROR: ${error}`);
        process.exit(1);
    }
}

main().catch((error) => {
    logger.error({ error }, "Test failed");
    console.error(`\n❌ Test failed: ${error}`);
    process.exit(1);
});
