# RenOS Calendar MCP - CLI Tools Installation
# Installs Render CLI and Supabase CLI for automated deployment

Write-Host "=== Installing CLI Tools ===" -ForegroundColor Magenta
Write-Host ""

# Install Render CLI
Write-Host "Installing Render CLI..." -ForegroundColor Green
try {
    npm install -g @render/cli
    Write-Host "✓ Render CLI installed successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to install Render CLI: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Install Supabase CLI (Windows via npm)
Write-Host "Installing Supabase CLI..." -ForegroundColor Green
try {
    npm install -g supabase
    Write-Host "✓ Supabase CLI installed successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to install Supabase CLI: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Verify installations
Write-Host "Verifying installations..." -ForegroundColor Yellow
Write-Host ""

try {
    $renderVersion = render --version
    Write-Host "✓ Render CLI: $renderVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Render CLI verification failed" -ForegroundColor Red
}

try {
    $supabaseVersion = supabase --version
    Write-Host "✓ Supabase CLI: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Supabase CLI verification failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "CLI tools installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next step: Run './scripts/login-cli-tools.ps1' to authenticate" -ForegroundColor Cyan

