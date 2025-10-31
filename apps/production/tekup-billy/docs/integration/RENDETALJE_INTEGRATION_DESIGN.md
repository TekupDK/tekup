# Rendetalje Tools Integration Design

**Status:** Design Phase (PAUSED - Waiting for dependencies)  
**Date:** 31. Oktober 2025  
**Based on:** Technical Review Feedback

---

## Executive Summary

Integrerer 5 Rendetalje MCP tools i Billy API som direkte function imports (ikke HTTP proxy), så ChatGPT kan se alle 32 tools (27 Billy + 5 Rendetalje) i én connector.

---

## Arkitektur - Korrekt Approach

### ❌ FORKERT (Original Plan)

```
ChatGPT → Billy API → HTTP call → Rendetalje MCP Server
```

### ✅ KORREKT (Shared Library Pattern)

```
ChatGPT → Billy API (MCP Server)
         ↓
         Billy Tools → Billy.dk API
         Rendetalje Tools → Direct function imports
                          ↓
                          Shared logic (Google Calendar, Supabase)
```

---

## Integration Strategy

### Option: Direct Function Import (RECOMMENDED)

**Fordele:**

- ✅ Ingen HTTP overhead
- ✅ Type-safety mellem Billy og Rendetalje
- ✅ Shared code - ingen duplication
- ✅ Modulær - Rendetalje logic isoleret
- ✅ Easy testing

**Implementation:**

1. **Opret Rendetalje Tools Wrapper Module**

   ```typescript
   // Tekup/apps/production/tekup-billy/src/tools/rendetalje.ts

   // Import Rendetalje tool functions direkte
   // NOTER: Calendar-MCP er separat projekt, så vi importerer funktionerne
   // For nu: Kopier tool logic og dependencies til Billy API
   // Fremtid: Opret shared package hvis det giver mening
   ```

2. **Registrer i Billy MCP Server**

   ```typescript
   // src/index.ts - setupTools()
   import { rendetaljeTools } from "./tools/rendetalje.js";

   // Register each tool
   this.server.registerTool(
     "validate_booking_date",
     rendetaljeTools.validate_booking_date.schema,
     rendetaljeTools.validate_booking_date.handler
   );
   ```

---

## Rendetalje Tools Structure

### Tool 1: validate_booking_date

- **Purpose:** Validér booking dato og tjek mod ugedag
- **Input:** `{ date: string, expectedDayName?: string, customerId?: string }`
- **Output:** `BookingValidationResult`
- **Dependencies:** Date validator, customer intelligence (Supabase)

### Tool 2: check_booking_conflicts

- **Purpose:** Tjek for dobbeltbookinger i Google Calendar
- **Input:** `{ startTime: string, endTime: string, excludeBookingId?: string }`
- **Output:** `BookingValidationResult`
- **Dependencies:** Google Calendar API

### Tool 3: auto_create_invoice

- **Purpose:** Automatisk opret faktura via Billy.dk
- **Input:** `{ bookingId: string, sendImmediately?: boolean }`
- **Output:** `InvoiceAutomation`
- **Dependencies:** Billy API (already available!), booking data (Supabase)

### Tool 4: track_overtime_risk

- **Purpose:** Track job duration og send alerts ved overtid
- **Input:** `{ bookingId: string, estimatedDuration: number, currentDuration: number }`
- **Output:** `{ status: string, overtimeMinutes: number, alertSent: boolean }`
- **Dependencies:** Overtime tracking DB (Supabase), Twilio (optional)

### Tool 5: get_customer_memory

- **Purpose:** Hent komplet kunde-intelligence
- **Input:** `{ customerId?: string, customerName?: string }`
- **Output:** `CustomerIntelligence`
- **Dependencies:** Customer intelligence DB (Supabase)

---

## Implementation Plan

### Phase 1: Setup Dependencies (Day 1)

1. **Tjek Dependencies:**
   - Google Calendar integration - kræver credentials?
   - Supabase - kræver connection string?
   - Twilio - optional for voice alerts

2. **Konfiguration:**
   - Tilføj Rendetalje config til Billy API
   - Setup environment variables
   - Validate dependencies

### Phase 2: Tool Integration (Day 2-3)

For hver tool:

1. **Kopier eller Refaktor Logic:**
   - Hvis calendar-mcp kan importeres direkte → Import
   - Hvis ikke → Kopier core logic (kun business logic, ikke server setup)

2. **Adapt til Billy API Format:**
   - Wrap med Billy's error handling
   - Konverter output til MCP format
   - Tilføj logging via Billy's dataLogger

3. **Register i MCP Server:**
   - Tilføj til `setupTools()` i `src/index.ts`
   - Definér input/output schemas

### Phase 3: Testing (Day 4)

1. **Unit Tests:**
   - Test hver tool individuelt
   - Mock dependencies (Google Calendar, Supabase)

2. **Integration Tests:**
   - Test via MCP protocol
   - Verify OpenAPI schema generation

3. **ChatGPT Testing:**
   - Deploy til production
   - Test i ChatGPT connector
   - Verify alle 5 tools synlige og funktionelle

---

## Environment Variables Needed

```env
# Rendetalje Calendar Integration
RENDETALJE_GOOGLE_CALENDAR_ID=
RENDETALJE_GOOGLE_CREDENTIALS_PATH=

# Supabase (for customer intelligence)
RENDETALJE_SUPABASE_URL=
RENDETALJE_SUPABASE_KEY=

# Twilio (optional - for voice alerts)
RENDETALJE_TWILIO_ACCOUNT_SID=
RENDETALJE_TWILIO_AUTH_TOKEN=
RENDETALJE_TWILIO_PHONE_NUMBER=
```

---

## Dependencies Analysis

### Critical Dependencies

- ✅ **Billy API** - Already available (same server)
- ⚠️ **Google Calendar** - Kræver OAuth credentials
- ⚠️ **Supabase** - Kræver connection (may share with Billy?)
- ⚠️ **Twilio** - Optional, kun hvis voice alerts skal bruges

### Shared Dependencies (Allerede i Billy API)

- ✅ `zod` - Validation
- ✅ TypeScript types
- ✅ Error handling patterns
- ✅ Logging infrastructure

---

## Risk Assessment

### Low Risk ✅

- Tool registration (standard MCP pattern)
- Error handling (Billy's existing patterns)
- Logging (Billy's dataLogger)

### Medium Risk ⚠️

- Google Calendar integration (kræver credentials setup)
- Supabase connection (may need separate config)
- Type compatibility (Rendetalje types vs Billy types)

### Mitigation

1. Make Google Calendar optional (dry-run mode)
2. Use graceful degradation (return partial data)
3. Share Supabase client if possible

---

## Success Criteria

- ✅ Alle 5 Rendetalje tools synlige i ChatGPT
- ✅ Tools kan kaldes og returnerer korrekt data
- ✅ Error handling fungerer graceful
- ✅ Ingen breaking changes til eksisterende Billy tools
- ✅ Dokumentation opdateret

---

## Next Steps

1. **Spørgsmål til besvarelse:**
   - Har vi adgang til Rendetalje Google Calendar credentials?
   - Skal vi dele Supabase connection med Billy eller separat?
   - Er Twilio voice alerts nødvendigt for MVP?

2. **Implementation start:**
   - Start med tool 5 (get_customer_memory) - simplest
   - Derefter tool 1 (validate_booking_date) - no external APIs
   - Til sidst tools 2-4 med external dependencies

---

**Note:** Dette dokument erstatter den oprindelige plan med HTTP proxy approach. Vi bruger direkte function imports i stedet.
