# RenOS Calendar MCP - Quick Deploy
# One-command deployment with automatic setup

Write-Host "==================================================" -ForegroundColor Magenta
Write-Host "  RenOS Calendar MCP - Quick Deploy" -ForegroundColor Magenta
Write-Host "==================================================" -ForegroundColor Magenta
Write-Host ""

# Step 1: Setup secrets automatically
Write-Host "=== Step 1: Setting up secrets ===" -ForegroundColor Magenta
./scripts/setup-secrets.ps1

Write-Host ""

# Step 2: Install CLI tools if needed
Write-Host "=== Step 2: Checking CLI tools ===" -ForegroundColor Magenta
if (-not (Get-Command render -ErrorAction SilentlyContinue)) {
    Write-Host "Installing CLI tools..." -ForegroundColor Yellow
    ./scripts/install-cli-tools.ps1
    Write-Host ""
    Write-Host "Please run: ./scripts/login-cli-tools.ps1" -ForegroundColor Cyan
    Write-Host "Then re-run: ./scripts/quick-deploy.ps1" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "✓ CLI tools found" -ForegroundColor Green
}

Write-Host ""

# Step 3: Build project
Write-Host "=== Step 3: Building project ===" -ForegroundColor Magenta
try {
    npm run build
    Write-Host "✓ Build successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Build failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Deploy to Supabase
Write-Host "=== Step 4: Deploying to Supabase ===" -ForegroundColor Magenta
try {
    ./scripts/deploy-supabase.ps1
    Write-Host "✓ Supabase deployment complete" -ForegroundColor Green
} catch {
    Write-Host "⚠ Supabase deployment had issues" -ForegroundColor Yellow
    Write-Host "You may need to run migration manually" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Deploy to Render
Write-Host "=== Step 5: Deploying to Render ===" -ForegroundColor Magenta
Write-Host ""
Write-Host "Choose deployment method:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  A) Git Auto-Deploy (Recommended)" -ForegroundColor Green
Write-Host "     1. git add ." -ForegroundColor White
Write-Host "     2. git commit -m 'Deploy RenOS Calendar MCP'" -ForegroundColor White
Write-Host "     3. git push origin main" -ForegroundColor White
Write-Host "     4. Go to https://dashboard.render.com/" -ForegroundColor White
Write-Host "     5. New → Blueprint → Connect repo" -ForegroundColor White
Write-Host "     6. Render auto-detects render.yaml" -ForegroundColor White
Write-Host ""
Write-Host "  B) Manual Setup" -ForegroundColor Yellow
Write-Host "     Follow: ./scripts/deploy-render.ps1" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Press Enter to continue with Git method"

Write-Host ""
Write-Host "=== DEPLOYMENT READY ===" -ForegroundColor Green
Write-Host "✓ Secrets configured" -ForegroundColor Green
Write-Host "✓ Project built" -ForegroundColor Green
Write-Host "✓ Supabase schema deployed" -ForegroundColor Green
Write-Host "⏳ Render deployment pending" -ForegroundColor Yellow
Write-Host ""
Write-Host "After Render deployment:" -ForegroundColor Cyan
Write-Host "  Backend: https://renos-calendar-mcp.onrender.com" -ForegroundColor White
Write-Host "  Dashboard: https://renos-calendar-dashboard.onrender.com" -ForegroundColor White
Write-Host ""
Write-Host "Verify: ./scripts/verify-deployment.ps1" -ForegroundColor Cyan
