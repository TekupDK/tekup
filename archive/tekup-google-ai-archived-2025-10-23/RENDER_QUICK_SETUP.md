# 🚀 RENDER.COM OPDATERING - KOPIER DISSE VÆRDIER

## Status: Klar til at opdatere Render.com Environment Variables

Baseret på Supabase dashboard info - her er de præcise værdier du skal bruge på Render.com.

---

## 📋 STEP-BY-STEP INSTRUKTIONER

### 1️⃣ Gå til Render Dashboard
Åbn: <https://dashboard.render.com/>

### 2️⃣ Find din service
- Klik på: **tekup-renos** service
- Klik på: **Environment** tab i venstre menu

---

## 🔑 ENVIRONMENT VARIABLES AT OPDATERE

### ✏️ OPDATER EKSISTERENDE: `DATABASE_URL`

**Find den eksisterende `DATABASE_URL` variabel og ERSTAT værdien med:**

```
postgresql://postgres.oaevagdgrasfppbrxbey:Habibie12%40@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
```

> ⚠️ **VIGTIGT DETALJER:**
> - Username: `postgres.oaevagdgrasfppbrxbey` (bemærk punktum og projekt ref!)
> - Password: `Habibie12%40` (@ er URL-encoded som %40)
> - Host: `aws-1-eu-central-1.pooler.supabase.com`
> - Port: `6543` (Transaction Pooler port)
> - Database: `postgres`

---

### ➕ TILFØJ NYE VARIABLES (Klik "Add Environment Variable" 3 gange)

#### Variable 1: `SUPABASE_URL`
```
https://oaevagdgrasfppbrxbey.supabase.co
```

#### Variable 2: `SUPABASE_ANON_KEY`
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Nzc3NjQsImV4cCI6MjA3NTQ1Mzc2NH0.M0Kt1Xi-3VVoq6NJ7VbhqBC0z9EK-JQ7ypssayMw7s8
```

#### Variable 3: `SUPABASE_SERVICE_KEY`

**⚠️ VIGTIGT:** Du skal finde denne i Supabase Dashboard:

1. Gå til: **Project Settings** (⚙️ ikon nederst i sidebar)
2. Klik på: **API** tab
3. Find: **Project API keys** sektion
4. Kopier: **service_role** key (klik "Reveal" hvis skjult)

Indsæt den service_role key her på Render.

---

## ⚙️ OPDATER BUILD SETTINGS

### 3️⃣ Gå til Settings Tab

Klik på **"Settings"** tab (ikke Environment)

Scroll ned til **"Build & Deploy"** sektionen

Find **"Pre-Deploy Command"** feltet

### 4️⃣ Opdater Pre-Deploy Command

**Erstat med denne kommando:**

```bash
npx prisma generate && npx prisma migrate deploy || npx prisma db push --accept-data-loss
```

**Hvad denne kommando gør:**
1. Genererer Prisma Client
2. Forsøger at køre migrations (hvis de findes)
3. Hvis migrations fejler, pusher schema direkte til database
4. `--accept-data-loss` flag sikrer at det virker første gang

Klik **"Save Changes"**

---

## 🚀 DEPLOY

### 5️⃣ Trigger Manual Deploy

1. Gå tilbage til **Overview** tab (eller scroll til toppen)
2. Klik på **"Manual Deploy"** knappen (blå knap øverst til højre)
3. Vælg: **"Clear build cache & deploy"** (VIGTIGT!)
4. Klik **"Yes, deploy"**

### 6️⃣ Monitor Deployment

Klik på **"Logs"** tab

**Kig efter disse linjer (betyder SUCCESS):**

✅ **Successful build:**
```
npm run build
✔ Built successfully
```

✅ **Prisma generation:**
```
npx prisma generate
✔ Generated Prisma Client (v6.16.3)
```

✅ **Database schema sync:**
```
npx prisma db push
✔ The database is now in sync with your Prisma schema
```

✅ **Server start:**
```
Server running on port 3000
```

---

## ❌ HVIS DU SER FEJL

### Fejl: "P1001: Can't reach database server"

**Løsning:** Brug Direct Connection i stedet for Transaction Pooler

Gå tilbage til Environment tab og opdater `DATABASE_URL` til:
```
postgresql://postgres:Habibie12%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres
```

Trigger ny deploy.

---

### Fejl: "FATAL: Tenant or user not found"

**Løsning:** Username format er forkert

Sørg for at DATABASE_URL bruger:
- `postgres.oaevagdgrasfppbrxbey` (MED punktum og projekt-ref)
- IKKE bare `postgres`

---

### Fejl: "Pre-Deploy command failed"

**Løsning:** Spring Pre-Deploy Command over midlertidigt

1. Gå til Settings → Pre-Deploy Command
2. Sæt til kun: `npx prisma generate`
3. Deploy igen
4. Når deployment virker, tilføj resten tilbage

---

## ✅ VERIFICER AT DET VIRKER

### Test 1: Check Logs
Leder du stadig ser i Logs tab, scroll til bunden og kig efter:
```
✔ Database connected successfully
Server listening on port 3000
```

### Test 2: Health Endpoint
Åbn en ny browser tab og gå til:
```
https://api.renos.dk/health
```

**Forventet respons:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-10-08T..."
}
```

### Test 3: Verificer i Supabase Dashboard
1. Gå tilbage til Supabase Dashboard
2. Klik på **"Table Editor"** i venstre menu
3. Du skulle nu se disse tabeller oprettet:
   - `customers`
   - `leads`
   - `bookings`
   - `chat_sessions`
   - `chat_messages`
   - `email_responses`
   - `quotes`

Hvis tabellerne er der = **MIGRATIONEN ER KOMPLET!** 🎉

---

## 📝 CHECKLIST

Marker af efterhånden som du fuldfører:

- [ ] Opdateret `DATABASE_URL` med Transaction Pooler URL
- [ ] Tilføjet `SUPABASE_URL`
- [ ] Tilføjet `SUPABASE_ANON_KEY`
- [ ] Tilføjet `SUPABASE_SERVICE_KEY` (husk at hente fra Supabase API settings!)
- [ ] Opdateret Pre-Deploy Command med Prisma kommandoer
- [ ] Trigget Manual Deploy med "Clear build cache"
- [ ] Logs viser "Database connected successfully"
- [ ] Health endpoint returnerer 200 OK
- [ ] Tabeller synlige i Supabase Table Editor

---

## 🎯 NÆSTE STEP EFTER SUCCESS

Når deployment er succesfuld:

1. **Commit dine ændringer:**
```bash
git add RENDER_SUPABASE_SETUP.md HOSTINGER_HORIZONS_MESSAGE.md .env
git commit -m "feat: migrate backend to Supabase database"
git push origin feature/frontend-redesign
```

2. **Send beskeden til Hostinger Horizons:**
Åbn `HOSTINGER_HORIZONS_MESSAGE.md` og kopier hele indholdet til deres chat.

3. **Test at alt virker sammen:**
- Åbn frontend (Hostinger Horizons site)
- Opret et nyt lead
- Check at det dukker op i Supabase Table Editor
- Check at backend logger viser aktivitet

---

## 💪 DU ER KLAR

Gå nu til Render.com og følg steppene! 🚀

Når du er færdig, fortæl mig om deployment virkede! 🔥
