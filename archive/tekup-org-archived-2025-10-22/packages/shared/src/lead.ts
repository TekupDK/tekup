// Shared lead domain DTOs to keep API ↔ frontend in sync.
// Keep enums minimal (MVP) and extend deliberately.

export enum LeadStatusShared {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
}

export interface LeadPayloadShared {
  email?: string;
  phone?: string;
  name?: string;
  message?: string;
  company?: string;
  jobTitle?: string;
  // Allow arbitrary extra keys without breaking
  [key: string]: unknown;
}

export interface LeadShared {
  id: string;
  tenantId: string;
  source: string;
  status: LeadStatusShared;
  payload?: LeadPayloadShared;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface LeadStatusTransitionRequest {
  status: LeadStatusShared.CONTACTED; // Only allowed transition (NEW -> CONTACTED)
}

export interface LeadStatusTransitionEvent {
  id: string;
  leadId: string;
  fromStatus: LeadStatusShared;
  toStatus: LeadStatusShared;
  createdAt: string;
}
