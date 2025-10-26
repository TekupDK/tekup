# 🎯 RenOS Komplet System Specifikation
\n\n
\n\n**Version:** 1.0
**Dato:** 2. oktober 2025
**Formål:** Erstatte ALLE eksterne systemer med RenOS
\n\n
---

\n\n## 🌟 VISION
\n\n
\n\n**RenOS skal være det ENESTE system du bruger for:**
\n\n- 📧 Email management (erstatter Gmail + Shortwave)
\n\n- 📅 Calendar management (erstatter Google Calendar)
\n\n- 👥 Customer relationship management (erstatter spreadsheets)
\n\n- 💰 Quote generation (erstatter manuel proces)
\n\n- 📊 Business intelligence (nyt!)
\n\n- 🏢 Multi-tenant support (nyt!)
\n\n
---

\n\n## 📊 HVAD DU GØR I DAG (Manuel Proces)
\n\n
\n\n### Daglig Workflow - Nuværende Situation
\n\n
\n\n**Morgen (30-60 min):**
\n\n1. Åbn Shortwave → se "Leads" label
\n\n2. For hver lead (5-10 min):
   - Læs email manuelt
\n\n   - Søg "from:kunde@email.com" for duplicate
\n\n   - Åbn Google Calendar
\n\n   - Find 5 ledige tider manuelt
\n\n   - Beregn pris i hovedet
\n\n   - Skriv tilbud fra bunden
\n\n   - Send email
\n\n   - Flyt label manuelt
\n\n
**Problem:** 
\n\n- 5-10 min × 15 leads = 75-150 min dagligt
\n\n- Menneskelige fejl (glemmer duplicate check)
\n\n- Ingen læring fra historik
\n\n- Ingen automatisk status opdatering
\n\n
---

\n\n## 🚀 HVORDAN RENOS ÆNDRER DET
\n\n
\n\n### Ny Workflow - RenOS Automatisk
\n\n
\n\n**Morgen (5-15 min):**
\n\n1. Åbn RenOS dashboard → se "Leads" tab
\n\n2. For hver lead (30 sek - 2 min):
\n\n   - RenOS har allerede parsed lead automatisk
\n\n   - RenOS har tjekket duplicate (ALERT hvis findes)
\n\n   - RenOS har fundet 5 ledige tider
\n\n   - RenOS har beregnet pris automatisk
\n\n   - RenOS har genereret tilbud draft
\n\n   - Du godkender eller redigerer
\n\n   - RenOS sender + opdaterer status automatisk
\n\n
**Resultat:**
\n\n- 30 sek × 15 leads = 7.5 min dagligt
\n\n- Ingen menneskelige fejl (automatic duplicate check)
\n\n- Lærer fra historiske bookings
\n\n- Automatisk status progression
\n\n
**Tidsbesparelse:** 75-150 min → 7.5 min = **90% mindre tid!**
\n\n
---

\n\n## 🔧 RENOS CORE FUNKTIONER
\n\n
\n\n### 1. Email Management System
\n\n
\n\n**Erstatter:** Gmail + Shortwave
\n\n
**Features:**
\n\n- ✅ Komplet inbox i RenOS interface
\n\n- ✅ Real-time email sync via Gmail API
\n\n- ✅ Visual label management med drag-drop
\n\n- ✅ Email search med filters: `label:Leads older:7d`
\n\n- ✅ Thread view med fuld historik
\n\n- ✅ Email composition med templates
\n\n- ✅ Automatic label progression (Leads → Venter på svar → I kalender)
\n\n
**API Funktioner:**
\n\n```typescript
// Email søgning
search_emails(filters: {
  label?: string,
  from?: string,
  to?: string,
  older?: string,
  newer?: string
})

// Læs email thread
get_email_thread(threadId: string)

// Send email
send_email(to: string, subject: string, body: string, inReplyTo?: string)

// Label management
update_email_labels(messageId: string, add: string[], remove: string[])
\n\n```

---

\n\n### 2. Intelligent Duplicate Detection
\n\n
\n\n**Erstatter:** Manuel søgning i Shortwave
\n\n
**Features:**
\n\n- ✅ Automatic duplicate check ved ALLE nye leads
\n\n- ✅ Søger i både database + Gmail
\n\n- ✅ Intelligent rules:
\n\n  - Sidste kontakt < 7 dage → HARD STOP
\n\n  - Sidste kontakt 7-30 dage → WARNING (kan override)
\n\n  - Sidste kontakt > 30 dage → OK (ny quote tilladt)
\n\n- ✅ Viser fuld kunde historik ved duplicate
\n\n
**API Funktion:**
\n\n```typescript
check_customer_duplicate(email: string): Promise<{
  isDuplicate: boolean,
  customer?: Customer,
  lastContact?: Date,
  lastQuote?: Quote,
  recommendation: "STOP" | "WARN" | "OK"
}>
\n\n```

**Eksempel:**
\n\n```
Lead kommer ind fra: kunde@example.com

RenOS søger automatisk:
✓ Database: Findes denne email? → JA
✓ Sidste kontakt: 3 dage siden
✓ Status: "Venter på svar"

RenOS viser:
🛑 STOP! Du har allerede sendt tilbud til denne kunde d. 29. sep
📧 Sidste email: "Tak for din interesse i flytterengøring..."
🕐 Intet svar modtaget endnu

Anbefaling: VENT med opfølgning
\n\n```

---

\n\n### 3. Lead Information Extraction (AI)
\n\n
\n\n**Erstatter:** Manuel læsning og fortolkning
\n\n
**Features:**
\n\n- ✅ Automatisk parsing af lead emails
\n\n- ✅ AI extraction af nøgleinformation:
\n\n  - Bolig størrelse: "150 m²", "150m2", "150 kvadratmeter" → 150
\n\n  - Antal rum: "5 rum", "5 værelser", "3 bedrooms" → 5
\n\n  - Service type: "fast rengøring", "flytterengøring" → klassificeret
\n\n  - Dato: "omkring 20. oktober", "hurtigst muligt" → parsed
\n\n  - Adresse: "Vejnavn 123, 8000 Aarhus C" → structured
\n\n- ✅ Confidence scoring (hvis usikker → flag til manuel review)
\n\n
**API Funktion:**
\n\n```typescript
parse_lead_email(emailBody: string): Promise<{
  customerName: string,
  email: string,
  phone?: string,
  propertySize?: number,
  rooms?: number,
  serviceType: "Fast Rengøring" | "Flytterengøring" | "Hovedrengøring",
  preferredDate?: Date,
  address?: string,
  specialRequests?: string[],
  confidence: {
    overall: number,
    fields: Record<string, number>
  }
}>
\n\n```

---

\n\n### 4. Calendar Intelligence
\n\n
\n\n**Erstatter:** Manuel Google Calendar kig
\n\n
**Features:**
\n\n- ✅ Intelligent slot finder
\n\n- ✅ Conflict detection (ingen double-booking!)
\n\n- ✅ Smart preferences:
\n\n  - Foretrækker: 08:00, 09:00, 10:00, 11:00, 13:00, 14:00
\n\n  - Working hours: 08:00-17:00 (mandag-fredag), 08:00-15:00 (lørdag)
\n\n  - Undgår: Søndage (medmindre flytterengøring emergency)
\n\n- ✅ Route optimization:
\n\n  - Hvis booking i Hjortshøj kl. 08:00-10:00
\n\n  - Foreslår næste i Aarhus C kl. 11:00 (30 min transport)
\n\n  - Undgår at foreslå Ry kl. 10:30 (ville kræve 50 min kørsel)
\n\n- ✅ Buffer management:
\n\n  - Minimum 1 time mellem jobs (transport + forberedelse)
\n\n  - Hvis job er 4 timer, find ikke en 4.5 time gap (for stramt!)
\n\n
**API Funktion:**
\n\n```typescript
find_available_slots(params: {
  startDate: Date,
  duration: number, // minutes
  count: number,
  preferredTimes?: string[], // ["08:00", "10:00"]
  excludeDays?: string[] // ["Sunday"]
}): Promise<TimeSlot[]>

check_time_slot_availability(slot: TimeSlot): Promise<{
  available: boolean,
  conflicts?: CalendarEvent[]
}>
\n\n```

---

\n\n### 5. Smart Price Estimation Engine
\n\n
\n\n**Erstatter:** Mental beregning
\n\n
**Features:**
\n\n- ✅ Database af historiske bookings
\n\n- ✅ Machine learning fra faktisk tidsforbrug:
\n\n  - "Du estimerede 3 timer, faktisk tog det 4 timer"
\n\n  - Næste gang 150m² villa → brug 4 timer estimat
\n\n- ✅ Service type variation:
\n\n  - Fast rengøring første gang: 3-4 timer for 100-150m²
\n\n  - Vedligeholdelse (2+ gang): 2-3 timer
\n\n  - Flytterengøring: 8-12 timer for 100m²
\n\n- ✅ Kompleksitet faktorer:
\n\n  - Ekstra vinduer: +0.5-1 time
\n\n  - Ovn rengøring: +1 time
\n\n  - Kælder: +1-2 timer
\n\n- ✅ Pris range beregning: min-max baseret på estimat ± 20%
\n\n
**API Funktion:**
\n\n```typescript
calculate_price_estimate(params: {
  propertySize: number,
  serviceType: string,
  rooms?: number,
  specialRequests?: string[],
  isFirstTime: boolean
}): Promise<{
  estimatedHours: number,
  workers: number,
  totalLaborHours: number, // hours × workers
  priceMin: number,
  priceMax: number,
  breakdown: {
    baseTime: number,
    adjustments: Array<{reason: string, hours: number}>
  }
}>
\n\n```

---

\n\n### 6. AI-Powered Quote Generation
\n\n
\n\n**Erstatter:** Manuel skrivning fra bunden
\n\n
**Features:**
\n\n- ✅ Template-baseret med personalisering
\n\n- ✅ Følger dit standardformat (emoji, struktur, tone)
\n\n- ✅ Variation baseret på lead kilde:
\n\n  - Rengøring.nu → mere formel
\n\n  - Direkte henvendelse → mere personlig
\n\n- ✅ Inkluderer automatisk:
\n\n  - Konkrete ledige tider fra kalender
\n\n  - Pris estimat med range
\n\n  - Service beskrivelse
\n\n  - Call-to-action
\n\n- ✅ Draft for godkendelse (du kan redigere før sending)
\n\n
**Quote Template:**
\n\n```
Hej [Navn],

Tak for din henvendelse via [kilde] 🌿

Vi kan hjælpe med [service type] af din [boligtype] på ca. [størrelse] m² 
på [adresse].

📏 Bolig: [størrelse] m² med [rum] rum
👥 Medarbejdere: [antal] personer
⏱️ Estimeret tid: [timer] timer på stedet = [arbejdstimer] arbejdstimer total
💰 Pris: 349kr/time/person = ca. [min]-[max] kr inkl. moms

📅 Ledige tider de næste 2 uger:
\n\n1. [Dag] d. [dato] kl. [tid]
\n\n2. [Dag] d. [dato] kl. [tid]
\n\n3. [Dag] d. [dato] kl. [tid]
\n\n4. [Dag] d. [dato] kl. [tid]
\n\n5. [Dag] d. [dato] kl. [tid]

💡 Du betaler kun for det faktiske tidsforbrug
📞 Vi ringer ved eventuel overskridelse på +1 time

Hvilken tid passer bedst for dig?

Med venlig hilsen,
Jonas fra Rendetalje.dk
\n\n```

---

\n\n### 7. Conversation Intelligence
\n\n
\n\n**Erstatter:** Manuel læsning og fortolkning af kundesvar
\n\n
**Features:**
\n\n- ✅ Intent classification:
\n\n  - "Fredag kl. 10 passer fint" → BOOKING_ACCEPTANCE
\n\n  - "Har I tid onsdag i stedet?" → REQUEST_DIFFERENT_TIME
\n\n  - "Det er for dyrt" → PRICE_NEGOTIATION
\n\n  - "Omfatter det vinduespolering?" → QUESTION
\n\n  - "Jeg har fundet en anden" → DECLINE
\n\n- ✅ Automatic action forslag:
\n\n  - BOOKING_ACCEPTANCE → Opret kalenderevent + send bekræftelse
\n\n  - REQUEST_DIFFERENT_TIME → Find nye tider + send alternativ
\n\n  - PRICE_NEGOTIATION → Foreslå alternativer (længere interval, mindre omfattende)
\n\n  - QUESTION → Generer svar fra knowledge base
\n\n  - DECLINE → Opdater status til "Lost" + log reason
\n\n
**API Funktion:**
\n\n```typescript
analyze_customer_reply(emailBody: string): Promise<{
  intent: "BOOKING_ACCEPTANCE" | "REQUEST_DIFFERENT_TIME" | "PRICE_NEGOTIATION" | "QUESTION" | "DECLINE" | "CANCELLATION",
  confidence: number,
  extractedData: {
    selectedDate?: Date,
    selectedTime?: string,
    pricePoint?: number,
    question?: string,
    declineReason?: string
  },
  suggestedAction: string
}>
\n\n```

---

\n\n### 8. Automatic Calendar Event Creation
\n\n
\n\n**Erstatter:** Manuel Google Calendar oprettelse
\n\n
**Features:**
\n\n- ✅ Auto-formatting med dit standard format:
\n\n  ```
  🏠 FAST RENGØRING #3 - Nadia Møllebjerg
\n\n  ```
\n\n- ✅ Intelligent numbering:
\n\n  - Tæller tidligere bookings for denne kunde
\n\n  - Første booking → #1, anden → #2, etc.
\n\n- ✅ Rich description med komplet info:
\n\n  ```
  Kunde: Nadia Møllebjerg
  Kontakt: nadia@example.com, +45 12 34 56 78
  Adresse: Hovedgade 123, 8000 Aarhus C
  
  📊 RENGØRINGSHISTORIK:
  • 1. rengøring: 27/7 - 3.5t (1.221 kr)
\n\n  • 2. rengøring: 11/8 - 3.0t (1.047 kr)
\n\n  
  ⏱️ ESTIMAT DENNE GANG:
  • Medarbejdere: 2 personer
  • Tid: 3-3.5 timer
  • Pris: 1.047-1.221 kr inkl. moms
  
  📋 OPGAVEN OMFATTER:
  • Almindelig vedligeholdelsesrengøring
  • 150m² villa, 5 rum
  
  🔑 ADGANG:
  • Nøgle under måtte
  
  Thread reference: [RenOS kunde link]
  ```
\n\n- ✅ Automatic attendees (kundens email)
\n\n- ✅ Reminders:
\n\n  - Email: 24 timer før + 2 timer før
\n\n  - Popup: 30 min før
\n\n
---

\n\n### 9. Customer Relationship Memory
\n\n
\n\n**Erstatter:** Hukommelse + gamle emails
\n\n
**Features:**
\n\n- ✅ Komplet kunde profil med historik:
\n\n  - Alle bookings med datoer, priser, tidsforbrug
\n\n  - Alle tilbud (sendt, accepteret, declined)
\n\n  - Alle emails og kommunikation
\n\n  - Specielle noter (nøgle placering, preferencer, etc.)
\n\n- ✅ Quick stats:
\n\n  - Lifetime value
\n\n  - Total bookings
\n\n  - Gennemsnitlig booking værdi
\n\n  - Satisfaction score
\n\n- ✅ Timeline view (chronological historik)
\n\n- ✅ Quick access ved ny kommunikation:
\n\n  - "Nyt email fra Nadia" → RenOS viser automatisk hendes profil
\n\n
**Customer Profile Eksempel:**
\n\n```
👤 Nadia Møllebjerg
📧 nadia@example.com
📱 +45 12 34 56 78
📍 Hovedgade 123, 8680 Ry

💰 Lifetime Value: 4.200 kr
📅 Total Bookings: 4
⭐ Satisfaction: Høj

📊 Booking Historie:
• 27/7: Fast rengøring #1 - 3.5t (1.221 kr) ✓
\n\n• 11/8: Fast rengøring #2 - 3.0t (1.047 kr) ✓
\n\n• 25/8: Fast rengøring #3 - 3.5t (1.221 kr) ✓
\n\n• 11/9: Fast rengøring #4 - 3.0t (1.047 kr) ✓
\n\n
📌 Næste: 2/10 kl. 11:00 (Fast rengøring #5)

🔑 Special Noter:
• Altid torsdage kl. 11:00
• Nøgle under måtte
• 35 min kørsel fra Aarhus
• Adresse fejl første gang (Skanderborg→Ry)
\n\n```

---

\n\n### 10. Automatic Status Progression
\n\n
\n\n**Erstatter:** Manuel label flytning
\n\n
**Features:**
\n\n- ✅ Trigger-baseret automatisk status opdatering:
\n\n  ```
  Leads → Needs Reply → Venter på svar → I kalender → Finance → Afsluttet
  ```
\n\n- ✅ Triggers:
\n\n  - Nyt lead modtaget → "Leads"
\n\n  - Tilbud draft godkendt → "Needs Reply"
\n\n  - Tilbud sendt → "Venter på svar"
\n\n  - Kunde accepterer → "I kalender"
\n\n  - Booking completed → "Finance"
\n\n  - Faktura betalt → "Afsluttet"
\n\n- ✅ Automatic reminders:
\n\n  - 7 dage efter tilbud uden svar → Generer opfølgnings email
\n\n  - 24 timer før booking → Send reminder til kunde
\n\n  - 2 timer før booking → Send reminder til dig
\n\n  - Faktura forfalden → Send venlig reminder
\n\n
---

\n\n### 11. Business Intelligence Dashboard
\n\n
\n\n**Erstatter:** Ingen (nyt!)
\n\n
**Features:**
\n\n- ✅ Real-time KPI tracking:
\n\n  - Total revenue (denne måned, sidste måned, i år)
\n\n  - Number of leads, quotes, bookings
\n\n  - Conversion rates per stage
\n\n  - Average booking value
\n\n- ✅ Lead source analytics:
\n\n  - Rengøring.nu: 45 leads, 12 bookings = 26% conversion
\n\n  - Rengøring Aarhus: 38 leads, 18 bookings = 47% conversion
\n\n  - → Konklusion: Fokuser på Rengøring Aarhus!
\n\n- ✅ Revenue forecasting:
\n\n  - Bookings i kalenderen for næste måned
\n\n  - Forventet indtjening baseret på historiske priser
\n\n- ✅ Customer lifetime value analysis:
\n\n  - Fast rengøring kunder: gennemsnit 8.500 kr LTV
\n\n  - Engangs flytterengøring: gennemsnit 2.500 kr LTV
\n\n  - → Fokuser på at få fast rengøring kunder!
\n\n- ✅ Time estimation accuracy:
\n\n  - "Du estimerede 3 timer, faktisk tog det 4 timer"
\n\n  - Læring: Næste gang 150m² villa → brug 4 timer estimat
\n\n
---

\n\n### 12. Multi-Tenant Architecture
\n\n
\n\n**Erstatter:** Ingen (nyt!)
\n\n
**Features:**
\n\n- ✅ Flere rengøringsfirmaer på samme platform:
\n\n  - Rendetalje.dk (349 kr/time)
\n\n  - RengoCompany ApS (399 kr/time)
\n\n  - CleanMasters (429 kr/time)
\n\n- ✅ Per-tenant settings:
\n\n  - Egen timepris
\n\n  - Egen email signature
\n\n  - Egne labels/stages
\n\n  - Egen Billy.dk integration
\n\n  - Egen Google Calendar
\n\n  - Eget branding (logo, farver)
\n\n- ✅ Data isolation:
\n\n  - Tenant A kan ALDRIG se Tenant B's kunder
\n\n  - Komplet data separation
\n\n  - Deler samme codebase og infrastructure
\n\n- ✅ White-label:
\n\n  - Hver tenant ser deres eget brand
\n\n  - Email templates med tenant branding
\n\n  - Dashboard med tenant logo
\n\n
---

\n\n## 🚀 IMPLEMENTATION ROADMAP
\n\n
\n\n### SPRINT 1: Core RenOS Platform (2 uger)
\n\n
\n\n**Mål:** RenOS erstatter Gmail, Shortwave, Google Calendar
\n\n
**Deliverables:**
\n\n1. Email Management System
   - Gmail API integration
\n\n   - Inbox UI med label filtering
\n\n   - Email search med advanced filters
\n\n   - Thread view med fuld historik
\n\n   - Email composition med templates
\n\n
\n\n2. Label Management
   - Visual label UI (drag-drop)
\n\n   - Automatic label creation
\n\n   - Label progression automation
\n\n   - Bulk label operations
\n\n
\n\n3. Calendar System
   - Google Calendar sync
\n\n   - Visual week/day view
\n\n   - Conflict detection
\n\n   - Available slots finder
\n\n   - Event creation med auto-formatting
\n\n
\n\n4. Customer Database
   - Customer CRUD operations
\n\n   - Full communication history
\n\n   - Timeline view
\n\n   - Quick stats
\n\n
**Success Criteria:**
\n\n- ✅ Kan håndtere alle emails uden at åbne Gmail
\n\n- ✅ Kan organisere med labels visuelt uden Shortwave
\n\n- ✅ Kan finde ledige tider uden at åbne Google Calendar
\n\n- ✅ Kan track kunder komplet i RenOS
\n\n
---

\n\n### SPRINT 2: Advanced Automation (2 uger)
\n\n
\n\n**Mål:** RenOS automatiserer manuel arbejde
\n\n
**Deliverables:**
\n\n1. Duplicate Detection
   - Automatic check ved nye leads
\n\n   - Database + Gmail search
\n\n   - Intelligent rules (7d, 30d)
\n\n   - Warning system med historik
\n\n
\n\n2. Lead Information Extraction
   - AI parsing af email body
\n\n   - Auto-extraction af size, rooms, service type, date, address
\n\n   - Confidence scoring
\n\n   - Manual review for low confidence
\n\n
\n\n3. Smart Price Estimation
   - Historical booking analysis
\n\n   - Machine learning fra faktisk tidsforbrug
\n\n   - Complexity factor beregning
\n\n   - Price range generation
\n\n
\n\n4. Quote Generation
   - Template-based med personalization
\n\n   - Lead source variation
\n\n   - Automatic inclusion af tider + pris
\n\n   - Draft approval workflow
\n\n
**Success Criteria:**
\n\n- ✅ Duplicate check forhindrer dobbelt-tilbud 100%
\n\n- ✅ Lead parsing korrekt i 90%+ af tilfælde
\n\n- ✅ Pris estimater inden for ±15% af faktisk
\n\n- ✅ Quote generation tager < 30 sekunder
\n\n
---

\n\n### SPRINT 3: Conversation Intelligence (2 uger)
\n\n
\n\n**Mål:** RenOS forstår og reagerer på kundesvar
\n\n
**Deliverables:**
\n\n1. Intent Classification
   - AI model trænet på dine emails
\n\n   - 6 intent types (booking, reschedule, price, question, decline, cancel)
\n\n   - Confidence scoring
\n\n
\n\n2. Automatic Action Suggestions
   - Foreslå næste handling baseret på intent
\n\n   - Generate response drafts
\n\n   - Extract relevant data (dates, times, prices)
\n\n
\n\n3. Automatic Booking Creation
   - Detect booking acceptance
\n\n   - Create calendar event automatisk
\n\n   - Generate confirmation email
\n\n   - Update customer status
\n\n
\n\n4. Status Progression
   - Trigger-based status updates
\n\n   - Automatic reminder scheduling
\n\n   - Lost lead detection (ingen svar efter 3 opfølgninger)
\n\n
**Success Criteria:**
\n\n- ✅ Intent classification accuracy > 90%
\n\n- ✅ Automatic booking creation uden fejl
\n\n- ✅ Status progression 100% automatisk
\n\n- ✅ Reminders sendes til tiden
\n\n
---

\n\n### SPRINT 4: Business Intelligence (2 uger)
\n\n
\n\n**Mål:** RenOS giver komplet business indsigt
\n\n
**Deliverables:**
\n\n1. Real-time Analytics Dashboard
   - Revenue tracking (måned, år)
\n\n   - Conversion funnel visualization
\n\n   - Lead source performance
\n\n   - Top customers by revenue
\n\n
\n\n2. Customer Lifetime Value
   - Automatic LTV calculation
\n\n   - Segmentation (fast vs engangskunder)
\n\n   - Churn prediction
\n\n   - Retention metrics
\n\n
\n\n3. Revenue Forecasting
   - Bookings i kalenderen → forventet indtjening
\n\n   - Seasonal trend analysis
\n\n   - Growth projections
\n\n
\n\n4. Time Estimation Learning
   - Track estimate vs faktisk tidsforbrug
\n\n   - Automatic adjustment af future estimates
\n\n   - Service type learning
\n\n   - Property size correlations
\n\n
**Success Criteria:**
\n\n- ✅ Dashboard viser real-time KPI'er
\n\n- ✅ LTV beregnes automatisk ved hver booking
\n\n- ✅ Revenue forecast accuracy > 85%
\n\n- ✅ Time estimates forbedres over tid
\n\n
---

\n\n### SPRINT 5: Multi-Tenant Platform (3 uger)
\n\n
\n\n**Mål:** RenOS understøtter flere firmaer
\n\n
**Deliverables:**
\n\n1. Tenant Database Schema
   - Tenant model med settings
\n\n   - Customer/Lead/Booking isolation
\n\n   - Tenant-specific configurations
\n\n
\n\n2. Tenant Administration
   - Tenant CRUD operations
\n\n   - Settings management UI
\n\n   - Branding customization
\n\n   - Integration setup (Gmail, Calendar, Billy.dk)
\n\n
\n\n3. Data Isolation & Security
   - Row-level security
\n\n   - API middleware for tenant filtering
\n\n   - Cross-tenant access prevention
\n\n   - Audit logging
\n\n
\n\n4. White-Label Functionality
   - Tenant-specific email templates
\n\n   - Branded dashboard
\n\n   - Custom domain support (nice-to-have)
\n\n
**Success Criteria:**
\n\n- ✅ Kan oprette og administrere flere tenants
\n\n- ✅ Komplet data isolation (test med 2+ tenants)
\n\n- ✅ Branding customization fungerer
\n\n- ✅ Ingen performance degradation med 10+ tenants
\n\n
---

\n\n## 📊 FEATURE SAMMENLIGNING
\n\n
\n\n| Feature | Nuværende (Manual) | RenOS v1.0 | Forbedring |
|---------|-------------------|------------|------------|
| **Lead processing tid** | 5-10 min/lead | 30 sek/lead | 90-95% |
\n\n| **Duplicate detection** | Manuel (ofte glemt) | 100% automatisk | ∞ |
\n\n| **Kalender søgning** | 2-5 min/booking | < 10 sek | 95% |
\n\n| **Quote generation** | 3-5 min/quote | 30 sek | 90% |
\n\n| **Status opdatering** | Manuel | Automatisk | 100% |
\n\n| **Business indsigt** | Ingen | Real-time dashboard | ∞ |
\n\n| **Customer historik** | Spredt i emails | Centraliseret profil | ∞ |
\n\n| **Opfølgning** | Manuelt husket | Automatiske reminders | ∞ |
\n\n
---

\n\n## 💰 ROI BEREGNING
\n\n
\n\n### Nuværende Tidsforbrug (Per Dag)
\n\n- Lead processing: 15 leads × 7 min = **105 min**
\n\n- Duplicate check (glemt 30%): 5 leads × 10 min recovery = **50 min**
\n\n- Kalender booking: 5 bookings × 3 min = **15 min**
\n\n- Status opdateringer: 10 opdateringer × 1 min = **10 min**
\n\n- **Total: 180 min = 3 timer/dag**
\n\n
\n\n### Med RenOS (Per Dag)
\n\n- Lead processing: 15 leads × 30 sek = **7.5 min**
\n\n- Duplicate check: 0 min (automatisk) = **0 min**
\n\n- Kalender booking: 5 bookings × 30 sek = **2.5 min**
\n\n- Status opdateringer: 0 min (automatisk) = **0 min**
\n\n- **Total: 10 min/dag**
\n\n
\n\n### Tidsbesparelse
\n\n- **170 min/dag = 2.8 timer/dag**
\n\n- **14 timer/uge**
\n\n- **56 timer/måned**
\n\n
\n\n### Værdisætning
\n\nHvis din tid er værd 300 kr/time:
\n\n- 56 timer × 300 kr = **16.800 kr/måned**
\n\n- **201.600 kr/år**
\n\n
---

\n\n## 🎯 KONKLUSION
\n\n
\n\n**RenOS erstatter:**
\n\n1. ❌ Shortwave → ✅ RenOS Email Management
\n\n2. ❌ Gmail (delvist) → ✅ RenOS Email System
\n\n3. ❌ Google Calendar (manuel brug) → ✅ RenOS Calendar Intelligence
\n\n4. ❌ Spreadsheets/Noter → ✅ RenOS Customer Database
\n\n5. ❌ Mental hukommelse → ✅ RenOS Customer Profiles

**RenOS tilføjer (nyt):**
\n\n- ✅ Automatic duplicate detection
\n\n- ✅ AI lead parsing
\n\n- ✅ Smart price estimation
\n\n- ✅ Conversation intelligence
\n\n- ✅ Business intelligence dashboard
\n\n- ✅ Multi-tenant support
\n\n
**Resultat:**
\n\n- **90-95% tidsbesparelse** på administrativt arbejde
\n\n- **0% duplicate fejl** (vs 30% før)
\n\n- **Komplet business indsigt** (vs ingen før)
\n\n- **Skalerbart** til flere firmaer på samme platform
\n\n
---

**Version:** 1.0
**Sidst opdateret:** 2. oktober 2025
**Næste review:** Efter SPRINT 1 completion
\n\n







