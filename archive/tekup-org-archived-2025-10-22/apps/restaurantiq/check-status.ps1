#!/usr/bin/env pwsh

# RestaurantIQ Development Status Check
Write-Host "RestaurantIQ Development Status" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# Check Docker services
Write-Host "Docker Services Status:" -ForegroundColor Yellow
docker-compose ps

Write-Host ""

# Check service ports
Write-Host "Service Health Checks:" -ForegroundColor Yellow

Write-Host -NoNewline "PostgreSQL (5432): "
$pgResult = Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($pgResult) {
    Write-Host "Running" -ForegroundColor Green
} else {
    Write-Host "Not accessible" -ForegroundColor Red
}

Write-Host -NoNewline "Redis (6379): "
$redisResult = Test-NetConnection -ComputerName localhost -Port 6379 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($redisResult) {
    Write-Host "Running" -ForegroundColor Green
} else {
    Write-Host "Not accessible" -ForegroundColor Red
}

Write-Host -NoNewline "pgAdmin (5050): "
$pgAdminResult = Test-NetConnection -ComputerName localhost -Port 5050 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($pgAdminResult) {
    Write-Host "Running" -ForegroundColor Green
} else {
    Write-Host "Not accessible" -ForegroundColor Red
}

Write-Host ""

# Configuration check
Write-Host "Configuration Status:" -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "Environment file (.env) exists" -ForegroundColor Green
} else {
    Write-Host "Environment file (.env) missing" -ForegroundColor Red
}

Write-Host ""

# Access information
Write-Host "Access URLs:" -ForegroundColor Yellow
Write-Host "pgAdmin:     http://localhost:5050" -ForegroundColor Cyan
Write-Host "Username:    admin@restaurantiq.dev" -ForegroundColor Gray
Write-Host "Password:    admin123" -ForegroundColor Gray
Write-Host ""
Write-Host "PostgreSQL:  localhost:5432" -ForegroundColor Cyan
Write-Host "Database:    restaurantiq_dev" -ForegroundColor Gray
Write-Host "Username:    restaurantiq_user" -ForegroundColor Gray
Write-Host ""

Write-Host "Development environment ready!" -ForegroundColor Green
