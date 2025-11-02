# 🚀 Quick Start Guide - Tekup Database

**For Developers: Get started with the consolidated Tekup database in 5 minutes**

---

## 🎯 What You Need to Know

### Single Database Architecture

✅ **All Tekup applications share ONE Supabase database**

```
📦 Production Database:
   - Provider: Supabase
   - Project: RenOS By Tekup
   - URL: https://oaevagdgrasfppbrxbey.supabase.co
   - Region: EU Central 1 (Frankfurt, Germany)
   - Schemas: vault, billy, renos, crm, flow, shared
```

### Key Points

- ✅ **ONE database** for all Tekup apps (no data fragmentation)
- ✅ **Supabase** for production (managed, backups, security)
- ✅ **Docker** for local dev only (optional, offline work)
- ✅ **Multi-schema** design (apps isolated by schema)

---

## 🏃 Quick Start Options

### Option 1: Use Supabase (Recommended for Production)

**Best for:** Connecting your app to production database

```bash
# 1. Copy the Supabase environment template
cd your-app-directory
cp .env.example .env.production

# 2. The file already has the correct Supabase URLs:
# SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
# SUPABASE_ANON_KEY=eyJhbGci... (already filled in)

# 3. Get the database password from Supabase dashboard
# Visit: https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey
# Go to: Settings → Database → Connection string
# Copy the password

# 4. Update DATABASE_URL in .env.production
# Replace YOUR_PASSWORD with the actual password

# 5. You're ready! Start your app
npm run dev
```

**Example .env.production:**
```bash
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=renos&sslmode=require
SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Nzc3NjQsImV4cCI6MjA3NTQ1Mzc2NH0.M0Kt1Xi-3VVoq6NJ7VbhqBC0z9EK-JQ7ypssayMw7s8
```

---

### Option 2: Local Development with Docker (Optional)

**Best for:** Offline development without internet connection

```bash
# 1. Navigate to database package
cd apps/production/tekup-database

# 2. Copy local environment template
cp .env.example .env

# 3. Start Docker Desktop (make sure it's running)

# 4. Start PostgreSQL container
docker-compose up -d

# 5. Generate Prisma client
pnpm db:generate

# 6. Push schema to local database
pnpm db:push

# 7. Verify it's running
docker ps | grep tekup-database

# 8. Optional: Open Prisma Studio to view data
pnpm db:studio
# Opens at http://localhost:5555
```

**Note:** Local Docker is for development only. Never use it for production!

---

## 📱 Per Application Setup

### RendetaljeOS Backend

```bash
cd apps/rendetalje/services/backend-nestjs

# Copy environment file
cp .env.example .env

# Update DATABASE_URL with your password
# Schema: renos
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=renos&sslmode=require

# Start the app
npm run dev
```

### Tekup-Billy (Railway)

**Note:** Already configured in production with Railway environment variables.

For local testing:
```bash
cd apps/production/tekup-billy

# Copy environment file
cp .env.example .env

# Update with Supabase credentials (already in .env.railway)
# Schema: billy
```

### Tekup-AI

```bash
cd apps/tekup-ai/backend

# Copy environment file
cp .env.example .env

# Update DATABASE_URL with your password
# Schema: renos (shared with RendetaljeOS)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=renos&sslmode=require
```

### Tekup Cloud Dashboard

```bash
cd apps/web/tekup-cloud-dashboard

# Copy environment file
cp .env.example .env

# Supabase credentials (already filled in)
VITE_SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci... (already in .env.example)
```

---

## 🗂️ Schema Guide

Choose the right schema for your application:

| Schema | Purpose | Applications |
|--------|---------|-------------|
| `vault` | Knowledge base, document embeddings | TekupVault |
| `billy` | Accounting integration, Billy.dk API | Tekup-Billy |
| `renos` | Cleaning service management | RendetaljeOS, Tekup-AI |
| `crm` | Customer relationship management | Tekup CRM |
| `flow` | Workflow automation | Flow API |
| `shared` | Cross-app resources (users, audit) | All apps |

**Example URLs:**
```bash
# Vault
DATABASE_URL=postgresql://postgres:PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=vault&sslmode=require

# Billy
DATABASE_URL=postgresql://postgres:PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=billy&sslmode=require

# Renos
DATABASE_URL=postgresql://postgres:PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=renos&sslmode=require

# CRM
DATABASE_URL=postgresql://postgres:PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=crm&sslmode=require

# Flow
DATABASE_URL=postgresql://postgres:PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=flow&sslmode=require

# Shared
DATABASE_URL=postgresql://postgres:PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=shared&sslmode=require
```

---

## 🔑 Getting Credentials

### Database Password

1. Visit [Supabase Dashboard](https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey)
2. Go to **Settings** → **Database**
3. Scroll to **Connection string**
4. Click **Show** to reveal password
5. Copy the password

### Supabase API Keys

**Already in .env.example files!** You don't need to get these separately:

```bash
SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Nzc3NjQsImV4cCI6MjA3NTQ1Mzc2NH0.M0Kt1Xi-3VVoq6NJ7VbhqBC0z9EK-JQ7ypssayMw7s8
```

---

## 🛠️ Common Tasks

### View Database in Prisma Studio

```bash
cd apps/production/tekup-database

# Make sure you have the correct DATABASE_URL in .env
pnpm db:studio

# Opens at http://localhost:5555
# Browse all schemas and tables
```

### Check Connection

```bash
cd apps/production/tekup-database

# Test connection
pnpm db:health

# Should output: ✅ Database connection successful
```

### Update Schema (Database Admin Only)

```bash
cd apps/production/tekup-database

# Generate Prisma client after schema changes
pnpm db:generate

# Push schema changes to database
pnpm db:push

# Or create migration
pnpm db:migrate dev --name your_migration_name
```

---

## 🚨 Troubleshooting

### "Authentication failed" Error

**Problem:** Wrong database password

**Solution:**
1. Get fresh password from Supabase dashboard
2. Make sure you URL-encode special characters (e.g., `@` becomes `%40`)
3. Verify no extra spaces in .env file

### "Connection timeout" Error

**Problem:** Network/firewall issue or wrong URL

**Solution:**
1. Verify you have internet connection
2. Check URL is correct: `db.oaevagdgrasfppbrxbey.supabase.co`
3. Make sure `sslmode=require` is in connection string

### "Schema does not exist" Error

**Problem:** Wrong schema specified or schema not created

**Solution:**
1. Verify schema name (vault, billy, renos, crm, flow, shared)
2. Run `pnpm db:push` to create schemas if needed
3. Check you're using the right schema for your app

### "Too many connections" Error

**Problem:** Connection pool exhausted

**Solution:**
1. Use connection pooling: Add `?pgbouncer=true&connection_limit=1` to URL
2. Close unused connections in your code
3. Consider upgrading Supabase plan

---

## 📚 Additional Resources

- **Full Documentation:** [DATABASE_CONSOLIDATION_COMPLETE.md](./DATABASE_CONSOLIDATION_COMPLETE.md)
- **Database Package:** [apps/production/tekup-database/README.md](./apps/production/tekup-database/README.md)
- **Supabase Docs:** https://supabase.com/docs
- **Prisma Docs:** https://www.prisma.io/docs

---

## ✅ Checklist

Before you start developing:

- [ ] I understand we have ONE Supabase database for all apps
- [ ] I know which schema my app uses (vault, billy, renos, crm, flow, shared)
- [ ] I have copied .env.example to .env (or .env.production)
- [ ] I have the database password from Supabase dashboard
- [ ] I have updated DATABASE_URL with the correct password
- [ ] I can connect to the database (tested with `pnpm db:health`)
- [ ] I know Docker is for local dev only (optional)

---

**Need Help?**

- Check [DATABASE_CONSOLIDATION_COMPLETE.md](./DATABASE_CONSOLIDATION_COMPLETE.md) for detailed info
- Open a GitHub issue
- Ask in team chat

**Happy coding! 🚀**
