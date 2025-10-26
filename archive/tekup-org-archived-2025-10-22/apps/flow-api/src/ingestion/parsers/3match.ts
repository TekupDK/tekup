import { RawEmailInput, ParseResult, ParsedLeadPayload } from '../types.js';
import { finalizePayload } from '../normalize.js';

export function parse3match(input: RawEmailInput): ParseResult | undefined {
  const text = input.rawText;
  
  // Check if this is a 3match email
  const is3match = /3match\.dk|app\.3match\.dk/i.test(text) || 
                   /fra 3match/i.test(text) ||
                   /3match platform/i.test(text);
  
  if (!is3match) return undefined;

  // Extract basic fields first
  const payload: ParsedLeadPayload = {
    brand: 'rendetalje', // Default to Rendetalje as most 3match leads are cleaning
    source: '3match',
    name: capture(text, /navn:\s*(.+)/i) || capture(text, /name:\s*(.+)/i),
    phone: capture(text, /telefon(?:nummer)?:\s*([+0-9 ()-]{6,})/i) || capture(text, /phone:\s*([+0-9 ()-]{6,})/i),
    email: capture(text, /e-?post|e-?mail:?\s*([\w.+-]+@[\w.-]+)/i),
    address: capture(text, /adresse:\s*(.+)/i) || capture(text, /address:\s*(.+)/i),
    postal_code: capture(text, /postnr|postal.*code:\s*(\d{4})/i),
    city: capture(text, /by|city:\s*([A-Za-zÆØÅæøå .-]+)/i),
    service_type: capture(text, /(privat|erhverv|flyt|kontor|vindues)/i),
    frequency: capture(text, /(ugentlig|månedlig|hver 14\.? ?dag|engangs)/i) || undefined,
    notes: undefined
  };

  // Look for 3match portal link
  const portalMatch = text.match(/https?:\/\/app\.3match\.dk\/[^\s]+/i);
  if (portalMatch) {
    payload.needs_portal_fetch = true;
    payload.partial = true;
    payload.notes = `3match portal link: ${portalMatch[0]}`;
    
    // Store the portal URL for later fetching
    if (!payload.notes) payload.notes = '';
    payload.notes += `\nPortal URL: ${portalMatch[0]}`;
  }

  // Extract area information if mentioned
  const areaMatch = text.match(/(\d+)\s*(?:m2|m²|kvadratmeter|square.*meter)/i);
  if (areaMatch) {
    payload.area_sqm = parseInt(areaMatch[1], 10);
  }

  // Extract price/budget information
  const priceMatch = text.match(/(\d+)\s*(?:kr|dkk|kroner)/i);
  if (priceMatch) {
    if (!payload.notes) payload.notes = '';
    payload.notes += `\nBudget/Pris: ${priceMatch[0]}`;
  }

  // Determine confidence based on extracted fields
  const extractedFields = Object.values(payload).filter(v => v !== undefined && v !== null && v !== '').length;
  let confidence = Math.min(1, extractedFields / 6); // Base confidence

  // Boost confidence if we have key identifiers
  if (portalMatch) confidence += 0.2;
  if (payload.email) confidence += 0.2;
  if (payload.phone) confidence += 0.2;
  
  // Cap confidence
  confidence = Math.min(1, confidence);

  return { payload: finalizePayload(payload), confidence };
}

/**
 * Fetch additional details from 3match portal URL
 * This would be called asynchronously after initial lead creation
 */
export async function fetch3matchPortalDetails(portalUrl: string): Promise<Partial<ParsedLeadPayload> | null> {
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-flow-api-src-ingestion-pa');

  try {
    // Note: This is a placeholder implementation
    // In production, this would make HTTP requests to the 3match API
    // with proper authentication and rate limiting
    
    logger.info(`Would fetch details from: ${portalUrl}`);
    
    // Mock implementation - in reality this would:
    // 1. Parse the URL to extract booking/request ID
    // 2. Make authenticated API call to 3match
    // 3. Extract complete lead details
    // 4. Return structured data
    
    return {
      // Mock additional data that might be fetched
      notes: 'Additional details fetched from 3match portal',
      service_type: 'Kontorrengøring', // Example
      area_sqm: 150, // Example
      frequency: 'Ugentlig' // Example
    };
  } catch (error) {
    logger.error('Failed to fetch 3match portal details:', error);
    return null;
  }
}

function capture(text: string, regex: RegExp): string | undefined {
  const m = text.match(regex);
  if (!m) return undefined;
  return m[m.length - 1].trim();
}

/**
 * Extract task/service description from 3match emails
 */
function extractTaskDescription(text: string): string | undefined {
  // Look for common patterns in 3match emails
  const patterns = [
    /opgave:\s*(.+?)(?:\n|$)/i,
    /beskrivelse:\s*(.+?)(?:\n|$)/i,
    /task:\s*(.+?)(?:\n|$)/i,
    /description:\s*(.+?)(?:\n|$)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1].trim().length > 5) {
      return match[1].trim();
    }
  }

  return undefined;
}

/**
 * Determine lead brand based on email content and routing
 */
function determineBrand(input: RawEmailInput, text: string): 'rendetalje' | 'foodtruck' | 'tekup' {
  // Check mailbox routing first
  if (input.mailbox.includes('foodtruck') || input.mailbox.includes('ftfiesta')) {
    return 'foodtruck';
  }
  
  if (input.mailbox.includes('tekup')) {
    return 'tekup';
  }

  // Check content keywords
  if (/foodtruck|catering|mad|menu|fest|event/i.test(text)) {
    return 'foodtruck';
  }

  if (/it.support|backup|sikkerhed|compliance|nis2/i.test(text)) {
    return 'tekup';
  }

  // Default to Rendetalje for cleaning-related content
  return 'rendetalje';
}