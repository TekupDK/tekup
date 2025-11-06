# Security Tasks - Impact Analysis

## Task 1: Auto-Approve Preferences Migration (localStorage → Server)

### Oversigt

Flytter action auto-approve preferences fra browser localStorage til server-side database med RBAC enforcement.

---

### 🗄️ Database & Migrations

#### Nye filer

- `db/migrations/YYYYMMDD_create_user_preferences.sql`

#### Schema Changes

```sql
CREATE TABLE user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) UNIQUE NOT NULL,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Eksempel preferences format:
-- {
--   "auto_approve": {
--     "create_lead": true,
--     "create_task": true,
--     "create_invoice": false,  // high-risk, aldrig auto
--     "book_meeting": false,
--     "search_email": true
--   }
-- }
```

#### Ændrede filer

- `drizzle/schema.ts` - Tilføj userPreferences tabel definition

---

### 🖥️ Backend / Server

#### Nye filer

- `server/preferencesRouter.ts` - tRPC routes for preferences CRUD

#### Ændrede filer

**`server/routers.ts`**

- Import preferencesRouter
- Tilføj til appRouter

**`server/preferencesRouter.ts` (NY FIL)**

```typescript
export const preferencesRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    // Hent user preferences fra DB
  }),

  update: protectedProcedure
    .input(
      z.object({
        autoApprove: z.record(z.string(), z.boolean()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validér RBAC: high-risk actions kræver admin
      // Opdater preferences i DB
      // Log audit event
    }),
});
```

**Estimeret LOC:** ~100-150 linjer

**`server/ai-router.ts`**

- Check server preferences i stedet for at returnere pendingAction direkte
- Hvis auto-approve enabled for actionType OG low-risk → execute immediately

**Estimeret LOC:** ~20-30 linjer ændret

---

### 🎨 Frontend / Client

#### Ændrede filer

**`client/src/components/ChatPanel.tsx`**

**Før:**

```typescript
const autoApproveKey = `auto-approve-${data.pendingAction.type}`;
const shouldAutoApprove = localStorage.getItem(autoApproveKey) === "true";
```

**Efter:**

```typescript
const { data: preferences } = trpc.preferences.get.useQuery();
const shouldAutoApprove =
  preferences?.autoApprove?.[data.pendingAction.type] === true &&
  data.pendingAction.riskLevel === "low";
```

**Estimeret LOC:** ~30-40 linjer ændret

**`client/src/components/ActionApprovalModal.tsx`**

**Ændringer:**

- "Always approve" checkbox kalder `trpc.preferences.update.mutate()` i stedet for localStorage
- Vis fejlmeddelelse hvis user ikke har rettigheder til at auto-approve high-risk actions

**Estimeret LOC:** ~20-30 linjer ændret

---

### 🧪 Tests

#### Nye filer

- `tests/preferences-router.test.ts` - Unit tests for preferences CRUD
- `tests/preferences-rbac.test.ts` - RBAC enforcement tests

#### Test Cases

- [ ] Admin kan enable auto-approve for alle action types
- [ ] Non-admin kan IKKE enable auto-approve for high-risk actions
- [ ] Preferences gemmes og hentes korrekt fra DB
- [ ] Audit log genereres ved preference change
- [ ] Backward compatibility: localStorage fallback hvis DB tom (grace period)
- [ ] Auto-approve virker med nye server preferences

**Estimeret LOC:** ~150-200 linjer test kode

---

### 🚀 Migration Strategy

1. **Phase 1 (Week 1):** Deploy backend changes, dual-read (DB + localStorage)
2. **Phase 2 (Week 2):** Migrate existing localStorage data til DB for aktive users
3. **Phase 3 (Week 3):** Switch to DB-only (remove localStorage reads)
4. **Phase 4 (Week 4):** Monitor og cleanup

---

## Task 2: Google Service Account Security Audit

### Oversigt

Audit af eksisterende Google service account setup og dokumentation af security best practices.

---

### 📝 Documentation

#### Nye filer

- `docs/GOOGLE_SERVICE_ACCOUNT.md` - Komplet setup guide
- `tasks/security/google-audit-checklist.md` - Audit checklist

---

### 🖥️ Backend / Server

#### Ændrede filer

**`server/google-api.ts`**

**Audit punkter:**

- [ ] Review scopes: er de minimale?
  - Current: Gmail (read/write), Calendar (read/write)
  - Check: bruges alle disse scopes i praksis?
- [ ] Verificer at credentials aldrig logges
- [ ] Check at service account email er korrekt konfigureret
- [ ] Verificer DWD (Domain-Wide Delegation) setup

**Potentielle ændringer:**

```typescript
// Før:
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/calendar",
  // ... flere scopes
];

// Efter (hvis nogle ikke bruges):
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];
```

**Estimeret LOC:** 0-20 linjer (kun hvis scopes skal reduceres)

**`server/_core/env.ts`**

**Ændringer:**

- Verificer at GOOGLE_SERVICE_ACCOUNT_EMAIL valideres
- Tilføj warning hvis service account ikke er sat op

**Estimeret LOC:** ~5-10 linjer

---

### 🔐 Security Checks

#### Audit Checklist

- [ ] Service account har minimum nødvendige scopes
- [ ] DWD er kun enabled for verified domain
- [ ] Impersonation bruger kun trusted email addresses
- [ ] Credentials fil (`google-service-account.json`) er IKKE committed til git
- [ ] Credentials er gemt sikkert (env variables eller secret manager)
- [ ] Service account keys roteres regelmæssigt (quarterly)
- [ ] API error messages afslører ikke credentials
- [ ] Logs indeholder ikke service account details
- [ ] Access er restricted til mindst mulige antal personer

---

### 📚 Documentation

#### `docs/GOOGLE_SERVICE_ACCOUNT.md`

**Indhold:**

```markdown
# Google Service Account Setup

## Prerequisites

- Google Workspace account med admin access
- Domain-Wide Delegation enabled

## Setup Steps

1. Create service account i Google Cloud Console
2. Enable Domain-Wide Delegation
3. Configure OAuth scopes
4. Download credentials JSON
5. Add email to ENV variables

## Security Best Practices

- Rotate keys quarterly
- Use minimum required scopes
- Store credentials securely
- Monitor API usage
- Audit access regularly

## Troubleshooting

...
```

**Estimeret LOC:** ~200-300 linjer dokumentation

---

### 🧪 Tests

#### Nye filer

- `tests/google-auth.test.ts` - Test auth flow med mock credentials
- `tests/google-scopes.test.ts` - Verificer at kun nødvendige scopes bruges

#### Test Cases

- [ ] Service account authenticates korrekt
- [ ] Impersonation virker med valid domain email
- [ ] Impersonation fejler med external email
- [ ] Credentials errors håndteres gracefully
- [ ] API calls indeholder ikke credentials i logs

**Estimeret LOC:** ~100-150 linjer test kode

---

### 🚦 Rollout Checklist

**Auto-Approve Migration:**

- [ ] user_preferences tabel oprettet
- [ ] preferencesRouter implementeret
- [ ] RBAC checks for high-risk actions
- [ ] Frontend opdateret (ChatPanel, ActionApprovalModal)
- [ ] Audit logging implementeret
- [ ] Tests passing
- [ ] Migration script for localStorage → DB
- [ ] Backward compatibility testet
- [ ] Rollout plan kommunikeret

**Google Audit:**

- [ ] Current scopes dokumenteret
- [ ] Scope usage analysis completed
- [ ] DWD setup verificeret
- [ ] Credentials storage audit done
- [ ] Logging audit done (no credential leaks)
- [ ] Documentation created
- [ ] Key rotation schedule established
- [ ] Team trained on best practices

---

### ⚠️ Risici & Mitigations

| Risiko                          | Påvirkning            | Mitigation                          |
| ------------------------------- | --------------------- | ----------------------------------- |
| Auto-approve bypass             | Security breach       | RBAC checks backend, audit logging  |
| Preferences DB write fejl       | Lost settings         | Graceful fallback, error handling   |
| Scope reduction breaks features | Feature failure       | Test all Gmail/Calendar features    |
| Credentials exposure            | Major security breach | Audit logs, rotate keys immediately |

---

### 📊 Success Metrics

**Auto-Approve:**

- [ ] 100% preferences moved to DB within 2 weeks
- [ ] Zero RBAC bypasses
- [ ] All high-risk actions require explicit approval

**Google Audit:**

- [ ] All scopes documented and justified
- [ ] Zero credential leaks in logs
- [ ] Key rotation schedule followed
- [ ] Documentation complete and reviewed

---

### 🔗 Related Tasks

- **Blocked by:** Ingen
- **Blocks:** Ingen
- **Related:** `tasks/testing/` (RBAC tests), `tasks/logging/` (audit logs)
