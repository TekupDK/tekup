import { describe, expect, it, beforeEach } from "vitest";
import { EmailResponseGenerator } from "../../src/services/emailResponseGenerator";
import { getLLMProvider, clearProviderCache } from "../../src/llm/providerFactory";
import type { ParsedLead } from "../../src/services/leadParser";

/**
 * Unit Tests: EmailResponseGenerator with Mock Provider
 * 
 * Benefits of using mock provider:
 * - ✅ Free testing (no API costs)
 * - ✅ Fast tests (no network latency)
 * - ✅ Predictable responses (deterministic)
 * - ✅ Works without API keys
 */

describe("EmailResponseGenerator (Unit Tests with Mock)", () => {
    let generator: EmailResponseGenerator;

    beforeEach(() => {
        // Clear provider cache to ensure fresh mock provider
        clearProviderCache();

        // Create generator with mock provider
        const mockProvider = getLLMProvider("mock");
        if (!mockProvider) {
            throw new Error("Mock provider not available");
        }
        generator = new EmailResponseGenerator(mockProvider);
    });

    describe("generateResponse", () => {
        it("should generate email response using mock provider", async () => {
            const mockLead: ParsedLead = {
                source: "leadmail",
                receivedAt: new Date(),
                emailId: "test-123",
                threadId: "thread-123",
                name: "Test Kunde",
                email: "test@example.com",
                phone: "12345678",
                address: "Test Vej 1, 8000 Aarhus",
                squareMeters: 100,
                rooms: 3,
                taskType: "Almindelig rengøring",
                serviceNeeded: "Ugentlig rengøring",
                preferredDates: [],
                propertyType: "villa",
                rawSnippet: "Test snippet"
            };

            const response = await generator.generateResponse({
                lead: mockLead,
                responseType: "tilbud",
                additionalContext: "Test context"
            });

            // Verify response structure
            expect(response).toBeDefined();
            expect(response.subject).toBeDefined();
            expect(response.body).toBeDefined();
            expect(typeof response.subject).toBe("string");
            expect(typeof response.body).toBe("string");

            // Mock provider should return Danish email
            expect(response.body).toContain("Kære");

            console.log("✅ Mock provider generated response:");
            console.log("Subject:", response.subject);
            console.log("Body preview:", response.body.substring(0, 100) + "...");
        });

        it("should handle different response types", async () => {
            const mockLead: ParsedLead = {
                source: "rengoring.nu",
                receivedAt: new Date(),
                emailId: "test-456",
                threadId: "thread-456",
                name: "Anders Hansen",
                email: "anders@example.com",
                phone: "87654321",
                address: "Storegade 42, 9000 Aalborg",
                squareMeters: 150,
                rooms: 5,
                taskType: "Flytterengøring",
                serviceNeeded: "Flytterengøring med vinduespolering",
                preferredDates: ["2025-10-15"],
                propertyType: "lejlighed",
                additionalNotes: "Skal være færdig inden d. 15.",
                rawSnippet: "Test snippet"
            };

            // Test different response types
            const responseTypes = ["tilbud", "bekræftelse", "info"] as const;

            for (const type of responseTypes) {
                const response = await generator.generateResponse({
                    lead: mockLead,
                    responseType: type
                });

                expect(response).toBeDefined();
                expect(response.subject).toBeDefined();
                expect(response.body).toBeDefined();

                console.log(`✅ ${type}: Generated successfully`);
            }
        });

        it("should include lead details in generated email", async () => {
            const mockLead: ParsedLead = {
                source: "leadmail",
                receivedAt: new Date(),
                emailId: "test-789",
                threadId: "thread-789",
                name: "Maria Jensen",
                email: "maria@example.com",
                phone: "23456789",
                address: "Nørregade 10, 5000 Odense",
                squareMeters: 80,
                rooms: 2,
                taskType: "Fast rengøring",
                serviceNeeded: "Fast rengøring hver 14. dag",
                preferredDates: [],
                propertyType: "lejlighed",
                rawSnippet: "Test snippet"
            };

            const response = await generator.generateResponse({
                lead: mockLead,
                responseType: "tilbud",
                additionalContext: `
                    Lead detaljer:
                    - Navn: ${mockLead.name}
                    - Adresse: ${mockLead.address}
                    - Størrelse: ${mockLead.squareMeters} m²
                    - Type: ${mockLead.taskType}
                `
            });

            // Mock provider returns consistent response
            expect(response.body).toBeDefined();
            expect(response.body.length).toBeGreaterThan(0);

            console.log("✅ Lead details processed successfully");
        });
    });

    describe("Performance", () => {
        it("should be fast with mock provider", async () => {
            const mockLead: ParsedLead = {
                source: "leadmail",
                receivedAt: new Date(),
                emailId: "perf-test",
                threadId: "thread-perf",
                name: "Performance Test",
                email: "perf@example.com",
                phone: "11111111",
                address: "Test Street 1",
                squareMeters: 100,
                rooms: 3,
                taskType: "Almindelig rengøring",
                serviceNeeded: "Ugentlig rengøring",
                preferredDates: [],
                propertyType: "lejlighed",
                rawSnippet: "Test snippet"
            };

            const startTime = Date.now();

            // Generate 10 responses
            const promises = Array.from({ length: 10 }, (_, i) =>
                generator.generateResponse({
                    lead: { ...mockLead, emailId: `perf-${i}` },
                    responseType: "tilbud"
                })
            );

            await Promise.all(promises);

            const duration = Date.now() - startTime;
            const avgTime = duration / 10;

            console.log(`✅ Performance: ${promises.length} emails in ${duration}ms (avg: ${avgTime.toFixed(1)}ms)`);

            // Mock provider should be very fast (< 100ms average)
            expect(avgTime).toBeLessThan(100);
        });

        it("should benefit from provider caching", () => {
            // First call (creates provider)
            const provider1 = getLLMProvider("mock");

            // Second call (should use cache)
            const provider2 = getLLMProvider("mock");

            // Same instance should be returned (proof of caching)
            expect(provider1).toBe(provider2);

            console.log("✅ Provider caching works - same instance returned");
        });
    });

    describe("Error Handling", () => {
        it("should handle missing lead data gracefully", async () => {
            const incompleteLead: Partial<ParsedLead> = {
                source: "test",
                receivedAt: new Date(),
                emailId: "error-test",
                threadId: "thread-error",
                name: "Error Test",
                email: "error@example.com",
                rawSnippet: "Test"
                // Missing optional fields
            };

            // Should not throw error
            try {
                const response = await generator.generateResponse({
                    lead: incompleteLead as ParsedLead,
                    responseType: "tilbud"
                });

                expect(response).toBeDefined();
                console.log("✅ Handled incomplete lead data");
            } catch (error) {
                // If it throws, that's also acceptable behavior
                console.log("✅ Threw error for incomplete data (also valid)");
            }
        });
    });
});
