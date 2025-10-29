# 🚀 Deployment Guide: Migrate to Prisma + Supabase Multi-Schema

**Status:** Ready to deploy  
**Target:** Supabase (oaevagdgrasfppbrxbey.supabase.co)  
**Date:** October 29, 2025

---

## 📊 What This Does

Migrates RenOS from old single-schema Supabase to new multi-schema TekupDB architecture:

**From (Old):**

- `public` schema only
- `organizations`, `users`, `jobs`, `customers`

**To (New):**

- Multi-schema: `vault`, `billy`, `renos`, `crm`, `flow`, `shared`
- `RenosCustomer`, `RenosLead`, `RenosBooking`, etc.
- Shared with all Tekup apps

---

## ✅ Prerequisites Completed

- [x] `.env` updated with Supabase DATABASE_URL
- [x] Prisma schema configured for multi-schema
- [x] Deployment scripts created
- [x] Data migration script created
- [x] PrismaService configured

---

## 🎯 Deployment Steps

### Step 1: Deploy Schema to Supabase (Choose One Method)

#### Method A: Quick Deploy (Recommended)

```powershell
cd c:\Users\empir\Tekup\apps\rendetalje\services\backend-nestjs
node quick-deploy-supabase.js
```

This will:

- Push Prisma schema directly to Supabase
- Create all 6 schemas (vault, billy, renos, crm, flow, shared)
- Create all tables with proper relations

#### Method B: Manual Deploy (More Control)

```powershell
# Generate Prisma Client
npx prisma generate

# Push schema (without shadow database)
npx prisma db push --skip-generate
```

---

### Step 2: Verify Schema Deployment

```powershell
node verify-supabase-db.js
```

**Expected Output:**

```
✅ Customers table exists! Found 2 customers
✅ Leads table exists! Found 0 leads
✅ Bookings table exists! Found 0 bookings
✅ Users table exists! Found 0 users
✅ Team members table exists! Found 0 team members
✅ Time entries table exists! Found 0 entries

✅ Working tables: 6/6
```

---

### Step 3: Migrate Existing Data

```powershell
node migrate-data-to-renos.js
```

This will:

- Fetch 2 customers from old `public.customers`
- Migrate them to `renos.customers`
- Migrate any leads to `renos.leads`
- Preserve all data (IDs, timestamps, etc.)

---

### Step 4: Generate Prisma Client

```powershell
npx prisma generate
```

---

### Step 5: Start Backend

```powershell
npm run start:dev
```

**Expected Output:**

```
[Nest] Starting Nest application...
[DatabaseModule] dependencies initialized
[PrismaService] Connected to Supabase (renos schema) ✅
[NestApplication] Nest application successfully started
🚀 RendetaljeOS API running on port 3000
```

---

### Step 6: Test API Endpoints

```powershell
# Test health
curl http://localhost:3000/api/v1/health

# Test customers
curl http://localhost:3000/api/v1/customers

# Test leads
curl http://localhost:3000/api/v1/leads
```

---

## 🔧 Troubleshooting

### Error: "Could not find table"

**Solution:** Schema not deployed yet. Run Step 1 again.

### Error: "P2002: Unique constraint failed"

**Solution:** Data already migrated. Safe to ignore or clear renos schema first.

### Error: "Connection refused"

**Solution:** Check DATABASE_URL in `.env`:

```
DATABASE_URL=postgresql://postgres.oaevagdgrasfppbrxbey:Tekupdk1234@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

### Error: "Shadow database required"

**Solution:** Use `prisma db push` instead of `prisma migrate`:

```powershell
npx prisma db push --skip-generate
```

---

## 📋 Verification Checklist

After deployment, verify:

- [ ] Supabase dashboard shows 6 schemas
- [ ] `renos` schema has all tables
- [ ] 2 customers visible in `renos.customers`
- [ ] Backend starts without errors
- [ ] Health endpoint returns 200
- [ ] Customer API returns 2 customers
- [ ] Prisma Studio shows data: `npx prisma studio`

---

## 🎉 Success Criteria

✅ **Backend running on port 3000**  
✅ **Connected to Supabase with Prisma**  
✅ **All 6 schemas created**  
✅ **Data migrated (2 customers)**  
✅ **API endpoints responding**  
✅ **No compilation errors**

---

## 🔄 Rollback (If Needed)

If something goes wrong:

1. **Drop renos schema:**

```sql
DROP SCHEMA IF EXISTS renos CASCADE;
DROP SCHEMA IF EXISTS vault CASCADE;
DROP SCHEMA IF EXISTS billy CASCADE;
DROP SCHEMA IF EXISTS crm CASCADE;
DROP SCHEMA IF EXISTS flow CASCADE;
DROP SCHEMA IF EXISTS shared CASCADE;
```

2. **Restore old DATABASE_URL:**

```
DATABASE_URL=postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=renos
```

3. **Restart backend**

---

## 📞 Support

If issues persist:

1. Check logs: `npm run start:dev`
2. Check Prisma logs: Set `log: ["query", "error", "info", "warn"]` in PrismaService
3. Check Supabase dashboard for schema status

---

**Ready to deploy!** Start with Step 1. 🚀
