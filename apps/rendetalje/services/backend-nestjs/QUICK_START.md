# 🚀 Rendetalje Quick Start - Deployment Commands

> **Status:** ✅ Backend deployed to Supabase, operationel på port 3000

---

## ⚡ Quick Commands

### Start Backend
```bash
cd C:\Users\empir\Tekup\apps\rendetalje\services\backend-nestjs
npm run start:dev
```
**Wait for:** `🚀 RendetaljeOS API running on port 3000`

---

### Run Smoke Tests
```bash
# Efter backend er startet (vent 8 sekunder)
cd C:\Users\empir\Tekup\apps\rendetalje\services\backend-nestjs
node smoke-test.js
```
**Expected output:** 
```
🧪 Running Rendetalje Backend Smoke Tests
✓ GET /health returns 200
✓ GET /api/v1/health returns service status
✓ GET /api/v1/customers returns customers list
...
🎉 All smoke tests passed!
✅ Backend is ready for production deployment.
```

---

### Migrate All Data
```bash
cd C:\Users\empir\Tekup\apps\rendetalje\services\backend-nestjs
node migrate-all-data.js
```
**Migrerer:**
- Customers (already done: 2/2)
- Leads
- Bookings  
- Team Members
- Time Entries

**Safe mode:** Public data bevares indtil verificering

---

### Verify Database
```bash
# Prisma-based (works for renos schema)
node verify-prisma-renos.js

# REST-based (public schema only)
node verify-supabase-db.js
```

---

### Deploy Schema Changes
```bash
# Safe non-destructive push
node safe-push-supabase.js

# Inspect generated safe.sql before applying
# Script will auto-apply filtered SQL
```

---

## 🌐 API Endpoints

### Health Checks
- **Basic:** http://localhost:3000/health
- **Detailed:** http://localhost:3000/api/v1/health
- **Database:** http://localhost:3000/api/v1/health/db

### Core Modules
- **Customers:** http://localhost:3000/api/v1/customers
- **Leads:** http://localhost:3000/api/v1/leads
- **Team:** http://localhost:3000/api/v1/team/members
- **Subcontractors:** http://localhost:3000/api/v1/subcontractors

### Documentation
- **Swagger UI:** http://localhost:3000/docs

---

## 🔧 Troubleshooting

### Backend Won't Start
```bash
# Check Prisma schema
npx prisma validate

# Regenerate Prisma client
npx prisma generate

# Check port availability
netstat -ano | findstr :3000
```

### Database Connection Fails
```bash
# Test connection
npx prisma db execute --stdin < verify-query.sql

# Check environment
echo $env:DATABASE_URL  # PowerShell
```

### Smoke Tests Fail
```bash
# Ensure backend is running
curl http://localhost:3000/health

# Check logs
# Backend terminal will show request logs
```

---

## 📊 Status Check

### Quick Health Check
```powershell
curl http://localhost:3000/api/v1/health | ConvertFrom-Json | Format-List
```

**Expected:**
```
status      : ok
environment : development
services    : @{database=configured; supabase=configured; sentry=configured}
```

### Customer Count
```powershell
curl http://localhost:3000/api/v1/customers | ConvertFrom-Json | Measure-Object | Select-Object Count
```

**Expected:** `Count: 2` (after initial migration)

---

## 🎯 Next Steps

### 1. Run Full Smoke Tests
```bash
node smoke-test.js
```

### 2. Migrate Remaining Data
```bash
node migrate-all-data.js
```

### 3. Test RLS Policies
```bash
# Use Supabase Dashboard SQL Editor
SELECT * FROM renos.customers;  # Should respect RLS
```

### 4. Validate Sentry
```bash
# Access test endpoint
curl http://localhost:3000/test-sentry
# Check Sentry dashboard for error event
```

### 5. Frontend Integration
```bash
cd ../frontend-nextjs
npm run dev
# Update API_URL to point to backend
```

---

## 📚 Documentation

- **Deployment Guide:** `DEPLOYMENT_GUIDE.md`
- **Success Report:** `DEPLOYMENT_SUCCESS.md`
- **Prisma Schema:** `prisma/schema.prisma`
- **Scripts:** `*.js` files in backend root

---

## ✅ Checklist

- [x] Backend operationel
- [x] Health endpoints OK
- [x] Prisma connected til renos schema
- [x] Supabase Auth initialized
- [x] 2 customers migrated
- [ ] Smoke tests passed (afvent completion)
- [ ] All data migrated
- [ ] RLS policies tested
- [ ] Sentry validated
- [ ] Frontend connected

---

**🎉 Happy deploying!**
