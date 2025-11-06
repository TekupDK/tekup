# Email Tab & Inbox - Status & Næste Skridt

**Dato:** 5. november 2025  
**Version:** 1.4.0  
**Status:** AI Features Complete ✅ | Pipeline Features Next 🎯

---

## ✅ Hvad er Færdigt

### Phase 1: Core Intelligence - AI Features ✅ COMPLETE

**Udviklet:** 3.5 timer (2h 45min implementation + 45min testing)  
**Status:** Production-ready, alle tests passing

#### ✅ 1.1: AI Email Summaries (Phase 1-3)

- **Implementeret:** 150-tegn resuméer på dansk med Gemini 2.0 Flash
- **Backend:** `server/ai-email-summary.ts` (318 lines)
  - Smart skip logic: <200 ord, newsletters, no-reply
  - 24-timers cache med TTL validation
  - Batch processing med rate limiting
  - Cost: $0.00008/email (~$0.08 per 1000 emails)
- **UI:** `EmailAISummary.tsx` (179 lines)
  - Shortwave-inspireret design med Sparkles icon
  - Skeleton loader under generering
  - Cache indicator med alder display
  - Error handling med retry knap
- **tRPC Endpoints:** 3 endpoints (get, generate, batch)
- **Tests:** 19 unit tests + 39 E2E tests = 58 tests ✅

#### ✅ 1.2: Smart Auto-Labeling (Phase 4-5)

- **Implementeret:** AI-powered label suggestions med confidence scoring
- **Backend:** `server/ai-label-suggestions.ts` (365 lines)
  - 5 kategorier: Lead 🟢, Booking 🔵, Finance 🟡, Support 🔴, Newsletter 🟣
  - Confidence threshold: auto-apply >85%, manuel 70-85%, skjul <70%
  - 24-timers cache for cost optimization
  - Cost: $0.00012/email (~$0.12 per 1000 emails)
- **UI:** `EmailLabelSuggestions.tsx` (278 lines)
  - Confidence badges (grøn/gul/grå)
  - Emoji indicators per kategori
  - Auto-apply knap for høj confidence
  - Manuel label selection med applied state tracking
  - Reason tooltips
- **tRPC Endpoints:** 3 endpoints (get, generate, apply)
- **Tests:** 39 unit tests + 55 E2E tests = 94 tests ✅

**Kombineret Cost:**

- Per email: $0.0002
- Per 1,000 emails: $0.20
- Månedlig (50 emails/dag): **$0.30** 🎯

---

## 🎯 Næste Skridt - Pipeline Features

### Phase 2: Pipeline Workflow (4-6 timer)

Dette er **næste prioritet** efter AI features er færdige.

#### 2.1 Pipeline Status View (2-3 timer)

**Hvad:** Shortwave-inspireret Kanban board med drag-and-drop

**UI Components at oprette:**

```
EmailPipelineBoard.tsx      (350-400 lines)
├── PipelineColumn.tsx      (150-200 lines)
├── EmailCard.tsx           (100-150 lines)
└── PipelineDragDrop.tsx    (200-250 lines)
```

**Features:**

- 5 kolonner: "Needs Action" | "Venter på svar" | "I kalender" | "Finance" | "Afsluttet"
- Drag-and-drop mellem stages (react-beautiful-dnd eller dnd-kit)
- Email counts per kolonne
- Visual feedback ved drag (highlight drop zones)
- Status badges med farver

**Backend:**

- Ny tabel: `email_pipeline_state` (thread_id, stage, source, metadata)
- tRPC endpoint: `updatePipelineStage(threadId, newStage)`
- tRPC endpoint: `getPipelineEmails(stage)`
- Real-time subscriptions (Supabase Realtime)

**Estimated Time:** 2-3 timer

---

#### 2.2 Smart Source Detection (1-2 timer)

**Hvad:** Auto-detect lead source fra email content/headers

**Detection Logic:**

```typescript
function detectLeadSource(email: Email): LeadSource {
  // Check from address
  if (email.from.includes("rengoring.nu")) return "rengoring_nu";
  if (email.from.includes("adhelp.dk")) return "adhelp";
  if (email.from.includes("rengoring-aarhus.dk")) return "rengoring_aarhus";

  // Check subject/body
  if (email.subject.includes("[Rengøring.nu]")) return "rengoring_nu";

  return "direct";
}
```

**Auto-Label Rules:**

- Rengøring.nu → Add "Rengøring.nu" label, Stage: "Needs Action"
- AdHelp → Add "AdHelp" label, Stage: "Needs Action"
- Direct → Add "Direct Lead" label, Stage: "Needs Action"

**Backend:**

- Ny kolonne: `email_pipeline_state.source`
- Auto-detect on email receive (webhook)
- Cache source detection results

**Estimated Time:** 1-2 timer

---

#### 2.3 Pipeline Quick Actions (1-2 timer)

**Hvad:** One-click actions til at flytte emails gennem pipeline

**Actions:**

```typescript
interface PipelineAction {
  label: string;
  icon: string;
  fromStage: string;
  toStage: string;
  sideEffects?: () => void;
}

const ACTIONS = {
  sendTilbud: {
    label: "Send Tilbud",
    fromStage: "needs_action",
    toStage: "venter_pa_svar",
    sideEffects: () => openEmailComposer({ template: "quote" }),
  },
  bekraeftBooking: {
    label: "Bekræft Booking",
    fromStage: "venter_pa_svar",
    toStage: "i_kalender",
    sideEffects: () => createCalendarEvent(),
  },
  sendFaktura: {
    label: "Send Faktura",
    fromStage: "i_kalender",
    toStage: "finance",
    sideEffects: () => createInvoice(),
  },
  afslut: {
    label: "Afslut",
    fromStage: "*",
    toStage: "afsluttet",
    sideEffects: () => archiveEmail(),
  },
};
```

**UI Integration:**

- Quick action buttons i EmailCard
- Keyboard shortcuts (1-4 keys)
- Context menu (right-click)
- Toast feedback med undo option

**Estimated Time:** 1-2 timer

---

### Phase 3: Workflow Automation (4-6 timer)

#### 3.1 Critical Rules Implementation (2-3 timer)

**Hvad:** Business logic for forskellige lead sources

**Rengøring.nu Rule:**

```typescript
// KRITISK: ALDRIG reply direkte til Rengøring.nu emails
if (email.source === "rengoring_nu") {
  // Extract customer email fra email body
  const customerEmail = extractCustomerEmail(email.body);

  // Opret NY email til kunden (IKKE reply til Rengøring.nu)
  openEmailComposer({
    to: customerEmail,
    subject: `Re: ${email.subject}`,
    template: "rengoring_nu_response",
  });

  // Warning hvis bruger forsøger at reply direkte
  showWarning("⚠️ Send IKKE svar til Rengøring.nu - send til kundens email!");
}
```

**AdHelp Rule:**

```typescript
// KRITISK: Send tilbud til KUNDENS email, IKKE til AdHelp
if (email.source === "adhelp") {
  const customerEmail = extractCustomerEmailFromBody(email.body);

  if (!customerEmail) {
    showError("Kunne ikke finde kundens email i beskeden");
    return;
  }

  openEmailComposer({
    to: customerEmail, // IKKE mw@adhelp.dk eller sp@adhelp.dk
    subject: `Tilbud - ${detectServiceType(email)}`,
    template: "adhelp_quote",
  });
}
```

**UI:**

- Warning modals for critical rules
- Email template selector
- Customer email extraction UI

**Estimated Time:** 2-3 timer

---

#### 3.2 Auto-Calendar Integration (1-2 timer)

**Hvad:** Auto-create calendar events når email flyttes til "I kalender"

**Trigger:**

```typescript
onPipelineStageChange(threadId, 'i_kalender', async (email) => {
  // Extract date/time fra email
  const dateTime = extractDateTime(email.body);

  if (!dateTime) {
    showModal({
      title: "Vælg dato/tid for booking",
      content: <DateTimePicker onSelect={createEvent} />
    });
    return;
  }

  // Create calendar event
  const event = await createCalendarEvent({
    summary: `${email.customerName} - ${email.serviceType}`,
    start: dateTime,
    duration: estimateDuration(email.serviceType),
    // KRITISK: NEVER add attendees (MEMORY_19)
  });

  // Link event til email thread
  await linkEmailToCalendar(threadId, event.id);

  showToast(`✅ Kalender-event oprettet: ${formatDate(dateTime)}`);
});
```

**Estimated Time:** 1-2 timer

---

#### 3.3 Auto-Invoice Integration (1-2 timer)

**Hvad:** Auto-create Billy invoice når email flyttes til "Finance"

**Trigger:**

```typescript
onPipelineStageChange(threadId, 'finance', async (email) => {
  // Extract opgave detaljer
  const { serviceType, hours, customer } = analyzeEmail(email);

  if (!hours) {
    showModal({
      title: "Angiv antal timer",
      content: <InvoiceDetailsForm onSubmit={createInvoice} />
    });
    return;
  }

  // Create invoice (draft-only - MEMORY_17)
  const invoice = await createBillyInvoice({
    customer: customer.billyId,
    lines: [{
      productId: getProductId(serviceType),
      quantity: hours,
      unitPrice: 349, // kr/time incl. moms
      description: serviceType
    }]
  });

  // Link invoice til email thread
  await linkEmailToInvoice(threadId, invoice.id);

  showToast(`✅ Faktura-draft oprettet: ${invoice.invoiceNo}`);
});
```

**Estimated Time:** 1-2 timer

---

## 📊 Samlet Tidsoversigt

### Færdigt ✅

- **Phase 1:** AI Features (3.5 timer) - COMPLETE

### Næste Prioritet 🎯

- **Phase 2:** Pipeline Workflow (4-6 timer)
  - 2.1 Pipeline Board: 2-3 timer
  - 2.2 Source Detection: 1-2 timer
  - 2.3 Quick Actions: 1-2 timer

### Derefter 🔜

- **Phase 3:** Workflow Automation (4-6 timer)
  - 3.1 Critical Rules: 2-3 timer
  - 3.2 Auto-Calendar: 1-2 timer
  - 3.3 Auto-Invoice: 1-2 timer

**Total estimeret tid tilbage:** 8-12 timer (ca. 1-1.5 arbejdsdage)

---

## 🚀 Anbefalede Næste Skridt

### Option A: Start Pipeline Features Nu (Anbefalet)

**Fordele:**

- Naturlig fortsættelse efter AI features
- Pipeline giver stor workflow value
- 4-6 timers focused arbejde

**Start med:**

1. Opret `EmailPipelineBoard.tsx` component
2. Setup drag-and-drop med dnd-kit
3. Opret `email_pipeline_state` tabel
4. Implementer stage transitions

### Option B: Test AI Features Grundigt Først

**Fordele:**

- Sikr at AI features virker perfekt i production
- Gather user feedback
- Fix bugs før nye features

**Gør:**

1. Deploy til production
2. Monitor AI costs og performance
3. Test med rigtige emails
4. Juster confidence thresholds hvis nødvendigt

### Option C: Fokus på Gmail Rate Limit Fix

**Hvis Gmail API problemer opstår:**

- Setup SMTP server (inbound-email)
- Configure email forwarding
- Migrér fra Gmail API til SMTP webhook

---

## 📝 Konklusion

**Hvad vi har:**

- ✅ AI Email Summaries (production-ready)
- ✅ Smart Auto-Labeling (production-ready)
- ✅ 152 tests (100% passing)
- ✅ Komplet dokumentation

**Hvad vi mangler:**

- 🎯 Pipeline workflow UI (4-6 timer)
- 🎯 Workflow automation (4-6 timer)
- 🔜 Email templates system (2-3 timer)
- 🔜 Advanced metrics/dashboard (4-6 timer)

**Anbefaling:**
Start med **Phase 2.1: Pipeline Board** - det giver størst business value og er en naturlig fortsættelse af det arbejde vi har lavet. Pipeline boardet vil gøre det meget nemmere for brugere at håndtere leads og følge op på emails gennem hele flowet.

---

**Næste Sprint:** Pipeline Workflow (Phase 2)  
**Estimeret tid:** 4-6 timer  
**Business value:** ⭐⭐⭐⭐⭐ (Høj - core workflow feature)

Vil du starte med pipeline features nu, eller vil du teste AI features først? 🚀
