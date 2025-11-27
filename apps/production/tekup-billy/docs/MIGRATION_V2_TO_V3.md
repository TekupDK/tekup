# Billy MCP Migration Guide: v2.0.3 → v3.0

**Version:** Draft for Review
**Date:** November 26, 2025
**Status:** 📋 Migration Planning

---

## 📋 Table of Contents

1. [Migration Overview](#migration-overview)
2. [Phase 1: Add New Tools](#phase-1-add-new-tools-non-breaking)
3. [Phase 2: Deprecate Old Tools](#phase-2-deprecate-old-tools)
4. [Phase 3: Remove Old Tools](#phase-3-remove-old-tools-breaking-change)
5. [Phase 4: Optimize & Monitor](#phase-4-optimize--monitor)
6. [Tool Mapping Reference](#tool-mapping-reference)
7. [Testing Checklist](#testing-checklist)

---

## 🎯 Migration Overview

### Why Migrate?

**Problem with v2.0.3:**
- `list_invoices` returns 10,000+ tokens → LLM context meltdown
- `list_customers` returns 8,000+ tokens → same problem
- Tools called excessively → performance degradation
- "Lost in the Middle" effect → data gets forgotten

**Benefits of v3.0:**
- **94-98% token reduction** in typical workflows
- **Hierarchical information disclosure** prevents context overload
- **MCP Tool Output Schemas** compliance (June 2025 spec)
- **Guided multi-step reasoning** with `_nextActions` hints
- **Research-based design** (Lost in the Middle, Toolformer, Hierarchical RAG)

### Migration Strategy

**Non-Breaking Approach:**
1. Phase 1: Add new v3.0 tools alongside old tools
2. Phase 2: Deprecate old tools with warnings
3. Phase 3: Remove old tools (major version bump)
4. Phase 4: Optimize based on usage data

**Timeline:**
- Phase 1: 2-3 days (implementation + testing)
- Phase 2: 1 day (deprecation warnings)
- Grace Period: 30 days (users migrate)
- Phase 3: 1 day (removal + deploy)
- Phase 4: Ongoing (monitoring)

---

## 🚀 Phase 1: Add New Tools (Non-Breaking)

**Duration:** 2-3 days
**Goal:** Introduce all v3.0 tools without removing v2.0.3 tools

### Step 1.1: Create New Files

```bash
cd apps/production/tekup-billy/src/tools

# Create new tool files
touch summary.ts           # Level 1 tools
touch filtered-lists.ts    # Level 2 tools

# Create v3 type definitions
touch ../types/v3-tools.ts
```

### Step 1.2: Implement Type Definitions

**File:** `src/types/v3-tools.ts`

```typescript
/**
 * Billy MCP v3.0 Type Definitions
 *
 * Research-based types for hierarchical information disclosure:
 * - Level 1: Summary (10-50 tokens)
 * - Level 2: Filtered Lists (100-500 tokens)
 * - Level 3: Details (500-2000 tokens)
 */

/**
 * Base interface for all v3.0 tool outputs
 * Implements MCP Tool Output Schemas (June 2025 spec)
 */
export interface ToolOutputSchema {
  _schema: string;           // Schema identifier (e.g., "BillyInvoiceSummary")
  _nextActions?: string[];   // Suggested next tools to call
  _tokenUsage?: number;      // Actual token count
  _suggestions?: string[];   // Hints for user (e.g., spelling suggestions)
  _alerts?: string[];        // Important warnings

  // Cache metadata (from v2.0.3 smart fallback)
  _cached?: boolean;
  _cachedAt?: string;
  _cacheAge?: string;
  _warning?: string;
}

// Level 1: Summary Types
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
  products: { total: number; active: number };
  _recentActivity: string;
  _alerts: string[];
  _schema: "BillyBusinessOverview";
}

// Level 2: Compact Entity Types
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

// Level 3: Detailed Types (extend existing v2 types)
export interface InvoiceDetails extends ToolOutputSchema {
  invoice: FullInvoice;
  _relatedInvoices: CompactInvoice[];
  _schema: "BillyInvoiceDetails";
}

export interface CustomerDetails extends ToolOutputSchema {
  customer: FullCustomer;
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

// Re-export existing v2 types
export type { FullInvoice, FullCustomer } from './types.js';
```

### Step 1.3: Implement Summary Tools

**File:** `src/tools/summary.ts`

See full implementation in [BILLY_V3_ARCHITECTURE.md](./BILLY_V3_ARCHITECTURE.md#summary-tools-implementation).

**Key functions:**
- `getInvoiceSummary(client: BillyClient): Promise<InvoiceSummary>`
- `getCustomerSummary(client: BillyClient): Promise<CustomerSummary>`
- `getBusinessOverview(client: BillyClient): Promise<BusinessOverview>`

**Token budgets:**
- `getInvoiceSummary`: 15 tokens
- `getCustomerSummary`: 12 tokens
- `getBusinessOverview`: 35 tokens

### Step 1.4: Implement Filtered List Tools

**File:** `src/tools/filtered-lists.ts`

See full implementation in [BILLY_V3_ARCHITECTURE.md](./BILLY_V3_ARCHITECTURE.md#filtered-lists-implementation).

**Key functions:**
- `listUnpaidInvoices(client, args): Promise<UnpaidInvoiceList>`
- `listOverdueInvoices(client, args): Promise<UnpaidInvoiceList>`
- `listRecentInvoices(client, args): Promise<RecentInvoiceList>`
- `searchCustomers(client, args): Promise<CustomerSearchResult>`
- `listActiveCustomers(client, args): Promise<CustomerSearchResult>`

**Token budgets:**
- `listUnpaidInvoices`: 120 tokens (12 invoices × 10 tokens)
- `searchCustomers`: 80 tokens (10 customers × 8 tokens)

### Step 1.5: Enhance Existing Detail Tools

**Files:** `src/tools/invoices.ts`, `src/tools/customers.ts`

**Changes:**
1. Add `_schema` to existing tool outputs
2. Add `_nextActions` hints
3. Add `_tokenUsage` tracking
4. Keep existing functionality intact

**Example:**

```typescript
// src/tools/invoices.ts

export async function getInvoice(
  client: BillyClient,
  args: { invoiceId: string }
): Promise<InvoiceDetails> {
  const invoice = await client.getInvoiceById(args.invoiceId);

  // Fetch related invoices for same customer
  const relatedInvoices = await client.getInvoices({
    contactId: invoice.contactId,
    limit: 5,
    exclude: [args.invoiceId]
  });

  const compactRelated: CompactInvoice[] = relatedInvoices.map(inv => ({
    id: inv.id,
    invoiceNo: inv.invoiceNo,
    customerName: invoice.contact.name, // From main invoice
    amount: inv.totalAmount,
    currency: inv.currency,
    dueDate: inv.dueDate,
    daysOverdue: Math.max(0,
      Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / (1000*60*60*24))
    ),
    _customerId: inv.contactId
  }));

  return {
    invoice: invoice as FullInvoice,
    _relatedInvoices: compactRelated,
    _schema: "BillyInvoiceDetails",
    _nextActions: ["send_invoice", "update_invoice", "mark_invoice_paid"],
    _tokenUsage: 500 // Approximate
  };
}
```

### Step 1.6: Register New Tools

**File:** `src/http-server.ts`

```typescript
// Add to tool registry
const toolRegistry: Record<string, (client: BillyClient, args: unknown) => Promise<any>> = {
  // ... existing tools ...

  // NEW: Level 1 - Summary Tools
  get_invoice_summary: summaryTools.getInvoiceSummary,
  get_customer_summary: summaryTools.getCustomerSummary,
  get_business_overview: summaryTools.getBusinessOverview,

  // NEW: Level 2 - Filtered Lists
  list_unpaid_invoices: filteredListTools.listUnpaidInvoices,
  list_overdue_invoices: filteredListTools.listOverdueInvoices,
  list_recent_invoices: filteredListTools.listRecentInvoices,
  search_customers: filteredListTools.searchCustomers,
  list_active_customers: filteredListTools.listActiveCustomers,

  // ENHANCED: Level 3 - Details (now with v3 metadata)
  get_invoice_details: invoiceTools.getInvoice, // Renamed from get_invoice
  get_customer_details: customerTools.getCustomer, // Renamed from get_customer
};

// Add to audit actions
const toolAuditActions: Record<string, AuditAction> = {
  // ... existing ...

  // New tools
  get_invoice_summary: "read",
  get_customer_summary: "read",
  get_business_overview: "read",
  list_unpaid_invoices: "read",
  list_overdue_invoices: "read",
  list_recent_invoices: "read",
  search_customers: "read",
  list_active_customers: "read",
  get_invoice_details: "read",
  get_customer_details: "read",
};
```

**File:** `src/mcp-streamable-transport.ts`

Add tool handlers for MCP protocol (similar to http-server.ts).

### Step 1.7: Add Tests

**File:** `tests/unit/v3-summary-tools.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { BillyClient } from '../../src/billy-client';
import { getInvoiceSummary, getCustomerSummary } from '../../src/tools/summary';

describe('V3 Summary Tools', () => {
  describe('getInvoiceSummary', () => {
    it('should return summary within token budget', async () => {
      const client = createMockClient({
        invoices: generateMockInvoices(139)
      });

      const summary = await getInvoiceSummary(client);

      expect(summary._schema).toBe('BillyInvoiceSummary');
      expect(summary._tokenUsage).toBeLessThanOrEqual(50);
      expect(summary._nextActions).toContain('list_unpaid_invoices');
      expect(summary.total).toBe(139);
    });

    it('should calculate unpaid count correctly', async () => {
      const client = createMockClient({
        invoices: [
          { state: 'paid', totalAmount: 100 },
          { state: 'unpaid', totalAmount: 200, dueDate: '2024-01-01' },
          { state: 'sent', totalAmount: 150, dueDate: '2024-01-15' },
        ]
      });

      const summary = await getInvoiceSummary(client);

      expect(summary.unpaid).toBe(2); // unpaid + sent
      expect(summary.paid).toBe(1);
      expect(summary._totalUnpaidAmount).toBe(350);
    });
  });
});
```

**File:** `tests/integration/v3-workflows.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { createRealBillyClient } from '../helpers/billy-client';
import { getInvoiceSummary } from '../../src/tools/summary';
import { listUnpaidInvoices } from '../../src/tools/filtered-lists';
import { getInvoice } from '../../src/tools/invoices';

describe('V3 Workflow Integration', () => {
  it('should complete find-unpaid-invoices workflow efficiently', async () => {
    const client = createRealBillyClient();
    let totalTokens = 0;

    // Step 1: Get summary
    const summary = await getInvoiceSummary(client);
    totalTokens += summary._tokenUsage || 0;
    expect(summary._tokenUsage).toBeLessThan(20);

    // Step 2: List unpaid
    const unpaidList = await listUnpaidInvoices(client, { limit: 20 });
    totalTokens += unpaidList._tokenUsage || 0;
    expect(unpaidList._tokenUsage).toBeLessThan(200);

    // Step 3: Get details for first (if any)
    if (unpaidList.invoices.length > 0) {
      const details = await getInvoice(client, { invoiceId: unpaidList.invoices[0].id });
      totalTokens += details._tokenUsage || 0;
      expect(details._tokenUsage).toBeLessThan(600);
    }

    // Total should be < 1000 tokens (vs 10,000+ in v2)
    expect(totalTokens).toBeLessThan(1000);

    // Compare to v2 approach
    const v2Tokens = 10000; // Estimated for list_invoices
    const reduction = ((v2Tokens - totalTokens) / v2Tokens) * 100;
    expect(reduction).toBeGreaterThan(90); // At least 90% reduction
  });
});
```

### Step 1.8: Update Documentation

**File:** `README.md`

Add v3.0 tools to the tools list:

```markdown
## 🔧 Available Tools (v3.0)

### Summary Tools (NEW - Level 1)

- `get_invoice_summary` - Get high-level invoice statistics (15 tokens)
- `get_customer_summary` - Get customer statistics (12 tokens)
- `get_business_overview` - Complete business snapshot (35 tokens)

### Filtered Lists (NEW - Level 2)

- `list_unpaid_invoices` - Compact unpaid invoice list (120 tokens)
- `list_overdue_invoices` - Overdue invoices only (80 tokens)
- `list_recent_invoices` - Recent invoices (100 tokens)
- `search_customers` - Fuzzy customer search (80 tokens)
- `list_active_customers` - Customers with recent activity (150 tokens)

### Detailed Retrieval (ENHANCED - Level 3)

- `get_invoice_details` - Complete invoice with related data (500 tokens)
- `get_customer_details` - Complete customer with statistics (400 tokens)

### Write Operations (UNCHANGED)

- `create_invoice`, `send_invoice`, `update_invoice`, etc.

### Legacy Tools (DEPRECATED)

- ⚠️ `list_invoices` - Use `get_invoice_summary` + `list_unpaid_invoices` instead
- ⚠️ `list_customers` - Use `search_customers` instead
- ⚠️ `list_products` - Use filtered searches instead
```

### Step 1.9: Build and Test

```bash
# Build
npm run build

# Run unit tests
npm run test

# Run integration tests (requires Billy API credentials)
BILLY_API_KEY=xxx npm run test:integration

# Check token usage
npm run test:token-budgets
```

### Step 1.10: Deploy to Railway (Testing)

```bash
# Commit changes
git add .
git commit -m "feat: Add v3.0 hierarchical tools (Phase 1 - non-breaking)"

# Push to feature branch
git push

# Railway auto-deploys
# Test at: https://tekup-billy-production.up.railway.app
```

**Test endpoints:**

```bash
# Test new summary tool
curl -X POST https://tekup-billy-production.up.railway.app/api/v1/tools/get_invoice_summary \
  -H "X-API-Key: YOUR_MCP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'

# Test filtered list
curl -X POST https://tekup-billy-production.up.railway.app/api/v1/tools/list_unpaid_invoices \
  -H "X-API-Key: YOUR_MCP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'

# Old tools still work
curl -X POST https://tekup-billy-production.up.railway.app/api/v1/tools/list_invoices \
  -H "X-API-Key: YOUR_MCP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## ⚠️ Phase 2: Deprecate Old Tools

**Duration:** 1 day
**Goal:** Mark old tools as deprecated, encourage migration

### Step 2.1: Add Deprecation Warnings

**File:** `src/tools/invoices.ts`

```typescript
export async function listInvoices(
  client: BillyClient,
  args: any
): Promise<any> {
  // Log deprecation warning
  log.warn("listInvoices is DEPRECATED", {
    tool: "list_invoices",
    replacement: "get_invoice_summary + list_unpaid_invoices",
    reason: "10,000+ token output causes LLM context meltdown",
    migration: "See docs/MIGRATION_V2_TO_V3.md"
  });

  // Still execute, but warn
  const invoices = await client.getInvoices(args);

  return {
    invoices,
    _deprecated: true,
    _deprecationMessage: "⚠️ This tool is deprecated. Use get_invoice_summary + list_unpaid_invoices for better performance.",
    _migrationGuide: "https://github.com/TekupDK/tekup/blob/main/apps/production/tekup-billy/docs/MIGRATION_V2_TO_V3.md"
  };
}
```

### Step 2.2: Update Tool Descriptions

**File:** `src/http-server.ts` and `src/mcp-streamable-transport.ts`

```typescript
// In MCP tool definitions
{
  name: "list_invoices",
  description: `⚠️ DEPRECATED: Returns all invoices (10,000+ tokens, causes LLM meltdown).

  USE INSTEAD:
  1. get_invoice_summary() - Get overview (15 tokens)
  2. list_unpaid_invoices() - Get targeted list (120 tokens)

  This tool will be removed in v3.0.0.`,
  inputSchema: { /* ... */ }
}
```

### Step 2.3: Add Migration Announcement

**File:** `CHANGELOG.md`

```markdown
## [2.1.0] - 2025-11-27

### ⚠️ Deprecation Warnings

**Legacy tools deprecated:**
- `list_invoices` → Use `get_invoice_summary` + `list_unpaid_invoices`
- `list_customers` → Use `search_customers`
- `list_products` → Use filtered searches

**Reason:** These tools return 8,000-10,000+ tokens, causing:
- "Lost in the Middle" context issues
- LLM performance degradation
- Excessive tool call loops

**Migration:** See [MIGRATION_V2_TO_V3.md](./docs/MIGRATION_V2_TO_V3.md)

**Timeline:** 30-day grace period → removed in v3.0.0 (Dec 27, 2025)
```

### Step 2.4: Monitor Usage

Add telemetry to track which tools are still being used:

```typescript
// In tool execution
if (toolName === 'list_invoices' || toolName === 'list_customers') {
  // Log to analytics
  analytics.track('deprecated_tool_usage', {
    tool: toolName,
    user: req.headers['x-user-id'],
    timestamp: new Date().toISOString()
  });
}
```

---

## 🔴 Phase 3: Remove Old Tools (Breaking Change)

**Duration:** 1 day
**Prerequisites:**
- 30 days since deprecation
- <5% of requests using deprecated tools
- All known users migrated

### Step 3.1: Remove Deprecated Code

```bash
# Remove old implementations
git rm src/tools/legacy-list-operations.ts

# Update tool registry
# (Remove list_invoices, list_customers, list_products)
```

**File:** `src/tools/invoices.ts`

```typescript
// DELETE THIS FUNCTION:
// export async function listInvoices(...) { ... }

// Keep only v3-compatible functions:
export { getInvoice as getInvoiceDetails };
export { createInvoice };
export { sendInvoice };
// etc.
```

### Step 3.2: Update Version

**File:** `package.json`

```json
{
  "version": "3.0.0"
}
```

**File:** `CHANGELOG.md`

```markdown
## [3.0.0] - 2025-12-27

### 🚀 Major Release: Hierarchical Tool Architecture

**BREAKING CHANGES:**
- Removed `list_invoices` (use `get_invoice_summary` + `list_unpaid_invoices`)
- Removed `list_customers` (use `search_customers`)
- Removed `list_products` (use filtered searches)

**Benefits:**
- 94-98% token reduction
- No more LLM context meltdown
- Follows research best practices (Lost in the Middle, Toolformer, Hierarchical RAG)

**Migration:** See [MIGRATION_V2_TO_V3.md](./docs/MIGRATION_V2_TO_V3.md)
```

### Step 3.3: Deploy to Production

```bash
# Tag release
git tag v3.0.0
git push origin v3.0.0

# Deploy to Railway
git push origin main

# Monitor for errors
railway logs --follow
```

---

## 📊 Phase 4: Optimize & Monitor

**Duration:** Ongoing

### Metrics to Track

1. **Token Usage** (Target: <500 per workflow)
   ```typescript
   {
     workflow: "find_unpaid_invoices",
     steps: [
       { tool: "get_invoice_summary", tokens: 15 },
       { tool: "list_unpaid_invoices", tokens: 120 },
       { tool: "get_invoice_details", tokens: 500 }
     ],
     total: 635,
     reduction_vs_v2: 0.9365 // 93.65%
   }
   ```

2. **Tool Call Patterns**
   - Are LLMs following hierarchical flow?
   - Which `_nextActions` are most effective?
   - Are summary tools used before detail tools?

3. **Error Rates**
   - Billy API errors
   - Tool validation errors
   - Unexpected response formats

4. **Performance**
   - Response time per tool
   - Billy API rate limit hits
   - Cache hit rates

### Optimization Opportunities

1. **Add Caching to Summaries**
   ```typescript
   // Cache summary for 5 minutes
   const cacheKey = `invoice_summary:${orgId}`;
   const cached = await redis.get(cacheKey);
   if (cached) return JSON.parse(cached);

   const summary = await computeSummary();
   await redis.setex(cacheKey, 300, JSON.stringify(summary));
   return summary;
   ```

2. **Pre-fetch Related Data**
   ```typescript
   // In get_invoice_details, pre-fetch customer info
   const [invoice, customer, relatedInvoices] = await Promise.all([
     client.getInvoiceById(id),
     client.getContactById(invoice.contactId),
     client.getInvoices({ contactId: invoice.contactId, limit: 5 })
   ]);
   ```

3. **Enhance _nextActions with ML**
   - Track which next actions users actually take
   - Use this data to improve `_nextActions` suggestions
   - Personalize hints based on user patterns

---

## 🗺️ Tool Mapping Reference

| v2.0.3 Tool | v3.0 Replacement | Token Reduction |
|-------------|------------------|-----------------|
| `list_invoices` | `get_invoice_summary` + `list_unpaid_invoices` | 10,000 → 135 (98.65%) |
| `list_customers` | `search_customers` | 8,000 → 80 (99%) |
| `list_products` | (add filtered search) | 5,000 → TBD |
| `get_invoice` | `get_invoice_details` (enhanced) | 500 → 500 (same) |
| `get_customer` | `get_customer_details` (enhanced) | 300 → 400 (minor increase for stats) |
| `create_invoice` | `create_invoice` (unchanged) | - |
| `send_invoice` | `send_invoice` (unchanged) | - |

---

## ✅ Testing Checklist

### Unit Tests

- [ ] `getInvoiceSummary` returns correct counts
- [ ] `getInvoiceSummary` token usage < 50
- [ ] `getCustomerSummary` returns correct stats
- [ ] `getBusinessOverview` combines summaries correctly
- [ ] `listUnpaidInvoices` filters correctly
- [ ] `listUnpaidInvoices` sorts by due date
- [ ] `searchCustomers` fuzzy matching works
- [ ] `searchCustomers` returns exact match flag
- [ ] All tools return valid `_schema` field
- [ ] All tools return `_nextActions` hints

### Integration Tests

- [ ] "Find unpaid invoices" workflow < 1000 tokens
- [ ] "Create invoice for customer" workflow < 600 tokens
- [ ] "Check business status" workflow < 100 tokens
- [ ] Old tools still work (Phase 1-2)
- [ ] Deprecation warnings appear (Phase 2)
- [ ] Old tools removed (Phase 3)

### Performance Tests

- [ ] Summary tools respond in <2s
- [ ] Filtered lists respond in <3s
- [ ] Detail tools respond in <5s
- [ ] No Billy API rate limiting triggered
- [ ] Cache hit rate >50% for summaries

### LLM Testing

- [ ] Claude follows `_nextActions` hints
- [ ] GPT-4 doesn't spam tool calls
- [ ] Fuzzy search suggestions help with typos
- [ ] No "Lost in the Middle" behavior observed
- [ ] Multi-step workflows complete successfully

---

## 🚨 Rollback Plan

If major issues occur after deployment:

### Rollback to v2.0.3

```bash
# Revert to previous commit
git revert HEAD

# Or checkout previous tag
git checkout v2.0.3

# Redeploy
git push origin main --force
```

### Hotfix Strategy

If specific tool is broken:

```bash
# Disable broken tool in tool registry
const toolRegistry = {
  // list_unpaid_invoices: filteredListTools.listUnpaidInvoices, // DISABLED
  // Temporarily re-enable old tool
  list_invoices: invoiceTools.listInvoices
};
```

---

## 📞 Support

**Issues?**
- GitHub Issues: https://github.com/TekupDK/tekup/issues
- Documentation: `docs/BILLY_LLM_RESEARCH.md`, `docs/BILLY_V3_ARCHITECTURE.md`

**Questions?**
- See FAQ in `docs/FAQ_V3.md` (TODO)
- Contact: support@tekup.dk

---

**Last Updated:** November 26, 2025
**Version:** 1.0
**Status:** Ready for Phase 1 Implementation
