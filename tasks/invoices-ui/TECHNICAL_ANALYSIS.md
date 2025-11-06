# InvoicesTab — Teknisk Analyse & Fejlrapport

**Dato:** 2025-11-05
**Komponent:** `client/src/components/inbox/InvoicesTab.tsx`
**Analyseomfang:** Kritiske fejl, performance, type safety, nye features

---

## 🔴 KRITISKE FEJL (High Priority)

### 1. Memory Leak i CSV Export

**Lokation:** `InvoicesTab.tsx:252-261`

**Problem:**
```typescript
const url = URL.createObjectURL(blob);
link.setAttribute("href", url);
// ...
link.click();
document.body.removeChild(link);
// ❌ MANGLER: URL.revokeObjectURL(url)
```

**Konsekvens:**
- Hver CSV export lækker memory
- Browser holder blob URL i memory indtil page reload
- Ved mange exports kan dette påvirke performance

**Fix:**
```typescript
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url); // Add this line
```

**Prioritet:** 🔴 CRITICAL — Fix omgående

---

### 2. Type Safety — Manglende TypeScript Interfaces

**Lokation:** Multiple locations (linje 98, 112, 264, 431)

**Problem:**
```typescript
const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
// ❌ Brug af 'any' fjerner alle type garantier

filteredInvoices.map((invoice: any) => {
  // ❌ Ingen autocomplete, ingen compile-time checks
```

**Konsekvens:**
- Ingen IntelliSense/autocomplete
- Runtime errors ikke fanget ved compile time
- Refactoring er farlig og fejltilbøjelig
- Svært at onboarde nye udviklere

**Fix:**
Opret proper TypeScript interface baseret på Billy API schema:

```typescript
// shared/types.ts eller InvoicesTab.tsx
interface BillyInvoice {
  id: string;
  invoiceNo: string | null;
  contactId: string;
  state: 'draft' | 'approved' | 'sent' | 'paid' | 'overdue' | 'voided';
  entryDate: string; // ISO 8601
  paymentTermsDays: number;
  lines?: BillyInvoiceLine[];
  totalAmount?: number;
  currency?: string;
}

interface BillyInvoiceLine {
  id: string;
  productId?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}
```

**Prioritet:** 🔴 CRITICAL — Blokkerer sikker udvikling

---

### 3. Race Condition i AI Analysis

**Lokation:** `InvoicesTab.tsx:264-303`

**Problem:**
```typescript
const handleAnalyzeInvoice = async (invoice: any) => {
  setSelectedInvoice(invoice);
  setAnalyzingInvoice(true);
  setAiAnalysis("");

  try {
    const result = await analyzeInvoiceMutation.mutateAsync({
      invoiceData: invoiceSummary,
    });
    setAiAnalysis(result.analysis || "...");
  } catch (error) {
    // ...
  }
}
```

**Konsekvens:**
- Hvis bruger klikker "Analyser" på faktura A, derefter hurtigt på faktura B:
  - Dialog viser faktura B
  - Men AI resultat fra faktura A overskriver analyse for B
- Forvirrende UX og forkerte data vises

**Fix:**
Brug AbortController eller id-baseret tracking:

```typescript
const handleAnalyzeInvoice = async (invoice: BillyInvoice) => {
  const analysisId = invoice.id;
  setSelectedInvoice(invoice);
  setCurrentAnalysisId(analysisId);
  setAnalyzingInvoice(true);
  setAiAnalysis("");

  try {
    const result = await analyzeInvoiceMutation.mutateAsync({
      invoiceData: invoiceSummary,
    });

    // Only update if still analyzing the same invoice
    if (analysisId === currentAnalysisId) {
      setAiAnalysis(result.analysis || "...");
    }
  } catch (error) {
    if (analysisId === currentAnalysisId) {
      setAiAnalysis("Error analyzing invoice...");
    }
  } finally {
    if (analysisId === currentAnalysisId) {
      setAnalyzingInvoice(false);
    }
  }
}
```

**Prioritet:** 🔴 HIGH — Påvirker data integritet

---

### 4. Manglende Error Handling i CSV Export

**Lokation:** `InvoicesTab.tsx:487-492`

**Problem:**
```typescript
<Button
  onClick={e => {
    e.stopPropagation();
    exportToCSV(invoice, ""); // ❌ Ingen try-catch, ingen error handling
  }}
>
```

**Konsekvens:**
- Hvis `exportToCSV` fejler (invalid data, browser security policy), crasher komponenten
- Bruger får ingen feedback

**Fix:**
```typescript
<Button
  onClick={async (e) => {
    e.stopPropagation();
    try {
      exportToCSV(invoice, aiAnalysis || "");
      toast.success("CSV exported successfully");
    } catch (error) {
      console.error("CSV export failed:", error);
      toast.error("Failed to export CSV. Please try again.");
    }
  }}
>
```

**Prioritet:** 🟠 MEDIUM — God UX praksis

---

## ⚠️ PERFORMANCE PROBLEMER

### 5. Ingen Debouncing på Search Input

**Lokation:** `InvoicesTab.tsx:379-384`

**Problem:**
```typescript
<Input
  placeholder="Søg fakturaer…"
  value={searchQuery}
  onChange={e => setSearchQuery(e.target.value)} // ❌ Trigger re-render på hvert tastetryk
  className="pl-9"
/>
```

**Konsekvens:**
- Ved stor invoice liste (100+ items) bliver UI langsom
- `filteredInvoices` useMemo kører på hvert tastetryk
- Alle invoice cards re-renderer

**Måling:**
- 100 invoices × 10 tastetryk = 1000 komponent renders
- Med debouncing (300ms): 100 invoices × 1-2 renders = 100-200 renders

**Fix:**
```typescript
import { useMemo, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue'; // or implement

const [searchInput, setSearchInput] = useState("");
const debouncedSearch = useDebouncedValue(searchInput, 300); // 300ms delay

const filteredInvoices = useMemo(() => {
  if (!invoices) return [];

  return invoices.filter((invoice: BillyInvoice) => {
    const matchesSearch =
      debouncedSearch === "" ||
      invoice.invoiceNo?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      invoice.contactId?.toLowerCase().includes(debouncedSearch.toLowerCase());

    const matchesStatus = statusFilter === "all" || invoice.state === statusFilter;

    return matchesSearch && matchesStatus;
  });
}, [invoices, debouncedSearch, statusFilter]);

// In JSX:
<Input
  value={searchInput}
  onChange={e => setSearchInput(e.target.value)}
/>
```

**Prioritet:** 🟡 MEDIUM — Påvirker UX ved store lister

---

### 6. Inefficient Date Formatting

**Lokation:** `InvoicesTab.tsx:454`

**Problem:**
```typescript
<p className="text-xs text-muted-foreground">
  Dato: {new Date(invoice.entryDate).toLocaleDateString("da-DK")} •
  Forfalder: {formatDueInfo(invoice.entryDate, invoice.paymentTermsDays)}
</p>
```

**Konsekvens:**
- `new Date()` og `toLocaleDateString()` kaldes ved hvert render
- For 50 invoices = 100 date parsing operations per render
- Kan optimeres med memoization

**Fix:**
```typescript
// Create memoized formatter outside component or use useMemo
const dateFormatter = new Intl.DateTimeFormat('da-DK');

const formattedDate = useMemo(
  () => dateFormatter.format(new Date(invoice.entryDate)),
  [invoice.entryDate]
);
```

**Prioritet:** 🟢 LOW — Kun problem ved meget store lister (200+)

---

## 🔧 CODE QUALITY ISSUES

### 7. Inconsistent State Management

**Lokation:** `InvoicesTab.tsx:96-105`

**Problem:**
```typescript
const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
const [aiAnalysis, setAiAnalysis] = useState<string>("");
const [analyzingInvoice, setAnalyzingInvoice] = useState(false);
const [feedbackGiven, setFeedbackGiven] = useState<"up" | "down" | null>(null);
const [feedbackComment, setFeedbackComment] = useState("");
const [showCommentInput, setShowCommentInput] = useState(false);
```

**Konsekvens:**
- 6 separate states der skal holdes synkroniserede
- Svært at sikre konsistent state
- Risiko for bugs når states opdateres i forkert rækkefølge

**Fix:**
Brug `useReducer` til relateret state:

```typescript
type AnalysisState =
  | { status: 'idle' }
  | { status: 'analyzing'; invoice: BillyInvoice }
  | {
      status: 'complete';
      invoice: BillyInvoice;
      analysis: string;
      feedback?: { rating: 'up' | 'down'; comment?: string };
      showCommentInput: boolean;
    }
  | { status: 'error'; invoice: BillyInvoice; error: string };

const [analysisState, dispatch] = useReducer(analysisReducer, { status: 'idle' });
```

**Prioritet:** 🟡 MEDIUM — Forbedrer maintainability

---

### 8. Hardcoded Strings (i18n Missing)

**Lokation:** Multiple locations

**Problem:**
```typescript
getStatusBadge(invoice.state) {
  // ...
  case "paid": return { label: "Betalt" };      // ❌ Hardcoded dansk
  case "approved": return { label: "Godkendt" };
  // ...
}
```

**Konsekvens:**
- Ikke muligt at skifte sprog
- Svært at vedligeholde tekster
- Inkonsistent med resten af app (hvis den bruger i18n)

**Fix:**
```typescript
import { useTranslation } from 'react-i18next'; // eller jeres i18n system

const { t } = useTranslation('invoices');

const getStatusBadge = (state: string) => {
  switch (state) {
    case "paid":
      return {
        variant: "default" as const,
        icon: CheckCircle2,
        label: t('status.paid') // → "Betalt" (da) / "Paid" (en)
      };
    // ...
  }
};
```

**Prioritet:** 🟢 LOW — Kun hvis i18n er requirement

---

### 9. Magic Numbers Without Constants

**Lokation:** `InvoicesTab.tsx:76-80`

**Problem:**
```typescript
useAdaptivePolling({
  baseInterval: 60000,       // ❌ What does 60000 mean?
  minInterval: 30000,        // ❌ Magic number
  maxInterval: 180000,       // ❌ Magic number
  inactivityThreshold: 60000,
  // ...
});
```

**Fix:**
```typescript
// At top of file or separate constants file
const POLLING_CONFIG = {
  BASE_INTERVAL_MS: 60_000,      // 1 minute
  MIN_INTERVAL_MS: 30_000,       // 30 seconds
  MAX_INTERVAL_MS: 180_000,      // 3 minutes
  INACTIVITY_THRESHOLD_MS: 60_000, // 1 minute
} as const;

useAdaptivePolling({
  baseInterval: POLLING_CONFIG.BASE_INTERVAL_MS,
  minInterval: POLLING_CONFIG.MIN_INTERVAL_MS,
  maxInterval: POLLING_CONFIG.MAX_INTERVAL_MS,
  inactivityThreshold: POLLING_CONFIG.INACTIVITY_THRESHOLD_MS,
  // ...
});
```

**Prioritet:** 🟢 LOW — Code readability

---

## 🎯 ACCESSIBILITY ISSUES

### 10. Manglende Keyboard Navigation

**Lokation:** Invoice liste (linje 429-555)

**Problem:**
- Invoice cards kan ikke navigeres med keyboard (Tab/Arrow keys)
- Ingen focus indicators
- "Analyze" button er clickable, men cards selv har `cursor-pointer` uden onClick

**Fix:**
```typescript
<Card
  key={invoice.id}
  className="group p-2.5 hover:bg-accent/50 transition-all duration-200 hover:scale-[1.01] hover:shadow-md cursor-pointer"
  tabIndex={0}  // Make focusable
  role="article"
  aria-label={`Invoice ${invoice.invoiceNo || invoice.id.slice(0, 8)} for ${invoice.contactId}`}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAnalyzeInvoice(invoice);
    }
  }}
  onClick={() => handleAnalyzeInvoice(invoice)}
>
```

**Prioritet:** 🟠 MEDIUM — WCAG compliance

---

### 11. Missing ARIA Labels

**Lokation:** Multiple buttons

**Problem:**
```typescript
<Button
  size="icon"
  variant="ghost"
  className="h-7 w-7"
  title="Open in Billy.dk" // ❌ 'title' er ikke nok for screen readers
  onClick={...}
>
  <ExternalLink className="h-3 w-3" />
</Button>
```

**Fix:**
```typescript
<Button
  size="icon"
  variant="ghost"
  className="h-7 w-7"
  title="Open in Billy.dk"
  aria-label="Open invoice in Billy.dk"
  onClick={...}
>
  <ExternalLink className="h-3 w-3" aria-hidden="true" />
</Button>
```

**Prioritet:** 🟠 MEDIUM — WCAG compliance

---

## 🚀 DATABASE SCHEMA ISSUE (Known Blocker)

### 12. Missing Columns in Supabase

**Lokation:** Database schema mismatch

**Problem:**
```typescript
// InvoicesTab.tsx expects:
invoice.invoiceNo
invoice.entryDate
invoice.paymentTermsDays

// But drizzle/schema.ts only has:
customerInvoicesInFridayAi = {
  invoiceNumber: varchar({ length: 50 }),  // ❌ Not 'invoiceNo'
  // ❌ Missing: entryDate, paymentTermsDays, paidAmount
}
```

**Konsekvens:**
- Data fra Billy API kan ikke gemmes korrekt i database
- `updateCustomerBalance` returnerer `NaN`
- Invoice numbers vises ikke i UI

**Fix:**
1. Add migration to create missing columns
2. Update Drizzle schema
3. Backfill data from Billy API

**Prioritet:** 🔴 BLOCKER — Dokumenteret i STATUS.md

---

## 💡 FORESLÅEDE NYE FEATURES

### Feature 1: Bulk Actions
**Beskrivelse:** Vælg flere fakturaer og udfør actions (export, analyze, mark as paid)

**Use case:**
- Bruger har 20 forfaldne fakturaer
- Vil eksportere dem alle til CSV på én gang
- Eller sende påmindelser til alle

**Implementation:**
```typescript
const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());

// Add checkbox to each card
<Checkbox
  checked={selectedInvoices.has(invoice.id)}
  onCheckedChange={(checked) => {
    const newSet = new Set(selectedInvoices);
    if (checked) newSet.add(invoice.id);
    else newSet.delete(invoice.id);
    setSelectedInvoices(newSet);
  }}
/>

// Add bulk action bar
{selectedInvoices.size > 0 && (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg">
    <p>{selectedInvoices.size} selected</p>
    <Button onClick={handleBulkExport}>Export All</Button>
    <Button onClick={handleBulkAnalyze}>Analyze All</Button>
  </div>
)}
```

**Estimat:** 4-6 timer

---

### Feature 2: Invoice Timeline View
**Beskrivelse:** Vis fakturaer på en tidslinje (Gantt-style) for overblik over forfaldsdatoer

**Use case:**
- Bruger vil se alle fakturaer der forfalder næste uge
- Visuelt overblik over cash flow

**Implementation:**
- Brug library som `react-calendar-timeline`
- Gruppér efter måned/uge
- Farvekodning efter status

**Estimat:** 8-12 timer

---

### Feature 3: Smart Filters & Saved Views
**Beskrivelse:** Gem ofte brugte filter kombinationer

**Use case:**
- "Forfaldne fakturaer over 10.000 DKK"
- "Kladder fra sidste måned"
- "Alle betalte i Q4 2024"

**Implementation:**
```typescript
const savedFilters = [
  {
    name: "Forfaldne (høj værdi)",
    filter: { status: 'overdue', minAmount: 10000 }
  },
  {
    name: "Denne måneds kladder",
    filter: { status: 'draft', dateRange: 'this-month' }
  },
];

<Select>
  <SelectItem value="custom">Custom filter</SelectItem>
  {savedFilters.map(f => (
    <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>
  ))}
</Select>
```

**Estimat:** 6-8 timer

---

### Feature 4: AI Suggestions (Proactive)
**Beskrivelse:** AI foreslår actions baseret på invoice data (uden at bruger skal klikke "Analyze")

**Use case:**
- Faktura er 30 dage forfalden → "Send reminder?"
- Faktura har usædvanlig høj værdi → "Double-check with customer"
- Customer har betalt 3 fakturaer til tiden → "Good payment history, consider credit increase"

**Implementation:**
```typescript
// Background job that runs AI analysis on all invoices
// Stores suggestions in database
// Shows as badges/notifications in UI

{invoice.aiSuggestion && (
  <Badge variant="warning" className="gap-1">
    <Sparkles className="h-3 w-3" />
    {invoice.aiSuggestion.action}
  </Badge>
)}
```

**Estimat:** 12-16 timer (requires backend changes)

---

### Feature 5: Email Integration
**Beskrivelse:** Send invoice direkte via email fra UI

**Use case:**
- Bruger ser faktura i InvoicesTab
- Klikker "Send Email"
- Pre-filled email med faktura PDF og standard besked

**Implementation:**
```typescript
<Button
  onClick={() => {
    openEmailComposer({
      to: invoice.contactEmail,
      subject: `Faktura ${invoice.invoiceNo}`,
      body: `Hej,\n\nVedlagt finder du faktura ${invoice.invoiceNo}...\n`,
      attachments: [invoicePdfUrl],
    });
  }}
>
  <Send className="h-4 w-4" />
  Send Email
</Button>
```

**Estimat:** 8-10 timer (depends on existing email infrastructure)

---

## 📊 PRIORITERET ACTION PLAN

### Phase 1: Critical Fixes (1-2 dage)
1. ✅ Fix memory leak i CSV export
2. ✅ Add TypeScript interfaces for invoices
3. ✅ Fix race condition i AI analysis
4. ✅ Add error handling til CSV export
5. ✅ Add debouncing til search input

### Phase 2: Performance & Quality (2-3 dage)
6. ✅ Refactor til useReducer for analysis state
7. ✅ Add accessibility (keyboard nav, ARIA labels)
8. ⏸️ Add i18n support (hvis required)
9. ✅ Extract magic numbers til constants
10. ✅ Optimize date formatting

### Phase 3: Database Fix (1 dag - koordiner med backend team)
11. ⏸️ Create migration for missing columns
12. ⏸️ Update Drizzle schema
13. ⏸️ Backfill data fra Billy API
14. ⏸️ Test end-to-end flow

### Phase 4: New Features (vælg 1-2 baseret på bruger feedback)
15. 🎯 Bulk actions (highest ROI)
16. 🎯 Smart filters & saved views
17. 🔮 AI suggestions (mest ambitiøs)
18. 📧 Email integration
19. 📅 Timeline view

---

## 🧪 TESTING STRATEGI

### Unit Tests
```typescript
// InvoicesTab.test.tsx
describe('InvoicesTab', () => {
  it('should filter invoices by search query', () => {
    // Test search functionality
  });

  it('should not have memory leaks on CSV export', () => {
    // Mock URL.createObjectURL and verify revokeObjectURL is called
  });

  it('should handle race conditions in AI analysis', () => {
    // Click analyze on invoice A, then quickly on invoice B
    // Verify correct analysis is shown
  });
});
```

### Integration Tests
- Test Billy API integration
- Test AI analysis flow end-to-end
- Test feedback submission

### E2E Tests (Playwright/Cypress)
- Search and filter flow
- AI analysis + feedback flow
- CSV export flow
- Keyboard navigation

---

## 📈 SUCCESS METRICS

**Performance:**
- Search input response time: < 100ms (with debouncing)
- Invoice list render time: < 200ms for 100 items
- Memory usage: Stable over time (no leaks)

**Quality:**
- 0 TypeScript `any` types in invoice-related code
- Lighthouse Accessibility score: > 90
- Test coverage: > 80% for critical paths

**User Experience:**
- AI analysis success rate: > 95%
- CSV export success rate: > 99%
- User satisfaction (feedback): > 4.0/5.0

---

## 🔗 RELATED DOCUMENTATION

- [PLAN.md](./PLAN.md) — UX improvements (dialog polish, card improvements)
- [STATUS.md](./STATUS.md) — Current implementation status
- [CHANGELOG.md](./CHANGELOG.md) — Change history
- [Billy API Docs](https://github.com/TekupDK/tekup-billy) — MCP server documentation
- [Database Schema](../../drizzle/schema.ts) — Drizzle ORM schema

---

**Last Updated:** 2025-11-05
**Next Review:** Efter Phase 1 completion
