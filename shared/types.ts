/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

/**
 * Billy.dk Invoice Types (matches Billy API v2 response exactly)
 * Used by InvoicesTab component
 * Based on actual API response - see test-billy-invoice-response.mjs
 */
export interface BillyInvoice {
  // Core identifiers
  id: string;
  organizationId: string;
  invoiceNo: string | null;

  // Contact/Customer
  contactId: string;
  attContactPersonId?: string | null;

  // Dates (ISO 8601 strings)
  createdTime: string; // readonly
  approvedTime?: string | null; // readonly
  entryDate: string; // Date only (YYYY-MM-DD)
  dueDate?: string | null; // Date only (YYYY-MM-DD)

  // Status
  state: 'draft' | 'approved' | 'sent' | 'paid' | 'overdue' | 'voided';
  sentState: 'unsent' | 'sent' | 'resent';
  isPaid: boolean; // readonly

  // Amounts (in currency units, e.g., DKK)
  amount: number; // Total amount excl. tax (readonly)
  tax: number; // Tax/VAT amount (readonly)
  grossAmount: number; // Total incl. tax (readonly)
  balance: number; // Unpaid amount (readonly)

  // Currency
  currencyId: string; // e.g., "DKK", "EUR", "USD"
  exchangeRate: number; // Default 1

  // Payment terms
  paymentTermsMode?: string | null;
  paymentTermsDays?: number | null;

  // Content
  contactMessage?: string | null;
  lineDescription?: string | null; // Summary of lines (readonly)

  // Files & attachments
  downloadUrl?: string; // PDF download URL (readonly)
  attachmentIds?: string[];

  // Relations
  creditedInvoiceId?: string | null;
  recurringInvoiceId?: string | null;
  quoteId?: string | null;
  templateId?: string | null;

  // Other
  type?: string; // e.g., "invoice", "creditNote"
  taxMode?: 'incl' | 'excl' | null;
  externalId?: string | null;
  orderNo?: string | null;
  paymentMethods?: any[];

  // Invoice lines (not included in list response, must fetch separately)
  lines?: BillyInvoiceLine[];

  // Deprecated fields (for backwards compatibility)
  /** @deprecated Use 'amount' instead */
  totalAmount?: number;
  /** @deprecated Use 'amount - balance' instead */
  paidAmount?: number;
  /** @deprecated Use 'createdTime' instead */
  createdAt?: string;
  /** @deprecated Not in Billy API */
  updatedAt?: string;
  /** @deprecated Use 'contactId' lookup instead */
  contactName?: string;
}

/**
 * Billy.dk Invoice Line Item
 */
export interface BillyInvoiceLine {
  id: string;
  productId?: string | null;
  productName?: string; // From product lookup
  description: string;
  quantity: number;
  unitPrice: number; // Price per unit
  amount?: number; // Line total (quantity * unitPrice - discount)
  discountPercent?: number;
  discountAmount?: number;
  taxRateId?: string | null;
  taxAmount?: number;
  totalAmount?: number; // amount + taxAmount
}
