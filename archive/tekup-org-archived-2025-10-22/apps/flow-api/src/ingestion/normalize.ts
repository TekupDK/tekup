import { ParsedLeadPayload } from './types.js';
import { parse } from 'date-fns';

const DATE_FORMATS = [
  'dd-MM-yy HH:mm', 'dd-MM-yyyy HH:mm', 'dd-MM-yy', 'dd-MM-yyyy', 'yyyy-MM-dd HH:mm', 'yyyy-MM-dd'
];

function normalizePhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 8) return `+45${digits}`;
  if (digits.startsWith('45') && digits.length === 10) return `+${digits}`;
  if (digits.startsWith('00')) return `+${digits.substring(2)}`;
  return phone.trim();
}

function tryParseDate(raw?: string): string | undefined {
  if (!raw) return undefined;
  for (const f of DATE_FORMATS) {
    try {
      const d = parse(raw, f, new Date());
      if (!isNaN(d.getTime())) return d.toISOString();
    } catch (_) { /* ignore */ }
  }
  return undefined;
}

export function finalizePayload(p: ParsedLeadPayload): ParsedLeadPayload {
  return {
    ...p,
    phone: normalizePhone(p.phone),
    event_date: tryParseDate(p.event_date)
  };
}
