# Tekup Database

**✅ Single Consolidated Database for All Tekup Applications**

🎯 **Purpose:** Single source of truth - ONE Supabase database for entire Tekup platform  
🗄️ **Technology:** PostgreSQL 16 + Prisma 6 + TypeScript + pgvector  
☁️ **Production:** Supabase (oaevagdgrasfppbrxbey) - EU Frankfurt  
🐳 **Development:** Docker (localhost) - Local development only  
📦 **Version:** 1.3.0

---

## 🚀 Quick Status

✅ **CONSOLIDATED:** All applications use ONE Supabase database  
☁️ **Production Database:** Supabase (RenOS By Tekup project)  
🔗 **Project URL:** https://oaevagdgrasfppbrxbey.supabase.co  
📍 **Region:** EU Central 1 (Frankfurt, Germany)  
🗄️ **Schemas:** 6 (vault, billy, renos, crm, flow, shared)  
📊 **Tables:** 53 deployed  
💰 **Cost:** $25/month (Pro tier recommended)  
🔒 **Security:** RLS enabled, daily backups, EU data residency

> **Important:** This is a SINGLE DATABASE architecture. All Tekup applications share one Supabase database with separate schemas. Local Docker is for development only.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Tekup Database Service                    │
│                    (Central PostgreSQL)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Schema:    │  │   Schema:    │  │   Schema:    │      │
│  │   vault      │  │   billy      │  │   renos      │      │
│  │              │  │              │  │              │      │
│  │ - documents  │  │ - orgs       │  │ - leads      │      │
│  │ - embeddings │  │ - cache      │  │ - customers  │      │
│  │ - sync       │  │ - audit      │  │ - bookings   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Schema:    │  │   Schema:    │  │   Schema:    │      │
│  │   crm        │  │   flow       │  │   shared     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         ↑              ↑              ↑              ↑
         │              │              │              │
    ┌────┴────┐    ┌────┴────┐   ┌────┴────┐   ┌────┴────┐
    │ Vault   │    │  Billy  │   │  RenOS  │   │   CRM   │
    │  API    │    │   API   │   │   API   │   │   API   │
    └─────────┘    └─────────┘   └─────────┘   └─────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ LTS
- pnpm 8.15+ (recommended) or npm
- Docker Desktop (for local development only)
- Supabase account (for production)

### Production Setup (Supabase - Recommended)

**All Tekup applications use the consolidated Supabase database in production.**

```bash
# 1. Clone repo
git clone https://github.com/TekupDK/tekup.git
cd tekup/apps/production/tekup-database

# 2. Install dependencies
pnpm install

# 3. Setup production environment
cp .env.supabase.example .env.production

# 4. Get database password from Supabase
# Visit: https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey
# Settings → Database → Connection string → Copy password

# 5. Update .env.production with your password
# Replace YOUR_PASSWORD in DATABASE_URL

# 6. Generate Prisma client
pnpm db:generate

# 7. Deploy schema to Supabase (if needed)
pnpm db:push
```

### Local Development (Docker - Optional)

**Note:** Docker setup is for LOCAL DEVELOPMENT ONLY. Production always uses Supabase.

```bash
# 1. Setup local environment
cp .env.example .env

# 2. Start local PostgreSQL (Docker)
docker-compose up -d

# 3. Generate Prisma client
pnpm db:generate

# 4. Push schema to local database
pnpm db:push

# 5. Open Prisma Studio
pnpm db:studio
```

> **Production vs Development:**
> - **Production:** Always use Supabase (oaevagdgrasfppbrxbey.supabase.co)
> - **Development:** Use local Docker for offline work only
> - Never deploy local Docker database to production

# 3. Run migrations på production
pnpm db:migrate:prod
```

---

## 📁 Project Structure

```
tekup-database/
├── prisma/
│   ├── schema.prisma         # Main Prisma schema (vault, billy, shared)
│   ├── schema-renos.prisma   # RenOS schema (22 models)
│   ├── migrations/           # Database migrations
│   ├── seeds/                # Test data seeds
│   └── scripts/              # Utility scripts (backup, restore, health)
├── src/
│   ├── client/               # Client libraries for each schema
│   │   ├── index.ts          # Main exports
│   │   ├── vault.ts          # TekupVault helpers
│   │   ├── billy.ts          # Tekup-Billy helpers
│   │   └── renos.ts          # RenOS helpers (NEW!)
│   ├── types/                # TypeScript types
│   └── utils/                # Utilities & logger
│   │   ├── billy.ts         # Billy-specific queries
│   │   └── renos.ts         # RenOS-specific queries
│   │
│   ├── migrations/          # Custom migration helpers
│   │   ├── runner.ts       # Migration runner
│   │   └── rollback.ts     # Rollback utilities
│   │
│   ├── types/              # TypeScript types
│   │   ├── vault.types.ts
│   │   ├── billy.types.ts
│   │   ├── renos.types.ts
│   │   └── shared.types.ts
│   │
│   └── utils/              # Utility functions
│       ├── logger.ts       # Database logging
│       ├── connection.ts   # Connection utilities
│       └── health.ts       # Health checks
│
├── docs/
│   ├── SETUP.md            # Detaljeret setup guide
│   ├── MIGRATION_GUIDE.md  # Migration fra andre DBs
│   ├── SCHEMA_DESIGN.md    # Schema design decisions
│   ├── API_REFERENCE.md    # API dokumentation
│   └── TROUBLESHOOTING.md  # Common issues
│
├── scripts/
│   ├── backup-db.sh        # Backup script
│   ├── restore-db.sh       # Restore script
│   └── health-check.sh     # Health check script
│
├── .github/
│   └── workflows/
│       ├── ci.yml          # CI pipeline
│       └── deploy.yml      # Auto-deploy migrations
│
├── docker-compose.yml      # Local PostgreSQL setup
├── Dockerfile             # Production Docker image (hvis nødvendigt)
├── render.yaml            # Render.com deployment config
├── .env.example           # Environment template
├── package.json
├── tsconfig.json
└── README.md              # This file
```

---

## 🗄️ Schema Organization

### ✅ Single Database, Multi-Schema Strategy

**Important:** All Tekup applications share ONE Supabase database with separate schemas for data isolation.

```sql
-- Single Database: oaevagdgrasfppbrxbey.supabase.co

-- Vault Schema (TekupVault - Knowledge Base)
CREATE SCHEMA vault;
-- Tables: vault.documents, vault.embeddings, vault.sync_status
-- Purpose: Document storage and AI embeddings for semantic search

-- Billy Schema (Tekup-Billy - Accounting Integration)
CREATE SCHEMA billy;
-- Tables: billy.organizations, billy.cached_*, billy.audit_logs
-- Purpose: Billy.dk API integration with caching layer

-- RenOS Schema (RendetaljeOS - Cleaning Service)
CREATE SCHEMA renos;
-- Tables: renos.leads, renos.customers, renos.bookings, etc.
-- Purpose: Complete cleaning service management system

-- CRM Schema (Tekup CRM)
CREATE SCHEMA crm;
-- Tables: crm.companies, crm.contacts, crm.deals, etc.
-- Purpose: Multi-tenant CRM platform

-- Flow Schema (Flow API - Workflows)
CREATE SCHEMA flow;
-- Tables: flow.workflows, flow.executions, flow.integrations, etc.
-- Purpose: Workflow automation and lead generation

-- Shared Schema (Cross-app Resources)
CREATE SCHEMA shared;
-- Tables: shared.users, shared.audit_logs
-- Purpose: Single sign-on and centralized audit logging
```

**Benefits of Single Database Architecture:**

- ✅ **Single Source of Truth** - All data in one place
- ✅ **Data Isolation** - Schemas separate application data
- ✅ **Shared Resources** - Common data in shared schema
- ✅ **Simplified Management** - One database to backup/monitor
- ✅ **Cost Effective** - $25/month for entire platform
- ✅ **Auto Backups** - Daily automated backups by Supabase
- ✅ **EU Compliance** - GDPR-compliant with Frankfurt hosting

---

## 🔌 Connection Strings

### Production (Supabase - Primary Database)

**All Tekup applications use this single Supabase database in production:**

```env
# Main database connection
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?sslmode=require"

# Supabase API credentials
SUPABASE_URL="https://oaevagdgrasfppbrxbey.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Nzc3NjQsImV4cCI6MjA3NTQ1Mzc2NH0.M0Kt1Xi-3VVoq6NJ7VbhqBC0z9EK-JQ7ypssayMw7s8"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg3Nzc2NCwiZXhwIjoyMDc1NDUzNzY0fQ.94lDERK4Enw8YTH_OtE9BpQhQWs8fg_7GZQGnYS8rNo"

# Schema-specific URLs (for different applications)
DATABASE_URL_VAULT="postgresql://postgres:YOUR_PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=vault"
DATABASE_URL_BILLY="postgresql://postgres:YOUR_PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=billy"
DATABASE_URL_RENOS="postgresql://postgres:YOUR_PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=renos"
DATABASE_URL_CRM="postgresql://postgres:YOUR_PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=crm"
DATABASE_URL_FLOW="postgresql://postgres:YOUR_PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=flow"
DATABASE_URL_SHARED="postgresql://postgres:YOUR_PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=shared"
```

> **Get Password:** Visit https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey → Settings → Database

### Local Development (Docker - Optional)

**Note:** Docker is for LOCAL DEVELOPMENT ONLY. Production always uses Supabase.

```env
# PostgreSQL local (Docker)
DATABASE_URL="postgresql://tekup:tekup123@localhost:5432/tekup_db"

# Schema-specific (local)
DATABASE_URL_VAULT="postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=vault"
DATABASE_URL_BILLY="postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=billy"
DATABASE_URL_RENOS="postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=renos"
DATABASE_URL_CRM="postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=crm"
DATABASE_URL_FLOW="postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=flow"
DATABASE_URL_SHARED="postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=shared"
```

---

## 📦 Package Scripts

```json
{
  "scripts": {
    // Development
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    
    // Database
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:push": "prisma db push",
    "db:pull": "prisma db pull",
    "db:seed": "tsx prisma/seeds/seed.ts",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset",
    
    // Schema Management
    "db:generate": "prisma generate",
    "db:validate": "prisma validate",
    "db:format": "prisma format",
    
    // Utilities
    "db:backup": "tsx prisma/scripts/backup.ts",
    "db:restore": "tsx prisma/scripts/restore.ts",
    "db:health": "tsx prisma/scripts/health-check.ts",
    
    // Testing
    "test": "vitest",
    "test:unit": "vitest run",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    
    // Linting
    "lint": "eslint src prisma --ext .ts",
    "lint:fix": "eslint src prisma --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\" \"prisma/**/*.ts\""
  }
}
```

---

## 🔐 Security Best Practices

### Connection Security

```typescript
// src/client/index.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
  
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  
  // Connection pooling
  connection: {
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000
    }
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

### Row Level Security (RLS)

```sql
-- Enable RLS på alle tabeller
ALTER TABLE vault.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE billy.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE renos.leads ENABLE ROW LEVEL SECURITY;

-- Policies eksempel
CREATE POLICY vault_access ON vault.documents
  FOR ALL
  USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY org_isolation ON billy.organizations
  FOR ALL
  USING (organization_id = current_setting('app.current_org_id')::uuid);
```

---

## 📊 Monitoring & Health Checks

### Health Check Endpoint

```typescript
// src/utils/health.ts
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
```

### Metrics to Monitor

- **Connection Pool:** Active vs idle connections
- **Query Performance:** Slow query log (>100ms)
- **Database Size:** Per schema monitoring
- **Replication Lag:** If using read replicas
- **Error Rate:** Failed queries per minute

---

## 🚢 Deployment

### Render.com Setup

1. **Create PostgreSQL Database**
   ```
   Name: tekup-database
   Region: Frankfurt (EU)
   PostgreSQL Version: 16
   Plan: Starter ($7/mdr) eller Pro ($20/mdr)
   ```

2. **Add Environment Variables**
   ```env
   DATABASE_URL=<from Render dashboard>
   NODE_ENV=production
   PRISMA_QUERY_ENGINE_BINARY=/usr/bin/prisma-query-engine
   ```

3. **Run Initial Migration**
   ```bash
   pnpm db:migrate:prod
   ```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy Database Migrations

on:
  push:
    branches: [main]
    paths:
      - 'prisma/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Run migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: pnpm db:migrate:prod
```

---

## 🔄 Migration Strategy

### From Existing Databases

Vi har migration guides for:

1. **Prisma → Tekup Database** ([docs/MIGRATION_GUIDE.md](docs/MIGRATION_GUIDE.md))
2. **Supabase → Tekup Database**
3. **Raw PostgreSQL → Tekup Database**

### Migration Steps

```bash
# 1. Backup existing database
pnpm db:backup --source=$OLD_DATABASE_URL

# 2. Generate schema from existing DB
pnpm db:pull --source=$OLD_DATABASE_URL

# 3. Create migration
pnpm db:migrate dev --name="migrate_from_old_db"

# 4. Test migration on staging
pnpm db:migrate:prod --url=$STAGING_URL

# 5. Migrate data
pnpm migrate:data --from=$OLD_DATABASE_URL --to=$NEW_DATABASE_URL

# 6. Verify data integrity
pnpm db:verify

# 7. Deploy to production
pnpm db:migrate:prod
```

---

## 📚 Documentation

### Getting Started

- **[Quick Start Guide](QUICK_START.md)** - Get started in 30 minutes
- **[Setup Guide](docs/SETUP.md)** - Detailed installation and configuration

### Development

- **[API Reference](docs/API_REFERENCE.md)** - Complete client library reference 🆕
- **[Schema Design](docs/SCHEMA_DESIGN.md)** - Database architecture and patterns 🆕
- **[Contributing Guide](docs/CONTRIBUTING.md)** - How to contribute 🆕
- **[Examples](examples/)** - Code examples for all clients 🆕

### Operations

- **[Migration Guide](docs/MIGRATION_GUIDE.md)** - Migrate existing services
- **[Supabase Migration](docs/migration/README.md)** - Complete Supabase migration documentation 🆕
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment 🆕
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions 🆕
- **[Performance Guide](docs/PERFORMANCE.md)** - Optimization tips 🆕

### Reference

- **[Security Policy](docs/SECURITY.md)** - Security best practices 🆕
- **[Changelog](CHANGELOG.md)** - Version history and updates
- **[Release Notes](VERSION_1.1.0_RELEASE_NOTES.md)** - v1.1.0 details 🆕
- **[Historical Reports](docs/reports/README.md)** - Archive of workspace audits and reports 🆕

---

## 🤝 Contributing

Denne repo følger GitFlow workflow:

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature branches
- `hotfix/*` - Urgent fixes

**Før du committer:**
```bash
pnpm lint
pnpm test
pnpm db:validate
```

---

## 📝 License

Private - All rights reserved by Tekup Portfolio

---

## 🔗 Related Repositories

- [TekupVault](https://github.com/TekupDK/tekup/tree/master/apps/production/tekup-vault) - Knowledge base API
- [Tekup-Billy](https://github.com/TekupDK/tekup/tree/master/apps/production/tekup-billy) - Billy.dk MCP Server
- [RenOS](https://github.com/TekupDK/tekup/tree/master/apps/rendetalje) - RenOS backend
- [Tekup Monorepo](https://github.com/TekupDK/tekup) - Main monorepo

---

**Built with** PostgreSQL 16, Prisma 6, TypeScript, and ❤️ by Tekup Team

**Maintained by** Jonas Abde | [LinkedIn](https://www.linkedin.com/in/jonas-abde-22691a12a/)

---

## 📊 Stats

- **Schemas:** 6 (vault, billy, renos, crm, flow, shared)
- **Models:** 64 database models
- **Client Libraries:** 5 complete clients
- **API Methods:** 100+ documented
- **Documentation:** 18+ comprehensive guides
- **Code Examples:** 5 complete examples
- **Lines of Code:** 12,000+
- **Test Coverage:** 89%
