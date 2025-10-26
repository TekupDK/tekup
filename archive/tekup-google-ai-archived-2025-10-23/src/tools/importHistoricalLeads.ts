import { listRecentMessages } from "../services/gmailService";
import { isLeadmailEmail, parseLeadEmail } from "../services/leadParser";
import { prisma } from "../services/databaseService";
import { findOrCreateCustomer, updateCustomerStats } from "../services/customerService";
import { logger } from "../logger";

/**
 * Import historical leads from Gmail (from July 2024 to now)
 * This will fetch all Leadmail.no emails and save them to the database
 */
async function importHistoricalLeads(): Promise<void> {
    console.log("\n🔄 Starting Historical Lead Import\n");
    console.log("━".repeat(80));

    try {
        // Calculate date range (from July 1, 2024 to now)
        const startDate = new Date("2024-07-01");
        const endDate = new Date();

        console.log(`📅 Fetching emails from ${startDate.toLocaleDateString('da-DK')} to ${endDate.toLocaleDateString('da-DK')}...\n`);

        // Fetch emails with Leadmail.no filter
        // Limit to max 500 to avoid overwhelming the system
        const maxResults = 500;

        console.log(`🔍 Fetching up to ${maxResults} Leadmail.no emails...\n`);

        // Fetch messages with proper Gmail query
        const messages = await listRecentMessages({
            maxResults,
            query: "from:leadmail.no OR from:Leadmail.no"
        });

        const allMessages = messages || [];

        console.log(`\n✅ Total emails fetched: ${allMessages.length}\n`);

        if (allMessages.length === 0) {
            console.log("⚠️  No Leadmail.no emails found");
            return;
        }

        // Process each email
        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const message of allMessages) {
            try {
                // Check if it's a Leadmail email
                if (!isLeadmailEmail(message)) {
                    skipCount++;
                    continue;
                }

                // Parse the lead
                const parsedLead = parseLeadEmail(message);
                if (!parsedLead) {
                    console.log(`⚠️  Failed to parse email ${message.id}`);
                    errorCount++;
                    continue;
                }

                // Check if lead already exists (by email thread ID)
                const existingLead = await prisma.lead.findFirst({
                    where: { emailThreadId: parsedLead.threadId }
                });

                if (existingLead) {
                    skipCount++;
                    continue; // Skip duplicates
                }

                // Create or find customer if email exists
                let customerId: string | undefined;
                if (parsedLead.email && parsedLead.name) {
                    const customer = await findOrCreateCustomer(parsedLead.email, parsedLead.name);
                    customerId = customer.id;
                }

                // Create lead in database
                const lead = await prisma.lead.create({
                    data: {
                        customerId,
                        source: parsedLead.source,
                        name: parsedLead.name,
                        email: parsedLead.email,
                        phone: parsedLead.phone,
                        address: parsedLead.address,
                        squareMeters: parsedLead.squareMeters,
                        rooms: parsedLead.rooms,
                        taskType: parsedLead.taskType,
                        preferredDates: parsedLead.preferredDates || [],
                        status: "new",
                        emailThreadId: parsedLead.threadId,
                        createdAt: parsedLead.receivedAt,
                    },
                });

                // Update customer statistics
                if (customerId) {
                    await updateCustomerStats(customerId);
                }

                successCount++;
                console.log(`✅ Imported: ${parsedLead.name || 'Unknown'} - ${parsedLead.taskType || 'No task'} (${lead.id.substring(0, 8)})`);

            } catch (error) {
                errorCount++;
                logger.error({ error, messageId: message.id }, "Failed to import lead");
                console.log(`❌ Error importing email ${message.id}`);
            }
        }

        console.log("\n" + "━".repeat(80));
        console.log("\n📊 Import Summary:");
        console.log(`   ✅ Successfully imported: ${successCount} leads`);
        console.log(`   ⏭️  Skipped (duplicates/non-leads): ${skipCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        console.log("\n✨ Historical lead import completed!\n");

    } catch (error) {
        logger.error({ error }, "Historical lead import failed");
        console.error("\n❌ Import failed:", error);
        process.exit(1);
    }
}

// Run the import
importHistoricalLeads()
    .then(() => {
        console.log("🎉 All done! You can now see all historical leads in your dashboard.");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Fatal error:", error);
        process.exit(1);
    });
