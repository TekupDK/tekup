#!/usr/bin/env ts-node

/**
 * 🧪 Ollama Test Tool
 * 
 * Tests connection to Ollama service and verifies setup
 * 
 * Usage:
 *   npm run ollama:test
 *   npm run ollama:test -- --model mistral:7b
 */

import { OllamaProvider } from "../llm/ollamaProvider";
import { appConfig } from "../config";
import { logger } from "../logger";

async function main() {
    const args = process.argv.slice(2);
    const modelArg = args.find((arg) => arg.startsWith("--model="));
    const model = modelArg ? modelArg.split("=")[1] : appConfig.llm.OLLAMA_MODEL;

    console.log("\n🧪 Ollama Test Tool\n");
    console.log("=".repeat(50));

    // Initialize provider
    const ollama = new OllamaProvider(appConfig.llm.OLLAMA_BASE_URL);

    // Test 1: Connection
    console.log("\n📡 Test 1: Connection");
    console.log(`Base URL: ${appConfig.llm.OLLAMA_BASE_URL}`);

    const isOnline = await ollama.testConnection();

    if (!isOnline) {
        console.error("❌ FAILED: Kunne ikke forbinde til Ollama");
        console.error("\n💡 Løsning:");
        console.error("   1. Installer Ollama: https://ollama.com/download");
        console.error("   2. Start service: ollama serve");
        console.error("   3. Kør test igen\n");
        process.exit(1);
    }

    console.log("✅ PASSED: Forbundet til Ollama");

    // Test 2: List models
    console.log("\n📦 Test 2: Installerede Modeller");

    const models = await ollama.listModels();

    if (models.length === 0) {
        console.error("❌ FAILED: Ingen modeller fundet");
        console.error("\n💡 Løsning:");
        console.error("   Download en model: ollama pull llama3.1:8b\n");
        process.exit(1);
    }

    console.log(`✅ PASSED: ${models.length} modeller fundet:`);
    models.forEach((m) => console.log(`   - ${m}`));

    // Test 3: Chat completion
    console.log(`\n💬 Test 3: Chat Completion (${model})`);

    if (!models.includes(model)) {
        console.error(`❌ FAILED: Model "${model}" ikke fundet`);
        console.error("\n💡 Løsning:");
        console.error(`   Download modellen: ollama pull ${model}\n`);
        process.exit(1);
    }

    try {
        const startTime = Date.now();

        const response = await ollama.completeChat(
            [
                { role: "system", content: "Du er Friday, en professionel dansk rengøringsassistent. Svar kort og præcist." },
                { role: "user", content: "Sig hej på dansk og forklar hvad du kan hjælpe med på 1-2 linjer." },
            ],
            { model, temperature: 0.7, maxTokens: 100 }
        );

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`✅ PASSED: Chat completion succesful (${duration}s)`);
        console.log("\n📝 Response:");
        console.log("─".repeat(50));
        console.log(response);
        console.log("─".repeat(50));
    } catch (error) {
        console.error("❌ FAILED: Chat completion failed");
        console.error(error);
        process.exit(1);
    }

    // Test 4: Danish language test
    console.log("\n🇩🇰 Test 4: Dansk Sprog Test");

    try {
        const response = await ollama.completeChat(
            [
                { role: "system", content: "Svar ALTID på dansk. Du er Friday." },
                { role: "user", content: "Hvad er forskellen mellem almindelig rengøring og flytterengøring?" },
            ],
            { model, temperature: 0.3, maxTokens: 150 }
        );

        // Check hvis response er på dansk (basic check)
        const danishWords = ["er", "og", "til", "med", "på", "for", "af", "en", "det"];
        const hasDanish = danishWords.some((word) => response.toLowerCase().includes(` ${word} `));

        if (!hasDanish) {
            console.warn("⚠️  WARNING: Response might not be in Danish");
        } else {
            console.log("✅ PASSED: Response appears to be in Danish");
        }

        console.log("\n📝 Response:");
        console.log("─".repeat(50));
        console.log(response);
        console.log("─".repeat(50));
    } catch (error) {
        console.error("❌ FAILED: Danish test failed");
        console.error(error);
        process.exit(1);
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("✅ All tests passed!");
    console.log("\n💡 Next steps:");
    console.log(`   1. Set LLM_PROVIDER=ollama in .env`);
    console.log(`   2. Set OLLAMA_MODEL=${model} (optional)`);
    console.log("   3. Restart backend: npm run dev");
    console.log("   4. Test chat i frontend\n");
}

main().catch((error) => {
    logger.error({ error }, "Ollama test failed");
    console.error("\n❌ Test failed:", error);
    process.exit(1);
});
