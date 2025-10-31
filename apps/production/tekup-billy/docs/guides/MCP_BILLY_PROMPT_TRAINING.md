# MCP Billy Integration - Prompt Training Documentation

**Status:** ✅ Production Ready  
**Version:** 1.4.3  
**Last Updated:** 2025-10-31  
**Railway Deployment:** https://tekup-billy-production.up.railway.app

---

## CRITICAL BILLY MCP RULES FOR AI ASSISTANT

### 1. PRODUCT STRUCTURE - ALWAYS USE:

```
REN-001: Fast rengøring (recurring cleaning)
REN-002: Hovedrengøring (deep cleaning) 
REN-003: Flytterengøring (move-out cleaning)
REN-004: Erhvervsrengøring (commercial cleaning)
REN-005: Specialopgaver (special tasks)
```

### 2. API FIELD MAPPING - KRITISK:

#### CUSTOMER CREATION

```typescript
{
  type: 'person', // privat kunder
  // ELLER
  type: 'company', // erhvervskunder
  
  name: customerName,
  
  contactPersons: [{
    email: customerEmail, // EMAIL SKAL HER
    isPrimary: true
  }]
  
  // ❌ ALDRIG email direkte på contact objekt!
  // email: "kunde@mail.dk" // FEJL!
}
```

#### INVOICE LINES

```typescript
{
  productId: 'REN-XXX', // Vælg korrekt produkt (REN-001 til REN-005)
  description: 'Flytterengøring 100m² - 3 timer',
  quantity: 3, // antal timer
  unitPrice: 349, // ALTID 349 kr/time
  prices: [] // SKAL være tom array
}
```

### 3. WORKFLOW AUTOMATION RULES

**LEAD RECEIVED → WORKFLOW:**

1. `search_email(customer email)` - tjek eksisterende
2. `list_customers()` - verificer Billy status
3. `create_customer()` hvis ny
4. `create_invoice(draft)` når booking bekræftet
5. `approve_invoice()` EFTER opgave udført
6. `send_invoice()` med betingelser
7. `mark_invoice_paid()` når betalt

### 4. PAYMENT TERMS LOGIC

```typescript
// ENGANGSOPGAVER (flytterengøring, hovedrengøring)
{
  paymentTermsDays: 1, // 24 timer
  reminderText: "Beløbet skal være betalt senest i morgen"
}

// FAST RENGØRING (månedlig)
{
  paymentTermsDays: 30,
  invoiceDate: 'månedens første dag',
  description: 'Månedlig rengøring oktober 2025'
}

// AKUT/SAMME DAG
{
  paymentTermsDays: 0, // Betaling ved udførelse
  paymentMethod: 'MobilePay 71759 foretrukket'
}
```

### 5. CRITICAL VALIDATION CHECKS

- ☐ **ALDRIG** `approve_invoice` direkte efter `create`
- ☐ **ALTID** verificer kunde eksisterer først
- ☐ **ALTID** brug produkter REN-001-005
- ☐ **ALTID** 349 kr/time `unitPrice`
- ☐ **ALDRIG** `attendees` på calendar events
- ☐ **ALTID** email i `contactPersons` array

### 6. ERROR PREVENTION

```typescript
// ❌ FORKERT:
{
  email: "kunde@mail.dk" // på contact niveau
}

// ✅ KORREKT:
{
  contactPersons: [{
    email: "kunde@mail.dk",
    isPrimary: true
  }]
}
```

### 7. INVOICE STATUS FLOW

```
draft → approved → sent → paid
  ↓
cancelled (hvis fejl)
```

### 8. INTEGRATION TRIGGERS

- **After booking confirmed:** `create_invoice (draft)`
- **After job completed:** `approve_invoice` + `send_invoice`
- **After payment received:** `mark_invoice_paid`
- **Monthly:** Batch invoices for recurring customers

### 9. DATA SYNC REQUIREMENTS

- Customer email **MUST** match email thread sender
- Invoice description **MUST** include: type, m², timer
- Calendar event → Invoice må **ALDRIG** have tidsforskel
- Thread references **SKAL** gemmes i invoice notes

### 10. PROMPT INSTRUCTION FOR AI

> "Når opgave udføres:
> 
> 1. Verificer Billy kunde (`list_customers`)
> 2. Opret hvis ny (`create_customer` med `contactPersons`)
> 3. Opret faktura draft (**ALDRIG** auto-approve)
> 4. Spørg Jonas: 'Billy status?' før approve
> 5. Send kun efter bekræftelse
> 6. Track betaling via email/bank statements"

---

## FAKTISKE USE CASES & LÆRINGER FRA PRODUKTIONEN

### 1. REELLE PRODUKTER & PRISSÆTNING PATTERNS

Fra vores faktiske fakturaer:

```typescript
{
  "REN-001": "Fast rengøring - månedlig/14-dages",
  "REN-002": "Hovedrengøring - engangs dybderengøring", 
  "REN-003": "Flytterengøring - fraflytning/indflytning",
  "REN-004": "Erhvervsrengøring - kontorer/butikker",
  "REN-005": "Specialopgaver - vinduer/ovne/kælderrum"
}
```

### 2. KRITISKE BILLY WORKFLOW FEJL VI HAR LÆRT AF

#### ❌ FORKERT - Automatisk approve efter create:

```typescript
// ALDRIG GØR DETTE
await create_invoice({...})
await approve_invoice({invoiceId: 'INVOICE_123'}) // FEJL!
```

#### ✅ KORREKT - Vent på bekræftelse:

```typescript
// Step 1: Opret draft
const invoice = await create_invoice({
  contactId: 'CONTACT_ID',
  entryDate: '2025-10-31',
  lines: [{
    productId: 'REN-003',
    description: 'Flytterengøring 79m² - Mathias Pedersen', 
    quantity: 22, // faktiske timer
    unitPrice: 349
  }]
})

// Step 2: VENT på udførelse + kvalitetskontrol
// Step 3: Spørg Jonas: "Billy status?"
// Step 4: Først approve når bekræftet
```

### 3. FAKTISKE KONFLIKTHÅNDTERINGS-CASES

#### Case: Sebastian Fuhlendorff - Kvalitetskonflikt

```typescript
// ORIGINAL FAKTURA
{
  productId: 'REN-002',
  description: 'Hovedrengøring 84m² - 10 timer',
  quantity: 10,
  unitPrice: 349,
  totalAmount: 3490
}

// KONFLIKTLØSNING - Rabat gives
{
  productId: 'REN-002', 
  description: 'Hovedrengøring 84m² - RABAT pga kvalitet',
  quantity: 2.86, // Reduceret til 1000 kr / 349
  unitPrice: 349,
  totalAmount: 1000
}
```

**Lærdom:** Ved konflikter - **ALDRIG** approve faktura før løsning findes. Opret ny faktura med rabat eller cancel original.

#### Case: Rasmus Faurschou - Budget-konflikt

```typescript
// AFTALT: 1500 kr for budget-rengøring
// PROBLEM: Kvalitet matchede ikke forventning
// LØSNING: 
{
  description: 'Flytterengøring delvis - reduceret pga kvalitet',
  quantity: 2.86, // 1000 kr / 349
  unitPrice: 349,
  totalAmount: 1000
}
```

### 4. FAKTISKE FAKTURA BESKRIVELSER VI BRUGER

```typescript
lines: [
  {
    productId: 'REN-003',
    description: 'Flytterengøring 79m² - Mariane Thomsens G. 30 - 22 timer',
    quantity: 22,
    unitPrice: 349
  },
  {
    productId: 'REN-002', 
    description: 'Hovedrengøring 190m² hus Viby J - Lone Beck - 4 timer',
    quantity: 4,
    unitPrice: 349
  },
  {
    productId: 'REN-001',
    description: 'Fast månedlig rengøring - Oktober 2025 - 196m² toplanshus',
    quantity: 5,
    unitPrice: 349
  }
]
```

### 5. FAKTISK EMAIL→BILLY FIELD MAPPING

Fra Lis Hauerbach case:

```typescript
// EMAIL DATA
From: lishauerbach@gmail.com
Subject: "Faktura for rengøring d. 5. september"

// BILLY MAPPING
{
  type: 'person',
  name: 'Lis Hauerbach',
  contactPersons: [{
    email: 'lishauerbach@gmail.com',
    isPrimary: true
  }]
  // IKKE: email: 'lishauerbach@gmail.com' // FEJL!
}
```

### 6. SERVICEFRADRAG HÅNDTERING

Fra Lone Beck case:

```typescript
{
  description: 'Hovedrengøring - SERVICEFRADRAG BERETTIGET',
  quantity: 4,
  unitPrice: 279.20, // Excl. moms for fradrag
  vatAmount: 69.80, // Moms separat
  totalAmount: 1396.00,
  notes: 'Kvittering til servicefradrag - arbejdsløn specificeret'
}
```

### 7. KRITISKE VALIDERINGS-CHECKS FRA FEJL

```typescript
// BEFORE CREATE_INVOICE - ALTID:
const existingCustomer = await list_customers({
  search: customerEmail
})

if (!existingCustomer) {
  await create_customer({
    type: 'person',
    name: 'Mathias Pedersen', // Fra email signatur, IKKE lead
    contactPersons: [{
      email: 'Mathiaslpedersen@hotmail.com',
      isPrimary: true
    }]
  })
}

// VALIDÉR MOD KALENDER
const calendarEvent = await get_calendar_events({
  start: '2025-10-17T00:00:00',
  end: '2025-10-17T23:59:59'
})
// Check: Invoice hours = Calendar hours
```

### 8. BATCH INVOICE PATTERN - MÅNEDLIG

```typescript
// FAST KUNDE - Mi Duborg
async function monthlyBatchInvoice() {
  const recurringCustomers = [
    {id: 'CONTACT_MI_DUBORG', hours: 5, address: '196m² Egå'},
    // Andre faste kunder
  ]

  for (const customer of recurringCustomers) {
    await create_invoice({
      contactId: customer.id,
      entryDate: firstDayOfMonth(),
      paymentTermsDays: 30,
      lines: [{
        productId: 'REN-001',
        description: `Fast rengøring ${currentMonth()} - ${customer.address}`,
        quantity: customer.hours,
        unitPrice: 349
      }]
    })
  }
}
```

### 9. REAL ERROR HANDLING & RECOVERY

```typescript
// Fra Sebastian-konflikt - RECOVERY PATTERN
try {
  await approve_invoice({invoiceId: 'INVOICE_1069'})
} catch (error) {
  // KONFLIKT OPSTÅET

  // 1. Cancel original
  await cancel_invoice({invoiceId: 'INVOICE_1069'})

  // 2. Opret ny med rabat
  await create_invoice({
    contactId: 'SEBASTIAN_ID',
    lines: [{
      productId: 'REN-002',
      description: 'Hovedrengøring - RABAT efter aftale',
      quantity: 2.86, // 1000/349
      unitPrice: 349
    }]
  })

  // 3. Log i notes
  notes: 'Erstatningsfaktura efter kvalitetskonflikt'
}
```

### 10. COMPLETE END-TO-END EXAMPLE FRA PRODUKTION

**Mathias Pedersen - Flytterengøring case**

```typescript
// 1. LEAD MODTAGET
const lead = {
  from: 'Leadmail.no',
  customer: 'Mathias Pedersen',
  service: 'Flytterengøring 79m²'
}

// 2. KUNDE OPRETTELSE
await create_customer({
  type: 'person',
  name: 'Mathias Pedersen',
  contactPersons: [{
    email: 'Mathiaslpedersen@hotmail.com',
    isPrimary: true
  }]
})

// 3. BOOKING BEKRÆFTET
await create_calendar_event({
  start: '2025-10-17T13:00:00+02:00',
  end: '2025-10-17T19:00:00+02:00',
  title: '🏠 Flytterengøring #3 - Mathias',
  description: 'Mariane Thomsens G. 30\n79m² - 22 timer\nMathias Pedersen fra Rengøring.nu - Nettbureau AS'
})

// 4. EFTER UDFØRELSE
await create_invoice({
  contactId: 'CONTACT_MATHIAS',
  entryDate: '2025-10-17',
  paymentTermsDays: 1,
  lines: [{
    productId: 'REN-003',
    description: 'Flytterengøring 79m² - Mariane Thomsens G. 30 - Udført 17/10',
    quantity: 22,
    unitPrice: 349
  }],
  notes: 'Lead: Mathias Pedersen fra Rengøring.nu - Nettbureau AS, Calendar: 17/10 kl.13-19'
})

// 5. GODKEND + SEND (efter Jonas bekræfter)
await approve_invoice({invoiceId: 'INVOICE_1071'})
await send_invoice({
  invoiceId: 'INVOICE_1071',
  message: 'Tak for i dag! Beløb: 7.678 kr. Betaling senest i morgen.'
})

// 6. MARKER BETALT
await mark_invoice_paid({
  invoiceId: 'INVOICE_1071',
  paidDate: '2025-10-18',
  amountPaid: 7678
})
```

---

## KRITISK PROMPT REGEL - ALDRIG GØR

### ❌ ALDRIG:

- Auto-approve efter `create_invoice`
- Glem `contactPersons` array for email
- Brug `attendees` på calendar events 
- Send faktura før opgave udført
- Gæt på produktkode - **ALTID** REN-001-005

### ✅ ALTID:

- Verificer kunde eksisterer først
- Match timer med kalender event
- Gem thread reference i notes
- Vent på "Billy status?" bekræftelse
- Brug 349 kr/time `unitPrice`

---

## SYSTEM PROMPT TEMPLATE

Kopiér dette direkte til system prompts:

```
Du er en AI-assistent der håndterer Billy.dk fakturering via MCP Billy integration.

KRITISKE REGLER:
1. Brug ALTID produkter REN-001 (Fast rengøring), REN-002 (Hovedrengøring), 
   REN-003 (Flytterengøring), REN-004 (Erhvervsrengøring), REN-005 (Specialopgaver)
2. ALDRIG approve faktura direkte efter oprettelse - vent på "Billy status?" bekræftelse
3. ALTID brug contactPersons array for email, ALDRIG email direkte på contact objekt
4. ALTID 349 kr/time unitPrice
5. Verificer kunde eksisterer først (list_customers)
6. Match faktura timer med kalender event timer
7. Gem thread reference i invoice notes

WORKFLOW:
1. search_email → list_customers → create_customer (hvis ny)
2. create_invoice (draft) når booking bekræftet
3. VENT på opgave udførelse
4. Spørg "Billy status?" før approve
5. approve_invoice → send_invoice
6. mark_invoice_paid når betalt

VED KONFLIKTER:
- Cancel original faktura
- Opret ny med rabat (quantity reduceret)
- Log i notes
```

---

**Last Updated:** 2025-10-31  
**Maintained by:** Tekup - Rendetalje ApS  
**Version:** 1.4.3  
**Railway:** https://tekup-billy-production.up.railway.app


