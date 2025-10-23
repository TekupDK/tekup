# RenOS Calendar MCP - CLI Authentication
# Authenticates with Render and Supabase CLIs

Write-Host "=== CLI Authentication ===" -ForegroundColor Magenta
Write-Host ""

# Login to Render
Write-Host "Logging into Render..." -ForegroundColor Green
Write-Host "This will open a browser for authentication" -ForegroundColor Yellow
Write-Host ""

try {
    render login
    Write-Host "✓ Render authentication successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Render authentication failed: $_" -ForegroundColor Red
    Write-Host "Please ensure you have a Render account and try again" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Login to Supabase
Write-Host "Logging into Supabase..." -ForegroundColor Green
Write-Host "This will open a browser for authentication" -ForegroundColor Yellow
Write-Host ""

try {
    supabase login
    Write-Host "✓ Supabase authentication successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Supabase authentication failed: $_" -ForegroundColor Red
    Write-Host "Please ensure you have a Supabase account and try again" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Logged in successfully!" -ForegroundColor Green
Write-Host "Your credentials are saved for future use" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next step: Run './scripts/deploy-all.ps1' to deploy" -ForegroundColor Cyan

