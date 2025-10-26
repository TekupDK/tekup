import { EmailResponseGenerator } from "../services/emailResponseGenerator";
import { getLLMProvider } from "../llm/providerFactory";
import type { ParsedLead } from "../services/leadParser";
import { logger } from "../logger";

/**
 * Test script to verify booking slots integration in emails
 */

async function testBookingSlotsInEmail(): Promise<void> {
    console.log("\n🧪 Testing Booking Slots in Email Generation\n");
    console.log("━".repeat(80));

    const llmProvider = getLLMProvider();
    const generator = new EmailResponseGenerator(llmProvider ?? undefined);

    // Create a test lead
    const testLead: ParsedLead = {
        emailId: "test-001",
        threadId: "",
        source: "Test",
        receivedAt: new Date(),
        name: "Test Kunde",
        email: "test@example.com",
        phone: "+45 12 34 56 78",
        address: "Testvej 123, 8000 Aarhus C",
        propertyType: "Lejlighed",
        squareMeters: 85,
        rooms: 3,
        taskType: "Fast rengøring",
        rawSnippet: "Test lead for booking slots integration",
    };

    try {
        console.log("📧 Generating email WITHOUT booking slots...\n");

        const emailWithoutSlots = await generator.generateResponse({
            lead: testLead,
            responseType: "tilbud",
            includeBookingSlots: false,
        });

        console.log("✅ Email without booking slots:");
        console.log(`   To: ${emailWithoutSlots.to}`);
        console.log(`   Subject: ${emailWithoutSlots.subject}`);
        console.log("\n   Body (first 200 chars):");
        console.log(`   ${emailWithoutSlots.body.substring(0, 200)}...`);
        console.log("\n" + "━".repeat(80) + "\n");

        console.log("📅 Generating email WITH booking slots...\n");

        const emailWithSlots = await generator.generateResponse({
            lead: testLead,
            responseType: "tilbud",
            includeBookingSlots: true,
            bookingDuration: 120,
        });

        console.log("✅ Email with booking slots:");
        console.log(`   To: ${emailWithSlots.to}`);
        console.log(`   Subject: ${emailWithSlots.subject}`);
        console.log("\n   Full Body:");
        console.log("   " + "─".repeat(76));
        console.log(
            emailWithSlots.body
                .split("\n")
                .map((line) => `   ${line}`)
                .join("\n")
        );
        console.log("   " + "─".repeat(76));
        console.log("\n" + "━".repeat(80) + "\n");

        console.log("🧪 Testing quick response templates...\n");

        const templates: Array<"moving" | "regular" | "quote-request"> = [
            "moving",
            "regular",
            "quote-request",
        ];

        for (const template of templates) {
            console.log(`\n📋 Template: ${template}`);
            const quickResponse = await generator.generateQuickResponse(
                testLead,
                template,
                true // Include booking slots
            );

            console.log(`   Subject: ${quickResponse.subject}`);
            console.log(`   Body length: ${quickResponse.body.length} characters`);

            // Check if booking slots are mentioned
            const hasBookingInfo =
                quickResponse.body.includes("ledig") ||
                quickResponse.body.includes("tidspunkt") ||
                quickResponse.body.includes("kl.");

            console.log(`   Has booking info: ${hasBookingInfo ? "✅ Yes" : "❌ No"}`);
        }

        console.log("\n" + "━".repeat(80));
        console.log("\n✅ Booking slots integration test completed successfully!\n");
    } catch (err) {
        console.error("\n❌ Test failed:", err);
        logger.error({ err }, "Booking slots test failed");
        process.exit(1);
    }
}

// Run test
testBookingSlotsInEmail().catch((err) => {
    console.error("❌ Unexpected error:", err);
    process.exit(1);
});
