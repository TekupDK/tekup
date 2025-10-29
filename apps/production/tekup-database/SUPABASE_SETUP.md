# 🚀 Supabase Setup Guide - tekup-database

**Version:** 1.3.0  
**Database Provider:** Supabase (Production) + Docker (Development)  
**Dato:** 22. Oktober 2025

---

## 🎯 Overview

tekup-database er nu konfigureret til **HYBRID setup:**

```
PRODUCTION:
└── Supabase (Frankfurt - RenOS projekt)
    ├── URL: https://oaevagdgrasfppbrxbey.supabase.co
    ├── Region: eu-central-1 (Frankfurt)
    ├── Tier: nano (FREE → Pro $25/mdr)
    └── Schemas: vault, billy, renos, crm, flow, shared

DEVELOPMENT:
└── Docker (Local PostgreSQL 16)
    ├── URL: localhost:5432
    ├── Database: tekup_db
    ├── Schemas: Same as production
    └── Cost: FREE
```

---

## 🔧 Quick Start

### **Development (Local)**

```bash
# 1. Clone repo
git clone https://github.com/TekupDK/tekup.git
cd tekup/apps/production/tekup-database

# 2. Install dependencies
pnpm install

# 3. Start local Docker database
docker-compose up -d

# 4. Setup .env for local
cp .env.example .env.local
# Edit .env.local - use Docker connection

# 5. Generate Prisma client
pnpm db:generate

# 6. Push schema to local database
pnpm db:push

# 7. Verify
pnpm db:health
```

### **Production (Supabase)**

```bash
# 1. Copy production .env
cp .env.example .env.production

# 2. Add Supabase credentials
SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres

# 3. Generate client
pnpm db:generate

# 4. Deploy schema (CAUTION!)
DATABASE_URL=$PRODUCTION_URL pnpm db:push
```

---

## 📊 Database Schemas

### **Deployed to Supabase:**

```sql
-- 6 Schemas:
vault    -- TekupVault (3 tables)
billy    -- Tekup-Billy (8 tables)
renos    -- RendetaljeOS (23 tables)
crm      -- CRM (8 tables)
flow     -- Workflow (9 tables)
shared   -- Common (2 tables)

-- Total: 53 tables
```

### **Schema Structure:**

```
vault/
├── vault_documents      (id, source, repository, path, content, metadata)
├── vault_embeddings     (id, document_id, embedding VECTOR(1536))
└── vault_sync_status    (id, source, repository, status)

billy/
├── billy_organizations
├── billy_cached_invoices
├── billy_cached_customers
├── billy_cached_products
├── billy_audit_logs
├── billy_usage_metrics
├── billy_rate_limits
└── billy_sync_status

renos/
├── leads, customers, bookings, invoices
├── email_threads, email_messages
├── cleaning_plans, cleaning_tasks
└── ... (23 tables total)

crm/
├── contacts, companies, deals
└── ... (8 tables)

flow/
├── workflows, executions
└── ... (9 tables)

shared/
├── users
└── audit_logs
```

---

## 🔑 Environment Variables

### **.env.local** (Development - Docker)

```env
# Local PostgreSQL (Docker)
DATABASE_URL="postgresql://tekup:tekup123@localhost:5432/tekup_db"

# Schema-specific URLs
DATABASE_URL_VAULT="postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=vault"
DATABASE_URL_BILLY="postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=billy"
DATABASE_URL_RENOS="postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=renos"
DATABASE_URL_CRM="postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=crm"
DATABASE_URL_FLOW="postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=flow"
DATABASE_URL_SHARED="postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=shared"

# Node environment
NODE_ENV=development
LOG_LEVEL=debug
```

### **.env.production** (Production - Supabase)

```env
# Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres"

# Supabase API (optional)
SUPABASE_URL="https://oaevagdgrasfppbrxbey.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Schema-specific URLs (Supabase)
DATABASE_URL_VAULT="postgresql://postgres:PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=vault"
DATABASE_URL_BILLY="postgresql://postgres:PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=billy"
DATABASE_URL_RENOS="postgresql://postgres:PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=renos"

# Node environment
NODE_ENV=production
LOG_LEVEL=info
```

---

## 📦 Using in Other Projects

### **Install Package**

```bash
# In your project (e.g., TekupVault)
cd c:/Users/empir/TekupVault
pnpm add @tekup/database@file:../tekup-database
```

### **Import Clients**

```typescript
// Import schema clients
import { vault, billy, renos, crm, flow, shared } from '@tekup/database';

// Vault client example
const documents = await vault.findDocuments({
  repository: 'TekupVault',
  source: 'github'
});

// Billy client example
const org = await billy.findOrganization('org_123');

// RenOS client example
const leads = await renos.findLeads({
  status: 'new',
  priority: 'high'
});
```

### **Configure Connection**

```typescript
// In your app's .env
DATABASE_URL="postgresql://postgres:PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=vault"
```

---

## 🔄 Migration from Docker to Supabase

### **Step 1: Export Local Data**

```bash
# Export from Docker
docker exec -i tekup-database-postgres pg_dump -U tekup tekup_db > local-backup.sql
```

### **Step 2: Import to Supabase**

```bash
# Connect to Supabase
psql "postgresql://postgres:PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres"

# Create schemas if not exist
CREATE SCHEMA IF NOT EXISTS vault;
CREATE SCHEMA IF NOT EXISTS billy;
-- etc...

# Import data
psql "postgresql://postgres:PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres" < local-backup.sql
```

### **Step 3: Update Environment**

```bash
# Switch to production env
cp .env.production .env
pnpm db:generate
pnpm db:health
```

---

## 🧪 Testing

### **Local (Docker)**

```bash
# Start Docker
docker-compose up -d

# Check health
pnpm db:health

# Run tests
pnpm test

# Open Prisma Studio
pnpm db:studio
```

### **Production (Supabase)**

```bash
# Set production URL
export DATABASE_URL="postgresql://postgres:PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres"

# Check health
pnpm db:health

# Don't run db:push without verification!
# Use Supabase migrations instead
```

---

## 🛠️ Available Scripts

```bash
# Development
pnpm dev              # Watch mode
pnpm build            # Build package

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema (use carefully!)
pnpm db:studio        # Open Prisma Studio GUI
pnpm db:health        # Health check
pnpm db:seed          # Seed test data

# Testing
pnpm test             # Run tests
pnpm test:watch       # Watch mode
pnpm lint             # Lint code
```

---

## 📚 Documentation

- `README.md` - Main documentation
- `SUPABASE_SETUP.md` - This file
- `MIGRATION_PLAN_3_REPOS.md` - Migration guide
- `docs/API_REFERENCE.md` - API documentation
- `docs/DEPLOYMENT.md` - Deployment guide
- `examples/` - Usage examples

---

## 🔐 Security Notes

### **Supabase Connection:**

- ✅ Always use `SUPABASE_SERVICE_KEY` for server-side
- ✅ Never commit `.env.production` to Git
- ✅ Use environment variables in CI/CD
- ✅ Enable Row Level Security (RLS) policies

### **Docker Connection:**

- ✅ OK for development
- ⚠️ Never expose port 5432 publicly
- ✅ Use strong passwords even locally

---

## 🚀 Production Deployment

### **Current Setup:**

```
Apps using tekup-database:
├── TekupVault (Render.com)
│   └── Supabase: oaevagdgrasfppbrxbey (Frankfurt)
├── Tekup-Billy (Render.com)
│   └── Supabase: oaevagdgrasfppbrxbey (Frankfurt)
└── RendetaljeOS (Render.com)
    └── Supabase: oaevagdgrasfppbrxbey (Frankfurt)

All pointing to same Supabase projekt ✅
```

---

## ❓ FAQ

**Q: Should I use Docker or Supabase?**  
A: Both! Docker for development (fast, offline), Supabase for production (managed, reliable)

**Q: How do I sync schemas?**  
A: Use Prisma migrations. Changes in schema.prisma → generate migration → apply to both

**Q: What's the cost?**  
A: Development (Docker): FREE. Production (Supabase): FREE (< 500MB) → $25/mdr Pro tier

**Q: Can I use tekup-database without Supabase?**  
A: Yes! It's just Prisma schemas. Works with any PostgreSQL database.

---

**Last Updated:** 22. Oktober 2025  
**Version:** 1.3.0 (Supabase hybrid setup)  
**Status:** ✅ Production ready
