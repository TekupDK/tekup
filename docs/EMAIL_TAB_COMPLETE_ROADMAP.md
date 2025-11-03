# Email Tab Complete Roadmap - Tekup AI v2

**Dato:** 2. november 2025
**Status:** Active Development
**Last Updated:** Efter Gmail Rate Limit Analysis

---

## 📊 Overview

Dette dokument konsoliderer alle email tab features, issues, og implementation plans i én komplet roadmap.

### Dokumenter:
- `SHORTWAVE_WORKFLOW_ANALYSIS.md` - Workflow analysis og pipeline features
- `SHORTWAVE_PIPELINE_IMPLEMENTATION.md` - Pipeline implementation guide
- `GMAIL_RATE_LIMIT_ALTERNATIVES.md` - SMTP alternative til Gmail API
- `EMAIL_TAB_MODALS_ROADMAP.md` - Modals og dialogs
- `EMAIL_TAB_TEST_SUMMARY.md` - Test reports

---

## 🎯 Implementation Phases

### Phase 0: Fix Gmail Rate Limits (KRITISK - 1-2 dage)

**Problem:** Gmail API rate limits (429 errors) blokerer alle email features
**Solution:** Self-hosted SMTP server via `inbound-email`

#### Tasks:
- [ ] **Setup inbound-email SMTP server**
  - Clone `github.com/sendbetter/inbound-email`
  - Docker setup og deployment
  - Configure webhook URL

- [ ] **Google Workspace Configuration**
  - Auto-forward fra `info@rendetalje.dk` → `parse@tekup.dk`
  - Eller Dual Delivery (kopi til SMTP server)

- [ ] **DNS Setup**
  - MX records for `parse.tekup.dk`
  - SPF/DKIM records

- [ ] **Backend Webhook**
  - Create `/api/inbound/email` endpoint
  - Parse email data (from, to, subject, body, attachments)
  - Insert into Supabase (`emails`, `email_threads`, `attachments` tables)

- [ ] **Enrichment Pipeline (NO Gmail API)**
  - Billy contactPersons lookup (allerede implementeret)
  - Auto-detect lead source (Rengøring.nu, AdHelp, etc.)
  - Auto-label "Needs Action" for nye leads
  - Cache email metadata

**Status:** 🔴 Blocking - Må løses før andre features
**Priority:** CRITICAL
**Estimated Time:** 1-2 dage

---

### Phase 1: Core Pipeline Features (4-6 timer)

**Goal:** Implementer Shortwave-inspired pipeline workflow

#### 1.1 Pipeline Status View
- Column layout: Needs Action | Venter på svar | I kalender | Finance
- Drag-and-drop emails mellem stages
- Visual feedback og status badges

#### 1.2 Smart Label Detection
- Auto-detect lead source (Rengøring.nu, Rengøring Århus, AdHelp)
- Auto-apply source labels
- Auto-apply "Needs Action" for nye leads

#### 1.3 Pipeline Quick Actions
- "Send Tilbud" → Remove "Needs Action", Add "Venter på svar"
- "Bekræft Booking" → Remove "Venter på svar", Add "I kalender"
- "Send Faktura" → Remove "I kalender", Add "Finance"
- "Afslut" → Remove "INBOX", Add "Afsluttet"

**Status:** 🟡 Pending - Afventer Phase 0
**Priority:** HIGH
**Estimated Time:** 4-6 timer

---

### Phase 2: Workflow Automation (6-8 timer)

#### 2.1 Critical Rules Implementation
- **Rengøring.nu:** ALDRIG reply direkte – opret ny email til kundens adresse
- **AdHelp:** Send ALTID tilbud til kundens email (IKKE til mw@/sp@adhelp.dk)
- **Rengøring Aarhus:** Kan svares direkte normalt

#### 2.2 Auto-Calendar Integration
- Auto-create calendar events når "I kalender" label tilføjes
- Extract dato/tid fra email
- Link email thread til calendar event
- NEVER add attendees (MEMORY_19)

#### 2.3 Auto-Invoice Integration
- Auto-create Billy invoice når "Finance" label tilføjes
- Extract opgavetype og timer fra email/thread
- Calculate price (349 kr/t incl. moms)
- Select correct product (REN-001 til REN-005)
- Link invoice til email thread

**Status:** 🟡 Pending - Afventer Phase 1
**Priority:** HIGH
**Estimated Time:** 6-8 timer

---

### Phase 3: Advanced Features (8-10 timer)

#### 3.1 Pipeline Dashboard
- Metrics: Leads per stage, conversion rates
- Charts: Pipeline funnel
- Quick filters per stage
- Recent activity feed

#### 3.2 Bulk Operations
- Select multiple emails
- Bulk apply labels
- Bulk pipeline transitions
- Progress indicator

#### 3.3 Email Templates System
- Templates for: Lead Response, Quote Follow-up, Payment Reminder, Booking Confirmation
- Variables: {{customerName}}, {{serviceType}}, {{date}}
- Auto-fill from context

**Status:** 🟡 Pending - Nice-to-Have
**Priority:** MEDIUM
**Estimated Time:** 8-10 timer

---

## 📁 Completed Features

### ✅ Basic Email Tab (Færdig)
- [x] Email list med filtering
- [x] Email thread view
- [x] Basic actions (Reply, Forward, Archive, Delete)
- [x] Label management (Add/Remove)
- [x] Search functionality
- [x] Customer profile integration
- [x] Calendar events lookup
- [x] Invoice lookup (placeholder)

### ✅ Modals & Dialogs (Færdig)
- [x] EmailConfirmationDialog - Destructive actions
- [x] EmailPreviewModal - Quick email preview
- [x] EmailComposer - Compose, reply, forward
- [ ] EmailSnoozeModal - Snooze with date/time picker (Pending)
- [ ] BulkActionsModal - Bulk email operations (Pending)
- [ ] LabelManagementModal - Label administration (Pending)

---

## 🔧 Technical Stack

### Backend:
- **Email Ingestion:** `inbound-email` (SMTP → Webhook)
- **Email Parsing:** `mailparser` (MIME parsing)
- **API:** tRPC (type-safe endpoints)
- **Database:** Supabase (PostgreSQL)
- **Email Actions:** Gmail API (kun sending/modifications, ikke reading)

### Frontend:
- **Framework:** React + Next.js
- **UI:** Tailwind CSS + Radix UI
- **State:** React Query (tRPC)
- **Components:** Custom email components

### Integrations:
- **Billy:** Customer data, invoices
- **Google Calendar:** Event creation, availability
- **Supabase:** Email storage, caching

---

## 📋 Database Schema

### Email Tables:
```sql
-- Emails (from SMTP webhook)
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id TEXT UNIQUE, -- 'inbound-{messageId}'
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT,
  text TEXT,
  html TEXT,
  received_at TIMESTAMPTZ NOT NULL,
  thread_key TEXT, -- For grouping
  customer_id UUID REFERENCES customers(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Threads
CREATE TABLE email_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id TEXT UNIQUE NOT NULL, -- Gmail thread ID
  subject TEXT,
  snippet TEXT,
  labels TEXT[],
  last_message_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attachments
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID REFERENCES emails(id),
  filename TEXT NOT NULL,
  mime_type TEXT,
  size INTEGER,
  storage_key TEXT, -- Supabase Storage key
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pipeline State
CREATE TABLE email_pipeline_state (
  thread_id TEXT PRIMARY KEY,
  stage TEXT NOT NULL, -- 'needs_action', 'venter_pa_svar', 'i_kalender', 'finance', 'afsluttet'
  source TEXT, -- 'rengoring_nu', 'rengoring_aarhus', 'adhelp', 'direct'
  task_type TEXT, -- 'fast_rengoring', 'flytterengoring', 'hovedrengoring', 'engangsopgaver'
  lead_id UUID REFERENCES leads(id),
  calendar_event_id TEXT,
  invoice_id TEXT,
  transitioned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pipeline Transitions History
CREATE TABLE email_pipeline_transitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id TEXT NOT NULL,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  triggered_by TEXT, -- user_id eller 'auto'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Label Rules (Auto-labeling)
CREATE TABLE email_label_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  conditions JSONB NOT NULL, -- { from: "...", subject: "...", body: "..." }
  actions JSONB NOT NULL, -- { addLabels: [...], removeLabels: [...] }
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🚀 Quick Start Implementation

### 1. Setup SMTP Server (Phase 0)
```bash
# Clone inbound-email
git clone https://github.com/sendbetter/inbound-email.git
cd inbound-email

# Configure
cp .env.example .env
# Set: WEBHOOK_URL=https://friday-ai.tekup.dk/api/inbound/email
# Set: PORT=25
# Set: STORAGE_TYPE=supabase

# Docker build & run
docker build -t inbound-email .
docker run -d -p 25:25 inbound-email
```

### 2. Create Webhook Endpoint
```typescript
// server/api/inbound-email.ts
export async function POST(req: Request) {
  const email = await req.json();
  // Insert into Supabase, run enrichment, etc.
}
```

### 3. Implement Pipeline View
```typescript
// client/src/components/inbox/EmailPipelineView.tsx
// Column-based pipeline view med drag-and-drop
```

---

## 📊 Progress Tracking

### Completed:
- ✅ Basic email tab UI
- ✅ Modals (Confirmation, Preview)
- ✅ Email actions (Reply, Forward, Archive, Delete)
- ✅ Label management
- ✅ Search functionality

### In Progress:
- 🔄 Rate limit fix (SMTP alternative)
- 🔄 Pipeline status view

### Pending:
- ⏳ Smart label detection
- ⏳ Pipeline quick actions
- ⏳ Critical rules implementation
- ⏳ Auto-calendar integration
- ⏳ Auto-invoice integration

---

## 🔗 Related Documents

- `SHORTWAVE_WORKFLOW_ANALYSIS.md` - Komplet workflow analysis
- `SHORTWAVE_PIPELINE_IMPLEMENTATION.md` - Pipeline implementation guide
- `GMAIL_RATE_LIMIT_ALTERNATIVES.md` - SMTP alternative løsning
- `EMAIL_TAB_MODALS_ROADMAP.md` - Modals og dialogs
- `EMAIL_TAB_TEST_SUMMARY.md` - Test reports og issues

---

**Status:** 🟡 Active Development
**Next Milestone:** Phase 0 completion (SMTP infrastructure)

