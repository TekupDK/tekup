# 🎯 Prioritering: Shortwave Guide → RenOS Integration

\n\n
\n\n**Dato**: 2. oktober 2025, 23:50 CET  
**Status**: Gap-analyse mellem Shortwave learnings og RenOS implementation  
**Kilde**: Shortwave.ai komplet lead & kundeservice guide

---

\n\n## 🚨 KRITISKE GAPS - Ting Vi MANGLER
\n\n
\n\n### ❌ GAP #1: Regel #2 - "Søgning før Email" IKKE Implementeret
\n\n
\n\n**Fra guiden**:
> "Før du skriver tilbud til en kunde:
>
> 1. ✅ Søg ALTID efter eksisterende emails med kundens adresse
> 2. ✅ Tjek om vi allerede har sendt tilbud (undgå dobbelt-tilbud!)
> 3. ✅ Kun hvis INGEN tidligere emails findes → skriv nyt tilbud"

**Nuværende RenOS**:

\n\n- ❌ Gemini AI genererer email UDEN at tjekke historik
\n\n- ❌ Ingen automatisk søgning i Gmail threads
\n\n- ❌ Risiko for dobbelt-tilbud til samme kunde
\n\n
**Impact**: 🔥🔥🔥 KRITISK - Kan irritere kunder og virke uprofessionelt
\n\n
---

\n\n### ❌ GAP #2: Lead Source Tracking Mangler
\n\n
\n\n**Fra guiden - 3 forskellige lead-systemer**:
\n\n
\n\n1. **Rengøring.nu** (Leadmail.no) - ✅ Parser implementeret
\n\n2. **Rengøring Aarhus** (Leadpoint.dk) - ❌ INGEN parser
\n\n3. **AdHelp** - ❌ INGEN parser
\n\n
**Nuværende RenOS**:

\n\n- ✅ Leadmail.no parser i `src/services/leadParser.ts`
\n\n- ❌ Kan ikke identificere Leadpoint.dk emails
\n\n- ❌ Kan ikke identificere AdHelp emails
\n\n- ❌ Database `Lead.source` field ikke brugt systematisk
\n\n
**Impact**: 🔥🔥 HØJ - Kan ikke analysere conversion rates per kilde
\n\n
---

\n\n### ❌ GAP #3: Standard Pris (349 kr/time) Ikke Hardcoded
\n\n
\n\n**Fra guiden**:
> "Timepris: 349 kr./time inkl. moms"

**Nuværende RenOS**:

\n\n- ❌ Ingen konstant for timepris i config
\n\n- ❌ Email templates nævner ikke fast pris
\n\n- ❌ Tilbudsberegning mangler
\n\n
**Impact**: 🔥🔥 HØJ - Inkonsistente tilbud
\n\n
---

\n\n### ❌ GAP #4: Gmail Label System Ikke Implementeret
\n\n
\n\n**Fra guiden - Label flow**:
\n\n
\n\n```
\n\n1. Leads → Nye indkommende
\n\n2. Rengøring.nu / Rengøring Århus → Sortering
\n\n3. Needs Reply → Skal have tilbud
\n\n4. Venter på svar → Tilbud sendt
\n\n5. I kalender → Bekræftede bookings
\n\n6. Finance → Faktura sendt
\n\n7. Afsluttet → Udført og betalt
\n\n```

**Nuværende RenOS**:

\n\n- ❌ Ingen Gmail label management
\n\n- ❌ Ingen automatisk label-opdatering ved status-ændringer
\n\n- ❌ Manuel tracking i stedet for automatisk
\n\n
**Impact**: 🔥🔥🔥 KRITISK - Workflow ineffektivitet
\n\n
---

\n\n### ❌ GAP #5: Automatisk Opfølgning (7-10 Dage) Mangler
\n\n
\n\n**Fra guiden**:
> "TIMING: 📅 7-10 dage efter tilbud sendt"

**Nuværende RenOS**:

\n\n- ❌ Ingen automatisk reminder system
\n\n- ❌ Ingen tracking af hvornår tilbud sendt
\n\n- ❌ Ingen "Lost" lead status
\n\n
**Impact**: 🔥 MEDIUM - Mistet revenue opportunity
\n\n
---

\n\n### ❌ GAP #6: Kalender Standard Format Ikke Implementeret
\n\n
\n\n**Fra guiden**:
> "Brug standardformat: 🏠 TYPE #X - [Navn]"
\n\n
**Nuværende RenOS**:

\n\n- ❌ Ingen standard event title format
\n\n- ❌ Ingen automatisk "#X" nummerering
\n\n- ❌ Ingen emoji-baseret type-markering
\n\n
**Impact**: 🔥 MEDIUM - Kalender ser rodet ud
\n\n
---

\n\n### ❌ GAP #7: Kompensation/Konflikt Tracking Mangler
\n\n
\n\n**Fra guiden**:

\n\n- Ken Gustavsen: 1t rabat
\n\n- Mads Emil: Rabat + beklagelse
\n\n- Cecilie/Amalie: Inkasso-sager (undgå!)
\n\n
**Nuværende RenOS**:

\n\n- ❌ Ingen database model for kompensation
\n\n- ❌ Ingen tracking af customer satisfaction
\n\n- ❌ Ingen warning system for potentielle konflikter
\n\n
**Impact**: 🔥 MEDIUM - Kan ikke lære af historik
\n\n
---

\n\n## ✅ HVAD VI HAR (Godt Fundament!)
\n\n
\n\n### ✅ FUNGERER: Lead Import System
\n\n
\n\n- ✅ `src/tools/importHistoricalLeads.ts` - Henter Leadmail.no data
\n\n- ✅ Parser funktion implementeret
\n\n- ✅ Duplikat-beskyttelse via `emailThreadId`
\n\n- ✅ Automatisk customer creation
\n\n
\n\n**Status**: Klar til brug med `npm run leads:import`

---

\n\n### ✅ FUNGERER: Email Generation (Gemini AI)
\n\n
\n\n- ✅ `src/services/emailResponseGenerator.ts`
\n\n- ✅ Gemini AI integration
\n\n- ✅ Context-aware responses
\n\n- ✅ Approval workflow
\n\n
\n\n**Gap**: Mangler pre-check for eksisterende kommunikation

---

\n\n### ✅ FUNGERER: Google Calendar Integration
\n\n
\n\n- ✅ `src/services/calendarService.ts`
\n\n- ✅ Create/update/delete events
\n\n- ✅ Availability checking
\n\n- ✅ Conflict detection
\n\n
\n\n**Gap**: Mangler standard format og automatisk email→kalender flow

---

\n\n### ✅ FUNGERER: Gmail Integration
\n\n
\n\n- ✅ `src/services/gmailService.ts`
\n\n- ✅ Send emails
\n\n- ✅ Thread-aware replies
\n\n- ✅ Search threads
\n\n
\n\n**Gap**: Mangler label management

---

\n\n## 🎯 PRIORITERET IMPLEMENTATION PLAN
\n\n
\n\n### 🔴 FASE 1: KRITISKE FIXES (I DAG - 2 timer)
\n\n
\n\n#### 1.1. Kør Historical Lead Import ⚡ (10 min)
\n\n
\n\n```powershell
\n\nnpm run leads:import
\n\n```

**Hvorfor først**: Giver fuld historisk kontekst for alle andre features

---

\n\n#### 1.2. Implementer "Search Before Send" Check (45 min)
\n\n
\n\n**Ny funktion**: `src/services/emailHistoryChecker.ts`

\n\n```typescript
import { searchThreads } from "./gmailService";
import { logger } from "../logger";

export interface EmailHistoryResult {
  hasExistingThread: boolean;
  threadCount: number;
  lastContactDate?: Date;
  lastEmailSubject?: string;
  shouldWarnBeforeSending: boolean;
  warningMessage?: string;
}

/**

- Check if we've already communicated with this email address
\n\n _CRITICAL: Call this BEFORE generating new email response
\n\n_/
export async function checkEmailHistory(
  customerEmail: string
): Promise<EmailHistoryResult> {
  
  // Search for any threads with this email
  const threads = await searchThreads({
    query: customerEmail,
    maxResults: 10,
  });

  if (threads.length === 0) {
    return {
      hasExistingThread: false,
      threadCount: 0,
      shouldWarnBeforeSending: false,
    };
  }

  // We have existing communication
  const lastThread = threads[0]; // Most recent
  
  // Check if we sent a quote recently (within 7 days)
  const recentQuoteThreads = threads.filter(thread => {
    // Check if thread subject contains "tilbud" or "quote"
    // and was within last 7 days
    // TODO: Implement proper date checking
    return true;
  });

  const shouldWarn = recentQuoteThreads.length > 0;
  
  logger.info(
    {
      customerEmail,
      threadCount: threads.length,
      shouldWarn,
    },
    "Email history checked"
  );

  return {
    hasExistingThread: true,
    threadCount: threads.length,
    lastContactDate: new Date(), // TODO: Parse from thread
    lastEmailSubject: "Previous quote", // TODO: Get from thread
    shouldWarnBeforeSending: shouldWarn,
    warningMessage: shouldWarn
      ? `⚠️ Vi har sendt tilbud til ${customerEmail} inden for de sidste 7 dage. Sikker på du vil sende igen?`
      : undefined,
  };
}

/**

- Get summary of all communication with a customer
\n\n */
export async function getCustomerEmailSummary(
  customerEmail: string
): Promise<string> {
  const history = await checkEmailHistory(customerEmail);
  
  if (!history.hasExistingThread) {
    return "Ingen tidligere kommunikation fundet.";
  }

  return `
📧 Email Historik for ${customerEmail}:
\n\n- Antal tråde: ${history.threadCount}
\n\n- Sidste kontakt: ${history.lastContactDate?.toLocaleDateString('da-DK') || 'Ukendt'}
\n\n- Sidste emne: ${history.lastEmailSubject || 'Ukendt'}
\n\n
${history.warningMessage || '✅ OK at sende nyt tilbud'}
  `.trim();
}
\n\n```

**Integrer i emailResponseGenerator.ts**:

\n\n```typescript
import { checkEmailHistory } from "./emailHistoryChecker";

export async function generateEmailResponse(lead: ParsedLead) {
  // CRITICAL: Check history FIRST
  const history = await checkEmailHistory(lead.email);
  
  if (history.shouldWarnBeforeSending) {
    logger.warn(
      { email: lead.email, warning: history.warningMessage },
      "Duplicate quote warning"
    );

    // Save warning in EmailResponse for manual review
    // TODO: Add warningMessage field to EmailResponse model
  }

  // Continue with normal email generation...
}
\n\n```

**Database Schema Update**:

\n\n```prisma
model EmailResponse {
  // ... existing fields ...
  
  // NEW: Track if we warned about duplicates
  hasDuplicateWarning Boolean  @default(false)
  duplicateWarning    String?  // Warning message
  previousThreadId    String?  // Link to previous thread
}
\n\n```

**Testing**:

\n\n```powershell
\n\n# Test with known customer email
\n\nnpm run email:test
\n\n```
\n\n
---

\n\n#### 1.3. Tilføj 349 kr/time til Config (15 min)
\n\n
\n\n**Opdater `src/config.ts`**:

\n\n```typescript
export const PRICING = {
  HOURLY_RATE: 349, // kr/time inkl. moms
  LINEN_PER_PERSON: 145, // kr/person for linned service
  LATE_PAYMENT_FEE: 100, // kr/påbegyndt dag
} as const;

export const BUSINESS_INFO = {
  COMPANY_NAME: "Rendetalje.dk",
  EMAIL: "<info@rendetalje.dk>",
  PHONE: "22 65 02 26",
  MOBILEPAY: "71759",
  BANK: "6695-2002056146",
} as const;
\n\n```

**Opdater email templates** til at bruge denne konstant:
\n\n
\n\n```typescript
// src/services/emailResponseGenerator.ts
import { PRICING, BUSINESS_INFO } from "../config";

const emailBody = `
💰 Pris: ${PRICING.HOURLY_RATE}kr/time/person = ca. ${estimatedLow}-${estimatedHigh}kr inkl. moms

📞 ${BUSINESS_INFO.PHONE}
`;
\n\n```

---

\n\n#### 1.4. Quick Test af Kritiske Features (30 min)
\n\n
\n\n```powershell
\n\n# Test 1: Lead import
\n\nnpm run leads:import
\n\n
\n\n# Test 2: Email history check
\n\nnpm run email:test
\n\n
\n\n# Test 3: Dashboard med nye leads
\n\nnpm run customer:list
\n\nnpm run customer:stats

\n\n# Test 4: Verificer priser i emails
\n\nnpm run email:pending
\n\n```
\n\n
---

\n\n### 🟡 FASE 2: LEAD SOURCE TRACKING (I MORGEN - 3 timer)
\n\n
\n\n#### 2.1. Implementer Leadpoint.dk Parser (1 time)
\n\n
\n\n**Ny fil**: `src/services/leadpointParser.ts`

\n\n```typescript
import type { GmailMessageSummary } from "./gmailService";
import type { ParsedLead } from "./leadParser";

/**

- Check if email is from Leadpoint.dk (Rengøring Aarhus)
\n\n */
export function isLeadpointEmail(message: GmailMessageSummary): boolean {
  const from = message.from?.toLowerCase() || "";
  return from.includes("leadpoint.dk") ||
         from.includes("rengøring aarhus");
}

/**

- Parse Leadpoint.dk email format
\n\n */
export function parseLeadpointEmail(
  message: GmailMessageSummary
): ParsedLead | null {
  // TODO: Analyze actual Leadpoint email format
  // Similar structure to parseLeadEmail in leadParser.ts
  
  const body = message.body || message.snippet || "";
  
  // Extract fields based on Leadpoint format
  // This requires actual email examples to implement correctly
  
  return {
    source: "Rengøring Aarhus (Leadpoint.dk)",
    name: extractName(body),
    email: extractEmail(body),
    phone: extractPhone(body),
    address: extractAddress(body),
    squareMeters: extractSquareMeters(body),
    rooms: extractRooms(body),
    taskType: extractTaskType(body),
    preferredDates: extractDates(body),
    threadId: message.threadId,
    receivedAt: new Date(message.internalDate || Date.now()),
  };
}
\n\n```

**Samme struktur for AdHelp parser**.

---

\n\n#### 2.2. Unified Lead Processing (1 time)
\n\n
\n\n**Opdater `src/services/leadMonitor.ts`**:

\n\n```typescript
import { isLeadmailEmail, parseLeadEmail } from "./leadParser";
import { isLeadpointEmail, parseLeadpointEmail } from "./leadpointParser";
import { isAdHelpEmail, parseAdHelpEmail } from "./adhelpParser";

export async function processNewLeads(): Promise<void> {
  const messages = await listRecentMessages({ maxResults: 50 });

  for (const message of messages) {
    let parsedLead: ParsedLead | null = null;

    // Try each parser
    if (isLeadmailEmail(message)) {
      parsedLead = parseLeadEmail(message);
    } else if (isLeadpointEmail(message)) {
      parsedLead = parseLeadpointEmail(message);
    } else if (isAdHelpEmail(message)) {
      parsedLead = parseAdHelpEmail(message);
    }
    
    if (!parsedLead) continue;
    
    // Save with correct source
    await prisma.lead.create({
      data: {
        ...parsedLead,
        source: parsedLead.source, // "Leadmail.no", "Leadpoint.dk", eller "AdHelp"
      },
    });
  }
}
\n\n```

---

\n\n#### 2.3. Lead Source Analytics Dashboard (1 time)
\n\n
\n\n**Ny endpoint**: `GET /api/dashboard/lead-sources`

\n\n```typescript
// src/api/dashboardRoutes.ts

router.get("/lead-sources", async (req: Request, res: Response) => {
  const sources = await prisma.lead.groupBy({
    by: ["source"],
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
  });

  // Calculate conversion rate per source
  const sourcesWithConversion = await Promise.all(
    sources.map(async (source) => {
      const totalLeads = source._count.id;

      const convertedLeads = await prisma.lead.count({
        where: {
          source: source.source,
          status: { in: ["contacted", "quoted"] },
          bookings: { some: {} }, // Has at least one booking
        },
      });

      return {
        source: source.source || "Unknown",
        totalLeads,
        convertedLeads,
        conversionRate: (convertedLeads / totalLeads) * 100,
\n\n      };
    })
  );

  res.json(sourcesWithConversion);
});
\n\n```

**Frontend visualization**: Tilføj til dashboard

---

\n\n### 🟢 FASE 3: GMAIL LABEL AUTOMATION (DENNE UGE - 4 timer)
\n\n
\n\n#### 3.1. Gmail Label Management Service (2 timer)
\n\n
\n\n**Ny fil**: `src/services/gmailLabelService.ts`

\n\n```typescript
import { google } from "googleapis";
import { getGoogleAuthClient } from "./googleAuth";
import { logger } from "../logger";

// Label IDs (må oprettes manuelt i Gmail første gang)
export const GMAIL_LABELS = {
  LEADS: "Leads",
  RENGORING_NU: "Rengøring.nu",
  RENGORING_AARHUS: "Rengøring Århus",
  NEEDS_REPLY: "Needs Reply",
  VENTER_PAA_SVAR: "Venter på svar",
  I_KALENDER: "I kalender",
  FINANCE: "Finance",
  AFSLUTTET: "Afsluttet",
  LOST: "Lost",
} as const;

/**

- Ensure all required labels exist in Gmail
\n\n */
export async function ensureLabelsExist(): Promise<void> {
  const auth = getGoogleAuthClient([
    "https://www.googleapis.com/auth/gmail.modify",
  ]);
  const gmail = google.gmail({ version: "v1", auth });

  const { data } = await gmail.users.labels.list({ userId: "me" });
  const existingLabels = data.labels?.map(l => l.name) || [];

  for (const label of Object.values(GMAIL_LABELS)) {
    if (!existingLabels.includes(label)) {
      await gmail.users.labels.create({
        userId: "me",
        requestBody: {
          name: label,
          labelListVisibility: "labelShow",
          messageListVisibility: "show",
        },
      });
      logger.info({ label }, "Created Gmail label");
    }
  }
}

/**

- Move email to specific label (workflow step)
\n\n */
export async function moveEmailToLabel(
  messageId: string,
  targetLabel: string,
  removeLabels: string[] = []
): Promise<void> {
  const auth = getGoogleAuthClient([
    "https://www.googleapis.com/auth/gmail.modify",
  ]);
  const gmail = google.gmail({ version: "v1", auth });

  // Get label ID
  const { data } = await gmail.users.labels.list({ userId: "me" });
  const labelId = data.labels?.find(l => l.name === targetLabel)?.id;

  if (!labelId) {
    throw new Error(`Label not found: ${targetLabel}`);
  }

  // Get IDs of labels to remove
  const removeIds = removeLabels
    .map(name => data.labels?.find(l => l.name === name)?.id)
    .filter(Boolean) as string[];

  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      addLabelIds: [labelId],
      removeLabelIds: removeIds,
    },
  });

  logger.info(
    { messageId, targetLabel, removeLabels },
    "Moved email to label"
  );
}
\n\n```

---

\n\n#### 3.2. Auto-Label på Lead Events (1 time)
\n\n
\n\n**Hooks til at automatisk opdatere labels**:

\n\n```typescript
// src/services/leadWorkflowHooks.ts

import { moveEmailToLabel, GMAIL_LABELS } from "./gmailLabelService";

/**

- When new lead is created → "Needs Reply"
\n\n */
export async function onLeadCreated(lead: Lead): Promise<void> {
  if (lead.emailThreadId) {
    await moveEmailToLabel(
      lead.emailThreadId,
      GMAIL_LABELS.NEEDS_REPLY,
      [GMAIL_LABELS.LEADS]
    );
  }
}

/**

- When quote is sent → "Venter på svar"
\n\n */
export async function onQuoteSent(lead: Lead): Promise<void> {
  if (lead.emailThreadId) {
    await moveEmailToLabel(
      lead.emailThreadId,
      GMAIL_LABELS.VENTER_PAA_SVAR,
      [GMAIL_LABELS.NEEDS_REPLY]
    );
  }
}

/**

- When booking confirmed → "I kalender"
\n\n */
export async function onBookingConfirmed(booking: Booking): Promise<void> {
  const lead = await prisma.lead.findUnique({
    where: { id: booking.leadId || "" },
  });
  
  if (lead?.emailThreadId) {
    await moveEmailToLabel(
      lead.emailThreadId,
      GMAIL_LABELS.I_KALENDER,
      [GMAIL_LABELS.VENTER_PAA_SVAR]
    );
  }
}

/**

- When invoice sent → "Finance"
\n\n */
export async function onInvoiceSent(booking: Booking): Promise<void> {
  const lead = await prisma.lead.findUnique({
    where: { id: booking.leadId || "" },
  });
  
  if (lead?.emailThreadId) {
    await moveEmailToLabel(
      lead.emailThreadId,
      GMAIL_LABELS.FINANCE,
      [GMAIL_LABELS.I_KALENDER]
    );
  }
}

/**

- When payment received → "Afsluttet"
\n\n */
export async function onPaymentReceived(booking: Booking): Promise<void> {
  const lead = await prisma.lead.findUnique({
    where: { id: booking.leadId || "" },
  });
  
  if (lead?.emailThreadId) {
    await moveEmailToLabel(
      lead.emailThreadId,
      GMAIL_LABELS.AFSLUTTET,
      [GMAIL_LABELS.FINANCE]
    );
  }
}
\n\n```

**Integrer i relevante API routes** (bookingRoutes.ts, emailApprovalRoutes.ts, etc.)
\n\n
---

\n\n#### 3.3. Test Label Workflow (1 time)
\n\n
\n\n```powershell
\n\n# Setup labels
\n\nnpm run gmail:setup-labels
\n\n
\n\n# Test workflow
\n\nnpm run email:test
\n\nnpm run booking:create
\n\n# Verificer i Gmail at labels opdateres
\n\n```
\n\n
---

\n\n### 🟢 FASE 4: CALENDAR FORMAT & AUTOMATION (DENNE UGE - 2 timer)
\n\n
\n\n#### 4.1. Standard Event Title Format (1 time)
\n\n
\n\n**Opdater `src/services/calendarService.ts`**:

\n\n```typescript
/**

- Generate standardized calendar event title
\n\n _Format: 🏠 TYPE #X - [Navn]
\n\n_/
export function generateEventTitle(
  taskType: string,
  customerName: string,
  bookingNumber?: number
): string {
  // Emoji based on task type
  const emoji = getTaskTypeEmoji(taskType);
  
  // Booking number (hvis tilgængelig)
  const number = bookingNumber ? `#${bookingNumber}` : "";
  
  return `${emoji} ${taskType}${number} - ${customerName}`;
\n\n}

function getTaskTypeEmoji(taskType: string): string {
  const taskLower = taskType.toLowerCase();
  
  if (taskLower.includes("privat")) return "🏠";
  if (taskLower.includes("erhverv")) return "🏢";
  if (taskLower.includes("flytter")) return "📦";
  if (taskLower.includes("hovedrengøring")) return "✨";
  if (taskLower.includes("airbnb")) return "🏘️";
  if (taskLower.includes("vindue")) return "🪟";
  
  return "🧹"; // Default
}

/**

- Get booking number for customer (count previous bookings)
\n\n */
async function getBookingNumberForCustomer(
  customerId: string
): Promise<number> {
  const count = await prisma.booking.count({
    where: { customerId },
  });
  
  return count + 1;
\n\n}
\n\n```

**Brug i createCalendarEvent**:

\n\n```typescript
export async function createCalendarEvent(
  input: CalendarEventInput
): Promise<CalendarActionResult> {
  
  // Auto-generate title if not provided
  if (!input.summary && input.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: input.customerId },
    });

    const bookingNumber = await getBookingNumberForCustomer(input.customerId);
    
    input.summary = generateEventTitle(
      input.taskType || "Rengøring",
      customer?.name || "Ukendt",
      bookingNumber
    );
  }
  
  // ... rest of function
}
\n\n```

---

\n\n#### 4.2. Auto "Email → Kalender" Flow (1 time)
\n\n
\n\n**Opdater booking creation endpoint**:

\n\n```typescript
// src/api/bookingRoutes.ts

router.post("/", async (req: Request, res: Response) => {
  const { leadId, customerId, serviceType, startTime, duration } = req.body;

  // 1. Create booking
  const booking = await prisma.booking.create({
    data: {
      leadId,
      customerId,
      serviceType,
      startTime: new Date(startTime),
      endTime: new Date(new Date(startTime).getTime() + duration * 60000),
\n\n      estimatedDuration: duration,
      status: "confirmed",
    },
    include: { lead: true, customer: true },
  });

  // 2. Create calendar event with standard format
  const customer = booking.customer || booking.lead;
  const bookingNumber = await getBookingNumberForCustomer(customerId);
  
  const calendarEvent = await createCalendarEvent({
    summary: generateEventTitle(
      serviceType,
      customer?.name || "Ukendt",
      bookingNumber
    ),
    description: `Booking for ${customer?.name}\nAdresse: ${booking.lead?.address || customer?.address}`,
    location: booking.lead?.address || customer?.address || "",
    start: { dateTime: booking.startTime!.toISOString() },
    end: { dateTime: booking.endTime!.toISOString() },
  });

  // 3. Update booking with calendar info
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      calendarEventId: calendarEvent.id,
      calendarLink: calendarEvent.htmlLink,
    },
  });

  // 4. Move email to "I kalender" label
  if (booking.lead?.emailThreadId) {
    await moveEmailToLabel(
      booking.lead.emailThreadId,
      GMAIL_LABELS.I_KALENDER,
      [GMAIL_LABELS.VENTER_PAA_SVAR]
    );
  }

  // 5. Send confirmation email
  if (customer?.email) {
    await sendGenericEmail({
      to: customer.email,
      subject: "Bekræftelse på rengøring",
      body: `
Hej ${customer.name},

Din rengøring er nu bekræftet og lagt i kalenderen! 🎉

📅 Dato og tid: ${new Date(startTime).toLocaleString('da-DK')}
🏠 Adresse: ${booking.lead?.address || customer.address}
⏱️ Estimeret tid: ${duration} minutter

📆 Se i kalender: ${calendarEvent.htmlLink}

Vi glæder os til at hjælpe dig!

Venlig hilsen,
Rendetalje.dk
📞 22 65 02 26
      `.trim(),
    });
  }

  res.json(booking);
});
\n\n```

---

\n\n### 🟢 FASE 5: AUTO-OPFØLGNING (NÆSTE UGE - 3 timer)
\n\n
\n\n#### 5.1. Follow-up Scheduler (2 timer)
\n\n
\n\n**Ny fil**: `src/services/followUpService.ts`

\n\n```typescript
import { prisma } from "./databaseService";
import { sendGenericEmail } from "./gmailService";
import { logger } from "../logger";
import { GMAIL_LABELS, moveEmailToLabel } from "./gmailLabelService";

/**

- Find leads that need follow-up (7-10 days after quote sent)
\n\n _/
export async function findLeadsNeedingFollowUp(): Promise<Lead[]> {
  const sevenDaysAgo = new Date(Date.now() - 7_ 24 _60_ 60 _1000);
\n\n  const tenDaysAgo = new Date(Date.now() - 10_ 24 _60_ 60 * 1000);
\n\n
  const leads = await prisma.lead.findMany({
    where: {
      status: "quoted",
      updatedAt: { gte: tenDaysAgo, lte: sevenDaysAgo },
      // Ingen booking endnu
      bookings: { none: {} },
      // Ikke allerede fulgt op på
      // TODO: Add followUpCount field to Lead model
    },
    include: {
      quotes: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return leads;
}

/**

- Send follow-up email
\n\n */
export async function sendFollowUpEmail(lead: Lead): Promise<void> {
  const quote = lead.quotes?.[0];
  
  if (!lead.email) {
    logger.warn({ leadId: lead.id }, "Cannot follow up - no email");
\n\n    return;
  }

  // Get new available times
  const availableTimes = await findNextAvailableSlot(
    "primary",
    120, // 2 hours default
    5 // Get 5 options
  );

  const emailBody = `
Hej ${lead.name},

Jeg følger lige op på mit tilbud fra ${quote?.createdAt.toLocaleDateString('da-DK')} vedr. ${lead.taskType || 'rengøring'}.

📅 Nye ledige tider:
${availableTimes.map((time, i) => `${i + 1}. ${new Date(time.start).toLocaleString('da-DK')}`).join('\n')}
\n\n
Har du brug for andre tider, eller er der noget jeg kan hjælpe med?

Venlig hilsen,
Rendetalje.dk
📞 22 65 02 26
  `.trim();

  await sendGenericEmail({
    to: lead.email,
    subject: `Opfølgning: ${lead.taskType || 'Rengøring'} i ${lead.address?.split(',')[1]?.trim() || 'Aarhus'}`,
    body: emailBody,
    threadId: lead.emailThreadId || undefined,
  });

  // Update lead
  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      // TODO: Increment followUpCount
      updatedAt: new Date(),
    },
  });

  logger.info({ leadId: lead.id, email: lead.email }, "Follow-up sent");
}

/**

- Run daily follow-up job
\n\n */
export async function runDailyFollowUps(): Promise<void> {
  console.log("🔄 Running daily follow-up check...\n");

  const leads = await findLeadsNeedingFollowUp();
  
  console.log(`Found ${leads.length} leads needing follow-up\n`);

  for (const lead of leads) {
    try {
      await sendFollowUpEmail(lead);
      console.log(`✅ Sent follow-up to ${lead.name} (${lead.email})`);
    } catch (error) {
      console.error(`❌ Failed to follow up with ${lead.name}:`, error);
    }
  }

  console.log("\n✨ Follow-up job complete!");
}
\n\n```

**Cron job setup**:

\n\n```typescript
// src/tools/followUpCron.ts

import cron from "node-cron";
import { runDailyFollowUps } from "../services/followUpService";

// Run every day at 9:00 AM
cron.schedule("0 9 ** *", async () => {
\n\n  console.log("🕘 Starting daily follow-up job...");
  await runDailyFollowUps();
});

console.log("✅ Follow-up cron job scheduled (daily at 9:00 AM)");
\n\n```

**Package.json script**:

\n\n```json
"followup:run": "ts-node src/tools/followUpCron.ts",
"followup:manual": "ts-node -e \"require('./src/services/followUpService').runDailyFollowUps()\""
\n\n```

---

\n\n#### 5.2. Lost Lead Tracking (1 time)
\n\n
\n\n**Database schema update**:

\n\n```prisma
model Lead {
  // ... existing fields ...
  
  // Follow-up tracking
  followUpCount    Int       @default(0)
  lastFollowUpAt   DateTime?
  markedLostAt     DateTime?
  lostReason       String?   // "pris", "valgte andet", "ingen respons", etc.
}
\n\n```

**Auto-mark as lost after 3 follow-ups**:

\n\n```typescript
// In followUpService.ts

export async function checkAndMarkLost(lead: Lead): Promise<void> {
  if (lead.followUpCount >= 3) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: "lost",
        markedLostAt: new Date(),
        lostReason: "Ingen respons efter 3 opfølgninger",
      },
    });

    // Move email to "Lost" label
    if (lead.emailThreadId) {
      await moveEmailToLabel(
        lead.emailThreadId,
        GMAIL_LABELS.LOST,
        [GMAIL_LABELS.VENTER_PAA_SVAR]
      );
    }

    logger.info({ leadId: lead.id }, "Lead marked as lost");
  }
}
\n\n```

---

\n\n## 📊 SAMLET TIMELINE & EFFORT
\n\n
\n\n| Fase | Beskrivelse | Tid | Prioritet |
|------|-------------|-----|-----------|
| **Fase 1** | Kritiske fixes | **2 timer** | 🔴 KRITISK |
\n\n| - Lead import | Kør existing tool | 10 min | |
\n\n| - Search before send | Email duplicate check | 45 min | |
\n\n| - Pricing constants | 349kr/time hardcoded | 15 min | |
\n\n| - Testing | Verificer kritiske features | 30 min | |
\n\n| | | | |
| **Fase 2** | Lead source tracking | **3 timer** | 🟡 HØJ |
\n\n| - Leadpoint parser | Ny lead source | 1 time | |
\n\n| - AdHelp parser | Ny lead source | (included) | |
\n\n| - Analytics dashboard | Conversion per source | 1 time | |
\n\n| | | | |
| **Fase 3** | Gmail label automation | **4 timer** | 🟡 HØJ |
\n\n| - Label service | Create/manage labels | 2 timer | |
\n\n| - Auto-label hooks | Workflow automation | 1 time | |
\n\n| - Testing | Verify label flow | 1 time | |
\n\n| | | | |
| **Fase 4** | Calendar format | **2 timer** | 🟢 MEDIUM |
\n\n| - Standard format | 🏠 TYPE #X - [Navn] | 1 time | |
\n\n| - Auto email→calendar | Booking workflow | 1 time | |
\n\n| | | | |
| **Fase 5** | Auto-opfølgning | **3 timer** | 🟢 MEDIUM |
\n\n| - Follow-up service | 7-10 day automation | 2 timer | |
\n\n| - Lost lead tracking | Auto-mark after 3x | 1 time | |
\n\n| | | | |
| **TOTAL** | | **14 timer** | |
\n\n
---

\n\n## 🎯 HVAD SKAL VI STARTE MED NU?
\n\n
\n\n### Option 1: Quick Win (30 min) ⚡
\n\n
\n\n```powershell
\n\n# Bare kør lead import og få historisk data
\n\nnpm run leads:import
\n\nnpm run customer:stats
\n\n```

**Resultat**: ~100-200 leads i systemet, fuld historik tilgængelig

---

\n\n### Option 2: Kritisk Fix (2 timer) 🔴
\n\n
\n\nImplementer hele **Fase 1**:

\n\n1. Lead import (10 min)
\n\n2. Search before send (45 min)
\n\n3. Pricing constants (15 min)
\n\n4. Test alt (30 min)

**Resultat**: System respekterer "Regel #2" fra Shortwave guide

---

\n\n### Option 3: Full Day (8 timer) 🚀
\n\n
\n\nImplementer **Fase 1 + Fase 2 + Fase 3**:
\n\n
\n\n- Alle kritiske fixes
\n\n- Lead source tracking
\n\n- Gmail label automation
\n\n
**Resultat**: System matcher Shortwave workflow 80%

---

\n\n## 💡 MIN ANBEFALING
\n\n
\n\n**START MED FASE 1 I DAG** (2 timer):
\n\n
\n\n1. ✅ Kør `npm run leads:import` (10 min) - Get historical data
\n\n2. ✅ Implementer "search before send" (45 min) - Fix kritisk regel
\n\n3. ✅ Tilføj pricing constants (15 min) - Konsistens
\n\n4. ✅ Test alt (30 min) - Verificer det virker
\n\n
**Derefter bygger vi videre i morgen med Fase 2 & 3.**

Vil du have mig til at:

\n\n- **A)** Starte med lead import NU
\n\n- **B)** Implementere "search before send" først
\n\n- **C)** Lave en anden prioritering
\n\n
Hvad siger du? 🎯
