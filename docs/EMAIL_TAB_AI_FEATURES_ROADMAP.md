# Email Tab AI Features - Implementation Roadmap

## 📊 Oversigt

Dette dokument viser de konkrete faser og features vi vil implementere for email-tabben i **Tekup AI v2 (Friday AI)**, baseret på Shortwave.ai's designprincipper.

---

## 🎯 Phase 1: Core Intelligence (Kritisk - Højst Prioritert)

### Feature 1.1: AI Email Summaries 📝

**Hvad det er:**

- Automatisk generering af 1-2 linjers resuméer af email-tråde
- Vises direkte i inbox-listen (som preview)
- Opdateres automatisk når nye messages tilføjes til tråden

**Hvorfor det er vigtigt:**

- ⏱️ **Tidsbesparelse**: Brugere kan se indholdet uden at åbne hver email
- 🎯 **Prioritering**: Hurtig identifikation af vigtige emails (leads, fakturaer)
- 📊 **Overblik**: Bedre forståelse af email-indbakken

**Implementering:**

```typescript
// Backend: server/email-ai-service.ts
interface EmailSummary {
  threadId: string;
  summary: string; // Max 150 karakterer
  keyPoints: string[]; // 3-5 bullet points
  actionRequired: boolean;
  urgency: "low" | "medium" | "high";
  suggestedLabel?: string;
  confidence: number; // 0-1
  analyzedAt: Date;
}

// API Endpoint
POST /api/inbox/email/summarize
GET /api/inbox/email/:threadId/summary
```

**UI Integration:**

- Vis summary i inbox-listen (under emne)
- Vis i thread view som expandable card
- Loading state mens summary genereres
- Badge hvis action required

**Kun vis summary når:**

- ✅ Email er længere end 100 ord
- ✅ Tråden har 2+ messages
- ❌ IKKE for newsletters/spam
- ❌ IKKE for korte emails

**Teknisk:**

- Bruger GPT-4o eller Gemini 2.5 Flash
- Cache i database (cache 24 timer)
- Batch processing for gamle emails (background job)

---

### Feature 1.2: Smart Auto-Labeling 🏷️

**Hvad det er:**

- Automatisk analyse af email-indhold + kontekst
- Forslår labels baseret på patterns og AI classification
- Kan auto-apply ved høj confidence (>90%)
- Lærer fra brugerens label-choices over tid

**Hvorfor det er vigtigt:**

- 🗂️ **Organisering**: Emails sorteres automatisk
- ⚡ **Hastighed**: Reducerer manuel label-arbejde med 70%+
- 🎓 **Læring**: Systemet bliver bedre over tid

**Labels til Friday AI v2 workflow:**

```
- "Leads"           → Nye kunder der anmoder om tilbud
- "Needs Reply"     → Emails der kræver svar (høj prioritet)
- "Venter på svar"  → Vi har sendt tilbud, venter på kundesvar
- "I kalender"      → Relateret til kalender-event
- "Finance"         → Faktura, betaling, regninger
- "Afsluttet"      → Completed jobs/projects
- "Fast Rengøring" → Relateret til fast rengøring
- "Flytterengøring" → Flytterengøring opgaver
- etc.
```

**Implementering:**

```typescript
// Backend: server/email-labeling-service.ts
interface LabelSuggestion {
  threadId: string;
  suggestions: Array<{
    label: string;
    confidence: number; // 0-1
    reason: string; // "Email indeholder 'tilbud' og 'rengøring'"
    patterns: string[]; // Keywords der matchede
  }>;
  autoApplied: boolean; // Hvis confidence > 0.9
}

// API Endpoints
POST /api/inbox/email/:threadId/suggest-labels
POST /api/inbox/email/:threadId/apply-label
GET /api/inbox/labels/patterns (learning data)
```

**UI Integration:**

- Dropdown i EmailActions: "Smart Label"
- Toast notification når label auto-applies
- Confidence score vises ved forslag
- "Undo" option hvis auto-apply var forkert

**Pattern Matching (Start simple, upgrade til AI):**

```typescript
const PATTERNS = {
  Leads: ["tilbud", "forespørgsel", "rengøring", "pris"],
  Finance: ["faktura", "betaling", "regning", "kr."],
  "Needs Reply": ["spørgsmål", "?", "henvendelse"],
  // ... etc
};
```

**Når aktiveres det:**

- ✅ Når ny email modtages (background)
- ✅ Ved manuel "Smart Label" action
- ✅ Batch processing af gamle emails (overnight job)

---

## 🚀 Phase 2: Productivity Features (Vigtigt)

### Feature 2.1: Auto-Suggest Replies 💬

**Hvad det er:**

- AI analyserer email og foreslår 3-4 reply-optioner
- Forskellige tones: professional, friendly, brief, detailed
- Context-aware: foreslår baseret på lead/invoice/booking status
- Integreret med smart templates

**Hvorfor det er vigtigt:**

- ⏱️ **Tidsbesparelse**: 50-70% mindre tid på at skrive svar
- 📝 **Konsistens**: Ensartet tone og kvalitet
- 🎯 **Relevans**: Context-aware suggestions

**Implementering:**

```typescript
// Backend: server/email-reply-service.ts
interface SuggestedReply {
  id: string;
  preview: string; // Første 100 karakterer
  fullText: string;
  tone: "professional" | "friendly" | "brief" | "detailed";
  estimatedLength: number; // words
  templateUsed?: string; // Template ID
  confidence: number;
}

// API Endpoint
POST /api/inbox/email/:threadId/suggest-replies
POST /api/inbox/email/:threadId/use-suggestion/:suggestionId
```

**UI Integration:**

- Vises automatisk når reply åbnes (efter 2 sekunder)
- 4 kort-visninger af forslag
- Click for at se fuld tekst
- "Use this" knap for at indsætte
- Kan edit efter indsættelse

**Reply Types for Friday AI v2:**

1. **Lead Response** - "Tak for din forespørgsel om rengøring..."
2. **Quote Follow-up** - "Vi har sendt tilbud for..."
3. **Payment Reminder** - "Venligst betal faktura..."
4. **Booking Confirmation** - "Vi bekræfter booking..."

**Når aktiveres det:**

- ✅ Automatisk når reply åbnes (non-intrusive)
- ✅ Via "Suggest Reply" knap
- ❌ IKKE for newsletters/spam
- ❌ IKKE hvis brugeren allerede skriver

---

### Feature 2.2: Smart Templates System 📋

**Hvad det er:**

- Context-aware templates med variable resolution
- Templates kan pull data fra leads/invoices/calendar
- AI kan complete templates med kontekst
- Template editor UI

**Hvorfor det er vigtigt:**

- 📝 **Konsistens**: Ensartede svar på standard-spørgsmål
- ⚡ **Hastighed**: Hurtigere end at skrive fra scratch
- 🔄 **Integration**: Binder emails sammen med leads/invoices

**Implementering:**

```typescript
// Backend: server/email-templates-service.ts
interface SmartTemplate {
  id: string;
  name: string; // "Tilbud - Flytterengøring"
  category: "lead" | "invoice" | "booking" | "follow-up";
  content: string; // Med placeholders: {{customerName}}
  variables: Array<{
    key: string; // "customerName"
    source: "lead" | "email" | "calendar" | "manual";
    defaultValue?: string;
    required: boolean;
  }>;
  usageCount: number;
  createdBy: number;
}

// API Endpoints
GET /api/inbox/templates
POST /api/inbox/templates
PUT /api/inbox/templates/:id
POST /api/inbox/templates/:id/resolve (fill variables)
DELETE /api/inbox/templates/:id
```

**Template Examples:**

```typescript
// Template 1: "Tilbud - Flytterengøring"
const template = {
  name: "Tilbud - Flytterengøring",
  content: `Hej {{customerName}},

Tak for din forespørgsel om flytterengøring.

Vi kan tilbyde:
- {{serviceDetails}}
- Pris: {{estimatedPrice}} kr.
- Adresse: {{address}}

Venligst bekræft hvis dette passer.

Med venlig hilsen
Rendetalje.dk`,
  variables: [
    { key: "customerName", source: "lead", required: true },
    { key: "serviceDetails", source: "lead", required: true },
    { key: "estimatedPrice", source: "lead", required: true },
    { key: "address", source: "lead", required: true },
  ],
};
```

**UI Integration:**

- Template dropdown i EmailComposer
- Template editor (modal)
- Variable resolution preview
- "Fill from context" knap (auto-fills fra lead/invoice)

---

## ✨ Phase 3: Advanced Features (Nice-to-have)

### Feature 3.1: Email Bundling/Grouping 📦

**Hvad det er:**

- Intelligent gruppering af relaterede emails
- Vises som expandable bundle i inbox
- Clustering baseret på sender, emne, eller kontekst

**Implementering:**

- Group emails med samme sender + similar subject
- Group emails relateret til samme calendar event
- Group emails relateret til samme invoice
- Expandable/collapsible UI

---

## 📋 Implementation Timeline

### Phase 1: Core Intelligence (4-6 uger)

- **Uge 1-2**: AI Email Summaries backend + frontend
- **Uge 3-4**: Smart Auto-Labeling (pattern matching + AI)
- **Uge 5-6**: Testing, tuning, optimization

### Phase 2: Productivity (4-6 uger)

- **Uge 1-2**: Smart Templates system
- **Uge 3-4**: Auto-Suggest Replies
- **Uge 5-6**: Integration + testing

### Phase 3: Advanced (2-4 uger)

- **Uge 1-2**: Email Bundling
- **Uge 3-4**: Polish + optimization

---

## 🎯 Success Metrics

### For hver feature:

**AI Summaries:**

- ✅ 80%+ accuracy (bruger feedback)
- ✅ 30%+ time saved per email
- ✅ 50%+ adoption rate

**Smart Labeling:**

- ✅ 85%+ accuracy
- ✅ 50%+ labels auto-applied
- ✅ 70%+ reduction i manuel label-arbejde

**Auto-Suggest Replies:**

- ✅ 60%+ usage rate
- ✅ 40%+ time saved
- ✅ 75%+ satisfaction score

**Smart Templates:**

- ✅ 70%+ usage rate
- ✅ 20%+ time saved
- ✅ 10+ templates created per bruger

---

## 🔧 Technical Requirements

### Database Schema:

```sql
-- Email AI Analysis
CREATE TABLE email_ai_analysis (
  thread_id VARCHAR(255) PRIMARY KEY,
  summary TEXT,
  key_points JSON,
  suggested_labels JSON,
  action_required BOOLEAN,
  urgency ENUM('low', 'medium', 'high'),
  confidence_score DECIMAL(3,2),
  model_used VARCHAR(50),
  analyzed_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Email Templates
CREATE TABLE email_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50),
  content TEXT NOT NULL,
  variables JSON,
  usage_count INT DEFAULT 0,
  created_by INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Label Learning Patterns
CREATE TABLE label_patterns (
  id INT PRIMARY KEY AUTO_INCREMENT,
  label_name VARCHAR(100),
  pattern_keywords JSON,
  success_rate DECIMAL(3,2),
  usage_count INT DEFAULT 0,
  last_updated TIMESTAMP
);
```

### AI/ML Services:

- GPT-4o eller Gemini 2.5 Flash for summaries
- Simple pattern matching for labels (start)
- Upgrade til AI classification senere

---

## ✅ Ready to Start?

**Phase 1 er klar til implementering:**

1. AI Email Summaries - Umiddelbar value
2. Smart Auto-Labeling - Kritisk for workflow

Skal vi starte med Phase 1, eller vil du se flere detaljer først?

