# AI Metrics & Token Tracking

## Rationale

For at kunne monitere omkostninger og optimere LLM forbrug, skal vi persistere token usage data fra alle AI interaktioner. Dette giver os mulighed for:

- Cost monitoring og budgettering
- Model performance comparison (Gemini vs OpenAI vs Claude)
- Conversation-level analytics
- Anomaly detection (unusually high token usage)
- ROI beregninger per kunde/feature

## Current State

- `invokeLLM` i `server/_core/llm.ts` returnerer allerede `usage` felter (prompt_tokens, completion_tokens, total_tokens)
- Disse data bliver ikke gemt - kun brugt i runtime
- Ingen cost estimates eller aggregering

## Goals

- [ ] Opret `ai_usage_logs` tabel til at gemme token metrics
- [ ] Udvid `conversations` tabel med aggregeret usage summary
- [ ] Capture model, tokens, og estimated cost for hver AI call
- [ ] Add index for efficient querying (by date, user, model, conversation)
- [ ] Bevar historiske data for trend analysis

## Schema Design

```typescript
// New table: ai_usage_logs
{
  id: serial primary key
  conversation_id: int references conversations(id)
  message_id: int references messages(id) nullable
  model: varchar (gemini-2.5-flash, gpt-4o-mini, etc)
  prompt_tokens: int
  completion_tokens: int
  total_tokens: int
  estimated_cost_usd: decimal(10,6)
  created_at: timestamp
  metadata: jsonb (task_type, intent, action, etc)
}

// Extend conversations table
{
  ...existing fields...
  total_tokens_used: int default 0
  total_cost_usd: decimal(10,6) default 0
  model_distribution: jsonb // { "gemini-2.5-flash": 1500, "gpt-4o": 500 }
}
```

## Implementation Steps

1. **Database Migration**
   - [ ] Create `ai_usage_logs` table with proper indexes
   - [ ] Add columns to `conversations` table
   - [ ] Create view for aggregated metrics

2. **Logging Integration**
   - [ ] Wrap `invokeLLM` return to log usage to DB
   - [ ] Add cost estimation based on model pricing
   - [ ] Handle both successful and failed calls
   - [ ] Batch insert for performance (optional)

3. **Router Integration**
   - [ ] Update `chat.sendMessage` to increment conversation totals
   - [ ] Update `chat.executeAction` to log action-specific usage
   - [ ] Ensure idempotency (don't double-log retries)

4. **Query Helpers**
   - [ ] `getUsageByDateRange(startDate, endDate)`
   - [ ] `getUsageByConversation(conversationId)`
   - [ ] `getUsageByModel(model)`
   - [ ] `getTopConversationsByCost(limit)`

## Acceptance Criteria

- [x] Schema migration runs without errors
- [ ] Every AI call logs usage to database
- [ ] Cost estimates are accurate (±5% of actual bills)
- [ ] Queries perform well (<100ms for date range aggregations)
- [ ] No PII leaks in metadata field
- [ ] Backward compatible (no breaking changes to existing routes)

## Risks & Mitigations

| Risk                   | Mitigation                               |
| ---------------------- | ---------------------------------------- |
| DB write overhead      | Async logging, batch inserts if needed   |
| Cost calculation drift | Monthly reconciliation with actual bills |
| Storage growth         | Retention policy (archive after 1 year)  |
| Privacy concerns       | Don't log message content, only metadata |

## Dependencies

- Drizzle ORM migrations
- Access to model pricing sheets (Gemini/OpenAI/Claude)
- DB backup before schema changes

## Rollout Plan

1. **Dev**: Test migration and logging
2. **Staging**: Validate cost estimates vs actual usage
3. **Prod**: Deploy with feature flag, monitor for 48h
4. **Backfill**: Optionally estimate historical usage (best-effort)

## Success Metrics

- 100% of AI calls logged within 24h of deployment
- Cost variance < 5% vs provider bills
- Zero performance regression in chat latency
- Dashboard queries < 200ms p95

## Links

- Related: `tasks/admin-dashboard/` for UI consumption
- Code: `server/_core/llm.ts`, `server/routers.ts`
- Docs: [LLM Integration](../../EMAIL_FUNCTIONS_DOCUMENTATION.md)
