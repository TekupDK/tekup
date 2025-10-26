# 🚀 Quick Start: Sentry + Monitoring Setup

**Status**: ✅ Backend Sentry Installed & Configured  
**Last Updated**: 2025-10-23  

---

## ✅ COMPLETED

### 1. Backend Sentry Setup
- ✅ Installed `@sentry/node` og `@sentry/profiling-node`
- ✅ Created `SentryInterceptor` for automatic error catching
- ✅ Updated `main.ts` med Sentry initialization
- ✅ Added `/test-sentry` endpoint (development only)
- ✅ Enhanced `/health` endpoint med service status

### 2. Database Schema
- ✅ Created `004_application_logs.sql` migration
- ✅ Table, indexes, RLS policies, views, functions ready

---

## 📋 NEXT STEPS (I denne rækkefølge)

### Step 1: Get Sentry DSN (5 min)

1. **Opret Sentry konto:**
   - Go to: https://sentry.io/signup/
   - Sign up med email: jonas@tekup.dk (eller din)
   - Verify email

2. **Create project:**
   - Name: `rendetalje-backend`
   - Platform: `Node.js`
   - Framework: `Express`
   
3. **Copy DSN:**
   ```
   Format: https://XXXXX@oXXXXXX.ingest.sentry.io/XXXXXXX
   ```
   
4. **Gentag for frontend:**
   - Name: `rendetalje-frontend`
   - Platform: `Next.js`
   - Copy DSN

---

### Step 2: Deploy Database Migration (10 min)

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to: https://supabase.com/dashboard
2. Select project: `oaevagdgrasfppbrxbey`
3. Click "SQL Editor"
4. Copy entire content of `apps/rendetalje/services/database/migrations/004_application_logs.sql`
5. Paste og click "Run"
6. Should see: ✅ Success message

**Option B: Via CLI**

```powershell
cd C:\Users\Jonas-dev\Tekup-Monorepo\apps\rendetalje\services\database

# If not logged in:
supabase login

# Link project:
supabase link --project-ref oaevagdgrasfppbrxbey

# Run migration:
supabase db push

# Or run SQL file directly:
psql "postgresql://postgres.oaevagdgrasfppbrxbey:YOUR_PASSWORD@aws-1-eu-central-1.pooler.supabase.com:5432/postgres" -f migrations/004_application_logs.sql
```

**Verify:**
```sql
-- In Supabase SQL Editor:
SELECT * FROM application_logs LIMIT 1;
-- Should return empty result (no errors)

SELECT * FROM recent_errors;
-- Should work
```

---

### Step 3: Configure Render Environment Variables (10 min)

**Go to:** https://dashboard.render.com/

**For `rendetalje-backend` service:**

1. Click service → "Environment"
2. Add new variable:
   ```
   SENTRY_DSN=https://YOUR_DSN_FROM_STEP_1@oXXXXXX.ingest.sentry.io/XXXXXXX
   ```
3. Add:
   ```
   SENTRY_ENVIRONMENT=production
   ```
4. Click "Save Changes"
5. **Redeploy service** (automatic efter save)

---

### Step 4: Test Backend Locally (15 min)

```powershell
cd C:\Users\Jonas-dev\Tekup-Monorepo\apps\rendetalje\services\backend-nestjs

# Add to .env.local (create if missing):
echo "SENTRY_DSN=https://YOUR_DSN@oXXXXXX.ingest.sentry.io/XXXXXXX" >> .env.local
echo "SENTRY_ENVIRONMENT=development" >> .env.local

# Start server:
npm run start:dev

# Wait for: "✅ Sentry initialized"
```

**Test endpoints:**

```powershell
# 1. Health check
curl http://localhost:3001/health

# Should show:
# {
#   "status": "ok",
#   "services": {
#     "sentry": "configured"  ← ✅ This confirms Sentry works
#   }
# }

# 2. Test Sentry error capture
curl http://localhost:3001/test-sentry

# Should show:
# { "message": "Sentry test error sent!" }

# 3. Check Sentry dashboard
# Go to: https://sentry.io/organizations/YOUR_ORG/issues/
# Should see: "Test Sentry error - please ignore"
```

---

### Step 5: Setup UptimeRobot (10 min)

1. **Create account:**
   - Go to: https://uptimerobot.com/signUp
   - Sign up (gratis for 50 monitors)

2. **Add monitors:**

   **Monitor 1: Backend Health**
   - Name: `RendetaljeOS Backend`
   - URL: `https://rendetalje-backend.onrender.com/health`
   - Type: HTTP(s)
   - Interval: 5 minutes
   - Alert Contacts: Add your email

   **Monitor 2: Frontend Owner**
   - Name: `RendetaljeOS Frontend (Owner)`
   - URL: `https://rendetalje-frontend-owner.onrender.com`
   - Type: HTTP(s)
   - Interval: 5 minutes

3. **Configure alerts:**
   - Notification: Email
   - Alert when: Down
   - Send notifications: Immediately

---

### Step 6: Install Frontend Sentry (20 min)

```powershell
cd C:\Users\Jonas-dev\Tekup-Monorepo\apps\rendetalje\services\frontend-nextjs

# Install Sentry
npm install @sentry/nextjs

# Run Sentry wizard (automatic setup)
npx @sentry/wizard@latest -i nextjs

# Follow prompts:
# - Select project: rendetalje-frontend
# - Upload source maps: No (for now)
```

**Add to Render environment:**
```
NEXT_PUBLIC_SENTRY_DSN=https://YOUR_FRONTEND_DSN@oXXXXXX.ingest.sentry.io/XXXXXXX
```

**Test locally:**
```powershell
npm run dev

# Open browser console
# Should see: "Sentry initialized"
```

---

## 🎯 SUCCESS CRITERIA

After completing all steps:

✅ **Sentry captures errors** → Check dashboard  
✅ **UptimeRobot monitors** → Check monitors dashboard  
✅ **Health endpoint shows status** → `/health` returns sentry: "configured"  
✅ **Logs table ready** → Can query `application_logs`  

---

## 📊 VERIFICATION COMMANDS

**Backend health:**
```powershell
curl https://rendetalje-backend.onrender.com/health | jq .services.sentry
# Should return: "configured"
```

**Database logs table:**
```sql
-- In Supabase SQL Editor:
SELECT COUNT(*) FROM application_logs;
-- Should return 0 (or more if logs already created)

SELECT * FROM recent_errors;
-- Should return empty (or errors if any occurred)
```

**Sentry dashboard:**
- Go to: https://sentry.io/organizations/YOUR_ORG/issues/
- Should see test error from Step 4

**UptimeRobot:**
- Go to: https://uptimerobot.com/dashboard
- All monitors should be green (Up)

---

## 🚨 TROUBLESHOOTING

### Backend won't start
```powershell
# Check for TypeScript errors:
npm run build

# Check for missing dependencies:
npm install

# Check environment variables:
cat .env.local
```

### Sentry not capturing errors
```powershell
# 1. Check DSN is set:
curl http://localhost:3001/health | jq .services.sentry

# 2. Check Sentry dashboard project settings
# 3. Try test endpoint again:
curl http://localhost:3001/test-sentry
```

### Database migration failed
```sql
-- Check if table exists:
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'application_logs';

-- If exists, drop and recreate:
DROP TABLE IF EXISTS application_logs CASCADE;
-- Then run migration again
```

---

## 📈 NEXT PHASE (Efter alt virker)

### Week 2: Winston Logging
- Install Winston
- Create Supabase transport
- Integrate med existing services
- Test log aggregation

### Week 3: Admin Dashboard
- Build logs viewer component
- Display recent errors from Sentry API
- Show uptime stats from UptimeRobot API
- System health overview

---

## 💰 COSTS

```yaml
Sentry Free Tier:
  - 5,000 errors/month
  - Performance monitoring included
  - Cost: $0

UptimeRobot Free Tier:
  - 50 monitors
  - 5-minute intervals
  - Cost: $0

Supabase Logs:
  - ~10-50MB/month
  - Cost: $0 (free tier: 500MB database)

TOTAL: $0/month ✅
```

---

## 🔗 USEFUL LINKS

- **Sentry Dashboard**: https://sentry.io/
- **UptimeRobot**: https://uptimerobot.com/dashboard
- **Render Services**: https://dashboard.render.com/
- **Supabase Project**: https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey

---

**Questions?** Check `MONITORING_IMPLEMENTATION_COMPLETE.md` for detailed docs.

**Status**: 🟢 Ready to deploy!
