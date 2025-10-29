# Tekup Database

**Central Database Service for Tekup Portfolio**

🎯 **Purpose:** Single source of truth database for all Tekup applications  
🗄️ **Technology:** PostgreSQL 16 + Prisma 6 + TypeScript  
☁️ **Hosting:** Supabase (EU Frankfurt) + Docker (Local Development)  
📦 **Version:** 1.3.0

---

## 🚀 Quick Status

**Production:** Supabase (Frankfurt - RenOS projekt)  
**Development:** Docker (localhost)  
**Schemas:** 6 (vault, billy, renos, crm, flow, shared)  
**Tables:** 53 deployed  
**Cost:** FREE now → $25/mdr when scaled

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
- PostgreSQL 16 (local) OR Render.com account
- pnpm 8.15+ (anbefalet) eller npm

### Local Development

```bash
# 1. Clone repo
git clone https://github.com/TekupDK/tekup.git
cd tekup/apps/production/tekup-database

# 2. Install dependencies
pnpm install

# 3. Setup environment
cp .env.example .env
# Edit .env med dit database URL

# 4. Start local PostgreSQL (Docker)
docker-compose up -d

# 5. Run migrations
pnpm db:migrate

# 6. Seed test data
pnpm db:seed

# 7. Open Prisma Studio
pnpm db:studio
```

### Production Deployment (Render.com)

```bash
# 1. Push til GitHub
git push origin main

# 2. På Render.com:
#    - Create PostgreSQL database
#    - Note connection string
#    - Add til environment variables

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

### Multi-Schema Strategy

Vi bruger PostgreSQL schemas til at isolere forskellige applications:

```sql
-- Vault Schema (TekupVault)
CREATE SCHEMA vault;
-- Tables: vault.documents, vault.embeddings, vault.sync_status

-- Billy Schema (Tekup-Billy)
CREATE SCHEMA billy;
-- Tables: billy.organizations, billy.cached_*, billy.audit_logs

-- RenOS Schema (Tekup Google AI)
CREATE SCHEMA renos;
-- Tables: renos.leads, renos.customers, renos.bookings, etc.

-- CRM Schema (Tekup-org CRM)
CREATE SCHEMA crm;
-- Tables: crm.tenants, crm.users, crm.cleaning_jobs, etc.

-- Flow Schema (Flow API)
CREATE SCHEMA flow;
-- Tables: flow.leads, flow.sms_tracking, etc.

-- Shared Schema (Cross-app resources)
CREATE SCHEMA shared;
-- Tables: shared.users, shared.audit_logs, shared.sessions
```

**Fordele:**

- ✅ Data isolation
- ✅ Independent migrations
- ✅ Separate permissions
- ✅ Clear ownership

---

## 🔌 Connection Strings

### Local Development

```env
# PostgreSQL local (Docker)
DATABASE_URL="postgresql://tekup:tekup123@localhost:5432/tekup_db"

# Med schema specification
DATABASE_URL_VAULT="postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=vault"
DATABASE_URL_BILLY="postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=billy"
DATABASE_URL_RENOS="postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=renos"
```

### Production (Render.com)

```env
# Main connection
DATABASE_URL="postgresql://user:pass@dpg-xxxxx.frankfurt-postgres.render.com/db_name"

# Connection pooling (anbefalet for production)
DATABASE_URL_POOLED="postgresql://user:pass@dpg-xxxxx.frankfurt-postgres.render.com/db_name?pgbouncer=true&connection_limit=10"

# Schema-specific (for apps)
DATABASE_URL_VAULT="postgresql://user:pass@dpg-xxxxx.frankfurt-postgres.render.com/db_name?schema=vault"
DATABASE_URL_BILLY="postgresql://user:pass@dpg-xxxxx.frankfurt-postgres.render.com/db_name?schema=billy"
DATABASE_URL_RENOS="postgresql://user:pass@dpg-xxxxx.frankfurt-postgres.render.com/db_name?schema=renos"
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
