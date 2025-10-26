/**
 * Test Lead Parsing Service
 * Quick CLI tool to test AI lead extraction
 */

import { parseLeadEmail, formatParsedLead, calculateEstimatedPrice } from "../services/leadParsingService";
import { findAvailableSlots, formatSlotsForQuote } from "../services/slotFinderService";

const SAMPLE_LEADS = {
  fastRengoering: `
Hej,

Jeg søger fast rengøring hver 2. uge af min 150m² villa med 5 rum på Hovedgade 123, 8000 Aarhus C.

Jeg vil gerne have det startet omkring 20. oktober hvis muligt.

Kan I også gøre vinduer rent?

Med venlig hilsen,
Mette Nielsen
mette.nielsen@example.com
22 65 02 26
`,

  flytteRengoering: `
Hej Rendetalje,

Jeg skal flytte fra min lejlighed på 85 m² med 3 værelser på Nørregade 45, 8000 Aarhus C.

Fraflytningsdatoen er d. 15. oktober, så det skal helst være den 14. oktober.

Skal hele lejligheden gøres rent inkl. køleskab og ovn.

Best regards,
Lars Jensen
lars@email.dk
+45 12 34 56 78
`,

  hovedRengoering: `
God dag,

Vi har brug for en hovedrengøring af vores 200m² hus med 6 rum i Hjortshøj.

Det skal være en dybderengøring af alle rum, vinduer indvendigt og udvendigt, samt ovn.

Hvornår har I tid? Gerne i næste uge.

Venlig hilsen
Peter & Anne
kontakt@petersen.dk
`,

  engangOpgave: `
Hej,

Jeg skal bruge hjælp til rengøring efter en renovation. Omkring 120 m², 4 rum.

Der er meget støv og skal have en grundig rengøring.

Adresse: Viborgvej 234, 8000 Aarhus C

Kontakt mig på 40 50 60 70

Mvh
Jens
`,
};

async function testLeadParsing(leadType: keyof typeof SAMPLE_LEADS) {
  console.log("\n" + "=".repeat(80));
  console.log(`🧪 Testing Lead Parsing: ${leadType}`);
  console.log("=".repeat(80) + "\n");

  const emailBody = SAMPLE_LEADS[leadType];

  console.log("📧 Original Email:");
  console.log(emailBody);
  console.log("\n" + "-".repeat(80) + "\n");

  try {
    // Parse lead
    console.log("🤖 AI Parsing...\n");
    const parsed = await parseLeadEmail(emailBody, `Lead: ${leadType}`);

    console.log(formatParsedLead(parsed));
    console.log("\n" + "-".repeat(80) + "\n");

    // Calculate price estimate
    console.log("💰 Price Estimation:\n");
    const estimate = calculateEstimatedPrice(
      parsed.propertySize,
      parsed.serviceType,
      parsed.rooms
    );

    console.log(`⏱️  Estimeret tid: ${estimate.estimatedHours} timer på stedet`);
    console.log(`👥 Medarbejdere: ${estimate.workers} personer`);
    console.log(`⏰ Total arbejdstimer: ${estimate.totalLaborHours} timer`);
    console.log(`💵 Pris range: ${estimate.priceMin.toLocaleString()}-${estimate.priceMax.toLocaleString()} kr inkl. moms`);
    console.log(`💶 Timepris: ${estimate.hourlyRate} kr/time/person`);
    console.log("\n" + "-".repeat(80) + "\n");

    // Find available slots
    console.log("📅 Finding Available Slots:\n");
    const slots = await findAvailableSlots({
      durationMinutes: estimate.estimatedHours * 60,
      numberOfSlots: 5,
      maxDaysToSearch: 14,
    });

    console.log(formatSlotsForQuote(slots));
    console.log("\n" + "-".repeat(80) + "\n");

    console.log("✅ Lead Parsing Test Complete!");
    console.log(`\n📊 Summary:`);
    console.log(`   - Confidence: ${parsed.confidence.overall}%`);
    console.log(`   - Available Slots: ${slots.length}`);
    console.log(`   - Estimated Price: ${estimate.priceMin.toLocaleString()}-${estimate.priceMax.toLocaleString()} kr`);
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// CLI
const leadType = (process.argv[2] as keyof typeof SAMPLE_LEADS) || "fastRengoering";

if (!SAMPLE_LEADS[leadType]) {
  console.error(`❌ Unknown lead type: ${leadType}`);
  console.log(`\nAvailable types:`);
  Object.keys(SAMPLE_LEADS).forEach((type) => console.log(`  - ${type}`));
  process.exit(1);
}

testLeadParsing(leadType).catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});








