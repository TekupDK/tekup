import { RawEmailInput, ParseResult, ParsedLeadPayload } from '../types.js';
import { finalizePayload } from '../normalize.js';

export function parseAdHelp(input: RawEmailInput): ParseResult | undefined {
  const text = input.rawText;
  const from = input.from.toLowerCase();
  
  // Check if this is from AdHelp/Silas Printz
  const isAdHelp = from.includes('sp@adhelp.dk') || 
                   from.includes('silas') ||
                   /adhelp/i.test(text) ||
                   /silas.*printz/i.test(text);
  
  if (!isAdHelp) return undefined;

  const payload: ParsedLeadPayload = {
    brand: 'rendetalje', // Default brand, can be overridden by content analysis
    source: 'adhelp',
    name: undefined,
    phone: undefined,
    email: undefined,
    address: undefined,
    postal_code: undefined,
    city: undefined,
    service_type: undefined,
    frequency: undefined,
    notes: undefined
  };

  // AdHelp emails can have very variable formats, so we use multiple extraction strategies

  // Strategy 1: Structured data extraction
  payload.name = extractField(text, ['navn', 'name', 'customer']);
  payload.phone = extractPhone(text);
  payload.email = extractEmail(text);
  payload.address = extractField(text, ['adresse', 'address']);
  payload.postal_code = extractPostalCode(text);
  payload.city = extractField(text, ['by', 'city']);
  
  // Strategy 2: Service type detection
  payload.service_type = detectServiceType(text);
  payload.frequency = detectFrequency(text);
  
  // Strategy 3: Area extraction
  const area = extractArea(text);
  if (area) {
    payload.area_sqm = area;
  }

  // Strategy 4: Brand detection based on content
  payload.brand = detectBrand(text, input.mailbox);

  // Strategy 5: Extract any additional notes/context
  payload.notes = extractNotes(text);

  // Handle forwarded emails or quote blocks
  const cleanedText = removeSignaturesAndQuotes(text);
  if (cleanedText !== text) {
    // Re-run extraction on cleaned text for better accuracy
    const cleanPayload = extractFromCleanText(cleanedText);
    // Merge results, preferring non-empty values from cleaned extraction
    Object.keys(cleanPayload).forEach(key => {
      if (cleanPayload[key] && !payload[key]) {
        payload[key] = cleanPayload[key];
      }
    });
  }

  // Calculate confidence based on extracted fields and patterns
  let confidence = calculateConfidence(payload, text);

  // Special handling for very short or unclear emails
  if (text.length < 100) {
    confidence *= 0.5; // Reduce confidence for very short emails
  }

  // If we have very low confidence, mark as needing manual review
  if (confidence < 0.3) {
    payload.partial = true;
    payload.notes = (payload.notes || '') + '\n[NEEDS MANUAL REVIEW - Low confidence parsing]';
  }

  return { payload: finalizePayload(payload), confidence };
}

function extractField(text: string, fieldNames: string[]): string | undefined {
  for (const fieldName of fieldNames) {
    // Try various patterns for each field name
    const patterns = [
      new RegExp(`${fieldName}:?\\s*(.+?)(?:\\n|$)`, 'i'),
      new RegExp(`${fieldName}\\s*-\\s*(.+?)(?:\\n|$)`, 'i'),
      new RegExp(`${fieldName}\\s*=\\s*(.+?)(?:\\n|$)`, 'i'),
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1].trim().length > 0) {
        return match[1].trim();
      }
    }
  }
  return undefined;
}

function extractPhone(text: string): string | undefined {
  // Multiple phone number patterns for Danish numbers
  const patterns = [
    /(?:tlf|telefon|phone|mobil)[:.]?\s*([+]?45\s*)?([0-9]{2}\s*[0-9]{2}\s*[0-9]{2}\s*[0-9]{2})/i,
    /(?:tlf|telefon|phone|mobil)[:.]?\s*([+]?45\s*)?([0-9]{8})/i,
    /([+]45\s*[0-9]{2}\s*[0-9]{2}\s*[0-9]{2}\s*[0-9]{2})/,
    /([0-9]{2}\s*[0-9]{2}\s*[0-9]{2}\s*[0-9]{2})/,
    /([+]?45[0-9]{8})/,
    /([0-9]{8})/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Clean up the phone number
      let phone = match[0].replace(/[^\d+]/g, '');
      if (phone.length === 8 && !phone.startsWith('+')) {
        phone = '+45' + phone;
      }
      return phone;
    }
  }
  return undefined;
}

function extractEmail(text: string): string | undefined {
  const emailPattern = /(?:e-?mail|email|mail)[:.]?\s*([\w.+-]+@[\w.-]+\.[a-zA-Z]{2,})/i;
  const match = text.match(emailPattern);
  if (match) {
    return match[1].toLowerCase();
  }

  // Fallback: look for any email pattern
  const genericEmailPattern = /([\w.+-]+@[\w.-]+\.[a-zA-Z]{2,})/;
  const genericMatch = text.match(genericEmailPattern);
  if (genericMatch) {
    return genericMatch[1].toLowerCase();
  }

  return undefined;
}

function extractPostalCode(text: string): string | undefined {
  const patterns = [
    /(?:postnr|postal.*code|zip)[:.]?\s*(\d{4})/i,
    /(\d{4})\s+[A-Za-zÆØÅæøå]/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return undefined;
}

function detectServiceType(text: string): string | undefined {
  const serviceTypes = [
    { pattern: /privat|hjem|bolig|villa|lejlighed/i, type: 'privat' },
    { pattern: /erhverv|firma|kontor|virksomhed|business/i, type: 'erhverv' },
    { pattern: /flyt|flytterengøring|move.*clean/i, type: 'flyt' },
    { pattern: /vindues|window|rude/i, type: 'vindues' },
    { pattern: /foodtruck|catering|mad|menu|køkken/i, type: 'catering' }
  ];

  for (const service of serviceTypes) {
    if (service.pattern.test(text)) {
      return service.type;
    }
  }
  return undefined;
}

function detectFrequency(text: string): string | undefined {
  const frequencies = [
    { pattern: /ugentlig|weekly|hver.*uge/i, freq: 'ugentlig' },
    { pattern: /månedlig|monthly|hver.*måned/i, freq: 'månedlig' },
    { pattern: /hver.*14.*dag|bi.*weekly|14.*dag/i, freq: 'hver 14. dag' },
    { pattern: /engangs|one.*time|én.*gang/i, freq: 'engangs' }
  ];

  for (const frequency of frequencies) {
    if (frequency.pattern.test(text)) {
      return frequency.freq;
    }
  }
  return undefined;
}

function extractArea(text: string): number | undefined {
  const areaPattern = /(\d+)\s*(?:m2|m²|kvadratmeter|square.*meter|kvm)/i;
  const match = text.match(areaPattern);
  if (match) {
    return parseInt(match[1], 10);
  }
  return undefined;
}

function detectBrand(text: string, mailbox: string): 'rendetalje' | 'foodtruck' | 'tekup' {
  // Check mailbox first
  if (mailbox.includes('foodtruck') || mailbox.includes('ftfiesta')) {
    return 'foodtruck';
  }
  
  if (mailbox.includes('tekup')) {
    return 'tekup';
  }

  // Check content
  if (/foodtruck|catering|mad|menu|fest|event|bryllup|firmafest/i.test(text)) {
    return 'foodtruck';
  }

  if (/it.*support|backup|sikkerhed|compliance|nis2|copilot/i.test(text)) {
    return 'tekup';
  }

  // Default to Rendetalje
  return 'rendetalje';
}

function extractNotes(text: string): string | undefined {
  // Look for additional context or special instructions
  const notePatterns = [
    /bemærkning[:.]?\s*(.+?)(?:\n\n|$)/i,
    /note[:.]?\s*(.+?)(?:\n\n|$)/i,
    /beskrivelse[:.]?\s*(.+?)(?:\n\n|$)/i,
    /yderligere[:.]?\s*(.+?)(?:\n\n|$)/i
  ];

  for (const pattern of notePatterns) {
    const match = text.match(pattern);
    if (match && match[1].trim().length > 10) {
      return match[1].trim();
    }
  }

  return undefined;
}

function removeSignaturesAndQuotes(text: string): string {
  // Remove common signature delimiters
  const signatureDelimiters = [
    /\n--\s*\n/,
    /\nMed venlig hilsen/i,
    /\nBest regards/i,
    /\nMVH/i,
    /\n_{2,}/
  ];

  let cleaned = text;
  for (const delimiter of signatureDelimiters) {
    const match = cleaned.search(delimiter);
    if (match > 0) {
      cleaned = cleaned.substring(0, match);
    }
  }

  // Remove quoted text (forwarded emails)
  cleaned = cleaned.replace(/^>.*/gm, ''); // Remove lines starting with >
  cleaned = cleaned.replace(/\n\nFra:.*/s, ''); // Remove forwarded email headers
  
  return cleaned.trim();
}

function extractFromCleanText(cleanText: string): Partial<ParsedLeadPayload> {
  return {
    name: extractField(cleanText, ['navn', 'name']),
    phone: extractPhone(cleanText),
    email: extractEmail(cleanText),
    address: extractField(cleanText, ['adresse', 'address']),
    postal_code: extractPostalCode(cleanText),
    service_type: detectServiceType(cleanText),
    frequency: detectFrequency(cleanText)
  };
}

function calculateConfidence(payload: ParsedLeadPayload, text: string): number {
  let confidence = 0;
  let factors = 0;

  // Key field presence
  if (payload.email) { confidence += 0.3; factors++; }
  if (payload.phone) { confidence += 0.3; factors++; }
  if (payload.name) { confidence += 0.2; factors++; }
  if (payload.address) { confidence += 0.1; factors++; }
  if (payload.service_type) { confidence += 0.1; factors++; }

  // Text quality indicators
  if (text.includes(':') || text.includes('=')) { confidence += 0.1; } // Structured format
  if (text.length > 200) { confidence += 0.1; } // Sufficient content
  if (/rengøring|cleaning|adhelp/i.test(text)) { confidence += 0.1; } // Relevant keywords

  return Math.min(1, confidence);
}