/**
 * Quote Validation CLI Tool
 * 
 * Test quote validation against business rules.
 * Usage: npm run quote:validate
 */

import { validateQuoteCompleteness, formatValidationReport } from "../validation/quoteValidation";
import { logger } from "../logger";

// Test quotes - one good, one bad
const TEST_QUOTES = {
    good: `
Hej Peter!

Tak for din henvendelse om flytterengøring.

📏 **Bolig**: 80m² med 3 værelser
👥 **Medarbejdere**: 2 personer
⏱️ **Estimeret tid**: 4 timer på stedet = 8 arbejdstimer total
💰 **Pris**: 349kr/time/person = ca.2.792-3.490kr inkl. moms

📅 **Ledige tider**: Onsdag d. 10. okt kl. 09:00, Torsdag d. 11. okt kl. 13:00

💡 **Du betaler kun faktisk tidsforbrug**
Estimatet er vejledende. Hvis opgaven tager længere tid, betaler du kun for den faktiske tid brugt.

📞 **Vi ringer ved +1 time overskridelse**
Hvis opgaven tager mere end 1 time ekstra over estimatet, ringer vi til dig inden vi fortsætter.

Lyder det godt? Svar gerne med din foretrukne dato, så booker jeg det i kalenderen.

Mvh,
Jonas - Rendetalje.dk
    `,

    bad_old_price: `
Hej Marie!

Tak for din henvendelse.

Vi kan tilbyde flytterengøring til 300 kr/time.
Estimeret tid: 4 timer = 1.200kr

Hvis opgaven tager +3-5 timer ekstra, giver vi besked.

Mvh,
Jonas
    `,

    bad_missing_info: `
Hej Lars!

Vi kan rengøre din bolig for ca. 2.500kr.

Kontakt os for booking.

Mvh,
Jonas
    `,

    cecilie_scenario: `
Hej Cecilie!

Tak for din henvendelse om flytterengøring.

📏 **Bolig**: 95m²
⏱️ **Estimeret tid**: 4 timer
💰 **Pris**: ca.1.396kr inkl. moms

Vi kontakter dig hvis opgaven tager længere tid.

Mvh,
Jonas
    `,
};

function main() {
    console.log("\n🧪 QUOTE VALIDATION TEST\n");
    console.log("=".repeat(60));

    for (const [testName, quoteBody] of Object.entries(TEST_QUOTES)) {
        console.log(`\n\n📋 TEST: ${testName.toUpperCase()}`);
        console.log("-".repeat(60));
        console.log(quoteBody.trim());
        console.log("-".repeat(60));

        const result = validateQuoteCompleteness(quoteBody);
        const report = formatValidationReport(result);

        console.log("\n" + report);

        if (result.valid) {
            console.log("\n✅ PASSED - Quote is complete and ready to send");
        } else {
            console.log("\n❌ FAILED - Quote has critical errors");
            console.log("\nMissing elements:", result.missingElements.join(", "));
        }

        console.log("\n" + "=".repeat(60));
    }

    // Interactive mode if quote provided as argument
    if (process.argv[2]) {
        console.log("\n\n📋 CUSTOM QUOTE VALIDATION");
        console.log("=".repeat(60));

        const customQuote = process.argv.slice(2).join(" ");
        const result = validateQuoteCompleteness(customQuote);
        const report = formatValidationReport(result);

        console.log("\n" + report);

        process.exit(result.valid ? 0 : 1);
    }
}

try {
    main();
} catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error }, "Quote validation test failed");
    console.error("\n❌ Error:", errorMessage);
    process.exit(1);
}
