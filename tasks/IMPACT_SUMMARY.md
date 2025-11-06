# Impact Analysis - Quick Reference

Dette dokument giver et hurtigt overblik over hvilke filer der påvirkes når hver task implementeres.

**Formål:** Hjælp AI Copilot og udviklere med at forstå scope og dependencies FØR de starter implementering.

---

## 📋 Oversigt

Hver task-mappe indeholder nu en **IMPACT.md** fil med detaljeret information om:

- Database schema ændringer
- Backend/server filer
- Frontend/client filer
- Test filer
- Dependencies
- Configuration
- Rollout checklist
- Risici og mitigations

---

## 🎯 Quick Links

### 1. AI Metrics (Token/Cost Tracking)

**Impact fil:** [`ai-metrics/IMPACT.md`](./ai-metrics/IMPACT.md)

**Hovedområder påvirket:**

- 🗄️ Database: Nye tabeller (`ai_usage_logs`), udvidelse af `conversations`
- 🖥️ Backend: `server/_core/llm.ts`, `server/ai-router.ts`, `server/routers.ts`
- 🧪 Tests: Nye unit tests for logging og cost calculation
- ⏱️ Estimeret: ~500-700 LOC

**Key files:**

- `db/migrations/` (nye migrationer)
- `server/helpers/cost-calculator.ts` (NY)
- `server/helpers/usage-logger.ts` (NY)
- `drizzle/schema.ts`

---

### 2. Admin Dashboard (Metrics UI)

**Impact fil:** [`admin-dashboard/IMPACT.md`](./admin-dashboard/IMPACT.md)

**Hovedområder påvirket:**

- 🖥️ Backend: `server/adminRouter.ts` (NY), `server/_core/trpc.ts`
- 🎨 Frontend: Nye pages og components til `/admin/metrics`
- 📦 Dependencies: `recharts` eller chart library
- ⏱️ Estimeret: ~500-700 LOC

**Key files:**

- `server/adminRouter.ts` (NY)
- `client/src/pages/AdminMetrics.tsx` (NY)
- `client/src/components/admin/*` (NYE komponenter)

**⚠️ BLOCKED:** Kræver at `ai-metrics` task er færdig først.

---

### 3. Security Tasks

**Impact fil:** [`security/IMPACT.md`](./security/IMPACT.md)

#### 3a. Auto-Approve Preferences Migration

**Hovedområder påvirket:**

- 🗄️ Database: Ny `user_preferences` tabel
- 🖥️ Backend: `server/preferencesRouter.ts` (NY), RBAC checks
- 🎨 Frontend: `client/src/components/ChatPanel.tsx`, `ActionApprovalModal.tsx`
- ⏱️ Estimeret: ~300-400 LOC

**Key files:**

- `db/migrations/` (user_preferences)
- `server/preferencesRouter.ts` (NY)
- `client/src/components/ChatPanel.tsx`

#### 3b. Google Service Account Audit

**Hovedområder påvirket:**

- 🔍 Audit: `server/google-api.ts` (review only)
- 📝 Documentation: Nye docs for setup og best practices
- ⏱️ Estimeret: Primært dokumentation, minimal kode (~0-50 LOC)

**Key files:**

- `server/google-api.ts` (review)
- `docs/GOOGLE_SERVICE_ACCOUNT.md` (NY)

---

### 4. Testing (Action Approval Coverage)

**Impact fil:** [`testing/IMPACT.md`](./testing/IMPACT.md)

**Hovedområder påvirket:**

- 🧪 Unit Tests: 5-6 nye Vitest test filer
- 🧪 E2E Tests: 3 nye Playwright test filer
- 🛠️ Infrastructure: `vitest.config.ts`, `playwright.config.ts`
- ⏱️ Estimeret: ~1200-1600 LOC (primært tests)

**Key files:**

- `tests/chat/execute-action.test.ts` (NY)
- `tests/chat/action-idempotency.test.ts` (NY)
- `tests/e2e/action-approval-modal.spec.ts` (NY)
- `tests/fixtures/*` (NYE test fixtures)

**Target:** >80% coverage for action execution routes.

---

### 5. Email Pipeline (Inbox Caching)

**Impact fil:** [`email-pipeline/IMPACT.md`](./email-pipeline/IMPACT.md)

**Hovedområder påvirket:**

- 🗄️ Database: Udvidelse af `email_threads` (nye cache felter)
- 🖥️ Backend: `server/routers.ts` (inbox routes), webhook handler
- 📊 Monitoring: Nye metrics for cache performance
- 🔄 Optional: Background sync job
- ⏱️ Estimeret: ~400-600 LOC (+ 150-200 hvis background sync)

**Key files:**

- `db/migrations/` (email_threads udvidelse)
- `server/routers.ts` (inbox routes)
- `server/_core/index.ts` (webhook)
- `server/jobs/email-sync.ts` (NY, optional)
- `server/metrics/email-cache.ts` (NY)

---

## 📊 Impact Matrix

| Task            | DB Changes | Backend LOC | Frontend LOC | Tests LOC | Total LOC | Risk Level |
| --------------- | ---------- | ----------- | ------------ | --------- | --------- | ---------- |
| AI Metrics      | ✅ High    | ~400        | ~0           | ~300      | ~700      | Medium     |
| Admin Dashboard | ❌ None    | ~300        | ~300         | ~250      | ~850      | Low        |
| Auto-Approve    | ✅ Medium  | ~200        | ~100         | ~200      | ~500      | Medium     |
| Google Audit    | ❌ None    | ~20         | ~0           | ~150      | ~170      | Low        |
| Testing         | ❌ None    | ~0          | ~0           | ~1500     | ~1500     | Low        |
| Email Caching   | ✅ Medium  | ~400        | ~0           | ~400      | ~800      | Medium     |

---

## 🔗 Dependencies Graph

```
ai-metrics
    ↓
admin-dashboard (BLOCKED by ai-metrics)

auto-approve → (independent)

google-audit → (independent)

testing → (independent, but helps all others)

email-caching → (independent)
```

---

## 🚀 Anbefalet Implementerings-Rækkefølge

### Fase 1: Foundation (Week 1-2)

1. **Testing** - Build test infrastructure først for bedre confidence
2. **Google Audit** - Quick security win, primært dokumentation

### Fase 2: Core Features (Week 3-4)

3. **AI Metrics** - Kritisk for cost monitoring
4. **Email Caching** - Performance forbedring

### Fase 3: UX Improvements (Week 5-6)

5. **Auto-Approve** - Bedre brugeroplevelse
6. **Admin Dashboard** - Visualisering af metrics (kræver AI Metrics)

---

## 💡 Tips til Implementation

### Før du starter en task:

1. **Læs IMPACT.md filen** i task-mappen
2. **Check dependencies** - er blocking tasks færdige?
3. **Review estimater** - passer tidsrammen?
4. **Setup test environment** - DB migrations, fixtures, etc.
5. **Kommuniker med team** - hvem arbejder på hvad?

### Under implementation:

1. **Følg checklist i IMPACT.md**
2. **Opdater STATUS.md** løbende
3. **Skriv tests først** (TDD hvor muligt)
4. **Commit ofte** med beskrivende messages
5. **Update CHANGELOG.md** ved milestones

### Efter implementation:

1. **Kør alle tests** (unit + E2E)
2. **Review coverage** - er targets nået?
3. **Update dokumentation**
4. **Peer review** før merge
5. **Monitor i staging** før prod

---

## 🎓 For AI Copilot Agents

Når du hjælper med at implementere en task:

1. **Start altid med at læse IMPACT.md** i den relevante task-mappe
2. **Reference specifik sektion** fra IMPACT.md i dine forklaringer
3. **Check dependencies** - informer user hvis blocking task ikke er færdig
4. **Følg estimater** - hvis scope vokser, diskuter med user
5. **Test guidance** - brug test cases fra IMPACT.md som reference
6. **Update STATUS.md** når du markerer items som done

**Eksempel på god AI workflow:**

```
User: "Hjælp mig med at implementere AI metrics task"

AI: "Jeg har læst tasks/ai-metrics/IMPACT.md. Her er oversigten:
     - Vi skal oprette 2 nye DB tabeller (se linje 18-45 i IMPACT.md)
     - Backend ændringer i 3 filer (~400 LOC estimeret)
     - 5 nye test filer (~300 LOC)

     Vil du starte med database migration eller backend integration?"
```

---

## 📚 Yderligere Resources

- **Main README:** [`../README.md`](../README.md)
- **Task Conventions:** [`README.md`](./README.md)
- **Database Docs:** [`../DATABASE_SETUP.md`](../DATABASE_SETUP.md)
- **Testing Docs:** [`../TEST_INTEGRATION_SETUP.md`](../TEST_INTEGRATION_SETUP.md)

---

**Opdateret:** 2025-11-05  
**Maintained by:** Dev team & AI agents
