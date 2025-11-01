/**
 * Intent Detector for Friday AI
 *
 * Detects user intent from messages to enable selective memory injection.
 * This reduces token usage by only including relevant memories per request.
 */

export type Intent =
  | "lead_processing"
  | "booking"
  | "quote_generation"
  | "conflict_resolution"
  | "follow_up"
  | "calendar_query"
  | "general"
  | "unknown";

export interface IntentResult {
  intent: Intent;
  confidence: number; // 0-1
  keywords?: string[];
}

/**
 * Detect intent from user message
 */
export function detectIntent(message: string): IntentResult {
  const lower = message.toLowerCase();

  // Lead processing keywords
  const leadKeywords = [
    "lead",
    "kunde",
    "henvendelse",
    "indbakke",
    "mail",
    "email",
    "fået",
    "modtaget",
    "nye leads",
  ];
  const hasLeadIntent = leadKeywords.some((kw) => lower.includes(kw));

  // Booking keywords
  const bookingKeywords = [
    "book",
    "booke",
    "planlæg",
    "schedule",
    "tidspunkt",
    "tid til",
    "ledig",
  ];
  const hasBookingIntent = bookingKeywords.some((kw) => lower.includes(kw));

  // Quote generation keywords
  const quoteKeywords = [
    "tilbud",
    "quote",
    "pris",
    "estimere",
    "beregne pris",
    "lav tilbud",
  ];
  const hasQuoteIntent = quoteKeywords.some((kw) => lower.includes(kw));

  // Conflict resolution keywords
  const conflictKeywords = [
    "klage",
    "utilfreds",
    "fejl",
    "forkert",
    "rabat",
    "refunder",
    "inkasso",
  ];
  const hasConflictIntent = conflictKeywords.some((kw) => lower.includes(kw));

  // Follow-up keywords
  const followUpKeywords = [
    "følg op",
    "opfølg",
    "opdatere",
    "status",
    "hvad skete",
  ];
  const hasFollowUpIntent = followUpKeywords.some((kw) => lower.includes(kw));

  // Calendar query keywords
  const calendarKeywords = [
    "kalender",
    "opgaver",
    "i dag",
    "planlagt",
    "events",
    "møder",
  ];
  const hasCalendarIntent = calendarKeywords.some((kw) => lower.includes(kw));

  // Calculate confidence based on keyword matches
  let primaryIntent: Intent = "general";
  let confidence = 0.5;
  const matchedKeywords: string[] = [];

  if (hasLeadIntent && hasQuoteIntent) {
    primaryIntent = "quote_generation";
    confidence = 0.9;
    matchedKeywords.push(...leadKeywords.filter((kw) => lower.includes(kw)));
    matchedKeywords.push(...quoteKeywords.filter((kw) => lower.includes(kw)));
  } else if (hasBookingIntent) {
    primaryIntent = "booking";
    confidence = 0.85;
    matchedKeywords.push(...bookingKeywords.filter((kw) => lower.includes(kw)));
  } else if (hasQuoteIntent) {
    primaryIntent = "quote_generation";
    confidence = 0.8;
    matchedKeywords.push(...quoteKeywords.filter((kw) => lower.includes(kw)));
  } else if (hasConflictIntent) {
    primaryIntent = "conflict_resolution";
    confidence = 0.85;
    matchedKeywords.push(
      ...conflictKeywords.filter((kw) => lower.includes(kw))
    );
  } else if (hasFollowUpIntent) {
    primaryIntent = "follow_up";
    confidence = 0.75;
    matchedKeywords.push(
      ...followUpKeywords.filter((kw) => lower.includes(kw))
    );
  } else if (hasLeadIntent) {
    primaryIntent = "lead_processing";
    confidence = 0.8;
    matchedKeywords.push(...leadKeywords.filter((kw) => lower.includes(kw)));
  } else if (hasCalendarIntent) {
    primaryIntent = "calendar_query";
    confidence = 0.75;
    matchedKeywords.push(
      ...calendarKeywords.filter((kw) => lower.includes(kw))
    );
  }

  return {
    intent: primaryIntent,
    confidence,
    keywords: [...new Set(matchedKeywords)], // Remove duplicates
  };
}

/**
 * Get relevant memories for an intent
 * This enables selective memory injection to reduce token usage
 */
export function getRelevantMemoriesForIntent(intent: Intent): string[] {
  const memoryMap: Record<Intent, string[]> = {
    lead_processing: [
      "MEMORY_1",
      "MEMORY_4",
      "MEMORY_7",
      "MEMORY_11",
      "MEMORY_23",
    ],
    booking: ["MEMORY_1", "MEMORY_5", "MEMORY_11"],
    quote_generation: [
      "MEMORY_1",
      "MEMORY_4",
      "MEMORY_7",
      "MEMORY_8",
      "MEMORY_11",
      "MEMORY_23",
    ],
    conflict_resolution: ["MEMORY_3", "MEMORY_8", "MEMORY_9"],
    follow_up: ["MEMORY_1", "MEMORY_10"],
    calendar_query: ["MEMORY_1", "MEMORY_5", "MEMORY_6"],
    general: ["MEMORY_1", "MEMORY_4", "MEMORY_23"], // Minimal for general queries
    unknown: ["MEMORY_1"], // Just time check
  };

  return memoryMap[intent] || memoryMap.unknown;
}
