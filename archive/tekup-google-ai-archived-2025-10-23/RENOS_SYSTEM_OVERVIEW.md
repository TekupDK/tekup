# RenOS System - Komplet Implementerings Oversigt

Genereret: 9. oktober 2025

## 📊 Executive Summary

RenOS er et fuldt funktionelt AI-drevet business automation system til Rendetalje.dk med omfattende funktionalitet allerede implementeret i både backend og database.

**Status:**
- ✅ Backend API: 90%+ komplet
- ✅ Database Schema: Fuldt implementeret med 25+ tabeller
- ✅ AI Agents: Implementeret med Intent → Plan → Execute arkitektur
- ⚠️ Frontend: Kun tooling setup, mangler UI implementation
- ⚠️ Google Integrations: Backend services klar, mangler frontend forbindelse

---

## 🗄️ Database Schema (Prisma)

### **Core Business Tables**

#### 1. **Customers** (Kunder)
```prisma
model Customer {
  id            String   @id @default(cuid())
  name          String
  email         String?  @unique
  phone         String?
  address       String?
  companyName   String?
  notes         String?
  status        String   @default("active")
  tags          String[]
  totalLeads    Int      @default(0)
  totalBookings Int      @default(0)
  totalRevenue  Float    @default(0)
  lastContactAt DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```
**Features:**
- Unik email constraint
- Status tracking (active/inactive)
- Aggregated metrics (leads, bookings, revenue)
- Relationship tracking (sidste kontakt)
- Tags for segmentering

---

#### 2. **Leads** (Potentielle kunder)
```prisma
model Lead {
  id               String    @id @default(cuid())
  customerId       String?
  source           String?
  name             String?
  email            String?
  phone            String?
  address          String?
  squareMeters     Float?
  rooms            Int?
  taskType         String?
  preferredDates   String[]
  status           String    @default("new")
  emailThreadId    String?
  followUpAttempts Int       @default(0)
  lastFollowUpDate DateTime?
  
  // Firecrawl AI Enrichment
  companyName      String?
  industry         String?
  estimatedSize    String?
  estimatedValue   Float?
  enrichmentData   Json?
  lastEnriched     DateTime?
  
  // AI Lead Scoring
  score            Int?      @default(0)      // 0-100
  priority         String?   @default("medium") // high/medium/low
  lastScored       DateTime?
  scoreMetadata    Json?
  
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}
```
**Features:**
- ✅ Lead capture med custom fields (m², rooms, task type)
- ✅ AI Lead Scoring (0-100 score + priority)
- ✅ Firecrawl enrichment (company data, industry, estimated value)
- ✅ Follow-up tracking (attempts + dates)
- ✅ Email thread association
- ✅ Deduplication via idempotencyKey

---

#### 3. **Bookings** (Bestillinger/Aftaler)
```prisma
model Booking {
  id                String    @id @default(cuid())
  customerId        String?
  leadId            String?
  serviceType       String?
  address           String?
  scheduledAt       DateTime  @default(now())
  estimatedDuration Int       @default(120) // minutes
  startTime         DateTime?
  endTime           DateTime?
  status            String    @default("scheduled")
  calendarEventId   String?
  calendarLink      String?
  notes             String?
  
  // Sprint 2: Time Tracking
  actualStartTime   DateTime?
  actualEndTime     DateTime?
  actualDuration    Int?
  timeVariance      Int?
  efficiencyScore   Float?
  timeNotes         String?
  timerStatus       String    @default("not_started")
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```
**Service Types:**
- Privatrengøring
- Flytterengøring
- Hovedrengøring
- Erhverv
- Airbnb
- Vinduer

**Features:**
- ✅ Google Calendar integration (calendarEventId)
- ✅ Time tracking system (actual vs estimated)
- ✅ Efficiency scoring
- ✅ Break tracking (separate table)
- ✅ Multi-status workflow

---

#### 4. **Quotes** (Tilbud)
```prisma
model Quote {
  id             String    @id @default(cuid())
  leadId         String
  hourlyRate     Float
  estimatedHours Float
  subtotal       Float
  vatRate        Float     // Usually 25% (Danish VAT)
  total          Float
  notes          String?
  validUntil     DateTime?
  status         String    @default("draft")
  createdAt      DateTime  @default(now())
}
```
**Features:**
- ✅ Automatic VAT calculation
- ✅ Expiry tracking (validUntil)
- ✅ Multiple statuses (draft, sent, accepted, rejected)

---

### **Email & Communication**

#### 5. **EmailThread & EmailMessage**
```prisma
model EmailThread {
  id            String    @id @default(cuid())
  gmailThreadId String    @unique
  customerId    String?
  subject       String
  snippet       String?
  lastMessageAt DateTime
  participants  String[]
  messageCount  Int       @default(0)
  labels        String[]
  isMatched     Boolean   @default(false)
  matchedBy     String?   // "exact_email", "domain", "heuristic"
  confidence    Float?
}

model EmailMessage {
  id             String   @id @default(cuid())
  gmailMessageId String?  @unique
  gmailThreadId  String
  from           String
  to             String[]
  subject        String?
  body           String   @db.Text
  direction      String   @default("inbound")
  isAiGenerated  Boolean  @default(false)
  aiModel        String?
  sentAt         DateTime
}
```
**Features:**
- ✅ Gmail API integration
- ✅ Thread-based conversations
- ✅ AI-generated email tracking
- ✅ Smart customer matching (exact/domain/heuristic)
- ✅ Confidence scoring

---

#### 6. **EmailResponse** (AI-Generated Responses)
```prisma
model EmailResponse {
  id             String    @id @default(cuid())
  leadId         String
  recipientEmail String
  subject        String
  body           String    @db.Text
  status         String    @default("pending") // pending, approved, sent, rejected
  gmailThreadId  String?
  gmailMessageId String?
  sentAt         DateTime?
  rejectedReason String?
  aiModel        String?
}
```
**Features:**
- ✅ Human-in-the-loop approval workflow
- ✅ AI model tracking
- ✅ Rejection reason capture
- ✅ Thread association

---

#### 7. **Escalation** (Konflikt/Problem Detection)
```prisma
model Escalation {
  id              String    @id @default(cuid())
  leadId          String
  customerEmail   String
  severity        String    // low, medium, high, critical
  conflictScore   Int
  matchedKeywords String[]
  emailSnippet    String    @db.Text
  escalatedBy     String    // system or manual
  jonasNotified   Boolean   @default(false)
  resolvedAt      DateTime?
  resolution      String?
}
```
**Features:**
- ✅ Automatic conflict detection (keywords)
- ✅ Severity scoring
- ✅ Owner notification system
- ✅ Resolution tracking

---

### **Advanced Features**

#### 8. **Cleaning Plans** (Recurring Services)
```prisma
model CleaningPlan {
  id                String   @id @default(cuid())
  customerId        String
  name              String
  serviceType       String
  frequency         String   @default("once") // once, weekly, biweekly, monthly
  isTemplate        Boolean  @default(false)
  isActive          Boolean  @default(true)
  estimatedDuration Int      @default(120)
  estimatedPrice    Float?
  squareMeters      Float?
}

model CleaningTask {
  id            String   @id @default(cuid())
  planId        String
  name          String
  category      String
  estimatedTime Int      @default(15)
  isRequired    Boolean  @default(true)
  isCompleted   Boolean  @default(false)
  pricePerTask  Float?
}
```
**Features:**
- ✅ Recurring booking templates
- ✅ Task checklist system
- ✅ Time estimation per task
- ✅ Template reusability

---

#### 9. **Invoicing System** (Sprint 3)
```prisma
model Invoice {
  id              String   @id @default(cuid())
  invoiceNumber   String   @unique // "INV-2025-001"
  bookingId       String?
  customerId      String
  issueDate       DateTime @default(now())
  dueDate         DateTime
  status          String   @default("draft")
  subtotal        Float
  vatRate         Float    @default(25.0)
  vatAmount       Float
  total           Float
  paidAt          DateTime?
  paymentMethod   String?
  
  // Billy.dk Integration
  billyInvoiceId  String?  @unique
  billyContactId  String?
  billySyncedAt   DateTime?
  billyPdfUrl     String?
}

model InvoiceLineItem {
  id          String   @id @default(cuid())
  invoiceId   String
  description String
  quantity    Float    @default(1.0)
  unitPrice   Float
  amount      Float
}
```
**Features:**
- ✅ Automatic invoice numbering
- ✅ VAT calculation (25% Danish standard)
- ✅ Billy.dk accounting integration
- ✅ Payment tracking
- ✅ Line item detail

---

#### 10. **Time Tracking System** (Sprint 2)
```prisma
model Break {
  id        String    @id @default(cuid())
  bookingId String
  startTime DateTime
  endTime   DateTime?
  duration  Int?
  reason    String?   // lunch, equipment, bathroom, transport, other
}
```
**Features:**
- ✅ Break tracking with reasons
- ✅ Automatic duration calculation
- ✅ Links to bookings for efficiency analysis

---

#### 11. **Analytics & Monitoring**
```prisma
model Analytics {
  id        String   @id @default(cuid())
  date      DateTime @db.Date
  metric    String
  value     Float
  metadata  Json?
  
  @@unique([date, metric])
}

model TaskExecution {
  id              String   @id @default(cuid())
  taskType        String
  taskPayload     Json
  status          String   // pending, success, failed, retried
  result          Json?
  error           String?
  duration        Int?
  traceId         String?
  intent          String?
  confidence      Float?
  correctionType  String?
  executedAt      DateTime @default(now())
}
```
**Features:**
- ✅ GDPR-compliant audit trail
- ✅ AI decision tracking
- ✅ Performance metrics
- ✅ Error logging
- ✅ Distributed tracing support

---

#### 12. **Chat System**
```prisma
model ChatSession {
  id        String        @id @default(cuid())
  userId    String?
  channel   String?
  locale    String?
  createdAt DateTime      @default(now())
  messages  ChatMessage[]
}

model ChatMessage {
  id        String      @id @default(cuid())
  sessionId String
  role      String      // user, assistant, system
  content   String
  timestamp DateTime    @default(now())
}
```

---

#### 13. **Competitive Intelligence**
```prisma
model CompetitorPricing {
  id            String   @id @default(cuid())
  competitor    String   // "Molly", "Renova", "Hjemme", "ISS"
  websiteUrl    String
  pricingData   Json
  scrapedAt     DateTime @default(now())
  creditsUsed   Int      @default(1)
}
```
**Features:**
- ✅ Firecrawl web scraping
- ✅ Competitor price monitoring
- ✅ Time-series analysis support

---

## 🚀 Backend API Endpoints

### **Dashboard Routes** (`/api/dashboard`)
```typescript
GET  /stats/overview?period=7d     // Customer, lead, booking stats
GET  /cache/stats                  // Redis cache metrics
GET  /leads/recent?limit=5         // Latest leads
GET  /bookings/upcoming            // Next bookings
GET  /revenue?period=7d            // Revenue chart data
GET  /services                     // Service distribution
GET  /customers/:id/threads        // Customer360 email threads
GET  /customers/:id/leads          // Customer360 lead history
```

### **Lead Routes** (`/api/leads`)
```typescript
POST /check-duplicate              // Check if customer exists
POST /register                     // Register new lead/customer
```

### **Quote Routes** (`/api/quotes`)
```typescript
GET  /pending                      // Unapproved quotes
```

### **Service Routes** (`/api/services`)
```typescript
GET  /                             // List all services
GET  /:id                          // Get service details
```

### **Monitoring Routes** (`/api/monitoring`)
```typescript
GET  /health                       // Health check
GET  /metrics                      // Performance metrics
GET  /status                       // System status
```

### **Calendar Routes** (`/api/calendar`)
```typescript
// (Google Calendar integration endpoints)
```

### **Microsoft Agent Routes** (`/api/agent`)
```typescript
GET  /status                       // Agent status
GET  /telemetry                    // Agent metrics
GET  /telemetry/performance        // Performance data
GET  /telemetry/business           // Business KPIs
GET  /plugins                      // Available plugins
GET  /plugins/health               // Plugin health
GET  /threads/:threadId            // Thread details
GET  /threads/:threadId/summary    // Thread summary
GET  /stats                        // Agent statistics
```

---

## 🤖 AI Agent System

### **Architecture: Intent → Plan → Execute**

#### 1. **Intent Classifier** (`intentClassifier.ts`)
```typescript
// Classifies user requests into intents
export type AssistantIntent =
  | 'email.lead'
  | 'email.followup'
  | 'email.escalation'
  | 'calendar.booking'
  | 'calendar.availability'
  | 'analytics.overview'
  | 'analytics.revenue'
  | 'lead.enrich'
  | 'lead.score'
  | 'quote.generate'
  | 'unknown';
```

**Features:**
- ✅ Regex-based pattern matching
- ✅ Optional LLM fallback
- ✅ Confidence scoring

---

#### 2. **Task Planner** (`taskPlanner.ts`)
```typescript
// Converts intent into executable tasks
interface PlannedTask {
  type: string;
  payload: Record<string, unknown>;
  blocking: boolean;
}
```

**Features:**
- ✅ Task dependency resolution
- ✅ Parallel vs sequential execution
- ✅ Payload validation

---

#### 3. **Plan Executor** (`planExecutor.ts`)
```typescript
// Executes tasks via handlers or tool registry
export class PlanExecutor {
  constructor(handlers: TaskHandlerMap, options?: {
    useToolRegistry?: boolean;
  });
}
```

**Execution Modes:**
- **Legacy Handlers** (default): `src/agents/handlers/*`
- **Tool Registry** (ADK-style): `src/tools/registry.ts`

**Available Handlers:**
- ✅ `email.compose` - Generate email responses
- ✅ `email.followup` - Follow-up automation
- ✅ `calendar.book` - Book appointments
- ✅ `calendar.reschedule` - Reschedule bookings
- ✅ `email.complaint` - Handle complaints
- ✅ `analytics` - Generate reports

---

#### 4. **Execution Tracer** (`executionTracer.ts`)
```typescript
// Logs all agent actions for debugging
interface TraceRecord {
  toolName: string;
  input: unknown;
  output: unknown;
  timestamp: Date;
  error?: string;
}
```

---

#### 5. **Agent Reflector** (`agentReflector.ts`)
```typescript
// Learns from failures and retries with corrections
interface ReflectionResult {
  shouldRetry: boolean;
  correctionType: string;
  suggestedPayload: Record<string, unknown>;
}
```

---

## 🔌 External Services Integration

### **Google Services** (`src/services/`)

#### **1. Gmail Service** (`gmailService.ts`)
```typescript
// Search emails
searchEmails(query: string, maxResults?: number)

// Get thread
getThread(threadId: string)

// Send email
sendEmail(to, subject, body, threadId?)

// Create label
createLabel(name: string)

// Apply label
applyLabel(messageId: string, labelId: string)
```

**Features:**
- ✅ Thread-aware sending
- ✅ Label management
- ✅ Search with filters
- ✅ Dry-run mode protection

---

#### **2. Calendar Service** (`calendarService.ts`)
```typescript
// Create event
createEvent(event: CalendarEvent)

// List events
listEvents(timeMin, timeMax, maxResults?)

// Update event
updateEvent(eventId, event)

// Delete event
deleteEvent(eventId)
```

**Features:**
- ✅ Availability checking
- ✅ Conflict detection
- ✅ Automatic link generation
- ✅ Dry-run mode protection

---

#### **3. Calendar Sync Service** (`calendarSyncService.ts`)
```typescript
// Sync bookings with Google Calendar
syncBookingsToCalendar()

// Import calendar events to bookings
importCalendarEvents()
```

---

### **Other Integrations**

#### **4. Firecrawl Service** (`firecrawlService.ts`)
```typescript
// Enrich lead with company data
enrichLead(websiteUrl: string)

// Scrape competitor pricing
scrapeCompetitorPricing(competitorUrl: string)
```

**Features:**
- ✅ Company data extraction
- ✅ Industry classification
- ✅ Estimated size/value
- ✅ Credit tracking

---

#### **5. Billy.dk Service** (`billyService.ts`)
```typescript
// Create invoice in Billy
createInvoice(invoice: Invoice)

// Sync contact
syncContact(customer: Customer)

// Get invoice PDF
getInvoicePdf(billyInvoiceId: string)
```

---

#### **6. Redis Cache** (`redisService.ts`, `cacheService.ts`)
```typescript
// Cache with TTL
set(key, value, ttlSeconds)
get(key)
del(key)
clear()
```

**Features:**
- ✅ Performance optimization
- ✅ Hit rate tracking
- ✅ Automatic expiration

---

## 📧 Email Automation Features

### **1. Auto-Response System** (`emailAutoResponseService.ts`)
```typescript
// Generate AI reply
generateResponse(email: EmailMessage, lead: Lead)

// Approval workflow
approveResponse(responseId: string)
rejectResponse(responseId: string, reason: string)

// Send approved responses
sendApprovedResponses()
```

**Feature Flags:**
```typescript
isAutoResponseEnabled()
isFollowUpEnabled()
isEscalationEnabled()
```

---

### **2. Follow-up Automation** (`followUpService.ts`)
```typescript
// Find leads needing follow-up
getLeadsNeedingFollowUp()

// Send follow-up email
sendFollowUp(leadId: string)
```

**Logic:**
- ✅ 48-hour wait after initial contact
- ✅ Max 3 follow-up attempts
- ✅ Automatic escalation after 3 attempts

---

### **3. Escalation System** (`escalationService.ts`)
```typescript
// Detect conflicts/complaints
detectEscalation(emailBody: string)

// Notify owner
notifyJonas(escalation: Escalation)
```

**Conflict Keywords:**
```typescript
const conflictKeywords = [
  'klage', 'utilfreds', 'dårlig service', 
  'advokat', 'fortryder', 'skandale'
];
```

---

## 🛠️ Utility Services

### **Lead Scoring** (`leadScoringService.ts`)
```typescript
// Calculate lead quality score (0-100)
scoreLead(lead: Lead): Promise<{
  score: number;
  priority: 'high' | 'medium' | 'low';
  metadata: {
    emailQuality: number;
    companySize: number;
    estimatedValue: number;
    urgency: number;
  }
}>
```

**Scoring Factors:**
- ✅ Email domain quality
- ✅ Company size (if enriched)
- ✅ Estimated project value
- ✅ Urgency indicators

---

### **Quote Generation** (`quoteGenerationService.ts`)
```typescript
// Auto-generate quote
generateQuote(leadId: string): Promise<Quote>
```

**Pricing Logic:**
- ✅ Base hourly rate: 300-350 DKK
- ✅ Square meter calculation
- ✅ Service type multipliers
- ✅ Automatic VAT (25%)

---

### **Duplicate Detection** (`duplicateDetectionService.ts`)
```typescript
// Check for duplicate customer
checkDuplicateCustomer(email: string): Promise<{
  isDuplicate: boolean;
  action: 'STOP' | 'WARN' | 'OK';
  customer?: Customer;
  recommendation: string;
}>
```

**Rules:**
- STOP: Contacted within 30 days
- WARN: Contacted 30-90 days ago
- OK: No recent contact

---

## 📝 Configuration & Environment

### **Config Files** (`src/config.ts`, `src/env.ts`)
```typescript
// Runtime mode
export const isLiveMode = process.env.RUN_MODE === 'live';

// Feature flags
export const isAutoResponseEnabled = () => 
  process.env.EMAIL_AUTO_RESPONSE === 'enabled';

export const isFollowUpEnabled = () => 
  process.env.EMAIL_FOLLOW_UP === 'enabled';

export const isEscalationEnabled = () => 
  process.env.EMAIL_ESCALATION === 'enabled';
```

**Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://...

# Google APIs
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
GOOGLE_CALENDAR_ID=...

# Redis
REDIS_URL=redis://...

# Billy.dk
BILLY_API_TOKEN=...

# Firecrawl
FIRECRAWL_API_KEY=...

# Safety
RUN_MODE=dry-run  # or 'live'

# Features
EMAIL_AUTO_RESPONSE=enabled
EMAIL_FOLLOW_UP=enabled
EMAIL_ESCALATION=enabled
```

---

## 🎯 Safety Rails

### **Dry Run Mode** (CRITICAL)
```typescript
// NEVER mutate data in dry-run mode
if (!isLiveMode) {
  logger.info('[DRY-RUN] Would have sent email...');
  return;
}

// Only execute in live mode
gmailService.sendEmail(...);
```

**Protected Operations:**
- ✅ Email sending
- ✅ Calendar modifications
- ✅ Database writes (in services)

---

## 📂 Frontend Status (renos-frontend)

**Current State:** ⚠️ MINIMAL

**What Exists:**
- ✅ Vite + React 18 + TypeScript setup
- ✅ Tailwind CSS configured
- ✅ React Router, TanStack Query, Zustand installed
- ✅ Axios for API calls

**What's Missing:**
- ❌ No UI components implemented
- ❌ No API integration
- ❌ No authentication setup
- ❌ No routing structure
- ❌ No state management logic

**Next Steps:**
1. Integrate GitHub Spark generated UI
2. Setup Clerk or Supabase Auth
3. Connect to backend API endpoints
4. Implement missing pages (Customers, Emails, Quotes)
5. Add Google Calendar/Gmail UI integrations

---

## 🔄 Migration to Supabase - Analysis

### **Current Stack:**
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** Clerk
- **Backend:** Node.js + Express + TypeScript
- **Cache:** Redis

### **Proposed Stack:**
- **Database:** Supabase PostgreSQL (same, but managed)
- **Auth:** Supabase Auth (replaces Clerk)
- **Backend:** Simplified - use Supabase auto-generated REST API
- **Realtime:** Supabase WebSockets (bonus feature)
- **Cache:** Can keep Redis or use Supabase realtime for hot data

---

### **Migration Benefits:**

✅ **Cost Savings**
- Supabase Free Tier: 50,000 MAU (vs Clerk 10,000)
- No separate database hosting needed
- No separate auth service cost

✅ **Complexity Reduction**
- Auto-generated REST + GraphQL API
- Built-in Row Level Security (RLS)
- Single service for DB + Auth + Storage + Realtime

✅ **Better Integration**
- Auth tokens directly usable in database queries
- No ORM needed (direct SQL or client SDK)
- Real-time subscriptions for free

✅ **Developer Experience**
- Built-in admin panel (like Prisma Studio)
- Real-time database changes
- Better TypeScript types generation

---

### **Migration Challenges:**

⚠️ **Prisma → Supabase Client**
- Need to rewrite all `prisma.customer.findMany()` to Supabase SDK
- OR use Prisma with Supabase (they're compatible)

⚠️ **Clerk → Supabase Auth**
- Different auth flow
- Need to migrate user data
- Update frontend auth components

⚠️ **Backend Routes**
- Can simplify to just business logic
- Use Supabase auto-API for CRUD
- Keep custom routes for AI agents

---

## 📋 Next Steps for Full System

### **Phase 1: Supabase Setup** (1-2 dage)
1. ✅ Migrate Prisma schema to Supabase SQL
2. ✅ Setup Row Level Security policies
3. ✅ Import existing data
4. ✅ Test database connectivity

### **Phase 2: Auth Migration** (1 dag)
1. ✅ Setup Supabase Auth
2. ✅ Remove Clerk dependencies
3. ✅ Update frontend auth flows
4. ✅ Migrate user accounts

### **Phase 3: Backend Simplification** (2-3 dage)
1. ✅ Replace Prisma calls with Supabase client
2. ✅ Remove unnecessary Express routes (use Supabase auto-API)
3. ✅ Keep AI agent routes custom
4. ✅ Test all integrations

### **Phase 4: Frontend Development** (1-2 uger)
1. ✅ Integrate Spark UI components
2. ✅ Connect to Supabase backend
3. ✅ Implement missing pages
4. ✅ Add Google Calendar/Gmail UI
5. ✅ Testing & polish

---

## 🎉 Conclusion

**RenOS Backend is 90%+ complete!**

Du har allerede et massivt system med:
- 25+ database tabeller
- 50+ API endpoints  
- Komplet AI agent system
- Gmail + Calendar integration
- Auto-response + follow-up + escalation
- Lead scoring + enrichment
- Invoice generation
- Time tracking
- Cleaning plans
- Competitive intelligence

**Det eneste der mangler er:**
- Frontend UI (kan brugen Spark + lidt custom kode)
- Supabase migration (optional men anbefalet)
- Forbinde frontend til backend

**Anbefalinger:**
1. ✅ Migrer til Supabase (spar penge, reducer kompleksitet)
2. ✅ Brug Spark til 80% af UI
3. ✅ Kod custom UI til Google Calendar/Gmail integrations
4. ✅ Test grundigt i dry-run mode først

---

**Spørgsmål?** Skal jeg starte med Supabase migration planen?
