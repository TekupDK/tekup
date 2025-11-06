# InvoicesTab — Implementation Plan

**Dato:** 2025-11-05
**Scope:** Critical fixes, performance improvements, new features
**Estimeret tid:** 4-6 dage (spredt over 2 uger)

---

## 📋 OVERVIEW

Denne plan dækker implementering af kritiske fixes og forbedringer til InvoicesTab baseret på [TECHNICAL_ANALYSIS.md](./TECHNICAL_ANALYSIS.md).

### Prioriteter
1. 🔴 **Critical Fixes** — Blokkerer for production
2. 🟠 **Performance** — Påvirker UX negativt
3. 🟡 **Quality** — Teknisk gæld
4. 🟢 **Features** — Nice-to-have, vælges baseret på feedback

---

## PHASE 1: CRITICAL FIXES (Dag 1-2)

### Task 1.1: Fix Memory Leak i CSV Export
**Priority:** 🔴 CRITICAL
**Estimat:** 15 min
**Files:** `client/src/components/inbox/InvoicesTab.tsx`

**Steps:**
1. Lokalisér `exportToCSV` funktionen (linje ~252-261)
2. Tilføj `URL.revokeObjectURL(url)` efter `link.click()`
3. Test: Export 10+ CSVer, check memory usage i DevTools

**Code change:**
```diff
  link.click();
  document.body.removeChild(link);
+ URL.revokeObjectURL(url);
```

**Acceptance:**
- [ ] Memory profiler viser ingen blobs efter export
- [ ] Fungerer i Chrome, Firefox, Safari

---

### Task 1.2: Add TypeScript Interfaces
**Priority:** 🔴 CRITICAL
**Estimat:** 1-2 timer
**Files:**
- `shared/types.ts` (ny interface)
- `client/src/components/inbox/InvoicesTab.tsx` (brug interface)

**Steps:**
1. Opret `BillyInvoice` interface i `shared/types.ts`
2. Basér på Billy API response format (check [Billy MCP docs](https://github.com/TekupDK/tekup-billy))
3. Erstat alle `any` typer i InvoicesTab
4. Fix TypeScript errors (hvis nogen)

**Code to add:**
```typescript
// shared/types.ts
export interface BillyInvoice {
  id: string;
  invoiceNo: string | null;
  contactId: string;
  contactName?: string;
  state: 'draft' | 'approved' | 'sent' | 'paid' | 'overdue' | 'voided';
  entryDate: string; // ISO 8601
  paymentTermsDays: number;
  dueDate?: string;
  lines?: BillyInvoiceLine[];
  totalAmount?: number;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BillyInvoiceLine {
  id: string;
  productId?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  discountPercent?: number;
}
```

**Changes in InvoicesTab.tsx:**
```diff
- const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
+ const [selectedInvoice, setSelectedInvoice] = useState<BillyInvoice | null>(null);

- filteredInvoices.map((invoice: any) => {
+ filteredInvoices.map((invoice: BillyInvoice) => {

- const handleAnalyzeInvoice = async (invoice: any) => {
+ const handleAnalyzeInvoice = async (invoice: BillyInvoice) => {
```

**Acceptance:**
- [ ] Ingen `any` typer tilbage i invoice-relateret kode
- [ ] IntelliSense virker for invoice properties
- [ ] `pnpm typecheck` passerer uden errors

---

### Task 1.3: Fix Race Condition i AI Analysis
**Priority:** 🔴 HIGH
**Estimat:** 1 timer
**Files:** `client/src/components/inbox/InvoicesTab.tsx`

**Steps:**
1. Add `currentAnalysisId` state
2. Track analysis ID ved start af `handleAnalyzeInvoice`
3. Check ID før state updates i try/catch/finally blocks

**Code change:**
```typescript
const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);

const handleAnalyzeInvoice = async (invoice: BillyInvoice) => {
  const analysisId = invoice.id;

  setSelectedInvoice(invoice);
  setCurrentAnalysisId(analysisId);
  setAnalyzingInvoice(true);
  setAiAnalysis("");
  setFeedbackGiven(null);
  setFeedbackComment("");
  setShowCommentInput(false);

  try {
    const invoiceSummary = `...`; // existing code

    const result = await analyzeInvoiceMutation.mutateAsync({
      invoiceData: invoiceSummary,
    });

    // Only update if still analyzing same invoice
    if (analysisId === currentAnalysisId) {
      setAiAnalysis(result.analysis || "Analysis complete. No issues detected.");
    }
  } catch (error) {
    console.error("Error analyzing invoice:", error);
    if (analysisId === currentAnalysisId) {
      setAiAnalysis("Error analyzing invoice. Please try again.");
    }
  } finally {
    if (analysisId === currentAnalysisId) {
      setAnalyzingInvoice(false);
    }
  }
};
```

**Test:**
1. Click "Analyze" on invoice A
2. Immediately click "Analyze" on invoice B (before A finishes)
3. Verify dialog shows invoice B with B's analysis (not A's)

**Acceptance:**
- [ ] Dialog viser korrekt analysis for valgt invoice
- [ ] Ingen state corruption ved hurtige clicks

---

### Task 1.4: Add Error Handling til CSV Export
**Priority:** 🟠 MEDIUM
**Estimat:** 30 min
**Files:** `client/src/components/inbox/InvoicesTab.tsx`

**Steps:**
1. Wrap CSV export buttons i try-catch
2. Show toast notification on success/error
3. Test error scenarios (invalid data, browser restrictions)

**Code change:**
```diff
+ import { toast } from "sonner"; // or your toast library

  <Button
    onClick={async (e) => {
      e.stopPropagation();
+     try {
        exportToCSV(invoice, aiAnalysis || "");
+       toast.success("CSV exported successfully");
+     } catch (error) {
+       console.error("CSV export failed:", error);
+       toast.error("Failed to export CSV. Please try again.");
+     }
    }}
  >
```

**Acceptance:**
- [ ] Toast vises ved successful export
- [ ] Error toast vises ved failure
- [ ] Export fejler gracefully (no crash)

---

### Task 1.5: Add Debouncing til Search Input
**Priority:** 🟠 MEDIUM
**Estimat:** 1 timer
**Files:**
- `client/src/hooks/useDebouncedValue.ts` (ny hook, hvis ikke eksisterer)
- `client/src/components/inbox/InvoicesTab.tsx`

**Steps:**
1. Check om `useDebouncedValue` hook eksisterer
   - Hvis nej: Opret den
2. Split `searchQuery` i `searchInput` + `debouncedSearch`
3. Brug `debouncedSearch` i `filteredInvoices` useMemo
4. Test: Type hurtigt, verify filtering kun sker efter pause

**Code for hook:**
```typescript
// client/src/hooks/useDebouncedValue.ts
import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

**Changes in InvoicesTab.tsx:**
```diff
+ import { useDebouncedValue } from '@/hooks/useDebouncedValue';

- const [searchQuery, setSearchQuery] = useState("");
+ const [searchInput, setSearchInput] = useState("");
+ const debouncedSearch = useDebouncedValue(searchInput, 300);

  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];

    return invoices.filter((invoice: BillyInvoice) => {
      const matchesSearch =
-       searchQuery === "" ||
-       invoice.invoiceNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
+       debouncedSearch === "" ||
+       invoice.invoiceNo?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        // ...
    });
- }, [invoices, searchQuery, statusFilter]);
+ }, [invoices, debouncedSearch, statusFilter]);

  <Input
-   value={searchQuery}
-   onChange={e => setSearchQuery(e.target.value)}
+   value={searchInput}
+   onChange={e => setSearchInput(e.target.value)}
  />

  {(searchInput || statusFilter !== "all") && ( // Clear button
```

**Performance test:**
- Before: Type "test" (4 chars) = 4 filter operations
- After: Type "test" (4 chars) = 1 filter operation (after 300ms pause)

**Acceptance:**
- [ ] Filtering kun sker efter 300ms pause i typing
- [ ] Clear button fjerner searchInput immediately
- [ ] Performance forbedring målbar (DevTools Profiler)

---

## PHASE 2: CODE QUALITY (Dag 3-4)

### Task 2.1: Refactor til useReducer
**Priority:** 🟡 MEDIUM
**Estimat:** 2-3 timer
**Files:** `client/src/components/inbox/InvoicesTab.tsx`

**Steps:**
1. Opret `AnalysisState` type
2. Opret `analysisReducer` function
3. Erstat 6 separate states med `useReducer`
4. Update alle `set*` calls til `dispatch` calls

**Code:**
```typescript
// Types
type AnalysisState =
  | { status: 'idle' }
  | { status: 'analyzing'; invoice: BillyInvoice }
  | {
      status: 'complete';
      invoice: BillyInvoice;
      analysis: string;
      feedback?: {
        rating: 'up' | 'down';
        comment: string;
        showCommentInput: boolean;
      };
    }
  | { status: 'error'; invoice: BillyInvoice; error: string };

type AnalysisAction =
  | { type: 'START_ANALYSIS'; invoice: BillyInvoice }
  | { type: 'ANALYSIS_SUCCESS'; analysis: string }
  | { type: 'ANALYSIS_ERROR'; error: string }
  | { type: 'SET_FEEDBACK'; rating: 'up' | 'down' }
  | { type: 'SET_COMMENT'; comment: string }
  | { type: 'TOGGLE_COMMENT_INPUT'; show: boolean }
  | { type: 'RESET' };

// Reducer
function analysisReducer(state: AnalysisState, action: AnalysisAction): AnalysisState {
  switch (action.type) {
    case 'START_ANALYSIS':
      return { status: 'analyzing', invoice: action.invoice };

    case 'ANALYSIS_SUCCESS':
      if (state.status !== 'analyzing') return state;
      return {
        status: 'complete',
        invoice: state.invoice,
        analysis: action.analysis,
      };

    case 'ANALYSIS_ERROR':
      if (state.status !== 'analyzing') return state;
      return {
        status: 'error',
        invoice: state.invoice,
        error: action.error,
      };

    case 'SET_FEEDBACK':
      if (state.status !== 'complete') return state;
      return {
        ...state,
        feedback: {
          rating: action.rating,
          comment: state.feedback?.comment || '',
          showCommentInput: action.rating === 'down',
        },
      };

    case 'SET_COMMENT':
      if (state.status !== 'complete') return state;
      return {
        ...state,
        feedback: state.feedback
          ? { ...state.feedback, comment: action.comment }
          : undefined,
      };

    case 'TOGGLE_COMMENT_INPUT':
      if (state.status !== 'complete') return state;
      return {
        ...state,
        feedback: state.feedback
          ? { ...state.feedback, showCommentInput: action.show }
          : undefined,
      };

    case 'RESET':
      return { status: 'idle' };

    default:
      return state;
  }
}

// In component
const [analysisState, dispatch] = useReducer(analysisReducer, { status: 'idle' });

// Usage
const handleAnalyzeInvoice = async (invoice: BillyInvoice) => {
  dispatch({ type: 'START_ANALYSIS', invoice });

  try {
    const result = await analyzeInvoiceMutation.mutateAsync({ ... });
    dispatch({ type: 'ANALYSIS_SUCCESS', analysis: result.analysis });
  } catch (error) {
    dispatch({ type: 'ANALYSIS_ERROR', error: String(error) });
  }
};
```

**Benefits:**
- Single source of truth for analysis state
- Impossible states eliminated (e.g., `analyzing=true` but `selectedInvoice=null`)
- Easier to test reducer in isolation

**Acceptance:**
- [ ] Alle analysis-relaterede states erstattet med reducer
- [ ] Functionality er uændret
- [ ] Unit tests for reducer written

---

### Task 2.2: Add Accessibility (Keyboard Nav + ARIA)
**Priority:** 🟠 MEDIUM
**Estimat:** 2 timer
**Files:** `client/src/components/inbox/InvoicesTab.tsx`

**Steps:**
1. Add keyboard navigation til invoice cards
2. Add ARIA labels til icon buttons
3. Add focus indicators (CSS)
4. Test med keyboard only (no mouse)

**Changes:**

**Invoice cards:**
```diff
  <Card
    key={invoice.id}
-   className="group p-2.5 hover:bg-accent/50 transition-all duration-200 hover:scale-[1.01] hover:shadow-md cursor-pointer"
+   className="group p-2.5 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-200 hover:scale-[1.01] hover:shadow-md cursor-pointer"
+   tabIndex={0}
+   role="article"
+   aria-label={`Invoice ${invoice.invoiceNo || invoice.id.slice(0, 8)} for ${invoice.contactId}`}
+   onKeyDown={(e) => {
+     if (e.key === 'Enter' || e.key === ' ') {
+       e.preventDefault();
+       handleAnalyzeInvoice(invoice);
+     }
+   }}
+   onClick={() => handleAnalyzeInvoice(invoice)}
  >
```

**Icon buttons:**
```diff
  <Button
    size="icon"
    variant="ghost"
    className="h-7 w-7"
    title="Open in Billy.dk"
+   aria-label="Open invoice in Billy.dk"
    onClick={...}
  >
-   <ExternalLink className="h-3 w-3" />
+   <ExternalLink className="h-3 w-3" aria-hidden="true" />
  </Button>
```

**Search input:**
```diff
  <Input
+   id="invoice-search"
+   aria-label="Search invoices by number or customer"
    placeholder="Søg fakturaer…"
    value={searchInput}
    onChange={e => setSearchInput(e.target.value)}
  />
```

**Test checklist:**
- [ ] Tab navigerer gennem invoice cards
- [ ] Enter/Space på card åbner analyze dialog
- [ ] Focus indicator er synlig
- [ ] Screen reader announces card content korrekt
- [ ] Lighthouse Accessibility score > 90

---

### Task 2.3: Extract Magic Numbers til Constants
**Priority:** 🟢 LOW
**Estimat:** 30 min
**Files:** `client/src/components/inbox/InvoicesTab.tsx`

**Steps:**
1. Identificér alle magic numbers (polling intervals, animation timings, etc.)
2. Opret `INVOICE_CONFIG` constant object
3. Erstat inline numbers med references

**Code:**
```typescript
// At top of file
const INVOICE_CONFIG = {
  POLLING: {
    BASE_INTERVAL_MS: 60_000,       // 1 minute
    MIN_INTERVAL_MS: 30_000,        // 30 seconds
    MAX_INTERVAL_MS: 180_000,       // 3 minutes
    INACTIVITY_THRESHOLD_MS: 60_000, // 1 minute
  },
  SEARCH: {
    DEBOUNCE_MS: 300,
  },
  UI: {
    SKELETON_ROWS: 3,
    MAX_DIALOG_HEIGHT: '85vh',
    CARD_PADDING: 'p-2.5',
  },
} as const;

// Usage
useAdaptivePolling({
  baseInterval: INVOICE_CONFIG.POLLING.BASE_INTERVAL_MS,
  minInterval: INVOICE_CONFIG.POLLING.MIN_INTERVAL_MS,
  // ...
});

const debouncedSearch = useDebouncedValue(searchInput, INVOICE_CONFIG.SEARCH.DEBOUNCE_MS);
```

**Acceptance:**
- [ ] Alle magic numbers extracted
- [ ] Config object har clear naming
- [ ] Ingen functional changes

---

## PHASE 3: DATABASE FIX (Dag 5 - Koordinér med Backend)

### Task 3.1: Create Database Migration
**Priority:** 🔴 BLOCKER (for full functionality)
**Estimat:** 2-3 timer
**Files:**
- `drizzle/schema.ts`
- New migration file
**Owner:** Backend/DevOps team (coordinate)

**Steps:**
1. Add missing columns til `customerInvoicesInFridayAi`
2. Rename `invoiceNumber` → `invoiceNo` (hvis nødvendigt)
3. Run `drizzle-kit generate`
4. Apply migration til dev database
5. Test migration rollback

**Schema changes:**
```diff
export const customerInvoicesInFridayAi = fridayAi.table("customer_invoices", {
  id: serial().primaryKey().notNull(),
  userId: integer().notNull(),
  customerId: integer(),
  billyInvoiceId: varchar({ length: 100 }),
- invoiceNumber: varchar({ length: 50 }),
+ invoiceNo: varchar({ length: 50 }), // Renamed to match Billy API
  amount: numeric({ precision: 10, scale: 2 }),
+ paidAmount: numeric({ precision: 10, scale: 2 }), // NEW
  currency: varchar({ length: 3 }).default("DKK"),
  status: customerInvoiceStatusInFridayAi().default("draft"),
+ entryDate: timestamp({ mode: "string" }), // NEW
  dueDate: timestamp({ mode: "string" }),
  paidAt: timestamp({ mode: "string" }),
+ paidDate: timestamp({ mode: "string" }), // NEW (alias for paidAt?)
+ paymentTermsDays: integer(), // NEW
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});
```

**Migration command:**
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit push
```

**Acceptance:**
- [ ] Migration runs successfully
- [ ] All new columns exist in database
- [ ] Existing data preserved
- [ ] Rollback tested and works

---

### Task 3.2: Update Backend Invoice Cache Logic
**Priority:** 🔴 BLOCKER
**Estimat:** 1-2 timer
**Files:**
- `server/invoice-cache.ts`
- `server/billy.ts`

**Steps:**
1. Update `cacheInvoicesToDatabase` to save new fields
2. Update `getInvoices` query to return new fields
3. Test syncing from Billy API

**Code changes:**
```diff
// server/invoice-cache.ts
async function cacheInvoicesToDatabase(userId: number, billyInvoices: BillyInvoice[]) {
  for (const invoice of billyInvoices) {
    await db.insert(customerInvoicesInFridayAi).values({
      userId,
      billyInvoiceId: invoice.id,
-     invoiceNumber: invoice.invoiceNo,
+     invoiceNo: invoice.invoiceNo, // Match new column name
      amount: invoice.totalAmount,
+     paidAmount: invoice.paidAmount || 0,
      currency: invoice.currency || 'DKK',
      status: mapBillyStatusToEnum(invoice.state),
+     entryDate: invoice.entryDate,
      dueDate: invoice.dueDate,
+     paidDate: invoice.paidDate,
+     paymentTermsDays: invoice.paymentTermsDays || 0,
      // ...
    }).onConflictDoUpdate({ ... });
  }
}
```

**Test:**
1. Trigger Billy sync
2. Check database has all fields populated
3. Check InvoicesTab UI shows invoice numbers correctly

**Acceptance:**
- [ ] New fields saved correctly
- [ ] `updateCustomerBalance` no longer returns `NaN`
- [ ] UI displays invoice numbers

---

### Task 3.3: Backfill Historical Data
**Priority:** 🟡 MEDIUM
**Estimat:** 1 time
**Files:** New script `scripts/backfill-invoices.ts`

**Steps:**
1. Opret backfill script
2. Fetch all Billy invoices for all users
3. Update existing database records with missing fields
4. Run script i production (schedule maintenance window)

**Script:**
```typescript
// scripts/backfill-invoices.ts
import { db } from '../server/db';
import { getBillyClient } from '../server/billy';
import { customerInvoicesInFridayAi } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

async function backfillInvoices() {
  const users = await db.query.usersInFridayAi.findMany();

  for (const user of users) {
    console.log(`Backfilling invoices for user ${user.id}...`);

    const billyClient = await getBillyClient(user.id);
    if (!billyClient) continue;

    const billyInvoices = await billyClient.getInvoices();

    for (const invoice of billyInvoices) {
      await db
        .update(customerInvoicesInFridayAi)
        .set({
          invoiceNo: invoice.invoiceNo,
          entryDate: invoice.entryDate,
          paymentTermsDays: invoice.paymentTermsDays,
          paidAmount: invoice.paidAmount,
        })
        .where(eq(customerInvoicesInFridayAi.billyInvoiceId, invoice.id));
    }

    console.log(`✓ User ${user.id} done`);
  }

  console.log('Backfill complete!');
}

backfillInvoices().catch(console.error);
```

**Run:**
```bash
pnpm tsx scripts/backfill-invoices.ts
```

**Acceptance:**
- [ ] All invoices have `invoiceNo`, `entryDate`, `paymentTermsDays`
- [ ] No data loss during backfill
- [ ] Script is idempotent (can be re-run safely)

---

## PHASE 4: NEW FEATURES (Dag 6+ - Vælg baseret på prioritet)

### Feature A: Bulk Actions
**Priority:** 🎯 HIGH ROI
**Estimat:** 4-6 timer
**See:** [TECHNICAL_ANALYSIS.md — Feature 1](./TECHNICAL_ANALYSIS.md#feature-1-bulk-actions)

**Tasks:**
1. Add checkbox til hver invoice card
2. Add `selectedInvoices` state (Set<string>)
3. Add bulk action bar (fixed bottom)
4. Implement bulk export
5. Implement bulk analyze (optional)

---

### Feature B: Smart Filters & Saved Views
**Priority:** 🎯 MEDIUM ROI
**Estimat:** 6-8 timer
**See:** [TECHNICAL_ANALYSIS.md — Feature 3](./TECHNICAL_ANALYSIS.md#feature-3-smart-filters--saved-views)

**Tasks:**
1. Design filter data structure
2. Add "Save Filter" UI
3. Add filter selector dropdown
4. Store saved filters (localStorage or database)
5. Apply filters to invoice list

---

### Feature C: AI Suggestions (Proactive)
**Priority:** 🔮 INNOVATIVE
**Estimat:** 12-16 timer (backend heavy)
**See:** [TECHNICAL_ANALYSIS.md — Feature 4](./TECHNICAL_ANALYSIS.md#feature-4-ai-suggestions-proactive)

**Tasks:**
1. Design AI suggestion schema
2. Create background job to analyze all invoices
3. Store suggestions in database
4. Display suggestions as badges in UI
5. Add "Dismiss" and "Act on Suggestion" buttons

---

## 📊 TESTING PLAN

### Unit Tests
- [ ] CSV export memory leak test
- [ ] Race condition test for AI analysis
- [ ] Filter/search logic tests
- [ ] Reducer state transitions

### Integration Tests
- [ ] Billy API sync test
- [ ] Database cache test
- [ ] AI analysis end-to-end

### E2E Tests (Playwright)
```typescript
// tests/e2e/invoices.spec.ts
test('search and filter invoices', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Invoices');
  await page.fill('[aria-label="Search invoices"]', '12345');
  await expect(page.locator('[data-testid="invoice-list"]')).toContainText('12345');
});

test('analyze invoice with AI', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Invoices');
  await page.click('button:has-text("Analyser")').first();
  await expect(page.locator('text=AI Invoice Analysis')).toBeVisible();
});

test('export invoice to CSV', async ({ page }) => {
  const downloadPromise = page.waitForEvent('download');
  await page.goto('/');
  await page.click('text=Invoices');
  await page.hover('[data-testid="invoice-card"]').first();
  await page.click('[aria-label="Download CSV"]').first();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/invoice-.*\.csv/);
});
```

### Performance Tests
- [ ] Search input debouncing (< 100ms response)
- [ ] Invoice list render (< 200ms for 100 items)
- [ ] Memory leak test (CSV export 20 times, check memory)

---

## 🚀 DEPLOYMENT PLAN

### Pre-deployment Checklist
- [ ] All critical fixes merged
- [ ] Tests passing (unit + integration + e2e)
- [ ] Database migration tested in staging
- [ ] Performance benchmarks recorded
- [ ] Accessibility audit passed

### Deployment Steps
1. **Database migration**
   ```bash
   # Run in production (coordinate with DevOps)
   pnpm drizzle-kit push --prod
   ```

2. **Backfill script**
   ```bash
   # Run backfill (maintenance window)
   pnpm tsx scripts/backfill-invoices.ts
   ```

3. **Deploy frontend + backend**
   ```bash
   git checkout main
   git pull
   pnpm build
   # Deploy via CI/CD pipeline
   ```

4. **Verify production**
   - [ ] InvoicesTab loads without errors
   - [ ] Search works
   - [ ] AI analysis works
   - [ ] CSV export works
   - [ ] No console errors
   - [ ] Performance metrics match staging

### Rollback Plan
If issues discovered:
1. Revert frontend deployment
2. Rollback database migration (if necessary)
3. Notify users of temporary issues
4. Debug in staging environment

---

## 📈 SUCCESS CRITERIA

### Technical
- [ ] 0 memory leaks
- [ ] 0 TypeScript `any` in invoice code
- [ ] Lighthouse Accessibility > 90
- [ ] Test coverage > 80%
- [ ] No console errors in production

### Performance
- [ ] Search response < 100ms
- [ ] Render 100 invoices < 200ms
- [ ] AI analysis < 5 seconds (p95)

### User Experience
- [ ] AI analysis success rate > 95%
- [ ] CSV export success rate > 99%
- [ ] User satisfaction > 4.0/5.0 (via feedback)

---

## 🔗 RELATED DOCS

- [TECHNICAL_ANALYSIS.md](./TECHNICAL_ANALYSIS.md) — Detailed bug analysis
- [PLAN.md](./PLAN.md) — UX improvements roadmap
- [STATUS.md](./STATUS.md) — Current status tracking
- [CHANGELOG.md](./CHANGELOG.md) — Change history

---

**Last Updated:** 2025-11-05
**Owner:** Frontend Team
**Reviewers:** Backend Team (for Phase 3), QA Team (for testing)
