# Database Migration Guide

Complete guide til at migrere eksisterende databaser til Tekup Central Database.

---

## 📋 Overview

Denne guide dækker migration af:

1. **TekupVault** - PostgreSQL + pgvector → `vault` schema
2. **Tekup-Billy** - Supabase → `billy` schema  
3. **RenOS** - Prisma PostgreSQL → `renos` schema
4. **CRM** - Prisma PostgreSQL → `crm` schema
5. **Flow API** - Prisma PostgreSQL → `flow` schema

---

## 🎯 Pre-Migration Checklist

### Before You Start

- [ ] Backup all existing databases
- [ ] Test migration on staging environment first
- [ ] Have rollback plan ready
- [ ] Notify team about planned maintenance
- [ ] Verify all services can handle downtime

### Requirements

- [ ] Node.js 18+ installed
- [ ] pnpm installed
- [ ] PostgreSQL client (psql) installed
- [ ] Access to all source databases
- [ ] Access to target tekup-database
- [ ] At least 2x source database size free disk space

---

## 1️⃣ TekupVault Migration

**Complexity:** 🟡 Medium  
**Estimated Time:** 2-4 hours  
**Downtime Required:** Yes (~30 minutes)

### Current State

```
Source: Supabase Paris (eu-west-3)
Database: PostgreSQL 15 + pgvector
Tables: vault_documents, vault_embeddings, vault_sync_status
Size: ~100-200 MB
```

### Migration Steps

#### Step 1: Export Data

```bash
# Export from Supabase
pg_dump "$SOURCE_VAULT_URL" \
  --schema=public \
  --table=vault_documents \
  --table=vault_embeddings \
  --table=vault_sync_status \
  > vault_export.sql
```

#### Step 2: Transform Schema Names

```bash
# Replace schema references
sed -i 's/public\./vault./g' vault_export.sql

# Or use Python script
python3 << 'EOF'
with open('vault_export.sql', 'r') as f:
    content = f.read()
    
content = content.replace('public.', 'vault.')
content = content.replace('SET search_path = public', 'SET search_path = vault')

with open('vault_export_transformed.sql', 'w') as f:
    f.write(content)
EOF
```

#### Step 3: Import to Target

```bash
# Import to tekup-database
psql "$TARGET_DATABASE_URL" < vault_export_transformed.sql
```

#### Step 4: Verify Data

```bash
# Check row counts match
psql "$TARGET_DATABASE_URL" << 'EOF'
SELECT 'documents' as table_name, COUNT(*) FROM vault.documents
UNION ALL
SELECT 'embeddings', COUNT(*) FROM vault.embeddings
UNION ALL
SELECT 'sync_status', COUNT(*) FROM vault.sync_status;
EOF
```

#### Step 5: Update Application

```typescript
// apps/vault-api/.env
DATABASE_URL=postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=vault

// No code changes needed - Prisma handles schema automatically
```

#### Step 6: Test & Deploy

```bash
cd c:/Users/empir/TekupVault
pnpm db:generate
pnpm test
pnpm build
# Deploy to Render.com
```

---

## 2️⃣ Tekup-Billy Migration

**Complexity:** 🟡 Medium  
**Estimated Time:** 2-3 hours  
**Downtime Required:** Yes (~20 minutes)

### Current State

```
Source: Supabase Frankfurt (RenOS project)
Database: PostgreSQL 16
Tables: billy_* (8 tables)
Size: ~50-100 MB
```

### Migration Steps

#### Step 1: Export Data

```bash
pg_dump "$SOURCE_BILLY_URL" \
  --table='billy_*' \
  > billy_export.sql
```

#### Step 2: Import to Target

```bash
# Billy tables should already have billy_ prefix
# Just need to set schema
sed -i 's/SET search_path = public/SET search_path = billy/g' billy_export.sql

psql "$TARGET_DATABASE_URL" < billy_export.sql
```

#### Step 3: Preserve Encryption Keys

```bash
# CRITICAL: Copy encryption configuration
# From old .env to new .env
ENCRYPTION_KEY=<same-as-before>
ENCRYPTION_SALT=<same-as-before>
```

#### Step 4: Update Application

```typescript
// Tekup-Billy/.env
DATABASE_URL=postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=billy

// Encryption keys MUST match
ENCRYPTION_KEY=<preserved-from-old-env>
ENCRYPTION_SALT=<preserved-from-old-env>
```

#### Step 5: Test MCP Tools

```bash
cd c:/Users/empir/Tekup-Billy
pnpm test:integration
pnpm start:http

# Test a few MCP tools
curl -X POST http://localhost:3000/api/v1/tools/list_invoices \
  -H "X-API-Key: $MCP_API_KEY"
```

---

## 3️⃣ RenOS Migration

**Complexity:** 🔴 High  
**Estimated Time:** 6-8 hours  
**Downtime Required:** Yes (~1-2 hours)

### Current State

```
Source: Separate PostgreSQL
Database: PostgreSQL 14/15
Models: 22 models (536 lines schema)
Size: Unknown (estimate 500MB-2GB)
```

### Migration Strategy

**Option A: Prisma Migrate (Recommended)**

```bash
# 1. Update RenOS Prisma schema to use tekup-database
cd c:/Users/empir/Tekup Google AI

# 2. Update datasource
# prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["renos"]
}

# 3. Add @@schema("renos") to all models
model Lead {
  // ... fields
  @@map("leads")
  @@schema("renos")
}

# 4. Generate migration
pnpm prisma migrate diff \
  --from-url="$OLD_DATABASE_URL" \
  --to-schema-datamodel="prisma/schema.prisma" \
  --script > migration.sql

# 5. Review and run migration
psql "$NEW_DATABASE_URL" < migration.sql
```

**Option B: pg_dump/restore**

```bash
# 1. Export all RenOS tables
pg_dump "$OLD_RENOS_URL" \
  --data-only \
  --table='chat_sessions' \
  --table='chat_messages' \
  --table='leads' \
  # ... all 22 tables
  > renos_data.sql

# 2. Transform to renos schema
sed -i 's/public\./renos./g' renos_data.sql

# 3. Import
psql "$NEW_DATABASE_URL" < renos_data.sql
```

### Step-by-Step

#### Step 1: Backup Everything

```bash
pg_dump "$OLD_RENOS_URL" > renos_full_backup_$(date +%Y%m%d).sql
```

#### Step 2: Data Analysis

```bash
# Get table sizes
psql "$OLD_RENOS_URL" << 'EOF'
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  (SELECT COUNT(*) FROM information_schema.tables t2 
   WHERE t2.table_name = t.tablename) as row_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
EOF
```

#### Step 3: Migrate Schema First

```bash
# In tekup-database, schemas are already defined
# Just need to push them
cd c:/Users/empir/tekup-database
pnpm db:push
```

#### Step 4: Migrate Data Table by Table

```bash
# Large tables - migrate separately
pg_dump "$OLD_URL" --table=leads --data-only | \
  sed 's/public\./renos./g' | \
  psql "$NEW_URL"

# Check progress
psql "$NEW_URL" -c "SELECT COUNT(*) FROM renos.leads"
```

#### Step 5: Verify Relations

```typescript
// Test script
import { prisma } from './src/client';

async function verify() {
  const lead = await prisma.renosLead.findFirst({
    include: {
      customer: true,
      bookings: true,
      quotes: true,
    },
  });
  
  console.log('Sample lead with relations:', lead);
}

verify();
```

#### Step 6: Update Application

```bash
# Update .env
DATABASE_URL=postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=renos

# Regenerate Prisma client
pnpm db:generate

# Run tests
pnpm test
```

---

## 4️⃣ CRM & Flow API Migration

**Similar to RenOS** - Follow same pattern:

1. Export data from source
2. Transform schema references  
3. Import to target schemas (`crm` / `flow`)
4. Update application configs
5. Test thoroughly

---

## 🔄 Rollback Procedure

If migration fails:

```bash
# 1. Stop new application
pm2 stop all  # or docker-compose down

# 2. Restore from backup
psql "$OLD_DATABASE_URL" < backup_file.sql

# 3. Revert application config
# .env
DATABASE_URL=<old-database-url>

# 4. Restart old application
pm2 start all
```

---

## ✅ Post-Migration Checklist

After each migration:

- [ ] Verify row counts match
- [ ] Test all critical queries
- [ ] Check foreign key integrity
- [ ] Verify indexes are present
- [ ] Test application end-to-end
- [ ] Monitor for 24 hours
- [ ] Update documentation
- [ ] Notify team of completion

---

## 📊 Migration Timeline

**Recommended Order:**

1. **Week 1:** Billy (low risk, already Supabase)
2. **Week 2:** Vault (medium risk, good documentation)
3. **Week 3:** RenOS (high risk, most complex)
4. **Week 4:** CRM + Flow (medium risk, smaller)

**Total Duration:** 4-6 weeks (including testing)

---

## 🆘 Troubleshooting

### Issue: Connection Timeout

```bash
# Increase timeout
psql "$DATABASE_URL" -c "SET statement_timeout = '30min'"
```

### Issue: Out of Memory

```bash
# Split large tables
pg_dump --table=large_table \
  --where="id < 10000" \
  > part1.sql
```

### Issue: Foreign Key Violations

```bash
# Disable temporarily during import
psql "$DATABASE_URL" << 'EOF'
ALTER TABLE renos.bookings DISABLE TRIGGER ALL;
-- Import data
ALTER TABLE renos.bookings ENABLE TRIGGER ALL;
EOF
```

---

## 📞 Support

**Need help?**

- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Review logs: `docker logs tekup-database-postgres`
- Contact: Jonas Abde

---

**Good luck with your migration!** 🚀
