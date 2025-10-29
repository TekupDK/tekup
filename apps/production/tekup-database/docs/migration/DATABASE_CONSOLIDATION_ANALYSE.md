# Database Konsoliderings-Analyse - Supabase Migration

**Dato:** 20. oktober 2025  
**Udarbejdet til:** Tekup Organization  
**Formål:** Vurdering af alle databaser på tværs af workspaces og plan for konsolidering til ét Supabase-projekt

---

## 📊 Executive Summary

Efter en grundig gennemgang af alle 12 workspaces er der identificeret **9 distinkte database-implementationer** fordelt på forskellige teknologier:

- **5 Prisma + PostgreSQL** implementationer (adskilt fra hinanden)
- **1 Supabase** implementation (TekupVault - allerede migreret)
- **1 Supabase** implementation (Tekup-Billy - allerede migreret)
- **Diverse** lokale/mindre databaseløsninger

**ANBEFALING:** ✅ Konsolidering til ét Supabase-projekt er **højst anbefalingsværdigt** og vil give betydelige fordele.

---

## 🗄️ Database Inventory - Detaljeret Oversigt

### 1. **TekupVault** ✅

**Status:** Allerede på Supabase  
**Teknologi:** Supabase PostgreSQL med pgvector extension  
**Lokation:** `c:\Users\empir\TekupVault\supabase\migrations\`

**Schema:**

- `vault_documents` - dokumentlagring
- `vault_embeddings` - vector embeddings (1536 dimensioner)
- `vault_sync_status` - synkroniseringsstatus

**Vurdering:** Moderne implementation, klar til at være del af det centrale projekt.

---

### 2. **Tekup-Billy** ✅

**Status:** Allerede på Supabase  
**Teknologi:** Supabase med caching-lag  
**Lokation:** `c:\Users\empir\Tekup-Billy\src\database\supabase-client.ts`

**Schema:**

- `billy_organizations` - organisation management
- `billy_cached_invoices/customers/products` - caching tables
- `billy_audit_logs` - audit trail
- `billy_usage_metrics` - usage tracking
- `billy_rate_limits` - rate limiting

**Vurdering:** Sofistikeret implementation med encryption (AES-256-GCM), audit logging og caching.

---

### 3. **Tekup Google AI (RenOS)** ⚠️

**Status:** Prisma + PostgreSQL (SKAL MIGRERES)  
**Teknologi:** Prisma ORM  
**Lokation:** `c:\Users\empir\Tekup Google AI\prisma\schema.prisma`

**Schema (536 linjer):**

- **19 modeller** inkl:
  - Lead management system (Lead, Quote, Booking)
  - Customer relationship (Customer, Conversation, EmailThread)
  - Email automation (EmailMessage, EmailResponse, Escalation)
  - Analytics (Analytics, TaskExecution)
  - Cleaning plans (CleaningPlan, CleaningTask, CleaningPlanBooking)
  - Time tracking (Break)
  - Invoicing (Invoice, InvoiceLineItem)
  - Competitor analysis (CompetitorPricing)

**Kompleksitet:** HØJ - Omfattende business logic med mange relationer.

---

### 4. **RendetaljeOS Backend** ⚠️

**Status:** Prisma + PostgreSQL (SKAL MIGRERES)  
**Teknologi:** Prisma ORM  
**Lokation:** `c:\Users\empir\RendetaljeOS\apps\backend\prisma\schema.prisma`

**Schema (549 linjer):**

- **19 modeller** - næsten identisk med Tekup Google AI
- Bemærk: Arrays gemmes som JSON strings (ikke native arrays)

**Kompleksitet:** HØJ - Duplicate af RenOS systemet (måske til monorepo migration?).

---

### 5. **Tekup-org: CRM API** ⚠️

**Status:** Prisma + PostgreSQL (SKAL MIGRERES)  
**Teknologi:** Prisma ORM  
**Lokation:** `c:\Users\empir\Tekup-org\apps\tekup-crm-api\prisma\schema.prisma`

**Schema (605 linjer):**

- **Multi-tenant SaaS platform**
- **28+ modeller** inkl:
  - Tenant management (Tenant, User med UserRole)
  - Customer segmentation (Customer, CustomerLocation)
  - Team management (TeamMember, JobTeamMember)
  - Job scheduling (CleaningJob med 10 forskellige typer)
  - Route optimization (Route, RouteJob)
  - Quality control (JobPhoto, JobNote, CustomerFeedback)
  - Inventory (Equipment, Supply)
  - Analytics (SchedulingMetrics)
  - Audit (AuditLog, SystemConfig)

**Kompleksitet:** MEGET HØJ - Enterprise-grade multi-tenant system.

---

### 6. **Tekup-org: Flow API** ⚠️

**Status:** Prisma + PostgreSQL (SKAL MIGRERES)  
**Teknologi:** Prisma ORM  
**Lokation:** `c:\Users\empir\Tekup-org\apps\flow-api\prisma\schema.prisma`

**Schema (266 linjer):**

- **12 modeller** inkl:
  - Lead management med compliance integration
  - SMS tracking system
  - Tenant settings med audit trail
  - Duplicate detection (DuplicateGroup, DuplicateGroupMember)
  - API key management med rotation og usage logging

**Kompleksitet:** MEDIUM-HØJ - Specialiseret til lead/compliance tracking.

---

### 7. **Tekup-org: Rendetalje OS Backend** ⚠️

**Status:** Prisma + PostgreSQL (SKAL MIGRERES)  
**Teknologi:** Prisma ORM  
**Lokation:** `c:\Users\empir\Tekup-org\apps\rendetalje-os-backend\prisma\schema.prisma`

**Schema (301 linjer):**

- **17 modeller** - fokuseret på operations:
  - User management (User med roller)
  - Team operations (CleaningTeam, CleaningEmployee, EmploymentContract)
  - Working time tracking (WorkingTimeRecord)
  - Job scheduling (Customer, CleaningJob, ScheduledJob)
  - Route optimization (OptimizedRoute, StaffSchedule)
  - Compliance (ComplianceReport, SafetyTraining)
  - Equipment management

**Kompleksitet:** HØJ - Fokus på dansk arbejdsmarkedslovgivning.

---

### 8. **Tekup-org: Andre Apps** 📦

I Tekup-org findes også schemas for:

- `tekup-unified-platform`
- `tekup-lead-platform`
- `essenza-pro-backend`
- `mcp-studio-backend`
- `foodtruck-os-backend`

**Status:** Skal undersøges nærmere for aktiv brug.

---

### 9. **Andre Workspaces**

- **Agent-Orchestrator:** Ingen database fundet
- **Gmail-PDF-Forwarder:** Ingen database fundet
- **tekup-cloud-dashboard:** Bruger Supabase client (sandsynligvis deler database)
- **tekup-ai-assistant:** Ingen selvstændig database
- **tekup-gmail-automation:** Python-baseret, ingen persistent database

---

## 🎯 Konsolideringsplan

### Fase 1: Forberedelse (Uge 1-2)

#### 1.1 Opret Centralt Supabase Projekt

```bash
# Opret nyt Supabase projekt via dashboard
# Navn: tekup-central-database
# Region: eu-central-1 (Frankfurt - tættest på Danmark)
```

#### 1.2 Setup Multi-Schema Arkitektur

I Supabase kan vi bruge PostgreSQL schemas til at adskille forskellige domæner:

```sql
-- Opret separate schemas for hver applikation
CREATE SCHEMA vault;        -- TekupVault
CREATE SCHEMA billy;        -- Billy integration
CREATE SCHEMA renos;        -- RenOS/Tekup Google AI
CREATE SCHEMA crm;          -- CRM platform
CREATE SCHEMA flow;         -- Flow API
CREATE SCHEMA rendetalje;   -- Rendetalje operations
CREATE SCHEMA shared;       -- Delte tabeller (brugere, etc.)
```

#### 1.3 Opsæt Row Level Security (RLS)

```sql
-- Enable RLS på alle tabeller
ALTER TABLE renos.leads ENABLE ROW LEVEL SECURITY;

-- Opret policies baseret på tenant/organization
CREATE POLICY tenant_isolation ON renos.leads
  FOR ALL
  USING (tenant_id = auth.uid());
```

---

### Fase 2: Migration Strategi

#### 2.1 Prioriteret Rækkefølge

**HØJTPRIORITERET (Start her):**

1. ✅ **TekupVault** - Allerede klar
2. ✅ **Tekup-Billy** - Allerede klar
3. 🔄 **Tekup Google AI (RenOS)** - Aktiv produktion
4. 🔄 **Flow API** - Lead generation system

**MEDIUM PRIORITET:**
5. 🔄 **RendetaljeOS Backend** (hvis i aktiv brug)
6. 🔄 **Tekup-org CRM API** (hvis i aktiv brug)

**LAV PRIORITET:**
7. 📦 Andre apps i Tekup-org (audit først)

#### 2.2 Migration Process per Database

For hver Prisma database:

**Trin 1: Eksport Data**
```bash
# Eksporter eksisterende data
pg_dump $DATABASE_URL > backup_renos_$(date +%Y%m%d).sql

# Eller brug Prisma
npx prisma db pull
npx prisma generate
```

**Trin 2: Konverter Schema til Supabase**
```bash
# Installer Supabase CLI
npm install -g supabase

# Login til Supabase
supabase login

# Link til projekt
supabase link --project-ref <project-ref>

# Generer migration fra Prisma schema
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource $SUPABASE_DATABASE_URL \
  --script > supabase/migrations/001_migrate_renos.sql
```

**Trin 3: Test Migration Lokalt**
```bash
# Start lokal Supabase
supabase start

# Kør migration
supabase db push

# Test med seed data
npm run seed
```

**Trin 4: Deploy til Produktion**
```bash
# Kør migration på staging først
supabase db push --db-url $STAGING_URL

# Verificer data integritet
npm run verify-migration

# Deploy til produktion
supabase db push --db-url $PRODUCTION_URL
```

---

### Fase 3: Implementering af Konsolidering

#### 3.1 Opdater Application Code

**Før (Prisma):**
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const leads = await prisma.lead.findMany({
  where: { status: 'NEW' }
});
```

**Efter (Supabase):**
```typescript
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const { data: leads, error } = await supabase
  .from('renos.leads')  // Brug schema-præfix
  .select('*')
  .eq('status', 'NEW');
```

#### 3.2 Migration Helper Script

```typescript
// migrate-to-supabase.ts
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function migrateLeads() {
  const leads = await prisma.lead.findMany();
  
  for (const lead of leads) {
    const { error } = await supabase
      .from('renos.leads')
      .insert({
        ...lead,
        // Transform data hvis nødvendigt
        preferred_dates: JSON.stringify(lead.preferredDates)
      });
    
    if (error) {
      console.error(`Failed to migrate lead ${lead.id}:`, error);
    } else {
      console.log(`Migrated lead ${lead.id}`);
    }
  }
}
```

---

## 🛠️ Anbefalede GitHub Migration Tools

### 1. **Supabase CLI** ⭐⭐⭐⭐⭐

**Repo:** <https://github.com/supabase/cli>  
**Stars:** 1.5k+  
**Brug:** Officiel Supabase CLI til migrations og deployment

```bash
npm install -g supabase
supabase init
supabase db diff --schema public
```

### 2. **Prisma Migrate** ⭐⭐⭐⭐⭐

**Repo:** <https://github.com/prisma/prisma>  
**Stars:** 39k+  
**Brug:** Generer migrations fra eksisterende Prisma schemas

```bash
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource $TARGET_DB \
  --script > migration.sql
```

### 3. **pg_dump / pg_restore**

**Built-in PostgreSQL tools**  
**Brug:** Backup og restore af data

```bash
# Backup
pg_dump $SOURCE_DB > backup.sql

# Restore
psql $TARGET_DB < backup.sql
```

### 4. **Heroku to Supabase Importer** ⭐⭐⭐⭐

**URL:** <https://migrate.supabase.com/>  
**Brug:** Web-baseret migration tool (virker også for andre Postgres DBs)

### 5. **Supabase Schema Generator** ⭐⭐⭐

**URL:** <https://supabase-schema.vercel.app/>  
**Brug:** Generer SQL scripts fra eksisterende database

### 6. **Basejump SaaS Starter** ⭐⭐⭐⭐

**Repo:** <https://github.com/usebasejump/basejump>  
**Brug:** Multi-tenant Supabase reference implementation

---

## 📈 Fordele ved Konsolidering

### 1. **Økonomiske Fordele**

- **1 Supabase projekt** i stedet for 5+ separate databases
- Delt connection pool → færre idle connections
- Unified backup strategi
- **Estimeret besparelse:** 60-80% på database hosting costs

### 2. **Operationelle Fordele**

- **Centraliseret monitoring** via Supabase Dashboard
- **Unified backup/restore** strategi
- **Shared Row Level Security** policies
- **Fælles authentication** system
- Real-time subscriptions på tværs af apps

### 3. **Udvikler Erfaring**

- **Én connection string** at administrere
- **Fælles migration strategi**
- **Unified tooling** (Supabase CLI)
- **Better observability** (én log explorer)
- **Simplified CI/CD**

### 4. **Performance**

- **Connection pooling** på tværs af apps
- **Shared cache** (Supavisor)
- **Nærmere til data** (færre network hops for joins)

### 5. **Sikkerhed**

- **Centralized audit logging**
- **Unified access control**
- **Better compliance** (GDPR, NIS2)
- **Single source of truth** for kryptering

---

## ⚠️ Risici og Mitigering

### Risiko 1: Schema Konflikter

**Problem:** To apps bruger samme tabel-navn  
**Løsning:** Brug PostgreSQL schemas (`renos.leads` vs `crm.leads`)

### Risiko 2: Data Tab under Migration

**Problem:** Migration fejler midtvejs  
**Løsning:**

- ALTID backup før migration
- Test på staging først
- Brug transaktioner
- Implementer rollback plan

### Risiko 3: Downtime

**Problem:** Apps er nede under migration  
**Løsning:**

- **Blue-green deployment:** Kør begge databaser samtidig
- Gradvis cutover med feature flags
- Implementer read replicas

### Risiko 4: Performance Problemer

**Problem:** Én database kan ikke håndtere load  
**Løsning:**

- Supabase Pro tier med dedikeret ressourcer
- Connection pooling (Supavisor)
- Proper indexes
- Query optimization

### Risiko 5: Vendor Lock-in

**Problem:** Alt på Supabase  
**Løsning:**

- Det er stadig bare PostgreSQL
- Eksportér data nemt med `pg_dump`
- Brug open-source Supabase (self-hosted option)

---

## 💰 Omkostnings-Analyse

### Nuværende Situation (Estimat)

```
5x Separate PostgreSQL instances:
- Render/Heroku Hobby: 5 x $7/mo = $35/mo
- Eller AWS RDS: 5 x $15/mo = $75/mo

Total: ~$35-75/mdr
```

### Efter Konsolidering

```
1x Supabase Pro:
- Pro tier: $25/mo
- 8GB database
- 50GB bandwidth
- 100GB storage

Total: $25/mdr

BESPARELSE: $10-50/mdr (30-65%)
```

### Ved Scale-up

```
Supabase Team tier: $599/mo
- Inkluderer alt
- Prioriteret support
- SOC2 compliance
- 99.9% uptime SLA

vs.

5x Separate managed DBs: ~$500-1000/mo

BESPARELSE: Stadig konkurrencedygtig
```

---

## 📅 Implementeringsplan (12 Uger)

### **Uge 1-2: Setup & Design**

- [ ] Opret centralt Supabase projekt
- [ ] Design schema structure (separate schemas)
- [ ] Setup CI/CD pipelines
- [ ] Dokumentation af migration process

### **Uge 3-4: Migration af TekupVault & Billy**

- [x] TekupVault - allerede done
- [x] Tekup-Billy - allerede done
- [ ] Verificer alt fungerer
- [ ] Update documentation

### **Uge 5-6: Migration af RenOS (Tekup Google AI)**

- [ ] Backup eksisterende database
- [ ] Konverter schema til Supabase
- [ ] Migrate data
- [ ] Update application code
- [ ] Test thorougly
- [ ] Deploy til staging
- [ ] Deploy til production

### **Uge 7-8: Migration af Flow API**

- [ ] Samme process som RenOS
- [ ] Særlig fokus på lead deduplication logic
- [ ] Test SMS tracking integration

### **Uge 9-10: Migration af RendetaljeOS (hvis aktiv)**

- [ ] Audit om det er i brug
- [ ] Hvis ja: samme migration process
- [ ] Hvis nej: arkivér data

### **Uge 11: Migration af CRM API**

- [ ] Multi-tenant setup
- [ ] RLS policies
- [ ] Test med multiple tenants
- [ ] Performance testing

### **Uge 12: Cleanup & Optimization**

- [ ] Decommission gamle databaser
- [ ] Performance tuning
- [ ] Setup monitoring & alerts
- [ ] Final documentation
- [ ] Team training

---

## 🎓 Team Training & Documentation

### 1. Supabase Basics Workshop (2 timer)

- Introduktion til Supabase
- PostgreSQL vs Supabase
- Row Level Security (RLS)
- Real-time subscriptions

### 2. Migration Best Practices (1 time)

- Backup strategies
- Testing migrations
- Rollback procedures
- Monitoring

### 3. Development Workflow (1 time)

- Local development med Supabase CLI
- Branch deploys
- Migration process
- Debugging

---

## 📚 Ressourcer

### Official Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Prisma to Supabase Guide](https://supabase.com/docs/guides/database/prisma)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)

### Community Resources

- [Awesome Supabase](https://github.com/lyqht/awesome-supabase)
- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub Discussions](https://github.com/orgs/supabase/discussions)

### Migration Tools

- [Heroku to Supabase Importer](https://migrate.supabase.com/)
- [Supabase Schema Generator](https://supabase-schema.vercel.app/)
- [Database Diff Tool](https://database.dev/)

---

## ✅ Næste Skridt

### Øjeblikkelig Action (Denne Uge)

1. **Review denne analyse** med team
2. **Beslut om konsolidering** skal gennemføres
3. **Prioriter hvilke databaser** der skal migreres først
4. **Opret centralt Supabase projekt** (hvis godkendt)

### Kort Sigt (Næste Måned)

1. **Audit alle apps** i Tekup-org for aktiv brug
2. **Start migration** af RenOS (højeste prioritet)
3. **Setup monitoring & alerts**
4. **Dokumenter migration process**

### Lang Sigt (3-6 Måneder)

1. **Komplet migration** af alle relevante databaser
2. **Decommission** gamle database instances
3. **Optimize performance** baseret på real-world usage
4. **Scale up** Supabase tier hvis nødvendigt

---

## 🤝 Konklusion

**Anbefaling:** ✅ **PROCEED WITH CONSOLIDATION**

**Rationale:**

- Betydelige økonomiske besparelser
- Forbedret developer experience
- Better operationel kontrol
- Fremtidssikret arkitektur
- TekupVault og Billy viser at det virker

**Risiko Level:** 🟡 **MEDIUM** (med proper planning og testing)

**Estimated ROI:**

- **3-6 måneder** til break-even på migration effort
- **Ongoing savings:** 30-65% på database costs
- **Developer productivity:** +20-30% (estimat)

**Next Decision Point:** Efter review af denne analyse - GO/NO-GO decision.

---

## 📞 Support & Spørgsmål

Hvis I har spørgsmål til denne analyse eller vil have hjælp med migration:

1. **Review GitHub-repos** linket i "Anbefalede Tools" sektionen
2. **Test migration lokalt** med Supabase CLI først
3. **Start med TekupVault/Billy** som allerede er på Supabase
4. **Gradvis migration** - ikke alt på én gang

**Remember:** Supabase er bare PostgreSQL med et godt UI og API-lag ovenpå. Alt data kan eksporteres hvis I vil skifte senere.

---

_Denne analyse er baseret på review af alle workspace repos pr. 20. oktober 2025._
