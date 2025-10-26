import { RawEmailInput, ParseResult, ParsedLeadPayload } from '../types.js';
import { finalizePayload } from '../normalize.js';

export function parseLeadmail(input: RawEmailInput): ParseResult | undefined {
  const text = input.rawText;
  if (!/leadmail|rengøring\.nu/i.test(text) && !/kontakt@leadmail\.no/i.test(input.from)) return undefined;

  const payload: ParsedLeadPayload = {
    brand: 'rendetalje',
    source: 'leadmail',
    name: capture(text, /navn:\s*(.+)/i),
    phone: capture(text, /telefon(?:nummer)?:\s*([+0-9 ()-]{6,})/i),
    email: capture(text, /e-?post|e-?mail:?\s*([\w.+-]+@[\w.-]+)/i),
    address: capture(text, /adresse:\s*(.+)/i),
    postal_code: capture(text, /postnr:\s*(\d{4})/i),
    city: capture(text, /by:\s*([A-Za-zÆØÅæøå .-]+)/i),
    service_type: capture(text, /(privat|erhverv|flyt|kontor|vindues)/i),
    frequency: capture(text, /(ugentlig|månedlig|hver 14\.? ?dag|engangs)/i) || undefined,
    notes: undefined
  };

  const found = Object.values(payload).filter(v => v !== undefined && v !== null).length;
  const confidence = Math.min(1, found / 8);
  return { payload: finalizePayload(payload), confidence };
}

function capture(text: string, regex: RegExp): string | undefined {
  const m = text.match(regex);
  if (!m) return undefined;
  return m[m.length - 1].trim();
}
