# 🔄 TekUp AI Assistant - Workflows

Praktiske eksempler på hvordan du bruger AI-assistenten til daglige opgaver.

## 📋 Table of Contents

1. [Invoice Creation](#invoice-creation)
2. [Calendar Management](#calendar-management)
3. [Code Debugging](#code-debugging)
4. [Customer Follow-up](#customer-follow-up)
5. [Morning Routine](#morning-routine)

---

## 💰 Invoice Creation

### Scenario: Create Invoice for Completed Job

**Current workflow (manual):**

1. Open Billy.dk in browser (30 sek)
2. Find customer in dropdown (30 sek)
3. Enter invoice lines (3-5 min)
4. Calculate total (1 min)
5. Save and send (30 sek)
**Total: 6-8 minutes**

**With AI Assistant:**

```
You: "Opret faktura til Michael Roach for 4 timer moving clean fra i går"

AI: 
[Checking customer database...]
[Found: Michael Roach, customer ID: c123]
[Calculating: 4 hours × 349 DKK = 1.396 DKK]
[Creating invoice in Billy.dk...]

✅ Faktura INV-2025-042 oprettet:
- Kunde: Michael Roach
- Service: Moving clean (flytterengøring)
- Timer: 4
- Beløb: 1.396 DKK (inkl. moms)
- Status: Sendt til kunde via email

Faktura link: https://billy.dk/invoices/INV-2025-042
```

**Time: 15-20 seconds**  
**Savings: 7 minutes per invoice**

---

### Variations

**Multiple line items:**
```
You: "Opret faktura til Kunde XYZ:
- 3 timer basic cleaning
- 1 time deep cleaning af køkken
- Tilkørsel 50 km"

AI: [Processes each line]
✅ Faktura oprettet: 1.896 DKK
```

**Recurring invoice:**
```
You: "Opret månedlig faktura til Kunde ABC som sidst"

AI: [Finds previous invoice]
[Copies line items]
✅ Faktura oprettet baseret på sidste måneds service
```

**Bulk invoicing:**
```
You: "Opret fakturaer for alle jobs fra sidste uge"

AI: [Queries RenOS for completed bookings]
[Creates 12 invoices]
✅ 12 fakturaer oprettet:
- Total: 18.542 DKK
- Sendt til kunder
```

---

## 📅 Calendar Management

### Scenario: Check Today's Schedule

**Current workflow:**

1. Open Google Calendar (15 sek)
2. Check RenOS booking system (30 sek)
3. Cross-reference (1 min)
4. Find addresses/codes manually (2 min)
**Total: 4-5 minutes**

**With AI Assistant:**

```
You: "Hvad har jeg i dag?"

AI:
📅 I DAG - Onsdag 15. januar 2025

08:00-10:00 🏠 Mette Nielsen
- Adresse: Sødalvej 4, 8000 Aarhus C
- Service: Basic cleaning (2 timer)
- Nøglekode: 1234
- Note: Hund i hjemmet

10:30-12:00 🏠 Jørn Haagensen  
- Adresse: Sølykken 16, 1. th, 8200 Aarhus N
- Service: Deep cleaning (2 timer)
- Nøglekode: 1745
- Note: TIL AFKLARING - Kontakt ang. ekstra rum

14:00-16:00 🏠 Eoin Moving Clean
- Adresse: [Pending - ring kunde]
- Service: Moving clean (3 timer)
- Nøglekode: -

⚠️ ADVARSEL: Jørn booking har "TIL AFKLARING" - husk at ringe!
```

**Time: 5 seconds**  
**Savings: 4 minutes**

---

### Scenario: Find Available Time Slot

```
You: "Hvornår kan jeg passe Kunde XYZ ind i morgen? De vil have 3 timer"

AI:
[Checking calendar for tomorrow...]
[RenOS bookings: 08:00-10:00 optaget, 14:00-16:00 optaget]

📅 Ledige slots i morgen (16/1):
1. 10:30-13:30 ✅ (3 timer - perfekt)
2. 16:30-19:30 ⚠️ (sent på dagen)

Anbefaling: Book 10:30-13:30
Skal jeg oprette booking?
```

---

### Scenario: Resolve Booking Conflict

```
You: "Check om der er konflikter i næste uge"

AI:
⚠️ KONFLIKTER FUNDET:

Tirsdag 21/1:
- 14:00-16:00: Magney (2 timer basic)
- 14:30-16:30: Mathias (2 timer deep)
→ 30 min overlap!

Forslag:
1. Flyt Mathias til 17:00-19:00 ✅
2. Flyt Magney til 11:00-13:00 ✅
3. Kontakt en af kunderne

Skal jeg sende besked til Mathias om flytning?
```

---

## 💻 Code Debugging

### Scenario: Fix TypeScript Error

**Current workflow:**

1. Read error message (30 sek)
2. Search Stack Overflow (5 min)
3. Try fix (2 min)
4. Test (1 min)
5. Repeat if failed (10+ min)
**Total: 15-30 minutes**

**With AI Assistant:**

```
You: "Fix denne fejl:
BookingCalendar.tsx:69 - ERROR: Missing ')' in expression"

AI (Qwen2.5-Coder):
[Analyzing error...]
[Checking BookingCalendar.tsx around line 69...]

🔍 Problem fundet:

Linje 69:
```typescript
const handleEvent = (event => {  // ❌ Missing closing parenthesis
```

Skal være:
```typescript
const handleEvent = (event) => {  // ✅ Fixed
```

💡 Bonus check: Fandt også 2 lignende issues:

- Linje 145: Samme pattern
- Linje 203: Manglende type annotation

Skal jeg fixe alle 3?
```

**Time: 30 seconds**  
**Savings: 15-30 minutes**

---

### Scenario: Generate Boilerplate Code

```
You: "Lav en Prisma migration til bookings table med:

- customer_id (relation)
- service_type (enum: BASIC, DEEP, MOVEOUT)
- start_time (datetime)
- duration_hours (int, min 2)
- status (enum: PENDING, CONFIRMED, COMPLETED)
- access_code (optional string)"

AI:
```prisma
model Booking {
  id            String   @id @default(cuid())
  customerId    String
  serviceType   ServiceType
  startTime     DateTime
  durationHours Int      @default(2)
  status        BookingStatus @default(PENDING)
  accessCode    String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  customer Customer @relation(fields: [customerId], references: [id])
  
  @@index([customerId])
  @@index([startTime])
}

enum ServiceType {
  BASIC
  DEEP
  MOVEOUT
}

enum BookingStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
}
```

✅ Migration klar. Kør:
```bash
npx prisma migrate dev --name add_bookings
```
```

**Time: 45 seconds**  
**Savings: 10-15 minutes**

---

## 📧 Customer Follow-up

### Scenario: Check Overdue Invoices

```
You: "Hvilke kunder har ubetalte fakturaer?"

AI:
[Checking Billy.dk...]

💰 UBETALTE FAKTURAER (4.314 DKK):

1. Peder Kjær - 1.222 DKK
   - Faktura: INV-2025-018
   - Forfalden: 20/9/2024 (117 dage!)
   - Sidste kontakt: 15/8/2024

2. Casper Thygesen - 1.396 DKK
   - Faktura: INV-2025-031
   - Forfalden: 15/9/2024 (122 dage!)
   - Sidste kontakt: Ingen registreret

3. Lasse Hansen - 1.696 DKK
   - Faktura: INV-2025-045
   - Forfalden: 1/10/2024 (106 dage!)
   - Sidste kontakt: 20/9/2024 (rykkerbrev sendt)

🎯 ANBEFALINGER:

- Peder: Send 2. rykker + rykkergebyr
- Casper: Ring direkte (ingen email respons)
- Lasse: Overvej inkasso

Skal jeg sende rykkere til Peder og Lasse?
```

---

### Scenario: Lead Follow-up

```
You: "Hvilke leads har jeg ikke fulgt op på?"

AI:
[Checking RenOS CRM...]

🔴 KRITISKE LEADS (ingen opfølgning):

1. Joel Kjellander
   - Tilbud sendt: 27/8/2024
   - Dage siden: 141 dage ❌
   - Status: Intet svar
   - Værdi: ~2.500 DKK (deep clean 150m²)

2. Katrine Werge  
   - Tilbud sendt: 28/8/2024
   - Dage siden: 140 dage ❌
   - Status: "Vender tilbage"
   - Værdi: ~1.800 DKK (basic clean)

3. Helle Olesen
   - Note: "Ring tirsdag kl 10"
   - I DAG ⚠️
   - Værdi: ~3.000 DKK (moving clean)

💡 FORSLAG:

- Joel: Send "Stadig interesseret?" email
- Katrine: Ring op direkte
- Helle: RING NU! (det er tirsdag)

Skal jeg sende emails til Joel og Katrine?
```

---

## 🌅 Morning Routine

### Complete Morning Briefing

```
You: "Good morning - giv mig dagens briefing"

AI:
☀️ GOD MORGEN, JONAS! - Onsdag 15. januar 2025

📅 I DAG (3 bookings):
• 08:00-10:00: Mette Nielsen (Sødalvej 4, kode: 1234)
• 10:30-12:00: Jørn Haagensen (Sølykken 16, kode: 1745) ⚠️ TIL AFKLARING
• 14:00-16:00: Eoin Moving (adresse mangler - RING KUNDE)

💰 FAKTURAER:
• 3 fakturaer fra i går skal oprettes:

- Maria (2 timer)
- Michael Roach (4 timer)
- Eoin (2 timer)
• Total: 2.790 DKK

🔴 KRITISK:
• Helle Olesen: RING I DAG KL 10 (tilbud follow-up)
• Jørn: Afklar ekstra rum før du møder op kl 10:30

⚠️ ADVARSLER:
• Booking konflikt 21/1: Magney + Mathias overlap
• 3 ubetalte fakturaer (4.314 DKK) - send rykkere?

📊 SYSTEM:
• Chrome: 8.2 GB RAM (OK)
• Ollama: Running, GPU 12% idle
• Disk space: 127 GB free

🎯 TOP 3 PRIORITETER:

1. Ring til Helle kl 10:00
2. Opret 3 fakturaer fra i går
3. Afklar Jørn booking før 10:30

Klar til at starte dagen? 🚀
```

**Replaces:**
- 10 min manual calendar check
- 5 min Billy.dk check
- 5 min RenOS review
- 5 min email/notes review

**Total savings: 25 minutes every morning**

---

## 🎯 Pro Tips

### Use Natural Language
```
✅ "Opret faktura til Michael, 4 timer i går"
✅ "Hvad har jeg i morgen efter kl 14?"
✅ "Send rykker til Peder"

❌ "CREATE_INVOICE customer_id=c123 hours=4"
❌ "SELECT * FROM bookings WHERE date=tomorrow"
```

### Be Specific When Needed
```
Better: "Opret faktura til Michael Roach (Aarhus), ikke Michael Jensen"
Better: "Book basic clean, ikke deep clean"
Better: "Flyt booking til tirsdag 21/1 kl 14:00 præcis"
```

### Ask for Explanations
```
"Hvorfor anbefaler du at flytte Mathias?"
"Hvad er forskellen på basic og deep clean i systemet?"
"Hvordan beregnes tilkørsel?"
```

### Chain Commands
```
"Opret fakturaer fra i går, send rykkere til Peder og Lasse, og check om der er konflikter i næste uge"

AI vil:

1. Create invoices
2. Send reminders  
3. Check conflicts
4. Report all results

```

---

## 📊 Time Savings Summary

| Workflow | Before | After | Savings |
|----------|--------|-------|---------|
| Invoice creation (3/day) | 24 min | 1 min | 23 min |
| Morning briefing | 25 min | 30 sek | 24.5 min |
| Calendar check | 5 min | 5 sek | 5 min |
| Code debugging | 30 min | 2 min | 28 min |
| Lead follow-up | 20 min | 1 min | 19 min |
| **TOTAL** | **~2 timer/dag** | **~5 min/dag** | **~115 min/dag** |

**Monthly value: ~42 timer × 600 DKK = 25.200 DKK**

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-15  
**See also:** [SETUP.md](SETUP.md) | [ARCHITECTURE.md](ARCHITECTURE.md)


