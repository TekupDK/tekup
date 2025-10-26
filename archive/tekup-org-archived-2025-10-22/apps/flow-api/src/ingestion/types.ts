export interface RawEmailInput {
  mailbox: string; // recipient mailbox (to)
  subject: string;
  from: string;
  rawText: string; // plain text version
  receivedAt?: Date;
}

export type LeadBrand = 'rendetalje' | 'foodtruck' | 'tekup';

export interface ParsedLeadPayload {
  brand: LeadBrand;
  source: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  area_sqm?: number;
  service_type?: string;
  frequency?: string;
  event_type?: string;
  pax?: number;
  event_date?: string; // ISO
  budget?: number;
  menu_request?: string;
  notes?: string;
  partial?: boolean;
  needs_portal_fetch?: boolean;
  misroute?: boolean;
  classification_confidence?: number;
  duplicate_of?: string;
}

export interface ClassifiedEmail {
  kind: 'lead' | 'operations' | 'service' | 'irrelevant';
  confidence: number; // 0-1
  brand?: LeadBrand;
  sourceHint?: string;
}

export interface ParseResult {
  payload: ParsedLeadPayload;
  confidence: number; // extraction confidence
}
