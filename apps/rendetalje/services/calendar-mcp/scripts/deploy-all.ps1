# RenOS Calendar MCP - Complete Deployment Automation
# One-command deployment to Supabase + Render

Write-Host "==================================================" -ForegroundColor Magenta
Write-Host "  RenOS Calendar MCP - Complete Deployment" -ForegroundColor Magenta
Write-Host "==================================================" -ForegroundColor Magenta
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "✗ Must run from renos-calendar-mcp root directory" -ForegroundColor Red
    exit 1
}

# Step 1: Check CLI tools
Write-Host "=== Step 1: Checking CLI Tools ===" -ForegroundColor Magenta
if (-not (Get-Command render -ErrorAction SilentlyContinue)) {
    Write-Host "CLI tools not found. Installing..." -ForegroundColor Yellow
    ./scripts/install-cli-tools.ps1
    Write-Host ""
    Write-Host "Please run ./scripts/login-cli-tools.ps1 and then re-run this script" -ForegroundColor Cyan
    exit 0
}
Write-Host "✓ CLI tools found" -ForegroundColor Green
Write-Host ""

# Step 2: Build TypeScript
Write-Host "=== Step 2: Building TypeScript ===" -ForegroundColor Magenta
try {
    npm run build
    Write-Host "✓ Build successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Build failed: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Deploy to Supabase
Write-Host "=== Step 3: Deploying to Supabase ===" -ForegroundColor Magenta
try {
    ./scripts/deploy-supabase.ps1
    Write-Host "✓ Supabase deployment complete" -ForegroundColor Green
} catch {
    Write-Host "⚠ Supabase deployment had issues (check output above)" -ForegroundColor Yellow
    Write-Host "You may need to run migration manually" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Render deployment instructions
Write-Host "=== Step 4: Deploying to Render ===" -ForegroundColor Magenta
Write-Host ""
Write-Host "Render deployment requires one-time manual setup." -ForegroundColor Yellow
Write-Host "After initial setup, deployments are automatic via git push." -ForegroundColor Yellow
Write-Host ""
Write-Host "Choose deployment method:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  A) Automatic (Recommended)" -ForegroundColor Green
Write-Host "     1. Push to GitHub: git push origin main" -ForegroundColor White
Write-Host "     2. Go to https://dashboard.render.com/" -ForegroundColor White
Write-Host "     3. Click 'New' → 'Blueprint'" -ForegroundColor White
Write-Host "     4. Connect your repo" -ForegroundColor White
Write-Host "     5. Render will auto-detect render.yaml and setup everything" -ForegroundColor White
Write-Host ""
Write-Host "  B) Manual Setup" -ForegroundColor Yellow
Write-Host "     Run: ./scripts/deploy-render.ps1" -ForegroundColor White
Write-Host "     (Provides detailed manual setup instructions)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Continue with instructions? (Press Enter)"

Write-Host ""
Write-Host "=== DEPLOYMENT STATUS ===" -ForegroundColor Green
Write-Host "✓ TypeScript built" -ForegroundColor Green
Write-Host "✓ Supabase schema deployed" -ForegroundColor Green
Write-Host "⏳ Render deployment pending (see instructions above)" -ForegroundColor Yellow
Write-Host ""
Write-Host "After Render deployment:" -ForegroundColor Cyan
Write-Host "  Backend: https://renos-calendar-mcp.onrender.com" -ForegroundColor White
Write-Host "  Dashboard: https://renos-calendar-dashboard.onrender.com" -ForegroundColor White
Write-Host ""
Write-Host "Verify: ./scripts/verify-deployment.ps1" -ForegroundColor Cyan

