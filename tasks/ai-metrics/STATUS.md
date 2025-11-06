# AI Metrics - Status

## Current Phase: Planning

**Last Updated**: 2025-11-05

## Progress

### Database Schema ⏳ Not Started

- [ ] Create `ai_usage_logs` table migration
- [ ] Extend `conversations` table with usage fields
- [ ] Add indexes for efficient querying
- [ ] Create aggregation view

### Logging Integration ⏳ Not Started

- [ ] Wrap `invokeLLM` with usage logging
- [ ] Add cost estimation logic (model-specific pricing)
- [ ] Handle error cases gracefully
- [ ] Test in dev environment

### Router Updates ⏳ Not Started

- [ ] Update `chat.sendMessage` to log usage
- [ ] Update `chat.executeAction` to log usage
- [ ] Ensure idempotency with action IDs
- [ ] Add tests for logging behavior

### Query Helpers ⏳ Not Started

- [ ] Implement `getUsageByDateRange`
- [ ] Implement `getUsageByConversation`
- [ ] Implement `getUsageByModel`
- [ ] Implement `getTopConversationsByCost`

## Blockers

None currently.

## Next Steps

1. Review and approve PLAN.md
2. Create Drizzle migration for schema changes
3. Implement cost calculation helper with current pricing
4. Integrate logging into `invokeLLM` wrapper
5. Test with small sample in dev

## Notes

- Wait for admin dashboard task before building UI queries
- Consider adding alerts for unusually high usage (future phase)
- Keep an eye on DB performance as logs grow
