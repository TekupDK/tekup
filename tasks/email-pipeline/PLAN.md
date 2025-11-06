# Email Pipeline – Plan

Context: Gmail → DB migration; userId scoping; thread linking.

## Goals

- Deterministic migrations with verifiable pre/post state.

## Acceptance criteria

- [ ] Timestamps normalized to ISO; indexes present.
- [ ] Thread and message linkage consistent by userId.
- [ ] `email_pipeline_transitions` writes succeed with aligned column names.

## Steps (suggested)

- [ ] Keep schema and SQL migration aligned; push first, then migrate.
- [ ] Use `migrate:check` snapshots for verification.
- [ ] Create migration to rename `transitionedBy` → `triggeredBy` and update Drizzle schema.

## New Tasks

### Inbox DB-First Caching Optimization

**Context**: `inbox.getThreads` uses DB-first strategy with Gmail API fallback. This improves performance but needs optimization for cache invalidation and freshness.

**Current Behavior**:

- Queries `email_threads` table first
- Falls back to Gmail API if not found
- Webhook at `/api/inbound/email` updates DB on new emails

**Goals**:

- [ ] Add comprehensive tests for DB-first fallback logic
- [ ] Implement cache invalidation on webhook events (new email, label change)
- [ ] Add cache freshness indicators (e.g., `last_synced_at` column)
- [ ] Background sync job to refresh threads periodically (optional)
- [ ] Metrics: track cache hit rate vs API fallback rate
- [ ] Handle Gmail API rate limits gracefully (exponential backoff)

**Implementation Steps**:

1. **Cache Invalidation**
   - [ ] Extend webhook handler to mark affected threads as stale
   - [ ] Add `needs_sync` boolean flag to `email_threads`
   - [ ] Lazy refresh: fetch from API when stale thread is accessed

2. **Background Sync (Optional)**
   - [ ] Cron job to sync high-priority threads (starred, unread)
   - [ ] Batch API calls to stay within quota
   - [ ] Configurable sync frequency (every 15min in dev, 5min in prod)

3. **Testing**
   - [ ] Unit test: verify DB query path
   - [ ] Unit test: verify API fallback path
   - [ ] Integration test: webhook updates trigger cache invalidation
   - [ ] Load test: simulate 1000 threads with 50/50 cache hit rate

4. **Monitoring**
   - [ ] Log cache hit/miss rates daily
   - [ ] Alert on API quota approaching limits
   - [ ] Dashboard metric: avg thread freshness

**Acceptance Criteria**:

- [ ] Cache hit rate > 80% for recently accessed threads
- [ ] API fallback completes in < 2s p95
- [ ] Webhook events invalidate cache within 5 seconds
- [ ] No stale data shown for threads modified in last 1 hour
- [ ] Tests cover all cache paths (hit, miss, invalidation)
