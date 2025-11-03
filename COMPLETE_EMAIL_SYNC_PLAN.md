# 📧 Komplet Email Sync Løsning - tekup-ai-v2

**Dato:** 3. november 2025
**Status:** 🔴 Under Implementation
**Prioritet:** CRITICAL

---

## 🎯 Mål

**Komplet email sync løsning der:**
1. ✅ Syncer eksisterende emails fra Gmail til Supabase database
2. ✅ Sikrer automatisk sync for fremtidige emails (Gmail API + SMTP inbound)
3. ✅ Integrerer alle komponenter (inbound-email, inbox-orchestrator)
4. ✅ Håndterer fallback hvis backend fejler (database-first approach)

---

## 🏗️ Arkitektur

```
┌─────────────────────────────────────────────────────────────┐
│                  EMAIL SYNC ECOSYSTEM                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 📧 GMAIL API (Direkte)                                  │
│     └─> Backend → Fallback til database                     │
│                                                             │
│  2. 📨 SMTP INBOUND (inbound-email container)              │
│     └─> Webhook → Backend → Database                        │
│                                                             │
│  3. 🔄 INBOX ORCHESTRATOR (periodic sync)                  │
│     └─> Gmail API → Database                                │
│                                                             │
│  4. 💾 SUPABASE DATABASE (single source of truth)          │
│     └─> emails table                                        │
│     └─> email_threads table                                │
│     └─> attachments table                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Implementation Plan

### Phase 1: Fix Database Sync Script (NU)

**Problem:** Script kan ikke hente fuld email data fra Gmail API
**Løsning:** Brug direkte Google API i stedet for MCP server

**Tasks:**
- [x] Fix dotenv config i sync script
- [x] Fix search_path problem
- [ ] Opdater script til at bruge direkte Google API (ikke MCP)
- [ ] Test sync fra container
- [ ] Verificer emails i database

### Phase 2: Backend Database-First Strategy (KRITISK)

**Problem:** Backend fallback til Gmail API hver gang
**Løsning:** Database-first, kun fallback hvis database er tom

**Tasks:**
- [ ] Opdater `routers.ts` email.list til at prioritere database
- [ ] Kun kalde Gmail API hvis database query returnerer tom
- [ ] Automatisk cache nye emails til database efter Gmail API call
- [ ] Background job der syncer emails periodisk

### Phase 3: Inbound Email Container (SMTP Reception)

**Problem:** Container crasher - mangler index.js
**Løsning:** Fix Dockerfile eller brug alternativ

**Tasks:**
- [ ] Fix inbound-email Dockerfile til at bruge npm package
- [ ] Eller byg custom SMTP server der sender webhook
- [ ] Test webhook modtagelse i backend
- [ ] Verificer emails kommer i database via webhook

### Phase 4: Inbox Orchestrator Integration

**Problem:** Inbox-orchestrator kører, men syncer ikke til Supabase
**Løsning:** Integrer inbox-orchestrator med Supabase email sync

**Tasks:**
- [ ] Dokumenter inbox-orchestrator funktionalitet
- [ ] Opdater til at skrive til Supabase (ikke kun local postgres)
- [ ] Setup periodic sync job
- [ ] Test integration

### Phase 5: Complete Solution Verification

**Tasks:**
- [ ] Verificer alle 3 veje virker (Gmail API, SMTP, Orchestrator)
- [ ] Test fallback scenarios
- [ ] Performance test med mange emails
- [ ] Dokumentation

---

## 🔧 Technical Implementation

### 1. Sync Script Update (Direkte Google API)

```typescript
// I stedet for MCP, brug direkte Google API
import { google } from 'googleapis';

// Get Gmail API client
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
  scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
});

const gmail = google.gmail({ version: 'v1', auth });

// Fetch threads direkte
const threads = await gmail.users.messages.list({
  userId: 'me',
  q: 'in:inbox',
  maxResults: 50,
});
```

### 2. Backend Database-First

```typescript
// server/routers.ts - email.list
.query(async ({ ctx, input }) => {
  const db = await getDb();
  if (db) {
    // Try database FIRST
    const emailRecords = await db
      .select()
      .from(emails)
      .where(eq(emails.userId, ctx.user.id))
      .orderBy(desc(emails.receivedAt))
      .limit(input.maxResults || 50)
      .execute();

    if (emailRecords.length > 0) {
      // Return from database
      return transformToGmailFormat(emailRecords);
    }

    // Database empty - fetch from Gmail API
    const gmailThreads = await fetchFromGmailAPI(input.query, input.maxResults);

    // Cache to database in background (don't await)
    cacheEmailsToDatabase(gmailThreads, ctx.user.id).catch(console.error);

    return gmailThreads;
  }

  // Fallback to Gmail API only
  return fetchFromGmailAPI(input.query, input.maxResults);
})
```

### 3. Background Sync Job

```typescript
// server/scripts/background-sync.ts
// Kør hver 5. minut via cron eller setInterval
async function backgroundEmailSync() {
  const db = await getDb();
  if (!db) return;

  // Fetch fra Gmail API
  const threads = await fetchFromGmailAPI('in:inbox', 100);

  // Sync til database
  for (const thread of threads) {
    await syncThreadToDatabase(thread, userId);
  }
}
```

---

## 📊 Success Criteria

- [x] Database schema klar (emails, email_threads, attachments)
- [ ] Sync script virker og kan synce 50+ emails
- [ ] Backend henter fra database først, kun fallback til Gmail API
- [ ] Inbound email webhook modtager emails og gemmer i database
- [ ] Inbox orchestrator syncer periodisk til database
- [ ] Alle 3 synkroniseringsveje virker
- [ ] Fallback scenarios håndteres korrekt

---

## 🚀 Næste Steps (Prioriteret)

1. **Fix sync script med direkte Google API** ← START HER
2. **Opdater backend til database-first** ← KRITISK
3. **Test sync script fra container**
4. **Fix inbound-email container**
5. **Integrer inbox-orchestrator**

---

**Last Updated:** 3. november 2025, 01:15

