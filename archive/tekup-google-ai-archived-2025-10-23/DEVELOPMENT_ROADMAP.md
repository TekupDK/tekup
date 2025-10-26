# 🗺️ RenOS Development Roadmap - CleanManager Replacement

**Mål:** 100% erstatte CleanManager med bedre features til halv pris  
**Ejer:** Tekup  
**Kunde:** Jonas @ Rendetalje.dk

---

## 📅 TIMELINE OVERVIEW

```
CURRENT STATE: 🟡 73% Complete
TARGET STATE:  ✅ 100% CleanManager Parity + AI Features

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ✅ DONE         🔄 IN PROGRESS         📋 PLANNED              │
│                                                                 │
│  Week 0 (Now)  Week 1-2    Week 3-4    Week 5-8    Month 3-6   │
│     │            │            │            │            │       │
│     ▼            ▼            ▼            ▼            ▼       │
│                                                                 │
│   Core        Plans &     Invoicing    Quality     Mobile      │
│   System      Tracking                 Reports     App         │
│   (Done)      (Phase 1)   (Phase 1)    (Phase 2)   (Phase 3)   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ PHASE 0: FOUNDATION (DONE)

**Status:** 🎉 **100% COMPLETE**  
**Tid brugt:** 3 måneder  
**Value:** Foundation for alt videre udvikling

### What We Built
```
✅ AI Integration (Gemini 2.0 Flash)
✅ Google Workspace Integration (Gmail + Calendar)
✅ Database Architecture (PostgreSQL + Prisma)
✅ Lead Monitoring System
✅ Email Auto-Response
✅ Smart Booking (conflict detection)
✅ Real-Time Dashboard (5 widgets)
✅ Safety Systems (dry-run, rate limiting)
✅ Complete Documentation (60+ docs)
✅ Competitive Analysis (vs CleanManager)
```

### What We Can Do Today
- ✅ Capture leads automatisk
- ✅ Send AI-genererede tilbud
- ✅ Book i Google Calendar
- ✅ Track leads & bookings
- ✅ Monitor system health

### What We CAN'T Do Yet (CleanManager gaps)
- ❌ Genbruge rengøringsplaner
- ❌ Track faktisk arbejdstid
- ❌ Send fakturaer
- ❌ Quality reports

---

## 🔴 PHASE 1: CRITICAL GAPS (18 dage)

**Status:** 📋 **READY TO START**  
**Start:** Så snart Jonas siger go  
**Slut:** 3-4 uger fra start  
**Prioritet:** P0 - MUST HAVE

**Mål:** 100% CleanManager core functionality parity

---

### 📌 **Sprint 1: Rengøringsplaner (5 arbejdsdage)**

**Value Proposition:**
> "Genbrug samme plan til faste kunder → spar 30 minutter per booking"

#### Day 1-2: Database & API
```
✅ CleaningPlan model
✅ Task model (checklist items)
✅ API endpoints (CRUD)
✅ Plan → Booking integration
```

**Deliverables:**
```typescript
// New models
- CleaningPlan (name, estimatedHours, totalPrice)
- Task (title, description, order, completed)

// API endpoints
POST   /api/plans              - Create plan
GET    /api/plans              - List all
GET    /api/plans/:id          - Get details
PUT    /api/plans/:id          - Update
DELETE /api/plans/:id          - Delete
POST   /api/plans/:id/clone    - Duplicate
```

#### Day 3-4: UI Components
```
✅ Plans list page
✅ Plan builder (add/remove tasks)
✅ Time & price calculator
✅ Assign plan til kunde
```

**UI Mockup:**
```
┌─────────────────────────────────────────────┐
│ 📋 Rengøringsplaner                        │
├─────────────────────────────────────────────┤
│                                             │
│  ⊕ Opret ny plan                           │
│                                             │
│  📄 Standard bolig (80m²)                   │
│     3.5 timer × 300 kr/t = 1,050 kr        │
│     8 opgaver ✓ | 3 bookings               │
│     [Rediger] [Klon] [Slet]                │
│                                             │
│  📄 Flytterengøring (100m²)                 │
│     5 timer × 300 kr/t = 1,500 kr          │
│     12 opgaver ✓ | 1 booking               │
│     [Rediger] [Klon] [Slet]                │
│                                             │
└─────────────────────────────────────────────┘
```

#### Day 5: Testing & Documentation
```
✅ Create test plans
✅ Apply til bookings
✅ Verify pricing calculations
✅ Write user docs
```

**Success Metrics:**
- [ ] 3+ templates oprettet
- [ ] Applied til 10+ bookings
- [ ] 30 min tidsbesparelse per booking
- [ ] 0 bugs i production

---

### ⏱️ **Sprint 2: Time Tracking (6 arbejdsdage)**

**Value Proposition:**
> "Track faktisk tid → forbedre estimater → undgå underbudding"

#### Day 1-2: Database & API
```
✅ Extend Booking model (actualStartTime, actualEndTime, actualHours)
✅ Break model (pauses during job)
✅ Efficiency calculations (actual vs estimated)
✅ Time tracking API endpoints
```

**Deliverables:**
```typescript
// Updated Booking model
- actualStartTime: DateTime?
- actualEndTime: DateTime?
- actualHours: Float?
- timeVariance: Float?
- efficiencyScore: Float?

// New Break model
- startTime, endTime, duration
- reason (lunch, equipment, etc)

// API endpoints
POST   /api/bookings/:id/start-timer
POST   /api/bookings/:id/stop-timer
POST   /api/bookings/:id/start-break
POST   /api/bookings/:id/end-break
GET    /api/reports/time-analysis
```

#### Day 3-4: UI Components
```
✅ Time tracker widget (start/stop)
✅ Real-time timer display
✅ Break management
✅ Time notes input
```

**UI Mockup:**
```
┌─────────────────────────────────────────────┐
│ ⏱️ Time Tracker - Jonas Hansen             │
├─────────────────────────────────────────────┤
│                                             │
│  📍 Booking: Standard bolig (80m²)          │
│  📅 2025-10-06 10:00-13:30                  │
│  ⏰ Estimat: 3.5 timer                      │
│                                             │
│  ╔═══════════════════════════════════════╗  │
│  ║      02:45:32                         ║  │
│  ║   (i gang siden 10:05)                ║  │
│  ╚═══════════════════════════════════════╝  │
│                                             │
│  [⏸️ Tag pause]  [⏹️ Afslut job]           │
│                                             │
│  Pauses i dag:                              │
│  🍽️ Frokost: 12:00-12:30 (30 min)         │
│                                             │
│  📝 Noter: "Ekstra vinduespudsning"        │
│                                             │
└─────────────────────────────────────────────┘
```

#### Day 5-6: Reports & Analytics
```
✅ Time vs estimate comparison
✅ Efficiency metrics per plan
✅ Overtime analysis
✅ Historical trends
```

**Reports Mockup:**
```
┌─────────────────────────────────────────────┐
│ 📊 Tidsanalyse - Oktober 2025              │
├─────────────────────────────────────────────┤
│                                             │
│  Efficiency Score: 92%  📈 +5% vs sep       │
│                                             │
│  Plan               Est.  Akt.  Diff        │
│  ─────────────────────────────────────────  │
│  Standard bolig     3.5h  3.2h  -20 min ✅  │
│  Flytterengøring    5.0h  5.8h  +48 min ⚠️  │
│  Kontorrengøring    2.0h  1.9h  -6 min  ✅  │
│                                             │
│  💡 Insight: Flytterengøring tager 15%      │
│     længere end estimeret. Overvej at      │
│     justere pris eller tidsestimat.        │
│                                             │
└─────────────────────────────────────────────┘
```

**Success Metrics:**
- [ ] 95%+ accuracy på time tracking
- [ ] Efficiency insights visible
- [ ] 20%+ forbedring af estimater (over 3 måneder)
- [ ] 0 forglemte timer

---

### 💰 **Sprint 3: Fakturering (7 arbejdsdage)**

**Value Proposition:**
> "Automatisk faktura efter job → professionelt udtryk → hurtigere betaling"

#### Day 1-3: Database & Billy.dk Integration
```
✅ Invoice model (invoiceNumber, lineItems, total)
✅ InvoiceLineItem model
✅ InvoiceStatus enum (DRAFT, SENT, PAID, OVERDUE)
✅ Billy.dk API client
✅ Webhook for payment updates
```

**Deliverables:**
```typescript
// New models
- Invoice (invoiceNumber, subtotal, vatAmount, total)
- InvoiceLineItem (description, quantity, unitPrice)
- InvoiceStatus (DRAFT → SENT → PAID)

// Billy.dk integration
- createInvoice(booking)
- sendInvoice(invoiceId)
- getPaymentStatus(invoiceId)
- handleWebhook (payment received)

// API endpoints
POST   /api/invoices                    - Create from booking
GET    /api/invoices                    - List all
GET    /api/invoices/:id                - Get details
GET    /api/invoices/:id/pdf            - Download PDF
POST   /api/invoices/:id/send           - Email kunde
POST   /api/invoices/:id/mark-paid      - Manual payment
POST   /api/invoices/:id/send-reminder  - Påmindelse
```

#### Day 4-5: PDF Generation & Email
```
✅ Professional invoice PDF layout
✅ Company logo & branding
✅ Line items table
✅ Payment instructions (bank, MobilePay)
✅ Email template
```

**Invoice PDF Layout:**
```
┌─────────────────────────────────────────────┐
│                                             │
│  🏢 RENDETALJE.DK          FAKTURA #001     │
│      CVR: 12345678         Dato: 06-10-2025│
│      info@rendetalje.dk    Betalingsfrist:  │
│      +45 12 34 56 78       20-10-2025       │
│                                             │
│  Kunde:                                     │
│  Anna Jensen                                │
│  Vestergade 123                             │
│  8000 Aarhus C                              │
│  anna@example.com                           │
│                                             │
│  ───────────────────────────────────────────│
│                                             │
│  Beskrivelse              Antal  Pris  Beløb│
│  ───────────────────────────────────────────│
│  Boligrengøring 80m²      3.5t   300kr 1,050│
│  Vinduespudsning          1.0t   300kr   300│
│                                             │
│                         Subtotal:      1,350│
│                         Moms (25%):      338│
│                         TOTAL:         1,688│
│                                             │
│  ───────────────────────────────────────────│
│                                             │
│  Betalingsoplysninger:                      │
│  Reg: 1234  Konto: 567890123               │
│  MobilePay: +45 12 34 56 78                 │
│                                             │
│  Tak for din forretning! 🙏                │
│                                             │
└─────────────────────────────────────────────┘
```

#### Day 6: UI Components
```
✅ Invoice list page
✅ Create invoice from booking
✅ Invoice preview
✅ Send & track
```

**UI Mockup:**
```
┌─────────────────────────────────────────────┐
│ 💰 Fakturaer                                │
├─────────────────────────────────────────────┤
│                                             │
│  Status: [Alle ▼] Søg: [___________] 🔍    │
│                                             │
│  📄 #001 - Anna Jensen        1,688 kr      │
│     06-10-2025 | ✅ BETALT (12-10-2025)     │
│     [Vis PDF] [Send igen]                   │
│                                             │
│  📄 #002 - Morten Nielsen    2,250 kr       │
│     08-10-2025 | 📧 SENDT (venter betaling) │
│     Betalingsfrist: 22-10-2025 (14 dage)   │
│     [Vis PDF] [Send reminder] [Mark betalt]│
│                                             │
│  📄 #003 - Sofie Andersen    1,350 kr       │
│     10-10-2025 | ⚠️ FORSINKET (over frist!) │
│     [Vis PDF] [Send reminder] [Call kunde] │
│                                             │
└─────────────────────────────────────────────┘
```

#### Day 7: Testing & Automation
```
✅ Test full invoice workflow
✅ Verify Billy.dk sync
✅ Test payment webhooks
✅ Setup automatic reminders (7 dage efter frist)
```

**Success Metrics:**
- [ ] 100% af bookings → fakturaer
- [ ] Professionel PDF kvalitet
- [ ] <24 timer fra job → faktura sendt
- [ ] 50%+ hurtigere betaling (vs manuel)
- [ ] 0 manglende fakturaer

---

## 🎉 PHASE 1 COMPLETION CHECKLIST

**When Phase 1 is done, RenOS can:**
```
✅ Erstatte 100% af CleanManager's core funktionalitet
✅ Genbrug rengøringsplaner
✅ Track faktisk arbejdstid
✅ Send professionelle fakturaer
✅ Forbedre estimater over tid
✅ Automatisk payment tracking
✅ + AI features CleanManager ikke har
```

**Jonas kan:**
```
✅ Stop CleanManager subscription (save 400-600 kr/md)
✅ Køre hele business i RenOS
✅ Skalere til flere kunder
✅ Data-drevet beslutningstagning
```

**Tekup kan:**
```
✅ Offer RenOS til andre cleaning companies
✅ Prove product-market fit
✅ Start monetization strategy
```

---

## 🟡 PHASE 2: ENHANCED FEATURES (4-6 uger)

**Status:** 📋 **PLANLAGT**  
**Start:** Efter Phase 1 er 100% done  
**Prioritet:** P1 - IMPORTANT

**Mål:** Overgå CleanManager med unique features

### Sprint 4: Kvalitetsrapporter (3-4 dage)
```
✅ QualityReport model
✅ Før/efter foto upload
✅ Digital signatur (customer)
✅ Rating system (1-5 stjerner)
✅ Issue tracking
```

### Sprint 5: Mobile PWA (5-7 dage)
```
✅ Progressive Web App setup
✅ Offline support
✅ Push notifications
✅ Add to homescreen
✅ Touch gestures
```

### Sprint 6: SMS Notifications (1-2 dage)
```
✅ Twilio integration
✅ Booking reminders
✅ Invoice sent notifications
✅ Payment received confirmations
```

### Sprint 7: Advanced Analytics (3-4 dage)
```
✅ Revenue forecasting
✅ Customer lifetime value
✅ Churn prediction
✅ Pricing optimization suggestions
```

---

## 🚀 PHASE 3: SCALE & MONETIZE (3-6 måneder)

**Status:** 📋 **FUTURE**  
**Start:** När Phase 2 er done + Jonas er happy  
**Prioritet:** P2 - NICE TO HAVE

**Mål:** Scale til 100+ cleaning companies

### Q1 2026: Native Mobile App
```
✅ React Native setup
✅ iOS app (App Store)
✅ Android app (Google Play)
✅ Offline-first architecture
```

### Q2 2026: Multi-tenant SaaS
```
✅ Tenant isolation
✅ Custom branding per kunde
✅ Subscription management (Stripe)
✅ Self-service onboarding
```

### Q3 2026: Marketplace & Integrations
```
✅ Public API
✅ Zapier integration
✅ Make.com integration
✅ Extension marketplace
```

---

## 💰 FINANCIAL PROJECTIONS

### Cost Savings (Jonas)
```
Year 1: 4,800-7,200 kr saved (vs CleanManager)
Year 2: 4,800-7,200 kr saved
Year 3: 4,800-7,200 kr saved
Year 4: 4,800-7,200 kr saved
Year 5: 4,800-7,200 kr saved

Total 5-year savings: 24,000-36,000 kr
```

### Revenue Potential (Tekup)
```
Year 1 (2025-2026):
- Jonas: Free (beta customer)
- 10 other companies: 200 kr/md × 10 = 2,000 kr/md
- Annual: 24,000 kr

Year 2 (2026-2027):
- 50 companies: 200 kr/md × 50 = 10,000 kr/md
- Annual: 120,000 kr

Year 3 (2027-2028):
- 200 companies: 200 kr/md × 200 = 40,000 kr/md
- Annual: 480,000 kr

5-year projection: 624,000 kr revenue
```

---

## 📊 SUCCESS METRICS

### Phase 1 (Critical Gaps)
```
✅ 100% feature parity med CleanManager core
✅ 0 bugs in production
✅ <24 timer onboarding for ny user
✅ 50%+ tidsbesparelse vs manual processer
✅ Jonas er 100% tilfreds
```

### Phase 2 (Enhanced Features)
```
✅ 5 unique features CleanManager ikke har
✅ 95%+ customer satisfaction score
✅ <1% churn rate
✅ 10+ andre cleaning companies onboarded
```

### Phase 3 (Scale)
```
✅ 100+ betalende kunder
✅ 500K+ kr annual revenue
✅ <2% churn
✅ 4.5+ star rating på app stores
```

---

## 🎯 DECISION TIME

**Jonas, hvad vil du have Tekup skal fokusere på?**

### Option A: START PHASE 1 NU (ANBEFALET)
```
Timeline: 3-4 uger
Result: 100% CleanManager replacement
Cost: Gratis (Tekup udvikler)
Risk: Low (clear requirements)

Action Items:
1. Godkend roadmap ✅
2. Tekup starter Sprint 1 (Plans) 🚀
3. Weekly check-ins
4. Beta test i uge 4

ROI: 400-600 kr/md savings starting uge 5
```

### Option B: FORTSÆT MED CURRENT STATE
```
Timeline: N/A
Result: Keep using CleanManager features manually
Cost: Continue paying 400-600 kr/md
Risk: None

Konsekvens:
- No CleanManager replacement
- Continue manual workflows
- Higher operating costs
```

### Option C: CUSTOM PRIORITERING
```
Timeline: Depends on choices
Result: Cherry-pick features
Cost: Gratis (Tekup udvikler)
Risk: May not fully replace CleanManager

Example:
- Start med kun Fakturering (highest pain point)?
- Skip Time Tracking (manual is ok)?
- Add SMS før Quality Reports?
```

---

**Anbefaling:** START PHASE 1 NU 🚀

**Rationale:**
1. Vi har solid foundation (73% done)
2. Phase 1 tager kun 3-4 uger
3. Immediate ROI (stop CleanManager subscription)
4. Jonas kan beta test på rigtige jobs
5. Prepares for scaling til andre kunder

**Next Step:** Jonas siger "GO" → Tekup starter Sprint 1 mandag! 💪
