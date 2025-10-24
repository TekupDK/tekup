#!/usr/bin/env pwsh
# Start RenOS Test Database
# This script starts the PostgreSQL and Redis test containers

Write-Host "🚀 Starting RenOS Test Database..." -ForegroundColor Cyan

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Navigate to services directory
$servicesDir = Split-Path -Parent $PSScriptRoot
Set-Location $servicesDir

# Start containers
Write-Host "📦 Starting containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.test.yml up -d

# Wait for PostgreSQL to be ready
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
$retries = 30
$delay = 2
$ready = $false

for ($i = 0; $i -lt $retries; $i++) {
    try {
        $result = docker exec renos-postgres-test pg_isready -U renos_test -d renos_test 2>&1
        if ($LASTEXITCODE -eq 0) {
            $ready = $true
            break
        }
    } catch {
        # Continue waiting
    }
    Start-Sleep -Seconds $delay
    Write-Host "." -NoNewline
}
Write-Host ""

if ($ready) {
    Write-Host "✅ PostgreSQL is ready!" -ForegroundColor Green
} else {
    Write-Host "❌ PostgreSQL failed to start within timeout." -ForegroundColor Red
    exit 1
}

# Wait for Redis to be ready
Write-Host "⏳ Waiting for Redis to be ready..." -ForegroundColor Yellow
$ready = $false

for ($i = 0; $i -lt $retries; $i++) {
    try {
        $result = docker exec renos-redis-test redis-cli -a renos_test_redis_password ping 2>&1
        if ($result -match "PONG") {
            $ready = $true
            break
        }
    } catch {
        # Continue waiting
    }
    Start-Sleep -Seconds $delay
    Write-Host "." -NoNewline
}
Write-Host ""

if ($ready) {
    Write-Host "✅ Redis is ready!" -ForegroundColor Green
} else {
    Write-Host "❌ Redis failed to start within timeout." -ForegroundColor Red
    exit 1
}

# Display connection information
Write-Host ""
Write-Host "🔗 Test Database Connection Details:" -ForegroundColor Cyan
Write-Host "PostgreSQL: postgresql://renos_test:renos_test_password@localhost:5433/renos_test"
Write-Host "Redis: redis://:renos_test_redis_password@localhost:6380"
Write-Host ""
Write-Host "✅ Test database is ready for integration tests!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Usage:" -ForegroundColor Cyan
Write-Host "  - Run backend tests: cd backend-nestjs && npm run test:e2e"
Write-Host "  - Run frontend E2E: cd frontend-nextjs && npm run test:e2e"
Write-Host "  - Stop database: docker-compose -f docker-compose.test.yml down"
Write-Host "  - Reset database: docker-compose -f docker-compose.test.yml down -v"
Write-Host ""
