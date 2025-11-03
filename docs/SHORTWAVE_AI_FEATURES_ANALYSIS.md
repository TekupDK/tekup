# Shortwave.ai Design Analysis & Implementation Plan

## Executive Summary

Shortwave.ai er designet med fokus på **AI-drevet email intelligence** og **workflow automation**, ikke bare fancy UI. Deres features er dybt integreret i workflow'et, ikke bare "nice-to-have" additions.

---

## Core Design Principper fra Shortwave

### 1. **AI-first Approach**

- AI features er **integrerede**, ikke tilføjet efterfølgende
- AI analyserer **kontekst**, ikke bare tekst
- Features lærer fra brugerens workflow over tid

### 2. **Workflow-aware**

- Features forstår **hvornår** de skal aktiveres
- Automatisk **triage** baseret på indhold og kontekst
- **Proactive suggestions**, ikke reaktive pop-ups

### 3. **Context-rich Intelligence**

- AI ser på: **afsender, emne, indhold, tidligere korrespondance, labels, kalender events**
- Features er **kontekstuelle** - forskellige for leads vs. faktura vs. kalender

---

## Key Features Analyseret

### 1. **AI Email Summaries** 📝

**Hvordan Shortwave gør det:**

- Genererer 1-2 linjers resumé af hele email-tråden
- Vises automatisk i inbox-listen
- Opdateres når nye messages tilføjes
- Smart: kun vises hvis email er længere end X ord

**Implementering for Tekup AI v2:**

```typescript
// Pseudocode
interface EmailSummary {
  threadId: string;
  summary: string; // "Kunde anmoder om tilbud for flytterengøring"
  keyPoints: string[]; // ["3 værelser", "1.500 kr. estimat"]
  actionRequired: boolean;
  suggestedLabel?: string; // "Leads", "Needs Reply", etc.
}
```

**Når skal det vises:**

- ✅ Automatisk i inbox-listen (hvis email > 100 ord)
- ✅ Ved åbning af thread view
- ✅ I søgeresultater

**Når skal det IKKE vises:**

- ❌ Korte emails (< 50 ord)
- ❌ Trivielle emails (newsletters, etc.)

---

### 2. **Smart Auto-Labeling** 🏷️

**Hvordan Shortwave gør det:**

- Analyserer email indhold + kontekst
- Forslår labels baseret på **patterns** i tidligere emails
- Lærer fra brugerens label-choices over tid
- **Proactive** - ikke reaktiv

**Implementering for Tekup AI v2:**

```typescript
interface SmartLabel {
  threadId: string;
  confidence: number; // 0-1
  suggestedLabels: Array<{
    label: string; // "Leads", "Finance", etc.
    confidence: number;
    reason: string; // "Email indeholder 'tilbud' og 'rengøring'"
  }>;
  autoApply?: boolean; // Hvis confidence > 0.9
}
```

**Labels til Tekup AI v2 workflow:**

- **"Leads"** - Nye kunder der anmoder om tilbud
- **"Needs Reply"** - Emails der kræver svar
- **"Venter på svar"** - Vi har sendt tilbud og venter
- **"I kalender"** - Relateret til et kalender-event
- **"Finance"** - Faktura, betaling, regninger
- **"Afsluttet"** - Completed jobs/projects

**Når skal det aktiveres:**

- ✅ Når ny email modtages
- ✅ Ved manuel "Smart Label" action
- ✅ Batch processing af gamle emails (background job)

---

### 3. **Auto-Suggest Replies** 💬

**Hvordan Shortwave gør det:**

- Analyserer email indhold + kontekst
- Foreslår **3-4 reply options** med forskellige tones
- Shortwave bruger **templates** + **AI completion**
- Templates er **workflow-specifikke** - ikke generiske

**Implementering for Tekup AI v2:**

```typescript
interface SuggestedReply {
  id: string;
  preview: string; // "Tak for din forespørgsel. Vi kan tilbyde..."
  tone: "professional" | "friendly" | "brief" | "detailed";
  estimatedLength: number; // words
  includesPlaceholders: boolean; // For personalization
}
```

**Reply Templates for Tekup AI v2:**

1. **Lead Response** - "Tak for din forespørgsel om rengøring..."
2. **Quote Follow-up** - "Vi har sendt tilbud for..."
3. **Payment Reminder** - "Venligst betal faktura..."
4. **Booking Confirmation** - "Vi bekræfter booking..."

**Når skal det aktiveres:**

- ✅ Når email åbnes til reply
- ✅ Automatisk efter 2-3 sekunder (non-intrusive)
- ✅ Via "Suggest Reply" knap

**Når skal det IKKE aktiveres:**

- ❌ For newsletters/spam
- ❌ For indvendige emails
- ❌ Hvis brugeren allerede er i gang med at skrive

---

### 4. **Email Bundling/Grouping** 📦

**Hvordan Shortwave gør det:**

- Grupperer relaterede emails automatisk
- **Intelligent clustering** - ikke bare samme emne
- Vises som "expandable" bundle i inbox

**Implementering for Tekup AI v2:**

```typescript
interface EmailBundle {
  id: string;
  title: string; // "3 emails om rengøring tilbud"
  threadIds: string[];
  category: "lead" | "invoice" | "calendar" | "support";
  preview: string;
  unreadCount: number;
}
```

**Grouping Logic:**

- Same sender + similar subject = bundle
- Related calendar events = bundle
- Related invoices = bundle
- Related leads = bundle

---

### 5. **Smart Templates** 📋

**Hvordan Shortwave gør det:**

- Templates er **context-aware**
- AI kan **complete** templates med kontekst
- Templates kan **pull data** fra leads/invoices/calendar

**Implementering for Tekup AI v2:**

```typescript
interface SmartTemplate {
  id: string;
  name: string; // "Tilbud - Flytterengøring"
  category: "lead" | "invoice" | "booking" | "follow-up";
  content: string; // Med placeholders: {{customerName}}, {{serviceType}}
  variables: Array<{
    key: string; // "customerName"
    source: "lead" | "email" | "calendar" | "manual";
    defaultValue?: string;
  }>;
}
```

**Template Examples:**

1. **"Tilbud - Flytterengøring"**
   - Auto-fills: customer name, address, service type
   - Pulls from: lead data + email context

2. **"Bekræft Booking"**
   - Auto-fills: date, time, address, customer
   - Pulls from: calendar event + lead

3. **"Betalingspåmindelse"**
   - Auto-fills: invoice number, amount, due date
   - Pulls from: Billy.dk invoice data

---

## Implementation Prioritet

### Phase 1: Core Intelligence (Kritisk) 🎯

1. **AI Email Summaries** - Højst prioritet
   - Giver umiddelbar value
   - Forbedrer workflow betydeligt
   - Relativt simpel implementering

2. **Smart Auto-Labeling** - Høj prioritet
   - Kritisk for workflow organization
   - Reducerer manuel arbejde drastisk
   - Kan starte med simple pattern matching, upgrade til AI senere

### Phase 2: Productivity Features (Vigtigt) 🚀

3. **Auto-Suggest Replies** - Medium prioritet
   - Stort tidsbesparende potentiale
   - Kræver god template-system først

4. **Smart Templates** - Medium prioritet
   - Afhænger af Phase 1 (labels + summaries)
   - Kræver cross-system integration

### Phase 3: Advanced Features (Nice-to-have) ✨

5. **Email Bundling** - Lav prioritet
   - Nice-to-have, men ikke kritisk
   - Kan vente til Phase 1-2 er solidt

---

## Technical Requirements

### AI/ML Capabilities Nødvendige:

1. **Text Analysis**
   - Summarization (GPT-4o eller Gemini 2.5 Flash)
   - Intent Classification (er det lead, invoice, booking?)
   - Entity Extraction (customer name, service type, amount)

2. **Context Awareness**
   - Cross-system lookups (leads, invoices, calendar)
   - Historical patterns (hvad har vi sendt denne kunde før?)
   - Workflow state (er lead allerede konverteret?)

3. **Learning System**
   - Track label choices over tid
   - Improve suggestions baseret på bruger-feedback
   - Pattern recognition i email content

### Database Schema Additions:

```sql
-- Email AI Analysis Cache
CREATE TABLE email_ai_analysis (
  thread_id VARCHAR(255) PRIMARY KEY,
  summary TEXT,
  key_points JSON,
  suggested_labels JSON,
  confidence_score DECIMAL(3,2),
  analyzed_at TIMESTAMP,
  model_used VARCHAR(50)
);

-- Smart Templates
CREATE TABLE email_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  category VARCHAR(50),
  content TEXT,
  variables JSON,
  created_by INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Label Learning
CREATE TABLE label_patterns (
  id INT PRIMARY KEY AUTO_INCREMENT,
  label_name VARCHAR(100),
  pattern_keywords JSON,
  success_rate DECIMAL(3,2),
  usage_count INT,
  last_updated TIMESTAMP
);
```

---

## Success Metrics

### For hver feature, måle:

1. **Adoption Rate** - Hvor mange brugere bruger det?
2. **Time Saved** - Hvor meget tid spares per dag?
3. **Accuracy** - Hvor præcise er AI-forslagene?
4. **Workflow Impact** - Forbedrer det workflow'et?

### Minimum Viable Thresholds:

- **Summaries**: 80%+ accuracy, 30%+ time saved
- **Auto-Labeling**: 85%+ accuracy, 50%+ labels auto-applied
- **Reply Suggestions**: 60%+ usage rate, 40%+ time saved
- **Templates**: 70%+ usage rate, 20%+ time saved

---

## Design Principper til Implementering

### 1. **Non-Intrusive**

- AI features skal **hjælpe**, ikke forstyrre
- Vises kun når relevant
- Kan altid dismisses/ignoreres

### 2. **Transparent**

- Brugere skal forstå **hvad** AI gør og **hvorfor**
- Vis confidence scores
- Tillad manual override altid

### 3. **Progressive Enhancement**

- Start med simple rules-based logic
- Upgrade til AI gradvist
- Fallback til manual hvis AI fejler

### 4. **Context-Aware**

- Features skal forstå Tekup AI v2 workflow
- Integrer med leads, invoices, calendar
- Lær fra tidligere interaktioner

---

## Next Steps

1. **Start med AI Email Summaries** (Phase 1)
   - Simple implementation med GPT-4o
   - Cache results i database
   - Vis i inbox-listen

2. **Implement Smart Auto-Labeling** (Phase 1)
   - Start med pattern matching (keywords)
   - Upgrade til AI classification senere
   - Track accuracy og lær over tid

3. **Build Template System** (Phase 2 foundation)
   - Database schema
   - Template editor UI
   - Variable system

4. **Add Auto-Suggest Replies** (Phase 2)
   - Integrer med templates
   - AI completion
   - Context-aware suggestions

---

## Konklusion

Shortwave.ai's styrke er **workflow integration**, ikke bare AI features. Vi skal implementere features der:

- ✅ Forbedrer Tekup AI v2 workflow direkte
- ✅ Sætter tid fri for brugerne
- ✅ Er kontekstuelle og relevante
- ✅ Lærer og forbedrer sig over tid

**Ikke bare "AI for AI's skyld" - men AI der faktisk hjælper!**
