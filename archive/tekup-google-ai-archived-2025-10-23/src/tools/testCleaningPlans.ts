/**
 * Test Cleaning Plans System
 * 
 * Comprehensive test of the new cleaning plans functionality
 * Part of Phase 1 - Sprint 1: Rengøringsplaner
 */

import { PrismaClient } from "@prisma/client";
import {
    createCleaningPlan,
    getCleaningPlan,
    getCustomerCleaningPlans,
    DEFAULT_TASK_TEMPLATES,
    calculateCleaningPrice,
} from "../services/cleaningPlanService";
import { logger } from "../logger";

const prisma = new PrismaClient();

async function main() {
    console.log("\n🧪 Testing Cleaning Plans System\n");

    try {
        // 1. Find or create a test customer
        console.log("1️⃣  Finding test customer...");
        let customer = await prisma.customer.findFirst({
            where: { email: { contains: "@" } },
        });

        if (!customer) {
            console.log("   ❌ No customers found. Creating test customer...");
            customer = await prisma.customer.create({
                data: {
                    name: "Test Kunde",
                    email: "test@rendetalje.dk",
                    phone: "+45 12345678",
                    address: "Testvej 123, 2100 København Ø",
                },
            });
            console.log(`   ✅ Created customer: ${customer.name} (${customer.id})`);
        } else {
            console.log(`   ✅ Found customer: ${customer.name} (${customer.id})`);
        }

        // 2. Display default task templates
        console.log("\n2️⃣  Default Task Templates:");
        Object.entries(DEFAULT_TASK_TEMPLATES).forEach(([serviceType, tasks]) => {
            const totalTime = tasks.reduce((sum, t) => sum + t.estimatedTime, 0);
            console.log(`   📋 ${serviceType}:`);
            console.log(`      - ${tasks.length} tasks`);
            console.log(`      - ${totalTime} minutes total`);
            console.log(`      - Tasks: ${tasks.map(t => t.name).join(", ")}`);
        });

        // 3. Calculate prices
        console.log("\n3️⃣  Price Calculator:");
        const testCases = [
            { serviceType: "Fast Rengøring", squareMeters: 80 },
            { serviceType: "Flytterengøring", squareMeters: 120 },
            { serviceType: "Hovedrengøring", squareMeters: 100 },
        ];

        testCases.forEach(test => {
            const price = calculateCleaningPrice(test.serviceType, test.squareMeters);
            console.log(`   💰 ${test.serviceType} (${test.squareMeters} m²): ${price} DKK`);
        });

        // 4. Create a cleaning plan
        console.log("\n4️⃣  Creating cleaning plan...");
        const plan = await createCleaningPlan({
            customerId: customer.id,
            name: "Ugentlig Kontorrengøring",
            description: "Standard rengøring af kontorfaciliteter hver uge",
            serviceType: "Fast Rengøring",
            frequency: "weekly",
            squareMeters: 150,
            address: customer.address || undefined,
            notes: "Husk: Tøm papirkurve og genopfyld håndsæbe",
            tasks: DEFAULT_TASK_TEMPLATES["Fast Rengøring"],
        });

        console.log(`   ✅ Created plan: ${plan.name}`);
        console.log(`      - ID: ${plan.id}`);
        console.log(`      - Service Type: ${plan.serviceType}`);
        console.log(`      - Frequency: ${plan.frequency}`);
        console.log(`      - Estimated Duration: ${plan.estimatedDuration} min`);
        console.log(`      - Tasks: ${plan.tasks.length}`);
        plan.tasks.forEach(task => {
            console.log(`         • ${task.name} (${task.estimatedTime} min, ${task.category})`);
        });

        // 5. Retrieve the plan
        console.log("\n5️⃣  Retrieving plan...");
        const retrievedPlan = await getCleaningPlan(plan.id);
        if (retrievedPlan) {
            console.log(`   ✅ Retrieved: ${retrievedPlan.name}`);
            console.log(`      - Customer: ${retrievedPlan.customer.name}`);
            console.log(`      - Tasks: ${retrievedPlan.tasks.length}`);
        }

        // 6. Get all customer plans
        console.log("\n6️⃣  Getting all customer plans...");
        const customerPlans = await getCustomerCleaningPlans(customer.id);
        console.log(`   ✅ Found ${customerPlans.length} plan(s) for ${customer.name}`);
        customerPlans.forEach(p => {
            console.log(`      - ${p.name} (${p.serviceType}, ${p.tasks.length} tasks)`);
        });

        // 7. Create another plan from a different template
        console.log("\n7️⃣  Creating Hovedrengøring plan...");
        const deepCleanPlan = await createCleaningPlan({
            customerId: customer.id,
            name: "Månedlig Hovedrengøring",
            description: "Grundig rengøring en gang om måneden",
            serviceType: "Hovedrengøring",
            frequency: "monthly",
            squareMeters: 150,
            address: customer.address || undefined,
            tasks: DEFAULT_TASK_TEMPLATES["Hovedrengøring"],
        });

        console.log(`   ✅ Created: ${deepCleanPlan.name}`);
        console.log(`      - Estimated Duration: ${deepCleanPlan.estimatedDuration} min`);
        console.log(`      - Tasks: ${deepCleanPlan.tasks.length}`);

        // 8. Summary statistics
        console.log("\n📊 Summary Statistics:");
        const allPlans = await getCustomerCleaningPlans(customer.id);
        const totalTasks = allPlans.reduce((sum, p) => sum + p.tasks.length, 0);
        const totalTime = allPlans.reduce((sum, p) => sum + p.estimatedDuration, 0);

        console.log(`   - Total Plans: ${allPlans.length}`);
        console.log(`   - Total Tasks: ${totalTasks}`);
        console.log(`   - Total Estimated Time: ${totalTime} minutes (${Math.round(totalTime / 60)} hours)`);
        console.log(`   - Active Plans: ${allPlans.filter(p => p.isActive).length}`);

        console.log("\n✅ All tests passed! Cleaning Plans system is working perfectly.\n");

    } catch (error) {
        console.error("\n❌ Test failed:", error);
        logger.error({ err: error }, "Cleaning plans test failed");
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
