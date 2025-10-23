# Tekup Database - Automated Setup
# This script sets up everything automatically

Write-Host "`n>>> TEKUP DATABASE - AUTOMATED SETUP <<<`n" -ForegroundColor Cyan

# Function to check if Docker is ready
function Test-DockerReady {
    try {
        $result = docker info 2>&1
        return $result -notmatch "error during connect"
    } catch {
        return $false
    }
}

# Step 1: Wait for Docker to be ready
Write-Host "[Step 1/7] Waiting for Docker Desktop to be ready..." -ForegroundColor Yellow
$maxWait = 120  # 2 minutes max
$waited = 0
$interval = 5

while (-not (Test-DockerReady) -and $waited -lt $maxWait) {
    Write-Host "   Waiting... ($waited seconds)" -ForegroundColor Gray
    Start-Sleep -Seconds $interval
    $waited += $interval
}

if (Test-DockerReady) {
    Write-Host "[OK] Docker is ready!`n" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Docker failed to start within $maxWait seconds" -ForegroundColor Red
    Write-Host "Please start Docker Desktop manually and run this script again." -ForegroundColor Yellow
    exit 1
}

# Step 2: Start PostgreSQL containers
Write-Host "[Step 2/7] Starting PostgreSQL containers..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Containers started!`n" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to start containers" -ForegroundColor Red
    exit 1
}

# Step 3: Wait for PostgreSQL to be ready
Write-Host "[Step 3/7] Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15
Write-Host "[OK] PostgreSQL should be ready!`n" -ForegroundColor Green

# Step 4: Generate Prisma Client
Write-Host "[Step 4/7] Generating Prisma Client..." -ForegroundColor Yellow
pnpm db:generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Prisma Client generated!`n" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}

# Step 5: Run migrations
Write-Host "[Step 5/7] Running database migrations..." -ForegroundColor Yellow
Write-Host "   Creating migration: initial_setup" -ForegroundColor Gray

# Create migration non-interactively
$env:PRISMA_MIGRATE_SKIP_GENERATE = "true"
pnpm prisma migrate dev --name initial_setup --skip-generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Migrations completed!`n" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Migration failed" -ForegroundColor Red
    exit 1
}

# Step 6: Verify setup
Write-Host "[Step 6/7] Verifying setup..." -ForegroundColor Yellow

# Check containers
$containers = docker ps --filter "name=tekup-database" --format "{{.Names}}" | Measure-Object -Line
if ($containers.Lines -ge 2) {
    Write-Host "[OK] Containers running: $($containers.Lines)" -ForegroundColor Green
} else {
    Write-Host "[WARN] Expected 2 containers, found: $($containers.Lines)" -ForegroundColor Yellow
}

# Step 7: Success summary
Write-Host "`n" + "="*60 -ForegroundColor Cyan
Write-Host ">>> SETUP COMPLETE! <<<" -ForegroundColor Green
Write-Host "="*60 + "`n" -ForegroundColor Cyan

Write-Host "Database Status:" -ForegroundColor Cyan
Write-Host "   • PostgreSQL: Running on localhost:5432" -ForegroundColor White
Write-Host "   • pgAdmin: Running on localhost:5050" -ForegroundColor White
Write-Host "   • Schemas: vault, billy, renos, crm, flow, shared" -ForegroundColor White

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "   1. Open Prisma Studio: pnpm db:studio" -ForegroundColor White
Write-Host "   2. View in pgAdmin: http://localhost:5050" -ForegroundColor White
Write-Host "      Login: admin@tekup.local / admin123" -ForegroundColor Gray

Write-Host "`nConnection String:" -ForegroundColor Cyan
Write-Host "   DATABASE_URL=postgresql://tekup:tekup123@localhost:5432/tekup_db" -ForegroundColor Gray

Write-Host "`n[SUCCESS] Ready to connect services!" -ForegroundColor Green
