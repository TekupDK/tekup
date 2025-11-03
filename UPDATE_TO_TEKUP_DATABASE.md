# Update to Tekup Database

**Status:** ⚠️ **Needs Tekup Database Connection String**

---

## Current Configuration

**Current Database:** Supabase PostgreSQL (Friday AI dedicated)

- **Host:** `db.oaevagdgrasfppbrxbey.supabase.co`
- **Schema:** `friday_ai`
- **Database:** `postgres`

---

## Target Configuration

**Target Database:** Tekup Database (RenOS - Production)

- **Project:** RenOS
- **Tier:** micro
- **Tables:** 39
- **Schema:** Likely `renos` or `public`

---

## Required Information

To update tekup-ai-v2 to use Tekup Database, we need:

1. **Connection String** from Supabase Dashboard:
   - Go to: Tekup Database → Settings → Database
   - Copy the connection string (Connection pooling or Direct connection)
   - Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?schema=[SCHEMA]&sslmode=require`

2. **Schema Name:**
   - Check which schema contains the Friday AI tables
   - Likely options: `renos`, `friday_ai`, or `public`

3. **Password:**
   - Get database password from Supabase Dashboard
   - Settings → Database → Database password

---

## Update Steps (After Getting Connection String)

### 1. Update .env.supabase

```bash
DATABASE_URL=postgresql://postgres:[TEKUP_DB_PASSWORD]@[TEKUP_DB_HOST]:5432/postgres?schema=[SCHEMA_NAME]&sslmode=require
```

### 2. Update docker-compose.yml

Update the default DATABASE_URL to use Tekup Database connection string.

### 3. Test Connection

```bash
pnpm drizzle-kit push
```

---

## Current vs Target

| Aspect   | Current                               | Target                     |
| -------- | ------------------------------------- | -------------------------- |
| Host     | `db.oaevagdgrasfppbrxbey.supabase.co` | `[Tekup DB Host]`          |
| Schema   | `friday_ai`                           | `[renos/friday_ai/public]` |
| Database | `postgres`                            | `postgres`                 |
| Purpose  | Friday AI dedicated                   | Tekup Database (shared)    |

---

**Action Required:** Get Tekup Database connection string from Supabase Dashboard and provide it for update.
