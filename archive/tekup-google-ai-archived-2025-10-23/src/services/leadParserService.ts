import { logger } from "../logger";

/**
 * Lead Information Extraction Service
 * Automatically parses lead emails to extract key information
 * 
 * Extracts:
 * - Size (m²): "150 m²", "150m2", "150 kvadratmeter"
 * - Rooms: "5 rum", "5 værelser", "3 bedrooms"
 * - Service Type: Fast rengøring, Flytterengøring, Hovedrengøring
 * - Preferred Date: "omkring 20. oktober", "hurtigst muligt", "next week"
 * - Address: "Hovedgade 123, 8000 Aarhus C"
 */

export type ServiceType =
  | "Fast Rengøring"
  | "Flytterengøring"
  | "Hovedrengøring"
  | "Engangsr engøring"
  | "Unknown";

export type FrequencyType =
  | "ugentlig"
  | "14-dages"
  | "månedlig"
  | "engangsbasis"
  | null;

export interface ParsedLeadInfo {
  size?: number; // m²
  rooms?: number;
  serviceType: ServiceType;
  frequency?: FrequencyType;
  preferredDate?: Date;
  address?: string;
  specialRequests?: string[];
  confidence: {
    size: number; // 0-1
    rooms: number;
    serviceType: number;
    address: number;
    overall: number;
  };
  rawText: string;
}

/**
 * Parse lead email text and extract structured information
 */
export function parseLeadEmail(emailText: string): ParsedLeadInfo {
  const text = emailText.toLowerCase();

  const size = extractSize(text);
  const rooms = extractRooms(text);
  const serviceType = classifyServiceType(text);
  const frequency = extractFrequency(text);
  const preferredDate = extractPreferredDate(text);
  const address = extractAddress(emailText); // Use original case for address
  const specialRequests = extractSpecialRequests(text);

  // Calculate confidence scores
  const sizeConfidence = size ? 1.0 : 0.0;
  const roomsConfidence = rooms ? 0.8 : 0.0;
  const serviceTypeConfidence = serviceType !== "Unknown" ? 0.9 : 0.3;
  const addressConfidence = address ? 0.9 : 0.0;

  const overallConfidence =
    (sizeConfidence + roomsConfidence + serviceTypeConfidence + addressConfidence) / 4;

  return {
    size,
    rooms,
    serviceType,
    frequency,
    preferredDate,
    address,
    specialRequests,
    confidence: {
      size: sizeConfidence,
      rooms: roomsConfidence,
      serviceType: serviceTypeConfidence,
      address: addressConfidence,
      overall: overallConfidence,
    },
    rawText: emailText,
  };
}

/**
 * Extract size in m² from text
 * Patterns: "150 m²", "150m2", "150 kvm", "150 kvadratmeter"
 */
function extractSize(text: string): number | undefined {
  // Try various size patterns
  const patterns = [
    /(\d{2,4})\s*m[²2]/i, // "150 m²" or "150m2"
    /(\d{2,4})\s*kvm/i, // "150 kvm"
    /(\d{2,4})\s*kvadratmeter/i, // "150 kvadratmeter"
    /(\d{2,4})\s*sqm/i, // "150 sqm" (for English speakers)
    /(\d{2,4})\s*square\s*meters/i, // "150 square meters"
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const size = parseInt(match[1], 10);
      // Sanity check: typical cleaning sizes are 30-500m²
      if (size >= 30 && size <= 500) {
        return size;
      }
    }
  }

  return undefined;
}

/**
 * Extract number of rooms from text
 * Patterns: "5 rum", "5 værelser", "3 bedrooms"
 */
function extractRooms(text: string): number | undefined {
  const patterns = [
    /(\d{1,2})\s*rum/i, // "5 rum"
    /(\d{1,2})\s*værelser/i, // "5 værelser"
    /(\d{1,2})\s*bedrooms/i, // "3 bedrooms"
    /(\d{1,2})\s*rooms/i, // "5 rooms"
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const rooms = parseInt(match[1], 10);
      // Sanity check: typical homes have 1-15 rooms
      if (rooms >= 1 && rooms <= 15) {
        return rooms;
      }
    }
  }

  return undefined;
}

/**
 * Classify service type based on keywords
 */
function classifyServiceType(text: string): ServiceType {
  // Fast rengøring keywords
  const fastKeywords = [
    "fast rengøring",
    "løbende rengøring",
    "abonnement",
    "hver uge",
    "hver anden uge",
    "ugentlig",
    "14 dages",
    "månedlig",
    "vedligeholdelses",
    "recurring",
    "regular cleaning",
  ];

  // Flytterengøring keywords
  const flytteKeywords = [
    "flytterengøring",
    "fraflytning",
    "move out",
    "moving out",
    "end of tenancy",
    "deposit cleaning",
    "fra hus",
    "fra lejlighed",
  ];

  // Hovedrengøring keywords
  const hovedKeywords = [
    "hovedrengøring",
    "dybderengøring",
    "spring cleaning",
    "deep clean",
    "grundig",
    "total rengøring",
  ];

  // Check each category
  if (flytteKeywords.some((kw) => text.includes(kw))) {
    return "Flytterengøring";
  }

  if (hovedKeywords.some((kw) => text.includes(kw))) {
    return "Hovedrengøring";
  }

  if (fastKeywords.some((kw) => text.includes(kw))) {
    return "Fast Rengøring";
  }

  // Default fallback
  return "Unknown";
}

/**
 * Extract frequency for recurring cleaning
 */
function extractFrequency(text: string): FrequencyType {
  if (
    text.includes("ugentlig") ||
    text.includes("hver uge") ||
    text.includes("weekly")
  ) {
    return "ugentlig";
  }

  if (
    text.includes("hver anden uge") ||
    text.includes("14 dages") ||
    text.includes("biweekly") ||
    text.includes("every two weeks")
  ) {
    return "14-dages";
  }

  if (
    text.includes("månedlig") ||
    text.includes("hver måned") ||
    text.includes("monthly")
  ) {
    return "månedlig";
  }

  if (
    text.includes("engangsbasis") ||
    text.includes("one time") ||
    text.includes("one-off")
  ) {
    return "engangsbasis";
  }

  return null;
}

/**
 * Extract preferred date from text
 * Patterns: "omkring 20. oktober", "hurtigst muligt", "next week", "i næste uge"
 */
function extractPreferredDate(text: string): Date | undefined {
  const now = new Date();

  // Handle "hurtigst muligt" / "as soon as possible"
  if (
    text.includes("hurtigst muligt") ||
    text.includes("snarest") ||
    text.includes("as soon as possible") ||
    text.includes("asap")
  ) {
    // Return tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    return tomorrow;
  }

  // Handle "i næste uge" / "next week"
  if (
    text.includes("i næste uge") ||
    text.includes("næste uge") ||
    text.includes("next week")
  ) {
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    return nextWeek;
  }

  // Handle specific dates: "20. oktober", "15. november"
  const danishDatePattern = /(\d{1,2})\.?\s+(januar|februar|marts|april|maj|juni|juli|august|september|oktober|november|december)/i;
  const match = text.match(danishDatePattern);

  if (match) {
    const day = parseInt(match[1], 10);
    const monthName = match[2].toLowerCase();

    const monthMap: Record<string, number> = {
      januar: 0,
      februar: 1,
      marts: 2,
      april: 3,
      maj: 4,
      juni: 5,
      juli: 6,
      august: 7,
      september: 8,
      oktober: 9,
      november: 10,
      december: 11,
    };

    const month = monthMap[monthName];
    if (month !== undefined) {
      const year = now.getFullYear();
      const date = new Date(year, month, day);

      // If date is in the past, assume next year
      if (date < now) {
        date.setFullYear(year + 1);
      }

      return date;
    }
  }

  return undefined;
}

/**
 * Extract Danish address from text
 * Pattern: "Vejnavn 123, 8000 Aarhus C"
 */
function extractAddress(text: string): string | undefined {
  // Danish address pattern: Street name, number, postal code, city
  const addressPatterns = [
    /([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ]?[a-zæøå]+)*)\s+(\d{1,4}[A-Z]?),?\s+(\d{4})\s+([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ]?)?)/,
    // Simplified: just postal code + city
    /\b(\d{4})\s+([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ])?)\b/,
  ];

  for (const pattern of addressPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }

  return undefined;
}

/**
 * Extract special requests/notes
 */
function extractSpecialRequests(text: string): string[] {
  const requests: string[] = [];

  const keywords = [
    "vinduer", // windows
    "kælder", // basement
    "ovn", // oven
    "køleskab", // fridge
    "balkon", // balcony
    "have", // garden
    "nøgle", // key
    "adgang", // access
    "hund", // dog
    "kat", // cat
    "allergi", // allergy
    "miljøvenlig", // eco-friendly
  ];

  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      requests.push(keyword);
    }
  }

  return requests;
}

/**
 * Calculate estimated hours based on size and service type
 */
export function estimateHours(
  size: number,
  serviceType: ServiceType,
  workers: number = 2
): { hours: number; min: number; max: number } {
  let baseHours = 0;

  // Base estimation (per person)
  if (serviceType === "Flytterengøring") {
    // Moving cleaning is more intensive
    baseHours = (size / 15) * 1.5; // ~1.5 hours per 15m² per person
  } else if (serviceType === "Hovedrengøring") {
    // Deep cleaning
    baseHours = (size / 20) * 1.3; // ~1.3 hours per 20m² per person
  } else {
    // Regular cleaning (Fast rengøring or maintenance)
    baseHours = size / 30; // ~1 hour per 30m² per person
  }

  // Adjust for number of workers (on-site time)
  const onSiteHours = baseHours / workers;

  // Calculate range (±20%)
  const min = Math.ceil(onSiteHours * 0.8 * 10) / 10;
  const max = Math.ceil(onSiteHours * 1.2 * 10) / 10;
  const estimated = Math.ceil(onSiteHours * 10) / 10;

  return {
    hours: estimated,
    min,
    max,
  };
}

/**
 * Calculate price estimate based on hours and hourly rate
 */
export function estimatePrice(
  hours: number,
  workers: number = 2,
  hourlyRate: number = 349
): { min: number; max: number } {
  const totalWorkHours = hours * workers;

  // Calculate range (±20%)
  const min = Math.round(totalWorkHours * hourlyRate * 0.8);
  const max = Math.round(totalWorkHours * hourlyRate * 1.2);

  return { min, max };
}

/**
 * Generate human-readable summary of parsed lead
 */
export function generateLeadSummary(parsed: ParsedLeadInfo): string {
  const parts: string[] = [];

  if (parsed.size) {
    parts.push(`${parsed.size}m²`);
  }

  if (parsed.rooms) {
    parts.push(`${parsed.rooms} rum`);
  }

  parts.push(parsed.serviceType);

  if (parsed.frequency) {
    parts.push(`(${parsed.frequency})`);
  }

  if (parsed.address) {
    parts.push(`- ${parsed.address}`);
  }

  if (parsed.preferredDate) {
    const dateStr = parsed.preferredDate.toLocaleDateString("da-DK");
    parts.push(`Ønsket: ${dateStr}`);
  }

  if (parsed.specialRequests && parsed.specialRequests.length > 0) {
    parts.push(`Special: ${parsed.specialRequests.join(", ")}`);
  }

  return parts.join(" | ");
}

/**
 * Validate parsed lead has minimum required information
 */
export function isLeadInfoComplete(parsed: ParsedLeadInfo): {
  isComplete: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  if (!parsed.size) {
    missingFields.push("size (m²)");
  }

  if (parsed.serviceType === "Unknown") {
    missingFields.push("service type");
  }

  if (parsed.confidence.overall < 0.5) {
    missingFields.push("low confidence extraction");
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
}
