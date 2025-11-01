# Railway Deployment Script for Rendetalje Friday AI
# Deploys all services to Railway cloud platform

param(
    [switch]$DryRun = $false
)

Write-Host "=== Railway Deployment for Rendetalje Friday AI ===" -ForegroundColor Cyan
Write-Host ""

# Check Railway CLI
$railwayInstalled = Get-Command railway -ErrorAction SilentlyContinue
if (-not $railwayInstalled) {
    Write-Host "❌ Railway CLI not found!" -ForegroundColor Red
    Write-Host "Install with: npm i -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Railway CLI found" -ForegroundColor Green
Write-Host ""

# Check if logged in
$railwayUser = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Not logged in to Railway" -ForegroundColor Yellow
    Write-Host "Run: railway login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Logged in as: $railwayUser" -ForegroundColor Green
Write-Host ""

if ($DryRun) {
    Write-Host "🔍 DRY RUN MODE - No changes will be made" -ForegroundColor Yellow
    Write-Host ""
}

# Step 1: Deploy Inbox Orchestrator
Write-Host "Step 1: Deploying Inbox Orchestrator (Friday AI)..." -ForegroundColor Yellow
Push-Location "services\tekup-ai\packages\inbox-orchestrator"

if (-not $DryRun) {
    # Set environment variables
    Write-Host "  Setting environment variables..." -ForegroundColor Gray
    railway variables set NODE_ENV=production 2>&1 | Out-Null
    railway variables set PORT=3011 2>&1 | Out-Null
    railway variables set DEBUG=false 2>&1 | Out-Null
    
    # Deploy
    Write-Host "  Deploying..." -ForegroundColor Gray
    railway up --detach 2>&1 | Out-Null
    
    # Get URL (wait a bit for deployment)
    Start-Sleep -Seconds 5
    $orchUrl = railway domain 2>&1
    if ($LASTEXITCODE -eq 0) {
        $ORCH_URL = $orchUrl.Trim()
        Write-Host "  ✅ Deployed to: $ORCH_URL" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Deployment in progress, URL will be available in Railway dashboard" -ForegroundColor Yellow
        $ORCH_URL = "https://<inbox-orchestrator-url>.up.railway.app"
    }
} else {
    $ORCH_URL = "https://<inbox-orchestrator-url>.up.railway.app"
    Write-Host "  🔍 Would deploy to: $ORCH_URL" -ForegroundColor Gray
}

Pop-Location
Write-Host ""

# Step 2: Deploy Backend
Write-Host "Step 2: Deploying Backend NestJS..." -ForegroundColor Yellow
Push-Location "services\backend-nestjs"

if (-not $DryRun) {
    # Set environment variables
    Write-Host "  Setting environment variables..." -ForegroundColor Gray
    railway variables set NODE_ENV=production 2>&1 | Out-Null
    railway variables set PORT=3001 2>&1 | Out-Null
    railway variables set AI_FRIDAY_URL=$ORCH_URL 2>&1 | Out-Null
    railway variables set ENABLE_AI_FRIDAY=true 2>&1 | Out-Null
    
    # Deploy
    Write-Host "  Deploying..." -ForegroundColor Gray
    railway up --detach 2>&1 | Out-Null
    
    # Get URL
    Start-Sleep -Seconds 5
    $backendUrl = railway domain 2>&1
    if ($LASTEXITCODE -eq 0) {
        $BACKEND_URL = $backendUrl.Trim()
        Write-Host "  ✅ Deployed to: $BACKEND_URL" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Deployment in progress, URL will be available in Railway dashboard" -ForegroundColor Yellow
        $BACKEND_URL = "https://<backend-url>.up.railway.app"
    }
} else {
    $BACKEND_URL = "https://<backend-url>.up.railway.app"
    Write-Host "  🔍 Would deploy to: $BACKEND_URL" -ForegroundColor Gray
}

Pop-Location
Write-Host ""

# Step 3: Deploy Frontend
Write-Host "Step 3: Deploying Frontend Next.js..." -ForegroundColor Yellow
Push-Location "services\frontend-nextjs"

if (-not $DryRun) {
    # Set environment variables
    Write-Host "  Setting environment variables..." -ForegroundColor Gray
    railway variables set NODE_ENV=production 2>&1 | Out-Null
    railway variables set NEXT_PUBLIC_API_URL=$BACKEND_URL 2>&1 | Out-Null
    
    # Deploy
    Write-Host "  Deploying..." -ForegroundColor Gray
    railway up --detach 2>&1 | Out-Null
    
    # Get URL
    Start-Sleep -Seconds 5
    $frontendUrl = railway domain 2>&1
    if ($LASTEXITCODE -eq 0) {
        $FRONTEND_URL = $frontendUrl.Trim()
        Write-Host "  ✅ Deployed to: $FRONTEND_URL" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Deployment in progress, URL will be available in Railway dashboard" -ForegroundColor Yellow
        $FRONTEND_URL = "https://<frontend-url>.up.railway.app"
    }
} else {
    $FRONTEND_URL = "https://<frontend-url>.up.railway.app"
    Write-Host "  🔍 Would deploy to: $FRONTEND_URL" -ForegroundColor Gray
}

Pop-Location
Write-Host ""

# Step 4: Update URLs
if (-not $DryRun) {
    Write-Host "Step 4: Updating service URLs..." -ForegroundColor Yellow
    
    # Update backend with frontend URL
    Push-Location "services\backend-nestjs"
    railway variables set FRONTEND_URL=$FRONTEND_URL 2>&1 | Out-Null
    Pop-Location
    
    Write-Host "  ✅ URLs updated" -ForegroundColor Green
    Write-Host ""
}

# Summary
Write-Host "=== Deployment Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Services Deployed:" -ForegroundColor Yellow
Write-Host "  🎯 Inbox Orchestrator: $ORCH_URL" -ForegroundColor Green
Write-Host "  🔧 Backend NestJS:     $BACKEND_URL" -ForegroundColor Green
Write-Host "  🎨 Frontend Next.js:   $FRONTEND_URL" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Important URLs:" -ForegroundColor Yellow
Write-Host "  Frontend (Main App): $FRONTEND_URL" -ForegroundColor Cyan
Write-Host "  API Endpoint:        $BACKEND_URL/api/v1" -ForegroundColor Cyan
Write-Host "  Friday AI:          $ORCH_URL/chat" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Wait 2-3 minutes for services to fully start" -ForegroundColor Gray
Write-Host "  2. Test health endpoints:" -ForegroundColor Gray
Write-Host "     - $ORCH_URL/health" -ForegroundColor Gray
Write-Host "     - $BACKEND_URL/health" -ForegroundColor Gray
Write-Host "  3. Open frontend and test chat widget" -ForegroundColor Gray
Write-Host "  4. Set additional environment variables in Railway dashboard" -ForegroundColor Gray
Write-Host "     (Database, Supabase, etc.)" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tip: Use 'railway logs' to view service logs" -ForegroundColor Cyan
Write-Host "💡 Tip: Use 'railway open' to open Railway dashboard" -ForegroundColor Cyan

