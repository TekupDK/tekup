#!/usr/bin/env pwsh

# RestaurantIQ Development Status Check
# This script checks the status of all development services

Write-Host "🍽️  RestaurantIQ Development Status" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# Check Docker services
Write-Host "📋 Docker Services Status:" -ForegroundColor Yellow
try {
    $services = docker-compose ps --format table 2>$null
    if ($services) {
        $services
    } else {
        Write-Host "❌ No services running or Docker Compose not available" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error checking Docker services: $_" -ForegroundColor Red
}

Write-Host ""

# Check individual service health
Write-Host "🏥 Service Health Checks:" -ForegroundColor Yellow

# Check PostgreSQL
Write-Host -NoNewline "PostgreSQL (5432): "
try {
    $pgResult = Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($pgResult) {
        Write-Host "✅ Running" -ForegroundColor Green
    } else {
        Write-Host "❌ Not accessible" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error" -ForegroundColor Red
}

# Check Redis
Write-Host -NoNewline "Redis (6379): "
try {
    $redisResult = Test-NetConnection -ComputerName localhost -Port 6379 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($redisResult) {
        Write-Host "✅ Running" -ForegroundColor Green
    } else {
        Write-Host "❌ Not accessible" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error" -ForegroundColor Red
}

# Check pgAdmin
Write-Host -NoNewline "pgAdmin (5050): "
try {
    $pgAdminResult = Test-NetConnection -ComputerName localhost -Port 5050 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($pgAdminResult) {
        Write-Host "✅ Running" -ForegroundColor Green
    } else {
        Write-Host "❌ Not accessible" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error" -ForegroundColor Red
}

Write-Host ""

# Environment file check
Write-Host "🔧 Configuration Status:" -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✅ Environment file (.env) exists" -ForegroundColor Green
} else {
    Write-Host "❌ Environment file (.env) missing" -ForegroundColor Red
}

if (Test-Path ".env.example") {
    Write-Host "✅ Example environment file (.env.example) exists" -ForegroundColor Green
} else {
    Write-Host "❌ Example environment file (.env.example) missing" -ForegroundColor Red
}

Write-Host ""

# Project structure check
Write-Host "📁 Project Structure:" -ForegroundColor Yellow
$directories = @("backend", "frontend", "shared", "docker", "docs")
foreach ($dir in $directories) {
    if (Test-Path $dir) {
        Write-Host "✅ $dir/ directory exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $dir/ directory missing" -ForegroundColor Red
    }
}

Write-Host ""

# Access URLs
Write-Host "🌐 Access URLs:" -ForegroundColor Yellow
Write-Host "📊 pgAdmin:        http://localhost:5050" -ForegroundColor Cyan
Write-Host "   Username:      admin@restaurantiq.dev" -ForegroundColor Gray
Write-Host "   Password:      admin123" -ForegroundColor Gray
Write-Host ""
Write-Host "🗄️  PostgreSQL:    localhost:5432" -ForegroundColor Cyan
Write-Host "   Database:      restaurantiq_dev" -ForegroundColor Gray
Write-Host "   Username:      restaurantiq_user" -ForegroundColor Gray
Write-Host "   Password:      restaurantiq_password" -ForegroundColor Gray
Write-Host ""
Write-Host "🔴 Redis:          localhost:6379" -ForegroundColor Cyan
Write-Host ""

# Next steps
Write-Host "📋 Next Development Steps:" -ForegroundColor Yellow
Write-Host "1. 🔄 Initialize Node.js backend (cd backend; npm init)" -ForegroundColor White
Write-Host "2. 🔄 Initialize Next.js frontend (cd frontend; npx create-next-app@latest .)" -ForegroundColor White
Write-Host "3. 🔄 Set up database migrations" -ForegroundColor White
Write-Host "4. 🔄 Implement authentication system" -ForegroundColor White
Write-Host "5. 🔄 Create shared types package" -ForegroundColor White

Write-Host ""
Write-Host "Ready to start development!" -ForegroundColor Green
