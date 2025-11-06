# Phase 0: Fallback Mekanisme Analyse

## 📊 Nuværende Situation

### Database Status

- **Emails i database:** 0 (ingen emails modtaget via webhook endnu)
- **Status:** Database er klar, men webhook har ikke modtaget emails endnu

### Hvordan Systemet Virker Nu

**Nuværende Flow (Før Phase 0 er fuldt aktiveret):**

1. Frontend kalder `inbox.email.list` eller `inbox.email.getInboundEmails`
2. Backend tjekker database først
3. Hvis database er tom → Fallback til **Gmail API**
4. Emails kommer fra Gmail API (med rate limit risiko)

## 🔄 Fallback Mekanisme - Implementeret

### 1. `getInboundEmails` Endpoint

**Location:** `server/routers.ts:570-632`

**Flow:**

```typescript
1. Tjek database connection
2. Hvis database IKKE tilgængelig → Fallback til Gmail API
3. Hvis database tilgængelig → Query fra database
4. Transform database emails til GmailThread format (for kompatibilitet)
```

**Kode:**

```typescript
const db = await getDb();
if (!db) {
  // Fallback to Gmail API if database not available
  return mcpSearchGmailThreads("in:inbox", input.maxResults);
}

// Query emails from database
const emailRecords = await db.select().from(emails)...
```

### 2. `list` Endpoint (Standard Email List)

**Location:** `server/routers.ts:297-336`

**Flow:**

```typescript
1. Tjek database connection
2. Hvis database tilgængelig → Query fra database
3. Hvis database tom → Fallback til Gmail API
4. Returner kombineret resultat (database + Gmail API)
```

**Kode:**

```typescript
const db = await getDb();
if (db) {
  try {
    // Query from database
    const emailRecords = await db.select().from(emails)...

    if (emailRecords.length > 0) {
      return transformedEmails;
    }
  } catch (error) {
    // Fallback on error
  }
}

// Fallback to Gmail API
return mcpSearchGmailThreads(...);
```

### 3. `getEmailThread` Endpoint

**Location:** `server/routers.ts:654-705`

**Flow:**

```typescript
1. Tjek database først
2. Hvis thread IKKE fundet i database → Fallback til Gmail API
3. Returner thread fra database eller Gmail API
```

## ⚠️ Problemer med Nuværende Setup

### Problem 1: Rate Limits

- **Issue:** Gmail API har rate limits (HTTP 429 errors)
- **Impact:** Når mange emails hentes eller systemet er under belastning
- **Symptom:** "User-rate limit exceeded. Retry after..."

### Problem 2: Afhængighed af Gmail API

- **Issue:** Systemet er afhængigt af Gmail API for at vise emails
- **Impact:** Hvis Gmail API er nede eller rate limited, kan ingen emails vises
- **Risk:** Single point of failure

### Problem 3: Database er tom

- **Issue:** Alle emails kommer fra Gmail API lige nu
- **Impact:** Ingen emails gemmes lokalt, ingen enrichment pipeline kører
- **Consequence:** Phase 0 features virker ikke endnu

## ✅ Phase 0 Løsning

### Hvad Phase 0 Gør

1. **SMTP Server Modtager Emails Direkte**
   - Ingen Gmail API rate limits
   - Emails kommer i realtid via SMTP
   - Lagret lokalt i database

2. **Database Bliver Primary Source**
   - `getInboundEmails` henter fra database
   - `list` henter fra database
   - Gmail API bliver kun fallback

3. **Enrichment Pipeline Kører Automatisk**
   - Billy customer lookup
   - Lead source detection
   - Auto-labeling
   - Pipeline state management

4. **Resilient Fallback**
   - Hvis database fejler → Fallback til Gmail API
   - Hvis webhook fejler → Gmail API fortsætter at virke
   - Ingen data loss

## 🎯 Næste Skridt i Analysen

### Skridt 1: Test Webhook Manuelt ✅ (Ready)

- Test `/api/inbound/email` med Postman
- Verificer database insertion
- Check enrichment pipeline

### Skridt 2: Setup Inbound-Email Service

- Clone `inbound-email` repository
- Configure environment variables
- Start Docker service

### Skridt 3: Configure Google Workspace

- Setup auto-forward eller Dual Delivery
- Test med real email

### Skridt 4: Migrér Eksisterende Emails (Optional)

- Script til at hente eksisterende emails fra Gmail API
- Gem dem i database
- Kør enrichment pipeline på dem

### Skridt 5: Monitor og Verify

- Tjek at nye emails kommer ind via webhook
- Verificer at database bliver primary source
- Check at Gmail API kun bruges som fallback

## 📈 Forventet Resultat Efter Phase 0

### Før Phase 0:

```
Frontend → Backend → Gmail API → Emails (rate limited)
```

### Efter Phase 0:

```
Frontend → Backend → Database → Emails ✅
                         ↓ (hvis database fejler)
                    Gmail API (fallback)
```

### Benefits:

1. ✅ **Ingen rate limits** - SMTP server modtager direkte
2. ✅ **Realtid emails** - Kommer ind med det samme
3. ✅ **Enrichment** - Billy lookup, lead detection kører automatisk
4. ✅ **Resilient** - Fallback til Gmail API hvis nødvendigt
5. ✅ **Performance** - Database queries er hurtigere end Gmail API

## 🔍 Konklusion

**Nuværende Status:**

- ✅ Fallback mekanisme er implementeret korrekt
- ✅ Database er klar og migreret
- ⚠️ Webhook har ikke modtaget emails endnu
- ⚠️ Systemet bruger stadig Gmail API som primary source

**Næste Actions:**

1. Test webhook manuelt
2. Setup inbound-email service
3. Configure Google Workspace
4. Verify at database bliver primary source
