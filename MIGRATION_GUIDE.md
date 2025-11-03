# PostgreSQL Migration Guide - Friday AI v2

## ✅ Migration Status: COMPLETED

Alle kode-ændringer er implementeret på branch `migration/postgresql-supabase`.

## 📋 Hvad er ændret?

### 1. **Dependencies**

- ✅ Fjernet: `mysql2`
- ✅ Tilføjet: `postgres`

### 2. **Schema Conversion (drizzle/schema.ts)**

- ✅ Alle 20 tabeller konverteret fra MySQL til PostgreSQL
- ✅ `mysqlTable` → `pgTable`
- ✅ `int().autoincrement()` → `serial()`
- ✅ `mysqlEnum` → `pgEnum` (10 enum types oprettet)
- ✅ `json()` → `jsonb()`
- ✅ `onUpdateNow()` fjernet (triggers oprettes manuelt)

### 3. **Database Connection**

- ✅ `drizzle-orm/mysql2` → `drizzle-orm/postgres-js`
- ✅ `onDuplicateKeyUpdate` → `onConflictDoUpdate`
- ✅ `drizzle.config.ts` opdateret til `dialect: "postgresql"`

### 4. **Configuration Files**

- ✅ `.env.supabase` oprettet (Supabase connection string)
- ✅ `docker-compose.supabase.yml` oprettet (til testing)
- ✅ `postgresql_triggers.sql` oprettet (auto-update timestamps)

## 🚀 Næste Skridt til Testing

### Step 1: Install Dependencies

```bash
cd C:\Users\empir\Tekup\services\tekup-ai-v2
pnpm install
```

### Step 2: Test Schema Generation

```bash
# Brug Supabase connection
cp .env.supabase .env
pnpm db:push
```

### Step 3: Run PostgreSQL Triggers

Efter schema er pushed, kør trigger SQL:

```sql
-- Kør via Supabase SQL Editor eller psql
\i drizzle/migrations/postgresql_triggers.sql
```

### Step 4: Test Application

```bash
# Test med Supabase
pnpm dev
```

## 🔄 Tilbage til MySQL (Fallback)

Hvis du skal tilbage til MySQL:

```bash
# Opdater .env til MySQL connection string
DATABASE_URL=mysql://friday_user:friday_password@localhost:3306/friday_ai

# Eller brug docker-compose (original)
docker-compose up
```

## 📝 Noter

- **Enum Types:** Oprettes automatisk af Drizzle via migrations
- **Triggers:** Skal køres manuelt efter schema migration
- **Data Migration:** Hvis produktionsdata findes, skal de migreres separat

## ✅ Success Criteria

- [ ] Schema pushes til Supabase uden fejl
- [ ] Alle enum types oprettet korrekt
- [ ] Triggers aktiveret og virker
- [ ] App starter og forbinder til Supabase
- [ ] Alle CRUD operations virker
- [ ] Upsert queries virker (onConflictDoUpdate)
