# ✅ Friday AI Railway Deployment - Complete Setup

**Status:** ✅ All files prepared for Railway deployment  
**Date:** 31. oktober 2025

## 📦 What's Ready

### 1. Railway Configuration Files ✅

All services have `railway.json` configuration:

- ✅ `services/backend-nestjs/railway.json`
- ✅ `services/frontend-nextjs/railway.json`
- ✅ `services/tekup-ai/packages/inbox-orchestrator/railway.json`

### 2. Dockerfiles ✅

- ✅ `services/frontend-nextjs/Dockerfile` (production-ready)
- ✅ `services/backend-nestjs/Dockerfile` (already existed)
- ✅ `services/tekup-ai/packages/inbox-orchestrator/Dockerfile` (already existed)

### 3. Deployment Scripts ✅

- ✅ `deploy-to-railway.ps1` - Automated deployment script
- ✅ Manual deployment instructions in `RAILWAY_QUICK_START.md`

### 4. Documentation ✅

- ✅ `RAILWAY_DEPLOYMENT.md` - Complete deployment guide
- ✅ `RAILWAY_QUICK_START.md` - 5-minute quick start
- ✅ `RAILWAY_ENV_TEMPLATE.md` - Environment variables reference

## 🚀 Deploy Now

### Option 1: Automated (Recommended)

```powershell
# Make sure you're logged in to Railway
railway login

# Run deployment script
.\deploy-to-railway.ps1
```

### Option 2: Manual Step-by-Step

See `RAILWAY_QUICK_START.md` for detailed manual steps.

## 📋 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] Railway CLI installed: `npm i -g @railway/cli`
- [ ] Logged in: `railway login`
- [ ] All code committed and pushed to git
- [ ] Environment variables prepared (see `RAILWAY_ENV_TEMPLATE.md`)
- [ ] Database/Supabase URLs ready
- [ ] API keys ready (Gemini, etc.)

## 🔑 Critical Environment Variables

### Inbox Orchestrator

- `GEMINI_API_KEY` - Your Google Gemini API key
- `GOOGLE_MCP_URL` - Google MCP service URL

### Backend

- `AI_FRIDAY_URL` - Inbox Orchestrator Railway URL (set after orchestrator deploys)
- `DATABASE_URL` - Your database connection string
- `JWT_SECRET` - Generate strong secret
- `ENCRYPTION_KEY` - Generate strong secret

### Frontend

- `NEXT_PUBLIC_API_URL` - Backend Railway URL (set after backend deploys)

## 🔄 Deployment Order

1. **Inbox Orchestrator** (Friday AI) - Gets its own URL
2. **Backend NestJS** - Needs orchestrator URL, gets its own URL
3. **Frontend Next.js** - Needs backend URL

After each deployment, copy the Railway URL and use it in the next service!

## ✅ Post-Deployment Verification

```bash
# 1. Health checks
curl https://<orchestrator-url>/health
curl https://<backend-url>/health

# 2. Test chat
curl -X POST https://<orchestrator-url>/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Test message"}'

# 3. Open frontend
# Visit: https://<frontend-url>
# Login → Test chat widget
```

## 📊 Expected URLs

After deployment, you'll have:

- **Frontend:** `https://rendetalje-frontend-production.up.railway.app`
- **Backend:** `https://rendetalje-backend-production.up.railway.app`
- **Inbox Orchestrator:** `https://inbox-orchestrator-production.up.railway.app`

(Exact URLs will be provided by Railway after deployment)

## 🎯 Next Steps After Deployment

1. **Set Additional Variables**
   - All database connections
   - External service keys
   - Email configuration

2. **Test All Workflows**
   - Lead processing
   - Booking queries
   - Customer support
   - Conflict resolution

3. **Monitor Performance**
   - Check Railway dashboard
   - Monitor logs
   - Track response times

4. **Set Up Custom Domains** (Optional)
   ```bash
   railway domain <service> yourdomain.com
   ```

## 🔍 Troubleshooting

See `RAILWAY_DEPLOYMENT.md` for comprehensive troubleshooting guide.

Common issues:

- **Service won't start:** Check logs with `railway logs`
- **Environment variables:** Verify with `railway variables`
- **Connection errors:** Check service URLs and CORS settings

## 📚 Documentation Reference

- **Quick Start:** `RAILWAY_QUICK_START.md`
- **Full Guide:** `RAILWAY_DEPLOYMENT.md`
- **Environment Variables:** `RAILWAY_ENV_TEMPLATE.md`
- **Testing:** `TESTING_GUIDE.md`

---

**Ready to Deploy?** Run `.\deploy-to-railway.ps1` or follow `RAILWAY_QUICK_START.md`!

**Status:** ✅ All files ready, deployment can begin immediately
