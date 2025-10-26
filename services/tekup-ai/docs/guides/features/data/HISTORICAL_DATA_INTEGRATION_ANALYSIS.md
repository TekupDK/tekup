# 📊 Historisk Data & Faste Kunder Integration - Komplet Analyse\n\n\n\n**Dato**: 2. oktober 2025  
**Status**: Analyse & Implementeringsplan  
**Relevant Commits**:
\n\n- `ade5b2c` - AI Chat Quick Reference Guide\n\n- `3b2ca4d` - Mobile Improvements Documentation\n\n
---
\n\n## 🎯 Overordnet Scope\n\n\n\nVi skal integrere tre kritiske datasæt i RenOS:
\n\n1. **Historiske Leads** fra Gmail (Leadmail.no emails siden juli 2024)\n\n2. **Faste Kunder** med gentagende booking patterns\n\n3. **Fuldstændig integration** mellem RenOS ↔ Google Calendar ↔ Gmail\n\n
---
\n\n## 📋 Del 1: Historiske Leads Import\n\n\n\n### Nuværende Status ✅\n\n\n\n**Funktionalitet allerede implementeret**:

**Fil**: `src/tools/importHistoricalLeads.ts` (130 linjer)

**Features**:
\n\n- ✅ Henter alle Leadmail.no emails siden 1. juli 2024\n\n- ✅ Parser lead information (navn, email, telefon, adresse, m² etc.)\n\n- ✅ Opretter automatisk kunder hvis email findes\n\n- ✅ Undgår duplikater via `emailThreadId` matching\n\n- ✅ Håndterer fejl gracefully med detaljeret logging\n\n- ✅ Viser import progress og summary\n\n
**Import Process Flow**:
\n\n```\n\n1. Fetch Gmail messages (query: "from:leadmail.no")
   ↓\n\n2. Filter Leadmail emails (isLeadmailEmail check)
   ↓\n\n3. Parse lead data (parseLeadEmail)
   ↓\n\n4. Check for duplicates (emailThreadId)
   ↓\n\n5. Create/find customer (findOrCreateCustomer)
   ↓\n\n6. Save lead to database\n\n```
\n\n### Hvordan Man Kører Import 🚀\n\n\n\n**Metode 1: Direkte kommando** (ANBEFALET - ikke i package.json endnu):\n\n\n\n```powershell
npm run ts-node src/tools/importHistoricalLeads.ts\n\n```

**Metode 2: Via ts-node direkte**:
\n\n```powershell
npx ts-node src/tools/importHistoricalLeads.ts\n\n```

**Output eksempel**:
\n\n```
🔄 Starting Historical Lead Import

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Fetching emails from 01-07-2024 to 02-10-2025...

🔍 Fetching up to 500 Leadmail.no emails...

✅ Total emails fetched: 127

✅ Imported: Lars Nielsen - Privatrengøring (cmg9wvfp)\n\n✅ Imported: Maria Andersen - Erhverv (cmg9wvet)\n\n✅ Imported: Thomas Hansen - Flytterengøring (cmg9wvfs)\n\n...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Import Summary:
   ✅ Successfully imported: 127 leads
   ⏭️  Skipped (duplicates/non-leads): 23
   ❌ Errors: 0

✨ Historical lead import completed!\n\n```
\n\n### Data Mapping 📝\n\n\n\n**Leadmail.no Email → Database Lead**:

| Leadmail Field | RenOS Field | Type | Notes |
|----------------|-------------|------|-------|
| Navn | `name` | String | Kunde navn |
| Email | `email` | String | Bruges til customer lookup |
| Telefon | `phone` | String | Formateret +45 XX XX XX XX |
| Adresse | `address` | String | Fuld adresse |
| Kvadratmeter | `squareMeters` | Float | Boligens størrelse |
| Antal rum | `rooms` | Int | Antal værelser |
| Opgavetype | `taskType` | String | Privatrengøring, Erhverv, etc. |
| Ønskede datoer | `preferredDates` | String[] | Array af ISO dates |
| Kilde | `source` | String | "Leadmail.no" |
| Gmail Thread ID | `emailThreadId` | String | Til duplikat-check |
| Modtaget dato | `createdAt` | DateTime | Fra email timestamp |
\n\n### Mangler at Blive Tilføjet ⚠️\n\n\n\n**1. Package.json Script** (let at fixe):\n\n\n\n```json
"leads:import": "ts-node src/tools/importHistoricalLeads.ts"\n\n```

**2. Command-line Arguments** (enhancement):\n\n\n\n```typescript
// Eksempel: Kun importer fra specifik dato
const startDate = process.argv[2] 
  ? new Date(process.argv[2]) 
  : new Date("2024-07-01");

// Brug:
// npm run leads:import 2024-09-01\n\n```

**3. Dry-run Mode** (sikkerhed):\n\n\n\n```typescript
const dryRun = process.argv.includes('--dry-run');

if (dryRun) {
  console.log("🔍 DRY-RUN MODE: Vil ikke oprette leads");
  // Log what would be created without saving
}\n\n```

**4. Progress Bar** (UX forbedring):\n\nKunne bruge `cli-progress` package til visuelt feedback ved store imports.

---
\n\n## 👥 Del 2: Faste Kunder & Gentagende Bookings\n\n\n\n### Nuværende Status ⚠️\n\n\n\n**DELVIST IMPLEMENTERET** - Mangler recurring scheduling system\n\n\n\n### Hvad Vi Har ✅\n\n\n\n**Database Schema** (`prisma/schema.prisma`):\n\n\n\n- ✅ `Customer` model med status tracking\n\n- ✅ `Booking` model med start/end time\n\n- ✅ Customer stats: `totalBookings`, `totalRevenue`\n\n- ✅ Booking status: scheduled, confirmed, completed, cancelled\n\n
**Calendar Integration** (`src/services/calendarService.ts`):\n\n\n\n- ✅ `createCalendarEvent()` - Opretter Google Calendar events\n\n- ✅ `updateCalendarEvent()` - Opdaterer events\n\n- ✅ `deleteCalendarEvent()` - Sletter events\n\n- ✅ `findAvailability()` - Tjekker busy/free tider\n\n- ✅ `findNextAvailableSlot()` - Finder næste ledige slot\n\n- ✅ Conflict detection - Undgår dobbeltbooking\n\n
**Gmail Integration** (`src/services/gmailService.ts`):\n\n\n\n- ✅ `sendGenericEmail()` - Sender bekræftelsesmails\n\n- ✅ `searchThreads()` - Finder email tråde med kunder\n\n- ✅ Thread-aware emails - Svarer i samme tråd\n\n- ✅ Dry-run mode - Test uden at sende\n\n\n\n### Hvad Vi MANGLER ❌\n\n\n\n**1. Recurring Schedule i Database Schema**

Foreslået udvidelse til `Booking` model:
\n\n```prisma
model Booking {
  // ... existing fields ...
  
  // Recurring schedule fields
  isRecurring        Boolean   @default(false)
  recurringPattern   String?   // "weekly", "biweekly", "monthly"
  recurringInterval  Int?      // Hver X uger/måneder
  recurringDayOfWeek Int?      // 0-6 (Søndag-Lørdag)
  recurringEndDate   DateTime? // Hvornår stopper gentagelser
  parentBookingId    String?   // Link til original recurring booking
  
  // Relations
  parentBooking      Booking?  @relation("RecurringBookings", fields: [parentBookingId], references: [id])
  childBookings      Booking[] @relation("RecurringBookings")
  
  // ... rest of fields ...
}\n\n```

**2. Recurring Booking Service**

Ny fil: `src/services/recurringBookingService.ts`
\n\n```typescript
import { prisma } from "./databaseService";
import { createCalendarEvent, CalendarEventInput } from "./calendarService";
import { sendGenericEmail } from "./gmailService";
import { logger } from "../logger";

export interface RecurringBookingInput {
  customerId: string;
  serviceType: string;
  address: string;
  startTime: Date; // Første booking tidspunkt
  duration: number; // Minutes
  pattern: "weekly" | "biweekly" | "monthly";
  dayOfWeek: number; // 0-6 (Søndag-Lørdag)
  endDate?: Date; // Valgfri slutdato
  calendarId?: string;
}

/**
 * Opretter en gentagende booking med alle fremtidige instanser\n\n */
export async function createRecurringBooking(
  input: RecurringBookingInput
): Promise<{ parentId: string; bookingsCreated: number }> {
  
  // 1. Opret parent booking
  const parentBooking = await prisma.booking.create({
    data: {
      customerId: input.customerId,
      serviceType: input.serviceType,
      address: input.address,
      startTime: input.startTime,
      endTime: new Date(input.startTime.getTime() + input.duration * 60000),\n\n      estimatedDuration: input.duration,
      status: "confirmed",
      isRecurring: true,
      recurringPattern: input.pattern,
      recurringDayOfWeek: input.dayOfWeek,
      recurringEndDate: input.endDate,
    },
  });

  // 2. Beregn alle fremtidige datoer
  const futureDates = calculateRecurringDates(
    input.startTime,
    input.pattern,
    input.dayOfWeek,
    input.endDate
  );

  // 3. Opret child bookings + calendar events\n\n  let createdCount = 0;
  
  for (const date of futureDates) {
    const endTime = new Date(date.getTime() + input.duration * 60000);\n\n    
    // Opret booking i database
    const childBooking = await prisma.booking.create({
      data: {
        customerId: input.customerId,
        parentBookingId: parentBooking.id,
        serviceType: input.serviceType,
        address: input.address,
        startTime: date,
        endTime: endTime,
        estimatedDuration: input.duration,
        status: "scheduled",
      },
    });

    // Opret calendar event
    try {
      const calendarEvent = await createCalendarEvent({
        summary: `${input.serviceType} - Fast kunde`,\n\n        description: `Gentagende rengøring for kunde ID: ${input.customerId}`,
        location: input.address,
        start: { dateTime: date.toISOString() },
        end: { dateTime: endTime.toISOString() },
        calendarId: input.calendarId,
      });

      // Gem calendar event ID
      await prisma.booking.update({
        where: { id: childBooking.id },
        data: { 
          calendarEventId: calendarEvent.id,
          calendarLink: calendarEvent.htmlLink,
        },
      });

      createdCount++;
      
    } catch (error) {
      logger.error(
        { error, bookingId: childBooking.id, date }, 
        "Failed to create calendar event for recurring booking"
      );
    }
  }

  // 4. Send bekræftelsesmail til kunden
  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId },
  });

  if (customer?.email) {
    await sendGenericEmail({
      to: customer.email,
      subject: `Bekræftelse på gentagende rengøring`,
      body: `
Hej ${customer.name},

Din gentagende rengøring er nu oprettet i kalenderen!

📅 Start: ${input.startTime.toLocaleDateString('da-DK')}
🔄 Mønster: ${translatePattern(input.pattern)}
📍 Adresse: ${input.address}
⏱️ Varighed: ${input.duration} minutter

Antal bookings oprettet: ${createdCount + 1}\n\n
Med venlig hilsen,
Rendetalje.dk
      `.trim(),
    });
  }

  logger.info(
    { parentId: parentBooking.id, bookingsCreated: createdCount }, 
    "Recurring booking created successfully"
  );

  return {
    parentId: parentBooking.id,
    bookingsCreated: createdCount + 1,\n\n  };
}

/**
 * Beregner alle fremtidige datoer for recurring booking\n\n */
function calculateRecurringDates(
  startDate: Date,
  pattern: "weekly" | "biweekly" | "monthly",
  dayOfWeek: number,
  endDate?: Date
): Date[] {
  const dates: Date[] = [];
  const maxDate = endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 år default\n\n  
  let currentDate = new Date(startDate);
  
  // Start fra næste interval
  switch (pattern) {
    case "weekly":
      currentDate.setDate(currentDate.getDate() + 7);\n\n      break;
    case "biweekly":
      currentDate.setDate(currentDate.getDate() + 14);\n\n      break;
    case "monthly":
      currentDate.setMonth(currentDate.getMonth() + 1);\n\n      break;
  }

  // Generer datoer indtil slutdato
  while (currentDate <= maxDate) {
    dates.push(new Date(currentDate));
    
    switch (pattern) {
      case "weekly":
        currentDate.setDate(currentDate.getDate() + 7);\n\n        break;
      case "biweekly":
        currentDate.setDate(currentDate.getDate() + 14);\n\n        break;
      case "monthly":
        currentDate.setMonth(currentDate.getMonth() + 1);\n\n        break;
    }
    
    // Safety limit: max 100 bookings
    if (dates.length >= 100) break;
  }

  return dates;
}

function translatePattern(pattern: string): string {
  const translations: Record<string, string> = {
    weekly: "Ugentlig",
    biweekly: "Hver 14. dag",
    monthly: "Månedlig",
  };
  return translations[pattern] || pattern;
}

/**
 * Opdaterer en recurring booking serie\n\n */
export async function updateRecurringBooking(
  parentId: string,
  updates: Partial<RecurringBookingInput>
): Promise<number> {
  // Hent alle child bookings der ikke er completed
  const childBookings = await prisma.booking.findMany({
    where: {
      parentBookingId: parentId,
      status: { not: "completed" },
    },
  });

  let updatedCount = 0;

  for (const booking of childBookings) {
    // Opdater booking
    if (updates.serviceType || updates.address || updates.duration) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          ...(updates.serviceType && { serviceType: updates.serviceType }),
          ...(updates.address && { address: updates.address }),
          ...(updates.duration && {
            estimatedDuration: updates.duration,
            endTime: new Date(
              booking.startTime!.getTime() + updates.duration * 60000\n\n            ),
          }),
        },
      });
    }

    // Opdater calendar event hvis det eksisterer
    if (booking.calendarEventId && updates.duration) {
      // TODO: Implementer updateCalendarEvent kald
      updatedCount++;
    }
  }

  logger.info(
    { parentId, updatedCount }, 
    "Updated recurring booking series"
  );

  return updatedCount;
}

/**
 * Annullerer alle fremtidige bookings i en serie\n\n */
export async function cancelRecurringBooking(
  parentId: string,
  cancelFrom?: Date
): Promise<number> {
  const cancelDate = cancelFrom || new Date();

  // Find alle fremtidige bookings
  const bookingsToCancel = await prisma.booking.findMany({
    where: {
      parentBookingId: parentId,
      startTime: { gte: cancelDate },
      status: { notIn: ["completed", "cancelled"] },
    },
  });

  let cancelledCount = 0;

  for (const booking of bookingsToCancel) {
    // Sæt status til cancelled
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "cancelled" },
    });

    // Slet calendar event
    if (booking.calendarEventId) {
      // TODO: Implementer deleteCalendarEvent kald
    }

    cancelledCount++;
  }

  // Send bekræftelsesmail
  const parentBooking = await prisma.booking.findUnique({
    where: { id: parentId },
    include: { customer: true },
  });

  if (parentBooking?.customer?.email) {
    await sendGenericEmail({
      to: parentBooking.customer.email,
      subject: "Gentagende rengøring annulleret",
      body: `
Hej ${parentBooking.customer.name},

Din gentagende rengøring er blevet annulleret.

Antal bookings annulleret: ${cancelledCount}

Med venlig hilsen,
Rendetalje.dk
      `.trim(),
    });
  }

  logger.info(
    { parentId, cancelledCount }, 
    "Cancelled recurring booking series"
  );

  return cancelledCount;
}\n\n```

**3. CLI Tool til Faste Kunder**

Ny fil: `src/tools/recurringBookingTool.ts`
\n\n```typescript
import { createRecurringBooking, updateRecurringBooking, cancelRecurringBooking } from "../services/recurringBookingService";
import { prisma } from "../services/databaseService";

const command = process.argv[2];

async function main() {
  switch (command) {
    case "create":
      // npm run recurring:create <customerId> <serviceType> <pattern>
      await handleCreate();
      break;
    
    case "list":
      // npm run recurring:list [customerId]
      await handleList();
      break;
    
    case "update":
      // npm run recurring:update <parentId>
      await handleUpdate();
      break;
    
    case "cancel":
      // npm run recurring:cancel <parentId>
      await handleCancel();
      break;
    
    default:
      console.log(`
Recurring Booking Management Tool

Commands:
  create <customerId> <serviceType> <pattern>  - Opret gentagende booking\n\n  list [customerId]                            - List recurring bookings\n\n  update <parentId>                            - Opdater serie\n\n  cancel <parentId>                            - Annuller serie\n\n      `);
  }
}

async function handleCreate() {
  const customerId = process.argv[3];
  const serviceType = process.argv[4];
  const pattern = process.argv[5] as "weekly" | "biweekly" | "monthly";
  
  if (!customerId || !serviceType || !pattern) {
    console.error("Usage: npm run recurring:create <customerId> <serviceType> <pattern>");
    return;
  }

  // Find customer for address
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    console.error(`❌ Customer not found: ${customerId}`);
    return;
  }

  // Create recurring booking starting next week
  const startTime = new Date();
  startTime.setDate(startTime.getDate() + 7);\n\n  startTime.setHours(10, 0, 0, 0); // 10:00 default

  const result = await createRecurringBooking({
    customerId,
    serviceType,
    address: customer.address || "Ingen adresse",
    startTime,
    duration: 120, // 2 timer default
    pattern,
    dayOfWeek: startTime.getDay(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 år frem\n\n  });

  console.log(`✅ Recurring booking created!`);
  console.log(`   Parent ID: ${result.parentId}`);
  console.log(`   Bookings created: ${result.bookingsCreated}`);
}

async function handleList() {
  const customerId = process.argv[3];

  const where = customerId 
    ? { customerId, isRecurring: true, parentBookingId: null }
    : { isRecurring: true, parentBookingId: null };

  const recurringBookings = await prisma.booking.findMany({
    where,
    include: {
      customer: true,
      childBookings: {
        where: { status: { notIn: ["completed", "cancelled"] } },
        orderBy: { startTime: "asc" },
        take: 5,
      },
    },
  });

  console.log(`\n📋 Recurring Bookings (${recurringBookings.length})\n`);

  for (const booking of recurringBookings) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`ID: ${booking.id}`);
    console.log(`Customer: ${booking.customer?.name || "Unknown"}`);
    console.log(`Service: ${booking.serviceType}`);
    console.log(`Pattern: ${booking.recurringPattern}`);
    console.log(`Next ${booking.childBookings.length} bookings:`);
    
    for (const child of booking.childBookings) {
      console.log(`  - ${child.startTime?.toLocaleString('da-DK')} (${child.status})`);\n\n    }
  }
}

async function handleUpdate() {
  // Implementation...
  console.log("Update functionality to be implemented");
}

async function handleCancel() {
  const parentId = process.argv[3];
  
  if (!parentId) {
    console.error("Usage: npm run recurring:cancel <parentId>");
    return;
  }

  const count = await cancelRecurringBooking(parentId);
  console.log(`✅ Cancelled ${count} bookings`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });\n\n```

**4. Package.json Scripts**

Tilføj til `scripts` sektion:
\n\n```json
{
  "recurring:create": "ts-node src/tools/recurringBookingTool.ts create",
  "recurring:list": "ts-node src/tools/recurringBookingTool.ts list",
  "recurring:update": "ts-node src/tools/recurringBookingTool.ts update",
  "recurring:cancel": "ts-node src/tools/recurringBookingTool.ts cancel"
}\n\n```

---
\n\n## 🔄 Del 3: Sammenspil RenOS ↔ Google Calendar ↔ Gmail\n\n\n\n### Nuværende Integration Status ✅\n\n\n\n**GODT IMPLEMENTERET** - Men kan optimeres\n\n\n\n### Dataflow Diagram\n\n\n\n```\n\n┌─────────────┐
│   RenOS     │
│  Database   │
└──────┬──────┘
       │
       ├─────────────────────┐
       │                     │
       ▼                     ▼
┌─────────────┐       ┌─────────────┐
│   Google    │◄─────►│    Gmail    │
│  Calendar   │       │     API     │
└─────────────┘       └─────────────┘
       │                     │
       │                     │
       └──────────┬──────────┘
                  │
                  ▼
           ┌──────────────┐
           │   Customer   │
           │    Email     │
           └──────────────┘\n\n```
\n\n### Integration Points\n\n\n\n**1. Lead → Booking → Calendar Event**
\n\n```typescript
// Current flow:\n\n1. Lead kommer ind via Leadmail.no email\n\n2. RenOS parser lead data\n\n3. Gemmes i database (Lead model)\n\n4. Dashboard: Administrator laver tilbud (Quote)\n\n5. Tilbud accepteret → Opretter Booking\n\n6. Booking.create trigger:
   - Kalder createCalendarEvent()\n\n   - Sender bekræftelses-email via sendGenericEmail()\n\n   - Gemmer calendarEventId og calendarLink i booking\n\n```

**Kode eksempel** (eksisterende i `src/api/bookingRoutes.ts`):\n\n\n\n```typescript
// POST /api/bookings
router.post("/", async (req: Request, res: Response) => {
  const { leadId, serviceType, startTime, duration } = req.body;

  // 1. Opret booking i database
  const booking = await prisma.booking.create({
    data: {
      leadId,
      serviceType,
      startTime: new Date(startTime),
      endTime: new Date(new Date(startTime).getTime() + duration * 60000),\n\n      estimatedDuration: duration,
      status: "scheduled",
    },
    include: { lead: true },
  });

  // 2. Opret Google Calendar event
  const calendarEvent = await createCalendarEvent({
    summary: `${serviceType} - ${booking.lead?.name}`,\n\n    description: `Booking for ${booking.lead?.name}`,
    location: booking.lead?.address || "",
    start: { dateTime: booking.startTime!.toISOString() },
    end: { dateTime: booking.endTime!.toISOString() },
  });

  // 3. Opdater booking med calendar info
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      calendarEventId: calendarEvent.id,
      calendarLink: calendarEvent.htmlLink,
    },
  });

  // 4. Send bekræftelsesmail
  if (booking.lead?.email) {
    await sendGenericEmail({
      to: booking.lead.email,
      subject: "Bekræftelse på rengøring",
      body: `Din booking er bekræftet for ${new Date(startTime).toLocaleString('da-DK')}`,
    });
  }

  res.json(booking);
});\n\n```

**2. Calendar Event Updates → Database Sync**

**MANGLER**: Webhook listener for Google Calendar changes

Når nogen ændrer i Google Calendar (reschedule, cancel), skal RenOS opdateres.

**Løsning**: Google Calendar Push Notifications
\n\n```typescript
// Ny fil: src/services/calendarWebhook.ts

import { google } from "googleapis";
import { getGoogleAuthClient } from "./googleAuth";
import { prisma } from "./databaseService";
import { logger } from "../logger";

/**
 * Setup Google Calendar push notifications\n\n */
export async function setupCalendarWebhook(
  calendarId: string,
  webhookUrl: string
): Promise<void> {
  const auth = getGoogleAuthClient([
    "https://www.googleapis.com/auth/calendar",
  ]);
  const calendar = google.calendar({ version: "v3", auth });

  // Subscribe to calendar events
  const channel = await calendar.events.watch({
    calendarId,
    requestBody: {
      id: `renos-webhook-${Date.now()}`,
      type: "web_hook",
      address: webhookUrl, // https://tekup-renos.onrender.com/api/calendar/webhook
      expiration: (Date.now() + 7 * 24 * 60 * 60 * 1000).toString(), // 7 dage\n\n    },
  });

  logger.info({ channel: channel.data }, "Calendar webhook setup");
}

/**
 * Handle calendar webhook notifications\n\n */
export async function handleCalendarWebhook(
  calendarId: string,
  resourceId: string,
  resourceState: string // "sync", "exists", "not_exists"
): Promise<void> {
  
  if (resourceState === "not_exists") {
    // Event deleted in Google Calendar
    logger.info({ calendarId, resourceId }, "Calendar event deleted externally");
    
    // Find booking and mark as cancelled
    const booking = await prisma.booking.findFirst({
      where: { calendarEventId: resourceId },
    });

    if (booking) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: "cancelled" },
      });
    }
  }

  if (resourceState === "exists") {
    // Event updated - fetch latest data and sync\n\n    // TODO: Implement full sync logic
  }
}\n\n```

**3. Gmail Thread → Customer Linking**

**GODT IMPLEMENTERET** i `src/services/emailIngestWorker.ts`\n\n
Features:
\n\n- ✅ Automatic email ingestion fra Gmail\n\n- ✅ Thread matching med customers via email\n\n- ✅ Heuristic matching (domain-based, confidence score)\n\n- ✅ EmailThread og EmailMessage models\n\n
**Forbedringer**:
\n\n```typescript
// Tilføj til src/services/emailIngestWorker.ts

/**
 * Auto-respond til nye lead emails\n\n */
async function autoRespondToNewLeads(message: GmailMessageSummary): Promise<void> {
  // Check if it's from Leadmail.no
  if (!message.from?.includes("leadmail.no")) {
    return;
  }

  // Parse lead
  const lead = parseLeadEmail(message);
  if (!lead) return;

  // Check if we already responded
  const existingResponse = await prisma.emailResponse.findFirst({
    where: { 
      leadId: lead.id,
      status: { in: ["sent", "approved"] },
    },
  });

  if (existingResponse) {
    return; // Already responded
  }

  // Generate AI response
  const response = await generateEmailResponse(lead);

  // Save as pending (requires approval)
  await prisma.emailResponse.create({
    data: {
      leadId: lead.id,
      subject: response.subject,
      body: response.body,
      status: "pending",
    },
  });

  logger.info({ leadId: lead.id }, "Auto-response generated (pending approval)");
}\n\n```

---
\n\n## 📊 Del 4: Komplet Implementation Roadmap\n\n\n\n### Fase 1: Historiske Leads (1-2 timer) 🟢 KLAR\n\n\n\n**Tasks**:
\n\n1. ✅ Code allerede implementeret\n\n2. ⚠️ Tilføj package.json script\n\n3. ⚠️ Test import med dry-run mode\n\n4. ⚠️ Kør fuld import

**Commands**:
\n\n```powershell\n\n# Test (efter tilføjelse til package.json)\n\nnpm run leads:import -- --dry-run\n\n\n\n# Fuld import\n\nnpm run leads:import\n\n\n\n# Verificer\n\nnpm run customer:list\n\n```\n\n\n\n### Fase 2: Database Schema Update (30 min) 🟡 LET\n\n\n\n**Tasks**:
\n\n1. Opdater `prisma/schema.prisma` med recurring fields\n\n2. Kør migration: `npm run db:migrate`\n\n3. Opdater Prisma client: `npm run db:generate`

**Migration**:
\n\n```powershell
npx prisma migrate dev --name add_recurring_bookings\n\n```
\n\n### Fase 3: Recurring Booking Service (3-4 timer) 🔴 KOMPLEKS\n\n\n\n**Tasks**:
\n\n1. Implementer `src/services/recurringBookingService.ts`\n\n2. Implementer `src/tools/recurringBookingTool.ts`\n\n3. Tilføj package.json scripts\n\n4. Test med en test-kunde\n\n5. Verificer i Google Calendar

**Testing**:
\n\n```powershell\n\n# Opret recurring booking\n\nnpm run recurring:create <customerId> "Privatrengøring" "weekly"\n\n\n\n# List alle\n\nnpm run recurring:list\n\n\n\n# Verificer i calendar\n\nnpm run booking:list\n\n```\n\n\n\n### Fase 4: Calendar Webhook Integration (2-3 timer) 🔴 KOMPLEKS\n\n\n\n**Tasks**:
\n\n1. Implementer `src/services/calendarWebhook.ts`\n\n2. Tilføj webhook endpoint i `src/api/calendarRoutes.ts`\n\n3. Setup webhook på Render.com domain\n\n4. Test med manuel calendar ændring

**Setup**:
\n\n```typescript
// src/api/calendarRoutes.ts
router.post("/webhook", async (req: Request, res: Response) => {
  const channelId = req.headers["x-goog-channel-id"];
  const resourceState = req.headers["x-goog-resource-state"];
  
  await handleCalendarWebhook(
    "primary",
    channelId as string,
    resourceState as string
  );

  res.sendStatus(200);
});\n\n```
\n\n### Fase 5: Email Auto-Response Enhancement (1-2 timer) 🟡 LET\n\n\n\n**Tasks**:
\n\n1. Tilføj auto-response til email ingest worker\n\n2. Test med nye lead emails\n\n3. Verificer approval workflow

---
\n\n## 🎯 Prioriteret Action Plan\n\n\n\n### HØJESTE PRIORITET (Gør I DAG) ⚡\n\n\n\n**1. Importer Historiske Leads**
\n\n```powershell\n\n# Step 1: Tilføj script til package.json\n\n"leads:import": "ts-node src/tools/importHistoricalLeads.ts"\n\n\n\n# Step 2: Kør import\n\nnpm run leads:import\n\n\n\n# Step 3: Verificer\n\nnpm run customer:list\n\n```\n\n
**Expected Impact**:
\n\n- ~100-200 historiske leads tilføjet til systemet\n\n- Fuld lead history tilgængelig i dashboard\n\n- Bedre data til beslutninger\n\n
**2. Database Migration for Recurring**
\n\n```powershell\n\n# Opdater schema (se Fase 2)\n\nnpx prisma migrate dev --name add_recurring_bookings\n\n```\n\n\n\n### MEDIUM PRIORITET (Denne Uge) 📅\n\n\n\n**3. Implementer Recurring Booking Service**
\n\n- Følg Fase 3 implementering\n\n- Start med simple weekly bookings\n\n- Test med 2-3 faste kunder\n\n
**4. Opret Faste Kunder Manuelt**
\n\n```powershell\n\n# Find kunder med mange bookings\n\nnpm run customer:stats\n\n\n\n# Opret recurring for dem\n\nnpm run recurring:create <customerId> "Privatrengøring" "weekly"\n\n```\n\n\n\n### LAV PRIORITET (Næste Uge) 📝\n\n\n\n**5. Calendar Webhook**
\n\n- Implementer webhook listener\n\n- Setup på production\n\n- Test sync\n\n
**6. Enhanced Email Auto-Response**
\n\n- Integrer med email ingest\n\n- Test approval workflow\n\n
---
\n\n## 📈 Success Metrics\n\n\n\n**Efter Fase 1 (Historiske Leads)**:
\n\n- [ ] Minimum 100 leads importeret\n\n- [ ] Ingen duplikater\n\n- [ ] Alle customers linket korrekt\n\n
**Efter Fase 3 (Recurring Bookings)**:
\n\n- [ ] Minimum 10 faste kunder med recurring bookings\n\n- [ ] Alle bookings synkroniseret til Google Calendar\n\n- [ ] Bekræftelsesmails sendt automatisk\n\n
**Efter Fase 4 (Calendar Webhook)**:
\n\n- [ ] Ændringer i Google Calendar reflekteres i RenOS\n\n- [ ] Ingen double-booking issues\n\n- [ ] Real-time sync working\n\n
---
\n\n## 🚀 Getting Started - Næste Steps\n\n\n\n**STEP 1**: Tilføj leads:import script
\n\n```powershell\n\n# Rediger package.json\n\n# Tilføj under "scripts":\n\n"leads:import": "ts-node src/tools/importHistoricalLeads.ts",\n\n"leads:import:dry": "ts-node src/tools/importHistoricalLeads.ts --dry-run"\n\n```

**STEP 2**: Test import (dry-run)
\n\n```powershell
npm run leads:import:dry\n\n```

**STEP 3**: Kør fuld import
\n\n```powershell
npm run leads:import\n\n```

**STEP 4**: Verificer resultater
\n\n```powershell\n\n# Check dashboard\n\nnpm run customer:list\n\nnpm run customer:stats
\n\n# Check database\n\nnpm run db:studio\n\n```\n\n
---

**Dokumentet Oprettet**: 2. oktober 2025, 23:40 CET  
**Status**: Klar til implementering  
**Estimeret Tid**: 8-12 timer total arbejde  
**Prioritet**: HØJESTE - Start med lead import
