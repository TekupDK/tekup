# 🚀 Supabase Migration - Quick Start

## TL;DR - Kom i gang på 5 minutter

### 1. Reset Supabase Password
```
https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey/settings/database
→ Reset Database Password
→ Kopier nyt password
```

### 2. Kør Migration Script
```powershell
npm run supabase:migrate
```

Dette script:
- ✅ Opretter `.env` fra `.env.example`
- ✅ Genererer Prisma Client
- ✅ Pusher schema til Supabase
- ✅ Verificerer connection
- ✅ Åbner Prisma Studio

### 3. Opdater Render.com

**Environment Variables → DATABASE_URL:**
```bash
postgresql://postgres.oaevagdgrasfppbrxbey:[DIT-PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
```

**Build Command:**
```bash
npm install && npm run build && npx prisma migrate deploy
```

### 4. Test

**Lokalt:**
```powershell
npm run dev
# Åbn browser: http://localhost:3000/health
```

**Production:**
```bash
curl https://your-backend.onrender.com/health
```

---

## 📦 Nye NPM Scripts

```bash
npm run db:push           # Push schema til Supabase (development)
npm run db:pull           # Pull schema fra Supabase
npm run db:studio         # Åbn Prisma Studio (database GUI)
npm run db:reset          # Reset database (CAUTION: sletter al data!)
npm run supabase:migrate  # Kør fuld migration automatisk
```

---

## 🔗 Supabase Credentials

**Project URL:**
```
https://oaevagdgrasfppbrxbey.supabase.co
```

**Anon Key (frontend):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Nzc3NjQsImV4cCI6MjA3NTQ1Mzc2NH0.M0Kt1Xi-3VVoq6NJ7VbhqBC0z9EK-JQ7ypssayMw7s8
```

**Database URLs:**

Direct (migrations):
```bash
postgresql://postgres:[PASSWORD]@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres
```

Pooler (Render.com):
```bash
postgresql://postgres.oaevagdgrasfppbrxbey:[PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
```

---

## 🚨 Troubleshooting

### "Connection timeout" fra Render
→ Brug Transaction Pooler URL (port 6543), ikke Direct Connection

### "Password authentication failed"
→ Reset password i Supabase Dashboard og opdater overalt

### "Prepared statements not supported"
→ Tilføj `?pgbouncer=true` til DATABASE_URL

### Frontend ser ingen data
→ Tjek at Hostinger Horizons bruger rigtige Supabase queries (ikke localStorage)

---

## 📚 Fuld Dokumentation

Se `docs/SUPABASE_MIGRATION.md` for detaljeret step-by-step guide.

---

## ✅ Success Checklist

- [ ] Supabase password reset
- [ ] `npm run supabase:migrate` kørt
- [ ] Prisma Studio viser tabeller
- [ ] Render.com DATABASE_URL opdateret
- [ ] Backend deployed på Render
- [ ] `/health` endpoint returnerer "connected"
- [ ] Frontend viser data fra Supabase

---

## 🎯 Next Steps

1. **Data Migration:** Hvis du har data i Neon, import det (se guide)
2. **Frontend:** Opdater Hostinger Horizons til rigtige Supabase queries
3. **Real-time:** Tilføj Supabase subscriptions til frontend
4. **RLS:** Enable Row Level Security i Supabase
5. **Cleanup:** Slet gamle Neon database

---

**Spørgsmål?** Se `docs/SUPABASE_MIGRATION.md` eller spørg i teamet! 🚀
