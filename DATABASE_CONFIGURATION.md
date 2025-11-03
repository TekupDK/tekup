# Database Configuration - tekup-ai-v2

**Current Database:** Supabase PostgreSQL
**Status:** ✅ Configured and Ready

---

## Current Database Setup

### Connection Details

- **Type:** Supabase PostgreSQL
- **Host:** `db.oaevagdgrasfppbrxbey.supabase.co`
- **Port:** `5432`
- **Database:** `postgres`
- **Schema:** `friday_ai`
- **SSL:** Required (`sslmode=require`)

### Connection String

```
postgresql://postgres:Habibie12345%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=friday_ai&sslmode=require
```

### Configuration Files

- `.env.supabase` - Supabase connection string
- `drizzle.config.ts` - PostgreSQL dialect configured
- `docker-compose.yml` - Supabase as default database

---

## Migration History

### Previous Database

- **Type:** MySQL/TiDB (MySQL-compatible)
- **Status:** Migrated to Supabase PostgreSQL

### Current Database

- **Type:** Supabase PostgreSQL
- **Provider:** Supabase (managed PostgreSQL)
- **Status:** ✅ Active and configured

---

## Database Location

**Current:** Supabase Cloud PostgreSQL

- Managed PostgreSQL service
- Hosted on Supabase infrastructure
- Not a local Tekup database

**Note:** This is a Supabase managed database, not a self-hosted Tekup database instance.

---

## Summary

**Database Type:** Supabase PostgreSQL ✅
**Migration:** Complete (MySQL → PostgreSQL) ✅
**Configuration:** Ready for production ✅

---

**Database is Supabase PostgreSQL, not a local Tekup database instance.**
