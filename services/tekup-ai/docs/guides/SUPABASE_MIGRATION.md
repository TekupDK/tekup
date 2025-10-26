# 🔄 Supabase Migration Guide

## Step 1: Reset Supabase Database Password

1. Gå til [Supabase Dashboard](https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey/settings/database)
2. Klik på "Database Settings"
3. Scroll ned til "Database Password"
4. Klik "Reset Database Password"
5. Kopier det nye password (f.eks. `ZyX9pQm4K7vN2wE8`)

---

## Step 2: Opdater Lokale Environment Variables

Opret `.env` fil i roden af projektet (hvis den ikke findes):

```bash
# Supabase Database (Direct Connection - til migrations)
DATABASE_URL=postgresql://postgres:ZyX9pQm4K7vN2wE8@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres

# Supabase API credentials (optional)
SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Nzc3NjQsImV4cCI6MjA3NTQ1Mzc2NH0.M0Kt1Xi-3VVoq6NJ7VbhqBC0z9EK-JQ7ypssayMw7s8

# Kopier resten fra .env.example og tilpas
```

**⚠️ VIGTIGT:** Erstat `ZyX9pQm4K7vN2wE8` med dit rigtige password fra Step 1!

---

## Step 3: Kør Prisma Migration til Supabase

```powershell
# 1. Generer Prisma client
npm run db:generate

# 2. Push schema til Supabase (development)
npm run db:push

# Eller hvis du vil oprette en migration (production):
npx prisma migrate dev --name init_supabase

# 3. Verify migration
npx prisma db pull
```

**Forventet output:**
```
✔ Generated Prisma Client
✔ The database is now in sync with the Prisma schema
✔ Migration applied successfully
```

---

## Step 4: Test Database Connection Lokalt

```powershell
# Test at Prisma kan forbinde til Supabase
npm run test:db

# Eller manuelt:
npx prisma studio
```

Dette åbner Prisma Studio i browser (<http://localhost:5555>) hvor du kan se dine tabeller.

---

## Step 5: Opdater Render.com Environment Variables

### A) Gå til Render Dashboard
1. Log ind på [Render.com](https://dashboard.render.com)
2. Vælg dit backend service (f.eks. "renos-backend")
3. Klik på "Environment" i venstre menu

### B) Opdater DATABASE_URL
**⚠️ VIGTIGT:** Brug **Transaction Pooler** URL til Render (ikke direct connection)

```bash
# ERSTAT eksisterende DATABASE_URL med:
DATABASE_URL=postgresql://postgres.oaevagdgrasfppbrxbey:ZyX9pQm4K7vN2wE8@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
```

**Hvorfor Transaction Pooler?**
- ✅ Optimeret til serverless environments (Render)
- ✅ Håndterer mange korte connections
- ✅ IPv4 kompatibel (Render kræver dette)
- ✅ Ingen connection limit issues

### C) Tilføj Supabase API Credentials (optional)

Hvis du senere vil bruge Supabase client i stedet for Prisma:

```bash
SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=<hent fra Supabase Settings → API → service_role key>
```

### D) Klik "Save Changes"

Render vil automatisk re-deploy din service med de nye environment variables.

---

## Step 6: Kør Database Migration på Render

Render skal køre Prisma migrations efter deployment:

### Option A: Automatisk via Build Command

Opdater **Build Command** i Render dashboard:

```bash
npm install && npm run build && npx prisma migrate deploy
```

### Option B: Manuelt via Shell

1. Gå til Render Dashboard → din service
2. Klik på "Shell" tab (øverst til højre)
3. Kør:

```bash
npx prisma migrate deploy
```

---

## Step 7: Verify Production Deployment

### A) Check Logs
I Render Dashboard, gå til "Logs" og kig efter:

```
✔ Prisma schema loaded from prisma/schema.prisma
✔ Datasource "db": PostgreSQL database
✔ Applying migration `20250108_init_supabase`
✔ Migration applied successfully
```

### B) Test API Endpoint

```bash
curl https://your-backend.onrender.com/health
```

Forventet response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-10-08T12:00:00Z"
}
```

### C) Test fra Frontend

Gå til din frontend (Hostinger) og tjek at Dashboard loader data.

---

## Step 8: Data Migration (hvis du har eksisterende data)

Hvis du har data i Neon som skal flyttes til Supabase:

### A) Export fra Neon

```bash
# Installer pg_dump (hvis du ikke har det)
# Windows: Download PostgreSQL tools fra postgresql.org

# Export data (erstat med dine Neon credentials)
pg_dump "postgresql://user:password@neon-host:5432/neon_db" > neon_backup.sql
```

### B) Import til Supabase

**Via Supabase Dashboard:**
1. Gå til [SQL Editor](https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey/sql)
2. Upload `neon_backup.sql`
3. Klik "Run"

**Via Terminal:**
```bash
psql "postgresql://postgres:ZyX9pQm4K7vN2wE8@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres" < neon_backup.sql
```

---

## Step 9: Cleanup (optional)

### Fjern Neon Database

1. Log ind på [Neon Console](https://console.neon.tech)
2. Vælg dit projekt
3. Klik "Delete Project"
4. Bekræft deletion

### Fjern gamle environment variables

Hvis du havde Neon-specifikke env vars, fjern dem fra Render.

---

## 🚨 Troubleshooting

### Problem: "Connection timeout" fra Render

**Løsning:** Du bruger sandsynligvis Direct Connection URL i stedet for Transaction Pooler.

Skift til:
```bash
postgresql://postgres.oaevagdgrasfppbrxbey:[PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
```

### Problem: "Password authentication failed"

**Løsning:** Reset password i Supabase Dashboard og opdater DATABASE_URL overalt.

### Problem: "Prepared statements not supported"

**Løsning:** Dette er normalt med Transaction Pooler. Prisma håndterer dette automatisk.

Hvis det giver problemer, tilføj `?pgbouncer=true` til DATABASE_URL:
```bash
DATABASE_URL=postgresql://...?pgbouncer=true
```

### Problem: "Too many connections"

**Løsning:** Reducer `connection_limit` i Prisma schema:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connectionLimit = 5
}
```

---

## ✅ Success Checklist

- [ ] Supabase database password reset
- [ ] Lokalt `.env` opdateret med DATABASE_URL
- [ ] Prisma migration kørt lokalt (`npm run db:push`)
- [ ] Prisma Studio viser tabeller (<http://localhost:5555>)
- [ ] Render.com DATABASE_URL opdateret (Transaction Pooler)
- [ ] Render re-deployed med nye env vars
- [ ] Prisma migration kørt på Render (`npx prisma migrate deploy`)
- [ ] API `/health` endpoint returnerer "connected"
- [ ] Frontend Dashboard loader data fra Supabase
- [ ] (Optional) Data migreret fra Neon til Supabase
- [ ] (Optional) Neon projekt slettet

---

## 📚 Nyttige Links

- [Supabase Dashboard](https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey)
- [Supabase Database Settings](https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey/settings/database)
- [Supabase SQL Editor](https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey/sql)
- [Render Dashboard](https://dashboard.render.com)
- [Prisma Docs: Connection Pooling](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)

---

## 🎯 Next Steps (optional - for fuld Supabase integration)

Når du er klar til at bruge Supabase's fulde features:

1. **Real-time subscriptions:** Brug Supabase client i stedet for polling
2. **Row Level Security (RLS):** Tilføj policies i Supabase
3. **Edge Functions:** Flyt serverless logic til Supabase Edge Functions
4. **Storage:** Brug Supabase Storage til billeder/filer
5. **Supabase Auth:** Migrer fra Clerk til Supabase Auth (optional)

Se `docs/SUPABASE_ADVANCED.md` for guides (kommer snart).
