import { GeminiProvider } from "../llm/geminiProvider";
import { appConfig } from "../config";
import { logger } from "../logger";
import { ParsedLeadInfo } from "./leadParsingService";
import { TimeSlot, formatSlotsForQuote } from "./slotFinderService";

/**
 * AI Quote Generation Service
 * Generates personalized customer quotes following Rendetalje.dk format
 * 
 * Replaces manual quote writing
 * Time savings: 3-5 min per quote → 5 seconds
 */

export interface QuoteGenerationInput {
  parsedLead: ParsedLeadInfo;
  priceEstimate: {
    estimatedHours: number;
    workers: number;
    totalLaborHours: number;
    priceMin: number;
    priceMax: number;
    hourlyRate: number;
  };
  availableSlots: TimeSlot[];
  leadSource?: string;
  includeSpecialRequests?: boolean;
}

export interface GeneratedQuote {
  subject: string;
  body: string;
  bodyHtml?: string;
  to: string;
  metadata: {
    generatedAt: Date;
    leadSource?: string;
    confidence: number;
  };
}

/**
 * Generate customer quote using AI with Rendetalje.dk template
 */
export async function generateQuote(input: QuoteGenerationInput): Promise<GeneratedQuote> {
  logger.info({ customerEmail: input.parsedLead.email }, "Generating customer quote with AI");

  const prompt = buildQuoteGenerationPrompt(input);

  try {
    const apiKey = appConfig.llm.GEMINI_KEY;
    if (!apiKey) {
      logger.warn("GEMINI_KEY not set, using template-based quote");
      return generateTemplateQuote(input);
    }

    const llm = new GeminiProvider(apiKey);
    const aiResponse = await llm.completeChat([
      {
        role: "user",
        content: prompt,
      }
    ], {
      temperature: 0.3, // Some creativity but consistent
      maxTokens: 1500,
    });

    const quote = parseQuoteResponse(aiResponse, input);

    logger.info({ to: quote.to }, "Quote generated successfully with AI");

    return quote;
  } catch (error) {
    logger.error({ error }, "Failed to generate quote with AI, using template");
    return generateTemplateQuote(input);
  }
}

/**
 * Build AI prompt for quote generation
 */
function buildQuoteGenerationPrompt(input: QuoteGenerationInput): string {
  const { parsedLead, priceEstimate, availableSlots, leadSource } = input;

  const formattedSlots = formatSlotsForQuote(availableSlots);

  return `
Du er en professionel rengøringskonsulent hos Rendetalje.dk der skriver tilbud til kunder.

**Kunde Information:**
- Navn: ${parsedLead.customerName || "Kunden"}
- Email: ${parsedLead.email}
- Telefon: ${parsedLead.phone || "ikke oplyst"}
- Adresse: ${parsedLead.address || "ikke oplyst"}

**Rengøringsbehov:**
- Type: ${parsedLead.serviceType}
- Størrelse: ${parsedLead.propertySize} m²
- Rum: ${parsedLead.rooms || "ikke oplyst"}
- Ønsket dato: ${parsedLead.preferredDate || "hurtigst muligt"}
${parsedLead.specialRequests && parsedLead.specialRequests.length > 0 
  ? `- Specielle ønsker: ${parsedLead.specialRequests.join(", ")}` 
  : ""}

**Lead Kilde:**
${leadSource || "Direkte henvendelse"}

**Pris Estimat:**
- Estimeret tid: ${priceEstimate.estimatedHours} timer på stedet
- Medarbejdere: ${priceEstimate.workers} personer
- Total arbejdstimer: ${priceEstimate.totalLaborHours} timer
- Timepris: ${priceEstimate.hourlyRate} kr/time/person
- Pris range: ${priceEstimate.priceMin.toLocaleString()}-${priceEstimate.priceMax.toLocaleString()} kr inkl. moms

**Ledige Tider:**
${formattedSlots}

---

**Opgave:** Skriv et professionelt tilbud til kunden der følger Rendetalje.dk's standardformat.

**Standardformat (VIGTIGT - brug præcist dette format):**

Emne: Tilbud på ${parsedLead.serviceType}${parsedLead.address ? ` - ${parsedLead.address.split(",")[0]}` : ""}

Hej ${parsedLead.customerName || "der"},

Tak for din henvendelse via ${leadSource || "direkte henvendelse"} 🌿

Vi kan hjælpe med ${parsedLead.serviceType?.toLowerCase()} af din ${parsedLead.propertySize ? parsedLead.propertySize + "m² " : ""}${parsedLead.address ? "på " + parsedLead.address : "bolig"}.

${parsedLead.propertySize ? `📏 Bolig: ${parsedLead.propertySize} m²${parsedLead.rooms ? ` med ${parsedLead.rooms} rum` : ""}` : "📏 Bolig: [størrelse og rum oplyses ved booking]"}
👥 Medarbejdere: ${priceEstimate.workers} personer
⏱️ Estimeret tid: ${priceEstimate.estimatedHours} timer på stedet = ${priceEstimate.totalLaborHours} arbejdstimer total
💰 Pris: ${priceEstimate.hourlyRate} kr/time/person = ca. ${priceEstimate.priceMin.toLocaleString()}-${priceEstimate.priceMax.toLocaleString()} kr inkl. moms

${parsedLead.preferredDate && parsedLead.preferredDate !== "Hurtigst muligt" 
  ? `🗓️ Du ønskede: ${parsedLead.preferredDate}\n` 
  : ""}
📅 **Ledige tider de næste 2 uger:**
${formattedSlots}

${parsedLead.specialRequests && parsedLead.specialRequests.length > 0 
  ? `\n💡 Vi noterer dine specielle ønsker: ${parsedLead.specialRequests.join(", ")}\n` 
  : ""}
💡 Du betaler kun for det faktiske tidsforbrug
📞 Vi ringer ved eventuel overskridelse på +1 time

Hvilken tid passer bedst for dig?

Med venlig hilsen,
Jonas fra Rendetalje.dk
📱 22 65 02 26
📧 info@rendetalje.dk

---

**Instruktioner:**
1. Brug PRÆCIST dette format med emoji og struktur
2. Tilpas tonen efter lead kilde:
   - Rengøring.nu / Rengøring Aarhus: Mere formel og professionel
   - Direkte henvendelse: Varm og personlig
3. Hvis kunde har specielle ønsker, nævn dem og bekræft vi kan hjælpe
4. Hvis ønsket dato er nævnt, prioriter slots omkring den dato
5. Hold tonen positiv, hjælpsom og professionel
6. Brug dansk sprogregler korrekt

Returner kun email subject og body, ingen forklaring.
Format som:

SUBJECT: [email subject her]

BODY:
[email body her]
`.trim();
}

/**
 * Parse AI quote response
 */
function parseQuoteResponse(aiResponse: string, input: QuoteGenerationInput): GeneratedQuote {
  const lines = aiResponse.split("\n");

  let subject = "";
  let bodyLines: string[] = [];
  let inBody = false;

  for (const line of lines) {
    if (line.startsWith("SUBJECT:")) {
      subject = line.replace("SUBJECT:", "").trim();
    } else if (line.startsWith("BODY:")) {
      inBody = true;
    } else if (inBody) {
      bodyLines.push(line);
    }
  }

  const body = bodyLines.join("\n").trim();

  // Fallback if parsing failed
  if (!subject || !body) {
    logger.warn("Failed to parse AI quote response, using template");
    return generateTemplateQuote(input);
  }

  return {
    subject,
    body,
    to: input.parsedLead.email || "",
    metadata: {
      generatedAt: new Date(),
      leadSource: input.leadSource,
      confidence: input.parsedLead.confidence.overall,
    },
  };
}

/**
 * Generate quote using template (fallback if AI fails)
 */
function generateTemplateQuote(input: QuoteGenerationInput): GeneratedQuote {
  const { parsedLead, priceEstimate, availableSlots, leadSource } = input;

  const formattedSlots = formatSlotsForQuote(availableSlots);

  const subject = `Tilbud på ${parsedLead.serviceType}${parsedLead.address ? ` - ${parsedLead.address.split(",")[0]}` : ""}`;

  const body = `
Hej ${parsedLead.customerName || "der"},

Tak for din henvendelse via ${leadSource || "direkte henvendelse"} 🌿

Vi kan hjælpe med ${parsedLead.serviceType?.toLowerCase()} af din ${parsedLead.propertySize ? parsedLead.propertySize + "m² " : ""}${parsedLead.address ? "på " + parsedLead.address : "bolig"}.

📏 Bolig: ${parsedLead.propertySize || "ca. [størrelse]"} m²${parsedLead.rooms ? ` med ${parsedLead.rooms} rum` : ""}
👥 Medarbejdere: ${priceEstimate.workers} personer
⏱️ Estimeret tid: ${priceEstimate.estimatedHours} timer på stedet = ${priceEstimate.totalLaborHours} arbejdstimer total
💰 Pris: ${priceEstimate.hourlyRate} kr/time/person = ca. ${priceEstimate.priceMin.toLocaleString()}-${priceEstimate.priceMax.toLocaleString()} kr inkl. moms

📅 **Ledige tider de næste 2 uger:**
${formattedSlots}

${parsedLead.specialRequests && parsedLead.specialRequests.length > 0 
  ? `💡 Vi noterer dine specielle ønsker: ${parsedLead.specialRequests.join(", ")}\n\n` 
  : ""}💡 Du betaler kun for det faktiske tidsforbrug
📞 Vi ringer ved eventuel overskridelse på +1 time

Hvilken tid passer bedst for dig?

Med venlig hilsen,
Jonas fra Rendetalje.dk
📱 22 65 02 26
📧 info@rendetalje.dk
`.trim();

  return {
    subject,
    body,
    to: parsedLead.email || "",
    metadata: {
      generatedAt: new Date(),
      leadSource,
      confidence: parsedLead.confidence.overall,
    },
  };
}

/**
 * Generate HTML version of quote for email clients that support it
 */
export function generateQuoteHTML(quote: GeneratedQuote): string {
  const bodyHtml = quote.body
    .replace(/\n/g, "<br>")
    .replace(/📏/g, "📏")
    .replace(/👥/g, "👥")
    .replace(/⏱️/g, "⏱️")
    .replace(/💰/g, "💰")
    .replace(/📅/g, "📅")
    .replace(/💡/g, "💡")
    .replace(/📞/g, "📞")
    .replace(/🌿/g, "🌿");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .emoji { font-size: 1.2em; }
    .price { font-weight: bold; color: #00A651; }
    .slots { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>
`.trim();
}








