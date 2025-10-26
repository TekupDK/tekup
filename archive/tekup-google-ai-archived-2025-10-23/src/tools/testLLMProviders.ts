#!/usr/bin/env ts-node

/**
 * 🧪 LLM Provider Integration Test
 * 
 * Tests alle tilgængelige LLM providers:
 * 1. Heuristic mode (altid tilgængelig)
 * 2. OpenAI (hvis API key findes)
 * 3. Gemini (hvis API key findes)
 * 4. Ollama (hvis service kører)
 */

import { OpenAiProvider } from "../llm/openAiProvider";
import { GeminiProvider } from "../llm/geminiProvider";
import { OllamaProvider } from "../llm/ollamaProvider";
import { FridayAI } from "../ai/friday";
import { appConfig } from "../config";
import { logger } from "../logger";

interface TestResult {
    provider: string;
    available: boolean;
    responseTime?: number;
    response?: string;
    error?: string;
}

const testMessage = {
    userMessage: "Hej Friday! Hvad kan du hjælpe med?",
    intent: "greeting",
    history: [],
};

const _testMessages = [
    { role: "system" as const, content: "Du er Friday, en professionel dansk rengøringsassistent hos Rendetalje.dk. Svar kort og præcist på dansk." },
    { role: "user" as const, content: "Hej Friday! Hvad kan du hjælpe med?" }
];

async function testHeuristic(): Promise<TestResult> {
    console.log("\n🔧 Test 1: Heuristic Mode (ingen LLM)");
    console.log("─".repeat(50));

    try {
        const friday = new FridayAI(); // No LLM provider
        const startTime = Date.now();

        const response = await friday.respond(testMessage);

        const duration = Date.now() - startTime;

        console.log(`✅ PASSED (${duration}ms)`);
        console.log(`Response: ${response.message.substring(0, 100)}...`);

        return {
            provider: "Heuristic",
            available: true,
            responseTime: duration,
            response: response.message,
        };
    } catch (error) {
        console.error(`❌ FAILED: ${error}`);
        return {
            provider: "Heuristic",
            available: false,
            error: String(error),
        };
    }
}

async function testOpenAI(): Promise<TestResult> {
    console.log("\n🤖 Test 2: OpenAI GPT-4o-mini");
    console.log("─".repeat(50));

    if (!appConfig.llm.OPENAI_API_KEY) {
        console.log("⏭️  SKIPPED: No API key configured");
        return {
            provider: "OpenAI",
            available: false,
            error: "No API key",
        };
    }

    try {
        const provider = new OpenAiProvider(appConfig.llm.OPENAI_API_KEY);
        const friday = new FridayAI(provider);

        const startTime = Date.now();

        const response = await friday.respond(testMessage);

        const duration = Date.now() - startTime;

        console.log(`✅ PASSED (${duration}ms)`);
        console.log(`Response: ${response.message.substring(0, 100)}...`);

        return {
            provider: "OpenAI GPT-4o-mini",
            available: true,
            responseTime: duration,
            response: response.message,
        };
    } catch (error) {
        console.error(`❌ FAILED: ${error}`);
        return {
            provider: "OpenAI",
            available: false,
            error: String(error),
        };
    }
}

async function testGemini(): Promise<TestResult> {
    console.log("\n💎 Test 3: Google Gemini 2.0");
    console.log("─".repeat(50));

    if (!appConfig.llm.GEMINI_KEY) {
        console.log("⏭️  SKIPPED: No API key configured");
        return {
            provider: "Gemini",
            available: false,
            error: "No API key",
        };
    }

    try {
        const provider = new GeminiProvider(appConfig.llm.GEMINI_KEY);
        const friday = new FridayAI(provider);

        const startTime = Date.now();

        const response = await friday.respond(testMessage);

        const duration = Date.now() - startTime;

        console.log(`✅ PASSED (${duration}ms)`);
        console.log(`Response: ${response.message.substring(0, 100)}...`);

        return {
            provider: "Google Gemini 2.0",
            available: true,
            responseTime: duration,
            response: response.message,
        };
    } catch (error) {
        console.error(`❌ FAILED: ${error}`);
        return {
            provider: "Gemini",
            available: false,
            error: String(error),
        };
    }
}

async function testOllama(): Promise<TestResult> {
    console.log("\n🦙 Test 4: Ollama (Llama 3.1)");
    console.log("─".repeat(50));

    try {
        const provider = new OllamaProvider(appConfig.llm.OLLAMA_BASE_URL);

        // Test connection first
        const isOnline = await provider.testConnection();

        if (!isOnline) {
            console.log("⏭️  SKIPPED: Ollama service not running");
            console.log("\n💡 To install Ollama:");
            console.log("   1. Download: https://ollama.com/download");
            console.log("   2. Install and run: ollama serve");
            console.log("   3. Download model: ollama pull llama3.1:8b");
            return {
                provider: "Ollama",
                available: false,
                error: "Service not running",
            };
        }

        const friday = new FridayAI(provider);

        const startTime = Date.now();

        const response = await friday.respond(testMessage);

        const duration = Date.now() - startTime;

        console.log(`✅ PASSED (${duration}ms)`);
        console.log(`Response: ${response.message.substring(0, 100)}...`);

        return {
            provider: "Ollama (Llama 3.1)",
            available: true,
            responseTime: duration,
            response: response.message,
        };
    } catch (error) {
        console.error(`❌ FAILED: ${error}`);
        return {
            provider: "Ollama",
            available: false,
            error: String(error),
        };
    }
}

async function main() {
    console.log("\n🧪 LLM Provider Integration Test");
    console.log("=".repeat(50));
    console.log(`Testing all available LLM providers...\n`);

    // Run all tests
    const results: TestResult[] = [];

    results.push(await testHeuristic());
    results.push(await testOpenAI());
    results.push(await testGemini());
    results.push(await testOllama());

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 Test Summary");
    console.log("=".repeat(50));

    console.log("\n| Provider | Status | Response Time |");
    console.log("|----------|--------|---------------|");

    for (const result of results) {
        const status = result.available ? "✅ Available" : "❌ Unavailable";
        const time = result.responseTime ? `${result.responseTime}ms` : "N/A";
        console.log(`| ${result.provider.padEnd(18)} | ${status.padEnd(14)} | ${time.padEnd(13)} |`);
    }

    // Quality comparison (if multiple available)
    const available = results.filter((r) => r.available && r.response);

    if (available.length > 1) {
        console.log("\n🎯 Response Quality Comparison:");
        console.log("─".repeat(50));

        for (const result of available) {
            console.log(`\n${result.provider}:`);
            console.log(result.response?.substring(0, 200) || "N/A");
        }
    }

    // Recommendations
    console.log("\n💡 Recommendations:");
    console.log("─".repeat(50));

    const hasOpenAI = results.find((r) => r.provider.includes("OpenAI"))?.available;
    const hasGemini = results.find((r) => r.provider.includes("Gemini"))?.available;
    const hasOllama = results.find((r) => r.provider.includes("Ollama"))?.available;

    if (hasOllama) {
        console.log("✅ Ollama is available - BEST for cost & speed");
        console.log("   Set: LLM_PROVIDER=ollama");
    } else if (hasGemini) {
        console.log("✅ Gemini is available - Good balance of cost & quality");
        console.log("   Set: LLM_PROVIDER=gemini");
    } else if (hasOpenAI) {
        console.log("✅ OpenAI is available - Best quality, higher cost");
        console.log("   Set: LLM_PROVIDER=openai");
    } else {
        console.log("⚠️  No LLM available - Using heuristic fallback");
        console.log("   Add API key to .env or install Ollama");
    }

    console.log("\n📚 Documentation:");
    console.log("   - docs/OLLAMA_SETUP.md");
    console.log("   - docs/LLM_PROVIDER_COMPARISON.md");
    console.log("\n");
}

main().catch((error) => {
    logger.error({ error }, "Test suite failed");
    console.error("\n❌ Test suite failed:", error);
    process.exit(1);
});
