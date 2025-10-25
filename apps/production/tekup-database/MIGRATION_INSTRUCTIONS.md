# Prisma Migration Instructions - Calendar MCP Tables

**Created:** October 25, 2025
**Migration:** `add-calendar-mcp-intelligence-tables`
**Models Added:** 5 (RenosCustomerIntelligence, RenosBookingValidation, RenosOvertimeLog, RenosLearnedPattern, RenosUndoAction)

---

## Overview

This migration adds 5 new tables to the `renos` schema to support RenOS Calendar MCP intelligence features.

---

## Prerequisites

- Supabase connection string with proper credentials
- Prisma CLI installed (`npm install -g prisma` or use pnpm)
- Backup of current database (CRITICAL!)

---

## Running Migration on Production (Supabase)

### Step 1: Backup Database

```bash
# Via Supabase Dashboard:
# Settings → Database → Backups → Create backup now

# Or via command line:
cd apps/production/tekup-database
pnpm db:backup
```

### Step 2: Set Production DATABASE_URL

```bash
# Get connection string from Supabase Dashboard:
# Settings → Database → Connection string → URI

# Export as environment variable
export DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?schema=renos"

# Or create .env.production file:
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?schema=renos
```

### Step 3: Run Migration

```bash
cd apps/production/tekup-database

# Deploy migration (production-safe, non-interactive)
pnpm db:migrate deploy

# Or explicitly with env:
DATABASE_URL=$PRODUCTION_URL pnpm db:migrate deploy
```

### Step 4: Verify Tables Created

```bash
# Via Prisma Studio (optional):
DATABASE_URL=$PRODUCTION_URL pnpm db:studio

# Or via psql:
psql $DATABASE_URL -c "\\dt renos.*"

# Expected tables:
# renos.customer_intelligence
# renos.booking_validations
# renos.overtime_logs
# renos.learned_patterns
# renos.undo_actions
```

### Step 5: Generate Prisma Client (if needed)

```bash
# Generate client with production schema
pnpm db:generate
```

---

## Rollback (If Needed)

```bash
# Rollback last migration
pnpm db:migrate resolve --rolled-back "add-calendar-mcp-intelligence-tables"

# Drop tables manually (if migration didn't run)
psql $DATABASE_URL <<EOF
DROP TABLE IF EXISTS renos.customer_intelligence CASCADE;
DROP TABLE IF EXISTS renos.booking_validations CASCADE;
DROP TABLE IF EXISTS renos.overtime_logs CASCADE;
DROP TABLE IF EXISTS renos.learned_patterns CASCADE;
DROP TABLE IF EXISTS renos.undo_actions CASCADE;
EOF
```

---

## Tables Created

### 1. customer_intelligence
**Purpose:** Store customer preferences, patterns, and memory

```sql
CREATE TABLE renos.customer_intelligence (
    id TEXT PRIMARY KEY,
    customer_id TEXT UNIQUE NOT NULL,
    customer_name TEXT,
    preferences JSONB,
    patterns JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. booking_validations
**Purpose:** Log booking validation attempts and results

```sql
CREATE TABLE renos.booking_validations (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL,
    validation_type TEXT NOT NULL,
    result TEXT NOT NULL,
    details JSONB,
    warnings TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. overtime_logs
**Purpose:** Track overtime incidents and notifications

```sql
CREATE TABLE renos.overtime_logs (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL,
    customer_id TEXT,
    estimated_hours DOUBLE PRECISION NOT NULL,
    actual_hours DOUBLE PRECISION NOT NULL,
    overtime_hours DOUBLE PRECISION NOT NULL,
    notification_sent BOOLEAN DEFAULT FALSE,
    jonas_notified BOOLEAN DEFAULT FALSE,
    voice_call_made BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. learned_patterns
**Purpose:** Machine learning pattern storage

```sql
CREATE TABLE renos.learned_patterns (
    id TEXT PRIMARY KEY,
    pattern_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    pattern JSONB NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    observations INTEGER DEFAULT 1,
    last_observed TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. undo_actions
**Purpose:** Support undo/rollback operations

```sql
CREATE TABLE renos.undo_actions (
    id TEXT PRIMARY KEY,
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    before JSONB NOT NULL,
    after JSONB NOT NULL,
    reason TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);
```

---

## Post-Migration Steps

### 1. Update Calendar MCP Service

```bash
cd apps/rendetalje/services/calendar-mcp

# Install Tekup Database
pnpm add ../../../production/tekup-database

# Update environment variable
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?schema=renos
```

### 2. Test Calendar MCP Tools

```bash
# Test all 5 tools via HTTP API
curl http://localhost:3001/health

# Test customer intelligence
curl -X POST http://localhost:3001/api/v1/tools/get_customer_memory \
  -H "Content-Type: application/json" \
  -d '{"customer_id": "test123"}'
```

---

## Troubleshooting

### Error: "relation renos.customer_intelligence does not exist"

**Solution:** Migration not run yet. Run:
```bash
DATABASE_URL=$PRODUCTION_URL pnpm db:migrate deploy
```

### Error: "Authentication failed"

**Solution:** Check DATABASE_URL credentials. Get fresh connection string from Supabase Dashboard.

### Error: "P3009: migrate found failed migration"

**Solution:** Mark as rolled back and retry:
```bash
pnpm db:migrate resolve --rolled-back [migration-name]
pnpm db:migrate deploy
```

---

## Monitoring

After migration, monitor:
- Supabase Dashboard → Database → Logs
- Check for any migration errors
- Verify table row counts (should be 0 initially)
- Test Calendar MCP tools manually

---

## Support

For issues, contact:
- Jonas Abde (empire1266@gmail.com)
- Claude Code documentation

---

**Last Updated:** October 25, 2025
**Status:** ✅ Schema ready, migration pending production deployment
