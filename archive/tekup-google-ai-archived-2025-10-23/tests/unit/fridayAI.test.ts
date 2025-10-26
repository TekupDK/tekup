import { describe, it, expect, beforeEach } from "vitest";
import { FridayAI } from "../../src/ai/friday";
import { getLLMProvider, clearProviderCache } from "../../src/llm/providerFactory";
import type { FridayContext } from "../../src/ai/friday";

describe("Friday AI (Unit Tests with Mock)", () => {
    let friday: FridayAI;

    beforeEach(() => {
        // Clear cache and use mock provider
        clearProviderCache();
        const mockProvider = getLLMProvider("mock");
        if (!mockProvider) {
            throw new Error("Failed to get mock provider");
        }
        friday = new FridayAI(mockProvider);
    });

    describe("Basic Response", () => {
        it("should respond to user message using mock provider", async () => {
            const context: FridayContext = {
                userMessage: "Hvad er status på mine leads?",
                intent: "lead",
                confidence: 0.9,
                history: []
            };

            const response = await friday.respond(context);

            expect(response).toBeDefined();
            expect(response.message).toBeDefined();
            expect(typeof response.message).toBe("string");
            expect(response.message.length).toBeGreaterThan(0);

            console.log("✅ Friday responded:", response.message.substring(0, 100) + "...");
        });

        it("should handle different intents", async () => {
            const intents = ["lead", "email", "booking", "greeting", "help"];

            for (const intent of intents) {
                const context: FridayContext = {
                    userMessage: `Test besked for ${intent}`,
                    intent,
                    confidence: 0.8,
                    history: []
                };

                const response = await friday.respond(context);

                expect(response).toBeDefined();
                expect(response.message).toBeDefined();
                expect(response.suggestions).toBeDefined();
            }

            console.log(`✅ Friday handled ${intents.length} different intents`);
        });

        it("should include suggestions in response", async () => {
            const context: FridayContext = {
                userMessage: "Kan du hjælpe mig?",
                intent: "help",
                confidence: 0.85,
                history: []
            };

            const response = await friday.respond(context);

            expect(response.suggestions).toBeDefined();
            expect(Array.isArray(response.suggestions)).toBe(true);

            console.log("✅ Suggestions provided:", response.suggestions);
        });
    });

    describe("Conversation Context", () => {
        it("should handle conversation history", async () => {
            const context: FridayContext = {
                userMessage: "Hvad sagde jeg før?",
                intent: "unknown",
                confidence: 0.5,
                history: [
                    { role: "user", content: "Hej Friday" },
                    { role: "assistant", content: "Hej! Hvordan kan jeg hjælpe?" },
                    { role: "user", content: "Vis mine leads" }
                ]
            };

            const response = await friday.respond(context);

            expect(response).toBeDefined();
            expect(response.message).toBeDefined();

            console.log("✅ Friday handled conversation history");
        });

        it("should work without conversation history", async () => {
            const context: FridayContext = {
                userMessage: "Hej",
                intent: "greeting",
                confidence: 0.95,
                history: []
            };

            const response = await friday.respond(context);

            expect(response).toBeDefined();
            expect(response.message).toBeDefined();

            console.log("✅ Friday handled message without history");
        });
    });

    describe("Error Handling", () => {
        it("should handle errors gracefully", async () => {
            const context: FridayContext = {
                userMessage: "",
                intent: "unknown",
                confidence: 0,
                history: []
            };

            const response = await friday.respond(context);

            expect(response).toBeDefined();
            expect(response.message).toBeDefined();
            // Should not throw, should return error message
            expect(response.suggestions).toBeDefined();

            console.log("✅ Friday handled edge case gracefully");
        });

        it("should work without LLM provider (heuristic fallback)", async () => {
            const heuristicFriday = new FridayAI(); // No provider

            const context: FridayContext = {
                userMessage: "Hej Friday",
                intent: "greeting",
                confidence: 0.9,
                history: []
            };

            const response = await heuristicFriday.respond(context);

            expect(response).toBeDefined();
            expect(response.message).toBeDefined();
            expect(typeof response.message).toBe("string");

            console.log("✅ Friday works without LLM (heuristic mode)");
        });
    });

    describe("Performance", () => {
        it("should respond quickly with mock provider", async () => {
            const context: FridayContext = {
                userMessage: "Hvad er status?",
                intent: "status",
                confidence: 0.8,
                history: []
            };

            const start = Date.now();
            await friday.respond(context);
            const duration = Date.now() - start;

            // Mock provider should be fast (< 200ms)
            expect(duration).toBeLessThan(200);

            console.log(`✅ Friday responded in ${duration}ms`);
        });

        it("should handle multiple rapid requests", async () => {
            const contexts: FridayContext[] = Array.from({ length: 5 }, (_, i) => ({
                userMessage: `Test besked ${i}`,
                intent: "test",
                confidence: 0.8,
                history: []
            }));

            const start = Date.now();
            const responses = await Promise.all(
                contexts.map(ctx => friday.respond(ctx))
            );
            const duration = Date.now() - start;

            expect(responses.length).toBe(5);
            responses.forEach(response => {
                expect(response).toBeDefined();
                expect(response.message).toBeDefined();
            });

            console.log(`✅ Friday handled 5 rapid requests in ${duration}ms (avg: ${duration / 5}ms)`);
        });
    });
});
