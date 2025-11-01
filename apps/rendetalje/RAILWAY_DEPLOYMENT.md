# Railway Deployment Guide - Rendetalje Friday AI

## 🚀 Overview

This guide deploys all Rendetalje services to Railway for cloud testing and production use.

## 📋 Services to Deploy

1. **Inbox Orchestrator** (Friday AI) - Port 3011
2. **Backend NestJS** - Port 3000
3. **Frontend Next.js** - Port 3002
4. **Google MCP** - Port 3010 (optional, if needed separately)

## 🔧 Prerequisites

1. **Railway Account**
   - Sign up at https://railway.app
   - Install Railway CLI: `npm i -g @railway/cli`

2. **Railway Login**
   ```bash
   railway login
   ```

3. **Git Repository**
   - Ensure all code is committed and pushed

## 📦 Deployment Steps

### Step 1: Create Railway Project

```bash
# Navigate to project root
cd C:\Users\empir\Tekup\apps\rendetalje

# Initialize Railway project (or link existing)
railway init
# OR
railway link  # If project already exists
```

### Step 2: Deploy Inbox Orchestrator (Friday AI)

```bash
# Navigate to inbox-orchestrator
cd services/tekup-ai/packages/inbox-orchestrator

# Link to Railway project (create service)
railway link

# Set environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3011
railway variables set GOOGLE_MCP_URL=<GOOGLE_MCP_RAILWAY_URL>
railway variables set GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>
railway variables set DEBUG=false

# Deploy
railway up

# Note the Railway URL (will be shown after deployment)
# Example: https://inbox-orchestrator-production.up.railway.app
```

**Environment Variables:**
- `NODE_ENV=production`
- `PORT=3011` (Railway auto-assigns, but we set it)
- `GOOGLE_MCP_URL` - URL to Google MCP service on Railway
- `GEMINI_API_KEY` - Your Google Gemini API key
- `DEBUG=false` - Set to false for production

### Step 3: Deploy Backend NestJS

```bash
# Navigate to backend
cd services/backend-nestjs

# Create new Railway service
railway init
# OR link to existing project
railway link --project <project-id>

# Set environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set AI_FRIDAY_URL=<INBOX_ORCHESTRATOR_RAILWAY_URL>
railway variables set ENABLE_AI_FRIDAY=true
railway variables set FRONTEND_URL=<FRONTEND_RAILWAY_URL>
railway variables set DATABASE_URL=<DATABASE_URL>
railway variables set SUPABASE_URL=<SUPABASE_URL>
railway variables set SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>
railway variables set JWT_SECRET=<GENERATE_SECRET>
railway variables set ENCRYPTION_KEY=<GENERATE_SECRET>

# Deploy
railway up
```

**Environment Variables:**
- `AI_FRIDAY_URL` - URL from Step 2 (e.g., `https://inbox-orchestrator-production.up.railway.app`)
- `ENABLE_AI_FRIDAY=true`
- `FRONTEND_URL` - Will be set after frontend deployment
- All database/auth variables from your existing setup

### Step 4: Deploy Frontend Next.js

```bash
# Navigate to frontend
cd services/frontend-nextjs

# Link to Railway project
railway link --project <project-id>

# Set environment variables
railway variables set NODE_ENV=production
railway variables set NEXT_PUBLIC_API_URL=<BACKEND_RAILWAY_URL>
railway variables set PORT=3002

# Deploy
railway up
```

**Environment Variables:**
- `NEXT_PUBLIC_API_URL` - URL from Step 3 (e.g., `https://backend-production.up.railway.app`)
- `PORT=3002` (optional, Railway auto-assigns)

### Step 5: Update Service URLs

After all services are deployed, update the URLs:

```bash
# Update backend with frontend URL
cd services/backend-nestjs
railway variables set FRONTEND_URL=<FRONTEND_RAILWAY_URL>

# Update inbox-orchestrator with Google MCP URL (if deployed separately)
cd services/tekup-ai/packages/inbox-orchestrator
railway variables set GOOGLE_MCP_URL=<GOOGLE_MCP_RAILWAY_URL>
```

## 🔄 Quick Deployment Script

Create `deploy-to-railway.ps1`:

```powershell
# Railway Deployment Script
Write-Host "=== Railway Deployment ===" -ForegroundColor Cyan

# 1. Inbox Orchestrator
Write-Host "Deploying Inbox Orchestrator..." -ForegroundColor Yellow
cd services/tekup-ai/packages/inbox-orchestrator
railway up
$ORCH_URL = railway domain
Write-Host "Orchestrator URL: $ORCH_URL" -ForegroundColor Green

# 2. Backend
Write-Host "Deploying Backend..." -ForegroundColor Yellow
cd ../../../../apps/rendetalje/services/backend-nestjs
railway variables set AI_FRIDAY_URL=$ORCH_URL
railway up
$BACKEND_URL = railway domain
Write-Host "Backend URL: $BACKEND_URL" -ForegroundColor Green

# 3. Frontend
Write-Host "Deploying Frontend..." -ForegroundColor Yellow
cd ../frontend-nextjs
railway variables set NEXT_PUBLIC_API_URL=$BACKEND_URL
railway up
$FRONTEND_URL = railway domain
Write-Host "Frontend URL: $FRONTEND_URL" -ForegroundColor Green

Write-Host "=== Deployment Complete ===" -ForegroundColor Cyan
Write-Host "Frontend: $FRONTEND_URL" -ForegroundColor Green
Write-Host "Backend: $BACKEND_URL" -ForegroundColor Green
Write-Host "Orchestrator: $ORCH_URL" -ForegroundColor Green
```

## 🌐 Railway URLs Structure

After deployment, you'll get URLs like:
- **Frontend:** `https://rendetalje-frontend-production.up.railway.app`
- **Backend:** `https://rendetalje-backend-production.up.railway.app`
- **Inbox Orchestrator:** `https://inbox-orchestrator-production.up.railway.app`

## ✅ Verification

### 1. Test Inbox Orchestrator

```bash
curl https://inbox-orchestrator-production.up.railway.app/health
# Expected: {"ok":true}

curl -X POST https://inbox-orchestrator-production.up.railway.app/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Test message"}'
```

### 2. Test Backend

```bash
curl https://rendetalje-backend-production.up.railway.app/health
# Expected: Service health status

# Test Friday AI endpoint (requires auth token)
curl -X POST https://rendetalje-backend-production.up.railway.app/api/v1/ai-friday/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"message": "Test", "context": {"userRole": "owner", "organizationId": "test"}}'
```

### 3. Test Frontend

- Open: `https://rendetalje-frontend-production.up.railway.app`
- Login
- Click chat button
- Send test message

## 🔐 Environment Variables Checklist

### Inbox Orchestrator
- [ ] `NODE_ENV=production`
- [ ] `PORT=3011`
- [ ] `GOOGLE_MCP_URL` (Railway URL or localhost if same service)
- [ ] `GEMINI_API_KEY`
- [ ] `DEBUG=false`

### Backend NestJS
- [ ] `NODE_ENV=production`
- [ ] `PORT=3001` (or Railway auto-assigned)
- [ ] `AI_FRIDAY_URL` (Inbox Orchestrator Railway URL)
- [ ] `ENABLE_AI_FRIDAY=true`
- [ ] `FRONTEND_URL` (Frontend Railway URL)
- [ ] `DATABASE_URL`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `JWT_SECRET`
- [ ] `ENCRYPTION_KEY`
- [ ] All other existing backend variables

### Frontend Next.js
- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_API_URL` (Backend Railway URL)
- [ ] `PORT=3002` (optional)

## 🔍 Troubleshooting

### Service won't start
1. Check Railway logs: `railway logs`
2. Verify environment variables are set
3. Check health check endpoint responds

### CORS errors
- Update `FRONTEND_URL` in backend
- Verify CORS settings in backend allow Railway domain

### API connection errors
- Verify service URLs are correct
- Check environment variables are set
- Ensure services are deployed in correct order

### Build failures
- Check Dockerfile is correct
- Verify package.json scripts
- Check Railway build logs

## 📊 Monitoring

### Railway Dashboard
- View service status
- Check logs in real-time
- Monitor resource usage
- View deployment history

### Health Checks
All services have health check endpoints:
- Inbox Orchestrator: `/health`
- Backend: `/health`
- Frontend: `/` (root)

## 🔄 Updating Services

```bash
# Update a service
cd <service-directory>
railway up

# View logs
railway logs

# Check status
railway status
```

## 🌍 Custom Domains (Optional)

```bash
# Add custom domain
railway domain <service-name> <your-domain.com>

# Example
railway domain rendetalje-frontend rendetalje.dk
```

## 📚 Railway CLI Commands

```bash
# Login
railway login

# Create/link project
railway init
railway link

# Deploy
railway up

# Set variables
railway variables set KEY=value

# View variables
railway variables

# View logs
railway logs

# Open dashboard
railway open

# Get service URL
railway domain
```

## 🎯 Testing After Deployment

1. **Health Checks:**
   ```bash
   curl https://<service-url>/health
   ```

2. **Frontend Chat:**
   - Open frontend URL
   - Login
   - Test chat widget

3. **API Integration:**
   - Test Friday AI endpoints
   - Verify context passing
   - Test all workflows

See `TESTING_GUIDE.md` for detailed test scenarios.

---

**Last Updated:** 31. oktober 2025  
**Status:** Ready for Railway Deployment

