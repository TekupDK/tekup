import { RawEmailInput, ParseResult, ParsedLeadPayload } from '../types.js';
import { finalizePayload } from '../normalize.js';

export function parseLeadpoint(input: RawEmailInput): ParseResult | undefined {
  const text = input.rawText;
  if (!/leadpoint/i.test(input.from) && !/nyt rengøringslead/i.test(text)) return undefined;

  // Check if this is a phone call lead (only phone + duration + time)
  const isPhoneCallLead = isPhoneCallLeadEmail(text);
  
  const payload: ParsedLeadPayload = {
    brand: 'rendetalje',
    source: 'leadpoint',
    name: matchLine(text, /navn:\s*(.+)/i),
    phone: matchLine(text, /telefon:?\s*([+0-9 ()-]{6,})/i),
    email: matchLine(text, /e-?mail:?\s*([\w.+-]+@[\w.-]+)/i),
    address: matchLine(text, /adresse:?\s*(.+)/i),
    area_sqm: numberFrom(matchLine(text, /(\d{2,4})\s*(?:m2|m²)/i)),
    service_type: matchLine(text, /opgave:?\s*(.+)/i),
    notes: isPhoneCallLead ? generatePhoneCallNotes(text) : undefined,
    lead_type: isPhoneCallLead ? 'phone_call' : 'standard'
  };

  // Adjust confidence calculation for phone call leads
  const found = Object.values(payload).filter(v => v !== undefined && v !== null).length;
  let confidence = Math.min(1, found / 7);
  
  // Boost confidence for phone call leads with valid phone number
  if (isPhoneCallLead && payload.phone) {
    confidence = Math.max(confidence, 0.8);
  }
  
  return { payload: finalizePayload(payload), confidence };
}

function isPhoneCallLeadEmail(text: string): boolean {
  // Check for phone call specific patterns
  const hasPhone = /telefon:?\s*([+0-9 ()-]{6,})/i.test(text);
  const hasDuration = /varighed:?\s*(\d+)/i.test(text) || /duration:?\s*(\d+)/i.test(text);
  const hasTime = /tidspunkt:?\s*(\d{1,2}[:.]\d{2})/i.test(text) || /time:?\s*(\d{1,2}[:.]\d{2})/i.test(text);
  const hasNoName = !/navn:?\s*(.+)/i.test(text);
  const hasNoAddress = !/adresse:?\s*(.+)/i.test(text);
  const hasNoEmail = !/e-?mail:?\s*([\w.+-]+@[\w.-]+)/i.test(text);
  
  return hasPhone && (hasDuration || hasTime) && hasNoName && hasNoAddress && hasNoEmail;
}

function generatePhoneCallNotes(text: string): string {
  const duration = matchLine(text, /varighed:?\s*(\d+)/i) || matchLine(text, /duration:?\s*(\d+)/i);
  const time = matchLine(text, /tidspunkt:?\s*(\d{1,2}[:.]\d{2})/i) || matchLine(text, /time:?\s*(\d{1,2}[:.]\d{2})/i);
  
  let notes = 'Telefonlead fra Leadpoint - ';
  if (duration) notes += `Varighed: ${duration} min. `;
  if (time) notes += `Tidspunkt: ${time}. `;
  notes += 'Ingen navn, adresse eller e-mail angivet.';
  
  return notes;
}

function matchLine(text: string, regex: RegExp): string | undefined {
  const m = text.match(regex);
  return m ? m[1].trim() : undefined;
}
function numberFrom(v?: string): number | undefined {
  if (!v) return undefined;
  const n = parseInt(v.replace(/\D/g, ''), 10);
  return isNaN(n) ? undefined : n;
}
