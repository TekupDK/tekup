#!/usr/bin/env node

import {
    createCustomer,
    getCustomerById,
    getCustomerByEmail,
    queryCustomers,
    updateCustomer as _updateCustomer,
    updateCustomerStats,
    getCustomerConversations,
    findOrCreateCustomer as _findOrCreateCustomer,
    linkLeadToCustomer,
} from "../services/customerService";
import { logger } from "../logger";

/**
 * CLI tool for managing customers
 * 
 * Usage:
 *   npm run customer:create <name> <email> [phone]
 *   npm run customer:list [status]
 *   npm run customer:get <email>
 *   npm run customer:stats <customerId>
 *   npm run customer:conversations <customerId>
 *   npm run customer:link-lead <leadId> <customerId>
 */

async function createCustomerCommand(args: string[]): Promise<void> {
    const [name, email, phone] = args;

    if (!name || !email) {
        console.log("\n❌ Error: Name and email are required\n");
        console.log("Usage: npm run customer:create <name> <email> [phone]\n");
        process.exit(1);
    }

    console.log("\n📝 Creating customer...\n");

    const customer = await createCustomer({
        name,
        email,
        phone,
    });

    console.log("✅ Customer created successfully!");
    console.log("━".repeat(50));
    console.log(`ID:      ${customer.id}`);
    console.log(`Name:    ${customer.name}`);
    console.log(`Email:   ${customer.email || "N/A"}`);
    console.log(`Phone:   ${customer.phone || "N/A"}`);
    console.log(`Status:  ${customer.status}`);
    console.log(`Created: ${customer.createdAt.toLocaleString("da-DK")}`);
    console.log("━".repeat(50));
    console.log();
}

async function listCustomersCommand(args: string[]): Promise<void> {
    const status = args[0] || "active";

    console.log(`\n📋 Listing ${status} customers...\n`);

    const customers = await queryCustomers({ status });

    if (customers.length === 0) {
        console.log("No customers found.\n");
        return;
    }

    console.log("━".repeat(100));
    console.log(
        `${"Name".padEnd(25)} ${"Email".padEnd(30)} ${"Leads".padEnd(8)} ${"Bookings".padEnd(10)} ${"Revenue".padEnd(10)}`
    );
    console.log("━".repeat(100));

    for (const customer of customers) {
        const name = customer.name.substring(0, 24).padEnd(25);
        const email = (customer.email || "N/A").substring(0, 29).padEnd(30);
        const leads = customer.totalLeads.toString().padEnd(8);
        const bookings = customer.totalBookings.toString().padEnd(10);
        const revenue = `${customer.totalRevenue.toFixed(0)} kr`.padEnd(10);

        console.log(`${name} ${email} ${leads} ${bookings} ${revenue}`);
    }

    console.log("━".repeat(100));
    console.log(`\nTotal: ${customers.length} customers\n`);
}

async function getCustomerCommand(args: string[]): Promise<void> {
    const email = args[0];

    if (!email) {
        console.log("\n❌ Error: Email is required\n");
        console.log("Usage: npm run customer:get <email>\n");
        process.exit(1);
    }

    console.log(`\n🔍 Looking up customer: ${email}\n`);

    const customer = await getCustomerByEmail(email);

    if (!customer) {
        console.log("❌ Customer not found\n");
        return;
    }

    console.log("✅ Customer found:");
    console.log("━".repeat(50));
    console.log(`ID:            ${customer.id}`);
    console.log(`Name:          ${customer.name}`);
    console.log(`Email:         ${customer.email || "N/A"}`);
    console.log(`Phone:         ${customer.phone || "N/A"}`);
    console.log(`Address:       ${customer.address || "N/A"}`);
    console.log(`Company:       ${customer.companyName || "N/A"}`);
    console.log(`Status:        ${customer.status}`);
    console.log(`Tags:          ${customer.tags.join(", ") || "None"}`);
    console.log(`Total Leads:   ${customer.totalLeads}`);
    console.log(`Total Bookings: ${customer.totalBookings}`);
    console.log(`Total Revenue: ${customer.totalRevenue.toFixed(2)} kr`);
    console.log(
        `Last Contact:  ${customer.lastContactAt?.toLocaleString("da-DK") || "Never"}`
    );
    console.log(`Created:       ${customer.createdAt.toLocaleString("da-DK")}`);
    console.log("━".repeat(50));
    console.log();
}

async function updateStatsCommand(args: string[]): Promise<void> {
    const customerId = args[0];

    if (!customerId) {
        console.log("\n❌ Error: Customer ID is required\n");
        console.log("Usage: npm run customer:stats <customerId>\n");
        process.exit(1);
    }

    console.log(`\n📊 Updating stats for customer ${customerId}...\n`);

    await updateCustomerStats(customerId);

    const customer = await getCustomerById(customerId);

    if (!customer) {
        console.log("❌ Customer not found\n");
        return;
    }

    console.log("✅ Stats updated successfully:");
    console.log("━".repeat(50));
    console.log(`Total Leads:    ${customer.totalLeads}`);
    console.log(`Total Bookings: ${customer.totalBookings}`);
    console.log(`Total Revenue:  ${customer.totalRevenue.toFixed(2)} kr`);
    console.log("━".repeat(50));
    console.log();
}

async function conversationsCommand(args: string[]): Promise<void> {
    const customerId = args[0];

    if (!customerId) {
        console.log("\n❌ Error: Customer ID is required\n");
        console.log("Usage: npm run customer:conversations <customerId>\n");
        process.exit(1);
    }

    console.log(`\n💬 Loading conversations for customer ${customerId}...\n`);

    const conversations = await getCustomerConversations(customerId);

    if (!conversations || conversations.length === 0) {
        console.log("No conversations found.\n");
        return;
    }

    console.log("━".repeat(80));
    console.log(
        `${"Subject".padEnd(40)} ${"Channel".padEnd(10)} ${"Status".padEnd(10)} ${"Lead".padEnd(10)}`
    );
    console.log("━".repeat(80));

    for (const conv of conversations) {
        const subject = (conv.subject || "No subject")
            .substring(0, 39)
            .padEnd(40);
        const channel = conv.channel.padEnd(10);
        const status = conv.status.padEnd(10);
        const leadId = (conv.leadId || "N/A").substring(0, 9).padEnd(10);

        console.log(`${subject} ${channel} ${status} ${leadId}`);
    }

    console.log("━".repeat(80));
    console.log(`\nTotal: ${conversations.length} conversations\n`);
}

async function linkLeadCommand(args: string[]): Promise<void> {
    const [leadId, customerId] = args;

    if (!leadId || !customerId) {
        console.log("\n❌ Error: Lead ID and Customer ID are required\n");
        console.log("Usage: npm run customer:link-lead <leadId> <customerId>\n");
        process.exit(1);
    }

    console.log(
        `\n🔗 Linking lead ${leadId} to customer ${customerId}...\n`
    );

    await linkLeadToCustomer(leadId, customerId);

    console.log("✅ Lead linked successfully!\n");
}

async function main(): Promise<void> {
    const command = process.argv[2];
    const args = process.argv.slice(3);

    try {
        switch (command) {
            case "create":
                await createCustomerCommand(args);
                break;

            case "list":
                await listCustomersCommand(args);
                break;

            case "get":
                await getCustomerCommand(args);
                break;

            case "stats":
                await updateStatsCommand(args);
                break;

            case "conversations":
                await conversationsCommand(args);
                break;

            case "link-lead":
                await linkLeadCommand(args);
                break;

            default:
                console.log("\n👥 Customer Management Tool\n");
                console.log("Available commands:");
                console.log("  create <name> <email> [phone]  - Create new customer");
                console.log("  list [status]                  - List customers (default: active)");
                console.log("  get <email>                    - Get customer by email");
                console.log("  stats <customerId>             - Update customer statistics");
                console.log("  conversations <customerId>     - List customer conversations");
                console.log("  link-lead <leadId> <customerId> - Link lead to customer");
                console.log("\nExamples:");
                console.log('  npm run customer:create "John Doe" john@example.com "+45 12345678"');
                console.log("  npm run customer:list active");
                console.log("  npm run customer:get john@example.com");
                console.log();
                break;
        }
    } catch (error) {
        logger.error({ error }, "Customer management tool failed");
        console.error("\n❌ Error:", error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

void main();
