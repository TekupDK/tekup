/**
 * Billy.dk API Integration via Billy-mcp By Tekup
 *
 * Repository: TekupDK/tekup-billy (apps/production/tekup-billy)
 * Server: Billy-mcp By Tekup v2.0.0
 * Base URL: https://tekup-billy-production.up.railway.app
 * Documentation: docs/integration/CHATGPT_INTEGRATION_GUIDE.md
 *
 * Features:
 * - Automatic pagination for all list operations
 * - Enhanced type safety and error handling
 * - Invoice, customer, and product management
 *
 * API Documentation: https://www.billy.dk/api
 */

const BILLY_API_KEY = process.env.BILLY_API_KEY || "";
// If using an OAuth token tied to a single organization, this should be left empty
const BILLY_ORGANIZATION_ID = process.env.BILLY_ORGANIZATION_ID || "";
const BILLY_API_BASE = "https://api.billysbilling.com/v2";

interface BillyContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  countryId?: string;
  organizationId: string;
}

/**
 * Billy.dk Invoice (matches Billy API v2 response exactly)
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
  state: "draft" | "approved" | "sent" | "paid" | "overdue" | "voided";
  sentState: "unsent" | "sent" | "resent";
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
  taxMode?: "incl" | "excl" | null;
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

interface BillyProduct {
  id: string;
  name: string;
  description?: string;
  salesPrice: number;
  salesTaxRulesetId?: string;
  organizationId: string;
}

/**
 * Make authenticated request to Billy API
 */
async function billyRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BILLY_API_BASE}${endpoint}`;

  const headers = {
    "X-Access-Token": BILLY_API_KEY,
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Billy API error: ${response.status} - ${error}`);
  }

  return response.json();
}

function withOrgQuery(base: string): string {
  return BILLY_ORGANIZATION_ID
    ? `${base}${base.includes("?") ? "&" : "?"}organizationId=${encodeURIComponent(BILLY_ORGANIZATION_ID)}`
    : base;
}

/**
 * Get all customers (contacts)
 */
export async function getCustomers(): Promise<BillyContact[]> {
  let data: { contacts: BillyContact[] };
  try {
    data = await billyRequest<{ contacts: BillyContact[] }>(
      withOrgQuery(`/contacts`)
    );
  } catch (e: any) {
    if (String(e?.message || e).includes("must not be set")) {
      data = await billyRequest<{ contacts: BillyContact[] }>(`/contacts`);
    } else {
      throw e;
    }
  }
  return data.contacts || [];
}

/**
 * Get a single customer by ID
 */
export async function getCustomer(
  contactId: string
): Promise<BillyContact | null> {
  try {
    const data = await billyRequest<{ contact: BillyContact }>(
      `/contacts/${contactId}`
    );
    return data.contact;
  } catch (error) {
    console.error("Error fetching customer:", error);
    return null;
  }
}

/**
 * Create a new customer
 */
export async function createCustomer(customer: {
  name: string;
  email?: string;
  phone?: string;
  countryId?: string;
}): Promise<BillyContact> {
  const bodyWithOrg = {
    contact: {
      ...customer,
      ...(BILLY_ORGANIZATION_ID
        ? { organizationId: BILLY_ORGANIZATION_ID }
        : {}),
      type: "company",
    },
  };
  try {
    const data = await billyRequest<{ contact: BillyContact }>("/contacts", {
      method: "POST",
      body: JSON.stringify(bodyWithOrg),
    });
    return data.contact;
  } catch (e: any) {
    if (String(e?.message || e).includes("must not be set")) {
      const fallback = await billyRequest<{ contact: BillyContact }>(
        "/contacts",
        {
          method: "POST",
          body: JSON.stringify({
            contact: { ...bodyWithOrg.contact, organizationId: undefined },
          }),
        }
      );
      return fallback.contact;
    }
    throw e;
  }
}

/**
 * Get all invoices
 */
export async function getInvoices(): Promise<BillyInvoice[]> {
  let data: { invoices: BillyInvoice[] };
  try {
    data = await billyRequest<{ invoices: BillyInvoice[] }>(
      withOrgQuery(`/invoices`)
    );
  } catch (e: any) {
    if (String(e?.message || e).includes("must not be set")) {
      data = await billyRequest<{ invoices: BillyInvoice[] }>(`/invoices`);
    } else {
      throw e;
    }
  }
  return data.invoices || [];
}

/**
 * Get a single invoice by ID
 */
export async function getInvoice(
  invoiceId: string
): Promise<BillyInvoice | null> {
  try {
    const data = await billyRequest<{ invoice: BillyInvoice }>(
      `/invoices/${invoiceId}`
    );
    return data.invoice;
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return null;
  }
}

/**
 * Create a new invoice
 */
export async function createInvoice(invoice: {
  contactId: string;
  entryDate: string;
  paymentTermsDays?: number;
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    productId?: string;
  }>;
}): Promise<BillyInvoice> {
  const bodyWithOrg = {
    invoice: {
      ...invoice,
      ...(BILLY_ORGANIZATION_ID
        ? { organizationId: BILLY_ORGANIZATION_ID }
        : {}),
      paymentTermsDays: invoice.paymentTermsDays || 14,
      state: "draft",
    },
  };
  try {
    const data = await billyRequest<{ invoice: BillyInvoice }>("/invoices", {
      method: "POST",
      body: JSON.stringify(bodyWithOrg),
    });
    return data.invoice;
  } catch (e: any) {
    if (String(e?.message || e).includes("must not be set")) {
      const fallback = await billyRequest<{ invoice: BillyInvoice }>(
        "/invoices",
        {
          method: "POST",
          body: JSON.stringify({
            invoice: { ...bodyWithOrg.invoice, organizationId: undefined },
          }),
        }
      );
      return fallback.invoice;
    }
    throw e;
  }
}

/**
 * Update invoice state (approve, send, etc.)
 */
export async function updateInvoiceState(
  invoiceId: string,
  state: "approved" | "sent"
): Promise<BillyInvoice> {
  const data = await billyRequest<{ invoice: BillyInvoice }>(
    `/invoices/${invoiceId}`,
    {
      method: "PUT",
      body: JSON.stringify({
        invoice: {
          state,
        },
      }),
    }
  );
  return data.invoice;
}

/**
 * Get all products
 */
export async function getProducts(): Promise<BillyProduct[]> {
  let data: { products: BillyProduct[] };
  try {
    data = await billyRequest<{ products: BillyProduct[] }>(
      withOrgQuery(`/products`)
    );
  } catch (e: any) {
    if (String(e?.message || e).includes("must not be set")) {
      data = await billyRequest<{ products: BillyProduct[] }>(`/products`);
    } else {
      throw e;
    }
  }
  return data.products || [];
}

/**
 * Search customers by email
 */
export async function searchCustomerByEmail(
  email: string
): Promise<BillyContact | null> {
  const customers = await getCustomers();
  return (
    customers.find(c => c.email?.toLowerCase() === email.toLowerCase()) || null
  );
}
