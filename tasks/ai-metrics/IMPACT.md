# AI Metrics - Impact Analysis

## Oversigt

Når denne task implementeres, vil følgende dele af systemet blive påvirket:

---

## 🗄️ Database & Migrations

### Nye filer

- `db/migrations/YYYYMMDD_create_ai_usage_logs.sql` - Opretter `ai_usage_logs` tabel
- `db/migrations/YYYYMMDD_extend_conversations_with_usage.sql` - Tilføjer usage felter til `conversations`

### Ændrede filer

- `drizzle/schema.ts` - Tilføj schema definitions for nye felter og tabel
- `drizzle.config.ts` - (ingen ændringer forventet)

### Schema Changes

```sql
-- Ny tabel
CREATE TABLE ai_usage_logs (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id),
  message_id INTEGER REFERENCES messages(id),
  model VARCHAR(100) NOT NULL,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  estimated_cost_usd DECIMAL(10,6) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_ai_usage_logs_conversation ON ai_usage_logs(conversation_id);
CREATE INDEX idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);
CREATE INDEX idx_ai_usage_logs_model ON ai_usage_logs(model);

-- Udvidelse af conversations
ALTER TABLE conversations
  ADD COLUMN total_tokens_used INTEGER DEFAULT 0,
  ADD COLUMN total_cost_usd DECIMAL(10,6) DEFAULT 0,
  ADD COLUMN model_distribution JSONB DEFAULT '{}'::jsonb;
```

---

## 🖥️ Backend / Server

### Nye filer

- `server/helpers/cost-calculator.ts` - Beregner cost baseret på model og tokens
- `server/helpers/usage-logger.ts` - Logger usage til database (wrapper omkring invokeLLM)

### Ændrede filer

#### `server/_core/llm.ts`

**Ændringer:**

- Tilføj logging efter succesfuld LLM call
- Kald `logUsageToDatabase()` med response data
- Håndter fejl i logging (må ikke fejle hele requesten)

**Estimeret LOC:** ~20 linjer tilføjet

#### `server/ai-router.ts`

**Ændringer:**

- Pass conversation_id og message_id til invokeLLM (hvis tilgængelig)
- Metadata tilføjes: `{ taskType, intent, action }`

**Estimeret LOC:** ~10 linjer ændret

#### `server/routers.ts`

**Ændringer i følgende procedures:**

- `chat.sendMessage` - Opdater `conversations.total_tokens_used` og `total_cost_usd` efter AI response
- `chat.executeAction` - Log usage for action execution
- `chat.summarizeEmail` - Log usage for email summarization

**Estimeret LOC:** ~30-40 linjer tilføjet fordelt over 3 procedures

#### `db/helpers.ts` (eller ny fil `db/usage.ts`)

**Nye funktioner:**

```typescript
export async function logAIUsage(data: {
  conversationId?: number;
  messageId?: number;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  metadata?: Record<string, any>;
}): Promise<void>;

export async function getUsageByDateRange(
  startDate: Date,
  endDate: Date
): Promise<UsageSummary[]>;

export async function getUsageByConversation(
  conversationId: number
): Promise<UsageSummary>;

export async function getUsageByModel(
  model: string,
  startDate?: Date,
  endDate?: Date
): Promise<UsageSummary>;

export async function getTopConversationsByCost(
  limit: number
): Promise<ConversationCostSummary[]>;
```

**Estimeret LOC:** ~150-200 linjer ny kode

---

## 🧪 Tests

### Nye filer

- `tests/usage-logger.test.ts` - Unit tests for usage logging
- `tests/cost-calculator.test.ts` - Unit tests for cost calculation
- `tests/integration/ai-usage-flow.test.ts` - Integration test for end-to-end usage tracking

### Test Cases

- [ ] Test at usage logges korrekt ved succesfuld AI call
- [ ] Test at cost beregnes korrekt for Gemini, OpenAI, Claude
- [ ] Test at conversation totals opdateres
- [ ] Test at fejl i logging ikke fejler requesten
- [ ] Test query helpers (getUsageByDateRange, etc.)
- [ ] Test med manglende conversation_id/message_id (optional fields)

**Estimeret LOC:** ~300-400 linjer test kode

---

## 📦 Dependencies

### Nye packages (hvis nødvendigt)

Ingen nye dependencies forventet - bruger eksisterende Drizzle ORM og PostgreSQL.

---

## 🔄 Migration Workflow

1. **Dev:**

   ```bash
   pnpm db:push  # Push schema changes
   pnpm db:migrate  # Run migrations
   ```

2. **Test:**
   - Verificer at tabeller er oprettet
   - Test insert/query operations
   - Validér cost calculations mod faktiske priser

3. **Staging:**
   - Kør migrations
   - Monitor første 24h for errors
   - Sammenlign beregnede costs med faktiske bills

4. **Prod:**
   - Kør migrations i maintenance window (hvis nødvendigt)
   - Feature flag: `ENABLE_USAGE_LOGGING=true`
   - Monitor performance (DB write overhead)

---

## ⚠️ Risici & Mitigations

| Risiko                       | Påvirkning              | Mitigation                              |
| ---------------------------- | ----------------------- | --------------------------------------- |
| DB write overhead            | Performance degradation | Async logging, batch inserts            |
| Cost calculation drift       | Inaccurate reporting    | Monthly reconciliation, update prices   |
| Storage growth               | DB size increase        | Retention policy (archive after 1 year) |
| Logging fejl bryder AI calls | User-facing errors      | Try-catch omkring logging, log errors   |

---

## 🚦 Rollout Checklist

- [ ] Database migrations oprettet og testet
- [ ] Schema changes i Drizzle opdateret
- [ ] Cost calculator implementeret med aktuelle priser
- [ ] Usage logger integreret i invokeLLM
- [ ] Router updates for conversation totals
- [ ] Query helpers implementeret
- [ ] Unit tests skrevet og passing
- [ ] Integration tests skrevet og passing
- [ ] Docs opdateret (hvis relevant)
- [ ] Feature flag konfigureret
- [ ] Monitoring dashboard klar (eller linked til admin-dashboard task)
- [ ] Rollout plan kommunikeret til team
- [ ] Backup taget før prod deployment

---

## 📊 Success Metrics

- [ ] 100% af AI calls logges inden for 48h af deployment
- [ ] Cost variance < 5% vs provider bills (check efter 1 måned)
- [ ] Zero performance regression (p95 latency < baseline + 50ms)
- [ ] No user-facing errors fra logging fejl

---

## 🔗 Related Tasks

- **Blocked by:** Ingen
- **Blocks:** `tasks/admin-dashboard/` (data source for dashboard)
- **Related:** `tasks/logging/` (general observability)

---

## 📝 Notes for Implementers

- Gem model pricing i en konstant eller config fil for nem opdatering
- Log kun metadata der ikke er PII (undgå message content)
- Brug transactions hvor muligt for at sikre data consistency
- Overvej at tilføje en `version` felt til metadata for future schema migrations
- Test med alle tre LLM providers (Gemini, OpenAI, Claude)
