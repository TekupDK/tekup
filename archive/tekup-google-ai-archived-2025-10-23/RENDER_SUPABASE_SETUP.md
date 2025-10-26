# 🚀 Render.com Supabase Setup Guide

## Status: Backend skal opdateres til Supabase

Frontend (Hostinger Horizons) bruger allerede Supabase, men backend (Render.com) bruger stadig gamle Neon database.

---

## 📋 Step-by-Step: Opdater Render.com Environment Variables

### 1️⃣ Naviger til Render Dashboard
Gå til: <https://dashboard.render.com/>

### 2️⃣ Find din service
- Service navn: **tekup-renos**
- Service ID: srv-d3dv61ffte5s73f1uccg
- Region: Frankfurt (EU Central)
- Domain: api.renos.dk

### 3️⃣ Gå til Environment Tab
1. Klik på din service "tekup-renos"
2. Klik på **"Environment"** i venstre menu
3. Find eksisterende `DATABASE_URL` variabel

### 4️⃣ Opdater DATABASE_URL

**❌ GAMMEL (Neon):**
```
postgresql://neondb_owner:npg_dQil49phImPE@ep-falling-night-a2hato6b-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

**✅ NY (Supabase - Transaction Pooler):**
```
postgresql://postgres.oaevagdgrasfppbrxbey:Habibie12%40@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

> **VIGTIGT:** Hvis Pooler ikke virker, brug Direct Connection:
```
postgresql://postgres:Habibie12%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres
```

### 5️⃣ Tilføj nye Supabase variabler

Klik **"Add Environment Variable"** for hver af disse:

**SUPABASE_URL:**
```
https://oaevagdgrasfppbrxbey.supabase.co
```

**SUPABASE_ANON_KEY:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Nzc3NjQsImV4cCI6MjA3NTQ1Mzc2NH0.M0Kt1Xi-3VVoq6NJ7VbhqBC0z9EK-JQ7ypssayMw7s8
```

**SUPABASE_SERVICE_KEY:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg3Nzc2NCwiZXhwIjoyMDc1NDUzNzY0fQ.9Kzr0aVZBx-D7hHBCvPiUlxl3TxpCQ5hvYZmGZ_4rVE
```

### 6️⃣ Opdater Build Settings

Gå til **"Settings"** tab → Find **"Build & Deploy"** sektion

**Pre-Deploy Command (opdater til):**
```bash
npx prisma generate && npx prisma migrate deploy || npx prisma db push --accept-data-loss
```

Dette sikrer at Prisma schema synkroniseres til Supabase ved hver deploy.

### 7️⃣ Deploy med Cache Clear

1. Klik på **"Manual Deploy"** knappen
2. Vælg **"Clear build cache & deploy"**
3. Vent på deployment (ca. 2-3 minutter)

### 8️⃣ Monitor Logs

Klik på **"Logs"** tab og kig efter:

✅ **Successful deployment:**
```
✔ Generated Prisma Client
✔ Database connected successfully
```

❌ **Hvis du ser fejl:**
```
P1001: Can't reach database server
```
→ Skift DATABASE_URL til Direct Connection i stedet for Pooler

---

## 🧪 Verificer at Migration Virkede

### Test 1: Health Endpoint
```bash
curl https://api.renos.dk/health
```

Forventet response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-10-08T..."
}
```

### Test 2: Check Render Logs
Søg i logs efter:
- `"Prisma schema loaded"`
- `"Database migration completed"`
- `"Server running on port 3000"`

### Test 3: Verificer i Supabase Dashboard
1. Gå til Supabase Dashboard → Table Editor
2. Du skulle se disse tabeller oprettet:
   - `customers`
   - `leads`
   - `bookings`
   - `chat_sessions`
   - `chat_messages`
   - `email_responses`
   - `quotes`

---

## 🔄 Hybrid Arkitektur (Efter Migration)

**Frontend (Hostinger Horizons):**
- Direkte Supabase queries via `@supabase/supabase-js`
- Real-time subscriptions for live data
- Supabase Auth for login/signup

**Backend (Render.com - api.renos.dk):**
- Prisma ORM → Supabase PostgreSQL
- AI Agents (email automation, lead enrichment)
- Google Workspace integration (Gmail, Calendar)
- Scheduled jobs (booking reminders, follow-ups)

**Begge skriver til samme Supabase database** = Real-time sync! 🎉

---

## 🚨 Troubleshooting

### Problem: "P1001: Can't reach database server"

**Løsning 1:** Brug Direct Connection i stedet for Pooler
```
DATABASE_URL=postgresql://postgres:Habibie12%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres
```

**Løsning 2:** Verificer password encoding
- `@` symbol skal være `%40` i URL
- Password: `Habibie12@` → URL-encoded: `Habibie12%40`

**Løsning 3:** Check Supabase projekt status
- Gå til Supabase Dashboard
- Verificer at projektet er "Active" (ikke paused)

### Problem: "FATAL: Tenant or user not found"

**Løsning:** Transaction Pooler URL format er forkert
- FORKERT: `postgres:password@aws-0...`
- KORREKT: `postgres.PROJECT_REF:password@aws-0...`
```
postgresql://postgres.oaevagdgrasfppbrxbey:Habibie12%40@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Problem: Migration hænger/timeout

**Løsning:** Brug `--accept-data-loss` flag
```bash
npx prisma db push --accept-data-loss
```

Dette springer over data migration og fokuserer kun på schema sync.

---

## ✅ Success Checklist

- [ ] DATABASE_URL opdateret på Render
- [ ] SUPABASE_URL tilføjet
- [ ] SUPABASE_ANON_KEY tilføjet  
- [ ] SUPABASE_SERVICE_KEY tilføjet
- [ ] Pre-Deploy Command opdateret
- [ ] Manual deploy trigget med cache clear
- [ ] Logs viser "Database connected"
- [ ] Health endpoint returnerer 200 OK
- [ ] Tabeller synlige i Supabase Dashboard
- [ ] Frontend kan stadig fetch data
- [ ] AI agents kan skrive til database

Når alle er checked ✅, er migrationen komplet! 🎉

---

## 📞 Næste Skridt

**For Hostinger Horizons:**
Send dem beskeden fra `HOSTINGER_HORIZONS_MESSAGE.md` om hybrid arkitektur

**For Backend Team:**
Test at AI agents kan skrive til Supabase:
```bash
npm run email:pending
npm run booking:availability
```

**For Data Migration (hvis nødvendigt):**
Hvis du har eksisterende data i Neon:
1. Export: `pg_dump <neon_url> > backup.sql`
2. Import til Supabase via SQL Editor
3. Verificer data integritet
4. Delete Neon projekt
