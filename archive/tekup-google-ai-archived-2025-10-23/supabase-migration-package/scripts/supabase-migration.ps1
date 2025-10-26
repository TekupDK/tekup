# Supabase Migration Quick Setup
# Run this script from project root: .\scripts\supabase-migration.ps1

Write-Host "🔄 RenOS Supabase Migration Script" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-Host "⚠️  .env file ikke fundet. Opretter fra .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env fil oprettet. HUSK at opdatere DATABASE_URL med dit Supabase password!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Åbn .env og erstat:" -ForegroundColor Yellow
    Write-Host "   [YOUR-PASSWORD] med dit Supabase database password" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Tryk Enter når du har opdateret .env"
}

# Step 2: Verify DATABASE_URL is set
$envContent = Get-Content ".env" -Raw
if ($envContent -match "\[YOUR-PASSWORD\]") {
    Write-Host "❌ DATABASE_URL indeholder stadig [YOUR-PASSWORD]" -ForegroundColor Red
    Write-Host "   Opdater .env med dit rigtige Supabase password først!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ .env fil konfigureret" -ForegroundColor Green
Write-Host ""

# Step 3: Install dependencies
Write-Host "📦 Installerer dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install fejlede" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installeret" -ForegroundColor Green
Write-Host ""

# Step 4: Generate Prisma Client
Write-Host "🔧 Genererer Prisma Client..." -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prisma generate fejlede" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma Client genereret" -ForegroundColor Green
Write-Host ""

# Step 5: Push schema to Supabase
Write-Host "📤 Pusher Prisma schema til Supabase..." -ForegroundColor Cyan
Write-Host "   (Dette opretter tabeller i din Supabase database)" -ForegroundColor Gray
npx prisma db push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prisma db push fejlede" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Mulige årsager:" -ForegroundColor Yellow
    Write-Host "   1. DATABASE_URL er forkert (tjek password)" -ForegroundColor Yellow
    Write-Host "   2. Supabase database er ikke tilgængelig" -ForegroundColor Yellow
    Write-Host "   3. Firewall blokerer forbindelsen" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Schema pushed til Supabase" -ForegroundColor Green
Write-Host ""

# Step 6: Verify connection
Write-Host "🔍 Verificerer database connection..." -ForegroundColor Cyan
npx prisma db pull
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Kunne ikke verificere connection" -ForegroundColor Yellow
}
else {
    Write-Host "✅ Database connection verificeret" -ForegroundColor Green
}
Write-Host ""

# Step 7: Success message
Write-Host "🎉 Supabase migration completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Næste skridt:" -ForegroundColor Cyan
Write-Host "   1. Test lokalt: npm run dev" -ForegroundColor White
Write-Host "   2. Åbn Prisma Studio: npx prisma studio" -ForegroundColor White
Write-Host "   3. Opdater Render.com environment variables (se docs/SUPABASE_MIGRATION.md)" -ForegroundColor White
Write-Host ""
Write-Host "📚 Fuld guide: docs/SUPABASE_MIGRATION.md" -ForegroundColor Gray
Write-Host ""

# Optional: Open Prisma Studio
$openStudio = Read-Host "Vil du åbne Prisma Studio nu? (y/n)"
if ($openStudio -eq "y") {
    Write-Host "🚀 Åbner Prisma Studio på http://localhost:5555..." -ForegroundColor Cyan
    Start-Process "npx" -ArgumentList "prisma studio"
}

Write-Host ""
Write-Host "✨ Færdig!" -ForegroundColor Green
