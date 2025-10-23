# RenOS.dk Database & Platform Analyse
**Dato:** 19. oktober 2025  
**Formål:** Konsolidere RendetaljeOS og Tekup-org til ét RenOS.dk driftssystem

---

## 🎯 Executive Summary

### Nuværende Situation
- **www.rendetalje.dk**: Kundevendt WordPress hjemmeside (349 DKK/time, 10 services, Aarhus områder)
- **RendetaljeOS**: Backend monorepo med omfattende lead/email automation (549 linjer schema)
- **Tekup-org**: Multi-tenant Job Scheduling System (605 linjer schema) - KOMPLET UI
- **Overlap**: 60% duplicate funktionalitet mellem de to systemer

### Anbefalinger
1. **Konsolider** RendetaljeOS + Tekup-org → **RenOS.dk operations platform**
2. **Implementer** Supabase best practices (RLS, Realtime, Storage)
3. **Modulariser** systemet med plugin-arkitektur
4. **Bevar** rendetalje.dk som customer-facing site med embedded booking widget

---

## 📊 Database Schema Analyse

### RendetaljeOS Schema (549 linjer)
**Styrker:**
- ✅ Avanceret lead scoring (AI-baseret 0-100 + priority)
- ✅ Firecrawl enrichment (company data, industry, estimated value)
- ✅ Gmail/Calendar integration med thread tracking
- ✅ Email automation (AI-generated responses, approval workflow)
- ✅ Escalation system med conflict detection
- ✅ Billy.dk fakturering integration
- ✅ Competitor pricing scraping

**Mangler:**
- ❌ Multi-tenant support
- ❌ Route optimization
- ❌ Team skill management
- ❌ Quality control workflow
- ❌ Inventory management

### Tekup-org CRM Schema (605 linjer)
**Styrker:**
- ✅ Multi-tenant SaaS arkitektur
- ✅ Route optimization (distance, cost, GPS)
- ✅ Team management (8 skills, certifications, availability)
- ✅ Quality control (før/efter fotos, ratings, sentiment)
- ✅ Calendar integration (5 event types)
- ✅ Inventory (equipment + supplies)
- ✅ Comprehensive analytics (6 KPIs)
- ✅ GDPR audit logging

**Mangler:**
- ❌ Lead scoring & enrichment
- ❌ Email automation
- ❌ Billy.dk integration
- ❌ Firecrawl competitor tracking

---

## 🚨 Kritiske Gaps (Supabase Best Practices)

### 1. Row Level Security (RLS)
**Status:** ❌ IKKE IMPLEMENTERET  
**Supabase Best Practice:**
```sql
-- Eksempel: Tenant isolation
CREATE POLICY "Users can only access their tenant data"
ON customers FOR ALL
USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- Customer self-service
CREATE POLICY "Customers see only their own data"
ON bookings FOR SELECT
USING (customer_id = auth.uid());
```

**Anbefaling:** Implementer RLS for ALLE tabeller med tenant_id

---

### 2. Realtime Subscriptions
**Status:** ❌ IKKE UDNYTTET  
**Supabase Best Practice:**
```typescript
// Live booking updates
const channel = supabase
  .channel('bookings-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'bookings',
    filter: 'status=eq.in_progress'
  }, (payload) => updateUI(payload))
  .subscribe();

// Team coordination
const teamChannel = supabase
  .channel('team-coordination')
  .on('broadcast', { event: 'location-update' }, (msg) => updateMap(msg))
  .subscribe();
```

**Anbefaling:** Realtime til:
- Booking status changes
- Team location tracking
- Customer chat/support
- Job assignment notifications

---

### 3. Storage Buckets
**Status:** ❌ INGEN STORAGE KONFIGURATION  
**Supabase Best Practice:**
```sql
-- Public bucket til før/efter billeder
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-photos', 'job-photos', true);

-- Private bucket til fakturaer
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false);

-- RLS policy på storage
CREATE POLICY "Team members can upload job photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-photos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM bookings 
    WHERE tenant_id = auth.jwt() ->> 'tenant_id'
  )
);
```

**Anbefaling:** Opret buckets:
- `job-photos` (public) - Før/efter billeder
- `invoices` (private) - PDF fakturaer
- `customer-documents` (private) - Kontrakter, tilbud
- `team-documents` (private) - Certifikater, ID

---

### 4. pgvector Optimization
**Status:** ⚠️ AKTIVERET MEN IKKE OPTIMALT BRUGT  
**Supabase Best Practice:**
```sql
-- Semantic search på job beskrivelser
CREATE TABLE job_embeddings (
  id uuid PRIMARY KEY,
  job_id uuid REFERENCES cleaning_jobs(id),
  embedding vector(1536),
  created_at timestamptz DEFAULT now()
);

-- IVFFlat index for <100k jobs
CREATE INDEX ON job_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Match function
CREATE FUNCTION match_similar_jobs(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (job_id uuid, similarity float)
LANGUAGE sql STABLE
AS $$
  SELECT job_id, 1 - (embedding <=> query_embedding) AS similarity
  FROM job_embeddings
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

**Use Cases:**
- Intelligent job matching til teammedlemmer
- "Lignende opgaver" forslag
- Knowledge base search (support docs)
- Customer inquiry routing

---

## 🏗️ Konsolideret Database Design

### Anbefalet Struktur
```
renos_database/
├── core/
│   ├── tenants (multi-tenant root)
│   ├── users (auth + roles)
│   └── system_config
├── crm/
│   ├── customers (CVR, contracts, preferences)
│   ├── customer_locations
│   ├── leads (AI scoring + enrichment)
│   └── customer_feedback
├── operations/
│   ├── cleaning_jobs (MASTER - alle bookings)
│   ├── job_team_members
│   ├── cleaning_plans (templates + recurring)
│   ├── cleaning_tasks
│   └── job_photos
├── team/
│   ├── team_members (skills, certs, rates)
│   ├── routes (optimization)
│   ├── route_jobs
│   └── breaks (time tracking)
├── communication/
│   ├── email_threads (Gmail sync)
│   ├── email_messages (AI responses)
│   ├── email_responses (approval queue)
│   └── escalations (conflict detection)
├── billing/
│   ├── invoices (Billy.dk sync)
│   ├── invoice_line_items
│   └── quotes
├── inventory/
│   ├── equipment (maintenance schedule)
│   └── supplies (auto-reorder)
├── analytics/
│   ├── scheduling_metrics
│   ├── task_executions (GDPR audit)
│   └── competitor_pricing (Firecrawl)
└── calendar/
    └── calendar_events (Google sync)
```

---

## 🔗 Sammenligning: Hvad Hver Schema Har

| Funktionalitet | RendetaljeOS | Tekup-org | Anbefaling |
|----------------|--------------|-----------|------------|
| **Multi-tenant** | ❌ | ✅ | BEHOLD Tekup-org |
| **Lead scoring** | ✅ (AI 0-100) | ❌ | BEHOLD RendetaljeOS |
| **Firecrawl enrichment** | ✅ | ❌ | BEHOLD RendetaljeOS |
| **Gmail automation** | ✅ | ❌ | BEHOLD RendetaljeOS |
| **Escalation system** | ✅ | ❌ | BEHOLD RendetaljeOS |
| **Route optimization** | ❌ | ✅ | BEHOLD Tekup-org |
| **Team skills** | ❌ | ✅ (8 typer) | BEHOLD Tekup-org |
| **Quality control** | ❌ | ✅ (fotos+ratings) | BEHOLD Tekup-org |
| **Inventory** | ❌ | ✅ | BEHOLD Tekup-org |
| **Billy.dk** | ✅ | ❌ | BEHOLD RendetaljeOS |
| **Time tracking** | ✅ (breaks+efficiency) | ❌ | BEHOLD RendetaljeOS |
| **Cleaning plans** | ✅ (templates) | ❌ | BEHOLD RendetaljeOS |
| **Analytics** | ⚠️ Basic | ✅ (6 KPIs) | BEHOLD Tekup-org |
| **Audit logging** | ⚠️ Task exec only | ✅ (GDPR compliant) | BEHOLD Tekup-org |

---

## 🎨 RenOS.dk Platform Design

### Overordnet Arkitektur
```
┌─────────────────────────────────────────────────────────┐
│          www.rendetalje.dk (Customer-facing)            │
│  WordPress + Booking Widget → RenOS.dk API              │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              www.renos.dk (Operations)                  │
│  ┌───────────┬───────────┬───────────┬────────────┐    │
│  │ Dashboard │ Calendar  │   Team    │  Customers │    │
│  ├───────────┼───────────┼───────────┼────────────┤    │
│  │   Jobs    │   Routes  │ Inventory │  Invoicing │    │
│  ├───────────┼───────────┼───────────┼────────────┤    │
│  │ Analytics │  Quality  │ Settings  │   Support  │    │
│  └───────────┴───────────┴───────────┴────────────┘    │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              Supabase PostgreSQL + pgvector             │
│     + Realtime + Storage + Auth + RLS Policies          │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                  External Integrations                  │
│  Tekup-Billy │ Google Calendar │ Gmail │ Firecrawl      │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 12 Core Modules (UI allerede komplet i Tekup-org)

### 1. Dashboard
- KPI cards: Jobs i dag, Team utilization, Revenue, Customer satisfaction
- Live map med team locations (Realtime)
- Upcoming bookings timeline
- Recent customer feedback
- Alert notifications (escalations)

### 2. Calendar
- Drag-drop scheduling
- Team member availability overlay
- Recurring job templates
- Google Calendar 2-way sync
- Resource conflict detection

### 3. Team Management
- Medarbejder profiler (skills, certs, rates)
- Availability scheduling
- Performance metrics (on-time %, quality scores)
- Training & certification tracking
- Payroll summary (timer × rates)

### 4. Customer Portal
- Customer profiles (CVR, contracts)
- Location management
- Service history
- Invoice portal
- Self-service booking
- Feedback & ratings

### 5. Jobs (Cleaning Jobs)
- Status workflow: Scheduled → Confirmed → In Progress → Completed
- Time tracking med breaks
- Før/efter foto upload (Supabase Storage)
- Cleaning plan checklist
- Customer signature
- Quality control

### 6. Route Optimization
- Auto-generate optimal routes
- Distance & cost calculation
- Real-time GPS tracking
- Traffic integration (Google Maps API)
- Route replanning ved changes

### 7. Inventory
- Equipment tracking (maintenance schedule)
- Supply management (auto-reorder ved min stock)
- Usage logging per job
- Cost tracking
- Supplier integration

### 8. Invoicing (Billy.dk)
- Auto-generate fakturaer fra completed jobs
- Line items: Hours × Rate + Supplies
- 25% moms automatic
- Billy.dk sync (32 MCP tools)
- PDF generation + email
- Payment tracking (MobilePay, bank transfer)

### 9. Analytics
- **Operational:** Team utilization, route efficiency, on-time completion
- **Financial:** Revenue, average job value, invoice aging
- **Quality:** Customer satisfaction, retention, NPS
- **Forecasting:** Job volume trends, capacity planning
- Export til Excel/CSV

### 10. Quality Control
- Job inspection checklist
- Before/after photo comparison
- Customer rating (1-5 stars)
- Issue escalation workflow
- Quality trends per team member

### 11. Settings
- Tenant configuration
- User management (roles)
- Service type definitions
- Pricing rules
- Email templates (AI approval)
- Integration credentials (Billy, Google, Firecrawl)

### 12. Support/Help
- Knowledge base (pgvector semantic search)
- AI chatbot (trained på docs)
- Ticket system
- FAQ

---

## 🧩 Modulær Arkitektur

### Plugin System
```typescript
// Plugin interface
interface RenOSPlugin {
  id: string;
  name: string;
  version: string;
  dependencies: string[];
  
  // Lifecycle hooks
  onInstall(): Promise<void>;
  onEnable(): Promise<void>;
  onDisable(): Promise<void>;
  
  // UI extensions
  dashboardWidgets?: Widget[];
  menuItems?: MenuItem[];
  settingsPage?: Component;
  
  // Data hooks
  onJobCreated?(job: CleaningJob): Promise<void>;
  onInvoiceGenerated?(invoice: Invoice): Promise<void>;
}

// Eksempel: Billy.dk Plugin
export const BillyPlugin: RenOSPlugin = {
  id: 'tekup-billy',
  name: 'Billy.dk Fakturering',
  version: '1.4.0',
  dependencies: ['core', 'invoicing'],
  
  dashboardWidgets: [
    {
      id: 'billy-sync-status',
      component: BillySyncWidget,
      size: 'medium'
    }
  ],
  
  async onInvoiceGenerated(invoice) {
    await syncToBilly(invoice);
  }
};
```

### Moduler som Packages
```
packages/
├── @renos/core (auth, tenant, base types)
├── @renos/crm (customers, leads, feedback)
├── @renos/scheduling (jobs, calendar, routes)
├── @renos/team (members, skills, time tracking)
├── @renos/billing (invoices, quotes, payments)
├── @renos/quality (photos, ratings, checklists)
├── @renos/inventory (equipment, supplies)
├── @renos/analytics (metrics, reports)
├── @renos/communication (email, SMS, push)
└── @renos/integrations
    ├── billy-dk
    ├── google-workspace
    └── firecrawl
```

---

## 🚀 Implementation Roadmap

### Phase 1: Database Consolidation (2 uger)
- [ ] Merge RendetaljeOS + Tekup-org schemas
- [ ] Implement RLS policies (ALL tables)
- [ ] Setup Supabase Storage buckets
- [ ] Configure Realtime channels
- [ ] Optimize pgvector indexes
- [ ] Create declarative migrations

### Phase 2: Core Modules (4 uger)
- [ ] Dashboard (KPIs, live map)
- [ ] Calendar (drag-drop, Google sync)
- [ ] Jobs (workflow, time tracking)
- [ ] Team Management (skills, availability)
- [ ] Customer Portal (self-service)

### Phase 3: Advanced Features (4 uger)
- [ ] Route Optimization (Google Maps API)
- [ ] Quality Control (foto upload, ratings)
- [ ] Invoicing (Billy.dk integration)
- [ ] Analytics (6 KPIs)
- [ ] Inventory (auto-reorder)

### Phase 4: Communication & AI (3 uger)
- [ ] Email automation (Gmail sync)
- [ ] AI-generated responses (approval queue)
- [ ] Escalation system (conflict detection)
- [ ] Lead scoring (Firecrawl enrichment)
- [ ] Chatbot support (pgvector semantic search)

### Phase 5: Production Launch (2 uger)
- [ ] Security audit
- [ ] Performance testing (load test 1000 concurrent users)
- [ ] GDPR compliance check
- [ ] Backup & disaster recovery setup
- [ ] Training dokumentation (dansk)
- [ ] Go-live: www.renos.dk

**Total:** 15 uger (~3.5 måneder)

---

## 💡 Key Takeaways

### ✅ Du Har Allerede
1. **Komplet UI** - Tekup-org Job Scheduling System (12 moduler, Docker-ready)
2. **Billy.dk Integration** - v1.4.0 production (32 MCP tools)
3. **Email Automation** - AI response generation, approval workflow
4. **Lead Scoring** - Firecrawl enrichment + AI 0-100 scoring
5. **Multi-tenant Base** - Tekup-org CRM arkitektur

### 🔨 Hvad Der Mangler
1. **RLS Policies** - Supabase security
2. **Realtime** - Live updates
3. **Storage** - Foto/dokument håndtering
4. **Schema Consolidation** - Merge overlap
5. **Plugin Architecture** - Modular system

### 🎯 Næste Skridt
1. Læs resten af denne rapport
2. Beslut hvilke features fra RendetaljeOS vs Tekup-org
3. Design unified schema (phase 1)
4. Implementer Supabase best practices
5. Start Phase 2 udvikling

---

**Spørgsmål?** Lad os dykke dybere ned i et specifikt område! 🚀
