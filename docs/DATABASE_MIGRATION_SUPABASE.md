# Database Migration: MySQL → Supabase PostgreSQL

## ⚠️ Problem Identified

**Current Setup:**

- Systemet bruger **MySQL** (via Drizzle ORM)
- Database: `friday_ai` på localhost:3306
- Connection: `mysql://friday_user:friday_password@localhost:3306/friday_ai`

**Expected Setup:**

- Skal bruge **Supabase PostgreSQL** (Tekup-databasen)
- Connection: `postgresql://postgres:PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=friday_ai`

## 🔄 Migration Plan

### Option 1: Migrate Schema to Supabase PostgreSQL

**Steps:**

1. Opdater `drizzle.config.ts` til PostgreSQL
2. Konverter MySQL schema til PostgreSQL kompatibelt
3. Opret tabeller i Supabase
4. Migrer eksisterende data (hvis nogen)

### Option 2: Keep MySQL but Use Supabase for Emails

**Alternative:**

- Behold MySQL for core data
- Brug Supabase kun for email storage hvis nødvendigt

### Option 3: Use Supabase Storage for Attachments Only

**Lightweight:**

- Behold MySQL for email metadata
- Brug Supabase Storage for attachments

## 📋 Recommended: Full Migration to Supabase

### Why Supabase?

- ✅ Central Tekup database (alle projekter deler)
- ✅ PostgreSQL (bedre til JSON/relational data)
- ✅ Built-in storage for attachments
- ✅ Row Level Security (RLS)
- ✅ Real-time subscriptions (fremtidig feature)

### Migration Steps

#### 1. Update Drizzle Config

```typescript
// drizzle.config.ts
export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql", // Changed from mysql
  dbCredentials: {
    url: process.env.DATABASE_URL, // PostgreSQL connection string
  },
});
```

#### 2. Update Schema to PostgreSQL

- Change `mysqlTable` → `pgTable`
- Change `int` → `serial` for auto-increment
- Change `varchar` → `text` or `varchar` (PostgreSQL)
- Update `mysqlEnum` → PostgreSQL enum
- Update `timestamp` → `timestamp` (same but different syntax)

#### 3. Update DB Connection

```typescript
// server/db.ts
import { drizzle } from "drizzle-orm/postgres-js"; // Changed from mysql2
import postgres from "postgres";

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    const client = postgres(process.env.DATABASE_URL);
    _db = drizzle(client);
  }
  return _db;
}
```

#### 4. Update Environment Variables

```bash
# .env
DATABASE_URL=postgresql://postgres:PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=friday_ai
```

## 🎯 Immediate Action

**Should we migrate to Supabase PostgreSQL?**

If yes:

1. I'll update schema to PostgreSQL
2. Create migration script
3. Update all database queries
4. Test with Supabase connection

**Current Status:**

- ✅ Code written for MySQL
- ⚠️ Needs conversion to PostgreSQL for Supabase
- 📋 Migration path identified
