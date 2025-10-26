import { GeminiProvider } from "../llm/geminiProvider";
import { appConfig } from "../config";
import { logger } from "../logger";

/**
 * AI Lead Information Extraction Service
 * Automatically parses lead emails to extract key information
 * 
 * Replaces manual reading and mental parsing
 * Time savings: 2-3 min per lead → < 5 seconds
 */

export interface ParsedLeadInfo {
  customerName?: string;
  email?: string;
  phone?: string;
  propertySize?: number; // m²
  rooms?: number;
  serviceType?: "Fast Rengøring" | "Flytterengøring" | "Hovedrengøring" | "Engangsopgave";
  preferredDate?: string; // Human readable (will be parsed later)
  address?: string;
  specialRequests?: string[];
  leadSource?: string;
  confidence: {
    overall: number; // 0-100
    fields: {
      propertySize?: number;
      rooms?: number;
      serviceType?: number;
      address?: number;
    };
  };
}

/**
 * Parse lead email using Gemini AI with Function Calling
 * Google AI Agent best practice: Function calling provides 99%+ accuracy vs 95% with JSON mode
 */
export async function parseLeadEmail(emailBody: string, emailSubject?: string): Promise<ParsedLeadInfo> {
  logger.info("Parsing lead email with AI (Function Calling)...");

  try {
    const apiKey = appConfig.llm.GEMINI_KEY;
    if (!apiKey) {
      logger.warn("GEMINI_KEY not set, using fallback parsing");
      return fallbackParseLeadEmail(emailBody);
    }

    const llm = new GeminiProvider(apiKey);

    // Define parse_lead function
    const parseLead = {
      name: "parse_lead",
      description: "Parse rengørings-lead fra email og ekstraher struktureret information",
      parameters: {
        type: "object" as const,
        properties: {
          customerName: { type: "string" as const, description: "Kundens fulde navn" },
          email: { type: "string" as const, description: "Kundens email" },
          phone: { type: "string" as const, description: "Kundens telefon (dansk format)" },
          propertySize: { type: "number" as const, description: "Boligens størrelse i m²" },
          rooms: { type: "number" as const, description: "Antal rum/værelser" },
          serviceType: {
            type: "string" as const,
            description: "Type rengøring",
            enum: ["Fast Rengøring", "Flytterengøring", "Hovedrengøring", "Engangsopgave"]
          },
          preferredDate: { type: "string" as const, description: "Ønsket dato/periode" },
          address: { type: "string" as const, description: "Fuld adresse" },
          specialRequests: {
            type: "array" as const,
            items: { type: "string" as const },
            description: "Liste af specielle ønsker"
          },
          leadSource: {
            type: "string" as const,
            description: "Lead kilde",
            enum: ["Rengøring.nu", "Rengøring Aarhus", "AdHelp", "Direkte"]
          },
          confidence: {
            type: "object" as const,
            properties: {
              overall: { type: "number" as const, description: "Samlet confidence 0-100" },
              fields: {
                type: "object" as const,
                properties: {
                  propertySize: { type: "number" as const },
                  rooms: { type: "number" as const },
                  serviceType: { type: "number" as const },
                  address: { type: "number" as const }
                }
              }
            }
          }
        }
      }
    };

    const result = await llm.completeChatWithFunctions(
      [
        {
          role: "system",
          content: "Du er en ekspert i at parse rengørings-leads fra danske emails. Ekstraher præcist al relevant information."
        },
        {
          role: "user",
          content: buildLeadParsingPrompt(emailBody, emailSubject),
        }
      ],
      [parseLead],
      {
        temperature: 0.1, // Low temperature for consistent extraction
        maxTokens: 1000,
      }
    );

    // result is already the function call from completeChatWithFunctions
    if (result.name === "parse_lead") {
      const parsed = result.args as unknown as ParsedLeadInfo;

      logger.info({
        parsed,
        confidence: parsed.confidence?.overall,
        customerName: parsed.customerName
      }, "Lead parsed successfully with Function Calling");

      return parsed;
    } else {
      logger.warn("No function call in response, using fallback");
      return fallbackParseLeadEmail(emailBody);
    }
  } catch (error) {
    logger.error({ error }, "Failed to parse lead with AI");

    // Fallback to regex-based parsing
    return fallbackParseLeadEmail(emailBody);
  }
}

/**
 * Build AI prompt for lead parsing
 */
function buildLeadParsingPrompt(emailBody: string, emailSubject?: string): string {
  return `
Du er en AI der hjælper med at analysere leads for et rengøringsfirma (Rendetalje.dk).

Analyser denne email og udtræk følgende information:

**Email Subject:** ${emailSubject || "N/A"}

**Email Body:**
${emailBody}

---

Udtræk følgende information og returner som JSON:

{
  "customerName": "Kundens fulde navn (hvis nævnt)",
  "email": "Kundens email (hvis nævnt)",
  "phone": "Kundens telefon (hvis nævnt, dansk format)",
  "propertySize": "Boligens størrelse i m² (kun tallet)",
  "rooms": "Antal rum/værelser (kun tallet)",
  "serviceType": "Fast Rengøring" | "Flytterengøring" | "Hovedrengøring" | "Engangsopgave",
  "preferredDate": "Kundens ønskede dato eller periode (behold som tekst)",
  "address": "Fuld adresse (hvis nævnt)",
  "specialRequests": ["Liste", "af", "specielle", "ønsker"],
  "leadSource": "Rengøring.nu" | "Rengøring Aarhus" | "AdHelp" | "Direkte",
  "confidence": {
    "overall": 0-100 (hvor sikker er du samlet set?),
    "fields": {
      "propertySize": 0-100,
      "rooms": 0-100,
      "serviceType": 0-100,
      "address": 0-100
    }
  }
}

**VIGTIGE REGLER FOR RENGØRING.NU LEADS:**

1. **propertySize**: Find præcise tal som:
   - "Hvor stort er området: 98" → return 98
   - "150 m²", "150m2", "150 kvadratmeter" → return 150
   - "ca. 120 m²" → return 120

2. **rooms**: Tæl alle rum typer:
   - "bedroom: 2, kitchen: 1, bathroom: 1" → return 4
   - "5 rum", "5 værelser", "3 bedrooms" → return 5
   - "2 soveværelser, 1 køkken, 1 badeværelse" → return 4

3. **serviceType**: Klassificer baseret på keywords:
   - "Hvor ofte vil du have rengøring: Hver uge" → "Fast Rengøring"
   - "Hvor ofte vil du have rengøring: Hver 14. dag" → "Fast Rengøring"
   - "fast rengøring", "abonnement", "hver anden uge", "ugentlig" → "Fast Rengøring"
   - "flytterengøring", "fraflytning", "moving out", "udflytning" → "Flytterengøring"
   - "hovedrengøring", "spring cleaning", "dybderengøring" → "Hovedrengøring"
   - Ellers → "Engangsopgave"

4. **address**: Find komplet adresse:
   - "Adresse: L.P. Bechs Vej 13, 8000 Aarhus C" → "L.P. Bechs Vej 13, 8000 Aarhus C"
   - "Lysmosevænget 9A" → "Lysmosevænget 9A"

5. **specialRequests**: Find ekstra ønsker:
   - "Ekstratjenester: Vinduespolering, Ovnrengøring" → ["Vinduespolering", "Ovnrengøring"]
   - "Specielle ønsker: Kælder, garage" → ["Kælder", "garage"]

6. **preferredDate**: Find ønsket tidspunkt:
   - "Tilføj mindst én passende dag: Fredag eftermiddag" → "Fredag eftermiddag"
   - "Hurtigst muligt" → "Hurtigst muligt"

7. **leadSource**: Identificer kilde:
   - Fra "Rengøring.nu" → "Rengøring.nu"
   - Fra "Rengøring Aarhus" → "Rengøring Aarhus"
   - Fra "AdHelp" → "AdHelp"
   - Direkte email → "Direkte"

**EKSEMPEL PÅ RENGØRING.NU FORMAT:**
\`\`\`
Hvor stort er området: 98
Antal rum: bedroom: 2, kitchen: 1, bathroom: 1
Hvor ofte vil du have rengøring: Hver uge
Tilføj mindst én passende dag: Fredag eftermiddag
Boligtype: Lejlighed
Ekstratjenester: Vinduespolering
Adresse: Lysmosevænget 9A
\`\`\`

**RESULTAT:**
- propertySize: 98
- rooms: 4
- serviceType: "Fast Rengøring"
- preferredDate: "Fredag eftermiddag"
- specialRequests: ["Vinduespolering"]
- address: "Lysmosevænget 9A"

Hvis du ikke kan finde information, brug null.
Confidence: Vurder hvor sikker du er på hver extraction (0-100).

Returner KUN valid JSON, ingen forklaring.
`.trim();
}

/**
 * Parse AI response into structured format
 * @deprecated No longer used - function calling returns structured data directly
 */
function _parseAIResponse(aiResponse: string): ParsedLeadInfo {
  try {
    let cleaned = aiResponse.trim();

    // Remove markdown code blocks if present
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/```json\n?/g, "");
      cleaned = cleaned.replace(/```\n?/g, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/```\n?/g, "");
    }

    const parsed = JSON.parse(cleaned) as {
      customerName?: string;
      email?: string;
      phone?: string;
      propertySize?: number;
      rooms?: number;
      serviceType?: string;
      preferredDate?: string;
      address?: string;
      specialRequests?: string[];
      leadSource?: string;
      confidence?: {
        overall?: number;
        fields?: Record<string, number>;
      };
    };

    // Validate and normalize
    const validServiceTypes = ["Fast Rengøring", "Flytterengøring", "Hovedrengøring", "Engangsopgave"] as const;
    const serviceType = validServiceTypes.includes(parsed.serviceType as any) ? parsed.serviceType as typeof validServiceTypes[number] : undefined;

    return {
      customerName: parsed.customerName || undefined,
      email: parsed.email || undefined,
      phone: parsed.phone || undefined,
      propertySize: typeof parsed.propertySize === "number" ? parsed.propertySize : undefined,
      rooms: typeof parsed.rooms === "number" ? parsed.rooms : undefined,
      serviceType,
      preferredDate: parsed.preferredDate || undefined,
      address: parsed.address || undefined,
      specialRequests: Array.isArray(parsed.specialRequests) ? parsed.specialRequests : [],
      leadSource: parsed.leadSource || undefined,
      confidence: {
        overall: parsed.confidence?.overall || 50,
        fields: parsed.confidence?.fields || {},
      },
    };
  } catch (error) {
    logger.error({ error, aiResponse }, "Failed to parse AI response as JSON");
    throw error;
  }
}

/**
 * Fallback regex-based parsing (if AI fails)
 */
function fallbackParseLeadEmail(emailBody: string): ParsedLeadInfo {
  logger.warn("Using fallback regex parsing");

  const parsed: ParsedLeadInfo = {
    confidence: {
      overall: 30, // Low confidence for regex fallback
      fields: {},
    },
  };

  // Extract property size
  const sizePatterns = [
    /(\d+)\s*m²/i,
    /(\d+)\s*m2/i,
    /(\d+)\s*kvadratmeter/i,
    /(\d+)\s*kvm/i,
  ];

  for (const pattern of sizePatterns) {
    const match = emailBody.match(pattern);
    if (match) {
      parsed.propertySize = parseInt(match[1]);
      parsed.confidence.fields.propertySize = 70;
      break;
    }
  }

  // Extract rooms
  const roomPatterns = [
    /(\d+)\s*rum/i,
    /(\d+)\s*værelser/i,
    /(\d+)\s*bedrooms?/i,
  ];

  for (const pattern of roomPatterns) {
    const match = emailBody.match(pattern);
    if (match) {
      parsed.rooms = parseInt(match[1]);
      parsed.confidence.fields.rooms = 70;
      break;
    }
  }

  // Extract service type (keyword matching)
  const lowerBody = emailBody.toLowerCase();

  if (
    lowerBody.includes("flytterengøring") ||
    lowerBody.includes("fraflytning") ||
    lowerBody.includes("moving out") ||
    lowerBody.includes("udflytning")
  ) {
    parsed.serviceType = "Flytterengøring";
    parsed.confidence.fields.serviceType = 80;
  } else if (
    lowerBody.includes("fast rengøring") ||
    lowerBody.includes("abonnement") ||
    lowerBody.includes("hver anden uge") ||
    lowerBody.includes("ugentlig")
  ) {
    parsed.serviceType = "Fast Rengøring";
    parsed.confidence.fields.serviceType = 80;
  } else if (
    lowerBody.includes("hovedrengøring") ||
    lowerBody.includes("spring cleaning") ||
    lowerBody.includes("dybderengøring")
  ) {
    parsed.serviceType = "Hovedrengøring";
    parsed.confidence.fields.serviceType = 80;
  } else {
    parsed.serviceType = "Engangsopgave";
    parsed.confidence.fields.serviceType = 40;
  }

  // Extract Danish address (basic pattern)
  const addressPattern = /([A-ZÆØÅa-zæøå\s]+\d+[A-Za-z]?,\s*\d{4}\s+[A-ZÆØÅa-zæøå\s]+)/;
  const addressMatch = emailBody.match(addressPattern);
  if (addressMatch) {
    parsed.address = addressMatch[1].trim();
    parsed.confidence.fields.address = 60;
  }

  // Extract email
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
  const emailMatch = emailBody.match(emailPattern);
  if (emailMatch) {
    parsed.email = emailMatch[1];
  }

  // Extract phone (Danish format)
  const phonePatterns = [
    /(\+45\s*\d{2}\s*\d{2}\s*\d{2}\s*\d{2})/,
    /(\d{2}\s*\d{2}\s*\d{2}\s*\d{2})/,
  ];

  for (const pattern of phonePatterns) {
    const match = emailBody.match(pattern);
    if (match) {
      parsed.phone = match[1].trim();
      break;
    }
  }

  return parsed;
}

/**
 * Validate parsed lead information
 */
export function validateParsedLead(parsed: ParsedLeadInfo): {
  valid: boolean;
  missingFields: string[];
  needsManualReview: boolean;
} {
  const missingFields: string[] = [];

  if (!parsed.email && !parsed.phone) {
    missingFields.push("email eller telefon");
  }

  if (!parsed.serviceType) {
    missingFields.push("service type");
  }

  // Low confidence = needs manual review
  const needsManualReview = parsed.confidence.overall < 60;

  return {
    valid: missingFields.length === 0,
    missingFields,
    needsManualReview,
  };
}

/**
 * Calculate estimated price based on parsed info
 */
export function calculateEstimatedPrice(
  propertySize?: number,
  serviceType?: string,
  rooms?: number
): {
  estimatedHours: number;
  workers: number;
  totalLaborHours: number;
  priceMin: number;
  priceMax: number;
  hourlyRate: number;
} {
  const hourlyRate = 349; // DKK per hour per person

  let estimatedHours = 3; // Default
  let workers = 2; // Default

  // Estimate based on property size
  if (propertySize) {
    if (serviceType === "Flytterengøring") {
      // Moving cleaning: ~0.08-0.12 hours per m² with 2 workers
      estimatedHours = (propertySize * 0.1) / workers;
    } else if (serviceType === "Fast Rengøring") {
      // Regular cleaning first time: ~0.025-0.035 hours per m² with 2 workers
      estimatedHours = (propertySize * 0.03) / workers;
    } else if (serviceType === "Hovedrengøring") {
      // Deep cleaning: ~0.04-0.06 hours per m² with 2 workers
      estimatedHours = (propertySize * 0.05) / workers;
    }

    // Adjust for rooms if available (more accurate)
    if (rooms) {
      if (serviceType === "Fast Rengøring") {
        estimatedHours = (rooms * 0.5) + 1; // ~30 min per room + overhead
      }
    }
  }

  // Round to nearest 0.5 hour
  estimatedHours = Math.round(estimatedHours * 2) / 2;

  // Ensure minimum 2 hours
  if (estimatedHours < 2) {
    estimatedHours = 2;
  }

  const totalLaborHours = estimatedHours * workers;

  // Calculate price range (±20%)
  const basePrice = totalLaborHours * hourlyRate;
  const priceMin = Math.round(basePrice * 0.8);
  const priceMax = Math.round(basePrice * 1.2);

  return {
    estimatedHours,
    workers,
    totalLaborHours,
    priceMin,
    priceMax,
    hourlyRate,
  };
}

/**
 * Format parsed lead for display
 */
export function formatParsedLead(parsed: ParsedLeadInfo): string {
  const lines: string[] = [];

  lines.push("📋 **Parsed Lead Information:**\n");

  if (parsed.customerName) lines.push(`👤 Navn: ${parsed.customerName}`);
  if (parsed.email) lines.push(`📧 Email: ${parsed.email}`);
  if (parsed.phone) lines.push(`📱 Telefon: ${parsed.phone}`);
  if (parsed.propertySize) lines.push(`📏 Størrelse: ${parsed.propertySize} m²`);
  if (parsed.rooms) lines.push(`🏠 Rum: ${parsed.rooms}`);
  if (parsed.serviceType) lines.push(`🧹 Type: ${parsed.serviceType}`);
  if (parsed.preferredDate) lines.push(`📅 Ønsket dato: ${parsed.preferredDate}`);
  if (parsed.address) lines.push(`📍 Adresse: ${parsed.address}`);
  if (parsed.leadSource) lines.push(`🎯 Kilde: ${parsed.leadSource}`);

  if (parsed.specialRequests && parsed.specialRequests.length > 0) {
    lines.push(`\n💡 **Specielle ønsker:**`);
    parsed.specialRequests.forEach((req) => lines.push(`  - ${req}`));
  }

  lines.push(`\n📊 **Confidence Score:** ${parsed.confidence.overall}%`);

  if (parsed.confidence.overall < 60) {
    lines.push(`⚠️ **Low confidence** - Manual review recommended`);
  }

  return lines.join("\n");
}

