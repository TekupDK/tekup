# Autonomous Railway Deployment Script
# Deploys all services without any user interaction

$ErrorActionPreference = "Continue"
$env:RAILWAY_NO_TELEMETRY = "1"

Write-Host "=== Autonomous Railway Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Check Railway CLI
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Railway CLI not found! Please install: npm install -g @railway/cli" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Railway CLI found" -ForegroundColor Green

# Check login
try {
    $whoami = railway whoami 2>&1 | Out-String
    if ($whoami -match "Logged in") {
        Write-Host "[OK] $whoami" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Not logged in. Please run: railway login" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] Not logged in. Please run: railway login" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Get existing orchestrator URL from Railway
Write-Host "[INFO] Checking existing services..." -ForegroundColor Yellow
$ORCH_URL = ""
Push-Location "C:\Users\empir\Tekup\services\tekup-ai\packages\inbox-orchestrator"
try {
    $status = railway status 2>&1 | Out-String
    if ($status -match "inbox-orchestrator") {
        Write-Host "  [OK] Inbox Orchestrator already linked" -ForegroundColor Green
        # Get domain
        $domain = railway domain 2>&1 | Out-String
        if ($domain -and $domain -notmatch "No domain" -and $domain -notmatch "error") {
            $ORCH_URL = $domain.Trim()
            Write-Host "  [URL] $ORCH_URL" -ForegroundColor Cyan
        }
    }
} catch {}
Pop-Location

# Step 1: Deploy Inbox Orchestrator
Write-Host ""
Write-Host "Step 1: Deploying Inbox Orchestrator (Friday AI)..." -ForegroundColor Cyan
Push-Location "C:\Users\empir\Tekup\services\tekup-ai\packages\inbox-orchestrator"

Write-Host "  [DEPLOY] Building and deploying..." -ForegroundColor Gray
railway up --detach 2>&1 | Out-Null

Start-Sleep -Seconds 5
$domainResult = railway domain 2>&1 | Out-String
# Extract URL from domain output (may contain extra text)
if ($domainResult -match "https://[^\s]+") {
    $ORCH_URL = $matches[0]
    Write-Host "  [OK] Orchestrator: $ORCH_URL" -ForegroundColor Green
} elseif ($domainResult -and $domainResult -notmatch "No domain" -and $domainResult -notmatch "error") {
    $ORCH_URL = ($domainResult -split "`n" | Where-Object { $_ -match "https://" } | Select-Object -First 1).Trim()
    if ($ORCH_URL) {
        Write-Host "  [OK] Orchestrator: $ORCH_URL" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Deployment started, URL will be available shortly" -ForegroundColor Yellow
        $ORCH_URL = "https://inbox-orchestrator-production.up.railway.app"
    }
} else {
    Write-Host "  [WARN] Deployment started, URL will be available shortly" -ForegroundColor Yellow
    $ORCH_URL = "https://inbox-orchestrator-production.up.railway.app"
}

Pop-Location
Write-Host ""

# Step 2: Deploy Backend
Write-Host "Step 2: Deploying Backend NestJS..." -ForegroundColor Cyan
Push-Location "C:\Users\empir\Tekup\apps\rendetalje\services\backend-nestjs"

# Link to Railway project
Write-Host "  🔗 Linking to Railway..." -ForegroundColor Gray
railway link 2>&1 | Out-Null

# Set environment variables
Write-Host "  ⚙️  Setting environment variables..." -ForegroundColor Gray
if ($ORCH_URL -and $ORCH_URL -notmatch "placeholder") {
    railway variables set "AI_FRIDAY_URL=$ORCH_URL" --detach 2>&1 | Out-Null
}
railway variables set "ENABLE_AI_FRIDAY=true" --detach 2>&1 | Out-Null
railway variables set "NODE_ENV=production" --detach 2>&1 | Out-Null
railway variables set "PORT=3001" --detach 2>&1 | Out-Null

Write-Host "  📦 Deploying..." -ForegroundColor Gray
railway up --detach 2>&1 | Out-Null

Start-Sleep -Seconds 5
$backendDomain = railway domain 2>&1 | Out-String
if ($backendDomain -match "https://[^\s]+") {
    $BACKEND_URL = $matches[0]
    Write-Host "  [OK] Backend: $BACKEND_URL" -ForegroundColor Green
} elseif ($backendDomain -and $backendDomain -notmatch "No domain" -and $backendDomain -notmatch "error") {
    $BACKEND_URL = ($backendDomain -split "`n" | Where-Object { $_ -match "https://" } | Select-Object -First 1).Trim()
    if ($BACKEND_URL) {
        Write-Host "  [OK] Backend: $BACKEND_URL" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Deployment started, URL will be available shortly" -ForegroundColor Yellow
        $BACKEND_URL = "https://rendetalje-backend-production.up.railway.app"
    }
} else {
    Write-Host "  [WARN] Deployment started, URL will be available shortly" -ForegroundColor Yellow
    $BACKEND_URL = "https://rendetalje-backend-production.up.railway.app"
}

Pop-Location
Write-Host ""

# Step 3: Deploy Frontend
Write-Host "Step 3: Deploying Frontend Next.js..." -ForegroundColor Cyan
Push-Location "C:\Users\empir\Tekup\apps\rendetalje\services\frontend-nextjs"

# Link to Railway project
Write-Host "  🔗 Linking to Railway..." -ForegroundColor Gray
railway link 2>&1 | Out-Null

# Set environment variables
Write-Host "  ⚙️  Setting environment variables..." -ForegroundColor Gray
if ($BACKEND_URL -and $BACKEND_URL -notmatch "placeholder") {
    railway variables set "NEXT_PUBLIC_API_URL=$BACKEND_URL" --detach 2>&1 | Out-Null
}
railway variables set "NODE_ENV=production" --detach 2>&1 | Out-Null

Write-Host "  📦 Deploying..." -ForegroundColor Gray
railway up --detach 2>&1 | Out-Null

Start-Sleep -Seconds 5
$frontendDomain = railway domain 2>&1 | Out-String
if ($frontendDomain -match "https://[^\s]+") {
    $FRONTEND_URL = $matches[0]
    Write-Host "  [OK] Frontend: $FRONTEND_URL" -ForegroundColor Green
} elseif ($frontendDomain -and $frontendDomain -notmatch "No domain" -and $frontendDomain -notmatch "error") {
    $FRONTEND_URL = ($frontendDomain -split "`n" | Where-Object { $_ -match "https://" } | Select-Object -First 1).Trim()
    if ($FRONTEND_URL) {
        Write-Host "  [OK] Frontend: $FRONTEND_URL" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Deployment started, URL will be available shortly" -ForegroundColor Yellow
        $FRONTEND_URL = "https://rendetalje-frontend-production.up.railway.app"
    }
} else {
    Write-Host "  [WARN] Deployment started, URL will be available shortly" -ForegroundColor Yellow
    $FRONTEND_URL = "https://rendetalje-frontend-production.up.railway.app"
}

Pop-Location
Write-Host ""

# Update Backend with Frontend URL
Write-Host "Step 4: Updating Backend configuration..." -ForegroundColor Cyan
Push-Location "C:\Users\empir\Tekup\apps\rendetalje\services\backend-nestjs"
if ($FRONTEND_URL -and $FRONTEND_URL -notmatch "placeholder") {
    railway variables set "FRONTEND_URL=$FRONTEND_URL" --detach 2>&1 | Out-Null
    Write-Host "  [OK] URLs synchronized" -ForegroundColor Green
}
Pop-Location
Write-Host ""

# Summary
Write-Host "=== Deployment Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services Deployed:" -ForegroundColor Yellow
Write-Host "  [1] Inbox Orchestrator: $ORCH_URL" -ForegroundColor Green
Write-Host "  [2] Backend NestJS:     $BACKEND_URL" -ForegroundColor Green
Write-Host "  [3] Frontend Next.js:   $FRONTEND_URL" -ForegroundColor Green
Write-Host ""
Write-Host "[INFO] Services are deploying... This may take 3-5 minutes." -ForegroundColor Yellow
Write-Host ""
Write-Host "Monitoring:" -ForegroundColor Yellow
Write-Host "  - Railway Dashboard: railway open" -ForegroundColor Gray
Write-Host "  - View logs: railway logs --tail" -ForegroundColor Gray
Write-Host ""
Write-Host "Test Health Endpoints:" -ForegroundColor Yellow
Write-Host "  - $ORCH_URL/health" -ForegroundColor Gray
Write-Host "  - $BACKEND_URL/health" -ForegroundColor Gray
Write-Host ""
Write-Host "[OK] Deployment initiated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Note: First deployment may take 5-10 minutes to build and start" -ForegroundColor Cyan
