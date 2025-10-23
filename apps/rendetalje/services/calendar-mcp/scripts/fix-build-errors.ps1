# RenOS Calendar MCP - Build Error Fixer
# Automatisk rettelse af almindelige build fejl

Write-Host "=== Fixing Build Errors ===" -ForegroundColor Magenta
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "✗ Must run from renos-calendar-mcp root directory" -ForegroundColor Red
    exit 1
}

# Step 1: Clean build
Write-Host "1. Cleaning previous build..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✓ Cleaned dist directory" -ForegroundColor Green
}

# Step 2: Install dependencies
Write-Host ""
Write-Host "2. Installing dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "✗ npm install failed: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Check TypeScript config
Write-Host ""
Write-Host "3. Checking TypeScript configuration..." -ForegroundColor Yellow
if (Test-Path "tsconfig.json") {
    Write-Host "✓ tsconfig.json found" -ForegroundColor Green
} else {
    Write-Host "✗ tsconfig.json missing" -ForegroundColor Red
    exit 1
}

# Step 4: Try build
Write-Host ""
Write-Host "4. Attempting build..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "✓ Build successful!" -ForegroundColor Green
} catch {
    Write-Host "✗ Build failed, checking for common issues..." -ForegroundColor Red
    
    # Check for common TypeScript errors
    Write-Host ""
    Write-Host "Checking for common issues:" -ForegroundColor Yellow
    
    # Check if all source files exist
    $requiredFiles = @(
        "src/index.ts",
        "src/http-server.ts",
        "src/config.ts",
        "src/types.ts",
        "src/tools/booking-validator.ts",
        "src/tools/invoice-automation.ts",
        "src/tools/overtime-tracker.ts",
        "src/tools/customer-memory.ts",
        "src/integrations/supabase.ts",
        "src/integrations/google-calendar.ts",
        "src/integrations/twilio-voice.ts",
        "src/validators/date-validator.ts",
        "src/validators/fail-safe.ts",
        "src/utils/logger.ts",
        "src/utils/undo-manager.ts"
    )
    
    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            Write-Host "✓ $file" -ForegroundColor Green
        } else {
            Write-Host "✗ $file - MISSING!" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "If files are missing, they need to be recreated." -ForegroundColor Yellow
    Write-Host "Run the main implementation script again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== BUILD FIXED ===" -ForegroundColor Green
Write-Host "Project builds successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: ./scripts/quick-deploy.ps1" -ForegroundColor White
Write-Host "2. Or: ./scripts/deploy-all.ps1" -ForegroundColor White
