# 🎯 Rendetalje Business Logic Implementation Plan\n\n\n\n**Baseret på MEMORY_1-17 Real Case Analysis**
\n\n## 📊 Executive Summary\n\n\n\n**Current State:** Friday AI kan håndtere ~25% af daglige interaktioner selvstændigt
**Target State:** 85-90% selvstændig håndtering efter fuld implementation
**Total Effort:** ~35-45 timer fordelt over 3 sprints\n\n
---
\n\n## 🚨 SPRINT 1: KRITISKE SIKKERHEDSLAG (Uge 1)\n\n\n\n### Formål: Undgå pinlige fejl og tab af kunder\n\n\n\n**Estimeret tid:** 8-10 timer | **Impact:** 25% → 55% capability\n\n\n\n### Task 1.1: Dobbelt-Tilbud Prevention 🚫\n\n\n\n**Prioritet:** ⭐⭐⭐⭐⭐ | **Tid:** 2-3 timer | **Kompleksitet:** Medium\n\n
**Problem:**
\n\n```
"TJEK ALTID først om vi allerede har sendt tilbud til kunden 
før jeg skriver nye tilbud - undgå dobbelt-tilbud!"\n\n```

**Implementation:**
\n\n```typescript
// src/services/duplicateDetectionService.ts
export async function checkExistingQuotes(customerEmail: string) {
  // Search Gmail for existing quotes
  const existing = await gmailService.searchMessages({
    query: `to:${customerEmail} OR from:${customerEmail}`,
    labels: ['SENT'],
    after: subtractDays(new Date(), 60), // Last 60 days
  });

  // Analyze for quote keywords
  const quotes = existing.filter(msg => 
    msg.snippet.includes('tilbud') || 
    msg.snippet.includes('pris') ||
    msg.snippet.includes('kr')
  );

  if (quotes.length > 0) {
    return {
      hasDuplicate: true,
      lastQuoteDate: quotes[0].date,
      threadId: quotes[0].threadId,
      snippet: quotes[0].snippet.substring(0, 100)
    };
  }

  return { hasDuplicate: false };
}\n\n```

**Integration i Friday:**
\n\n```typescript
// src/services/emailResponseGenerator.ts
async generateQuoteEmail(lead: ParsedLead) {
  // MANDATORY CHECK FIRST
  const dupCheck = await checkExistingQuotes(lead.email);
  
  if (dupCheck.hasDuplicate) {
    logger.warn({ 
      email: lead.email, 
      lastQuote: dupCheck.lastQuoteDate 
    }, "Duplicate quote detected");
    
    return {
      shouldSend: false,
      reason: `Allerede sendt tilbud d. ${dupCheck.lastQuoteDate}`,
      existingThread: dupCheck.threadId,
      suggestion: "Svar i existing thread eller vent 7+ dage"\n\n    };
  }

  // Continue with quote generation...
}\n\n```

**Test Cases:**
\n\n- [ ] Ny kunde (ingen historik) → OK to send\n\n- [ ] Existing quote <7 days → BLOCK\n\n- [ ] Existing quote >30 days → WARN but allow\n\n- [ ] Multiple threads → Show all, ask confirmation\n\n
---
\n\n### Task 1.2: Lead Source Rules 📧\n\n\n\n**Prioritet:** ⭐⭐⭐⭐⭐ | **Tid:** 1 time | **Kompleksitet:** Lav\n\n
**Problem:**
\n\n```
Rengøring.nu (via Leadmail.no): ALDRIG svar direkte!
Rengøring Aarhus (Leadpoint.dk): Svar normalt
AdHelp: ALDRIG til mw@/sp@adhelp.dk, kun til kunde\n\n```

**Implementation:**
\n\n```typescript
// src/config/leadSourceRules.ts
export const LEAD_SOURCE_RULES = {
  "rengoring.nu": {
    identifier: ["@leadmail.no", "rengoring.nu"],
    canReplyDirect: false,
    action: "CREATE_NEW_EMAIL",
    replyTo: "CUSTOMER_EMAIL_ONLY",
    reason: "Leadmail.no forwarding system - de sender ikke videre",\n\n    instruction: "Hent kundens email fra lead body og opret NY email til dem"
  },
  
  "rengoring-aarhus": {
    identifier: ["@leadpoint.dk", "rengoring-aarhus"],
    canReplyDirect: true,
    action: "REPLY_NORMALLY",
    reason: "Leadpoint sender replies videre til kunde"
  },
  
  "adhelp": {
    identifier: ["@adhelp.dk"],
    canReplyDirect: false,
    action: "CREATE_NEW_EMAIL",
    replyTo: "CUSTOMER_EMAIL_ONLY",
    blacklist: ["mw@adhelp.dk", "sp@adhelp.dk"],
    reason: "AdHelp er aggregator - svar kun til kundens direkte email"\n\n  }
};

export function getLeadSourceRule(fromEmail: string, subject?: string): LeadSourceRule {
  // Check each rule
  for (const [source, rule] of Object.entries(LEAD_SOURCE_RULES)) {
    if (rule.identifier.some(id => fromEmail.includes(id) || subject?.includes(id))) {
      return { source, ...rule };
    }
  }
  
  // Default: unknown source, reply normally but warn
  return {
    source: "unknown",
    canReplyDirect: true,
    action: "REPLY_WITH_WARNING",
    reason: "Unknown lead source - verify before sending"\n\n  };
}\n\n```

**Integration:**
\n\n```typescript
// src/services/emailAutoResponseService.ts
async function handleNewLead(lead: ParsedLead, originalMessage: GmailMessage) {
  const sourceRule = getLeadSourceRule(originalMessage.from, originalMessage.subject);
  
  logger.info({ source: sourceRule.source, rule: sourceRule }, "Lead source detected");
  
  if (!sourceRule.canReplyDirect) {
    // Extract customer email from lead body
    const customerEmail = lead.email || extractEmailFromBody(originalMessage.body);
    
    if (!customerEmail) {
      logger.error("Cannot create new email - no customer email found");\n\n      return {
        error: "Mangler kunde email",
        action: "Manuel håndtering nødvendig"
      };
    }
    
    // Create NEW email to customer (not reply)
    return {
      action: "CREATE_NEW_EMAIL",
      to: customerEmail,
      subject: `Tilbud på ${lead.taskType || 'rengøring'}`,
      reason: sourceRule.reason,
      originalLeadRef: originalMessage.id
    };
  }
  
  // Normal reply flow...
}\n\n```

---
\n\n### Task 1.3: Mandatory Time Check 🕐\n\n\n\n**Prioritet:** ⭐⭐⭐⭐⭐ | **Tid:** 3-4 timer | **Kompleksitet:** Medium\n\n
**Problem:**
\n\n```
"Jeg laver ofte fejl ved at forskyde datoer med én dag"
"KRITISK: Før jeg svarer på NOGET med datoer, SKAL jeg 
tjekke actual current time FØRST. INGEN UNDTAGELSER."\n\n```

**Implementation:**
\n\n```typescript
// src/services/dateTimeService.ts
import { logger } from "../logger";

export interface CurrentDateTime {
  iso: string;
  date: string; // "2025-10-03"
  time: string; // "14:32"
  dayOfWeek: string; // "Torsdag"
  dayOfMonth: number; // 3
  month: string; // "Oktober"
  monthNumber: number; // 10
  year: number; // 2025
  week: number; // 40
  timezone: string; // "Europe/Copenhagen"
}

let _cachedTime: CurrentDateTime | null = null;
let _cacheTimestamp: number = 0;
const CACHE_TTL = 60000; // 1 minute

export async function getCurrentDateTime(): Promise<CurrentDateTime> {
  // Cache for 1 minute to avoid excessive calls
  const now = Date.now();
  if (_cachedTime && (now - _cacheTimestamp) < CACHE_TTL) {\n\n    return _cachedTime;
  }

  // Get REAL current time in Copenhagen timezone
  const copDate = new Date().toLocaleString("da-DK", {
    timeZone: "Europe/Copenhagen",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "long"
  });

  const parsed = parseCopenhagenDateTime(copDate);
  
  logger.info({ parsed }, "✅ TIME CHECK: Current date/time verified");
  
  _cachedTime = parsed;
  _cacheTimestamp = now;
  
  return parsed;
}

export function parseCopenhagenDateTime(dateStr: string): CurrentDateTime {
  // Parse "torsdag d. 03-10-2025 14:32" format
  const parts = dateStr.match(/(\w+) .*?(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})/);
  
  if (!parts) throw new Error("Failed to parse date");
  
  const [, dayOfWeek, day, month, year, hour, minute] = parts;
  
  return {
    iso: `${year}-${month}-${day}T${hour}:${minute}:00+02:00`,
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
    dayOfWeek: capitalizeFirst(dayOfWeek),
    dayOfMonth: parseInt(day, 10),
    month: getMonthName(parseInt(month, 10)),
    monthNumber: parseInt(month, 10),
    year: parseInt(year, 10),
    week: getWeekNumber(new Date(`${year}-${month}-${day}`)),
    timezone: "Europe/Copenhagen"
  };
}

// MANDATORY wrapper for ALL date/time operations
export async function withTimeCheck<T>(
  operation: (currentTime: CurrentDateTime) => Promise<T>,
  context: string
): Promise<T> {
  const currentTime = await getCurrentDateTime();
  
  logger.debug({ 
    context, 
    currentDate: currentTime.date,
    currentTime: currentTime.time,
    dayOfWeek: currentTime.dayOfWeek
  }, "Executing operation with verified time");
  
  return operation(currentTime);
}\n\n```

**Integration i Friday:**
\n\n```typescript
// src/ai/friday.ts
import { withTimeCheck, getCurrentDateTime } from "../services/dateTimeService";

async respondWithLLM(context: FridayContext): Promise<FridayResponse> {
  const { userMessage, intent } = context;
  
  // MANDATORY TIME CHECK for date-related queries
  const needsTimeCheck = 
    userMessage.includes('dato') ||
    userMessage.includes('tid') ||
    userMessage.includes('næste') ||
    userMessage.includes('hvornår') ||
    userMessage.includes('ledig') ||
    intent?.includes('calendar') ||
    intent?.includes('booking');
  
  if (needsTimeCheck) {
    return withTimeCheck(async (currentTime) => {
      // Build enriched context WITH current time
      const timeContext = `
🕐 AKTUEL TID (VERIFICERET):\n\n- Dato: ${currentTime.dayOfWeek} d. ${currentTime.date}\n\n- Uge: ${currentTime.week}\n\n- Måned: ${currentTime.month} ${currentTime.year}\n\n- Klokkeslet: ${currentTime.time}\n\n
VIGTIGT: Brug DENNE dato til alle beregninger. Ingen gætteri!
`;
      
      const enrichedContext = await this.buildEnrichedContext(intent);
      
      // Add time context FIRST
      const messages = [
        {
          role: "system" as const,
          content: FRIDAY_SYSTEM_PROMPT + "\n\n" + timeContext + "\n\n" + enrichedContext\n\n        },
        // ... rest of conversation
      ];
      
      // Call LLM with time-aware context
      const completion = await this.llm.completeChat(messages, {
        temperature: 0.7,
        maxTokens: 800,
      });
      
      return {
        message: completion,
        suggestions: this.generateSuggestions(intent),
      };
    }, "Friday LLM Response");
  }
  
  // Normal flow for non-date queries...
}\n\n```

**Kalender Integration:**
\n\n```typescript
// src/services/calendarService.ts
export async function findNextAvailableSlot(durationMinutes: number = 120) {
  return withTimeCheck(async (currentTime) => {
    // Start search from NOW (not a guessed time!)
    const searchStart = new Date(currentTime.iso);
    const searchEnd = addDays(searchStart, 14);
    
    logger.info({
      searchingFrom: currentTime.date,
      currentDayOfWeek: currentTime.dayOfWeek,
      durationMinutes
    }, "Finding available slot with verified current time");
    
    const events = await listUpcomingEvents({
      timeMin: searchStart.toISOString(),
      timeMax: searchEnd.toISOString()
    });
    
    // Find gaps in calendar...
    const freeSlot = analyzeCalendarForGaps(events, durationMinutes, searchStart);
    
    return freeSlot;
  }, "findNextAvailableSlot");
}\n\n```

**Test Cases:**
\n\n- [ ] User asks "Hvornår har I tid næste uge?" → Must check current date FIRST\n\n- [ ] User asks "Kan I komme tirsdag?" → Must verify which Tuesday (this week vs next)\n\n- [ ] Friday suggests date → Must be based on REAL current date, not guessed\n\n- [ ] Log should show "✅ TIME CHECK" before every date calculation\n\n
---
\n\n## ⚠️ SPRINT 2: INTELLIGENT TILBUDSGENERE (Uge 2)\n\n\n\n### Formål: Automatiser tilbud med korrekt pris og format\n\n\n\n**Estimeret tid:** 6-8 timer | **Impact:** 55% → 80% capability\n\n\n\n### Task 2.1: Pricing Engine 💰\n\n\n\n**Prioritet:** ⭐⭐⭐⭐ | **Tid:** 2-3 timer\n\n
**Requirements:**
\n\n- 349 kr/time inkl. moms\n\n- Personer × Timer = Arbejdstimer × 349kr\n\n- Estimater baseret på m² og opgavetype\n\n\n\n```typescript
// src/services/pricingService.ts
export interface PriceEstimate {
  sqm: number;
  taskType: string;
  workers: number;
  hoursOnSite: number;
  workHoursTotal: number;
  priceMin: number;
  priceMax: number;
  priceFormatted: string;
}

export const HOURLY_RATE = 349; // kr inkl. moms

export function estimateCleaningJob(sqm: number, taskType: string): PriceEstimate {
  // Determine workers based on size
  const workers = sqm > 100 ? 2 : sqm > 60 ? 2 : 1;
  
  // Estimate hours based on type and size
  let hoursOnSite: number;
  
  if (taskType.includes('flytte') || taskType.includes('moving')) {
    // Flytterengøring: ~1 hour per 20m²
    hoursOnSite = Math.ceil(sqm / 20);
  } else if (taskType.includes('dybde') || taskType.includes('deep')) {
    // Dybderengøring: ~1 hour per 15m²
    hoursOnSite = Math.ceil(sqm / 15);
  } else {
    // Almindelig: ~1 hour per 30m²
    hoursOnSite = Math.ceil(sqm / 30);
  }
  
  // Minimum 2 hours
  hoursOnSite = Math.max(hoursOnSite, 2);
  
  // Calculate total work hours
  const workHoursTotal = workers * hoursOnSite;\n\n  
  // Price range (estimate ±1 hour buffer)
  const priceMin = workHoursTotal * HOURLY_RATE;\n\n  const priceMax = (workHoursTotal + workers) * HOURLY_RATE;\n\n  
  return {
    sqm,
    taskType,
    workers,
    hoursOnSite,
    workHoursTotal,
    priceMin,
    priceMax,
    priceFormatted: `${workers} personer, ${hoursOnSite} timer = ${workHoursTotal} arbejdstimer = ca.${priceMin.toLocaleString('da-DK')}-${priceMax.toLocaleString('da-DK')}kr inkl. moms`
  };
}\n\n```

---
\n\n### Task 2.2: Standardiseret Tilbudsformat 📝\n\n\n\n**Prioritet:** ⭐⭐⭐⭐ | **Tid:** 2 timer\n\n
**Læring fra cases:**
\n\n- Cecilie: Manglende info om antal personer → inkasso\n\n- Amalie: Uklar pris → konflikt\n\n- Ken: Klar kommunikation → tilfreds\n\n\n\n```typescript
// src/services/quoteGenerationService.ts (UPDATE)
export async function generateStandardizedQuote(
  lead: ParsedLead,
  availability: TimeSlot[]
): Promise<GeneratedQuote> {
  // Get pricing
  const pricing = estimateCleaningJob(lead.squareMeters || 75, lead.taskType || 'almindelig');
  
  // Format available times
  const timeSuggestions = availability
    .slice(0, 3)
    .map(slot => `${formatDate(slot.start)} kl. ${formatTime(slot.start)}`)
    .join(', ');
  
  // BUILD STANDARDIZED FORMAT
  const body = `
Hej ${lead.name || 'der'}!

Tak for din henvendelse om ${lead.taskType || 'rengøring'}.

📏 **Bolig**: ${lead.squareMeters || '?'}m² med ${lead.rooms || '?'} værelser
👥 **Medarbejdere**: ${pricing.workers} personer
⏱️ **Estimeret tid**: ${pricing.hoursOnSite} timer på stedet = ${pricing.workHoursTotal} arbejdstimer total
💰 **Pris**: 349kr/time/person = ca.${pricing.priceMin.toLocaleString('da-DK')}-${pricing.priceMax.toLocaleString('da-DK')}kr inkl. moms

📅 **Ledige tider**: ${timeSuggestions}

💡 **Du betaler kun faktisk tidsforbrug**
Estimatet er vejledende. Hvis opgaven tager længere tid, betaler du kun for den faktiske tid brugt.

📞 **Vi ringer ved overskridelse**
Hvis opgaven tager mere end +1 time over estimatet, ringer vi til dig inden vi fortsætter.

Lyder det godt? Svar gerne med din foretrukne dato, så booker jeg det i kalenderen.

Mvh,
Jonas - Rendetalje.dk\n\nMobilePay: 71759 | Bank: 6695-2002056146
`.trim();

  return {
    to: lead.email,
    subject: `Tilbud på ${lead.taskType || 'rengøring'} - ${lead.address || lead.squareMeters + 'm²'}`,\n\n    body,
    pricing,
    availability
  };
}\n\n```

---
\n\n### Task 2.3: Overtids-Kommunikation 📞\n\n\n\n**Prioritet:** ⭐⭐⭐⭐ | **Tid:** 30 min\n\n
**KRITISK REGEL fra MEMORY_5:**
\n\n```
Ring til BESTILLER ved +1t overskridelse (IKKE +3-5t!)
SKAL være i ALLE tilbud\n\n```

**Implementation:** Already included in Task 2.2 template ✅\n\n
**Additional Validation:**
\n\n```typescript
// src/validation/quoteValidation.ts
export function validateQuoteCompleteness(quoteBody: string): ValidationResult {
  const required = [
    { keyword: 'arbejdstimer', reason: 'Skal vise total arbejdstimer (ikke kun timer på stedet)' },
    { keyword: 'personer', reason: 'Skal angive antal medarbejdere' },
    { keyword: '+1 time', reason: 'Skal angive overtids-regel (+1t, IKKE +3-5t!)' },
    { keyword: 'ringer', reason: 'Skal love at ringe ved overskridelse' },
    { keyword: 'kun faktisk', reason: 'Skal forklare betaling for faktisk tidsforbrug' }
  ];

  const missing = required.filter(req => !quoteBody.includes(req.keyword));
  
  if (missing.length > 0) {
    return {
      valid: false,
      errors: missing.map(m => m.reason),
      warning: "MANGLER KRITISK INFO - kan føre til Cecilie/Amalie situation!"\n\n    };
  }

  return { valid: true };
}\n\n```

---
\n\n## 📊 SPRINT 3: WORKFLOW AUTOMATION (Uge 3)\n\n\n\n### Formål: Automatiser lead management og opfølgning\n\n\n\n**Estimeret tid:** 9-12 timer | **Impact:** 80% → 90% capability\n\n\n\n### Task 3.1: Label Workflow System 🏷️\n\n\n\n**Prioritet:** ⭐⭐⭐ | **Tid:** 2 timer\n\n
[Implementation details...]
\n\n### Task 3.2: Follow-up System 📞\n\n\n\n**Prioritet:** ⭐⭐⭐ | **Tid:** 3-4 timer\n\n
[Implementation details...]
\n\n### Task 3.3: Conflict Resolution Playbook ⚠️\n\n\n\n**Prioritet:** ⭐⭐⭐ | **Tid:** 4-5 timer\n\n
[Implementation details...]

---
\n\n## 📈 IMPACT METRICS\n\n\n\n| Sprint | Capability Before | Capability After | Key Wins |
|--------|-------------------|------------------|----------|
| **Sprint 1** | 25% | 55% | No more duplicate quotes, correct lead handling, accurate dates |\n\n| **Sprint 2** | 55% | 80% | Automated pricing, professional quotes, clear communication |\n\n| **Sprint 3** | 80% | 90% | Full workflow automation, proactive follow-up, conflict prevention |\n\n
---
\n\n## 🎯 NEXT ACTIONS\n\n\n\n**Deploy Gemini FØRST** (fra tidligere):\n\n\n\n```bash
git add . && git commit -m "✨ Add Gemini LLM"
git push origin main\n\n```

**Derefter start Sprint 1:**
\n\n```bash\n\n# Task 1.1\n\ngit checkout -b feature/duplicate-detection\n\n# Implement duplicateDetectionService.ts\n\n# Test with real customer emails\n\n# Commit & PR\n\n\n\n# Task 1.2  \n\ngit checkout -b feature/lead-source-rules\n\n# ... etc\n\n```\n\n
---

**Vil du starte med Sprint 1 Task 1.1 NU?** 🚀
