# Performance Guide

Optimering og performance best practices for Tekup Database.

---

## 📊 Performance Metrics

### Target Performance

| Operation | Target | Status |
|-----------|--------|--------|
| Simple query | < 10ms | ✅ |
| Complex query | < 100ms | ✅ |
| Semantic search | < 200ms | ✅ |
| Bulk insert | < 500ms (100 records) | ✅ |
| Migration | < 5min | ✅ |

---

## 🚀 Query Optimization

### Use Select to Limit Fields

```typescript
// ❌ Bad - Fetches all fields
const users = await prisma.user.findMany();

// ✅ Good - Only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
  }
});
```

**Impact:** 50-70% faster, less memory

### Use Pagination

```typescript
// ❌ Bad - Fetches everything
const leads = await prisma.renosLead.findMany();

// ✅ Good - Paginated
const leads = await prisma.renosLead.findMany({
  take: 20,
  skip: page * 20,
  orderBy: { createdAt: 'desc' }
});
```

### Eager Loading vs N+1 Queries

```typescript
// ❌ Bad - N+1 queries
const bookings = await prisma.renosBooking.findMany();
for (const booking of bookings) {
  const customer = await prisma.renosCustomer.findUnique({
    where: { id: booking.customerId }
  });
}

// ✅ Good - Single query with join
const bookings = await prisma.renosBooking.findMany({
  include: {
    customer: true,
  }
});
```

**Impact:** 10x-100x faster for large datasets

---

## 🗄️ Database Optimization

### Indexes

#### Essential Indexes

```prisma
model RenosLead {
  // ...
  
  // Primary key (automatic index)
  @@id([id])
  
  // Foreign keys (automatic with Prisma)
  @@index([customerId])
  
  // Frequently filtered fields
  @@index([status, priority])
  @@index([createdAt])
  
  // Composite index for common query
  @@index([status, createdAt])
}
```

#### Check Index Usage

```sql
-- Find unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexrelname NOT LIKE 'pg_toast%'
ORDER BY tablename;

-- Find missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'vault'
AND n_distinct > 100
ORDER BY abs(correlation) DESC;
```

### Connection Pooling

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Set in DATABASE_URL
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=30"
```

**Recommended Pool Sizes:**

- Small app: 5-10 connections
- Medium app: 10-20 connections
- Large app: 20-50 connections

### Query Performance Analysis

```typescript
// Enable query logging
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
  ],
});

prisma.$on('query', (e) => {
  if (e.duration > 100) {
    console.warn(`Slow query (${e.duration}ms):`, e.query);
  }
});
```

---

## 🔍 Semantic Search Optimization

### Vector Index (pgvector)

```sql
-- Create IVFFlat index for faster similarity search
CREATE INDEX ON vault.embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- For even faster (but less accurate) search
CREATE INDEX ON vault.embeddings 
USING hnsw (embedding vector_cosine_ops);
```

### Optimize Search Parameters

```typescript
// ❌ Slow - Searches everything
const results = await prisma.$queryRaw`
  SELECT id, embedding <=> ${queryEmbedding}::vector as distance
  FROM vault.embeddings
  ORDER BY distance
  LIMIT 10
`;

// ✅ Fast - Use index with probes
const results = await prisma.$queryRaw`
  SET ivfflat.probes = 10;
  SELECT id, embedding <=> ${queryEmbedding}::vector as distance
  FROM vault.embeddings
  ORDER BY distance
  LIMIT 10
`;
```

---

## 💾 Caching Strategies

### Application-Level Cache

```typescript
import { LRUCache } from 'lru-cache';

const cache = new LRUCache({
  max: 500, // Max items
  ttl: 1000 * 60 * 5, // 5 minutes
});

export async function getOrganization(id: string) {
  // Check cache first
  const cached = cache.get(id);
  if (cached) return cached;
  
  // Fetch from database
  const org = await prisma.billyOrganization.findUnique({
    where: { id }
  });
  
  // Store in cache
  if (org) cache.set(id, org);
  
  return org;
}
```

### Database-Level Cache (Billy Schema)

```typescript
// Already implemented in Billy client
export async function getCachedInvoice(orgId: string, billyId: string) {
  const cached = await prisma.billyCache.findUnique({
    where: {
      organizationId_cacheKey: {
        organizationId: orgId,
        cacheKey: `invoice:${billyId}`,
      },
    },
  });
  
  if (!cached) return null;
  
  // Check expiration
  if (cached.expiresAt < new Date()) {
    await prisma.billyCache.delete({ where: { id: cached.id } });
    return null;
  }
  
  return cached.data;
}
```

### Cache Invalidation

```typescript
// Clear cache on update
export async function updateOrganization(id: string, data: any) {
  const updated = await prisma.billyOrganization.update({
    where: { id },
    data,
  });
  
  // Invalidate cache
  cache.delete(id);
  
  return updated;
}
```

---

## 📈 Bulk Operations

### Batch Inserts

```typescript
// ❌ Slow - Multiple inserts
for (const item of items) {
  await prisma.renosLead.create({ data: item });
}

// ✅ Fast - Single bulk insert
await prisma.renosLead.createMany({
  data: items,
  skipDuplicates: true,
});
```

**Impact:** 10x-50x faster

### Batch Updates

```typescript
// ❌ Slow - Multiple updates
for (const id of ids) {
  await prisma.renosLead.update({
    where: { id },
    data: { status: 'processed' }
  });
}

// ✅ Fast - Single bulk update
await prisma.renosLead.updateMany({
  where: { id: { in: ids } },
  data: { status: 'processed' }
});
```

### Transactions for Consistency

```typescript
// Use transactions for multi-step operations
await prisma.$transaction(async (tx) => {
  const booking = await tx.renosBooking.create({ data: bookingData });
  const invoice = await tx.renosInvoice.create({ data: invoiceData });
  await tx.renosCustomer.update({
    where: { id: customerId },
    data: { totalBookings: { increment: 1 } }
  });
});
```

---

## 🔧 Monitoring

### Query Performance

```typescript
import { performance } from 'perf_hooks';

export async function withTiming<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const duration = performance.now() - start;
    if (duration > 100) {
      console.warn(`${name} took ${duration.toFixed(2)}ms`);
    }
  }
}

// Usage
const leads = await withTiming('findLeads', () => 
  renos.findLeads({ status: 'new' })
);
```

### Database Metrics

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Long-running queries
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active'
AND now() - query_start > interval '5 seconds'
ORDER BY duration DESC;

-- Table sizes
SELECT schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname IN ('vault', 'billy', 'renos')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Cache hit ratio
SELECT 
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit) as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;
```

---

## 🎯 Performance Testing

### Load Testing

```typescript
import { performance } from 'perf_hooks';

async function loadTest() {
  const operations = 1000;
  const start = performance.now();
  
  await Promise.all(
    Array.from({ length: operations }, async () => {
      await renos.findLeads({ limit: 10 });
    })
  );
  
  const duration = performance.now() - start;
  const opsPerSecond = operations / (duration / 1000);
  
  console.log(`${opsPerSecond.toFixed(0)} ops/sec`);
}
```

### Benchmarking

```bash
# Install benchmarking tool
pnpm add -D tinybench

# Run benchmarks
pnpm bench
```

---

## 📋 Performance Checklist

### Query Optimization

- [ ] Use `select` to limit fields
- [ ] Add pagination for large datasets
- [ ] Avoid N+1 queries (use `include`)
- [ ] Use indexes for filtered fields
- [ ] Monitor slow queries (>100ms)

### Database

- [ ] Connection pooling configured
- [ ] Indexes on foreign keys
- [ ] Indexes on frequently queried fields
- [ ] Regular VACUUM and ANALYZE
- [ ] Monitor table sizes

### Caching

- [ ] Cache frequently accessed data
- [ ] Implement cache invalidation
- [ ] Set appropriate TTLs
- [ ] Monitor cache hit rates

### Application

- [ ] Use batch operations
- [ ] Implement transactions
- [ ] Monitor memory usage
- [ ] Profile slow endpoints

---

## 🚀 Quick Wins

1. **Add missing indexes** - 10x improvement
2. **Use connection pooling** - 5x improvement
3. **Implement caching** - 10x improvement
4. **Batch operations** - 50x improvement
5. **Use `select`** - 2x improvement

---

**Last Updated:** 2025-10-21  
**Version:** 1.0.0
