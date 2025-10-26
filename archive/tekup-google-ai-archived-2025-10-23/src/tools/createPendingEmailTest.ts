import { getAutoResponseService } from "../services/emailAutoResponseService";
import { logger } from "../logger";
import type { ParsedLead } from "../services/leadParser";

/**
 * Test script to create a pending email response in the database
 */
async function createTestPendingEmail(): Promise<void> {
    console.log("\n🧪 Creating Test Pending Email Response...\n");

    try {
        // Create a mock lead for testing
        const lead: ParsedLead = {
            emailId: `test-${Date.now()}`,
            threadId: `thread-${Date.now()}`,
            name: "Test Customer",
            email: "test@example.com",
            phone: "+45 12 34 56 78",
            taskType: "Fast rengøring",
            propertyType: "Villa/Parcelhus",
            squareMeters: 120,
            address: "Testvej 123, 8260 Viby J",
            source: "Test System",
            receivedAt: new Date(),
            rawSnippet: "Test email for pending approval system",
        };

        console.log(`📧 Creating pending email for lead: ${lead.name}`);
        console.log(`   Email: ${lead.email}`);
        console.log(`   Task: ${lead.taskType}`);
        console.log(`   Source: ${lead.source}\n`);

        // Get service instance
        const service = getAutoResponseService();

        // Create pending response in database
        const emailResponseId = await service.createPendingResponse(lead);

        console.log(`✅ Pending email response created successfully!`);
        console.log(`   Database ID: ${emailResponseId}`);
        console.log(`   Status: pending`);
        console.log(`   Ready for approval via API or UI\n`);

        console.log("💡 Next steps:");
        console.log("   1. Check pending emails: GET /api/email-approval/pending");
        console.log("   2. Edit email: PUT /api/email-approval/:id/edit");
        console.log("   3. Approve: POST /api/email-approval/:id/approve");
        console.log("   4. Or reject: POST /api/email-approval/:id/reject");

        // Exit successfully
        process.exit(0);

    } catch (err) {
        console.error("\n❌ Error creating pending email:", err);
        logger.error({ err }, "Failed to create test pending email");
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
    console.log("\n\n👋 Shutting down...\n");
    process.exit(0);
});

void createTestPendingEmail();