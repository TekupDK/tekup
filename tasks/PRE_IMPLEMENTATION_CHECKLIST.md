# Pre-Implementation Checklist

Brug denne checklist **FØR** du starter implementering af en task for at sikre du har alt du skal bruge.

---

## 🎯 For AI Copilot Agents

Når du bliver bedt om at hjælpe med en task, gennemgå denne checklist med brugeren:

```markdown
## Checklist for [TASK_NAME]

### 📖 Documentation Review

- [ ] Har læst `tasks/[task]/PLAN.md`
- [ ] Har læst `tasks/[task]/STATUS.md`
- [ ] Har læst `tasks/[task]/IMPACT.md`
- [ ] Forstår scope og estimater

### 🔗 Dependencies Check

- [ ] Verificeret at blocking tasks er færdige
- [ ] Verificeret at required ENV vars er sat op
- [ ] Verificeret at DB er opdateret (hvis nødvendigt)
- [ ] Verificeret at dependencies er installeret

### 🛠️ Development Setup

- [ ] Branch oprettet (eller klar til at oprette)
- [ ] Dev environment kører (`pnpm dev`)
- [ ] Tests kører lokalt (`pnpm test`)
- [ ] DB migrations er up-to-date

### 👥 Team Coordination

- [ ] Tjekket om andre arbejder på relaterede tasks
- [ ] Kommunikeret start på task til team
- [ ] Aftalt reviewers
- [ ] Planlagt merge strategi

### ✅ Ready to Code

- [ ] Alt ovenstående er checked off
- [ ] Har en klar første step (start med tests? migration? route?)
- [ ] Estimeret tid passer med kalender
```

---

## 📋 Task-Specifik Checklists

### AI Metrics

**Ekstra pre-req checks:**

- [ ] Har adgang til model pricing sheets (Gemini, OpenAI, Claude)
- [ ] Forstår current invokeLLM implementation
- [ ] Har testet Drizzle migrations lokalt
- [ ] Kender DB backup procedure (før migration)

**Første steps:**

1. Opret DB migration for `ai_usage_logs`
2. Test migration i dev
3. Implementer `cost-calculator.ts` helper
4. Skriv unit tests for cost calculation
5. Integrer logging i `invokeLLM`

---

### Admin Dashboard

**Ekstra pre-req checks:**

- [ ] `ai-metrics` task er 100% færdig (BLOCKER!)
- [ ] Har verificeret at `ai_usage_logs` data eksisterer
- [ ] Kender RBAC implementation (admin/owner roles)
- [ ] Har valgt chart library (Recharts anbefalet)

**Første steps:**

1. Installer chart library (`pnpm add recharts`)
2. Opret `server/adminRouter.ts` med RBAC
3. Implementer `getMetricsOverview` query
4. Skriv unit test for RBAC enforcement
5. Opret `AdminMetrics.tsx` page skeleton

---

### Auto-Approve Preferences

**Ekstra pre-req checks:**

- [ ] Forstår current localStorage implementation i ChatPanel
- [ ] Kender RBAC rules for high-risk vs low-risk actions
- [ ] Har planlagt migration strategi (localStorage → DB)
- [ ] Ved hvordan audit logging virker

**Første steps:**

1. Opret `user_preferences` tabel migration
2. Test migration i dev
3. Implementer `preferencesRouter.ts`
4. Skriv RBAC tests (non-admin kan ikke auto-approve high-risk)
5. Opdater ChatPanel til dual-read (DB + localStorage fallback)

---

### Google Service Account Audit

**Ekstra pre-req checks:**

- [ ] Har adgang til Google Cloud Console
- [ ] Kan se current service account scopes
- [ ] Ved hvordan DWD er konfigureret
- [ ] Kan teste med dev credentials

**Første steps:**

1. Dokumenter current scopes i `google-api.ts`
2. Lav scope usage analysis (hvilke bruges faktisk?)
3. Opret `docs/GOOGLE_SERVICE_ACCOUNT.md`
4. Review logs for credential leaks
5. Skriv tests for auth flow

---

### Testing (Action Approval)

**Ekstra pre-req checks:**

- [ ] Vitest og Playwright kører lokalt
- [ ] Forstår current test setup (`vitest.config.ts`, `playwright.config.ts`)
- [ ] Har adgang til test database
- [ ] Ved hvordan test fixtures virker

**Første steps:**

1. Opret test fixtures for pending actions
2. Skriv `execute-action.test.ts` (happy path først)
3. Implementer DB cleanup helpers
4. Skriv E2E test for approval modal (basic flow)
5. Kør tests og verificer de er stabile

---

### Email Pipeline (Caching)

**Ekstra pre-req checks:**

- [ ] Forstår current inbox routes i `server/routers.ts`
- [ ] Ved hvordan webhook handler virker
- [ ] Kender Gmail API quota limits
- [ ] Har planlagt cache TTL strategy

**Første steps:**

1. Opret migration for cache felter i `email_threads`
2. Test migration i dev
3. Implementer `isThreadStale()` helper
4. Opdater `inbox.getThreads` med stale check
5. Udvid webhook handler med invalidation

---

## 🚨 Red Flags / Stop Signals

Stop og diskuter med team hvis:

- ❌ **Scope creep:** Task vokser beyond estimater i IMPACT.md
- ❌ **Blocking issues:** Opdager at dependencies ikke er klar
- ❌ **Technical unknowns:** Støder på teknologi du ikke kender
- ❌ **Breaking changes:** Ændringer vil påvirke existing features
- ❌ **Security concerns:** Noget føles usikkert (credentials, permissions, etc.)
- ❌ **Performance risks:** Worry om DB load, API rate limits, etc.

**Når i tvivl:** Skriv i team chat, eller lav en lille POC/spike først!

---

## ✅ Done Criteria

Task er IKKE færdig før:

- [ ] All code changes committed
- [ ] All tests passing (unit + E2E)
- [ ] Coverage targets nået (hvis relevant)
- [ ] STATUS.md opdateret (alle checks marked done)
- [ ] CHANGELOG.md opdateret med ny entry
- [ ] Documentation opdateret (hvis API/behavior ændret)
- [ ] Peer review done og approved
- [ ] Merged til main/master
- [ ] Deployed til staging og smoke tested
- [ ] (Optional) Deployed til prod og monitored

---

## 📞 Hvem at kontakte

**Database issues:** [DB lead / SRE]  
**Frontend/UI questions:** [Frontend lead]  
**Backend/API questions:** [Backend lead]  
**Test infrastructure:** [QA/Test lead]  
**Security concerns:** [Security lead / Owner]  
**General questions:** Team chat eller standup

---

## 🎓 Learning Resources

**Ny på projektet?** Læs disse først:

- [`README.md`](../README.md) - Project overview
- [`QUICK_START.md`](../QUICK_START.md) - Setup guide
- [`DATABASE_SETUP.md`](../DATABASE_SETUP.md) - DB architecture
- [`tasks/README.md`](./README.md) - Task system conventions

**Ny på teknologien?**

- [tRPC docs](https://trpc.io/) - API layer
- [Drizzle ORM docs](https://orm.drizzle.team/) - Database
- [Vitest docs](https://vitest.dev/) - Unit testing
- [Playwright docs](https://playwright.dev/) - E2E testing

---

**Held og lykke! 🚀**

_Husk: Det er bedre at spørge end at gætte. Tag fat i teamet tidligt hvis noget er uklart!_
