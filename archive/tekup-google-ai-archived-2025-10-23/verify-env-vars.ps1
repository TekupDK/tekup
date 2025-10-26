# 🔐 Environment Variables Verification Checklist
# Manual checklist for Render Dashboard

Write-Host "🔐 Render Environment Variables Checklist" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Go to: https://dashboard.render.com" -ForegroundColor Yellow
Write-Host "Service: tekup-renos" -ForegroundColor Yellow
Write-Host "Tab: Environment" -ForegroundColor Yellow
Write-Host ""

$required_vars = @(
    @{Name="GEMINI_KEY"; Critical=$true; Description="Gemini AI API key for quote generation"},
    @{Name="GOOGLE_CLIENT_ID"; Critical=$true; Description="Gmail OAuth client ID"},
    @{Name="GOOGLE_CLIENT_SECRET"; Critical=$true; Description="Gmail OAuth client secret"},
    @{Name="GOOGLE_REFRESH_TOKEN"; Critical=$true; Description="Gmail OAuth refresh token"},
    @{Name="DATABASE_URL"; Critical=$true; Description="PostgreSQL connection string"},
    @{Name="FRONTEND_URL"; Critical=$true; Description="Frontend URL for CORS"},
    @{Name="CORS_ORIGIN"; Critical=$true; Description="Allowed CORS origins"},
    @{Name="ENABLE_AUTH"; Critical=$false; Description="Enable/disable authentication"},
    @{Name="RUN_MODE"; Critical=$true; Description="Should be 'live' for production"},
    @{Name="GOOGLE_CALENDAR_ID"; Critical=$false; Description="Calendar ID for bookings"}
)

Write-Host "CRITICAL Variables (MUST be set):" -ForegroundColor Red
Write-Host "=================================" -ForegroundColor Red
foreach ($var in $required_vars | Where-Object {$_.Critical}) {
    Write-Host "  [ ] $($var.Name)" -ForegroundColor Yellow
    Write-Host "      → $($var.Description)" -ForegroundColor Gray
    Write-Host ""
}

Write-Host ""
Write-Host "Optional Variables (Nice to have):" -ForegroundColor Yellow
Write-Host "===================================" -ForegroundColor Yellow
foreach ($var in $required_vars | Where-Object {-not $_.Critical}) {
    Write-Host "  [ ] $($var.Name)" -ForegroundColor Cyan
    Write-Host "      → $($var.Description)" -ForegroundColor Gray
    Write-Host ""
}

Write-Host ""
Write-Host "⚠️  MOST CRITICAL: GEMINI_KEY" -ForegroundColor Red
Write-Host "   Without this, AI features fall back to regex parsing!" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ After verification, run: .\test-deployment.ps1" -ForegroundColor Green
