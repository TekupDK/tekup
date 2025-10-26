import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { EmailResponseGenerator } from "../../src/services/emailResponseGenerator";
import { getLLMProvider, clearProviderCache } from "../../src/llm/providerFactory";
import { prisma } from "../../src/services/databaseService";
import type { ParsedLead } from "../../src/services/leadParser";

/**
 * Integration Tests for Email Response Generation
 * 
 * Tests the EmailResponseGenerator with database integration:
 * Lead → EmailResponseGenerator → Generated Email → Database checks
 * 
 * Uses MockLLMProvider for fast, free, reliable testing.
 * 
 * Note: We test EmailResponseGenerator directly rather than EmailAutoResponseService
 * to avoid service initialization issues with env vars.
 */
describe("Email Response Generation Integration", () => {
    let generator: EmailResponseGenerator;
    let testCustomer: any;
    let testLead: any;

    beforeAll(async () => {
        // Clear provider cache
        clearProviderCache();

        // Get mock provider explicitly
        const mockProvider = getLLMProvider("mock");
        if (!mockProvider) {
            throw new Error("Failed to get mock provider");
        }

        // Create generator with mock provider
        generator = new EmailResponseGenerator(mockProvider);

        console.log("✅ Integration test suite initialized with mock provider");
    });

    beforeEach(async () => {
        // Create test customer and lead in database
        testCustomer = await prisma.customer.create({
            data: {
                email: `test-${Date.now()}@example.com`,
                name: "Integration Test Customer",
                phone: "+4512345678"
            }
        });

        testLead = await prisma.lead.create({
            data: {
                customerId: testCustomer.id,
                source: "integration-test",
                status: "new",
                email: testCustomer.email,
                name: testCustomer.name,
                taskType: "Almindelig rengøring"
            }
        });

        console.log(`✅ Test data created - Customer: ${testCustomer.id}, Lead: ${testLead.id}`);
    });

    afterAll(async () => {
        // Cleanup test data
        await prisma.emailResponse.deleteMany({
            where: {
                lead: {
                    source: "integration-test"
                }
            }
        });

        await prisma.lead.deleteMany({
            where: { source: "integration-test" }
        });

        await prisma.customer.deleteMany({
            where: {
                email: {
                    contains: "test-"
                }
            }
        });

        await prisma.$disconnect();
        console.log("✅ Test data cleaned up");
    });

    describe("Email Generation with Database Context", () => {
        it("should generate email response for lead", async () => {
            const parsedLead: ParsedLead = {
                source: "integration-test",
                receivedAt: new Date(),
                emailId: `test-${Date.now()}`,
                threadId: `thread-${Date.now()}`,
                email: testCustomer.email,
                name: testCustomer.name,
                phone: "+4512345678",
                address: "Testvej 123, 2100 København",
                squareMeters: 80,
                taskType: "Almindelig rengøring",
                serviceNeeded: "Almindelig rengøring",
                rawSnippet: "Test snippet content"
            };

            // Generate email response
            const response = await generator.generateResponse({
                lead: parsedLead,
                responseType: "tilbud",
                additionalContext: "Integration test context"
            });

            // Verify response
            expect(response).toBeDefined();
            expect(response.subject).toBeDefined();
            expect(response.body).toBeDefined();
            expect(response.body).toContain("Kære");

            console.log(`✅ Email generated - Subject: ${response.subject}`);
        }, 10000); // 10 second timeout for database operations

        it("should check for duplicate quotes via database", async () => {
            const parsedLead: ParsedLead = {
                source: "integration-test",
                receivedAt: new Date(),
                emailId: `test-duplicate-${Date.now()}`,
                threadId: `thread-duplicate-${Date.now()}`,
                email: testCustomer.email,
                name: testCustomer.name,
                taskType: "Almindelig rengøring",
                rawSnippet: "Test snippet"
            };

            // Generate quick response (includes duplicate check)
            const response = await generator.generateQuickResponse(parsedLead, "quote-request");

            // Verify response includes duplicate check
            expect(response).toBeDefined();
            expect(response.duplicateCheck).toBeDefined();

            console.log("✅ Duplicate check performed:", response.duplicateCheck?.action || "none");
        });

        it("should handle lead without existing customer", async () => {
            const parsedLead: ParsedLead = {
                source: "integration-test",
                receivedAt: new Date(),
                emailId: `test-no-customer-${Date.now()}`,
                threadId: `thread-no-customer-${Date.now()}`,
                email: `new-customer-${Date.now()}@example.com`,
                name: "New Customer Test",
                taskType: "Almindelig rengøring",
                rawSnippet: "Test snippet"
            };

            // Generate response for new customer
            const response = await generator.generateResponse({
                lead: parsedLead,
                responseType: "tilbud"
            });

            // Should work even without existing customer
            expect(response).toBeDefined();
            expect(response.subject).toBeDefined();

            console.log("✅ Email generated for new customer");
        });
    });

    describe("Response Generation for Different Task Types", () => {
        it("should generate appropriate response for different task types", async () => {
            const taskTypes = [
                "Almindelig rengøring",
                "Flytterengøring",
                "Fast rengøring"
            ];

            for (const taskType of taskTypes) {
                const parsedLead: ParsedLead = {
                    source: "integration-test",
                    receivedAt: new Date(),
                    emailId: `test-${taskType}-${Date.now()}`,
                    threadId: `thread-${taskType}-${Date.now()}`,
                    email: `test-${taskType}-${Date.now()}@example.com`,
                    name: `${taskType} Customer`,
                    taskType,
                    rawSnippet: "Test snippet"
                };

                const response = await generator.generateResponse({
                    lead: parsedLead,
                    responseType: "tilbud"
                });

                expect(response).toBeDefined();
                expect(response.subject).toBeDefined();
                console.log(`✅ ${taskType}: Email generated`);
            }
        });
    });

    describe("Performance", () => {
        it("should generate multiple emails quickly with mock provider", async () => {
            const leads: ParsedLead[] = Array.from({ length: 5 }, (_, i) => ({
                source: "integration-test",
                receivedAt: new Date(),
                emailId: `test-perf-${i}-${Date.now()}`,
                threadId: `thread-perf-${i}-${Date.now()}`,
                email: `test-perf-${i}-${Date.now()}@example.com`,
                name: `Performance Test ${i}`,
                taskType: "Almindelig rengøring",
                rawSnippet: "Test snippet"
            }));

            const start = Date.now();
            const results = await Promise.all(
                leads.map(lead => generator.generateResponse({ lead, responseType: "tilbud" }))
            );
            const duration = Date.now() - start;

            expect(results.length).toBe(5);
            results.forEach(response => {
                expect(response).toBeDefined();
                expect(response.subject).toBeDefined();
            });

            console.log(`✅ Generated 5 emails in ${duration}ms (avg: ${duration / 5}ms per email)`);

            // Should be fast with mock provider (< 2 seconds for 5 emails)
            expect(duration).toBeLessThan(2000);
        }, 15000); // 15 second timeout
    });

    describe("Error Handling", () => {
        it("should handle incomplete lead data gracefully", async () => {
            const parsedLead: Partial<ParsedLead> = {
                source: "integration-test",
                receivedAt: new Date(),
                emailId: `test-error-${Date.now()}`,
                threadId: `thread-error-${Date.now()}`,
                email: testCustomer.email,
                // Missing name, taskType
                rawSnippet: ""
            };

            const response = await generator.generateResponse({
                lead: parsedLead as ParsedLead,
                responseType: "tilbud"
            });

            // Should not throw, should return response
            expect(response).toBeDefined();
            expect(response.subject).toBeDefined();

            console.log("✅ Error handling works - Email generated despite incomplete data");
        });
    });
});
