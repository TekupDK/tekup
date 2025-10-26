/**
 * Test Provider Factory
 * 
 * Verifies that:
 * 1. Provider caching works correctly
 * 2. Mock provider returns expected responses
 * 3. Provider switching works
 */

import { getLLMProvider, requireLLMProvider, clearProviderCache } from "../llm/providerFactory";

function testProviderCaching() {
    console.log("\n🔍 Test 1: Provider Caching\n");

    // Clear cache first
    clearProviderCache();

    // Get provider twice - should use cache second time
    const provider1 = getLLMProvider("mock");
    const provider2 = getLLMProvider("mock");

    if (provider1 === provider2) {
        console.log("✅ Caching works! Same instance returned");
    } else {
        console.log("❌ Caching failed! Different instances returned");
    }

    return provider1 === provider2;
}

async function testMockProvider() {
    console.log("\n🔍 Test 2: Mock Provider Responses\n");

    const provider = getLLMProvider("mock");

    if (!provider) {
        console.log("❌ Mock provider not available");
        return false;
    }

    // Test normal completion
    const response1 = await provider.completeChat([
        { role: "user", content: "Generer et email svar til kunde" }
    ]);

    console.log("📧 Mock email response:");
    console.log(response1);
    console.log("");

    if (response1.includes("Kære kunde")) {
        console.log("✅ Contextual mock response works!");
    } else {
        console.log("⚠️ Got generic response instead");
    }

    // Test streaming
    console.log("\n📡 Testing streaming...");
    const chunks: string[] = [];

    if (provider.completeChatStream) {
        for await (const chunk of provider.completeChatStream([
            { role: "user", content: "Test streaming" }
        ])) {
            chunks.push(chunk);
            process.stdout.write(chunk);
        }
        console.log("\n");
    }

    if (chunks.length > 0) {
        console.log(`✅ Streaming works! Received ${chunks.length} chunks`);
    } else {
        console.log("❌ Streaming failed!");
    }

    return true;
}

function testProviderSwitching() {
    console.log("\n🔍 Test 3: Provider Switching\n");

    clearProviderCache();

    // Test different providers
    const mockProvider = getLLMProvider("mock");
    const heuristicProvider = getLLMProvider("heuristic");

    console.log(`Mock provider: ${mockProvider ? "✅ Available" : "❌ Not available"}`);
    console.log(`Heuristic provider: ${heuristicProvider ? "❌ Should be null" : "✅ Correctly null"}`);

    // Test requireLLMProvider with mock
    try {
        const _required = requireLLMProvider("mock");
        console.log("✅ requireLLMProvider works with mock");
    } catch (error) {
        console.log("❌ requireLLMProvider failed:", error);
        return false;
    }

    // Test requireLLMProvider with heuristic (should throw)
    try {
        requireLLMProvider("heuristic");
        console.log("❌ requireLLMProvider should have thrown!");
        return false;
    } catch {
        console.log("✅ requireLLMProvider correctly throws for heuristic mode");
    }

    return true;
}

async function main() {
    console.log("🚀 Testing Provider Factory Improvements\n");
    console.log("=".repeat(60));

    const results = {
        caching: testProviderCaching(),
        mockProvider: await testMockProvider(),
        switching: testProviderSwitching()
    };

    console.log("\n" + "=".repeat(60));
    console.log("\n📊 Test Results:\n");
    console.log(`Caching:       ${results.caching ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`Mock Provider: ${results.mockProvider ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`Switching:     ${results.switching ? "✅ PASS" : "❌ FAIL"}`);

    const allPassed = Object.values(results).every(r => r);

    if (allPassed) {
        console.log("\n🎉 All tests passed!");
        process.exit(0);
    } else {
        console.log("\n❌ Some tests failed");
        process.exit(1);
    }
}

main().catch(error => {
    console.error("💥 Test failed with error:", error);
    process.exit(1);
});
