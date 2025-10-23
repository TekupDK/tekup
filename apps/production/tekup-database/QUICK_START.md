# 🚀 Tekup Database - Quick Start Guide

**PRÆCIS guide - følg hvert skridt nøjagtigt**

---

## ✅ Du Står Her Nu

Du har åbnet `tekup-database` workspace i VS Code.

**Status:**
- ✅ Dependencies installeret (pnpm install done)
- ✅ .env fil oprettet
- ⚠️ Docker Desktop skal startes
- ⏳ Database skal oprettes

---

## 📋 Step 1: Start Docker Desktop

### Hvad du ser nu:
En fejl: "unable to get image 'ankane/pgvector:v0.7.4'"

### Hvad du skal gøre:

**Windows:**
1. Tryk **Windows-tast**
2. Skriv: `Docker Desktop`
3. Tryk **Enter**
4. **VENT** indtil Docker Desktop er startet (2-3 minutter)
   - Du ser en grøn status nederst: "Engine running"

**Hvordan ved jeg det er klar?**
- Docker Desktop viser: 🟢 "Docker Desktop is running"
- Systemtray icon (nederst til højre) er grøn

---

## 📋 Step 2: Godkend Prisma Build Scripts

### Hvad du ser nu:
```
? Choose which packages to build
  ( ) @prisma/client
  ( ) @prisma/engines  
  ( ) esbuild
  ( ) prisma
```

### Hvad du skal gøre:

1. **Tryk `Space`** på disse 3 (marker med X):
   - [X] @prisma/client
   - [X] @prisma/engines
   - [X] prisma

2. **Tryk `Enter`** for at godkende

**Resultat:** Du ser "Approved builds for..."

---

## 📋 Step 3: Start Database (Docker)

### I VS Code Terminal:

```bash
docker-compose up -d
```

### Hvad du ser:
```
✔ Network tekup-network           Created
✔ Volume tekup-postgres-data      Created  
✔ Container tekup-database-postgres   Started
✔ Container tekup-database-pgadmin    Started
```

**Hvis det fejler:** Docker Desktop er ikke startet - gå tilbage til Step 1

---

## 📋 Step 4: Check Database Er Klar

### I VS Code Terminal:

```bash
docker ps
```

### Hvad du SKAL se:
```
CONTAINER ID   IMAGE                       STATUS
xxxxx         ankane/pgvector:v0.7.4      Up 10 seconds (healthy)
xxxxx         dpage/pgadmin4:latest       Up 10 seconds
```

**Hvis STATUS er "starting":** Vent 30 sekunder og kør `docker ps` igen

---

## 📋 Step 5: Generer Prisma Client

### I VS Code Terminal:

```bash
pnpm db:generate
```

### Hvad du ser:
```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma

✔ Generated Prisma Client to .\node_modules\@prisma\client
```

**Hvis fejl:** Kopier fejlmeddelelsen til mig

---

## 📋 Step 6: Kør Database Migrations

### I VS Code Terminal:

```bash
pnpm db:migrate
```

### Hvad du ser:
```
? Enter a name for the new migration:
```

### Hvad du skal gøre:

1. **Skriv:** `initial_setup`
2. **Tryk Enter**

### Resultat du SKAL se:
```
✅ The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20251020xxxxxx_initial_setup/
    └─ migration.sql

✔ Generated Prisma Client
```

**Hvis fejl:** Kopier fejlmeddelelsen til mig

---

## 📋 Step 7: Åbn Database Browser (Prisma Studio)

### I VS Code Terminal:

```bash
pnpm db:studio
```

### Hvad du ser:
```
Prisma Studio is up on http://localhost:5555
```

### Hvad du skal gøre:

1. **VS Code viser popup:** "Open in Browser?"
   - **Klik: "Open"**

2. **ELLER** åbn browser og gå til: `http://localhost:5555`

### Hvad du SKAL se:

En web-side med:
- **vault** schema
  - documents (0)
  - embeddings (0)
  - sync_status (0)
- **billy** schema
  - organizations (0)
  - users (0)
  - cached_invoices (0)
  - ... (flere tabeller)
- **shared** schema
  - users (0)
  - audit_logs (0)

**SUCCESS! 🎉 Databasen er klar!**

---

## ✅ Verification Checklist

Tjek at alt virker:

- [ ] Docker Desktop kører (grøn status)
- [ ] `docker ps` viser 2 containers (healthy)
- [ ] Prisma Client genereret (ingen fejl)
- [ ] Migrations kørt (initial_setup created)
- [ ] Prisma Studio åben på http://localhost:5555
- [ ] Kan se tabeller i vault, billy, shared schemas

**Hvis ALLE er ✅:** Du er DONE! Database er klar til brug.

---

## 🆘 Troubleshooting

### Problem 1: Docker kommando virker ikke

**Fejl:** "docker: command not found" eller lignende

**Løsning:**
1. Luk VS Code
2. Start Docker Desktop
3. Vent til den er grøn
4. Genåbn VS Code
5. Prøv igen

---

### Problem 2: Prisma kan ikke forbinde til database

**Fejl:** "Can't reach database server at localhost:5432"

**Løsning:**
```bash
# 1. Check om container kører
docker ps

# 2. Hvis ikke, start den
docker-compose up -d

# 3. Vent 30 sekunder
# 4. Prøv migration igen
pnpm db:migrate
```

---

### Problem 3: Port 5432 allerede i brug

**Fejl:** "port 5432 is already allocated"

**Løsning:**

**Option A: Stop eksisterende PostgreSQL**
```bash
# Find hvad bruger port 5432
netstat -ano | findstr :5432

# Stop task (brug PID fra output)
taskkill /PID [PID] /F
```

**Option B: Ændre port i docker-compose.yml**
```yaml
# Rediger docker-compose.yml linje 15:
ports:
  - '5433:5432'  # Ændret fra 5432 til 5433

# Og rediger .env:
DATABASE_URL="postgresql://tekup:tekup123@localhost:5433/tekup_db"
```

---

### Problem 4: Migrations fejler

**Fejl:** Hvilken som helst fejl under `pnpm db:migrate`

**Løsning:**
```bash
# 1. Reset alt
docker-compose down
docker volume rm tekup-postgres-data

# 2. Start frisk
docker-compose up -d

# 3. Vent 30 sekunder

# 4. Prøv igen
pnpm db:migrate
```

---

## 🎯 Næste Skridt Efter Setup

### 1. Test Connection

```typescript
// I VS Code, opret: test-connection.ts
import { prisma } from './src/client';

async function test() {
  const result = await prisma.$queryRaw`SELECT 1`;
  console.log('✅ Database connected!', result);
  await prisma.$disconnect();
}

test();
```

Kør: `npx tsx test-connection.ts`

### 2. Seed Test Data (Optional)

```bash
pnpm db:seed
```

### 3. Forbind Første Service

Nu er databasen klar til at modtage data fra:
- TekupVault
- Tekup-Billy
- RenOS
- etc.

---

## 📞 Hjælp Needed?

**Hvis du står fast:**

1. **Kopier fejlmeddelelsen nøjagtigt**
2. **Fortæl hvilket step du er på**
3. **Send screenshot hvis muligt**

Så hjælper jeg dig videre! 🚀

---

**Held og lykke!** Du er på vej til en professionel database setup! 💪
