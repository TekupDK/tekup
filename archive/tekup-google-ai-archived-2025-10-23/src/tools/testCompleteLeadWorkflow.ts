/**
 * Complete Lead Processing Workflow Test
 * Tests the entire flow from email → quote generation
 */

import { parseLeadEmail, formatParsedLead, calculateEstimatedPrice } from "../services/leadParsingService";
import { checkDuplicateCustomer } from "../services/duplicateDetectionService";
import { findAvailableSlots } from "../services/slotFinderService";
import { generateQuote } from "../services/quoteGenerationService";

const SAMPLE_LEAD = `
Hej,

Jeg søger fast rengøring hver 2. uge af min 150m² villa med 5 rum på Hovedgade 123, 8000 Aarhus C.

Jeg vil gerne have det startet omkring 20. oktober hvis muligt.

Kan I også gøre vinduer rent?

Med venlig hilsen,
Mette Nielsen
mette.nielsen@example.com
22 65 02 26
`;

async function testCompleteWorkflow() {
  console.log("\n" + "=".repeat(100));
  console.log("🚀 COMPLETE LEAD PROCESSING WORKFLOW TEST");
  console.log("=".repeat(100) + "\n");

  console.log("📧 Incoming Lead Email:");
  console.log(SAMPLE_LEAD);
  console.log("\n" + "=".repeat(100) + "\n");

  try {
    // ============================================================
    // STEP 1: Parse Lead with AI
    // ============================================================
    console.log("STEP 1: 🤖 AI Lead Parsing\n");
    const startParse = Date.now();
    
    const parsed = await parseLeadEmail(SAMPLE_LEAD, "Fast rengøring - Aarhus");
    
    const parseTime = Date.now() - startParse;
    console.log(formatParsedLead(parsed));
    console.log(`\n⏱️  Parse time: ${parseTime}ms\n`);
    console.log("=".repeat(100) + "\n");

    // ============================================================
    // STEP 2: Check for Duplicate (CRITICAL - MEMORY_8 rule!)
    // ============================================================
    console.log("STEP 2: 🔍 Duplicate Detection\n");
    const startDuplicate = Date.now();
    
    const duplicateCheck = await checkDuplicateCustomer(parsed.email || "unknown@example.com");
    
    const duplicateTime = Date.now() - startDuplicate;
    console.log(`✅ Duplicate Check Result: ${duplicateCheck.action}`);
    console.log(`📝 Recommendation: ${duplicateCheck.recommendation}`);
    console.log(`⏱️  Check time: ${duplicateTime}ms\n`);

    if (duplicateCheck.action === "STOP") {
      console.log("🛑 STOPPING - Customer already contacted recently!");
      console.log(`   Last contact: ${duplicateCheck.customer?.lastContact?.toLocaleString("da-DK")}`);
      console.log(`   Days since: ${duplicateCheck.daysSinceLastContact}`);
      return;
    }

    if (duplicateCheck.action === "WARN") {
      console.log("⚠️  WARNING - Review needed:");
      console.log(`   Last contact: ${duplicateCheck.customer?.lastContact?.toLocaleString("da-DK")}`);
      console.log(`   Total bookings: ${duplicateCheck.customer?.totalBookings}`);
      console.log(`   Proceeding with caution...\n`);
    }

    console.log("=".repeat(100) + "\n");

    // ============================================================
    // STEP 3: Calculate Price Estimate
    // ============================================================
    console.log("STEP 3: 💰 Price Estimation\n");
    const startPrice = Date.now();
    
    const priceEstimate = calculateEstimatedPrice(
      parsed.propertySize,
      parsed.serviceType,
      parsed.rooms
    );
    
    const priceTime = Date.now() - startPrice;
    console.log(`⏱️  Estimeret tid: ${priceEstimate.estimatedHours} timer på stedet`);
    console.log(`👥 Medarbejdere: ${priceEstimate.workers} personer`);
    console.log(`⏰ Total arbejdstimer: ${priceEstimate.totalLaborHours} timer`);
    console.log(`💵 Pris range: ${priceEstimate.priceMin.toLocaleString()}-${priceEstimate.priceMax.toLocaleString()} kr inkl. moms`);
    console.log(`⏱️  Calculation time: ${priceTime}ms\n`);
    console.log("=".repeat(100) + "\n");

    // ============================================================
    // STEP 4: Find Available Calendar Slots
    // ============================================================
    console.log("STEP 4: 📅 Finding Available Slots\n");
    const startSlots = Date.now();
    
    const availableSlots = await findAvailableSlots({
      durationMinutes: priceEstimate.estimatedHours * 60,
      numberOfSlots: 5,
      maxDaysToSearch: 14,
    });
    
    const slotsTime = Date.now() - startSlots;
    console.log(`Found ${availableSlots.length} ledige tider:\n`);
    availableSlots.forEach((slot, i) => {
      const date = slot.start.toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long" });
      const time = slot.start.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
      const preferred = slot.preferredTime ? " ⭐" : "";
      console.log(`   ${i + 1}. ${date} kl. ${time}${preferred}`);
    });
    console.log(`\n⏱️  Slot search time: ${slotsTime}ms\n`);
    console.log("=".repeat(100) + "\n");

    // ============================================================
    // STEP 5: Generate Quote with AI
    // ============================================================
    console.log("STEP 5: ✉️  AI Quote Generation\n");
    const startQuote = Date.now();
    
    const quote = await generateQuote({
      parsedLead: parsed,
      priceEstimate,
      availableSlots,
      leadSource: parsed.leadSource,
      includeSpecialRequests: true,
    });
    
    const quoteTime = Date.now() - startQuote;
    console.log("📨 Generated Quote:");
    console.log("\n" + "-".repeat(100));
    console.log(`Subject: ${quote.subject}`);
    console.log("-".repeat(100));
    console.log(quote.body);
    console.log("-".repeat(100) + "\n");
    console.log(`⏱️  Quote generation time: ${quoteTime}ms\n`);
    console.log("=".repeat(100) + "\n");

    // ============================================================
    // FINAL SUMMARY
    // ============================================================
    const totalTime = parseTime + duplicateTime + priceTime + slotsTime + quoteTime;

    console.log("📊 WORKFLOW PERFORMANCE SUMMARY");
    console.log("=".repeat(100) + "\n");
    console.log(`✅ STEP 1: AI Lead Parsing       → ${parseTime}ms`);
    console.log(`✅ STEP 2: Duplicate Detection   → ${duplicateTime}ms`);
    console.log(`✅ STEP 3: Price Estimation      → ${priceTime}ms`);
    console.log(`✅ STEP 4: Slot Finding          → ${slotsTime}ms`);
    console.log(`✅ STEP 5: Quote Generation      → ${quoteTime}ms`);
    console.log(`\n⚡ TOTAL PROCESSING TIME: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
    console.log(`\n🎯 TIME SAVINGS:`);
    console.log(`   Manual Process: 5-10 minutes (300-600 seconds)`);
    console.log(`   RenOS Automated: ${(totalTime / 1000).toFixed(2)} seconds`);
    console.log(`   Savings: ${((1 - totalTime / 300000) * 100).toFixed(1)}% faster!`);
    console.log(`\n💡 STATUS: ${quote.metadata.confidence >= 80 ? "✅ Ready to send" : "⚠️ Review recommended"}`);
    console.log(`   Confidence: ${quote.metadata.confidence}%`);
    console.log("\n" + "=".repeat(100));
    console.log("🎉 COMPLETE WORKFLOW TEST PASSED!");
    console.log("=".repeat(100) + "\n");
  } catch (error) {
    console.error("\n❌ Workflow test failed:", error);
    process.exit(1);
  }
}

testCompleteWorkflow().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});








