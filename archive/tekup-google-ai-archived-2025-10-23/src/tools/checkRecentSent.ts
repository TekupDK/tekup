import { listRecentMessages } from "../services/gmailService";
import { logger } from "../logger";

/**
 * Check recently sent emails using existing gmailService
 */
async function checkRecentEmails() {
    console.log("\n📧 Checking Recent Sent Emails via Gmail Service\n");
    console.log("━".repeat(80));

    try {
        // Use existing service that handles auth correctly
        const messages = await listRecentMessages({
            query: "in:sent",
            maxResults: 20
        });

        if (!messages || messages.length === 0) {
            console.log("\n✅ No sent emails found\n");
            return;
        }

        console.log(`\n✅ Found ${messages.length} recent sent emails\n`);
        console.log("━".repeat(80));

        messages.forEach((msg, index) => {
            console.log(`\n${index + 1}. EMAIL ID: ${msg.id}`);
            console.log(`   Thread: ${msg.threadId}`);
            console.log(`   From: ${msg.from || "Unknown"}`);
            console.log(`   Subject: ${msg.subject || "No Subject"}`);
            console.log(`   Date: ${msg.internalDate ? new Date(parseInt(msg.internalDate)).toLocaleString("da-DK") : "Unknown"}`);
            console.log(`\n   Snippet: ${msg.snippet || "No preview"}`);

            if (msg.body) {
                console.log(`\n   📄 FULL BODY:`);
                console.log(`   ${'-'.repeat(76)}`);
                const lines = msg.body.split('\n');
                lines.slice(0, 50).forEach(line => {  // First 50 lines
                    console.log(`   ${line}`);
                });
                if (lines.length > 50) {
                    console.log(`   ... (${lines.length - 50} more lines) ...`);
                }
                console.log(`   ${'-'.repeat(76)}`);
            }

            console.log(`\n${"━".repeat(80)}`);
        });

        console.log(`\n\n📊 Summary:`);
        console.log(`   Total emails: ${messages.length}`);
        console.log(`   Period: Last ${messages.length} sent emails (any date)`);

    } catch (error) {
        console.error("❌ Error checking emails:", error);
        logger.error({ error }, "Failed to check sent emails");
    }
}

checkRecentEmails().catch(console.error);
