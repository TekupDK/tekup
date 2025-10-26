/**
 * Test Gemini Function Calling
 * Verificer 99%+ accuracy på lead parsing
 */

import { GeminiProvider } from "../llm/geminiProvider";
import { appConfig } from "../config";
import type { FunctionDeclaration } from "../llm/llmProvider";

const geminiKey = appConfig.llm.GEMINI_KEY;
if (!geminiKey) {
    throw new Error("GEMINI_KEY is required for this test");
}

const gemini = new GeminiProvider(geminiKey);

// Test emails
const testLeads = [
    {
        name: "Thomas Dalager",
        email: `Fra: Thomas Dalager <thomasdjoergensen87@gmail.com>
Emne: Rengøring af lejlighed

Hej,

Jeg har brug for rengøring af min lejlighed på 75 kvm i København K.
Det drejer sig om fast ugentlig rengøring hver tirsdag kl. 10-12.

Min adresse er Nørregade 15, 1165 København K.
Tlf: +45 23 45 67 89

Mvh Thomas Dalager`,
        expected: {
            name: "Thomas Dalager",
            email: "thomasdjoergensen87@gmail.com",
            phone: "+45 23 45 67 89",
            address: "Nørregade 15, 1165 København K",
            squareMeters: 75
        }
    },
    {
        name: "Mikkel Weggerby",
        email: `Fra: Mikkel Weggerby <mikkelweggerby85@gmail.com>
Emne: Vinduespudsning

Hallo,

Jeg skal bruge vinduespudsning af mit hus på 120 kvm.
Vi har mange vinduer og det skal gøres grundigt.

Adresse: Strandvejen 42, 2900 Hellerup
Telefon: 22 33 44 55

Mvh,
Mikkel`,
        expected: {
            name: "Mikkel Weggerby",
            email: "mikkelweggerby85@gmail.com",
            phone: "22 33 44 55",
            address: "Strandvejen 42, 2900 Hellerup",
            squareMeters: 120
        }
    }
];

// Function declaration for lead parsing
const parseLeadFunction: FunctionDeclaration = {
    name: "parse_lead",
    description: "Parse a cleaning service lead email and extract customer information",
    parameters: {
        type: "object",
        properties: {
            name: {
                type: "string",
                description: "Customer's full name"
            },
            email: {
                type: "string",
                description: "Customer's email address"
            },
            phone: {
                type: "string",
                description: "Customer's phone number (include country code if present)"
            },
            address: {
                type: "string",
                description: "Full address including street, postal code and city"
            },
            city: {
                type: "string",
                description: "City name"
            },
            postalCode: {
                type: "string",
                description: "Postal code"
            },
            squareMeters: {
                type: "number",
                description: "Size of property in square meters"
            },
            serviceType: {
                type: "string",
                description: "Type of cleaning service requested",
                enum: ["lejlighed", "hus", "vinduespudsning", "erhverv", "moving", "fast rengøring"]
            },
            cleaningFrequency: {
                type: "string",
                description: "Frequency of cleaning (if mentioned)",
                enum: ["ugentlig", "hver 14. dag", "månedlig", "engangs"]
            },
            preferredDay: {
                type: "string",
                description: "Preferred day of week (if mentioned)"
            },
            preferredTime: {
                type: "string",
                description: "Preferred time (if mentioned)"
            },
            additionalInfo: {
                type: "string",
                description: "Any additional information or special requests"
            }
        },
        required: ["name", "email"]
    }
};

interface ParsedLead {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    squareMeters?: number;
    serviceType?: string;
    cleaningFrequency?: string;
    preferredDay?: string;
    preferredTime?: string;
    additionalInfo?: string;
}

async function testFunctionCalling() {
    console.log("\n🧪 GEMINI FUNCTION CALLING TEST");
    console.log("=".repeat(70));
    console.log(`📅 Date: ${new Date().toLocaleString("da-DK")}`);
    console.log(`🎯 Target: 99%+ accuracy on lead parsing`);
    console.log(`📧 Test cases: ${testLeads.length}\n`);

    let successCount = 0;
    let totalFields = 0;
    let correctFields = 0;

    for (const testLead of testLeads) {
        console.log(`\n${"=".repeat(70)}`);
        console.log(`📨 Testing: ${testLead.name}`);
        console.log(`${"=".repeat(70)}`);

        try {
            const startTime = Date.now();

            const result = await gemini.completeChatWithFunctions<ParsedLead>(
                [
                    {
                        role: "system",
                        content: "Du er en AI-assistent der parser rengørings-leads fra emails. Ekstraher al relevant kundeinformation."
                    },
                    {
                        role: "user",
                        content: `Parse denne email:\n\n${testLead.email}`
                    }
                ],
                [parseLeadFunction]
            );

            const responseTime = Date.now() - startTime;

            console.log(`\n✅ Function call received: ${result.name}`);
            console.log(`⏱️  Response time: ${responseTime}ms`);
            console.log(`\n📋 Parsed data:`);
            console.log(JSON.stringify(result.parsedArgs, null, 2));

            // Verify against expected values
            console.log(`\n🔍 Verification:`);
            const fields = Object.keys(testLead.expected) as Array<keyof typeof testLead.expected>;

            for (const field of fields) {
                totalFields++;
                const expected = testLead.expected[field];
                const actual = result.parsedArgs[field];

                if (expected === actual) {
                    console.log(`   ✅ ${field}: ${actual}`);
                    correctFields++;
                } else {
                    console.log(`   ❌ ${field}: Expected "${expected}", got "${actual}"`);
                }
            }

            successCount++;

        } catch (error) {
            console.error(`\n❌ Failed to parse lead:`, error);
        }
    }

    // Final statistics
    console.log(`\n\n${"=".repeat(70)}`);
    console.log("📊 FINAL RESULTS");
    console.log(`${"=".repeat(70)}`);
    console.log(`\n✅ Successful parses: ${successCount}/${testLeads.length} (${(successCount / testLeads.length * 100).toFixed(1)}%)`);
    console.log(`🎯 Field accuracy: ${correctFields}/${totalFields} (${(correctFields / totalFields * 100).toFixed(1)}%)`);

    if (correctFields / totalFields >= 0.99) {
        console.log(`\n🎉 TARGET ACHIEVED: 99%+ accuracy!`);
    } else if (correctFields / totalFields >= 0.95) {
        console.log(`\n⚠️  Close but not quite 99% - need ${Math.ceil((0.99 * totalFields) - correctFields)} more correct fields`);
    } else {
        console.log(`\n❌ Below target - need improvement`);
    }

    console.log(`\n${"=".repeat(70)}\n`);
}

testFunctionCalling().catch(console.error);
