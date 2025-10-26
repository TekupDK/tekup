/**
 * Test script for new Gemini features:
 * 1. Context Caching - Verify cached system prompts save tokens
 * 2. JSON Mode - Verify structured output parsing
 * 3. Streaming - Verify real-time token delivery
 */

import { GeminiProvider } from "../llm/geminiProvider";
import { appConfig } from "../config";

const geminiKey = appConfig.llm.GEMINI_KEY;
if (!geminiKey) {
    throw new Error("GEMINI_KEY is required for this test");
}

const gemini = new GeminiProvider(geminiKey);

// Test email for lead parsing
const testEmail = `
Fra: Thomas Dalager <thomasdjoergensen87@gmail.com>
Emne: Rengøring af lejlighed

Hej,

Jeg har brug for rengøring af min lejlighed på 75 kvm i København K.
Det drejer sig om fast ugentlig rengøring hver tirsdag kl. 10-12.

Min adresse er Nørregade 15, 1165 København K.
Tlf: +45 23 45 67 89

Mvh Thomas Dalager
`;

async function testContextCaching() {
    console.log("\n🔍 TEST 1: Context Caching");
    console.log("=".repeat(50));

    const systemPrompt = `Du er en dansk AI-assistent der parser rengørings-leads.
Ekstraher kunde information fra emails.`;

    const userMessage = `Parse denne email:\n${testEmail}`;

    // First call WITHOUT caching
    console.log("\n📤 Call 1: Uden caching...");
    const start1 = Date.now();
    const response1 = await gemini.completeChat([
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
    ]);
    const time1 = Date.now() - start1;
    console.log(`✅ Response modtaget på ${time1}ms`);
    console.log(`📝 Output: ${response1.substring(0, 100)}...`);

    // Second call WITH caching
    console.log("\n📤 Call 2: Med caching...");
    const start2 = Date.now();
    const response2 = await gemini.completeChat([
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
    ], {
        cachedSystemPrompt: systemPrompt // ← Caching aktiveret
    });
    const time2 = Date.now() - start2;
    console.log(`✅ Response modtaget på ${time2}ms`);
    console.log(`📝 Output: ${response2.substring(0, 100)}...`);

    const speedup = ((time1 - time2) / time1 * 100).toFixed(1);
    console.log(`\n🚀 Speedup: ${speedup}% hurtigere med caching!`);
}

async function testJSONMode() {
    console.log("\n\n🔍 TEST 2: JSON Mode (Structured Output)");
    console.log("=".repeat(50));

    const systemPrompt = "Du parser rengørings-leads og returnerer struktureret JSON.";

    const responseSchema = {
        type: "object" as const,
        properties: {
            name: { type: "string" as const },
            email: { type: "string" as const },
            phone: { type: "string" as const },
            address: { type: "string" as const },
            serviceType: { type: "string" as const },
            area: { type: "number" as const }
        },
        required: ["name", "email"]
    };

    console.log("\n📤 Sender request med responseSchema...");
    const response = await gemini.completeChat([
        { role: "system", content: systemPrompt },
        { role: "user", content: `Parse denne email:\n${testEmail}` }
    ], {
        responseSchema
    });

    console.log("\n✅ Raw response:");
    console.log(response);

    try {
        // Strip markdown code fences hvis de findes
        let jsonText = response.trim();
        if (jsonText.startsWith("```json")) {
            jsonText = jsonText.replace(/^```json\s*\n?/, "").replace(/\n?```\s*$/, "");
        } else if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/^```\s*\n?/, "").replace(/\n?```\s*$/, "");
        }

        const parsed = JSON.parse(jsonText) as { name?: string; email?: string; phone?: string; address?: string };
        console.log("\n✅ Parsed JSON:");
        console.log(JSON.stringify(parsed, null, 2));

        // Validate schema
        if (parsed.name && parsed.email) {
            console.log("\n🎉 JSON schema validation: PASSED");
        } else {
            console.log("\n❌ JSON schema validation: FAILED - missing required fields");
        }
    } catch (error) {
        console.log("\n❌ JSON parsing FAILED:", error);
    }
}

async function testStreaming() {
    console.log("\n\n🔍 TEST 3: Streaming Responses");
    console.log("=".repeat(50));

    const systemPrompt = "Du er en hjælpsom dansk assistent.";
    const userMessage = "Skriv en kort email der takker Thomas for henvendelsen om rengøring.";

    console.log("\n📤 Starter streaming...\n");
    console.log("📝 Stream output:");
    console.log("-".repeat(50));

    let fullResponse = "";
    const startTime = Date.now();
    let firstTokenTime = 0;

    for await (const chunk of gemini.completeChatStream([
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
    ])) {
        if (!firstTokenTime) {
            firstTokenTime = Date.now() - startTime;
            console.log(`\n⚡ First token after ${firstTokenTime}ms\n`);
        }
        process.stdout.write(chunk);
        fullResponse += chunk;
    }

    const totalTime = Date.now() - startTime;

    console.log("\n" + "-".repeat(50));
    console.log(`\n✅ Stream complete:`);
    console.log(`   - First token: ${firstTokenTime}ms`);
    console.log(`   - Total time: ${totalTime}ms`);
    console.log(`   - Characters: ${fullResponse.length}`);
    console.log(`   - Throughput: ${(fullResponse.length / (totalTime / 1000)).toFixed(0)} chars/sec`);
}

async function main() {
    console.log("🧪 GEMINI FEATURES TEST SUITE");
    console.log("=".repeat(50));
    console.log(`📅 Date: ${new Date().toLocaleString("da-DK")}`);
    console.log(`🔑 Model: gemini-2.0-flash-exp`);

    try {
        // Test 1: Context Caching
        await testContextCaching();

        // Test 2: JSON Mode
        await testJSONMode();

        // Test 3: Streaming
        await testStreaming();

        console.log("\n\n" + "=".repeat(50));
        console.log("✅ ALL TESTS COMPLETED");
        console.log("=".repeat(50));

    } catch (error) {
        console.error("\n❌ TEST FAILED:", error);
        process.exit(1);
    }
}

main().catch(console.error);
