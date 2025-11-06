# Shortwave Workflow Analysis & Implementation Plan

**Dato:** 2. november 2025
**Source:** User Analysis af info@rendetalje.dk workflow
**Status:** Analysis Complete - Ready for Implementation

---

## 📊 Eksisterende Workflow Struktur

### Label Pipeline (Fra Analysis):

```
INBOX → Needs Action → Needs Reply → Venter på svar → I kalender → Finance → Afsluttet
```

### Label Kategorier:

1. **Lead Sources (Kilde-tracking):**
   - `Leads` – generisk label
   - `Rengøring.nu` – Leadmail.no/Nettbureau
   - `Rengøring Århus` – Leadpoint.dk
   - `AdHelp` – AdHelp leads

2. **Lead Status (Pipeline stages):**
   - `Needs Action` / `Needs Reply` – nye leads
   - `Venter på svar` – tilbud sendt
   - `I kalender` – booking bekræftet
   - `Finance` – faktura sendt
   - `Afsluttet` – opgave udført + betalt

3. **Opgavetyper:**
   - `Fast Rengøring` – recurring
   - `Flytterengøring` – move-out
   - `Hovedrengøring` – deep cleans
   - `Engangsopgaver` – one-time

4. **Special Labels:**
   - `IMPORTANT` – høj prioritet
   - `STARRED` – flagged
   - `Blocked` – problematiske kunder
   - `Cold Outreach` – outbound

---

## 🔍 Gap Analysis: Hvad Mangler?

### ❌ Mangler i Nuværende Implementation:

1. **Pipeline View**
   - ❌ Ingen visualisering af lead pipeline
   - ❌ Ingen quick actions til pipeline transitions
   - ❌ Ingen status badges per email

2. **Smart Labeling**
   - ❌ Ingen auto-detection af lead source
   - ❌ Ingen auto-labeling baseret på indhold
   - ❌ Ingen workflow automation

3. **Label Management**
   - ⚠️ Labels kan tilføjes/fjernes, men ingen pipeline logic
   - ❌ Ingen bulk label updates
   - ❌ Ingen label templates/rules

4. **Cross-System Integration**
   - ⚠️ Lead lookup virker, men mangler flow
   - ❌ Ingen auto-calendar creation fra "I kalender"
   - ❌ Ingen auto-invoice creation fra "Finance"
   - ❌ Ingen thread → lead → calendar → invoice tracking

5. **Workflow Automation**
   - ❌ Ingen auto-transitions (Needs Action → Venter på svar)
   - ❌ Ingen critical rules implementation
   - ❌ Ingen email source detection (Rengøring.nu vs. AdHelp)

6. **Dashboard View**
   - ❌ Ingen pipeline status overview
   - ❌ Ingen metrics/statistics
   - ❌ Ingen quick filters per stage

---

## ✅ Hvad Vi Allerede Har:

1. **Basic Label Management:**
   - ✅ Add/Remove labels
   - ✅ Label list i sidebar
   - ✅ Label filtering
   - ✅ Color coding

2. **Email Actions:**
   - ✅ Reply, Forward, Archive, Delete
   - ✅ Star/Unstar
   - ✅ Mark as Read/Unread

3. **Basic Integration:**
   - ✅ Lead lookup (CustomerProfile)
   - ✅ Calendar events lookup
   - ✅ Invoice lookup (placeholder)

---

## 🎯 Implementation Priority

### Priority 1: Core Pipeline (Kritisk - 2-4 timer)

#### 1.1 Pipeline Status View

**Hvad:** Vis emails grupperet efter pipeline stage
**Features:**

- Column view: Needs Action | Venter på svar | I kalender | Finance
- Drag-and-drop til pipeline transitions
- Quick action buttons per stage
- Status badges

#### 1.2 Smart Label Detection

**Hvad:** Auto-detect lead source fra email content/from
**Features:**

- Detect `Rengøring.nu` (fra Leadmail.no/Nettbureau)
- Detect `Rengøring Århus` (fra Leadpoint.dk)
- Detect `AdHelp` (fra adhelp.dk)
- Auto-apply source label
- Auto-apply "Needs Action" for nye leads

#### 1.3 Pipeline Quick Actions

**Hvad:** Quick actions til pipeline transitions
**Features:**

- "Send Tilbud" → Remove "Needs Action", Add "Venter på svar"
- "Bekræft Booking" → Remove "Venter på svar", Add "I kalender" + Create Calendar Event
- "Send Faktura" → Remove "I kalender", Add "Finance" + Create Invoice
- "Afslut" → Remove "INBOX", Add "Afsluttet"

### Priority 2: Workflow Automation (Vigtigt - 4-6 timer)

#### 2.1 Critical Rules Implementation

**Hvad:** Implementer de kritiske regler fra analysis
**Features:**

- **Rengøring.nu:** ALDRIG reply direkte – opret ny email til kundens adresse
- **AdHelp:** Send ALTID tilbud til kundens email (IKKE til mw@/sp@adhelp.dk)
- **Rengøring Aarhus:** Kan svares direkte normalt

#### 2.2 Auto-Calendar Integration

**Hvad:** Auto-create calendar events når "I kalender" label tilføjes
**Features:**

- Extract dato/tid fra email
- Create calendar event med korrekt format
- Link email thread til calendar event
- NEVER add attendees (MEMORY_19)

#### 2.3 Auto-Invoice Integration

**Hvad:** Auto-create Billy invoice når "Finance" label tilføjes
**Features:**

- Extract opgavetype og timer fra email/thread
- Calculate price (349 kr/t incl. moms)
- Select correct product (REN-001 til REN-005)
- Create invoice via Billy API
- Link invoice til email thread

### Priority 3: Advanced Features (Nice-to-Have - 6-8 timer)

#### 3.1 Pipeline Dashboard

**Hvad:** Overview af pipeline status
**Features:**

- Metrics: Leads per stage, conversion rates
- Charts: Pipeline funnel
- Quick filters per stage
- Recent activity feed

#### 3.2 Bulk Operations

**Hvad:** Bulk pipeline transitions
**Features:**

- Select multiple emails
- Bulk apply labels
- Bulk pipeline transitions
- Progress indicator

#### 3.3 Email Templates System

**Hvad:** Templates for standard svar
**Features:**

- Templates for: Lead Response, Quote Follow-up, Payment Reminder, Booking Confirmation
- Variables: {{customerName}}, {{serviceType}}, {{date}}
- Auto-fill from context

---

## 🏗️ Technical Implementation Plan

### Database Schema Additions:

```sql
-- Pipeline State Tracking
CREATE TABLE email_pipeline_state (
  thread_id VARCHAR(255) PRIMARY KEY,
  stage VARCHAR(50) NOT NULL, -- 'new', 'quoted', 'pending', 'booked', 'invoiced', 'done'
  source VARCHAR(50), -- 'rengoring_nu', 'rengoring_aarhus', 'adhelp', 'direct'
  task_type VARCHAR(50), -- 'fast', 'flyter', 'hoved', 'engangr'
  lead_id INT,
  calendar_event_id VARCHAR(255),
  invoice_id VARCHAR(255),
  transitioned_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id),
  INDEX idx_stage (stage),
  INDEX idx_source (source)
);

-- Pipeline Transitions History
CREATE TABLE email_pipeline_transitions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  thread_id VARCHAR(255) NOT NULL,
  from_stage VARCHAR(50),
  to_stage VARCHAR(50) NOT NULL,
  triggered_by VARCHAR(255), -- user_id eller 'auto'
  metadata JSON, -- Additional context
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES email_pipeline_state(thread_id),
  INDEX idx_thread_id (thread_id)
);

-- Label Rules (Auto-labeling)
CREATE TABLE email_label_rules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  priority INT DEFAULT 0,
  conditions JSON NOT NULL, -- { from: "...", subject: "...", body: "..." }
  actions JSON NOT NULL, -- { addLabels: [...], removeLabels: [...] }
  enabled BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Backend API Additions:

```typescript
// New tRPC endpoints
inbox.email: {
  // Pipeline
  getPipelineState: (threadId) => PipelineState
  updatePipelineStage: (threadId, stage) => void
  getPipelineStats: () => PipelineStats

  // Smart Labeling
  detectLeadSource: (threadId) => LeadSource
  autoApplyLabels: (threadId) => void

  // Workflow
  transitionToQuoted: (threadId, quoteData) => void
  transitionToBooked: (threadId, bookingData) => void
  transitionToInvoiced: (threadId, invoiceData) => void

  // Critical Rules
  handleRengoringNuLead: (threadId) => void
  handleAdHelpLead: (threadId) => void
}
```

### Frontend Components:

```typescript
// New components
-EmailPipelineView.tsx - // Column-based pipeline view
  PipelineQuickActions.tsx - // Quick action buttons
  PipelineStats.tsx - // Dashboard statistics
  SmartLabelSuggestions.tsx - // AI-powered label suggestions
  EmailSourceDetector.tsx; // Auto-detect lead source
```

---

## 🚀 Implementation Roadmap

### Phase 1: Core Pipeline (Uge 1)

- [ ] Pipeline Status View component
- [ ] Pipeline state tracking (database + API)
- [ ] Pipeline quick actions
- [ ] Basic transitions

### Phase 2: Smart Labeling (Uge 2)

- [ ] Lead source detection
- [ ] Auto-labeling rules
- [ ] Label rules engine
- [ ] Testing med faktiske emails

### Phase 3: Workflow Automation (Uge 3)

- [ ] Critical rules implementation
- [ ] Auto-calendar integration
- [ ] Auto-invoice integration
- [ ] Thread → Lead → Calendar → Invoice tracking

### Phase 4: Advanced Features (Uge 4)

- [ ] Pipeline dashboard
- [ ] Bulk operations
- [ ] Email templates
- [ ] Metrics & analytics

---

## 💡 Key Insights fra Analysis

1. **Pipeline er kritisk** - Det er ikke bare labels, det er en workflow
2. **Source tracking er vigtigt** - Forskellige kilder kræver forskellige regler
3. **Automation skal være smart** - Ikke bare auto-apply, men auto-transition
4. **Cross-system linking** - Email → Lead → Calendar → Invoice skal være synkroniseret
5. **Critical rules er ikke-negotiable** - Rengøring.nu og AdHelp har specifikke regler

---

## 🎯 Immediate Next Steps

**Start med Priority 1:**

1. Implementer Pipeline Status View
2. Implementer Smart Label Detection
3. Implementer Pipeline Quick Actions

**Derefter Priority 2:** 4. Implementer Critical Rules 5. Implementer Auto-Calendar Integration 6. Implementer Auto-Invoice Integration

---

## 🚨 Critical Issue: Gmail Rate Limits

### Problem:

- **Gmail API Rate Limits:** 429 (RESOURCE_EXHAUSTED) fejl ved for mange API-kald
- **Impact:** Rapporter, enrichment, og sync jobs fejler
- **Root Cause:** Gmail API har lave per-user burst-tolerancer (~1 kald/sek)

### Solution: Self-Hosted SMTP Email Server

- **Alternative til Gmail API:** Implementer `inbound-email` (Node.js SMTP → Webhook)
- **Benefits:** Zero rate limits, real-time delivery, fuld kontrol
- **Status:** Analysis complete - Se `GMAIL_RATE_LIMIT_ALTERNATIVES.md`

### Implementation Priority:

**Priority 0 (Before Pipeline):** Setup SMTP infrastructure
**Why:** Pipeline features kræver stabil email ingestion uden rate limits

---

**Status:** ✅ Analysis Complete
**Next:**

1. **Priority 0:** Setup SMTP email server (inbound-email)
2. **Priority 1:** Implementer Pipeline features
