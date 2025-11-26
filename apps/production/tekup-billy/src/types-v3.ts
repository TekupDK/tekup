/**
 * Billy MCP v3.0 Type Definitions
 * Hierarchical tool output types based on MCP Tool Output Schemas (June 2025)
 *
 * Architecture: 3-level hierarchy
 * - Level 1: Summary Tools (10-50 tokens)
 * - Level 2: Filtered Lists (100-500 tokens)
 * - Level 3: Detailed Retrieval (500-2000 tokens)
 */

/**
 * Base interface for all v3.0 tool outputs
 * Implements MCP Tool Output Schema pattern
 */
export interface ToolOutputSchema {
  _schema: string;           // Schema name (e.g., "BillyInvoiceSummary")
  _nextActions?: string[];   // Suggested next tools to call
  _tokenUsage?: number;      // Actual tokens used in response
  _suggestions?: string[];   // Spelling suggestions, alternative queries
  _alerts?: string[];        // Warnings or important notices
  _cached?: boolean;         // From smart fallback cache
  _cachedAt?: string;        // When cached (ISO date)
  _cacheAge?: string;        // Age of cache (e.g., "45s")
  _warning?: string;         // Warning message
}

// ============================================================================
// LEVEL 1: SUMMARY TOOLS (10-50 tokens)
// ============================================================================

/**
 * get_invoice_summary output
 * Token budget: 15 tokens
 */
export interface InvoiceSummary extends ToolOutputSchema {
  total: number;              // Total invoice count
  unpaid: number;             // Count of unpaid invoices
  overdue: number;            // Count of overdue invoices
  paid: number;               // Count of paid invoices
  draft: number;              // Count of draft invoices
  _avgAmount: number;         // Average invoice amount (DKK)
  _oldestUnpaidDays: number;  // Days since oldest unpaid invoice
  _totalUnpaidAmount: number; // Total unpaid amount (DKK)
  _schema: "BillyInvoiceSummary";
}

/**
 * get_customer_summary output
 * Token budget: 12 tokens
 */
export interface CustomerSummary extends ToolOutputSchema {
  total: number;                    // Total customer count
  active: number;                   // Customers with invoices in last 90 days
  dormant: number;                  // No invoices in 90+ days
  _newThisMonth: number;            // Customers created this month
  _avgInvoicesPerCustomer: number;  // Average invoices per customer
  _schema: "BillyCustomerSummary";
}

/**
 * get_business_overview output
 * Token budget: 35 tokens
 */
export interface BusinessOverview extends ToolOutputSchema {
  invoices: {
    total: number;
    unpaid: number;
    overdue: number;
    draft: number;
    _totalUnpaidAmount: number;
  };
  customers: {
    total: number;
    active: number;
    _newThisMonth: number;
  };
  products: {
    total: number;
    active: number;
  };
  _recentActivity: string;          // "12 invoices created this week"
  _alerts: string[];                // ["3 overdue invoices", "2 new customers"]
  _schema: "BillyBusinessOverview";
}

// ============================================================================
// LEVEL 2: FILTERED LISTS (100-500 tokens)
// ============================================================================

/**
 * Compact invoice format for list operations
 */
export interface CompactInvoice {
  id: string;               // Billy invoice ID
  invoiceNo: string;        // "2024-0042"
  customerName: string;     // "Peder Kjær"
  customerEmail?: string;   // Email if available
  amount: number;           // 1396.00
  currency: string;         // "DKK"
  dueDate: string;          // "2024-11-15"
  state: string;            // "unpaid", "paid", "draft", etc.
  daysOverdue?: number;     // 11 (or 0 if not overdue)
  _customerId: string;      // For follow-up queries
}

/**
 * list_unpaid_invoices, list_overdue_invoices, list_recent_invoices output
 * Token budget: 120 tokens (12 invoices × 10 tokens each)
 */
export interface InvoiceList extends ToolOutputSchema {
  invoices: CompactInvoice[];
  _total: number;             // Total count (may exceed limit)
  _hasMore: boolean;          // True if total > returned count
  _totalAmount?: number;      // Sum of invoice amounts
  _period?: string;           // "last_7_days" for recent invoices
  _schema: "BillyUnpaidInvoiceList" | "BillyOverdueInvoiceList" | "BillyRecentInvoiceList";
}

/**
 * Compact customer format for search/list operations
 */
export interface CompactCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  _lastInvoiceDate?: string;     // "2024-10-15" (helps identify active)
  _totalInvoices?: number;        // 5
  _matchScore?: number;          // 0-100 (fuzzy match confidence)
}

/**
 * search_customers, list_active_customers output
 * Token budget: 80 tokens (10 customers × 8 tokens each)
 */
export interface CustomerSearchResult extends ToolOutputSchema {
  customers: CompactCustomer[];
  _exactMatch?: boolean;            // True if perfect name match found
  _suggestions?: string[];          // ["Peder Kjaer", "P. Kjær"] if no exact
  _total: number;
  _schema: "BillyCustomerSearchResult";
}

/**
 * search_invoices output
 * Token budget: 150 tokens
 */
export interface InvoiceSearchResult extends ToolOutputSchema {
  invoices: CompactInvoice[];
  _total: number;
  _hasMore: boolean;
  _filters: {
    state?: string;
    customerName?: string;
    minAmount?: number;
    maxAmount?: number;
    dateFrom?: string;
    dateTo?: string;
  };
  _schema: "BillyInvoiceSearchResult";
}

// ============================================================================
// LEVEL 3: DETAILED RETRIEVAL (500-2000 tokens)
// ============================================================================

/**
 * Invoice line item
 */
export interface InvoiceLineItem {
  productId?: string;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxPercent: number;
  total: number;
}

/**
 * Customer info in invoice details
 */
export interface InvoiceCustomerInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address: {
    street?: string;
    city?: string;
    zipcode?: string;
    country: string;
  };
}

/**
 * Payment history entry
 */
export interface PaymentHistoryEntry {
  date: string;
  amount: number;
  method?: string;
}

/**
 * get_invoice_details output
 * Token budget: 500 tokens
 */
export interface InvoiceDetails extends ToolOutputSchema {
  invoice: {
    id: string;
    invoiceNo: string;
    state: "draft" | "approved" | "sent" | "paid" | "cancelled";
    createdDate: string;
    dueDate: string;
    sentDate?: string;
    paidDate?: string;
    customer: InvoiceCustomerInfo;
    lines: InvoiceLineItem[];
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    paidAmount: number;
    currency: string;
    _paymentHistory?: PaymentHistoryEntry[];
  };
  _relatedInvoices: Array<{     // Other invoices for same customer
    id: string;
    invoiceNo: string;
    amount: number;
    state: string;
    dueDate: string;
  }>;
  _schema: "BillyInvoiceDetails";
}

/**
 * Invoice statistics for customer details
 */
export interface CustomerInvoiceStats {
  total: number;           // Total invoices for this customer
  paid: number;            // Paid count
  unpaid: number;          // Unpaid count
  overdue: number;         // Overdue count
  totalRevenue: number;    // Sum of all paid invoices
  avgInvoiceAmount: number;
}

/**
 * get_customer_details output
 * Token budget: 400 tokens
 */
export interface CustomerDetails extends ToolOutputSchema {
  customer: {
    id: string;
    name: string;
    type: "person" | "company";
    email: string;
    phone?: string;
    address: {
      street?: string;
      city?: string;
      zipcode?: string;
      country: string;
    };
    _createdDate: string;
    _notes?: string;
  };
  _invoiceStats: CustomerInvoiceStats;
  _recentInvoices: CompactInvoice[];  // Last 5 invoices
  _schema: "BillyCustomerDetails";
}

/**
 * get_product_details output
 * Token budget: 300 tokens
 */
export interface ProductDetails extends ToolOutputSchema {
  product: {
    id: string;
    name: string;
    description: string;
    unitPrice: number;
    currency: string;
    taxPercent: number;
    accountId?: string;
    _createdDate: string;
    _usageCount: number;      // How many times used in invoices
  };
  _recentInvoices: Array<{    // Recent invoices using this product
    invoiceNo: string;
    customerName: string;
    quantity: number;
    date: string;
  }>;
  _schema: "BillyProductDetails";
}

// ============================================================================
// INPUT TYPES FOR v3.0 TOOLS
// ============================================================================

export interface ListUnpaidInvoicesInput {
  limit?: number;  // Default: 20, Max: 100
  sortBy?: "dueDate" | "amount" | "createdDate";  // Default: "dueDate"
}

export interface ListOverdueInvoicesInput {
  limit?: number;           // Default: 20
  minDaysOverdue?: number;  // Filter by urgency (e.g., >30 days)
}

export interface ListRecentInvoicesInput {
  days?: number;   // Default: 7 (last week)
  limit?: number;  // Default: 20
  state?: "all" | "paid" | "unpaid" | "draft";  // Default: "all"
}

export interface SearchCustomersInput {
  query: string;    // Customer name (fuzzy match)
  limit?: number;   // Default: 10
}

export interface ListActiveCustomersInput {
  activeDays?: number;  // Default: 90 (invoices in last 90 days)
  limit?: number;       // Default: 20
}

export interface SearchInvoicesInput {
  customerName?: string;
  state?: "all" | "paid" | "unpaid" | "draft" | "overdue";
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: string;    // ISO date
  dateTo?: string;      // ISO date
  limit?: number;       // Default: 20
}

export interface GetInvoiceDetailsInput {
  invoiceId?: string;      // Billy invoice ID
  invoiceNo?: string;      // Alternative: invoice number "2024-0042"
}

export interface GetCustomerDetailsInput {
  customerId?: string;      // Billy customer ID
  customerName?: string;    // Alternative: search by name (must be exact)
}

export interface GetProductDetailsInput {
  productId: string;
}
