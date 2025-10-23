# Deployment Guide

Deploy Tekup Database to production environments.

---

## Table of Contents

1. [Render.com Deployment](#rendercom-deployment)
2. [Environment Variables](#environment-variables)
3. [Database Migrations](#database-migrations)
4. [Service Integration](#service-integration)
5. [Monitoring](#monitoring)
6. [Backup Strategy](#backup-strategy)

---

## Render.com Deployment

### 1. Create PostgreSQL Database

1. **Log in to Render.com**
   - Go to https://render.com
   - Navigate to Dashboard

2. **Create New PostgreSQL**
   - Click "New +" → "PostgreSQL"
   - Name: `tekup-database-prod`
   - Plan: Choose based on needs (start with Starter)
   - Region: Frankfurt (EU) for GDPR compliance
   - PostgreSQL Version: 16

3. **Note Connection Details**
   ```
   Internal Database URL: postgresql://...
   External Database URL: postgresql://...
   ```

### 2. Configure Database

**Connect to database:**
```bash
psql "postgresql://user:pass@host/database"
```

**Install pgvector:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**Create schemas:**
```sql
CREATE SCHEMA IF NOT EXISTS vault;
CREATE SCHEMA IF NOT EXISTS billy;
CREATE SCHEMA IF NOT EXISTS renos;
CREATE SCHEMA IF NOT EXISTS crm;
CREATE SCHEMA IF NOT EXISTS flow;
CREATE SCHEMA IF NOT EXISTS shared;
```

### 3. Run Migrations

**From local machine:**

1. **Update .env:**
   ```bash
   DATABASE_URL="postgresql://user:pass@host/database"
   ```

2. **Run migrations:**
   ```bash
   pnpm prisma migrate deploy
   ```

3. **Verify:**
   ```bash
   pnpm db:health
   ```

### 4. Configure render.yaml

The `render.yaml` file is already configured:

```yaml
databases:
  - name: tekup-database
    databaseName: tekup_db
    plan: starter
    region: frankfurt
    ipAllowList: []
```

**Deploy via Git:**
```bash
# Already done in previous steps
git push origin main
```

---

## Environment Variables

### Required Variables

**For each service connecting to the database:**

```bash
# Production
DATABASE_URL="postgresql://user:pass@host:port/database?sslmode=require"

# Optional: Direct schema URL
VAULT_DATABASE_URL="postgresql://user:pass@host:port/database?schema=vault&sslmode=require"
BILLY_DATABASE_URL="postgresql://user:pass@host:port/database?schema=billy&sslmode=require"
```

### Connection Pool Settings

```bash
# For high-traffic services
DATABASE_URL="postgresql://user:pass@host:port/database?connection_limit=10&pool_timeout=30"
```

### SSL Configuration

**Production (required):**
```bash
DATABASE_URL="...?sslmode=require"
```

**Local development:**
```bash
DATABASE_URL="...?sslmode=disable"
```

---

## Database Migrations

### Strategy

**Development:**
```bash
pnpm prisma migrate dev --name <migration_name>
```

**Staging/Production:**
```bash
pnpm prisma migrate deploy
```

### Pre-Migration Checklist

- [ ] Test migration on staging database
- [ ] Create database backup
- [ ] Check for breaking changes
- [ ] Notify team of downtime (if any)
- [ ] Review migration SQL

### Migration Process

1. **Create backup:**
   ```bash
   pnpm db:backup
   ```

2. **Test on staging:**
   ```bash
   DATABASE_URL="<staging_url>" pnpm prisma migrate deploy
   ```

3. **Deploy to production:**
   ```bash
   DATABASE_URL="<production_url>" pnpm prisma migrate deploy
   ```

4. **Verify:**
   ```bash
   DATABASE_URL="<production_url>" pnpm db:health
   ```

### Rollback Strategy

**If migration fails:**

1. **Restore from backup:**
   ```bash
   pnpm db:restore ./backups/backup-YYYYMMDD-HHMMSS.sql
   ```

2. **Or manually revert:**
   ```sql
   -- Review migration SQL and create reverse
   ALTER TABLE schema.table DROP COLUMN new_column;
   ```

---

## Service Integration

### TekupVault Integration

**Update service .env:**
```bash
DATABASE_URL="postgresql://...?schema=vault"
```

**Update code:**
```typescript
import { vault } from '@tekup/database';

// Replace old database calls
const docs = await vault.findDocuments({ source: 'github' });
```

### Tekup-Billy Integration

**Update MCP server:**
```typescript
import { billy } from '@tekup/database';

// Replace Supabase calls
const org = await billy.findOrganization(billyOrgId);
```

### RenOS Integration

**Update AI assistant:**
```typescript
import { renos } from '@tekup/database';

// Use new client
const leads = await renos.findLeads({ priority: 'high' });
```

---

## Monitoring

### Health Checks

**Add health check endpoint:**
```typescript
import { prisma } from '@tekup/database';

app.get('/health/database', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'healthy', timestamp: new Date() });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});
```

### Metrics to Monitor

- **Connection pool utilization**
- **Query performance** (slow queries > 1s)
- **Database size growth**
- **Cache hit rate** (for Billy schema)
- **Failed queries**

### Logging

**Enable Prisma logging:**
```typescript
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
  ],
});

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Duration: ' + e.duration + 'ms');
});
```

---

## Backup Strategy

### Automated Backups

**Render.com includes daily backups**, but create additional backups for critical operations.

**Manual backup:**
```bash
pnpm db:backup
```

**Automated backup (cron):**
```bash
# Add to crontab
0 2 * * * cd /path/to/tekup-database && pnpm db:backup
```

### Backup Schedule

- **Daily:** Automatic (Render.com)
- **Weekly:** Manual full backup
- **Before migrations:** Always
- **Before schema changes:** Always

### Backup Storage

**Recommended:**
- Store in S3/Spaces/Azure Blob
- Keep minimum 30 days
- Encrypt backups
- Test restore regularly

---

## Performance Optimization

### Indexes

**Review query patterns and add indexes:**
```prisma
model RenosLead {
  // ...
  @@index([status, priority])
  @@index([customerId])
  @@index([createdAt])
}
```

### Connection Pooling

**Adjust pool size based on load:**
```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=20',
    },
  },
});
```

### Query Optimization

**Use `select` to reduce data transfer:**
```typescript
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    // Don't fetch unnecessary fields
  },
});
```

---

## Security Checklist

- [ ] SSL/TLS enabled (sslmode=require)
- [ ] Strong database password
- [ ] Connection string in environment variables (never in code)
- [ ] IP whitelist configured (if needed)
- [ ] Database user has minimal required permissions
- [ ] Audit logging enabled
- [ ] Regular security updates
- [ ] Encrypted backups

---

## Production Readiness

### Before Go-Live

- [ ] All migrations tested on staging
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Health checks implemented
- [ ] Documentation updated
- [ ] Team trained on new system
- [ ] Rollback plan documented
- [ ] Load testing completed

### Go-Live Process

1. **Schedule maintenance window**
2. **Create backup of old system**
3. **Run migrations**
4. **Update service environment variables**
5. **Deploy updated services**
6. **Verify health checks**
7. **Monitor for 24 hours**
8. **Document any issues**

---

## Support

**Issues:** https://github.com/TekupDK/tekup/issues  
**Documentation:** See README.md, TROUBLESHOOTING.md  
**Render Support:** https://render.com/docs

---

**Last Updated:** 2025-10-21  
**Version:** 1.0.0
