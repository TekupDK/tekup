# 🎯 Historisk Data Integration - Dansk Resumé\n\n\n\n**Dato**: 2. oktober 2025, 23:45 CET  
**Status**: Analyse færdig - Klar til implementering  
**Dokumentation**: Se `HISTORICAL_DATA_INTEGRATION_ANALYSIS.md` for fuld teknisk detaljer

---
\n\n## 📊 Hvad Skal Integreres?\n\n\n\n### 1. Historiske Leads fra Leadmail.no ✅ KLAR\n\n\n\n**Status**: Tool allerede implementeret i `src/tools/importHistoricalLeads.ts`

**Hvad det gør**:
\n\n- Henter ALLE Leadmail.no emails fra Gmail siden juli 2024\n\n- Parser automatisk kunde information (navn, email, telefon, adresse, m²)\n\n- Opretter kunder og leads i databasen\n\n- Undgår duplikater\n\n- Detaljeret progress rapportering\n\n
**Sådan kører du det** (lige om lidt):\n\n\n\n```powershell
npm run leads:import\n\n```

**Forventet resultat**: ~100-200 historiske leads tilføjet til systemet

---
\n\n### 2. Faste Kunder med Gentagende Rengøring ⚠️ SKAL IMPLEMENTERES\n\n\n\n**Status**: Basis infrastruktur findes, men recurring booking system mangler

**Hvad vi har**:
\n\n- ✅ Customer og Booking modeller i database\n\n- ✅ Google Calendar integration (create, update, delete events)\n\n- ✅ Email sending til kunder\n\n- ✅ Conflict detection (undgår dobbeltbooking)\n\n
**Hvad vi mangler**:
\n\n- ❌ Recurring booking fields i database schema\n\n- ❌ Service til at oprette gentagende bookings (ugentlig, hver 14. dag, månedlig)\n\n- ❌ Automatisk oprettelse af alle fremtidige bookings\n\n- ❌ CLI tool til at administrere faste kunder\n\n
**Eksempel use case**:
> Lars Nielsen har ugentlig rengøring hver torsdag kl. 10:00.  
> System skal automatisk oprette 52 bookings for næste år + Google Calendar events\n\n
---
\n\n### 3. Sammenspil RenOS ↔ Google Calendar ↔ Gmail ✅ GODT, MEN KAN FORBEDRES\n\n\n\n**Nuværende flow**:
\n\n```
Lead kommer ind (Leadmail.no)
    ↓
Gemmes i RenOS database
    ↓
Administrator laver tilbud
    ↓
Tilbud accepteret → Booking oprettes
    ↓
    ├─→ Google Calendar event oprettes automatisk
    └─→ Bekræftelses-email sendes til kunde\n\n```

**Hvad der virker godt**:
\n\n- ✅ Booking → Calendar sync (one-way)\n\n- ✅ Email notifications\n\n- ✅ Thread-aware emails (svarer i samme tråd)\n\n- ✅ Dry-run mode (test uden at sende)\n\n
**Hvad der kan forbedres**:
\n\n- ⚠️ Calendar → RenOS sync (mangler webhook for ændringer i Calendar)\n\n- ⚠️ Automatisk svar på nye leads (kræver manuel godkendelse lige nu)\n\n
---
\n\n## 🚀 Implementation Roadmap\n\n\n\n### Fase 1: Import Historiske Leads (NU - 30 min) 🟢\n\n\n\n**Steps**:
\n\n1. ✅ Script tilføjet til package.json (`leads:import`)\n\n2. Kør import kommando\n\n3. Verificer resultater i dashboard

**Kommandoer**:
\n\n```powershell\n\n# Kør import\n\nnpm run leads:import\n\n\n\n# Verificer\n\nnpm run customer:list\n\nnpm run customer:stats
npm run db:studio  # Visuelt database explorer\n\n```\n\n
**Expected output**:
\n\n```
🔄 Starting Historical Lead Import
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Fetching emails from 01-07-2024 to 02-10-2025...
✅ Total emails fetched: 127

✅ Imported: Lars Nielsen - Privatrengøring\n\n✅ Imported: Maria Andersen - Erhverv\n\n...

📊 Import Summary:
   ✅ Successfully imported: 127 leads
   ⏭️  Skipped: 23
   ❌ Errors: 0\n\n```

---
\n\n### Fase 2: Database Schema for Recurring (1 time) 🟡\n\n\n\n**Hvad skal tilføjes til `prisma/schema.prisma`**:
\n\n```prisma
model Booking {
  // Eksisterende fields...
  
  // NYE recurring fields:
  isRecurring        Boolean   @default(false)
  recurringPattern   String?   // "weekly", "biweekly", "monthly"
  recurringInterval  Int?      // Hver X uger/måneder
  recurringDayOfWeek Int?      // 0-6 (Søndag-Lørdag)
  recurringEndDate   DateTime? // Hvornår stopper gentagelser
  parentBookingId    String?   // Link til original recurring
  
  parentBooking      Booking?  @relation("RecurringBookings", ...)
  childBookings      Booking[] @relation("RecurringBookings")
}\n\n```

**Migration**:
\n\n```powershell
npx prisma migrate dev --name add_recurring_bookings\n\n```

---
\n\n### Fase 3: Recurring Booking Service (3-4 timer) 🔴\n\n\n\n**Ny fil**: `src/services/recurringBookingService.ts`

**Funktioner**:
\n\n- `createRecurringBooking()` - Opret gentagende serie\n\n- `updateRecurringBooking()` - Opdater alle fremtidige\n\n- `cancelRecurringBooking()` - Annuller fra dato\n\n- `calculateRecurringDates()` - Beregn alle datoer\n\n
**Ny fil**: `src/tools/recurringBookingTool.ts`

**CLI kommandoer** (efter implementering):\n\n\n\n```powershell\n\n# Opret ugentlig rengøring for kunde\n\nnpm run recurring:create <customerId> "Privatrengøring" "weekly"\n\n\n\n# List alle recurring bookings\n\nnpm run recurring:list\n\n\n\n# List for specifik kunde\n\nnpm run recurring:list <customerId>\n\n\n\n# Annuller serie\n\nnpm run recurring:cancel <parentId>\n\n```\n\n
---
\n\n### Fase 4: Calendar Webhook (2-3 timer) 🔴\n\n\n\n**Problem**: Hvis nogen ændrer direkte i Google Calendar, opdateres RenOS ikke.

**Løsning**: Google Calendar Push Notifications

**Implementering**:
\n\n- Ny fil: `src/services/calendarWebhook.ts`\n\n- Ny route: `POST /api/calendar/webhook`\n\n- Setup webhook på Render.com domain\n\n
**Effekt**:
\n\n- Ændringer i Google Calendar synkroniseres tilbage til RenOS\n\n- Real-time opdateringer\n\n- Ingen data-inkonsistens\n\n
---
\n\n## 📋 Prioriteret Action Plan\n\n\n\n### I DAG (Højeste prioritet) ⚡\n\n\n\n**1. Importer Historiske Leads**
\n\n```powershell
npm run leads:import\n\n```

**Estimeret tid**: 5-10 minutter (afhængig af antal emails)  
**Impact**: 🔥🔥🔥 Kritisk - Giver fuld lead history  
**Risiko**: 🟢 Lav - Har duplikat-beskyttelse\n\n
---
\n\n### DENNE UGE (Høj prioritet) 📅\n\n\n\n**2. Database Migration**
\n\n```powershell
npx prisma migrate dev --name add_recurring_bookings\n\n```

**Estimeret tid**: 30 minutter  
**Impact**: 🔥🔥 Høj - Nødvendig for recurring bookings  
**Risiko**: 🟡 Medium - Test først lokalt\n\n
**3. Identificer Faste Kunder**
\n\n```powershell\n\n# Find kunder med mange bookings\n\nnpm run customer:stats\n\n\n\n# Kig efter:\n\n# - totalBookings > 5\n\n# - lastContactAt < 30 dage siden\n\n# - status = "active"\n\n```\n\n\n\n**Output eksempel**:
\n\n```
┌──────────────────────────────────────────────────┐
│  Customer: Lars Nielsen                         │
│  Email: lars.nielsen@example.com                │
│  Total Bookings: 15                             │
│  Total Revenue: 26,250 DKK                      │
│  Last Contact: 2 dage siden                     │
│  Status: active                                 │
│                                                  │
│  → FAST KUNDE - Bør have recurring booking     │\n\n└──────────────────────────────────────────────────┘\n\n```

---
\n\n### NÆSTE UGE (Medium prioritet) 📝\n\n\n\n**4. Implementer Recurring Booking Service**

Følg implementation guide i `HISTORICAL_DATA_INTEGRATION_ANALYSIS.md` sektion "Del 2".

**5. Setup Calendar Webhook**

For real-time sync mellem Google Calendar og RenOS.

---
\n\n## 📊 Success Criteria\n\n\n\n**Efter Lead Import** ✅:\n\n\n\n- [ ] Minimum 100 leads i systemet\n\n- [ ] Ingen duplikater (check via `emailThreadId`)\n\n- [ ] Alle customers korrekt linket\n\n- [ ] Dashboard viser historisk data\n\n
**Efter Recurring Implementation** ✅:\n\n\n\n- [ ] Minimum 10 faste kunder med recurring bookings\n\n- [ ] Alle fremtidige bookings i Google Calendar\n\n- [ ] Bekræftelsesmails sendt automatisk\n\n- [ ] Kan administrere via CLI tools\n\n
**Efter Calendar Webhook** ✅:\n\n\n\n- [ ] Ændringer i Calendar reflekteres i RenOS\n\n- [ ] Real-time sync working\n\n- [ ] Ingen data-inkonsistens issues\n\n
---
\n\n## 🎯 Næste Steps - Start NU\n\n\n\n### Step 1: Kør Lead Import\n\n\n\n```powershell\n\n# Kør import\n\nnpm run leads:import\n\n\n\n# Vent 5-10 minutter\n\n\n\n# Verificer\n\nnpm run customer:list\n\n```\n\n\n\n### Step 2: Analysér Resultater\n\n\n\n```powershell\n\n# Se statistikker\n\nnpm run customer:stats\n\n\n\n# Åbn database browser\n\nnpm run db:studio\n\n```\n\n\n\n### Step 3: Identificer Faste Kunder\n\n\n\nKig efter kunder med:
\n\n- Mange bookings (>5)\n\n- Regelmæssig kontakt\n\n- Aktiv status\n\n\n\n### Step 4: Planlæg Recurring Implementation\n\n\n\nSe fuld guide i `HISTORICAL_DATA_INTEGRATION_ANALYSIS.md`

---
\n\n## 💡 Vigtige Noter\n\n\n\n**Dry-Run Mode**:
Systemet har `RUN_MODE=live` i produktion. Test gerne lokalt med `RUN_MODE=dry-run` først.

**Database Backup**:
Før større migrationer, overvej backup:
\n\n```powershell\n\n# Via Neon console\n\n# Eller export via Prisma Studio\n\n```\n\n
**Google API Limits**:
\n\n- Gmail API: 1 billion queries/day\n\n- Calendar API: 1 million queries/day\n\n- RenOS bruger caching for at minimere calls\n\n
**Testing**:
Alle nye features skal testes med:
\n\n```powershell
npm test\n\n```

---
\n\n## 📞 Support & Dokumentation\n\n\n\n**Fuld Teknisk Dokumentation**:
\n\n- `HISTORICAL_DATA_INTEGRATION_ANALYSIS.md` - Komplet implementation guide\n\n- `PRODUCTION_SUCCESS_VERIFICATION.md` - Current production status\n\n- `docs/LEAD_MONITORING.md` - Lead system docs\n\n- `docs/CALENDAR_BOOKING.md` - Calendar integration docs\n\n
**CLI Tools Reference**:
\n\n```powershell
npm run customer:list        # List alle kunder\n\nnpm run customer:stats       # Statistikker\n\nnpm run booking:list         # List bookings\n\nnpm run leads:import         # Import historiske leads (NYT!)\n\n```\n\n
---

**Dokument Oprettet**: 2. oktober 2025, 23:45 CET  
**Status**: Klar til implementering  
**Næste Action**: `npm run leads:import` 🚀
