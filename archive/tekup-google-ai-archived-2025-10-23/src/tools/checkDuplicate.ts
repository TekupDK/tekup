/**
 * Test CLI for Duplicate Detection Service
 * 
 * Usage:
 * npm run duplicate:check test@example.com
 */

import { checkDuplicateCustomer, type DuplicateCheckResult } from "../services/duplicateDetectionService";
import { logger } from "../logger";

async function main() {
    const email = process.argv[2];

    if (!email) {
        console.error("❌ Usage: npm run duplicate:check <customer-email>");
        console.error("   Example: npm run duplicate:check test@example.com");
        process.exit(1);
    }

    console.log(`\n🔍 Checking for duplicate quotes for: ${email}\n`);

    try {
        const result: DuplicateCheckResult = await checkDuplicateCustomer(email);

        // Display results
        console.log("═══════════════════════════════════════════════════════");
        console.log(`📊 DUPLICATE CHECK RESULT`);
        console.log("═══════════════════════════════════════════════════════");
        console.log();

        if (result.isDuplicate) {
            console.log(`⚠️  Duplicate: YES`);
            console.log(`📌 Action: ${result.action}`);

            if (result.daysSinceLastContact) {
                console.log(`⏱️  Days since last contact: ${result.daysSinceLastContact}`);
            }

            console.log();
            console.log("📝 Recommendation:");
            console.log(result.recommendation);
            console.log();

            // Customer details
            if (result.customer) {
                console.log("👤 Customer Details:");
                console.log(`   Name: ${result.customer.name}`);
                console.log(`   Email: ${result.customer.email}`);
                if (result.customer.phone) {
                    console.log(`   Phone: ${result.customer.phone}`);
                }
                console.log(`   Total Bookings: ${result.customer.totalBookings}`);
                console.log(`   Total Quotes: ${result.customer.totalQuotes}`);

                if (result.customer.lastQuoteDate) {
                    console.log(`   Last Quote: ${result.customer.lastQuoteDate.toLocaleDateString("da-DK")}`);
                }
                if (result.customer.lastBookingDate) {
                    console.log(`   Last Booking: ${result.customer.lastBookingDate.toLocaleDateString("da-DK")}`);
                }
                if (result.customer.stage) {
                    console.log(`   Stage: ${result.customer.stage}`);
                }
                console.log();
            }

            // Gmail history
            if (result.gmailHistory) {
                console.log("📧 Gmail History:");
                console.log(`   Threads: ${result.gmailHistory.threadCount}`);
                if (result.gmailHistory.lastThreadDate) {
                    console.log(`   Last Email: ${result.gmailHistory.lastThreadDate.toLocaleDateString("da-DK")}`);
                }
                console.log();
            }

            // Action guidance
            console.log("🎯 What to do:");
            if (result.action === "STOP") {
                console.log("   🚫 DO NOT send new quote!");
                console.log("   ✅ Reply to existing thread instead");
                console.log("   ✅ Or wait at least 7 days");
            } else if (result.action === "WARN") {
                console.log("   ⚠️  Review previous communication first");
                console.log("   ⚠️  Consider following up instead of new quote");
                console.log("   ✅ If legitimately new request, proceed carefully");
            }
        } else {
            console.log(`✅ Duplicate: NO`);
            console.log(`📌 Action: ${result.action}`);
            console.log();
            console.log("📝 Recommendation:");
            console.log(result.recommendation);
            console.log();
            console.log("🎯 What to do:");
            console.log("   ✅ Safe to send new quote");
            console.log("   ✅ No previous communication found");
        }

        console.log("═══════════════════════════════════════════════════════");
        console.log();

        // Exit code based on action
        if (result.action === "STOP") {
            process.exit(2); // Error code 2 = STOP
        } else if (result.action === "WARN") {
            process.exit(1); // Error code 1 = WARN
        } else {
            process.exit(0); // Error code 0 = OK
        }
    } catch (error) {
        logger.error({ error, email }, "Error checking duplicate");
        console.error("\n❌ Error checking for duplicates:", error);
        process.exit(3);
    }
}

void main();
