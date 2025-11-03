# 🔄 ENVIRONMENT MIGRATION GUIDE# PostgreSQL Migration Guide - Friday AI v2



**Fra:** Single `.env` file strategi  ## ✅ Migration Status: COMPLETED

**Til:** Separate `.env.dev` og `.env.prod` files  

**Dato:** November 3, 2025  Alle kode-ændringer er implementeret på branch `migration/postgresql-supabase`.

**Status:** ✅ COMPLETED

## 📋 Hvad er ændret?

---

### 1. **Dependencies**

## 📋 Hvad er Ændret?

- ✅ Fjernet: `mysql2`

### Før (Old Structure):- ✅ Tilføjet: `postgres`

```

.env                    ← Brugt til både dev og prod (konflikt!)### 2. **Schema Conversion (drizzle/schema.ts)**

.env.supabase           ← Duplikat af .env

docker-compose.yml      ← env_file: .env- ✅ Alle 20 tabeller konverteret fra MySQL til PostgreSQL

```- ✅ `mysqlTable` → `pgTable`

- ✅ `int().autoincrement()` → `serial()`

### Efter (New Structure):- ✅ `mysqlEnum` → `pgEnum` (10 enum types oprettet)

```- ✅ `json()` → `jsonb()`

.env.dev                ← Development (bruges af: pnpm dev)- ✅ `onUpdateNow()` fjernet (triggers oprettes manuelt)

.env.prod               ← Production (bruges af: Docker + pnpm start)

.env.dev.template       ← Template for nye udviklere (IN GIT)### 3. **Database Connection**

.env.prod.template      ← Template for production (IN GIT)

docker-compose.yml      ← env_file: .env.prod- ✅ `drizzle-orm/mysql2` → `drizzle-orm/postgres-js`

```- ✅ `onDuplicateKeyUpdate` → `onConflictDoUpdate`

- ✅ `drizzle.config.ts` opdateret til `dialect: "postgresql"`

---

### 4. **Configuration Files**

## 🎯 Hvorfor Ændringen?

- ✅ `.env.supabase` oprettet (Supabase connection string)

**Problem:** Docker loadede både `.env` OG `.env.prod`, hvilket skabte konflikter.  - ✅ `docker-compose.supabase.yml` oprettet (til testing)

**Løsning:** Docker bruger nu KUN `.env.prod`.- ✅ `postgresql_triggers.sql` oprettet (auto-update timestamps)



**Problem:** Ingen template i git for nye udviklere.  ## 🚀 Næste Skridt til Testing

**Løsning:** Templates committed til git (uden secrets).

### Step 1: Install Dependencies

---

```bash

## ✅ Quick Migration (For Udviklere)cd C:\Users\empir\Tekup\services\tekup-ai-v2

pnpm install

```powershell```

# 1. Opret .env.dev fra template

Copy-Item .env.dev.template .env.dev### Step 2: Test Schema Generation



# 2. Udfyld dine credentials```bash

code .env.dev# Brug Supabase connection

cp .env.supabase .env

# 3. Test det virkerpnpm db:push

pnpm dev```



# 4. Besøg http://localhost:3000### Step 3: Run PostgreSQL Triggers

```

Efter schema er pushed, kør trigger SQL:

**Det er det! 🎉**

```sql

----- Kør via Supabase SQL Editor eller psql

\i drizzle/migrations/postgresql_triggers.sql

## 🔒 Security Checklist```



- [x] `.env.dev` og `.env.prod` er i `.gitignore`### Step 4: Test Application

- [x] Templates er committed til git (safe)

- [x] JWT_SECRET genereret (64 chars)```bash

- [x] INBOUND_EMAIL_WEBHOOK_SECRET genereret (48 chars)# Test med Supabase

- [x] DATABASE_URL password URL-encodedpnpm dev

```

---

## 🔄 Tilbage til MySQL (Fallback)

## 🐛 Troubleshooting

Hvis du skal tilbage til MySQL:

### "DATABASE_URL not defined"

```powershell```bash

Copy-Item .env.dev.template .env.dev# Opdater .env til MySQL connection string

code .env.dev  # Udfyld DATABASE_URLDATABASE_URL=mysql://friday_user:friday_password@localhost:3306/friday_ai

```

# Eller brug docker-compose (original)

### Docker bruger forkerte værdierdocker-compose up

```powershell```

docker-compose down

docker-compose up --build## 📝 Noter

```

- **Enum Types:** Oprettes automatisk af Drizzle via migrations

---- **Triggers:** Skal køres manuelt efter schema migration

- **Data Migration:** Hvis produktionsdata findes, skal de migreres separat

## 📊 File Usage Table

## ✅ Success Criteria

| Command | Environment File |

|---------|------------------|- [ ] Schema pushes til Supabase uden fejl

| `pnpm dev` | `.env.dev` |- [ ] Alle enum types oprettet korrekt

| `pnpm start` | `.env.prod` |- [ ] Triggers aktiveret og virker

| `docker-compose up` | `.env.prod` |- [ ] App starter og forbinder til Supabase

| `pnpm db:push:dev` | `.env.dev` |- [ ] Alle CRUD operations virker

| `pnpm db:push:prod` | `.env.prod` |- [ ] Upsert queries virker (onConflictDoUpdate)


---

**Questions?** See [QUICK_ENV_REFERENCE.md](QUICK_ENV_REFERENCE.md) or [ENV_SETUP_GUIDE.md](ENV_SETUP_GUIDE.md).
