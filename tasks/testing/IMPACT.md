# Testing - Impact Analysis

## Oversigt

Implementering af omfattende test coverage for action approval flow, inklusiv unit tests (Vitest) og E2E tests (Playwright).

---

## 🧪 Test Files

### Nye Unit Test Filer (Vitest)

#### `tests/chat/execute-action.test.ts`

**Test cases:**

- executeAction happy path (valid action med alle params)
- Idempotency: samme actionId køres ikke to gange
- Audit logging: verificer at action_audit_log får entry
- Feature flag: action disabled via feature flag → error
- RBAC: non-owner kan ikke execute admin-only actions
- Error cases: invalid actionId, missing params, DB errors
- Usage logging: verificer at AI usage bliver logget (hvis ai-metrics task done)

**Estimeret LOC:** ~200-250 linjer

**Mock dependencies:**

- DB queries (getActionById, insertAuditLog, etc.)
- AI calls (invokeLLM)
- Feature flag checks
- RBAC checks

#### `tests/chat/action-idempotency.test.ts`

**Test cases:**

- Duplicate action ID returnerer cached result
- Concurrent requests med samme action ID → kun én execution
- Idempotency key expiration (hvis relevant)

**Estimeret LOC:** ~100-150 linjer

#### `tests/chat/action-audit.test.ts`

**Test cases:**

- Audit log entry oprettet ved action execution
- Audit log indeholder user_id, action_id, action_type, result, timestamp
- Failed actions også logges
- Audit log queries virker (getAuditLogByUser, getAuditLogByAction)

**Estimeret LOC:** ~100-150 linjer

#### `tests/chat/action-feature-flags.test.ts`

**Test cases:**

- Action allowed når feature flag enabled
- Action blocked når feature flag disabled
- User-specific feature flags (A/B testing scenario)
- Fallback behavior ved manglende flag

**Estimeret LOC:** ~100-150 linjer

#### `tests/chat/action-rbac.test.ts`

**Test cases:**

- Owner kan execute alle actions
- Admin kan execute admin actions
- Regular user kan execute user actions
- Regular user får 403 ved admin action
- Action permissions matrix test

**Estimeret LOC:** ~150-200 linjer

---

### Nye E2E Test Filer (Playwright)

#### `tests/e2e/action-approval-modal.spec.ts`

**Test scenarios:**

1. **Pending action vises i modal:**
   - Send besked der trigger action
   - Verificer at ActionApprovalModal vises
   - Check at preview, impact, risk level vises korrekt

2. **Approve flow:**
   - Klik "Approve" knap
   - Verificer at action executes
   - Check success toast
   - Verificer at modal lukkes
   - Check at AI response vises i chat

3. **Reject flow:**
   - Klik "Reject" knap
   - Verificer at modal lukkes
   - Check at action IKKE executes
   - No error toast

4. **Always approve checkbox:**
   - Enable "Always approve this action type"
   - Approve action
   - Verificer at preference gemmes (DB check)
   - Send ny besked med samme action type
   - Verificer at modal IKKE vises (auto-approved)

**Estimeret LOC:** ~300-400 linjer

#### `tests/e2e/action-auto-approve.spec.ts`

**Test scenarios:**

1. **Low-risk auto-approve:**
   - Enable auto-approve for "create_task" (low-risk)
   - Send besked der trigger create_task
   - Verificer at action executes uden modal

2. **High-risk always shows modal:**
   - Enable auto-approve for "create_invoice" (high-risk)
   - Send besked der trigger create_invoice
   - Verificer at modal STADIG vises (high-risk override)

3. **Per-action-type preferences:**
   - Enable auto-approve for "create_lead"
   - Disable auto-approve for "create_task"
   - Test begge action types
   - Verificer korrekt behavior for hver

**Estimeret LOC:** ~200-300 linjer

#### `tests/e2e/action-preview.spec.ts`

**Test scenarios:**

1. **Preview display:**
   - Trigger action med preview
   - Verificer at preview text vises korrekt
   - Check impact level indicator
   - Check risk level badge

2. **Different action types:**
   - Test preview for create_lead, create_invoice, book_meeting
   - Verificer at hver viser relevant info

**Estimeret LOC:** ~150-200 linjer

---

## 🛠️ Test Infrastructure

### Ændrede filer

#### `vitest.config.ts`

**Potentielle ændringer:**

- Tilføj test coverage thresholds (target: 80%)
- Setup test database connection
- Mock external APIs (Gmail, Billy, AI providers)

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      lines: 80,
      branches: 80,
      functions: 80,
      statements: 80,
    },
    // ...existing config
  },
});
```

**Estimeret LOC:** ~10-20 linjer

#### `playwright.config.ts`

**Potentielle ændringer:**

- Tilføj test user fixtures (admin, regular user)
- Setup dev database for E2E tests
- Add retry logic for flaky tests

```typescript
export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://localhost:3000",
    // Test user credentials
    storageState: "tests/fixtures/auth-state.json",
  },
  // ...existing config
});
```

**Estimeret LOC:** ~10-20 linjer

---

## 📦 Test Fixtures & Helpers

### Nye filer

#### `tests/fixtures/actions.ts`

**Indhold:**

```typescript
export const mockPendingActions = {
  createLead: {
    id: "action-123",
    type: "create_lead",
    params: { name: "Test Lead", email: "test@example.com" },
    preview: "Create lead: Test Lead",
    impact: "Creates a new lead in CRM",
    riskLevel: "low",
  },
  createInvoice: {
    id: "action-456",
    type: "create_invoice",
    params: { customer: "Test Customer", amount: 1000 },
    preview: "Create invoice: 1000 DKK",
    impact: "Generates invoice draft in Billy",
    riskLevel: "high",
  },
  // ...flere action fixtures
};
```

**Estimeret LOC:** ~100-150 linjer

#### `tests/helpers/db-test-utils.ts`

**Indhold:**

```typescript
// Helper functions for test DB setup/teardown
export async function seedTestData() { ... }
export async function cleanupTestData() { ... }
export async function createTestUser(role: 'admin' | 'user') { ... }
export async function createTestConversation() { ... }
```

**Estimeret LOC:** ~150-200 linjer

#### `tests/helpers/mock-ai.ts`

**Indhold:**

```typescript
// Mock AI responses for deterministic tests
export function mockInvokeLLM(response: string, pendingAction?: any) { ... }
export function mockGeminiResponse() { ... }
export function mockOpenAIResponse() { ... }
```

**Estimeret LOC:** ~100-150 linjer

---

## 🚀 CI/CD Integration

### Ændrede filer

#### `.github/workflows/test.yml` (hvis den eksisterer)

**Ændringer:**

- Tilføj test coverage step
- Upload coverage reports
- Fail hvis coverage < threshold
- Run E2E tests i CI (headless)

```yaml
- name: Run unit tests
  run: pnpm test:unit --coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3

- name: Run E2E tests
  run: pnpm test:e2e --workers=1
```

**Estimeret LOC:** ~20-30 linjer

---

## 📊 Test Coverage Goals

### Target Coverage

- **Unit tests:** >80% for action execution routes
- **E2E tests:** Cover alle critical user paths
- **Integration tests:** Test DB interactions

### Coverage Areas

- `server/routers.ts` (chat.executeAction, chat.sendMessage): >80%
- `server/ai-router.ts`: >70%
- `client/src/components/ChatPanel.tsx`: >60% (E2E covers most)
- `client/src/components/ActionApprovalModal.tsx`: >70%

---

## 🧪 Test Execution

### Commands

```bash
# Unit tests
pnpm test:unit

# Unit tests med coverage
pnpm test:unit --coverage

# E2E tests
pnpm test:e2e

# Watch mode (dev)
pnpm test:watch

# Specific test file
pnpm test tests/chat/execute-action.test.ts
```

---

## ⚠️ Risici & Mitigations

| Risiko            | Påvirkning                 | Mitigation                                        |
| ----------------- | -------------------------- | ------------------------------------------------- |
| Flaky E2E tests   | CI failures                | Retry logic, proper waits, deterministic fixtures |
| Slow test suite   | Developer frustration      | Parallel execution, mock external APIs            |
| Test DB pollution | Inconsistent results       | Proper cleanup, transactions, isolated test data  |
| Mock drift        | Tests pass but code breaks | Integration tests med real DB, periodic review    |

---

## 🚦 Rollout Checklist

### Unit Tests

- [ ] execute-action.test.ts implementeret og passing
- [ ] action-idempotency.test.ts implementeret og passing
- [ ] action-audit.test.ts implementeret og passing
- [ ] action-feature-flags.test.ts implementeret og passing
- [ ] action-rbac.test.ts implementeret og passing
- [ ] Coverage >80% for target files
- [ ] All tests run i < 30 sekunder

### E2E Tests

- [ ] action-approval-modal.spec.ts implementeret og passing
- [ ] action-auto-approve.spec.ts implementeret og passing
- [ ] action-preview.spec.ts implementeret og passing
- [ ] Tests kører stabilt (10/10 passes)
- [ ] Test fixtures og helpers oprettet
- [ ] E2E tests integreret i CI

### Infrastructure

- [ ] vitest.config.ts opdateret med coverage thresholds
- [ ] playwright.config.ts opdateret med fixtures
- [ ] Test DB setup dokumenteret
- [ ] CI/CD workflow opdateret
- [ ] Test commands dokumenteret i README

---

## 📊 Success Metrics

- [ ] Unit test coverage >80% for action execution routes
- [ ] All E2E tests pass consistently (10/10 runs)
- [ ] Test suite kører i < 2 minutter (unit + E2E)
- [ ] Zero false positives fra tests
- [ ] Coverage rapporter tilgængelige i CI

---

## 🔗 Related Tasks

- **Blocked by:** Ingen (kan startes nu)
- **Blocks:** Ingen (men forbedrer confidence i alle andre tasks)
- **Related:** `tasks/security/` (RBAC tests), `tasks/ai-metrics/` (usage logging tests)

---

## 📝 Notes for Implementers

- Brug `beforeEach` og `afterEach` til DB cleanup
- Mock eksterne APIs (Gmail, Billy, AI) for deterministic tests
- Use `waitFor` i Playwright for dynamic content
- Create reusable fixtures for common scenarios
- Document test patterns for team consistency
- Consider visual regression tests for modals (future)
- Keep tests independent (no shared state between tests)
