# 🚀 Supabase Migration Package for renos-backend

Dette er en komplet pakke til at migrere din separate `renos-backend` til Supabase.

## 📦 Pakke indhold:

### 🔧 Konfigurationsfiler:
- `lib/supabase.ts` - Supabase client setup
- `middleware/supabaseAuth.ts` - Authentication middleware  
- `components/auth/SupabaseAuthProvider.tsx` - React auth provider

### 📄 Dokumentation:
- `SUPABASE_FIX_GUIDE.md` - Komplet setup guide
- `SUPABASE_MIGRATION.md` - Migration guide
- `SUPABASE_QUICKSTART.md` - Quick start guide

### 🗄️ Database:
- `supabase-migration.sql` - SQL migration script
- `scripts/supabase-migration.ps1` - PowerShell setup script

### 🔐 Environment:
- `.env.supabase` - Environment variabler template

## 🎯 Installation i renos-backend:

1. **Kopier alle filer** fra denne pakke til din `renos-backend` mappe
2. **Opdater .env** med Supabase credentials
3. **Installer dependencies**: `npm install @supabase/supabase-js @supabase/ssr`
4. **Kør migration script**: `.\scripts\supabase-migration.ps1`

## ✅ Supabase Credentials:

```env
SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Nzc3NjQsImV4cCI6MjA3NTQ1Mzc2NH0.M0Kt1Xi-3VVoq6NJ7VbhqBC0z9EK-JQ7ypssayMw7s8
SUPABASE_SERVICE_KEY=[din service key]
DATABASE_URL=postgresql://postgres:[password]@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres
```

## 🔄 Migration Steps:

1. Backup din nuværende database
2. Kopier filerne til renos-backend
3. Opdater environment variabler
4. Installer Supabase dependencies
5. Test forbindelsen
6. Migrer data (optional)

---

**Spørgsmål?** Se de inkluderede guides eller spørg! 🤔