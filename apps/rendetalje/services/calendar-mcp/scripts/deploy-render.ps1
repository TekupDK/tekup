# RenOS Calendar MCP - Render Deployment
# Creates and deploys backend + dashboard to Render.com via CLI

param(
    [string]$ServiceName = "renos-calendar-mcp",
    [string]$DashboardName = "renos-calendar-dashboard",
    [string]$Region = "frankfurt",
    [string]$Branch = "main",
    [string]$RepoUrl = "https://github.com/JonasAbde/Tekup-Cloud"
)

Write-Host "=== Deploying to Render.com ===" -ForegroundColor Magenta
Write-Host ""

# Check if secrets exist
if (-not (Test-Path "deployment/.secrets/google-private-key.txt")) {
    Write-Host "✗ Missing secrets! Run setup first:" -ForegroundColor Red
    Write-Host "  1. Copy deployment/.secrets.example/* to deployment/.secrets/" -ForegroundColor Yellow
    Write-Host "  2. Fill in actual credentials" -ForegroundColor Yellow
    Write-Host "  OR use AI browser with deployment/COMET_PROMPT.md" -ForegroundColor Yellow
    exit 1
}

Write-Host "Note: Render CLI has limited service creation support." -ForegroundColor Yellow
Write-Host "Using render.yaml for automatic deployment is recommended." -ForegroundColor Yellow
Write-Host ""
Write-Host "Alternative approach:" -ForegroundColor Cyan
Write-Host "  1. Push to GitHub: git push origin main" -ForegroundColor White
Write-Host "  2. Connect repo in Render dashboard (one-time)" -ForegroundColor White
Write-Host "  3. render.yaml will auto-configure everything" -ForegroundColor White
Write-Host ""

# For now, provide instructions for manual setup
Write-Host "Manual Setup Instructions:" -ForegroundColor Magenta
Write-Host ""
Write-Host "1. Go to https://dashboard.render.com/create" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Create Web Service:" -ForegroundColor Yellow
Write-Host "   - Connect repo: $RepoUrl" -ForegroundColor White
Write-Host "   - Name: $ServiceName" -ForegroundColor White
Write-Host "   - Region: $Region" -ForegroundColor White
Write-Host "   - Branch: $Branch" -ForegroundColor White
Write-Host "   - Environment: Docker" -ForegroundColor White
Write-Host "   - Dockerfile path: ./renos-calendar-mcp/Dockerfile" -ForegroundColor White
Write-Host "   - Plan: Starter" -ForegroundColor White
Write-Host ""
Write-Host "3. Environment Variables:" -ForegroundColor Yellow
Write-Host "   - Link group: 'Tekup Database Environment'" -ForegroundColor White
Write-Host "   - Create group: 'RenOS Calendar MCP' with:" -ForegroundColor White
Write-Host "     * GOOGLE_CLIENT_EMAIL=renos-319@renos-465008.iam.gserviceaccount.com" -ForegroundColor White
Write-Host "     * GOOGLE_PRIVATE_KEY=(from deployment/.secrets/google-private-key.txt)" -ForegroundColor White
Write-Host "     * GOOGLE_PROJECT_ID=renos-465008" -ForegroundColor White
Write-Host "     * GOOGLE_CALENDAR_ID=c_39570a852bf141658572fa37bb229c7246564a6cca47560bc66a4f9e4fec67ff@group.calendar.google.com" -ForegroundColor White
Write-Host "     * MCP_API_KEY=renos-calendar-mcp-secret-key-2025" -ForegroundColor White
Write-Host ""
Write-Host "4. Create Static Site for Dashboard:" -ForegroundColor Yellow
Write-Host "   - Name: $DashboardName" -ForegroundColor White
Write-Host "   - Root directory: renos-calendar-mcp/dashboard" -ForegroundColor White
Write-Host "   - Build: npm install && npm run build" -ForegroundColor White
Write-Host "   - Publish: dist" -ForegroundColor White
Write-Host "   - Env: VITE_API_URL=https://$ServiceName.onrender.com" -ForegroundColor White
Write-Host ""
Write-Host "OR: Use render.yaml auto-deployment (recommended)" -ForegroundColor Green
Write-Host "    Just push to GitHub and Render will detect render.yaml" -ForegroundColor Green

