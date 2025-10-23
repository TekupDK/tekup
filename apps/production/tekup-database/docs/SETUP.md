# Tekup Database - Setup Guide

Detaljeret installation og setup guide.

---

## 🎯 Prerequisites

### Required
- **Node.js 18+** (LTS anbefalet)
- **pnpm 8.15+** eller npm
- **Git**

### For Local Development
- **Docker Desktop** (anbefalet) ELLER
- **PostgreSQL 16** installeret lokalt

### For Production
- **Render.com account** (eller anden PostgreSQL hosting)
- **GitHub account** (for deployment)

---

## 📦 Installation

### Step 1: Clone Repository

```bash
git clone https://github.com/TekupDK/tekup.git
cd tekup/apps/production/tekup-database
```

### Step 2: Install Dependencies

```bash
# Med pnpm (anbefalet)
pnpm install

# Eller med npm
npm install
```

### Step 3: Setup Environment

```bash
# Copy example environment
cp .env.example .env

# Edit .env fil
# På Windows:
notepad .env

# På Mac/Linux:
nano .env
```

---

## 🐳 Local Development (Docker)

### Start PostgreSQL

```bash
# Start database
docker-compose up -d

# Verify it's running
docker ps

# Check logs
docker logs tekup-database-postgres
```

### Run Migrations

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Verify tables were created
pnpm db:studio
# Opens http://localhost:5555
```

### Seed Data (Optional)

```bash
pnpm db:seed
```

---

## 🚀 Production Deployment (Render.com)

### Step 1: Create Database on Render

1. Go to https://render.com/dashboard
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name:** tekup-database
   - **Region:** Frankfurt (EU)
   - **PostgreSQL Version:** 16
   - **Plan:** Starter ($7/mdr) or Free
4. Click "Create Database"
5. **Copy the connection string** (External Database URL)

### Step 2: Configure Environment

```bash
# Add to your .env
DATABASE_URL="postgresql://[your-connection-string-from-render]"
```

### Step 3: Run Migrations

```bash
# Deploy migrations to production
pnpm db:migrate:prod
```

### Step 4: Verify

```bash
# Check database health
pnpm db:health

# Or open Prisma Studio (read-only)
pnpm db:studio
```

---

## 🔧 Common Tasks

### Add New Schema

1. Edit `prisma/schema.prisma`:
```prisma
model MyNewModel {
  id String @id @default(uuid())
  // ... fields
  
  @@schema("myschema")
}
```

2. Create migration:
```bash
pnpm db:migrate dev --name="add_myschema"
```

### Backup Database

```bash
# Local
docker exec tekup-database-postgres pg_dump -U tekup tekup_db > backup.sql

# Production (Render)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
# Local
docker exec -i tekup-database-postgres psql -U tekup tekup_db < backup.sql

# Production
psql $DATABASE_URL < backup.sql
```

---

## ❓ Troubleshooting

### Docker won't start

```bash
# Stop all containers
docker-compose down

# Remove volumes
docker volume rm tekup-postgres-data

# Start fresh
docker-compose up -d
```

### Prisma client out of sync

```bash
# Regenerate client
pnpm db:generate

# Or reset and re-migrate
pnpm db:reset
```

### Connection refused

Check if PostgreSQL is running:
```bash
# Docker
docker ps | grep postgres

# Local
pg_isready -h localhost -p 5432
```

---

## 📚 Next Steps

- [Migration Guide](./MIGRATION_GUIDE.md) - Migrer data fra andre DBs
- [Schema Design](./SCHEMA_DESIGN.md) - Database design decisions
- [API Reference](./API_REFERENCE.md) - How to use Prisma client

---

**Need help?** Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
