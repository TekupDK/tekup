# InvoicesTab — Task Documentation

**Komponent:** `client/src/components/inbox/InvoicesTab.tsx`
**Last Updated:** 2025-11-05
**Status:** 🔴 Critical fixes needed

---

## 📁 DOKUMENTATIONS OVERSIGT

### 🎯 Start Her

**Ny i projektet?** Læs i denne rækkefølge:

1. **[TECHNICAL_ANALYSIS.md](./TECHNICAL_ANALYSIS.md)** — Detaljeret analyse af alle fejl og problemer
   - 12 kritiske fejl dokumenteret
   - Performance issues
   - Accessibility problemer
   - 5 foreslåede nye features

2. **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** — Komplet implementation guide
   - 4 faser (Critical → Quality → Database → Features)
   - Kode eksempler for hver fix
   - Test strategier
   - Deployment plan

3. **[QUICK_CHECKLIST.md](./QUICK_CHECKLIST.md)** — Hurtig checklist til daglig brug
   - Print denne og hæng på væggen
   - Tick af når tasks er færdige
   - Noter blockers og beslutninger

### 📚 Eksisterende Dokumentation

4. **[PLAN.md](./PLAN.md)** — Original UX forbedringer plan
   - Dialog polish (✅ Complete)
   - Card improvements (✅ Complete)
   - Search/filter enhancements (⏳ Pending)

5. **[STATUS.md](./STATUS.md)** — Løbende status tracking
   - Opdateret med Phase 0 (Critical Fixes)
   - Milestones checklist
   - Open issues / blockers

6. **[CHANGELOG.md](./CHANGELOG.md)** — Change history
   - Dokumentér alle ændringer her
   - Format: `YYYY-MM-DD · type(scope): description`

---

## 🚨 KRITISKE PROBLEMER (Fix Først!)

### Problem 1: Memory Leak 🔴
**Impact:** High — Memory vokser ved mange CSV exports
**File:** `InvoicesTab.tsx:261`
**Fix:** Add `URL.revokeObjectURL(url)`
**Estimat:** 15 min

### Problem 2: Type Safety 🔴
**Impact:** Critical — Ingen compile-time checks, fejltilbøjelig kode
**File:** `InvoicesTab.tsx` + `shared/types.ts`
**Fix:** Create `BillyInvoice` interface, remove all `any` types
**Estimat:** 1-2 timer

### Problem 3: Race Condition 🔴
**Impact:** High — Forkert invoice analyse vises til bruger
**File:** `InvoicesTab.tsx:264-303`
**Fix:** Track `currentAnalysisId`, check før state update
**Estimat:** 1 time

### Problem 4: Performance 🟠
**Impact:** Medium — Langsom UI ved store invoice lister
**File:** `InvoicesTab.tsx:379-384`
**Fix:** Add debouncing til search input (300ms)
**Estimat:** 1 time

### Problem 5: Database Schema 🔴
**Impact:** Blocker — NaN balances, missing invoice numbers
**Files:** `drizzle/schema.ts`, `server/invoice-cache.ts`
**Fix:** Migration + backfill (koordinér med backend team)
**Estimat:** 3-4 timer

---

## 📊 QUICK STATS

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Memory leaks | 1 | 0 | 🔴 |
| TypeScript `any` | ~8 | 0 | 🔴 |
| Race conditions | 1 | 0 | 🔴 |
| Accessibility score | ~60 | >90 | 🟡 |
| Search debounce | None | 300ms | 🔴 |
| Test coverage | ~20% | >80% | 🟡 |

---

## 🗓️ TIDSPLAN

### Uge 1 (Dag 1-2): Critical Fixes
- [ ] Fix memory leak
- [ ] Add TypeScript interfaces
- [ ] Fix race condition
- [ ] Add error handling
- [ ] Implement debouncing

**Estimat:** 4-5 timer spread over 2 dage

### Uge 1-2 (Dag 3-4): Code Quality
- [ ] Refactor til useReducer
- [ ] Add accessibility (keyboard + ARIA)
- [ ] Extract constants

**Estimat:** 4-5 timer

### Uge 2 (Dag 5): Database Fix
- [ ] Create migration
- [ ] Update backend cache
- [ ] Run backfill script

**Estimat:** 4-5 timer (koordinér med backend)

### Uge 3+ (Dag 6+): Features (optional)
- [ ] Bulk actions
- [ ] Smart filters
- [ ] AI suggestions

**Estimat:** 4-16 timer (vælg 1-2 features)

---

## 🛠️ HVORDAN STARTER JEG?

### Option A: Fix Alt På Én Gang (Fuld Sprint)
```bash
# 1. Læs TECHNICAL_ANALYSIS.md grundigt
# 2. Følg IMPLEMENTATION_PLAN.md trin for trin
# 3. Brug QUICK_CHECKLIST.md til tracking
# 4. Estimeret tid: 3-5 dage

pnpm install
pnpm dev  # Start dev server
# Fix i denne rækkefølge: P0.1 → P0.2 → P0.3 → P0.4 → P0.5
```

### Option B: Inkrementelle Fixes (Anbefalet)
```bash
# Dag 1: Fix kun memory leak + TypeScript
git checkout -b fix/invoices-memory-leak
# Fix P0.1 + P0.2
git commit -m "fix(invoices): memory leak + TypeScript interfaces"
git push

# Dag 2: Fix race condition + debouncing
git checkout -b fix/invoices-race-condition
# Fix P0.3 + P0.5
git commit -m "fix(invoices): race condition + search debouncing"
git push

# Osv...
```

### Option C: Kun Database Fix (Backend Focus)
```bash
# Koordinér med backend team
# Følg Phase 3 i IMPLEMENTATION_PLAN.md
git checkout -b fix/invoices-database-schema
# Opdater schema, run migration, backfill
```

---

## 📝 COMMIT CONVENTIONS

Brug følgende format:

```
<type>(invoices): <description>

<body>

Fixes #<issue-number>
```

**Types:**
- `fix`: Bug fixes (memory leak, race condition)
- `feat`: New features (bulk actions, filters)
- `refactor`: Code improvements (useReducer, constants)
- `perf`: Performance improvements (debouncing)
- `a11y`: Accessibility (ARIA, keyboard nav)
- `test`: Tests
- `docs`: Documentation
- `chore`: Maintenance (deps, config)

**Eksempler:**
```bash
git commit -m "fix(invoices): memory leak in CSV export

Added URL.revokeObjectURL() to prevent memory buildup.
Tested with 20+ exports, memory usage stable.

Fixes #123"

git commit -m "feat(invoices): add TypeScript interfaces

Created BillyInvoice and BillyInvoiceLine interfaces.
Removed all 'any' types from InvoicesTab.
Improved type safety and IntelliSense.

Fixes #124"
```

---

## 🧪 TESTING

### Run Tests
```bash
# Unit tests
pnpm test InvoicesTab

# E2E tests
pnpm test:e2e invoices

# Type checking
pnpm typecheck

# Accessibility audit
pnpm lighthouse --view
```

### Manual Testing Checklist
- [ ] Search invoices (type fast, verify debouncing)
- [ ] Filter by status
- [ ] Click "Analyze" on invoice
- [ ] Click "Analyze" on another invoice immediately (race condition test)
- [ ] Export CSV (check DevTools memory after 10 exports)
- [ ] Navigate with keyboard only (Tab, Enter, Space)
- [ ] Test on mobile (responsive dialog)
- [ ] Test with screen reader (ARIA labels)

---

## 🚀 DEPLOYMENT

### Pre-deployment Checklist
- [ ] All critical fixes merged
- [ ] Tests passing
- [ ] Database migration tested in staging
- [ ] Code review approved
- [ ] Performance benchmarks recorded

### Deploy Commands
```bash
# 1. Database migration (prod)
pnpm drizzle-kit push --prod

# 2. Backfill data
pnpm tsx scripts/backfill-invoices.ts

# 3. Deploy code
git checkout main
git pull
pnpm build
# Deploy via CI/CD
```

### Rollback Plan
```bash
# If issues found:
git revert <commit-hash>
git push

# Rollback database (if needed)
pnpm drizzle-kit rollback
```

---

## 📞 SUPPORT

### Spørgsmål?
- **Frontend:** Tag @frontend-team
- **Backend/DB:** Tag @backend-team
- **UX:** Tag @design-team
- **Urgent:** Tag @on-call

### Useful Links
- [Billy API Docs](https://github.com/TekupDK/tekup-billy)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 🏆 SUCCESS CRITERIA

**Når er vi færdige?**

✅ All critical bugs fixed (memory leak, types, race condition)
✅ Performance improved (debouncing, optimizations)
✅ Accessibility score >90 (Lighthouse)
✅ Test coverage >80%
✅ Database schema aligned
✅ No console errors in production
✅ User feedback >4.0/5.0

---

## 📂 FILE STRUCTURE

```
tasks/invoices-ui/
├── README.md                    ← Du er her
├── TECHNICAL_ANALYSIS.md        ← Detaljeret fejl analyse
├── IMPLEMENTATION_PLAN.md       ← Step-by-step guide
├── QUICK_CHECKLIST.md          ← Daglig checklist
├── PLAN.md                      ← Original UX plan
├── STATUS.md                    ← Status tracking
└── CHANGELOG.md                 ← Change history
```

---

**Held og lykke! 🚀**

Hvis du støder på problemer eller har spørgsmål, opret et issue eller tag teamet.
