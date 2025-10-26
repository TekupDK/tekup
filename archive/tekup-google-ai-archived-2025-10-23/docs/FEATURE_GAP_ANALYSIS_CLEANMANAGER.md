# 🎯 Feature Gap Analysis: CleanManager → RenOS by Tekup

**Context:** Jonas brugte CleanManager før, men det var for dyrt. Nu bygger Tekup RenOS som et bedre alternativ målrettet småfirmaer.

**Dato:** 5. Oktober 2025  
**Status:** Gap analysis + implementeringsplan

---

## 📊 Executive Summary

**TL;DR:**
- CleanManager har **7 hovedfeatures** vi mangler
- **3 er kritiske** for at erstatte CleanManager 100%
- **4 er nice-to-have** men ikke dealbreakers
- Implementeringstid: **2-4 uger** for kritiske features

---

## ❌ FEATURES VI MANGLER (CleanManager har, vi har ikke)

### 🔴 **KRITISK GAP #1: Rengøringsplaner / Job Templates**

**Hvad CleanManager har:**
```
✅ Genbrugelige rengøringsplaner
✅ Templates for faste kunder
✅ Standardiserede opgavelister
✅ Checklists per lokation
✅ Automatisk tidsestimat baseret på plan
```

**Hvad vi har:**
```
❌ Ingen plan-system
❌ Hver job håndteres manuelt
❌ Ingen standardisering
```

**Hvorfor det er vigtigt:**
- Jonas skal bruge samme plan for faste kunder
- Spar tid ved at genbruge templates
- Konsistent kvalitet (samme checklist hver gang)
- Præcise tidsestimater

**Implementering:**
```typescript
// New database model
model CleaningPlan {
  id          String   @id @default(uuid())
  name        String   // "Standard boligrengøring 80m²"
  description String?
  
  // Plan details
  estimatedHours  Float  // 3.5 timer
  pricePerHour    Float  // 300 kr/t
  totalPrice      Float  // 1050 kr
  
  // Tasks checklist
  tasks       Task[]
  
  // Usage
  customerId  String?
  customer    Customer? @relation(fields: [customerId], references: [id])
  bookings    Booking[]
  
  createdAt   DateTime @default(now())
}

model Task {
  id          String  @id @default(uuid())
  planId      String
  plan        CleaningPlan @relation(fields: [planId], references: [id])
  
  title       String  // "Støvsug alle rum"
  description String?
  order       Int     // 1, 2, 3...
  completed   Boolean @default(false)
}
```

**UI Components:**
```
📁 client/src/pages/CleaningPlans.tsx
   - List af alle plans
   - Create new plan
   - Edit existing plan
   - Assign til kunde

📁 client/src/components/PlanBuilder.tsx
   - Drag-and-drop task builder
   - Time estimation calculator
   - Price calculator
```

**API Endpoints:**
```
GET    /api/plans                 - List alle plans
POST   /api/plans                 - Create ny plan
GET    /api/plans/:id             - Get specific plan
PUT    /api/plans/:id             - Update plan
DELETE /api/plans/:id             - Delete plan
POST   /api/plans/:id/duplicate   - Clone eksisterende plan
POST   /api/bookings/:id/apply-plan - Apply plan til booking
```

**Estimeret tid:** 3-5 dage
**Prioritet:** 🔴 P0 - CRITICAL

---

### 🔴 **KRITISK GAP #2: Time Tracking / Tidsregistrering**

**Hvad CleanManager har:**
```
✅ Start/stop timer per job
✅ Faktisk tid vs estimeret tid tracking
✅ Overtid registrering
✅ Pause/break tracking
✅ GPS check-in (mobile app)
```

**Hvad vi har:**
```
❌ Ingen time tracking
❌ Kun Google Calendar (booking tid)
❌ Ingen faktisk vs estimeret comparison
```

**Hvorfor det er vigtigt:**
- Jonas skal vide hvor lang tid jobs FAKTISK tager
- Forbedre estimater over tid
- Undgå at underbyde (hvis jobs tager længere end forventet)
- Data til pricing optimization

**Implementering:**
```typescript
// Extend Booking model
model Booking {
  // ... existing fields
  
  // Time tracking
  estimatedHours    Float?   // 3 timer (fra plan)
  actualStartTime   DateTime?
  actualEndTime     DateTime?
  actualHours       Float?    // Calculated
  
  // Breaks
  breaks            Break[]
  totalBreakMinutes Int       @default(0)
  
  // Performance
  timeVariance      Float?    // actualHours - estimatedHours
  efficiencyScore   Float?    // estimatedHours / actualHours * 100
  
  // Notes
  timeNotes         String?   // "Traffic delay", "Extra requests"
}

model Break {
  id        String   @id @default(uuid())
  bookingId String
  booking   Booking  @relation(fields: [bookingId], references: [id])
  
  startTime DateTime
  endTime   DateTime?
  duration  Int?     // minutes
  reason    String?  // "Lunch", "Equipment issue"
}
```

**UI Components:**
```
📁 client/src/components/TimeTracker.tsx
   - Start/Stop buttons
   - Real-time timer display
   - Break management
   - Notes input

📁 client/src/pages/TimeReports.tsx
   - Time vs estimate comparison
   - Efficiency metrics
   - Overtime analysis
```

**API Endpoints:**
```
POST   /api/bookings/:id/start-timer    - Start job
POST   /api/bookings/:id/stop-timer     - End job
POST   /api/bookings/:id/start-break    - Start pause
POST   /api/bookings/:id/end-break      - End pause
GET    /api/reports/time-analysis       - Time analytics
```

**Estimeret tid:** 4-6 dage
**Prioritet:** 🔴 P0 - CRITICAL

---

### 🔴 **KRITISK GAP #3: Fakturering / Invoicing**

**Hvad CleanManager har:**
```
✅ Automatisk faktura fra afsluttet job
✅ Integration til e-conomic/Dinero
✅ PDF faktura generation
✅ Email send til kunde
✅ Betalingsstatus tracking
✅ Påmindelser for ubetalte fakturaer
```

**Hvad vi har:**
```
❌ Ingen faktura system
❌ Kun tilbud via email
🟡 Billy.dk integration planlagt (men ikke implementeret)
```

**Hvorfor det er vigtigt:**
- Jonas skal sende fakturaer efter jobs
- Professionel PDF format
- Track betalinger
- Accounting integration

**Implementering:**
```typescript
// New database models
model Invoice {
  id              String   @id @default(uuid())
  invoiceNumber   String   @unique  // "REN-2025-001"
  
  // Relations
  bookingId       String   @unique
  booking         Booking  @relation(fields: [bookingId], references: [id])
  customerId      String
  customer        Customer @relation(fields: [customerId], references: [id])
  
  // Details
  lineItems       InvoiceLineItem[]
  subtotal        Float
  vatRate         Float    @default(25)  // 25% moms
  vatAmount       Float
  total           Float
  
  // Payment
  status          InvoiceStatus @default(DRAFT)
  dueDate         DateTime
  paidAt          DateTime?
  paymentMethod   String?  // "Bank transfer", "MobilePay"
  
  // PDF
  pdfUrl          String?
  emailSentAt     DateTime?
  
  // Reminders
  remindersSent   Int      @default(0)
  lastReminderAt  DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
  CANCELLED
}

model InvoiceLineItem {
  id          String  @id @default(uuid())
  invoiceId   String
  invoice     Invoice @relation(fields: [invoiceId], references: [id])
  
  description String  // "Boligrengøring 80m²"
  quantity    Float   // 3.5 timer
  unitPrice   Float   // 300 kr/t
  total       Float   // 1050 kr
  
  order       Int     // 1, 2, 3...
}
```

**Integration:**
```typescript
// Billy.dk API client
export class BillyApiClient {
  async createInvoice(booking: Booking): Promise<BillyInvoice> {
    // POST to Billy.dk API
  }
  
  async sendInvoice(invoiceId: string): Promise<void> {
    // Email via Billy
  }
  
  async getInvoiceStatus(invoiceId: string): Promise<InvoiceStatus> {
    // Check payment status
  }
}
```

**UI Components:**
```
📁 client/src/pages/Invoices.tsx
   - Invoice list (all statuses)
   - Create invoice from booking
   - Preview & send
   - Payment tracking

📁 client/src/components/InvoicePreview.tsx
   - Professional PDF layout
   - Company logo & info
   - Line items table
   - Payment instructions
```

**API Endpoints:**
```
GET    /api/invoices                    - List alle fakturaer
POST   /api/invoices                    - Create fra booking
GET    /api/invoices/:id                - Get specific
GET    /api/invoices/:id/pdf            - Generate PDF
POST   /api/invoices/:id/send           - Send email
POST   /api/invoices/:id/mark-paid      - Mark as paid
POST   /api/invoices/:id/send-reminder  - Send reminder
```

**Estimeret tid:** 5-7 dage (inkl. Billy.dk integration)
**Prioritet:** 🔴 P0 - CRITICAL

---

## 🟡 NICE-TO-HAVE GAPS (Ikke dealbreakers)

### 🟡 **GAP #4: Lagerstyring / Inventory Management**

**Hvad CleanManager har:**
```
✅ Inventory tracking (rengøringsmidler, udstyr)
✅ Low stock alerts
✅ Automatic reorder suggestions
✅ Supplier management
```

**Hvad vi har:**
```
❌ Ingen inventory system
```

**Hvorfor det ikke er kritisk:**
- Jonas har lille inventory (solo business)
- Kan trackes manuelt
- Ikke en blocking feature

**Implementering (hvis ønsket):**
```typescript
model InventoryItem {
  id              String   @id @default(uuid())
  name            String   // "All-purpose cleaner"
  category        String   // "Cleaning supplies"
  currentStock    Int
  minStock        Int      // Alert threshold
  unit            String   // "bottles", "liters"
  pricePerUnit    Float
  supplier        String?
  lastRestocked   DateTime?
}
```

**Estimeret tid:** 2-3 dage
**Prioritet:** 🟡 P2 - LOW (skip for now)

---

### 🟡 **GAP #5: Mobile App**

**Hvad CleanManager har:**
```
✅ iOS + Android apps
✅ Offline mode
✅ GPS check-in
✅ Job details on mobile
✅ Customer info on mobile
```

**Hvad vi har:**
```
❌ Ingen mobile app (kun responsive web)
✅ Dashboard fungerer på mobile browser
```

**Hvorfor det ikke er kritisk:**
- Web version er mobile-friendly
- Jonas kan bruge browser
- Native app er overkill for fase 1

**Implementering (Phase 3):**
```
Option 1: React Native (share code med web)
Option 2: Progressive Web App (PWA)
Option 3: Capacitor (wrap existing React app)
```

**Estimeret tid:** 3-4 uger (full native app)
**Prioritet:** 🟡 P3 - PHASE 3 (planlagt, men ikke nu)

---

### 🟡 **GAP #6: SMS Notifikationer**

**Hvad CleanManager har:**
```
✅ SMS til medarbejdere (shift reminders)
✅ SMS til kunder (booking confirmations)
✅ Bulk SMS
```

**Hvad vi har:**
```
❌ Ingen SMS
✅ Email notifikationer fungerer
```

**Hvorfor det ikke er kritisk:**
- Email fungerer fint for Jonas' use case
- SMS koster penge (Twilio ~0.05 kr/SMS)
- Kunder læser emails

**Implementering (hvis ønsket):**
```typescript
// Twilio integration (1 dag)
import twilio from 'twilio';

export async function sendSMS(to: string, body: string) {
  const client = twilio(TWILIO_SID, TWILIO_TOKEN);
  await client.messages.create({
    to,
    from: TWILIO_NUMBER,
    body,
  });
}
```

**Estimeret tid:** 1 dag
**Prioritet:** 🟡 P2 - LOW (email er nok)

---

### 🟡 **GAP #7: Kvalitetsrapporter**

**Hvad CleanManager har:**
```
✅ Digital rapportskabeloner
✅ Før/efter fotos
✅ Kunde-signaturer
✅ Issue tracking
```

**Hvad vi har:**
```
❌ Ingen quality reports
🟡 Email follow-up kan bede om feedback
```

**Hvorfor det ikke er kritisk:**
- Manual quality control i fase 1
- Jonas kender sine kunder personligt
- Kan tilføjes senere

**Implementering:**
```typescript
model QualityReport {
  id          String   @id @default(uuid())
  bookingId   String   @unique
  booking     Booking  @relation(fields: [bookingId], references: [id])
  
  // Photos
  beforePhotos  String[]  // URLs
  afterPhotos   String[]
  
  // Checklist
  tasks         QualityTask[]
  
  // Customer feedback
  signature     String?   // Base64 image
  rating        Int?      // 1-5 stars
  feedback      String?
  issues        String?
  
  completedAt   DateTime
}
```

**Estimeret tid:** 3-4 dage
**Prioritet:** 🟡 P2 - PHASE 2 (nice-to-have)

---

## ✅ FEATURES VI HAR SOM CLEANMANAGER IKKE HAR

### 🚀 **RenOS UNIKKE FORDELE**

#### 1. AI Email Auto-Response
```
🤖 Gemini AI genererer personaliserede tilbud
📧 95% reduktion i manuel email-håndtering
⚡ 2-5 minutter fra lead til tilbud
✅ 100% dansk sprog, professionel tone
🔍 Quality validation (ingen placeholders)
🚫 Duplicate detection (ingen double-quotes)
```

**CleanManager:** ❌ Ingen AI features

---

#### 2. Intelligent Lead Monitoring
```
🔍 Automatisk parsing af Leadmail.no emails
📊 Lead source detection (Rengøring.nu, AdHelp, etc.)
🎯 Auto-extract customer info
⚡ 0 minutter manuel lead entry
```

**CleanManager:** ❌ Manual lead entry

---

#### 3. Smart Calendar Booking
```
📅 AI conflict detection
🎯 Next available slot finder
⚡ Automatic booking optimization
```

**CleanManager:** 🟡 Manual drag-drop (ingen AI)

---

#### 4. Real-Time Dashboard
```
📊 5 intelligente widgets
🔄 Auto-refresh (30-60 sek)
⚡ Real-time data
📈 Business intelligence
```

**CleanManager:** 🟡 Basic reports (ikke real-time)

---

#### 5. Price Point
```
💰 RenOS: 0-700 kr/md (freemium)
💰 CleanManager: 400-600 kr/md (fixed)

Savings: 50-70% for solo/SMB
```

---

## 📋 IMPLEMENTERINGSPLAN

### **Phase 1: Critical Gaps (2-4 uger)**

**Priority: Replace CleanManager's core functionality**

#### Week 1-2: Rengøringsplaner & Time Tracking
```
✅ Database schema (CleaningPlan, Task, Break)
✅ API endpoints
✅ UI components (PlanBuilder, TimeTracker)
✅ Integration med Booking system
```

**Deliverables:**
- [ ] Create cleaning plan templates
- [ ] Assign plans til kunder
- [ ] Start/stop timer på jobs
- [ ] Track faktisk vs estimeret tid

---

#### Week 3-4: Fakturering
```
✅ Database schema (Invoice, InvoiceLineItem)
✅ Billy.dk API integration
✅ PDF generation (invoice layout)
✅ Email sending
✅ Payment tracking
```

**Deliverables:**
- [ ] Generate faktura fra afsluttet booking
- [ ] Send professional PDF via email
- [ ] Track betalingsstatus
- [ ] Send payment reminders

---

### **Phase 2: Nice-to-Have (4-6 uger)**

#### Week 5-6: Kvalitetsrapporter
```
✅ QualityReport model
✅ Photo upload (before/after)
✅ Digital signature
✅ Customer rating system
```

#### Week 7-8: Mobile Optimization
```
✅ PWA setup (offline support)
✅ Mobile-first UI improvements
✅ Touch gestures
✅ Push notifications
```

---

### **Phase 3: Advanced Features (8-12 uger)**

#### Month 3-4: Full Mobile App
```
✅ React Native setup
✅ iOS + Android builds
✅ App store deployment
```

#### Month 4: Inventory & SMS
```
✅ Inventory management
✅ Twilio SMS integration
✅ Advanced reporting
```

---

## 💰 COST COMPARISON

### **CleanManager Total Cost**
```
Månedlig: 400-600 kr/md
Årlig: 4,800-7,200 kr
5 år: 24,000-36,000 kr
```

### **RenOS Total Cost (for Jonas)**
```
Development: Gratis (Tekup bygger det)
Hosting: ~200 kr/md (Render + Database)
Årlig: 2,400 kr
5 år: 12,000 kr

Savings: 12,000-24,000 kr over 5 år (50-67% besparelse)
```

---

## 🎯 RECOMMENDATIONS

### **Immediate Actions (Denne måned)**

1. **Implementer Critical Gaps (Phase 1)**
   - Rengøringsplaner (5 dage)
   - Time tracking (6 dage)
   - Fakturering (7 dage)
   - **Total: 18 dage (~3 uger)**

2. **Stop CleanManager subscription**
   - Eksporter data først
   - Migrér til RenOS
   - **Savings: 400-600 kr/md**

3. **Beta test med dig selv**
   - Brug RenOS på rigtige jobs
   - Find bugs
   - Feedback til Tekup

---

### **Long-term Strategy**

**Month 1-3:** Replace CleanManager 100%
- ✅ All critical features parity
- ✅ Smooth migration
- ✅ No functionality loss

**Month 4-6:** Surpass CleanManager
- ✅ AI features they don't have
- ✅ Better UX
- ✅ Cheaper pricing

**Month 7-12:** Scale & monetize
- ✅ Offer to other cleaning companies
- ✅ Freemium model
- ✅ Recurring revenue

---

## ✅ SUCCESS METRICS

### **Parity with CleanManager**
```
✅ All core workflows covered
✅ Same data tracked
✅ Same or better efficiency
✅ Lower cost
```

### **Beyond CleanManager**
```
🚀 AI automation (they don't have)
🚀 Better UX (modern stack)
🚀 Real-time insights
🚀 Scalable architecture
```

---

## 📊 FINAL VERDICT

**Question:** "Hvilke features har de som vi ikke har?"

**Answer:**
- **7 features mangler** (3 kritiske, 4 nice-to-have)
- **3-4 ugers udvikling** for fuld paritet
- **Men vi har 5 features de IKKE har** (AI, lead monitoring, smart booking, etc.)

**Conclusion:**
RenOS kan 100% erstatte CleanManager med **3-4 ugers udvikling**.
Derefter har vi et BEDRE system til HALV pris.

---

**Next Step:** Skal Tekup starte på Phase 1 (Critical Gaps) nu? 🚀

**Estimated delivery:** 3-4 uger fra i dag
**Cost:** Gratis (Tekup development)
**Result:** CleanManager replacement + AI features de ikke har
