# Test Backend Setup Script
# Verificer at renos-backend kan køre selvstændigt

$backendPath = "C:\Users\empir\renos-backend"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RenOS Backend Setup Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Check directory exists
if (-not (Test-Path $backendPath)) {
    Write-Host "ERROR: Backend directory not found: $backendPath" -ForegroundColor Red
    exit 1
}

cd $backendPath

# 2. Check package.json
Write-Host "[1/5] Checking package.json..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    $pkg = Get-Content "package.json" | ConvertFrom-Json
    Write-Host "  Name: $($pkg.name)" -ForegroundColor Green
    Write-Host "  Version: $($pkg.version)" -ForegroundColor Green
} else {
    Write-Host "  ERROR: package.json not found" -ForegroundColor Red
    exit 1
}

# 3. Install dependencies
Write-Host "`n[2/5] Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: npm install failed" -ForegroundColor Red
    exit 1
}
Write-Host "  SUCCESS: Dependencies installed" -ForegroundColor Green

# 4. Check .env file
Write-Host "`n[3/5] Checking environment variables..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "  SUCCESS: .env file found" -ForegroundColor Green
} else {
    Write-Host "  WARNING: .env file not found" -ForegroundColor DarkYellow
    Write-Host "  Copy .env.example to .env and configure it" -ForegroundColor DarkYellow
}

# 5. Generate Prisma client
Write-Host "`n[4/5] Generating Prisma client..." -ForegroundColor Yellow
npm run db:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "  WARNING: Prisma generate failed (needs database connection)" -ForegroundColor DarkYellow
} else {
    Write-Host "  SUCCESS: Prisma client generated" -ForegroundColor Green
}

# 6. Build TypeScript
Write-Host "`n[5/5] Building TypeScript..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: TypeScript build failed" -ForegroundColor Red
    Write-Host "  Check for TypeScript errors" -ForegroundColor Red
    exit 1
}
Write-Host "  SUCCESS: TypeScript build completed" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Backend Setup Test Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Copy .env file: Copy-Item 'C:\Users\empir\Tekup Google AI\.env' '.\.env'" -ForegroundColor White
Write-Host "2. Push database schema: npm run db:push" -ForegroundColor White
Write-Host "3. Start dev server: npm run dev" -ForegroundColor White
Write-Host "4. Verify Google setup: npm run verify:google" -ForegroundColor White
Write-Host ""
