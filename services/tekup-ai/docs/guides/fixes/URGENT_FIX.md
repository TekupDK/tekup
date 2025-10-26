# 🚨 URGENT FIX - Customer 360 Email Tråde Mangler\n\n\n\n## **Problem:**\n\nCustomer 360 viser **ingen email tråde** på https://tekup-renos-1.onrender.com\n\n\n\n## **Root Cause:**\n\n1. ❌ Nye database tabeller (`EmailThread`, `EmailMessage`, `EmailIngestRun`) ikke i production\n\n2. ❌ Email ingest aldrig kørt\n\n3. ❌ Data mangler i database

---
\n\n## **FIX STEPS (Kør i denne rækkefølge):**\n\n\n\n### **Step 1: Database Migration (KRITISK)**\n\n\n\n#### **Option A: Via Neon Database Dashboard (Anbefalet)**\n\n\n\n1. Gå til https://console.neon.tech\n\n2. Vælg dit projekt\n\n3. Klik på "SQL Editor"\n\n4. Kør følgende SQL:
\n\n```sql
-- Create email_ingest_runs table\n\nCREATE TABLE IF NOT EXISTS "email_ingest_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'running',
    "totalEmails" INTEGER NOT NULL DEFAULT 0,
    "newEmails" INTEGER NOT NULL DEFAULT 0,
    "updatedEmails" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "errorLog" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create email_threads table\n\nCREATE TABLE IF NOT EXISTS "email_threads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gmailThreadId" TEXT NOT NULL UNIQUE,
    "customerId" TEXT,
    "subject" TEXT NOT NULL,
    "snippet" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL,
    "participants" TEXT[],
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "labels" TEXT[],
    "isMatched" BOOLEAN NOT NULL DEFAULT false,
    "matchedAt" TIMESTAMP(3),
    "matchedBy" TEXT,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "email_threads_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create indexes for email_threads\n\nCREATE INDEX IF NOT EXISTS "email_threads_customerId_idx" ON "email_threads"("customerId");
CREATE INDEX IF NOT EXISTS "email_threads_gmailThreadId_idx" ON "email_threads"("gmailThreadId");
CREATE INDEX IF NOT EXISTS "email_threads_lastMessageAt_idx" ON "email_threads"("lastMessageAt");
CREATE INDEX IF NOT EXISTS "email_threads_isMatched_idx" ON "email_threads"("isMatched");

-- Create email_messages table\n\nCREATE TABLE IF NOT EXISTS "email_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gmailMessageId" TEXT UNIQUE,
    "gmailThreadId" TEXT NOT NULL,
    "threadId" TEXT,
    "from" TEXT NOT NULL,
    "to" TEXT[],
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "bodyPreview" TEXT,
    "direction" TEXT NOT NULL DEFAULT 'inbound',
    "status" TEXT NOT NULL DEFAULT 'delivered',
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiModel" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "email_messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "email_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for email_messages\n\nCREATE INDEX IF NOT EXISTS "email_messages_threadId_idx" ON "email_messages"("threadId");
CREATE INDEX IF NOT EXISTS "email_messages_gmailMessageId_idx" ON "email_messages"("gmailMessageId");
CREATE INDEX IF NOT EXISTS "email_messages_sentAt_idx" ON "email_messages"("sentAt");
CREATE INDEX IF NOT EXISTS "email_messages_direction_idx" ON "email_messages"("direction");\n\n```
\n\n#### **Option B: Via Render.com Shell (Automatisk)**\n\n\n\n1. Push ændringer til GitHub (allerede gjort ✅)\n\n2. Render auto-deployer med nye schema\n\n3. Kør i Render Shell:
\n\n```bash
cd /app
npx prisma db push --accept-data-loss\n\n```
\n\n### **Step 2: Run Email Ingest**\n\n\n\n#### **Option A: Via API Endpoint (Nemmest)**\n\n\n\nÅbn i browser:\n\n```
https://tekup-renos.onrender.com/api/email-ingest/stats\n\n```
\n\n#### **Option B: Via Render Shell**\n\n\n\n```bash\n\ncd /app
npm run email:ingest\n\n```

Dette vil:\n\n- Hente ALLE Gmail threads (batch processing)\n\n- Matche tråde til kunder (exact email → domain → heuristic)\n\n- Oprette EmailThread + EmailMessage records\n\n- Returnere statistik (totalThreads, matchedThreads, unmatchedThreads)\n\n\n\n### **Step 3: Verify**\n\n\n\nCheck at data er importeret:
\n\n```bash\n\n# Check unmatched threads:\n\ncurl https://tekup-renos.onrender.com/api/threads/unmatched\n\n\n\n# Check customer threads (brug customer ID fra UI):\n\ncurl https://tekup-renos.onrender.com/api/customers/{customer-id}/threads\n\n\n\n# Check ingest stats:\n\ncurl https://tekup-renos.onrender.com/api/email-ingest/stats\n\n```\n\n
---
\n\n## **Forventet Resultat:**\n\n\n\nEfter fix:\n\n- ✅ Customer 360 viser email tråde\n\n- ✅ Klik på tråd viser beskeder\n\n- ✅ Reply funktion virker\n\n- ✅ Smart matching linker tråde til kunder\n\n
---
\n\n## **Hvorfor skete dette?**\n\n\n\nDe nye tabeller blev tilføjet EFTER initial deployment, så:\n\n1. Production database har ikke de nye tabeller\n\n2. `prisma db push` blev ikke kørt på production\n\n3. Email ingest blev aldrig kørt

---
\n\n## **Manual Steps (hvis API ikke virker):**\n\n\n\n### **Via Render.com Dashboard:**\n\n\n\n1. Gå til: https://dashboard.render.com\n\n2. Find "tekup-renos" service\n\n3. Klik "Shell" tab\n\n4. Kør:
   ```bash
   cd /app
   npx prisma db push --accept-data-loss
   npm run email:ingest
   ```

---
\n\n## **Status:**\n\n⚠️ **VENTER PÅ MANUEL FIX**\n\n
**ETA:** 5-10 minutter efter fix er kørt
