import { gmailService } from "../services/gmailService";
import { logger } from "../logger";

/**
 * Check emails sent from Gmail today
 */
async function checkGmailSentToday() {
    console.log("\n📧 Checking Emails Sent from Gmail Today\n");

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Search for sent emails today
        const query = `in:sent after:${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;

        console.log(`🔍 Gmail query: ${query}\n`);

        const messages = await gmailService.listMessages({
            query,
            maxResults: 50
        });

        if (!messages || messages.length === 0) {
            console.log("✅ No emails sent from Gmail today");
            return;
        }

        console.log(`📊 Found ${messages.length} sent emails\n`);
        console.log("━".repeat(80));

        for (const msg of messages) {
            // Message details are already included in listMessages response
            const to = msg.from || "Unknown";
            const subject = msg.subject || "No subject";
            const date = msg.internalDate || "Unknown";
            const body = msg.body || msg.snippet || "";

            console.log(`\n📧 EMAIL #${msg.id}`);
            console.log(`   To: ${to}`);
            console.log(`   Subject: ${subject}`);
            console.log(`   Date: ${date}`);
            console.log(`\n   Body Preview (first 500 chars):`);
            console.log(`   ${body.substring(0, 500)}`);
            console.log("\n" + "━".repeat(80));
        }

    } catch (error) {
        console.error("❌ Error checking Gmail:", error);
        logger.error({ error }, "Failed to check Gmail sent emails");
    }
}

checkGmailSentToday().catch(console.error);
