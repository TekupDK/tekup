const { validateQuoteCompleteness } = require('./dist/validation/quoteValidation');

const goodQuote = `
Hej Test Kunde!

Tak for din henvendelse om almindelig rengøring.

📏 Bolig: 75m² med 3 værelser
👥 Medarbejdere: 2 personer  
⏱️ Estimeret tid: 4 timer på stedet
⏱️ Arbejdstimer total: 8 arbejdstimer (2 personer × 4 timer)
💰 Pris: 349kr/time/person = ca.2.792kr inkl. moms

💡 Du betaler kun faktisk tidsforbrug
Estimatet er vejledende. Hvis opgaven tager længere tid, betaler du kun for den faktiske tid brugt.

📞 Vi ringer ved +1 time overskridelse
Hvis opgaven tager mere end 1 time ekstra over estimatet, ringer vi til dig inden vi fortsætter.

Mvh, Jonas - Rendetalje.dk
`;

console.log("Testing good quote:");
const result = validateQuoteCompleteness(goodQuote);
console.log(JSON.stringify(result, null, 2));

if (result.valid) {
    console.log("\n✅ VALIDATION PASSED!");
} else {
    console.log("\n❌ VALIDATION FAILED!");
    console.log("Errors:", result.errors);
    console.log("Warnings:", result.warnings);
}
