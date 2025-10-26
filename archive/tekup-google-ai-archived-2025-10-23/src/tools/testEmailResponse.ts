import { getAutoResponseService } from "../services/emailAutoResponseService";
import type { ParsedLead } from "../services/leadParser";
import { logger } from "../logger";

/**
 * Mock Email Auto-Response Test
 * 
 * Tests the email response generation with mock lead data
 * since real Leadmail.no emails don't include customer email addresses
 */

async function testMockResponse(): Promise<void> {
    console.log("\n🧪 Testing Email Auto-Response with Mock Lead Data...\n");

    // Create a realistic mock lead
    const mockLead: ParsedLead = {
        emailId: "mock-test-" + Date.now(),
        threadId: "mock-thread-" + Date.now(),
        source: "Rengøring.nu",
        receivedAt: new Date(),
        name: "Andreas Slot Tanderup",
        email: "andreas.tanderup@example.com", // Mock email
        phone: "+45 22 33 44 55",
        address: "Testvej 123, 8260 Viby J",
        squareMeters: 120,
        rooms: 4,
        propertyType: "Villa/Parcelhus",
        taskType: "Fast rengøringshjælp",
        serviceNeeded: "Skal hele boligen",
        ownerOrRenter: "Ejer",
        rawSnippet: "Mock lead for testing",
    };

    console.log("📧 Mock Lead Data:");
    console.log(`   Name: ${mockLead.name}`);
    console.log(`   Email: ${mockLead.email}`);
    console.log(`   Phone: ${mockLead.phone}`);
    console.log(`   Task: ${mockLead.taskType}`);
    console.log(`   Property: ${mockLead.propertyType} (${mockLead.squareMeters} m²)`);
    console.log(`   Address: ${mockLead.address}\n`);

    try {
        // Create service with approval required for testing
        const service = getAutoResponseService({
            enabled: true,
            requireApproval: true,
            responseDelay: 0,
        });

        console.log("🤖 Generating personalized email response with Gemini AI...\n");

        // Process lead
        const status = await service.processLead(mockLead);

        console.log(`✅ Response Status: ${status.status}`);
        console.log(`   Generated at: ${status.generatedAt.toLocaleString("da-DK")}\n`);

        // Show the pending response
        const pending = service.getPendingResponses();
        if (pending.length > 0) {
            const { response } = pending[0];
            console.log("📨 Generated Email Response:");
            console.log("═".repeat(80));
            console.log(`To: ${response.to}`);
            console.log(`Subject: ${response.subject}`);
            console.log("═".repeat(80));
            console.log(response.body);
            console.log("═".repeat(80));
            console.log("\n💡 This is a test - email was NOT sent");
            console.log("💡 In production, use requireApproval: false to send automatically\n");

            // Show statistics
            const stats = service.getStatistics();
            console.log("📊 Service Statistics:");
            console.log(`   Total responses: ${stats.totalResponses}`);
            console.log(`   Pending approval: ${stats.pending}`);
            console.log(`   Daily limit: ${stats.todayCount}/${stats.dailyLimit}`);
        } else {
            console.log("⚠️  No response was generated");
            if (status.error) {
                console.log(`   Error: ${status.error}`);
            }
        }
    } catch (err) {
        console.error("\n❌ Error generating response:", err);
        logger.error({ err }, "Failed to test mock auto-response");
        process.exit(1);
    }
}

async function testMovingCleaningResponse(): Promise<void> {
    console.log("\n🧪 Testing Flytterengøring (Moving Cleaning) Response...\n");

    const mockLead: ParsedLead = {
        emailId: "mock-moving-" + Date.now(),
        threadId: "mock-moving-thread-" + Date.now(),
        source: "Rengøring.nu",
        receivedAt: new Date(),
        name: "Maria Jensen",
        email: "maria.jensen@example.com",
        phone: "+45 30 40 50 60",
        address: "Søndergade 45, 8000 Aarhus C",
        squareMeters: 85,
        rooms: 3,
        propertyType: "Lejlighed",
        taskType: "Flytterengøring",
        serviceNeeded: "Skal hele boligen",
        preferredDates: ["15. oktober 2025"],
        ownerOrRenter: "Lejer",
        rawSnippet: "Mock moving cleaning lead",
    };

    console.log("📧 Mock Lead - Flytterengøring:");
    console.log(`   Name: ${mockLead.name}`);
    console.log(`   Property: ${mockLead.propertyType} (${mockLead.squareMeters} m²)`);
    console.log(`   Task: ${mockLead.taskType}`);
    console.log(`   Preferred date: ${(mockLead.preferredDates ?? []).join(", ")}\n`);

    const service = getAutoResponseService({
        enabled: true,
        requireApproval: true,
        responseDelay: 0,
    });

    console.log("🤖 Generating flytterengøring response...\n");

    await service.processLead(mockLead);
    const pending = service.getPendingResponses();

    if (pending.length > 0) {
        const { response } = pending[pending.length - 1]; // Get the last one
        console.log("📨 Flytterengøring Email:");
        console.log("═".repeat(80));
        console.log(`Subject: ${response.subject}`);
        console.log("─".repeat(80));
        console.log(response.body);
        console.log("═".repeat(80));
    }
}

async function main(): Promise<void> {
    const command = process.argv[2] || "regular";

    try {
        if (command === "moving") {
            await testMovingCleaningResponse();
        } else {
            await testMockResponse();
        }
    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
}

main().catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
});
