# 🎯 RenOS - Komplet Kategoriseret Oversigt Over Mangler

**Dato:** 6. Oktober 2025  
**Status efter Deployment Fix:** ✅ Frontend bygger nu korrekt  
**Samlet Færdiggørelse:** 73%

---

## 📊 OVERSIGT - VÆLG DIN KATEGORI

```
🚨 KRITISKE BLOKKERE (3)        - Skal fixes NU
🔴 P0 - MUST HAVE (7)           - CleanManager parity features  
🟡 P1 - SHOULD HAVE (8)         - Kvalitetsforbedringer
🟢 P2 - NICE TO HAVE (12)       - Future enhancements
🔵 P3 - LONG TERM (6)           - Fase 3+ features
```

---

## 🚨 KATEGORI A: KRITISKE BLOKKERE (Gør det NU!)

**Estimeret tid:** 3-6 timer  
**Impact:** System kan ikke køre i produktion uden disse

### A1. Google Auth Verification ⏳
**Status:** IN PROGRESS (venter på propagering)  
**Tid:** 15 minutter test efter propagering  
**Hvorfor:** Gmail/Calendar API virker ikke uden dette

**Action items:**
- [ ] Vent 10 minutter på Google propagering
- [ ] Test: `npm run leads:check` (skal ikke give unauthorized_client error)
- [ ] Test: `npm run booking:availability 2025-10-15`
- [ ] Verificer Render logs viser succesfuld connection

**Dokumentation:** GOOGLE_AUTH_SETUP.md

---

### A2. End-to-End Testing 🧪
**Status:** NOT STARTED  
**Tid:** 2-4 timer  
**Hvorfor:** Vi ved ikke om systemet virker i produktion endnu

**5 kritiske test-scenarioer:**

#### Test 1: Lead Monitoring
```powershell
# Send test email til leadmail@rendetalje.dk
# Verificer lead dukker op i dashboard
npm run leads:check
```

#### Test 2: Email Auto-Response
```powershell
# Generate auto-response til test lead
npm run email:pending
# Check quality (ingen placeholders, korrekt tid)
# Test dry-run først, så live mode
npm run email:approve <id>
```

#### Test 3: Calendar Booking
```powershell
# Test availability checker
npm run booking:availability 2025-10-15

# Test next slot finder
npm run booking:next-slot 120

# Book test appointment og check Google Calendar
```

#### Test 4: Follow-Up System
```powershell
# Create old lead (7+ dage gammel)
# Trigger follow-up
# Verificer email generated
```

#### Test 5: Dashboard Health
```powershell
# Check alle 5 widgets loader
# System Status widget OK
# Email Quality Monitor OK
# Follow-Up Tracker OK
# Rate Limit Monitor OK
# Conflict Monitor OK
```

**Dokumentation:** END_TO_END_TESTING_GUIDE.md

---

### A3. Error Monitoring Setup 📊
**Status:** NOT CONFIGURED  
**Tid:** 30 minutter  
**Hvorfor:** Vi kan ikke debugge produktion errors uden dette

**Setup checklist:**

#### Sentry (Error Tracking)
- [ ] Create Sentry account (gratis tier)
- [ ] Get DSN key
- [ ] Add til Render: `SENTRY_DSN=https://...`
- [ ] Test error capture virker
- [ ] Configure alerts (email på P0 errors)

#### UptimeRobot (Uptime Monitoring)
- [ ] Create UptimeRobot account (gratis: 50 monitors)
- [ ] Monitor: `https://tekup-renos.onrender.com/health`
- [ ] Alert via email/SMS ved downtime
- [ ] 5-minute check interval

**Tid:** 30 minutter total

---

## 🔴 KATEGORI B: P0 - MUST HAVE (CleanManager Erstatning)

**Estimeret tid:** 18 arbejdsdage (3-4 uger)  
**Impact:** 100% CleanManager parity

### B1. Rengøringsplaner / Job Templates 📋
**Tid:** 5 dage  
**Værdi:** Genbrugelige planer → spar 30 min per booking

**Hvad skal bygges:**

#### Database Models
```typescript
model CleaningPlan {
  id              String   @id @default(uuid())
  name            String   // "Standard boligrengøring 80m²"
  description     String?
  estimatedHours  Float    // 3.5 timer
  pricePerHour    Float    // 349 kr/t
  totalPrice      Float    // 1221 kr
  tasks           Task[]
  bookings        Booking[]
  customerId      String?
  customer        Customer?
  createdAt       DateTime @default(now())
}

model Task {
  id          String  @id @default(uuid())
  planId      String
  plan        CleaningPlan @relation(fields: [planId])
  title       String  // "Støvsug alle rum"
  description String?
  order       Int
  completed   Boolean @default(false)
}
```

#### API Endpoints
```
POST   /api/plans              - Create plan
GET    /api/plans              - List all
GET    /api/plans/:id          - Get details
PUT    /api/plans/:id          - Update
DELETE /api/plans/:id          - Delete
POST   /api/plans/:id/duplicate - Clone
POST   /api/bookings/:id/apply-plan - Apply til booking
```

#### UI Components
- `CleaningPlans.tsx` - List/create/edit plans
- `PlanBuilder.tsx` - Drag-drop task builder
- `PlanSelector.tsx` - Vælg plan ved booking

**Filer at oprette:**
```
client/src/pages/CleaningPlans/
├── CleaningPlans.tsx
├── PlanBuilder.tsx
└── PlanSelector.tsx

src/api/planRoutes.ts
src/services/planService.ts
prisma/migrations/XXX_add_cleaning_plans.sql
```

**Dokumentation:** DEVELOPMENT_ROADMAP.md (Sprint 1)

---

### B2. Time Tracking / Tidsregistrering ⏱️
**Tid:** 4 dage  
**Værdi:** Faktisk vs estimeret tid → bedre pricing

**Hvad skal bygges:**

#### Database Changes
```typescript
model Booking {
  // ... existing
  estimatedHours    Float?
  actualStartTime   DateTime?
  actualEndTime     DateTime?
  actualHours       Float?
  breaks            Break[]
  totalBreakMinutes Int @default(0)
  overtimeMinutes   Int @default(0)
  timeEntries       TimeEntry[]
}

model TimeEntry {
  id          String   @id @default(uuid())
  bookingId   String
  booking     Booking  @relation(fields: [bookingId])
  startTime   DateTime
  endTime     DateTime?
  duration    Int?     // minutes
  type        String   // "work", "break", "travel"
  notes       String?
  createdAt   DateTime @default(now())
}

model Break {
  id          String   @id @default(uuid())
  bookingId   String
  booking     Booking  @relation(fields: [bookingId])
  startTime   DateTime
  endTime     DateTime?
  duration    Int?     // minutes
  reason      String?
}
```

#### API Endpoints
```
POST   /api/bookings/:id/time/start    - Start timer
POST   /api/bookings/:id/time/stop     - Stop timer
POST   /api/bookings/:id/time/pause    - Start break
POST   /api/bookings/:id/time/resume   - End break
GET    /api/bookings/:id/time          - Get time entries
GET    /api/analytics/time-variance    - Estimat vs faktisk
```

#### UI Components
- `TimeTracker.tsx` - Start/stop timer
- `TimeHistory.tsx` - Historik over tid
- `TimeAnalytics.tsx` - Variance analytics

**Mobile considerations:**
- Responsive design (fungerer på mobil)
- GPS check-in (Fase 2)
- Push notifications (Fase 2)

---

### B3. Fakturering / Invoicing 💰
**Tid:** 5 dage  
**Værdi:** Send fakturaer → få betalt

**Hvad skal bygges:**

#### Database Models
```typescript
model Invoice {
  id              String   @id @default(uuid())
  invoiceNumber   String   @unique
  customerId      String
  customer        Customer @relation(fields: [customerId])
  bookingId       String?
  booking         Booking? @relation(fields: [bookingId])
  
  // Invoice details
  issueDate       DateTime @default(now())
  dueDate         DateTime
  status          String   // "draft", "sent", "paid", "overdue"
  
  // Line items
  items           InvoiceItem[]
  subtotal        Float
  vatAmount       Float
  vatPercent      Float    @default(25)
  total           Float
  
  // Payment
  paidAt          DateTime?
  paymentMethod   String?  // "bank", "mobilepay", "kontant"
  
  // Files
  pdfUrl          String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model InvoiceItem {
  id          String  @id @default(uuid())
  invoiceId   String
  invoice     Invoice @relation(fields: [invoiceId])
  description String
  quantity    Float
  unitPrice   Float
  total       Float
  order       Int
}
```

#### Integration Options
**Option 1: Billy.dk API** (Anbefalet)
- ✅ Dansk system, kender regler
- ✅ Automatisk bogføring
- ✅ e-Boks integration
- ❌ Koster 149 kr/måned
- **Dokumentation:** <https://www.billy.dk/api>

**Option 2: Economic (Visma)**
- ✅ Professionelt, mange features
- ❌ Dyrere (499 kr/måned+)
- ❌ Overkill for små firmaer

**Option 3: Custom PDF Generation**
- ✅ Gratis
- ✅ Fuld kontrol
- ❌ Skal selv håndtere nummerering
- ❌ Ingen automatisk bogføring
- ❌ Skal manuelt uploade til e-Boks

**Anbefaling:** Start med Billy.dk API

#### API Endpoints
```
POST   /api/invoices                    - Create invoice
GET    /api/invoices                    - List invoices
GET    /api/invoices/:id                - Get invoice
PUT    /api/invoices/:id                - Update invoice
POST   /api/invoices/:id/send           - Send via email
POST   /api/invoices/:id/mark-paid      - Mark som betalt
GET    /api/invoices/:id/pdf            - Download PDF
GET    /api/invoices/overdue            - List overdue
POST   /api/invoices/reminder/:id       - Send reminder
```

#### UI Components
- `Invoices.tsx` - Invoice list
- `InvoiceBuilder.tsx` - Create/edit invoice
- `InvoicePreview.tsx` - Preview før sending
- `InvoiceStatus.tsx` - Status tracking

---

### B4. Quality Reports / Kvalitetskontrol 📊
**Tid:** 3 dage  
**Værdi:** Customer feedback → forbedre service

**Hvad skal bygges:**

#### Database Models
```typescript
model QualityReport {
  id          String   @id @default(uuid())
  bookingId   String   @unique
  booking     Booking  @relation(fields: [bookingId])
  customerId  String
  customer    Customer @relation(fields: [customerId])
  
  // Ratings (1-5 stars)
  overallRating       Int
  cleanlinessRating   Int?
  punctualityRating   Int?
  professionalismRating Int?
  
  // Feedback
  comments            String?
  issues              QualityIssue[]
  
  // Photos
  photos              QualityPhoto[]
  
  // Status
  status              String   // "pending", "submitted", "reviewed"
  submittedAt         DateTime?
  reviewedAt          DateTime?
  reviewedBy          String?
  
  createdAt           DateTime @default(now())
}

model QualityIssue {
  id          String  @id @default(uuid())
  reportId    String
  report      QualityReport @relation(fields: [reportId])
  category    String  // "missed_spot", "damage", "complaint"
  description String
  severity    String  // "low", "medium", "high"
  resolved    Boolean @default(false)
  resolution  String?
  resolvedAt  DateTime?
}

model QualityPhoto {
  id          String  @id @default(uuid())
  reportId    String
  report      QualityReport @relation(fields: [reportId])
  url         String
  caption     String?
  uploadedAt  DateTime @default(now())
}
```

#### Customer Survey Flow
```
1. Job completed → Send email med survey link
2. Customer clicks link → Rating form
3. Customer submits → Save til database
4. If rating < 3 stars → Alert Jonas
5. Jonas reviews → Mark as reviewed
```

#### API Endpoints
```
POST   /api/quality-reports                 - Create report
GET    /api/quality-reports                 - List reports
GET    /api/quality-reports/:id             - Get report
PUT    /api/quality-reports/:id/review      - Mark reviewed
GET    /api/quality-reports/low-rated       - Get low ratings
POST   /api/quality-reports/:id/photos      - Upload photo
GET    /api/analytics/quality-trends        - Quality over time
```

#### UI Components
- `QualityReports.tsx` - Report list
- `QualityForm.tsx` - Customer survey form
- `QualityDashboard.tsx` - Analytics dashboard
- `QualityAlerts.tsx` - Low rating alerts

---

### B5. Customer Portal 👤
**Tid:** 3 dage  
**Værdi:** Customers kan self-service

**Hvad skal bygges:**

#### Features
```
✅ View upcoming bookings
✅ View past bookings
✅ View invoices (download PDF)
✅ Update contact info
✅ Request rebooking
✅ Submit quality report
✅ View cleaning plan
✅ Chat med support
```

#### Authentication
**Option 1: Magic Link (Anbefalet for v1)**
```
1. Customer enters email
2. System sends magic link
3. Customer clicks → logged in (1 hour session)
```

**Option 2: Password Login (Fase 2)**
```
1. Customer creates account
2. Email/password login
3. Remember me feature
```

#### Routes
```
/portal/login              - Magic link login
/portal/dashboard          - Overview
/portal/bookings           - Booking list
/portal/bookings/:id       - Booking details
/portal/invoices           - Invoice list
/portal/invoices/:id       - Invoice details
/portal/profile            - Edit profile
/portal/quality/:bookingId - Submit quality report
```

#### API Endpoints
```
POST   /api/portal/login              - Send magic link
GET    /api/portal/verify/:token      - Verify magic link
GET    /api/portal/bookings           - Get customer bookings
GET    /api/portal/invoices           - Get customer invoices
PUT    /api/portal/profile            - Update profile
POST   /api/portal/rebook/:bookingId  - Request rebooking
```

---

### B6. Payment Integration 💳
**Tid:** 2 dage  
**Værdi:** Online payment → hurtigere betaling

**Integration Options:**

#### Option 1: MobilePay (Anbefalet)
- ✅ Meget brugt i DK
- ✅ Nemt for customers
- ✅ 1% transaction fee
- **Setup:** <https://www.mobilepay.dk/erhverv>

#### Option 2: Stripe
- ✅ International
- ✅ Mange payment metoder
- ❌ 1.4% + 1.80 kr per transaction
- ❌ Mindre kendt i DK

#### Option 3: Bank Transfer (Manual)
- ✅ Gratis
- ❌ Langsomt
- ❌ Kræver manuel tracking

**Anbefaling:** MobilePay for danske customers

#### Implementation
```typescript
model Payment {
  id              String   @id @default(uuid())
  invoiceId       String
  invoice         Invoice  @relation(fields: [invoiceId])
  
  amount          Float
  method          String   // "mobilepay", "bank", "cash"
  status          String   // "pending", "completed", "failed"
  
  // MobilePay
  mobilePayId     String?
  mobilePayUrl    String?
  
  // Metadata
  paidAt          DateTime?
  createdAt       DateTime @default(now())
}
```

#### API Endpoints
```
POST   /api/payments/mobilepay/:invoiceId - Create MobilePay payment
GET    /api/payments/:id/status            - Check payment status
POST   /api/payments/:id/webhook           - MobilePay webhook
```

---

### B7. SMS Notifications 📱
**Tid:** 1 dag  
**Værdi:** Bedre customer communication

**Use cases:**
```
✅ Booking confirmation
✅ Påmindelse (24h før)
✅ "Vi er på vej" (30 min før)
✅ "Job completed" → send survey link
✅ Payment reminder
```

**Integration Options:**

#### Option 1: SMS1919 (Dansk)
- ✅ Dansk udbyder
- ✅ 0.29 kr per SMS
- ✅ Nem API
- **Dokumentation:** <https://www.sms1919.dk/api>

#### Option 2: Twilio (International)
- ✅ Meget pålidelig
- ❌ Dyrere (0.60 kr per SMS)
- ✅ Mange features (voice, video, etc.)

**Anbefaling:** SMS1919 (billigere for danske numre)

#### Implementation
```typescript
model SMSLog {
  id          String   @id @default(uuid())
  customerId  String
  customer    Customer @relation(fields: [customerId])
  bookingId   String?
  booking     Booking? @relation(fields: [bookingId])
  
  phoneNumber String
  message     String
  type        String   // "booking_confirmed", "reminder", "on_way", etc.
  status      String   // "sent", "delivered", "failed"
  
  sentAt      DateTime @default(now())
  deliveredAt DateTime?
}
```

#### API
```
POST   /api/sms/send              - Send SMS
GET    /api/sms/log               - SMS history
POST   /api/sms/templates         - Manage templates
```

---

## 🟡 KATEGORI C: P1 - SHOULD HAVE (Kvalitetsforbedringer)

**Estimeret tid:** 10 dage  
**Impact:** Bedre UX og færre bugs

### C1. Auto-Send Safety Audit 🛡️
**Tid:** 4 timer  
**Status:** CRITICAL ISSUES FOUND

**Problemer fundet:**
1. ❌ `leadMonitor.ts` sender auto-emails (FIXED ✅)
2. ❌ `followUpService.ts` sender auto-emails (ACTIVE!)
3. ⚠️ Dashboard API kan sende emails hvis `dryRun=false`

**Action items:**
- [ ] Audit `followUpService.ts` og tilføj approval flow
- [ ] Add authentication til email-sending endpoints
- [ ] Add audit log når emails sendes
- [ ] Test at `RUN_MODE=dry-run` respekteres overalt

**Dokumentation:** CRITICAL_ISSUES_FOUND_OCT_5_2025.md

---

### C2. Redis Setup ⚡
**Tid:** 10 minutter  
**Status:** Optional men anbefalet

**Current state:**
- ⚠️ Using in-memory cache (lost ved restart)
- ⚠️ Warning logs hver gang

**Setup:**
- [ ] Create Redis på Render.com (gratis: 25MB)
- [ ] Add `REDIS_URL` til environment
- [ ] Redeploy
- [ ] Verify logs viser Redis connection success

**Benefits:**
- Persistent cache
- Bedre performance
- Cleaner logs

---

### C3. Environment Variables Audit 🔐
**Tid:** 30 minutter  
**Status:** Security issue

**Problemer:**
- ⚠️ `GEMINI_KEY` exposed i .env
- ⚠️ `GOOGLE_PRIVATE_KEY` visible
- ⚠️ Skal bruge Render environment variables

**Action items:**
- [ ] Move alle secrets til Render environment variables
- [ ] Delete local .env fil
- [ ] Add .env til .gitignore (check det er der)
- [ ] Test deployment virker efter ændringer

---

### C4. Email Quality Improvements 📧
**Tid:** 2 dage  
**Status:** Good, but can be better

**Current issues:**
- ⚠️ Sometimes sends at weird times (00:07)
- ⚠️ Sometimes includes [Ukendt] m²
- ⚠️ Price formatting kunne være bedre

**Improvements:**
```typescript
// Email timing constraints
MIN_SEND_TIME = 08:00
MAX_SEND_TIME = 17:00

// If generated outside hours → queue til næste morgen 08:00

// Placeholder detection
INVALID_PLACEHOLDERS = [
  '[Ukendt]',
  '[Ikke angivet]',
  'undefined',
  'null'
]

// If found → don't send, log error

// Price formatting
349 kr/time → 349,00 kr/time (with thousand separators)
```

**Files to edit:**
- `src/services/emailResponseGenerator.ts`
- `src/services/emailQualityChecker.ts`

---

### C5. Calendar Conflict Resolution 📅
**Tid:** 2 dage  
**Status:** Basic detection works, but no auto-resolution

**Current state:**
- ✅ Detects conflicts
- ❌ Doesn't auto-suggest alternatives
- ❌ Requires manual rebooking

**Improvements:**
```typescript
// When conflict detected:
1. Find next 3 available slots (same duration)
2. Send email with alternatives
3. Include calendar links (add to calendar)
4. Track customer response
5. Auto-book hvis customer accepterer
```

**API Endpoints:**
```
GET    /api/conflicts/:bookingId/alternatives
POST   /api/conflicts/:bookingId/resolve
```

---

### C6. Dashboard Performance Optimization ⚡
**Tid:** 1 dag  
**Status:** Works, but could be faster

**Current issues:**
- Some widgets load slowly (3-5 sekunder)
- No loading states
- No error boundaries

**Improvements:**
```typescript
// Add loading skeletons
<Skeleton className="h-32 w-full" />

// Add error boundaries
<ErrorBoundary fallback={<ErrorDisplay />}>
  <Widget />
</ErrorBoundary>

// Optimize database queries
- Add indexes
- Use pagination
- Cache aggregations

// Lazy load widgets
- Only load visible widgets
- Load below-fold widgets after initial render
```

---

### C7. Mobile Responsiveness Audit 📱
**Tid:** 1 dag  
**Status:** Mostly responsive, but some issues

**Issues found:**
- Tables don't scroll well on mobile
- Some buttons too small for touch
- Form inputs could be bigger

**Test checklist:**
- [ ] Test på iPhone (Safari)
- [ ] Test på Android (Chrome)
- [ ] Test på iPad (Safari)
- [ ] Test landscape mode
- [ ] Test keyboard visibility

**Fixes:**
```css
/* Tables: horizontal scroll */
.table-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Buttons: min touch target 44x44px */
button {
  min-height: 44px;
  min-width: 44px;
}

/* Form inputs: larger på mobile */
@media (max-width: 768px) {
  input, select, textarea {
    font-size: 16px; /* Prevent zoom på iOS */
    padding: 12px;
  }
}
```

---

### C8. Automated Testing 🧪
**Tid:** 3 dage  
**Status:** Minimal test coverage

**Current state:**
- ✅ Some unit tests exist
- ❌ No integration tests
- ❌ No E2E tests
- ❌ No CI/CD tests

**Test suite to build:**

#### Unit Tests (Vitest)
```typescript
// src/tests/
├── services/
│   ├── gmailService.test.ts
│   ├── calendarService.test.ts
│   └── emailQualityChecker.test.ts
├── agents/
│   ├── intentClassifier.test.ts
│   └── taskPlanner.test.ts
└── utils/
    └── priceCalculator.test.ts

Target: 80% code coverage
```

#### Integration Tests
```typescript
// tests/integration/
├── email-flow.test.ts        - Lead → Email → Send
├── booking-flow.test.ts      - Availability → Book → Calendar
├── followup-flow.test.ts     - Old lead → Follow-up → Send
└── api-endpoints.test.ts     - All API routes
```

#### E2E Tests (Playwright)
```typescript
// tests/e2e/
├── dashboard.spec.ts         - Dashboard loads all widgets
├── customer-crud.spec.ts     - Create/edit/delete customer
├── booking-crud.spec.ts      - Create/edit/delete booking
└── email-approval.spec.ts    - Approve/reject email flow
```

**CI/CD Integration:**
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm test
      - run: npm run test:integration
      - run: npm run test:e2e
```

---

## 🟢 KATEGORI D: P2 - NICE TO HAVE (Future Enhancements)

**Estimeret tid:** 15 dage  
**Impact:** Convenience features

### D1. Advanced Analytics Dashboard 📊
**Tid:** 3 dage

**Features:**
- Revenue trends (dag/uge/måned)
- Customer acquisition cost
- Lead conversion rates
- Booking occupancy rates
- Employee productivity
- Most profitable services
- Geographic heatmap (hvor er customers?)

**Charts:**
```typescript
import { LineChart, BarChart, PieChart, HeatMap } from 'recharts'

// Revenue over time
<LineChart data={revenueData} />

// Lead sources
<PieChart data={leadSources} />

// Bookings per day
<BarChart data={bookingsPerDay} />

// Customer locations
<HeatMap data={customerLocations} />
```

---

### D2. Team Management 👥
**Tid:** 2 dage

**Features:**
- Add team members
- Assign bookings til specific person
- Track performance per person
- Time tracking per person
- Calendar view per person
- Availability management

**Database:**
```typescript
model TeamMember {
  id          String   @id @default(uuid())
  name        String
  email       String   @unique
  phone       String
  role        String   // "cleaner", "manager", "admin"
  hourlyRate  Float
  
  // Availability
  availability Availability[]
  
  // Assignments
  bookings    Booking[]
  
  // Performance
  completedJobs Int @default(0)
  avgRating     Float?
  
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
}

model Availability {
  id            String   @id @default(uuid())
  teamMemberId  String
  teamMember    TeamMember @relation(fields: [teamMemberId])
  dayOfWeek     Int      // 0-6 (Sunday-Saturday)
  startTime     String   // "09:00"
  endTime       String   // "17:00"
}
```

---

### D3. Inventory Management 📦
**Tid:** 2 dage

**Use case:** Track cleaning supplies

**Features:**
- List af produkter
- Current stock levels
- Low stock alerts
- Usage tracking per job
- Automatic reorder suggestions

**Database:**
```typescript
model InventoryItem {
  id              String   @id @default(uuid())
  name            String
  category        String   // "cleaner", "equipment", "supplies"
  currentStock    Int
  minStockLevel   Int
  unit            String   // "stk", "liter", "kg"
  costPerUnit     Float
  supplier        String?
  
  // Usage
  usageRecords    InventoryUsage[]
  
  createdAt       DateTime @default(now())
}

model InventoryUsage {
  id          String   @id @default(uuid())
  itemId      String
  item        InventoryItem @relation(fields: [itemId])
  bookingId   String?
  booking     Booking? @relation(fields: [bookingId])
  quantity    Float
  usedAt      DateTime @default(now())
}
```

---

### D4. Route Optimization 🗺️
**Tid:** 3 dage

**Use case:** Optimal driving route mellem jobs

**Features:**
- Google Maps integration
- Calculate driving time
- Optimize daily route (TSP algorithm)
- Gas cost estimation
- Travel time booking (tid mellem jobs)

**API Integration:**
```typescript
// Google Maps Distance Matrix API
const getOptimalRoute = async (locations: Address[]) => {
  // Calculate all pairwise distances
  const distances = await getDistanceMatrix(locations)
  
  // Solve TSP (nearest neighbor heuristic)
  const route = solveTSP(distances)
  
  return {
    route,
    totalDistance: sum(route.legs.map(l => l.distance)),
    totalTime: sum(route.legs.map(l => l.duration)),
    estimatedCost: totalDistance * 3.5 // 3.50 kr/km
  }
}
```

---

### D5. Customer Segmentation 🎯
**Tid:** 2 dage

**Use case:** Smart marketing og personalization

**Segments:**
```typescript
// Segment types
type Segment = 
  | "high_value"      // >10,000 kr/year
  | "frequent"        // >12 bookings/year
  | "at_risk"         // No booking in 90 days
  | "new"             // First booking <30 days ago
  | "loyal"           // >2 years
  | "price_sensitive" // Always asks for discount

// Auto-assign segments
const assignSegments = async (customerId: string) => {
  const customer = await getCustomer(customerId)
  const bookings = await getBookings(customerId)
  const revenue = sum(bookings.map(b => b.totalPrice))
  
  const segments = []
  
  if (revenue > 10000) segments.push("high_value")
  if (bookings.length > 12) segments.push("frequent")
  if (daysSinceLastBooking > 90) segments.push("at_risk")
  // ... etc
  
  return segments
}
```

**Use cases:**
- Send targeted emails til "at_risk" customers
- Give loyalty discount til "loyal" customers
- Prioritize "high_value" customer requests

---

### D6. Email Template Builder 📧
**Tid:** 2 dage

**Use case:** Non-technical staff kan edit emails

**Features:**
- Drag-and-drop email builder
- Variable insertion {{customerName}}
- Preview før send
- A/B testing
- Template library

**UI:**
```typescript
<EmailBuilder
  variables={['customerName', 'bookingDate', 'price']}
  onSave={handleSave}
  preview={true}
/>
```

---

### D7. Customer Referral Program 🎁
**Tid:** 2 dage

**Use case:** Customers inviter deres venner

**Features:**
- Generate referral link per customer
- Track referrals
- Reward system (10% off next booking)
- Leaderboard

**Database:**
```typescript
model Referral {
  id            String   @id @default(uuid())
  referrerId    String
  referrer      Customer @relation("Referrer", fields: [referrerId])
  referredId    String
  referred      Customer @relation("Referred", fields: [referredId])
  
  status        String   // "pending", "completed", "rewarded"
  bookingId     String?
  booking       Booking? @relation(fields: [bookingId])
  
  rewardAmount  Float?   // Discount amount
  rewardedAt    DateTime?
  
  createdAt     DateTime @default(now())
}
```

**Reward logic:**
```typescript
// When referred customer books first job:
1. Mark referral as "completed"
2. Give referrer 10% discount code
3. Send email til referrer: "Din ven bookede!"
4. Track lifetime value af referred customer
```

---

### D8. Multi-Language Support 🌍
**Tid:** 1 dag

**Use case:** Expats i Danmark

**Languages:**
- 🇩🇰 Dansk (primær)
- 🇬🇧 English
- 🇩🇪 German
- 🇵🇱 Polish

**Implementation:**
```typescript
// i18n setup (react-i18next)
import i18n from 'i18next'

i18n.init({
  resources: {
    da: { translation: danishTranslations },
    en: { translation: englishTranslations },
    de: { translation: germanTranslations },
    pl: { translation: polishTranslations }
  },
  lng: 'da',
  fallbackLng: 'da'
})

// Usage
const { t } = useTranslation()
<h1>{t('dashboard.title')}</h1>
```

---

### D9. Recurring Bookings 🔄
**Tid:** 2 dage

**Use case:** Weekly/monthly faste kunder

**Features:**
- Create recurring booking pattern
- Auto-generate bookings X days in advance
- Skip dates (holidays)
- Pause subscription
- Cancel subscription

**Database:**
```typescript
model RecurringBooking {
  id          String   @id @default(uuid())
  customerId  String
  customer    Customer @relation(fields: [customerId])
  
  // Pattern
  frequency   String   // "weekly", "biweekly", "monthly"
  dayOfWeek   Int?     // For weekly (0-6)
  dayOfMonth  Int?     // For monthly (1-31)
  time        String   // "10:00"
  duration    Int      // 120 minutes
  
  // Plan
  planId      String?
  plan        CleaningPlan? @relation(fields: [planId])
  
  // Status
  active      Boolean  @default(true)
  startDate   DateTime
  endDate     DateTime?
  
  // Generated bookings
  bookings    Booking[]
  
  createdAt   DateTime @default(now())
}
```

**Cron job:**
```typescript
// Every day at 06:00
// Generate bookings for next 30 days if not exists
const generateRecurringBookings = async () => {
  const activeRecurring = await getActiveRecurringBookings()
  
  for (const recurring of activeRecurring) {
    const next30Days = getNext30Days(recurring.frequency, recurring.dayOfWeek)
    
    for (const date of next30Days) {
      const exists = await bookingExists(recurring.customerId, date)
      if (!exists) {
        await createBooking({
          customerId: recurring.customerId,
          date,
          time: recurring.time,
          duration: recurring.duration,
          planId: recurring.planId,
          recurringBookingId: recurring.id
        })
      }
    }
  }
}
```

---

### D10. WhatsApp Integration 💬
**Tid:** 2 dage

**Use case:** Some customers prefer WhatsApp over email

**Features:**
- Send booking confirmations via WhatsApp
- Receive inquiries via WhatsApp
- Chat support
- Status updates

**API:** WhatsApp Business API
```typescript
import { Client } from 'whatsapp-web.js'

const sendWhatsApp = async (to: string, message: string) => {
  const client = new Client()
  await client.initialize()
  await client.sendMessage(to, message)
}

// Use cases
sendWhatsApp(customer.phone, "Din booking er bekræftet!")
sendWhatsApp(customer.phone, "Vi er på vej!")
sendWhatsApp(customer.phone, "Job completed. Tak for din bestilling!")
```

---

### D11. Document Storage 📄
**Tid:** 1 dag

**Use case:** Upload contracts, photos, etc.

**Features:**
- Upload files til customer/booking
- PDF viewer
- Image gallery
- Search documents
- Access control

**Storage:** AWS S3 / Cloudinary

**Database:**
```typescript
model Document {
  id          String   @id @default(uuid())
  customerId  String?
  customer    Customer? @relation(fields: [customerId])
  bookingId   String?
  booking     Booking? @relation(fields: [bookingId])
  
  name        String
  type        String   // "contract", "photo", "invoice", "other"
  fileType    String   // "pdf", "jpg", "png", "docx"
  fileSize    Int      // bytes
  url         String
  
  uploadedBy  String
  uploadedAt  DateTime @default(now())
}
```

**API:**
```
POST   /api/documents/upload        - Upload file
GET    /api/documents/:id           - Download file
DELETE /api/documents/:id           - Delete file
GET    /api/documents/customer/:id  - List customer docs
GET    /api/documents/booking/:id   - List booking docs
```

---

### D12. Feedback Widget 💭
**Tid:** 1 dag

**Use case:** Quick feedback på dashboard

**Features:**
- "Report a bug" button
- "Request a feature" button
- Screenshot capture
- Send til Slack/Email

**UI:**
```typescript
<FeedbackWidget
  user={currentUser}
  onSubmit={async (feedback) => {
    await sendToSlack(feedback)
    // Or create GitHub issue
    await createGitHubIssue(feedback)
  }}
/>
```

**Feedback types:**
- 🐛 Bug report
- 💡 Feature request
- 📚 Documentation issue
- 🎨 UI/UX suggestion
- ❓ Question

---

## 🔵 KATEGORI E: P3 - LONG TERM (Fase 3+)

**Estimeret tid:** 30+ dage  
**Impact:** Strategic features

### E1. Mobile Apps (iOS + Android) 📱
**Tid:** 30 dage (3 udviklere)

**Tech stack:** React Native (genbruge web components)

**Features:**
- Native push notifications
- GPS tracking
- Offline mode
- Camera integration (quality photos)
- Time tracking with GPS
- Calendar sync
- Quick booking
- Emergency contact

**Distribution:**
- App Store (iOS)
- Google Play (Android)

---

### E2. Voice Assistant Integration 🎤
**Tid:** 10 dage

**Use case:** "Hey Google, book cleaning for tomorrow at 10am"

**Integrations:**
- Google Assistant
- Amazon Alexa
- Apple Siri Shortcuts

**Implementation:**
```typescript
// Google Assistant action
app.intent('book_cleaning', async (conv) => {
  const date = conv.parameters.date
  const time = conv.parameters.time
  
  const slot = await findAvailableSlot(date, time)
  
  if (slot) {
    conv.ask(`I found a slot at ${slot.time}. Should I book it?`)
  } else {
    conv.ask(`No slots available. Try ${alternativeSlot.time}?`)
  }
})
```

---

### E3. AI Price Optimization 🤖
**Tid:** 5 dage

**Use case:** Dynamic pricing baseret på demand

**Features:**
- Surge pricing ved høj demand
- Discount ved lav demand
- Customer lifetime value pricing
- Competitor price tracking
- Optimal price finder

**Algorithm:**
```typescript
const calculateOptimalPrice = (booking: Booking) => {
  const basePrice = 349 // kr/hour
  
  // Factors
  const demandMultiplier = getDemandMultiplier(booking.date)
  const customerValueMultiplier = getCustomerValueMultiplier(booking.customerId)
  const timeMultiplier = getTimeMultiplier(booking.time) // Weekend +10%
  const urgencyMultiplier = getUrgencyMultiplier(booking.createdAt) // Last-minute +20%
  
  const optimalPrice = basePrice * 
    demandMultiplier * 
    customerValueMultiplier * 
    timeMultiplier * 
    urgencyMultiplier
  
  return Math.round(optimalPrice)
}
```

---

### E4. Advanced AI Assistant 🧠
**Tid:** 10 dage

**Use case:** AI kan handle complex workflows

**Features:**
- Multi-step reasoning
- Proactive suggestions
- Learn from past decisions
- Predict customer needs
- Auto-negotiate pricing
- Handle complex complaints

**Tech:** OpenAI Assistants API + RAG

---

### E5. Franchise System 🏢
**Tid:** 20 dage

**Use case:** Scale til multiple locations

**Features:**
- Multi-tenant architecture
- Separate databases per location
- Franchise dashboard (owner view)
- Revenue sharing tracking
- Cross-location booking
- Centralized marketing

**Database:**
```typescript
model Franchise {
  id          String   @id @default(uuid())
  name        String
  location    String
  ownerId     String
  owner       User     @relation(fields: [ownerId])
  
  // Branding
  logo        String?
  colors      Json?
  
  // Business
  customers   Customer[]
  bookings    Booking[]
  revenue     Float    @default(0)
  
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
}
```

---

### E6. Marketplace Integration 🛒
**Tid:** 5 dage

**Use case:** Sell på platforme som Wolt, Finn.dk, DBA.dk

**Integrations:**
- Wolt (food delivery → cleaning delivery)
- Finn.dk (klassekampannoncer)
- DBA.dk (services)
- Trustpilot (reviews)

**API sync:**
- Push bookings til marketplace
- Pull orders fra marketplace
- Sync availability
- Sync pricing

---

## 📋 SUMMARY - HVAD SKAL VI GØRE FØRST?

### Anbefalet Prioritering

#### **NU (denne uge):**
1. ✅ Fix deployment (DONE!)
2. ⏳ Google Auth verification (15 min)
3. 🧪 End-to-end testing (2-4 timer)
4. 📊 Error monitoring setup (30 min)

**Total tid:** 3-6 timer

---

#### **Sprint 1 (næste 2 uger):**
1. 📋 Rengøringsplaner (5 dage) - CRITICAL
2. ⏱️ Time Tracking (4 dage) - CRITICAL
3. 🛡️ Auto-send safety audit (4 timer)
4. ⚡ Redis setup (10 min)

**Total tid:** 9 dage

---

#### **Sprint 2 (uge 3-4):**
1. 💰 Fakturering (5 dage)
2. 📊 Quality Reports (3 dage)
3. 👤 Customer Portal (3 dage)

**Total tid:** 11 dage

---

#### **Sprint 3 (uge 5-6):**
1. 💳 Payment Integration (2 dage)
2. 📱 SMS Notifications (1 dag)
3. 📧 Email quality improvements (2 dage)
4. 📅 Calendar conflict resolution (2 dage)

**Total tid:** 7 dage

---

#### **Efter v1 launch:**
- 📊 Advanced Analytics
- 👥 Team Management
- 📦 Inventory Management
- 🗺️ Route Optimization
- ... (alt P2 stuff)

---

## 🎯 DECISION TIME - HVAD VIL DU STARTE MED?

Vælg en kategori eller specifik feature:

- **A) Fix blokkere nu** (3-6 timer)
- **B) Start Sprint 1** (Rengøringsplaner + Time Tracking)
- **C) Fix quality issues** (Auto-send safety, email quality)
- **D) Nice-to-have features** (Vælg fra liste)
- **E) Long-term planning** (Diskuter strategi)

**Hvad siger du?** 🎯
