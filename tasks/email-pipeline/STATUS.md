# Email Pipeline – Status

Dato: 4. november 2025  
Owner: Backend

Status: [ ] Not started – Supabase/Drizzle mismatch still blocks transition logging.

## TODO

- [ ] Write migration that renames `transitionedBy` → `triggeredBy` in `friday_ai.email_pipeline_transitions`.
- [ ] Update `drizzle/schema.ts` + regenerate snapshots to match.
- [ ] Verify pipeline stage changes persist (manual regression in UI + Supabase table check).

## New Task: Inbox DB-First Caching (2025-11-05)

Status: ⏳ Not Started

### Cache Invalidation

- [ ] Extend webhook to mark stale threads
- [ ] Add `needs_sync` flag to schema
- [ ] Implement lazy refresh on stale access

### Background Sync (Optional)

- [ ] Design cron job for high-priority threads
- [ ] Implement batch API calls with quota handling
- [ ] Configure sync frequency per environment

### Testing

- [ ] Unit tests for DB query path
- [ ] Unit tests for API fallback
- [ ] Integration tests for webhook invalidation
- [ ] Load test with 1000 threads

### Monitoring

- [ ] Add cache hit/miss metrics
- [ ] API quota alerting
- [ ] Dashboard for thread freshness
