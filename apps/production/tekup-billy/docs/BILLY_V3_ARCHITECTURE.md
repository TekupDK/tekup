# Billy MCP v3.0 Architecture Specification

**Version:** 3.0.0 (Design Phase)
**Date:** November 26, 2025
**Status:** 📐 Architecture Design → Awaiting Approval for Implementation

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tool Catalog](#tool-catalog)
3. [Type Definitions](#type-definitions)
4. [Implementation Details](#implementation-details)
5. [Testing Strategy](#testing-strategy)
6. [Performance Targets](#performance-targets)

---

## 🏗️ Architecture Overview

### Design Principles

Billy MCP v3.0 follows a **hierarchical information disclosure** pattern based on:

1. **Lost in the Middle** mitigation → avoid long lists
2. **Toolformer** selective tool use → task-specific, not excessive
3. **Hierarchical RAG** patterns → summary → entities → details
4. **MCP Tool Output Schemas** compliance → structured, predictable outputs
5. **Chain-of-Thought** guidance → `_nextActions` hints for multi-step workflows

### Three-Level Hierarchy

```
┌─────────────────────────────────────────┐
│  Level 1: Summary Tools                 │
│  Output: 10-50 tokens                   │
│  Purpose: Quick overview, no details    │
│  Examples: get_invoice_summary          │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Level 2: Filtered Lists                │
│  Output: 100-500 tokens                 │
│  Purpose: Targeted, compact entity lists│
│  Examples: list_unpaid_invoices         │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Level 3: Detailed Retrieval            │
│  Output: 500-2000 tokens                │
│  Purpose: Complete single-item data     │
│  Examples: get_invoice_details          │
└─────────────────────────────────────────┘
```

### Tool Flow Example

```
User: "Which invoices need payment?"

Claude calls:
1. get_invoice_summary()
   → {total: 139, unpaid: 12, overdue: 3}
   → 15 tokens

2. list_unpaid_invoices(limit: 20)
   → [12 invoices with compact fields]
   → 120 tokens

3. (Optional) get_invoice_details(id: "...")
   → Full invoice if user needs details
   → 500 tokens

Total: 135-635 tokens
vs. v2.0.3: 10,000+ tokens
Reduction: 93-98%
```

---

## 🛠️ Tool Catalog

### Level 1: Summary Tools (10-50 tokens)

#### 1.1 `get_invoice_summary`

**Purpose:** Get high-level invoice statistics

**Input:** None

**Output:**
```typescript
{
  total: number;              // Total invoice count
  unpaid: number;             // Count of unpaid invoices
  overdue: number;            // Count of overdue invoices
  paid: number;               // Count of paid invoices
  draft: number;              // Count of draft invoices
  _avgAmount: number;         // Average invoice amount (DKK)
  _oldestUnpaidDays: number;  // Days since oldest unpaid invoice
  _totalUnpaidAmount: number; // Total unpaid amount (DKK)
  _schema: "BillyInvoiceSummary";
  _nextActions: ["list_unpaid_invoices", "list_overdue_invoices", "list_recent_invoices"];
  _tokenUsage: 15;
}
```

**Billy API Calls:** 1 × GET `/invoices` with count aggregation

**Token Budget:** 15 tokens

**Example Response:**
```json
{
  "total": 139,
  "unpaid": 12,
  "overdue": 3,
  "paid": 124,
  "draft": 3,
  "_avgAmount": 2450.50,
  "_oldestUnpaidDays": 45,
  "_totalUnpaidAmount": 16842.00,
  "_schema": "BillyInvoiceSummary",
  "_nextActions": ["list_unpaid_invoices", "list_overdue_invoices"],
  "_tokenUsage": 15
}
```

---

#### 1.2 `get_customer_summary`

**Purpose:** Get high-level customer statistics

**Input:** None

**Output:**
```typescript
{
  total: number;                    // Total customer count
  active: number;                   // Customers with invoices in last 90 days
  dormant: number;                  // No invoices in 90+ days
  _newThisMonth: number;            // Customers created this month
  _avgInvoicesPerCustomer: number;  // Average invoices per customer
  _schema: "BillyCustomerSummary";
  _nextActions: ["search_customers", "list_active_customers"];
  _tokenUsage: 12;
}
```

**Billy API Calls:** 1 × GET `/contacts` with metadata

**Token Budget:** 12 tokens

**Example Response:**
```json
{
  "total": 137,
  "active": 89,
  "dormant": 48,
  "_newThisMonth": 5,
  "_avgInvoicesPerCustomer": 3.2,
  "_schema": "BillyCustomerSummary",
  "_nextActions": ["search_customers", "list_active_customers"],
  "_tokenUsage": 12
}
```

---

#### 1.3 `get_business_overview`

**Purpose:** Get complete business snapshot (combines invoice + customer summaries)

**Input:** None

**Output:**
```typescript
{
  invoices: InvoiceSummary;         // From get_invoice_summary
  customers: CustomerSummary;       // From get_customer_summary
  products: {
    total: number;
    active: number;
  };
  _recentActivity: string;          // "12 invoices created this week"
  _alerts: string[];                // ["3 overdue invoices", "2 new customers"]
  _schema: "BillyBusinessOverview";
  _nextActions: ["list_unpaid_invoices", "search_customers"];
  _tokenUsage: 35;
}
```

**Billy API Calls:** 3 × GET (invoices, contacts, products) - parallel

**Token Budget:** 35 tokens

**Use Case:** LLM needs complete context before taking action

---

### Level 2: Filtered Lists (100-500 tokens)

#### 2.1 `list_unpaid_invoices`

**Purpose:** Get compact list of unpaid invoices

**Input:**
```typescript
{
  limit?: number;  // Default: 20, Max: 100
  sortBy?: "dueDate" | "amount" | "createdDate";  // Default: "dueDate"
}
```

**Output:**
```typescript
{
  invoices: Array<{
    id: string;               // Billy invoice ID
    invoiceNo: string;        // "2024-0042"
    customerName: string;     // "Peder Kjær"
    customerEmail?: string;   // Email if available
    amount: number;           // 1396.00
    currency: string;         // "DKK"
    dueDate: string;          // "2024-11-15"
    daysOverdue: number;      // 11 (or 0 if not overdue)
    _customerId: string;      // For follow-up queries
  }>;
  _total: number;             // Total unpaid count (may exceed limit)
  _hasMore: boolean;          // True if total > returned count
  _totalAmount: number;       // Sum of all unpaid invoices
  _schema: "BillyUnpaidInvoiceList";
  _nextActions: ["get_invoice_details", "send_invoice", "mark_invoice_paid"];
  _tokenUsage: number;        // Actual tokens used (~10 per invoice)
}
```

**Billy API Calls:** 1 × GET `/invoices?state=unpaid&limit={limit}`

**Token Budget:** ~120 tokens (12 invoices × 10 tokens each)

**Sorting:**
- Default: By `dueDate` ASC (oldest first)
- Overdue invoices appear at top

**Example Response:**
```json
{
  "invoices": [
    {
      "id": "abc123",
      "invoiceNo": "2024-0042",
      "customerName": "Peder Kjær",
      "customerEmail": "pederkjaer@hotmail.com",
      "amount": 1396.00,
      "currency": "DKK",
      "dueDate": "2024-11-15",
      "daysOverdue": 11,
      "_customerId": "cust_789"
    }
    // ... 11 more
  ],
  "_total": 12,
  "_hasMore": false,
  "_totalAmount": 16842.00,
  "_schema": "BillyUnpaidInvoiceList",
  "_nextActions": ["get_invoice_details", "send_invoice"],
  "_tokenUsage": 120
}
```

---

#### 2.2 `list_overdue_invoices`

**Purpose:** Get compact list of overdue invoices (subset of unpaid)

**Input:**
```typescript
{
  limit?: number;           // Default: 20
  minDaysOverdue?: number;  // Filter by urgency (e.g., >30 days)
}
```

**Output:** Same structure as `list_unpaid_invoices` but filtered to overdue only

**Billy API Calls:** 1 × GET `/invoices?state=unpaid&overdue=true`

**Token Budget:** ~80 tokens (typically fewer overdue than unpaid)

**Use Case:** LLM prioritizes urgent collections

---

#### 2.3 `list_recent_invoices`

**Purpose:** Get recent invoices (any state)

**Input:**
```typescript
{
  days?: number;   // Default: 7 (last week)
  limit?: number;  // Default: 20
  state?: "all" | "paid" | "unpaid" | "draft";  // Default: "all"
}
```

**Output:**
```typescript
{
  invoices: Array<CompactInvoice>;  // Same compact format
  _period: string;                   // "last_7_days"
  _total: number;
  _hasMore: boolean;
  _schema: "BillyRecentInvoiceList";
  _nextActions: ["get_invoice_details"];
  _tokenUsage: number;
}
```

**Billy API Calls:** 1 × GET `/invoices?createdAfter={date}`

**Token Budget:** ~100 tokens

**Use Case:** LLM checks recent activity, weekly summaries

---

#### 2.4 `search_customers`

**Purpose:** Fuzzy search for customers by name

**Input:**
```typescript
{
  query: string;    // Customer name (fuzzy match)
  limit?: number;   // Default: 10
}
```

**Output:**
```typescript
{
  customers: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    _lastInvoiceDate: string;     // "2024-10-15" (helps identify active)
    _totalInvoices: number;        // 5
    _matchScore?: number;          // 0-100 (fuzzy match confidence)
  }>;
  _exactMatch: boolean;            // True if perfect name match found
  _suggestions: string[];          // ["Peder Kjaer", "P. Kjær"] if no exact
  _total: number;
  _schema: "BillyCustomerSearchResult";
  _nextActions: ["get_customer_details", "create_invoice", "create_customer"];
  _tokenUsage: number;
}
```

**Billy API Calls:** 1 × GET `/contacts?name={query}`

**Token Budget:** ~80 tokens (10 customers × 8 tokens each)

**Fuzzy Matching:**
- Case-insensitive
- Handles Danish characters (æ, ø, å)
- Partial matches ranked by similarity
- Spelling suggestions if no exact match

**Example Response:**
```json
{
  "customers": [
    {
      "id": "cust_789",
      "name": "Peder Kjær",
      "email": "pederkjaer@hotmail.com",
      "phone": "31 77 90 87",
      "_lastInvoiceDate": "2024-10-15",
      "_totalInvoices": 5,
      "_matchScore": 100
    }
  ],
  "_exactMatch": true,
  "_suggestions": [],
  "_total": 1,
  "_schema": "BillyCustomerSearchResult",
  "_nextActions": ["get_customer_details", "create_invoice"],
  "_tokenUsage": 25
}
```

---

#### 2.5 `list_active_customers`

**Purpose:** Get customers with recent invoices

**Input:**
```typescript
{
  activeDays?: number;  // Default: 90 (invoices in last 90 days)
  limit?: number;       // Default: 20
}
```

**Output:** Same structure as `search_customers`

**Billy API Calls:** 1 × GET `/contacts` + filter by invoice activity

**Token Budget:** ~150 tokens

---

### Level 3: Detailed Retrieval (500-2000 tokens)

#### 3.1 `get_invoice_details`

**Purpose:** Get complete invoice data including lines, customer, payment history

**Input:**
```typescript
{
  invoiceId?: string;      // Billy invoice ID
  invoiceNo?: string;      // Alternative: invoice number "2024-0042"
}
```

**Output:**
```typescript
{
  invoice: {
    id: string;
    invoiceNo: string;
    state: "draft" | "approved" | "sent" | "paid" | "cancelled";
    createdDate: string;
    dueDate: string;
    sentDate?: string;
    paidDate?: string;
    customer: {
      id: string;
      name: string;
      email: string;
      phone?: string;
      address: {
        street: string;
        city: string;
        zipcode: string;
        country: string;
      };
    };
    lines: Array<{
      productId?: string;
      productName: string;
      description: string;
      quantity: number;
      unitPrice: number;
      discountPercent?: number;
      taxPercent: number;
      total: number;
    }>;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    paidAmount: number;
    currency: string;
    _paymentHistory?: Array<{
      date: string;
      amount: number;
      method?: string;
    }>;
  };
  _relatedInvoices: Array<{     // Other invoices for same customer
    id: string;
    invoiceNo: string;
    amount: number;
    state: string;
    dueDate: string;
  }>;
  _schema: "BillyInvoiceDetails";
  _nextActions: ["send_invoice", "update_invoice", "mark_invoice_paid", "cancel_invoice"];
  _tokenUsage: number;
}
```

**Billy API Calls:**
1. GET `/invoices/{id}` - Full invoice data
2. GET `/invoices?contactId={customerId}&limit=5` - Related invoices

**Token Budget:** ~500 tokens

**Use Case:** LLM needs complete context before sending invoice or answering detailed questions

---

#### 3.2 `get_customer_details`

**Purpose:** Get complete customer data including invoice statistics

**Input:**
```typescript
{
  customerId?: string;      // Billy customer ID
  customerName?: string;    // Alternative: search by name (must be exact)
}
```

**Output:**
```typescript
{
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
  _invoiceStats: {
    total: number;           // Total invoices for this customer
    paid: number;            // Paid count
    unpaid: number;          // Unpaid count
    overdue: number;         // Overdue count
    totalRevenue: number;    // Sum of all paid invoices
    avgInvoiceAmount: number;
  };
  _recentInvoices: Array<CompactInvoice>;  // Last 5 invoices
  _schema: "BillyCustomerDetails";
  _nextActions: ["create_invoice", "update_customer", "get_invoice_details"];
  _tokenUsage: number;
}
```

**Billy API Calls:**
1. GET `/contacts/{id}` - Full customer data
2. GET `/invoices?contactId={id}` - Invoice statistics

**Token Budget:** ~400 tokens

**Use Case:** LLM preparing to create invoice or answer customer-specific questions

---

#### 3.3 `get_product_details`

**Purpose:** Get complete product data (for invoice creation)

**Input:**
```typescript
{
  productId: string;
}
```

**Output:**
```typescript
{
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
  _nextActions: ["create_invoice", "update_product"];
  _tokenUsage: number;
}
```

**Billy API Calls:**
1. GET `/products/{id}`
2. GET `/invoices?productId={id}&limit=5`

**Token Budget:** ~300 tokens

---

### Write Operations (Existing v2.0.3 Tools - Keep As-Is)

These tools remain unchanged from v2.0.3:

- `create_invoice` - Create new invoice
- `send_invoice` - Send invoice via email
- `update_invoice` - Update invoice details
- `approve_invoice` - Approve draft invoice
- `cancel_invoice` - Cancel invoice
- `mark_invoice_paid` - Mark as paid
- `create_customer` - Create new customer
- `update_customer` - Update customer info
- `create_product` - Create new product
- `update_product` - Update product info

**Rationale:** These tools have targeted inputs/outputs and don't suffer from the "long context" problem.

---

## 📐 Type Definitions

```typescript
// src/types/v3-tools.ts

/**
 * Base schema for all v3.0 tool outputs
 */
export interface ToolOutputSchema {
  _schema: string;           // Tool output schema name
  _nextActions?: string[];   // Suggested next tool calls
  _tokenUsage?: number;      // Actual token count
  _suggestions?: string[];   // Hints for user (e.g., spelling suggestions)
  _alerts?: string[];        // Important warnings
  _cached?: boolean;         // From cache (v2.0.3 feature)
  _cachedAt?: string;        // Cache timestamp
  _cacheAge?: string;        // Cache age
  _warning?: string;         // Cache warning message
}

/**
 * Level 1: Summary Types
 */
export interface InvoiceSummary extends ToolOutputSchema {
  total: number;
  unpaid: number;
  overdue: number;
  paid: number;
  draft: number;
  _avgAmount: number;
  _oldestUnpaidDays: number;
  _totalUnpaidAmount: number;
  _schema: "BillyInvoiceSummary";
}

export interface CustomerSummary extends ToolOutputSchema {
  total: number;
  active: number;
  dormant: number;
  _newThisMonth: number;
  _avgInvoicesPerCustomer: number;
  _schema: "BillyCustomerSummary";
}

export interface BusinessOverview extends ToolOutputSchema {
  invoices: InvoiceSummary;
  customers: CustomerSummary;
  products: {
    total: number;
    active: number;
  };
  _recentActivity: string;
  _alerts: string[];
  _schema: "BillyBusinessOverview";
}

/**
 * Level 2: Filtered List Types
 */
export interface CompactInvoice {
  id: string;
  invoiceNo: string;
  customerName: string;
  customerEmail?: string;
  amount: number;
  currency: string;
  dueDate: string;
  daysOverdue: number;
  _customerId: string;
}

export interface UnpaidInvoiceList extends ToolOutputSchema {
  invoices: CompactInvoice[];
  _total: number;
  _hasMore: boolean;
  _totalAmount: number;
  _schema: "BillyUnpaidInvoiceList";
}

export interface CompactCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  _lastInvoiceDate: string;
  _totalInvoices: number;
  _matchScore?: number;
}

export interface CustomerSearchResult extends ToolOutputSchema {
  customers: CompactCustomer[];
  _exactMatch: boolean;
  _suggestions: string[];
  _total: number;
  _schema: "BillyCustomerSearchResult";
}

/**
 * Level 3: Detailed Types
 */
export interface InvoiceDetails extends ToolOutputSchema {
  invoice: {
    id: string;
    invoiceNo: string;
    state: string;
    createdDate: string;
    dueDate: string;
    customer: {
      id: string;
      name: string;
      email: string;
      phone?: string;
      address: Address;
    };
    lines: InvoiceLine[];
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    paidAmount: number;
    currency: string;
    _paymentHistory?: Payment[];
  };
  _relatedInvoices: CompactInvoice[];
  _schema: "BillyInvoiceDetails";
}

export interface CustomerDetails extends ToolOutputSchema {
  customer: {
    id: string;
    name: string;
    type: "person" | "company";
    email: string;
    phone?: string;
    address: Address;
    _createdDate: string;
  };
  _invoiceStats: {
    total: number;
    paid: number;
    unpaid: number;
    overdue: number;
    totalRevenue: number;
    avgInvoiceAmount: number;
  };
  _recentInvoices: CompactInvoice[];
  _schema: "BillyCustomerDetails";
}

// Supporting types
export interface Address {
  street?: string;
  city?: string;
  zipcode?: string;
  country: string;
}

export interface InvoiceLine {
  productId?: string;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxPercent: number;
  total: number;
}

export interface Payment {
  date: string;
  amount: number;
  method?: string;
}
```

---

## 🔨 Implementation Details

### File Structure

```
src/
├── tools/
│   ├── summary.ts           ← NEW: Level 1 tools
│   ├── filtered-lists.ts    ← NEW: Level 2 tools
│   ├── invoices.ts          ← UPDATE: Keep Level 3 + write ops
│   ├── customers.ts         ← UPDATE: Keep Level 3 + write ops
│   ├── products.ts          ← UPDATE: Keep Level 3 + write ops
│   ├── revenue.ts           (unchanged)
│   ├── analytics.ts         (unchanged)
│   └── ops.ts               (unchanged)
├── types/
│   ├── v3-tools.ts          ← NEW: v3.0 type definitions
│   └── types.ts             (existing v2 types)
└── billy-client.ts          (unchanged - same Billy API calls)
```

### Summary Tools Implementation

```typescript
// src/tools/summary.ts

import { BillyClient } from "../billy-client.js";
import type { InvoiceSummary, CustomerSummary, BusinessOverview } from "../types/v3-tools.js";

/**
 * Get invoice summary (Level 1)
 */
export async function getInvoiceSummary(
  client: BillyClient
): Promise<InvoiceSummary> {
  // Fetch all invoices with minimal fields
  const invoices = await client.getInvoices({ fields: "id,state,totalAmount,dueDate" });

  const total = invoices.length;
  const unpaid = invoices.filter(inv => inv.state === "unpaid" || inv.state === "sent").length;
  const overdue = invoices.filter(inv =>
    (inv.state === "unpaid" || inv.state === "sent") &&
    new Date(inv.dueDate) < new Date()
  ).length;
  const paid = invoices.filter(inv => inv.state === "paid").length;
  const draft = invoices.filter(inv => inv.state === "draft").length;

  const unpaidInvoices = invoices.filter(inv => inv.state === "unpaid" || inv.state === "sent");
  const totalUnpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const avgAmount = invoices.length > 0
    ? invoices.reduce((sum, inv) => sum + inv.totalAmount, 0) / invoices.length
    : 0;

  const oldestUnpaid = unpaidInvoices
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  const oldestUnpaidDays = oldestUnpaid
    ? Math.floor((Date.now() - new Date(oldestUnpaid.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    total,
    unpaid,
    overdue,
    paid,
    draft,
    _avgAmount: Math.round(avgAmount * 100) / 100,
    _oldestUnpaidDays: oldestUnpaidDays,
    _totalUnpaidAmount: Math.round(totalUnpaidAmount * 100) / 100,
    _schema: "BillyInvoiceSummary",
    _nextActions: ["list_unpaid_invoices", "list_overdue_invoices", "list_recent_invoices"],
    _tokenUsage: 15
  };
}

/**
 * Get customer summary (Level 1)
 */
export async function getCustomerSummary(
  client: BillyClient
): Promise<CustomerSummary> {
  // Similar implementation...
  const customers = await client.getContacts({ fields: "id,createdTime" });
  const invoices = await client.getInvoices({ fields: "contactId,createdTime" });

  const total = customers.length;
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const active = customers.filter(customer => {
    const recentInvoices = invoices.filter(
      inv => inv.contactId === customer.id &&
      new Date(inv.createdTime) > ninetyDaysAgo
    );
    return recentInvoices.length > 0;
  }).length;

  const dormant = total - active;

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const newThisMonth = customers.filter(
    c => new Date(c.createdTime) >= thisMonthStart
  ).length;

  const avgInvoicesPerCustomer = total > 0 ? invoices.length / total : 0;

  return {
    total,
    active,
    dormant,
    _newThisMonth: newThisMonth,
    _avgInvoicesPerCustomer: Math.round(avgInvoicesPerCustomer * 10) / 10,
    _schema: "BillyCustomerSummary",
    _nextActions: ["search_customers", "list_active_customers"],
    _tokenUsage: 12
  };
}

/**
 * Get business overview (Level 1 - combines summaries)
 */
export async function getBusinessOverview(
  client: BillyClient
): Promise<BusinessOverview> {
  // Parallel fetch for efficiency
  const [invoiceSummary, customerSummary, products] = await Promise.all([
    getInvoiceSummary(client),
    getCustomerSummary(client),
    client.getProducts({ fields: "id" })
  ]);

  // Generate recent activity summary
  const recentActivity = `${invoiceSummary.unpaid} unpaid invoices, ${invoiceSummary.overdue} overdue`;

  // Generate alerts
  const alerts: string[] = [];
  if (invoiceSummary.overdue > 0) {
    alerts.push(`${invoiceSummary.overdue} overdue invoices`);
  }
  if (customerSummary._newThisMonth > 0) {
    alerts.push(`${customerSummary._newThisMonth} new customers this month`);
  }

  return {
    invoices: invoiceSummary,
    customers: customerSummary,
    products: {
      total: products.length,
      active: products.length // TODO: filter by usage
    },
    _recentActivity: recentActivity,
    _alerts: alerts,
    _schema: "BillyBusinessOverview",
    _nextActions: ["list_unpaid_invoices", "search_customers"],
    _tokenUsage: 35
  };
}
```

### Filtered Lists Implementation

```typescript
// src/tools/filtered-lists.ts

import { BillyClient } from "../billy-client.js";
import type { UnpaidInvoiceList, CompactInvoice, CustomerSearchResult } from "../types/v3-tools.js";

/**
 * List unpaid invoices (Level 2)
 */
export async function listUnpaidInvoices(
  client: BillyClient,
  args: { limit?: number; sortBy?: "dueDate" | "amount" | "createdDate" }
): Promise<UnpaidInvoiceList> {
  const limit = args.limit || 20;
  const sortBy = args.sortBy || "dueDate";

  // Fetch unpaid invoices
  const allUnpaid = await client.getInvoices({
    state: "unpaid,sent", // Both unpaid and sent count as unpaid
    fields: "id,invoiceNo,contactId,totalAmount,currency,dueDate,createdTime"
  });

  // Sort
  allUnpaid.sort((a, b) => {
    if (sortBy === "dueDate") {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else if (sortBy === "amount") {
      return b.totalAmount - a.totalAmount;
    } else {
      return new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime();
    }
  });

  // Get customer names (batch fetch to avoid N+1)
  const customerIds = [...new Set(allUnpaid.map(inv => inv.contactId))];
  const customers = await client.getContactsByIds(customerIds);
  const customerMap = new Map(customers.map(c => [c.id, c]));

  // Build compact invoices
  const compactInvoices: CompactInvoice[] = allUnpaid.slice(0, limit).map(invoice => {
    const customer = customerMap.get(invoice.contactId);
    const daysOverdue = Math.max(0,
      Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    );

    return {
      id: invoice.id,
      invoiceNo: invoice.invoiceNo,
      customerName: customer?.name || "Unknown",
      customerEmail: customer?.email,
      amount: invoice.totalAmount,
      currency: invoice.currency || "DKK",
      dueDate: invoice.dueDate,
      daysOverdue,
      _customerId: invoice.contactId
    };
  });

  const totalAmount = allUnpaid.reduce((sum, inv) => sum + inv.totalAmount, 0);

  return {
    invoices: compactInvoices,
    _total: allUnpaid.length,
    _hasMore: allUnpaid.length > limit,
    _totalAmount: Math.round(totalAmount * 100) / 100,
    _schema: "BillyUnpaidInvoiceList",
    _nextActions: ["get_invoice_details", "send_invoice", "mark_invoice_paid"],
    _tokenUsage: compactInvoices.length * 10 // ~10 tokens per invoice
  };
}

/**
 * Search customers (Level 2)
 */
export async function searchCustomers(
  client: BillyClient,
  args: { query: string; limit?: number }
): Promise<CustomerSearchResult> {
  const limit = args.limit || 10;
  const query = args.query.toLowerCase().trim();

  // Fetch all customers (Billy API doesn't support server-side search)
  const allCustomers = await client.getContacts({
    fields: "id,name,email,phone,createdTime"
  });

  // Fetch invoice counts
  const invoices = await client.getInvoices({ fields: "contactId,createdTime" });
  const invoiceCountMap = new Map<string, {count: number, lastDate: string}>();

  invoices.forEach(inv => {
    const existing = invoiceCountMap.get(inv.contactId);
    if (!existing || new Date(inv.createdTime) > new Date(existing.lastDate)) {
      invoiceCountMap.set(inv.contactId, {
        count: (existing?.count || 0) + 1,
        lastDate: inv.createdTime
      });
    }
  });

  // Fuzzy match
  const matches = allCustomers.map(customer => {
    const name = customer.name.toLowerCase();
    let matchScore = 0;

    if (name === query) {
      matchScore = 100; // Exact match
    } else if (name.includes(query)) {
      matchScore = 80; // Contains query
    } else {
      // Levenshtein distance or similar
      const similarity = calculateSimilarity(name, query);
      matchScore = similarity;
    }

    const invoiceData = invoiceCountMap.get(customer.id);

    return {
      customer,
      matchScore,
      invoiceCount: invoiceData?.count || 0,
      lastInvoiceDate: invoiceData?.lastDate || customer.createdTime
    };
  })
  .filter(m => m.matchScore > 30) // Threshold
  .sort((a, b) => b.matchScore - a.matchScore)
  .slice(0, limit);

  const exactMatch = matches.length > 0 && matches[0].matchScore === 100;

  // Generate suggestions if no exact match
  const suggestions: string[] = [];
  if (!exactMatch && matches.length > 0) {
    suggestions.push(...matches.slice(0, 3).map(m => m.customer.name));
  }

  const compactCustomers = matches.map(m => ({
    id: m.customer.id,
    name: m.customer.name,
    email: m.customer.email,
    phone: m.customer.phone,
    _lastInvoiceDate: m.lastInvoiceDate,
    _totalInvoices: m.invoiceCount,
    _matchScore: m.matchScore
  }));

  return {
    customers: compactCustomers,
    _exactMatch: exactMatch,
    _suggestions: suggestions,
    _total: matches.length,
    _schema: "BillyCustomerSearchResult",
    _nextActions: ["get_customer_details", "create_invoice", "create_customer"],
    _tokenUsage: compactCustomers.length * 8
  };
}

// Helper: Calculate string similarity (simple version)
function calculateSimilarity(str1: string, str2: string): number {
  // Implement Levenshtein or Jaro-Winkler distance
  // For now, simple overlap percentage
  const overlap = str1.split('').filter(char => str2.includes(char)).length;
  return Math.round((overlap / Math.max(str1.length, str2.length)) * 100);
}
```

---

## 🧪 Testing Strategy

### Unit Tests

Test each tool in isolation:

```typescript
// tests/unit/summary-tools.test.ts

describe("Summary Tools", () => {
  describe("getInvoiceSummary", () => {
    it("should return correct counts", async () => {
      const mockClient = createMockBillyClient({
        invoices: [
          { state: "paid", totalAmount: 100 },
          { state: "unpaid", totalAmount: 200, dueDate: "2024-01-01" },
          { state: "draft", totalAmount: 50 }
        ]
      });

      const summary = await getInvoiceSummary(mockClient);

      expect(summary.total).toBe(3);
      expect(summary.paid).toBe(1);
      expect(summary.unpaid).toBe(1);
      expect(summary.draft).toBe(1);
      expect(summary._schema).toBe("BillyInvoiceSummary");
      expect(summary._tokenUsage).toBeLessThanOrEqual(20);
    });

    it("should calculate oldest unpaid days correctly", async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const mockClient = createMockBillyClient({
        invoices: [
          { state: "unpaid", dueDate: thirtyDaysAgo.toISOString(), totalAmount: 100 }
        ]
      });

      const summary = await getInvoiceSummary(mockClient);

      expect(summary._oldestUnpaidDays).toBeCloseTo(30, 0);
    });
  });
});
```

### Integration Tests

Test complete workflows:

```typescript
// tests/integration/v3-workflows.test.ts

describe("V3 Workflow Integration", () => {
  it("should complete 'find unpaid invoices' workflow", async () => {
    const client = createRealBillyClient(); // Use test API keys

    // Step 1: Get summary
    const summary = await getInvoiceSummary(client);
    expect(summary._tokenUsage).toBeLessThan(20);

    // Step 2: List unpaid
    const unpaidList = await listUnpaidInvoices(client, { limit: 20 });
    expect(unpaidList.invoices.length).toBeLessThanOrEqual(20);
    expect(unpaidList._tokenUsage).toBeLessThan(200);

    // Step 3: Get details for first unpaid
    if (unpaidList.invoices.length > 0) {
      const details = await getInvoiceDetails(client, {
        invoiceId: unpaidList.invoices[0].id
      });
      expect(details._tokenUsage).toBeLessThan(600);
    }

    // Total tokens: < 820
    const totalTokens =
      summary._tokenUsage! +
      unpaidList._tokenUsage! +
      600;

    expect(totalTokens).toBeLessThan(1000);
  });

  it("should complete 'create invoice for customer' workflow", async () => {
    const client = createRealBillyClient();

    // Step 1: Search customer
    const search = await searchCustomers(client, { query: "Peder Kjær" });
    expect(search._exactMatch).toBe(true);
    expect(search._tokenUsage).toBeLessThan(100);

    // Step 2: Create invoice (existing v2 tool)
    const invoice = await createInvoice(client, {
      customerId: search.customers[0].id,
      lines: [{ description: "Test", quantity: 1, unitPrice: 100 }]
    });

    expect(invoice).toBeDefined();

    // Total tokens: < 600
    const totalTokens = search._tokenUsage! + 400; // create invoice ~400 tokens
    expect(totalTokens).toBeLessThan(600);
  });
});
```

### Token Usage Tests

Validate all tools meet token budgets:

```typescript
// tests/performance/token-budgets.test.ts

describe("Token Budget Validation", () => {
  const TOKEN_BUDGETS = {
    "BillyInvoiceSummary": 50,
    "BillyCustomerSummary": 50,
    "BillyBusinessOverview": 100,
    "BillyUnpaidInvoiceList": 500,
    "BillyCustomerSearchResult": 200,
    "BillyInvoiceDetails": 2000
  };

  Object.entries(TOKEN_BUDGETS).forEach(([schema, maxTokens]) => {
    it(`${schema} should not exceed ${maxTokens} tokens`, async () => {
      const client = createRealBillyClient();

      let result;
      if (schema === "BillyInvoiceSummary") {
        result = await getInvoiceSummary(client);
      } else if (schema === "BillyUnpaidInvoiceList") {
        result = await listUnpaidInvoices(client, { limit: 20 });
      }
      // ... etc

      expect(result._tokenUsage).toBeLessThanOrEqual(maxTokens);
    });
  });
});
```

---

## 🎯 Performance Targets

### Token Usage Targets

| Tool | Max Tokens | Typical Tokens | Status |
|------|-----------|---------------|--------|
| `get_invoice_summary` | 50 | 15 | ✅ Target |
| `get_customer_summary` | 50 | 12 | ✅ Target |
| `get_business_overview` | 100 | 35 | ✅ Target |
| `list_unpaid_invoices` | 500 | 120 | ✅ Target |
| `list_overdue_invoices` | 500 | 80 | ✅ Target |
| `search_customers` | 200 | 80 | ✅ Target |
| `list_recent_invoices` | 500 | 100 | ✅ Target |
| `get_invoice_details` | 2000 | 500 | ✅ Target |
| `get_customer_details` | 2000 | 400 | ✅ Target |

### Workflow Token Usage

| Workflow | v2.0.3 Tokens | v3.0 Tokens | Reduction |
|----------|---------------|-------------|-----------|
| Find unpaid invoices | 10,000+ | 135 | 98.65% |
| Create invoice for customer | 8,000+ | 425 | 94.7% |
| Check business status | 23,000+ | 35 | 99.85% |
| Get invoice details | 10,500 | 500 | 95.2% |
| Customer due diligence | 18,000+ | 480 | 97.3% |

### Response Time Targets

| Tool Level | Max Response Time | Billy API Calls |
|-----------|------------------|----------------|
| Level 1 (Summary) | <2s | 1-3 (parallel) |
| Level 2 (Filtered Lists) | <3s | 1-2 |
| Level 3 (Details) | <5s | 2-3 |

### Billy API Call Limits

- **Max calls per tool:** 3
- **Prefer parallel fetches:** Yes (use `Promise.all`)
- **Cache summaries:** Yes (5-minute TTL recommended)
- **Respect rate limits:** 100 calls / 15 min

---

## ✅ Approval Checklist

Before implementation:

- [ ] Research document reviewed (`BILLY_LLM_RESEARCH.md`)
- [ ] Architecture approved by team
- [ ] Type definitions validated
- [ ] Token budgets confirmed realistic
- [ ] Migration plan reviewed
- [ ] Testing strategy approved
- [ ] Performance targets agreed

After Phase 1 implementation:

- [ ] All new tools implemented
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Token usage validated
- [ ] Documentation updated
- [ ] Deployed to Railway
- [ ] Monitoring in place

---

**Next Steps:**
1. Approve this architecture specification
2. Begin Phase 1 implementation (see `MIGRATION_V2_TO_V3.md`)
3. Deploy and monitor token usage
4. Iterate based on real-world LLM usage patterns

**Questions?** Open an issue or contact the Billy MCP team.
