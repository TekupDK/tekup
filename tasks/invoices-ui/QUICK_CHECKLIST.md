# InvoicesTab — Quick Implementation Checklist

**Start dato:** _____
**Forventet færdig:** _____
**Status:** ⏸️ Not Started

---

## 🔴 PHASE 1: CRITICAL FIXES (Dag 1-2)

### ✅ Task 1.1: Fix Memory Leak
- [ ] Add `URL.revokeObjectURL(url)` after CSV export
- [ ] Test: Export 10+ CSVs, verify no memory leak
- **Estimat:** 15 min
- **Files:** `InvoicesTab.tsx:261`

### ✅ Task 1.2: TypeScript Interfaces
- [ ] Create `BillyInvoice` interface i `shared/types.ts`
- [ ] Create `BillyInvoiceLine` interface
- [ ] Replace all `any` types in InvoicesTab
- [ ] Run `pnpm typecheck` — no errors
- **Estimat:** 1-2 timer
- **Files:** `shared/types.ts`, `InvoicesTab.tsx`

### ✅ Task 1.3: Fix Race Condition
- [ ] Add `currentAnalysisId` state
- [ ] Check ID before updating analysis state
- [ ] Test: Click analyze on A, then B quickly
- **Estimat:** 1 time
- **Files:** `InvoicesTab.tsx:264-303`

### ✅ Task 1.4: Error Handling (CSV)
- [ ] Wrap CSV export i try-catch
- [ ] Add success toast
- [ ] Add error toast
- **Estimat:** 30 min
- **Files:** `InvoicesTab.tsx:487-492`

### ✅ Task 1.5: Search Debouncing
- [ ] Create/check `useDebouncedValue` hook
- [ ] Split `searchQuery` → `searchInput` + `debouncedSearch`
- [ ] Update `filteredInvoices` useMemo
- [ ] Test: Type fast, verify single filter operation
- **Estimat:** 1 time
- **Files:** `hooks/useDebouncedValue.ts`, `InvoicesTab.tsx`

**Phase 1 Done?** ✅ / ❌
**Review:** _____________________

---

## 🟡 PHASE 2: CODE QUALITY (Dag 3-4)

### ✅ Task 2.1: useReducer Refactor
- [ ] Create `AnalysisState` type
- [ ] Create `analysisReducer` function
- [ ] Replace 6 states with reducer
- [ ] Write unit tests for reducer
- **Estimat:** 2-3 timer
- **Files:** `InvoicesTab.tsx`

### ✅ Task 2.2: Accessibility
- [ ] Add `tabIndex`, `role`, `aria-label` til cards
- [ ] Add keyboard handler (Enter/Space)
- [ ] Add ARIA labels til icon buttons
- [ ] Add focus indicators (CSS)
- [ ] Test with keyboard only
- [ ] Run Lighthouse Accessibility (target: >90)
- **Estimat:** 2 timer
- **Files:** `InvoicesTab.tsx`

### ✅ Task 2.3: Extract Constants
- [ ] Create `INVOICE_CONFIG` object
- [ ] Extract polling intervals
- [ ] Extract debounce delay
- [ ] Extract UI values
- **Estimat:** 30 min
- **Files:** `InvoicesTab.tsx`

**Phase 2 Done?** ✅ / ❌
**Review:** _____________________

---

## 🔴 PHASE 3: DATABASE FIX (Dag 5)

**⚠️ KOORDINÉR MED BACKEND TEAM**

### ✅ Task 3.1: Database Migration
- [ ] Update `drizzle/schema.ts` (add columns)
- [ ] Run `pnpm drizzle-kit generate`
- [ ] Test migration i dev
- [ ] Test rollback
- [ ] Apply til staging
- [ ] Review med backend team
- **Estimat:** 2-3 timer
- **Owner:** Backend/DevOps
- **Files:** `drizzle/schema.ts`

### ✅ Task 3.2: Update Backend Cache
- [ ] Update `cacheInvoicesToDatabase` function
- [ ] Update `getInvoices` query
- [ ] Test Billy API sync
- [ ] Verify no `NaN` in balance calculations
- **Estimat:** 1-2 timer
- **Files:** `server/invoice-cache.ts`, `server/billy.ts`

### ✅ Task 3.3: Backfill Data
- [ ] Create `scripts/backfill-invoices.ts`
- [ ] Test in dev environment
- [ ] Schedule maintenance window
- [ ] Run in production
- [ ] Verify all invoices have data
- **Estimat:** 1 time
- **Files:** `scripts/backfill-invoices.ts`

**Phase 3 Done?** ✅ / ❌
**Review:** _____________________

---

## 🟢 PHASE 4: NEW FEATURES (Dag 6+)

**Vælg 1-2 features baseret på bruger feedback**

### Option A: Bulk Actions 🎯
- [ ] Add checkbox til invoice cards
- [ ] Add `selectedInvoices` state
- [ ] Build bulk action bar
- [ ] Implement bulk CSV export
- [ ] (Optional) Implement bulk analyze
- **Estimat:** 4-6 timer
- **ROI:** High

### Option B: Smart Filters 🎯
- [ ] Design filter structure
- [ ] Add "Save Filter" button
- [ ] Add filter selector dropdown
- [ ] Store filters (localStorage)
- [ ] Apply saved filters
- **Estimat:** 6-8 timer
- **ROI:** Medium

### Option C: AI Suggestions 🔮
- [ ] Design suggestion schema
- [ ] Create background analysis job
- [ ] Store suggestions in database
- [ ] Display as badges in UI
- [ ] Add dismiss/act buttons
- **Estimat:** 12-16 timer
- **ROI:** High (innovative)

**Phase 4 Done?** ✅ / ❌
**Review:** _____________________

---

## 🧪 TESTING

### Unit Tests
- [ ] CSV export memory test
- [ ] Race condition test
- [ ] Search/filter logic
- [ ] Reducer transitions
- [ ] Coverage > 80%

### Integration Tests
- [ ] Billy API sync
- [ ] Database cache
- [ ] AI analysis flow

### E2E Tests (Playwright)
- [ ] Search invoices
- [ ] Filter by status
- [ ] Analyze invoice
- [ ] Export CSV
- [ ] Keyboard navigation

### Performance Tests
- [ ] Search debouncing < 100ms
- [ ] Render 100 invoices < 200ms
- [ ] Memory stable (no leaks)

**All Tests Passing?** ✅ / ❌

---

## 🚀 DEPLOYMENT

### Pre-deploy
- [ ] All phases complete
- [ ] Tests passing
- [ ] Migration tested in staging
- [ ] Performance benchmarks recorded
- [ ] Accessibility audit (>90)
- [ ] Code review approved

### Deploy
- [ ] Run database migration (production)
- [ ] Run backfill script
- [ ] Deploy code (CI/CD)
- [ ] Smoke test production
- [ ] Monitor errors (Sentry/logs)

### Post-deploy
- [ ] Verify InvoicesTab loads
- [ ] Test search/filter
- [ ] Test AI analysis
- [ ] Test CSV export
- [ ] Check performance metrics
- [ ] Gather user feedback

**Deployment Successful?** ✅ / ❌

---

## 📊 SUCCESS METRICS

### Technical
- [ ] 0 memory leaks
- [ ] 0 `any` types
- [ ] Lighthouse A11y > 90
- [ ] Test coverage > 80%
- [ ] No console errors

### Performance
- [ ] Search < 100ms
- [ ] Render 100 items < 200ms
- [ ] AI analysis < 5s (p95)

### User Experience
- [ ] AI success rate > 95%
- [ ] CSV success rate > 99%
- [ ] Feedback rating > 4.0/5.0

---

## 📝 NOTES

**Blockers:**
_____________________________
_____________________________

**Decisions:**
_____________________________
_____________________________

**Follow-up:**
_____________________________
_____________________________

---

**Last Updated:** 2025-11-05
**Next Review:** Efter hver phase
