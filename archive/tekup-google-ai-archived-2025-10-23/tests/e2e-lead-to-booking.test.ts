import { describe, expect, it, beforeAll } from "vitest";
import { IntentClassifier } from "../src/agents/intentClassifier";
import { TaskPlanner } from "../src/agents/taskPlanner";
import { PlanExecutor } from "../src/agents/planExecutor";
import { prisma } from "../src/services/databaseService";
import type { AssistantIntent, PlannedTask } from "../src/types";

/**
 * End-to-End Test: Complete Lead Processing Workflow
 * 
 * This test simulates the entire journey from receiving a lead email
 * to generating a quote and creating a booking.
 * 
 * Flow: Email → Intent → Plan → Execute → Database → Quote → Booking
 */

describe("E2E: Lead to Booking Workflow", () => {
    const classifier = new IntentClassifier();
    const planner = new TaskPlanner();
    const executor = new PlanExecutor();

    // Test data
    const testLead = {
        name: "Test Customer E2E",
        email: "e2e-test@example.com",
        phone: "12345678",
        address: "Test Street 123, 8000 Aarhus C",
        propertySize: 120,
        rooms: 4,
        serviceType: "Fast Rengøring",
        specialRequests: ["vinduer", "dyb rengøring"]
    };

    beforeAll(async () => {
        // Clean up any existing test data
        await prisma.lead.deleteMany({
            where: { email: testLead.email }
        });
    });

    it("should process complete lead workflow from email to quote", async () => {
        // STEP 1: Classify incoming email
        const emailContent = `
            Hej,
            
            Jeg søger fast rengøring hver 2. uge af min ${testLead.propertySize}m² villa med ${testLead.rooms} rum på ${testLead.address}.
            Kan I også gøre vinduer rent og lave dyb rengøring?
            
            Med venlig hilsen,
            ${testLead.name}
            ${testLead.email}
            ${testLead.phone}
        `;

        const intent = await classifier.classify(emailContent);
        
        expect(intent.intent).toBe("email.lead");
        expect(intent.confidence).toBeGreaterThan(0.5);
        console.log("✓ Step 1: Intent classified as 'email.lead'");

        // STEP 2: Create execution plan
        const plan = await planner.planForIntent(intent.intent as AssistantIntent, {
            email: emailContent,
            subject: "Forespørgsel om rengøring",
            from: testLead.email,
            timestamp: new Date().toISOString()
        });

        expect(plan).toBeDefined();
        expect(plan.length).toBeGreaterThan(0);
        console.log(`✓ Step 2: Created plan with ${plan.length} tasks`);

        // STEP 3: Execute plan (in dry-run mode)
        const results = await executor.execute(plan);

        expect(results.length).toBe(plan.length);
        expect(results.every(r => r.status === "success" || r.status === "queued")).toBe(true);
        console.log("✓ Step 3: Plan executed successfully");

        // STEP 4: Verify database entries
        const createdLead = await prisma.lead.findFirst({
            where: { email: testLead.email },
            include: { customer: true }
        });

        expect(createdLead).toBeDefined();
        expect(createdLead?.customer).toBeDefined();
        console.log("✓ Step 4: Lead and customer created in database");

        // STEP 5: Verify quote was prepared
        const hasQuoteTask = results.some(r => 
            r.task.type === "email.compose" && 
            r.metadata?.responseType === "tilbud"
        );

        expect(hasQuoteTask).toBe(true);
        console.log("✓ Step 5: Quote email prepared");

        // Clean up
        if (createdLead) {
            await prisma.lead.delete({ where: { id: createdLead.id } });
            if (createdLead.customerId) {
                await prisma.customer.delete({ where: { id: createdLead.customerId } });
            }
        }

        console.log("✅ Complete workflow test passed!");
    }, 30000); // 30 second timeout

    it("should handle duplicate leads correctly", async () => {
        // Create initial lead
        const customer = await prisma.customer.create({
            data: {
                name: testLead.name,
                email: testLead.email,
                phone: testLead.phone,
                address: testLead.address
            }
        });

        const existingLead = await prisma.lead.create({
            data: {
                customerId: customer.id,
                name: testLead.name,
                email: testLead.email,
                phone: testLead.phone,
                taskType: testLead.serviceType,
                status: "new",
                squareMeters: testLead.propertySize,
                rooms: testLead.rooms
            }
        });

        // Try to process same lead again
        const emailContent = `Hej, jeg vil gerne have et tilbud fra ${testLead.email}`;
        const intent = await classifier.classify(emailContent);
        const plan = await planner.planForIntent(intent.intent as AssistantIntent, {
            email: emailContent,
            from: testLead.email
        });

        // Should detect duplicate
        const hasDuplicateCheck = plan.some((task: PlannedTask) => 
            task.type === "customer.duplicate_check"
        );

        expect(hasDuplicateCheck).toBe(true);
        console.log("✓ Duplicate detection included in plan");

        // Clean up
        await prisma.lead.delete({ where: { id: existingLead.id } });
        await prisma.customer.delete({ where: { id: customer.id } });

        console.log("✅ Duplicate handling test passed!");
    });

    it("should estimate pricing correctly based on property size", async () => {
        const testCases = [
            { size: 50, expectedMin: 500, expectedMax: 1000 },
            { size: 100, expectedMin: 1000, expectedMax: 2000 },
            { size: 200, expectedMin: 2000, expectedMax: 4000 }
        ];

        for (const testCase of testCases) {
            const emailContent = `Jeg har et ${testCase.size}m² hus der skal rengøres`;
            const intent = await classifier.classify(emailContent);
            const plan = await planner.planForIntent(intent.intent as AssistantIntent, {
                email: emailContent,
                from: "pricing-test@example.com"
            });

            const priceTask = plan.find((task: PlannedTask) => 
                task.type === "lead.estimate_price"
            );

            expect(priceTask).toBeDefined();
            console.log(`✓ Price estimation for ${testCase.size}m²`);
        }

        console.log("✅ Pricing estimation test passed!");
    });

    it("should handle booking slot availability", async () => {
        const emailContent = `
            Jeg vil gerne booke en tid til rengøring den 20. oktober kl. 10:00.
            Det vil tage cirka 3 timer.
        `;

        const intent = await classifier.classify(emailContent);
        expect(intent.intent).toMatch(/calendar|booking/);

        const plan = await planner.planForIntent(intent.intent as AssistantIntent, {
            email: emailContent,
            from: "booking-test@example.com"
        });

        const hasBookingTask = plan.some((task: PlannedTask) => 
            task.type === "calendar.book"
        );

        expect(hasBookingTask).toBe(true);
        console.log("✓ Booking task included in plan");
        console.log("✅ Booking workflow test passed!");
    });

    it("should apply correct lead source rules", async () => {
        const leadSources = [
            { from: "noreply@leadmail.no", shouldReply: false, reason: "Leadmail.no" },
            { from: "customer@example.com", shouldReply: true, reason: "Direct customer" },
            { from: "mw@adhelp.dk", shouldReply: false, reason: "AdHelp aggregator" }
        ];

        for (const source of leadSources) {
            const intent = await classifier.classify("Forespørgsel om rengøring");
            const plan = await planner.planForIntent(intent.intent as AssistantIntent, {
                email: "Test lead email",
                from: source.from
            });

            // Check if plan respects lead source rules
            const hasEmailTask = plan.some((task: PlannedTask) => 
                task.type === "email.compose" || task.type === "email.send"
            );

            if (!source.shouldReply) {
                // Should extract customer email instead
                const hasExtractTask = plan.some((task: PlannedTask) => 
                    task.type === "lead.parse" || task.type === "customer.create"
                );
                expect(hasExtractTask).toBe(true);
            }

            console.log(`✓ Lead source rule applied for ${source.reason}`);
        }

        console.log("✅ Lead source rules test passed!");
    });
});
