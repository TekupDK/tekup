# Email Pipeline - Impact Analysis (Inbox Caching Optimization)

## Oversigt

Optimering af inbox DB-first caching strategi med forbedret cache invalidation, webhook-baseret sync, og monitoring.

---

## 🗄️ Database & Migrations

### Ændrede tabeller

#### `email_threads` tabel

**Nye kolonner:**

```sql
ALTER TABLE email_threads
  ADD COLUMN needs_sync BOOLEAN DEFAULT FALSE,
  ADD COLUMN last_synced_at TIMESTAMP,
  ADD COLUMN sync_error TEXT,
  ADD COLUMN cache_version INTEGER DEFAULT 1;

CREATE INDEX idx_email_threads_needs_sync ON email_threads(needs_sync) WHERE needs_sync = TRUE;
CREATE INDEX idx_email_threads_last_synced ON email_threads(last_synced_at);
```

### Nye filer

- `db/migrations/YYYYMMDD_add_email_cache_fields.sql`

### Ændrede filer

- `drizzle/schema.ts` - Tilføj nye felter til emailThreads definition

**Estimeret LOC:** ~20 linjer tilføjet

---

## 🖥️ Backend / Server

### Ændrede filer

#### `server/routers.ts` (inbox routes)

**Nuværende flow:**

1. Query `email_threads` fra DB
2. Hvis ikke fundet → fetch fra Gmail API
3. Returner data

**Ny flow:**

1. Query `email_threads` fra DB
2. Check `needs_sync` flag og `last_synced_at`
3. Hvis stale (eller needs_sync=true) → fetch fra Gmail API og opdater DB
4. Returner data med freshness indicator

**Ændringer i `inbox.getThreads`:**

```typescript
// Før:
const threads = await db.query.emailThreads.findMany({ ... });
if (!threads.length) {
  // Fallback til Gmail API
}

// Efter:
const threads = await db.query.emailThreads.findMany({ ... });
const staleThreads = threads.filter(t =>
  t.needsSync ||
  !t.lastSyncedAt ||
  (Date.now() - t.lastSyncedAt) > CACHE_TTL
);

if (staleThreads.length > 0) {
  await refreshThreadsFromGmail(staleThreads);
}
```

**Estimeret LOC:** ~50-100 linjer ændret/tilføjet

**Nye helper funktioner:**

- `async function refreshThreadsFromGmail(threads: EmailThread[])`
- `async function markThreadsAsStale(threadIds: string[])`
- `function isThreadStale(thread: EmailThread): boolean`

**Estimeret LOC:** ~100-150 linjer nye helpers

#### `server/_core/index.ts` (webhook handler)

**Nuværende webhook:**

```typescript
app.post("/api/inbound/email", async (req, res) => {
  // Process inbound email
  // Store i DB
});
```

**Udvidet webhook:**

```typescript
app.post("/api/inbound/email", async (req, res) => {
  // Process inbound email
  // Store i DB

  // NY: Mark affected threads as needs_sync
  const affectedThreadIds = extractThreadIds(req.body);
  await markThreadsAsStale(affectedThreadIds);

  // NY: Trigger real-time updates (WebSocket/SSE hvis implementeret)
});
```

**Estimeret LOC:** ~30-50 linjer tilføjet

### Nye filer (optional)

#### `server/jobs/email-sync.ts` (Background sync job)

**Indhold:**

```typescript
// Cron job der syncer high-priority threads
export async function syncHighPriorityThreads() {
  const threads = await db.query.emailThreads.findMany({
    where: or(
      eq(emailThreads.starred, true),
      eq(emailThreads.unread, true),
      eq(emailThreads.needsSync, true)
    ),
    limit: 100,
  });

  // Batch fetch fra Gmail API
  await batchRefreshThreads(threads);
}

// Kør hver 15. minut i dev, 5. minut i prod
```

**Estimeret LOC:** ~150-200 linjer

**Setup:**

- Brug node-cron eller lignende
- Konfigurer via ENV: `EMAIL_SYNC_INTERVAL_MINUTES`
- Graceful shutdown support

---

## 📊 Monitoring & Metrics

### Nye filer

#### `server/metrics/email-cache.ts`

**Metrics at tracke:**

```typescript
export const emailCacheMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  apiCalls: 0,
  avgThreadFreshness: 0, // milliseconds
  stalThreadsRefreshed: 0,
  webhookInvalidations: 0,
};

export function recordCacheHit() { ... }
export function recordCacheMiss() { ... }
export function recordApiCall() { ... }
export function getMetricsSummary() { ... }
```

**Estimeret LOC:** ~100-150 linjer

**Integration i routers:**

- Call `recordCacheHit()` når DB data bruges
- Call `recordCacheMiss()` når Gmail API kaldes
- Call `recordApiCall()` ved hver Gmail request

---

## 🧪 Tests

### Nye test filer

#### `tests/inbox/cache-invalidation.test.ts`

**Test cases:**

- Webhook event markerer threads som needs_sync
- Stale threads refreshes automatisk ved næste access
- Fresh threads bruges fra cache (ingen API call)
- Cache TTL respekteres

**Estimeret LOC:** ~150-200 linjer

#### `tests/inbox/db-first-fallback.test.ts`

**Test cases:**

- DB hit path (ingen API call)
- DB miss path (fallback til API)
- Mixed scenario (nogle i DB, nogle ikke)
- API error handling (graceful degradation)

**Estimeret LOC:** ~150-200 linjer

#### `tests/inbox/background-sync.test.ts` (hvis background job implementeres)

**Test cases:**

- High-priority threads synces
- Batch API calls respekterer quota
- Sync errors håndteres gracefully
- Concurrent sync requests håndteres

**Estimeret LOC:** ~150-200 linjer

### Integration tests

#### `tests/integration/inbox-webhook.test.ts`

**Test cases:**

- Inbound email via webhook opdaterer DB
- Affected threads markeres som stale
- Næste inbox query fetcher fresh data

**Estimeret LOC:** ~100-150 linjer

---

## 🚀 API Rate Limiting

### Gmail API Quota Management

**Current quotas (Google Workspace):**

- 250 requests/user/second
- 1,000,000,000 quota units/day

**Mitigation strategies:**

```typescript
// Exponential backoff ved rate limit
async function fetchWithBackoff(fn: () => Promise<any>, retries = 3) {
  try {
    return await fn();
  } catch (error) {
    if (error.code === 429 && retries > 0) {
      await sleep(2 ** (3 - retries) * 1000);
      return fetchWithBackoff(fn, retries - 1);
    }
    throw error;
  }
}

// Batch requests
async function batchRefreshThreads(threads: EmailThread[]) {
  const BATCH_SIZE = 10;
  for (let i = 0; i < threads.length; i += BATCH_SIZE) {
    const batch = threads.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(t => refreshThread(t)));
    await sleep(100); // Rate limit padding
  }
}
```

**Estimeret LOC:** ~50-100 linjer nye helpers

---

## 📈 Performance Optimizations

### Database Indexes

**Allerede tilføjet:**

- `idx_email_threads_needs_sync` (WHERE needs_sync = TRUE)
- `idx_email_threads_last_synced`

**Ekstra indexes (hvis nødvendigt):**

```sql
CREATE INDEX idx_email_threads_user_unread ON email_threads(user_id, unread);
CREATE INDEX idx_email_threads_user_starred ON email_threads(user_id, starred);
```

### Query Optimizations

- Brug `SELECT` med kun nødvendige felter (ikke `SELECT *`)
- Limit queries med pagination
- Use connection pooling for DB

---

## 🔧 Configuration

### Nye ENV variables

```bash
# Cache TTL (milliseconds)
EMAIL_CACHE_TTL_MS=3600000  # 1 hour

# Background sync interval (minutes)
EMAIL_SYNC_INTERVAL_MINUTES=15  # dev: 15, prod: 5

# Batch size for API calls
EMAIL_SYNC_BATCH_SIZE=10

# Enable/disable background sync
EMAIL_ENABLE_BACKGROUND_SYNC=true
```

Add til `server/_core/env.ts`:

```typescript
emailCacheTtlMs: parseInt(process.env.EMAIL_CACHE_TTL_MS || '3600000'),
emailSyncIntervalMinutes: parseInt(process.env.EMAIL_SYNC_INTERVAL_MINUTES || '15'),
emailSyncBatchSize: parseInt(process.env.EMAIL_SYNC_BATCH_SIZE || '10'),
emailEnableBackgroundSync: process.env.EMAIL_ENABLE_BACKGROUND_SYNC === 'true',
```

---

## 🚦 Rollout Checklist

### Database

- [ ] Migration oprettet for nye felter
- [ ] Indexes tilføjet
- [ ] Schema opdateret i Drizzle
- [ ] Migration testet i dev

### Backend

- [ ] inbox.getThreads opdateret med stale check
- [ ] Webhook handler udvided med invalidation
- [ ] Helper functions implementeret
- [ ] Background sync job (hvis inkluderet)
- [ ] Rate limiting/backoff implementeret
- [ ] Metrics tracking implementeret

### Tests

- [ ] Cache invalidation tests passing
- [ ] DB-first fallback tests passing
- [ ] Background sync tests passing (hvis relevant)
- [ ] Integration tests passing
- [ ] Load tests med 1000 threads

### Monitoring

- [ ] Metrics dashboard klar (eller linked til admin-dashboard)
- [ ] API quota alerting konfigureret
- [ ] Cache hit rate logging
- [ ] Thread freshness metrics

### Configuration

- [ ] ENV variables dokumenteret
- [ ] Defaults sat for dev/prod
- [ ] Feature flag for background sync

---

## ⚠️ Risici & Mitigations

| Risiko                   | Påvirkning            | Mitigation                                      |
| ------------------------ | --------------------- | ----------------------------------------------- |
| Gmail API rate limits    | Service degradation   | Exponential backoff, batch requests, monitoring |
| Background sync overhead | DB/CPU load           | Configurable intervals, batch size limits       |
| Stale data shown         | User confusion        | Clear "last synced" timestamps in UI            |
| Webhook failures         | Cache not invalidated | Periodic full sync, manual refresh button       |
| DB storage growth        | Cost increase         | Archive old threads, retention policy           |

---

## 📊 Success Metrics

- [ ] Cache hit rate >80% for recently accessed threads
- [ ] API fallback completes in <2s p95
- [ ] Webhook events invalidate cache within 5 seconds
- [ ] No stale data shown for threads modified in last 1 hour
- [ ] API quota usage stays below 50% of limit
- [ ] Background sync (if enabled) completes in <30 seconds

---

## 🔗 Related Tasks

- **Blocked by:** Ingen
- **Blocks:** Ingen
- **Related:** `tasks/logging/` (metrics), `tasks/ops/` (monitoring)

---

## 📝 Notes for Implementers

- Start med webhook invalidation (høj værdi, lav kompleksitet)
- Background sync er optional (can defer hvis ikke nødvendigt)
- Monitor API quota dagligt i første uge efter deployment
- Consider WebSocket/SSE for real-time updates (future enhancement)
- Test med large mailboxes (1000+ threads) for performance
- Document cache behavior for team and end users
- Add manual "Refresh" button i UI for user control
