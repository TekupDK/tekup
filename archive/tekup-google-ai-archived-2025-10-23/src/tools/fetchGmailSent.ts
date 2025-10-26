import { google } from "googleapis";
import { getGoogleAuthClient } from "../services/googleAuth";
import { logger } from "../logger";

const gmailScopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify"
];

/**
 * Fetch sent emails from Gmail API
 */
async function fetchGmailSentEmails() {
    console.log("\n📧 Fetching Sent Emails from Gmail API\n");

    try {
        const auth = getGoogleAuthClient(gmailScopes);
        if (!auth) {
            console.error("❌ Failed to get Gmail auth client. Check .env credentials.");
            return;
        }

        const gmail = google.gmail({ version: "v1", auth });

        // Get today's date for query
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

        // Search for emails sent today
        const query = `in:sent after:${year}/${month}/${day}`;

        console.log(`🔍 Gmail Query: ${query}\n`);
        console.log("━".repeat(80));

        // List messages
        const response = await gmail.users.messages.list({
            userId: 'me',
            q: query,
            maxResults: 50
        });

        const messages = response.data.messages || [];

        if (messages.length === 0) {
            console.log("\n✅ No emails sent today from info@rendetalje.dk\n");

            // Check last 10 sent emails
            console.log("📊 Checking last 10 sent emails (any date)...\n");

            const recentResponse = await gmail.users.messages.list({
                userId: 'me',
                q: 'in:sent',
                maxResults: 10
            });

            const recentMessages = recentResponse.data.messages || [];

            if (recentMessages.length === 0) {
                console.log("No sent emails found at all.");
                return;
            }

            await processMessages(gmail, recentMessages, false);
            return;
        }

        console.log(`\n✅ Found ${messages.length} emails sent TODAY\n`);
        await processMessages(gmail, messages, true);

    } catch (error) {
        console.error("❌ Error fetching Gmail:", error);
        logger.error({ error }, "Failed to fetch Gmail sent emails");
    }
}

async function processMessages(gmail: any, messages: any[], isToday: boolean) {
    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];

        try {
            // Get full message
            const fullMessage = await gmail.users.messages.get({
                userId: 'me',
                id: msg.id,
                format: 'full'
            });

            const headers = fullMessage.data.payload?.headers || [];

            // Extract headers
            const to = headers.find((h: any) => h.name.toLowerCase() === 'to')?.value || 'Unknown';
            const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown';
            const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'No Subject';
            const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || 'Unknown';

            // Extract body
            let body = '';
            const payload = fullMessage.data.payload;

            if (payload?.parts) {
                // Multipart message
                for (const part of payload.parts) {
                    if (part.mimeType === 'text/plain' && part.body?.data) {
                        body = Buffer.from(part.body.data, 'base64').toString('utf-8');
                        break;
                    }
                }

                // If no text/plain, try text/html
                if (!body) {
                    for (const part of payload.parts) {
                        if (part.mimeType === 'text/html' && part.body?.data) {
                            const html = Buffer.from(part.body.data, 'base64').toString('utf-8');
                            // Simple HTML to text conversion
                            body = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                            break;
                        }
                    }
                }
            } else if (payload?.body?.data) {
                // Single part message
                body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
            }

            console.log(`\n${i + 1}. EMAIL (ID: ${msg.id})`);
            console.log(`━`.repeat(80));
            console.log(`   From: ${from}`);
            console.log(`   To: ${to}`);
            console.log(`   Date: ${date}`);
            console.log(`   Subject: ${subject}`);
            console.log(`\n   📄 FULL BODY:`);
            console.log(`   ${'-'.repeat(76)}`);

            if (body) {
                // Show full body with line breaks preserved
                const lines = body.split('\n');
                lines.forEach(line => {
                    console.log(`   ${line}`);
                });
            } else {
                console.log(`   [No text content found]`);
            }

            console.log(`   ${'-'.repeat(76)}`);
            console.log(`━`.repeat(80));

        } catch (error) {
            console.error(`❌ Error fetching message ${msg.id}:`, error);
        }
    }

    console.log(`\n\n📊 Summary:`);
    console.log(`   Total emails processed: ${messages.length}`);
    console.log(`   Period: ${isToday ? 'Today only' : 'Last 10 sent (any date)'}`);
}

fetchGmailSentEmails().catch(console.error);
