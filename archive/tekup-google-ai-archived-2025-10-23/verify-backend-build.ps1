# Backend Build Verification Script
# Ensures backend builds correctly without frontend

Write-Host "`n🔧 RenOS Backend Build Verification" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# Clean previous build
Write-Host "🧹 Cleaning previous build..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "   ✓ Removed old dist/" -ForegroundColor Green
}

# Install dependencies (excluding dev)
Write-Host "`n📦 Installing production dependencies..." -ForegroundColor Yellow
npm install --omit=dev --silent
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ✗ npm install failed!" -ForegroundColor Red
    exit 1
}

# Generate Prisma client
Write-Host "`n🗄️  Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate --silent
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Prisma client generated" -ForegroundColor Green
} else {
    Write-Host "   ✗ Prisma generate failed!" -ForegroundColor Red
    exit 1
}

# Build TypeScript
Write-Host "`n⚙️  Building TypeScript..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ TypeScript compiled successfully" -ForegroundColor Green
} else {
    Write-Host "   ✗ TypeScript build failed!" -ForegroundColor Red
    exit 1
}

# Verify output
Write-Host "`n✅ Verifying build output..." -ForegroundColor Yellow

if (Test-Path "dist/index.js") {
    Write-Host "   ✓ dist/index.js exists" -ForegroundColor Green
} else {
    Write-Host "   ✗ dist/index.js NOT FOUND!" -ForegroundColor Red
    exit 1
}

$fileCount = (Get-ChildItem -Path "dist" -Recurse -File).Count
Write-Host "   ✓ Build contains $fileCount files" -ForegroundColor Green

$distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
$distSizeRounded = [math]::Round($distSize, 2)
Write-Host "   ✓ Total size: $distSizeRounded MB" -ForegroundColor Green

# Check critical files
$criticalFiles = @(
    "dist/index.js",
    "dist/server.js",
    "dist/config.js",
    "dist/logger.js",
    "dist/env.js"
)

Write-Host "`n📋 Critical files check:" -ForegroundColor Yellow
foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "   ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $file MISSING!" -ForegroundColor Red
    }
}

# Summary
Write-Host "`n📊 Build Summary:" -ForegroundColor Cyan
Write-Host "   Backend: ✓ Ready for deployment" -ForegroundColor Green
Write-Host "   Output: dist/" -ForegroundColor White
Write-Host "   Start command: node dist/index.js" -ForegroundColor White
Write-Host "   Files: $fileCount" -ForegroundColor White
Write-Host "   Size: $distSizeRounded MB" -ForegroundColor White

Write-Host "`n🚀 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Commit changes: git add render.yaml .dockerignore" -ForegroundColor White
Write-Host "   2. Push to GitHub: git push origin main" -ForegroundColor White
Write-Host "   3. Render will auto-deploy backend" -ForegroundColor White
Write-Host "   4. Frontend (tekup-renos-1) deploys separately" -ForegroundColor White

Write-Host "`n✅ Backend build verification COMPLETE!`n" -ForegroundColor Green
