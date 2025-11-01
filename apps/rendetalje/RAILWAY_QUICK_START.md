# Railway Quick Start Guide

## 🚀 Deploy in 5 Minutes

### Prerequisites

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login
```

### Step-by-Step Deployment

#### 1. Deploy Inbox Orchestrator (Friday AI)

```bash
cd services/tekup-ai/packages/inbox-orchestrator

# Create/link Railway service
railway init
# OR if already exists:
railway link

# Set critical variables
railway variables set NODE_ENV=production
railway variables set PORT=3011
railway variables set GEMINI_API_KEY=<YOUR_GEMINI_KEY>
railway variables set GOOGLE_MCP_URL=<GOOGLE_MCP_URL_OR_LOCALHOST>

# Deploy
railway up

# Copy the Railway URL (will be shown after deploy)
# Example: https://inbox-orchestrator-production.up.railway.app
```

**Save this URL** - you'll need it for Backend configuration!

#### 2. Deploy Backend NestJS

```bash
cd ../../../../apps/rendetalje/services/backend-nestjs

# Create/link Railway service (same project)
railway link

# Set critical variables
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set AI_FRIDAY_URL=<ORCHESTRATOR_URL_FROM_STEP_1>
railway variables set ENABLE_AI_FRIDAY=true

# Add database/auth variables (from your existing setup)
railway variables set DATABASE_URL=<YOUR_DATABASE_URL>
railway variables set SUPABASE_URL=<YOUR_SUPABASE_URL>
railway variables set SUPABASE_ANON_KEY=<YOUR_KEY>
railway variables set JWT_SECRET=<GENERATE_STRONG_SECRET>
railway variables set ENCRYPTION_KEY=<GENERATE_STRONG_SECRET>

# Deploy
railway up

# Copy the Railway URL
# Example: https://backend-production.up.railway.app
```

**Save this URL** - you'll need it for Frontend configuration!

#### 3. Deploy Frontend Next.js

```bash
cd ../frontend-nextjs

# Link to same Railway project
railway link

# Set critical variables
railway variables set NODE_ENV=production
railway variables set NEXT_PUBLIC_API_URL=<BACKEND_URL_FROM_STEP_2>

# Deploy
railway up

# Copy the Railway URL
# Example: https://frontend-production.up.railway.app
```

#### 4. Update URLs

```bash
# Update backend with frontend URL
cd ../backend-nestjs
railway variables set FRONTEND_URL=<FRONTEND_URL_FROM_STEP_3>

# Optionally restart backend to pick up new variable
railway restart
```

### ✅ Verify Deployment

```bash
# Test Inbox Orchestrator
curl https://<orchestrator-url>/health
# Expected: {"ok":true}

# Test Backend
curl https://<backend-url>/health
# Expected: Service health status

# Open Frontend
# Visit: https://<frontend-url>
# Login and test chat widget!
```

## 🎯 Automated Deployment

Use the provided script:

```powershell
.\deploy-to-railway.ps1
```

Or for dry-run (see what would happen):

```powershell
.\deploy-to-railway.ps1 -DryRun
```

## 🔍 Troubleshooting

### Service won't start

```bash
# Check logs
railway logs

# Check specific service
cd <service-directory>
railway logs
```

### Environment variables not set

```bash
# View all variables
railway variables

# Set missing variable
railway variables set KEY=value
```

### Build failures

- Check Railway build logs in dashboard
- Verify Dockerfile exists and is correct
- Ensure package.json scripts are correct

### Connection errors

- Verify service URLs are correct
- Check CORS settings in backend
- Ensure services are deployed in correct order

## 📊 Monitoring

### View Logs

```bash
# All services
railway logs

# Specific service
cd <service-directory>
railway logs --tail
```

### Open Dashboard

```bash
railway open
```

### Check Service Status

```bash
railway status
```

## 🔗 Important Commands

```bash
# Deploy
railway up

# View logs
railway logs

# Set variable
railway variables set KEY=value

# Get service URL
railway domain

# Open dashboard
railway open

# Restart service
railway restart
```

## 📝 Environment Variables Checklist

### Inbox Orchestrator ✅
- [ ] `NODE_ENV=production`
- [ ] `PORT=3011`
- [ ] `GEMINI_API_KEY`
- [ ] `GOOGLE_MCP_URL`

### Backend ✅
- [ ] `NODE_ENV=production`
- [ ] `PORT=3001`
- [ ] `AI_FRIDAY_URL` (from orchestrator)
- [ ] `ENABLE_AI_FRIDAY=true`
- [ ] `FRONTEND_URL` (from frontend)
- [ ] `DATABASE_URL`
- [ ] `SUPABASE_URL`
- [ ] `JWT_SECRET`
- [ ] All other existing variables

### Frontend ✅
- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_API_URL` (from backend)

## 🎉 After Deployment

1. **Test Health Endpoints**
   - Inbox Orchestrator: `/health`
   - Backend: `/health`

2. **Test Frontend**
   - Open frontend URL
   - Login
   - Click chat button
   - Send test message

3. **Test Friday AI**
   - Try different intents
   - Verify responses
   - Check metrics

4. **Set Additional Variables**
   - Database connections
   - External service keys
   - Email configuration
   - Monitoring settings

---

**Ready to deploy?** Run `.\deploy-to-railway.ps1` or follow the manual steps above!

