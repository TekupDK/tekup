#!/usr/bin/env pwsh
# Stop RenOS Test Database
# This script stops and optionally removes the test database containers

param(
    [switch]$RemoveVolumes = $false
)

Write-Host "🛑 Stopping RenOS Test Database..." -ForegroundColor Cyan

# Navigate to services directory
$servicesDir = Split-Path -Parent $PSScriptRoot
Set-Location $servicesDir

if ($RemoveVolumes) {
    Write-Host "🗑️  Removing containers and volumes..." -ForegroundColor Yellow
    docker-compose -f docker-compose.test.yml down -v
    Write-Host "✅ Test database containers and volumes removed!" -ForegroundColor Green
} else {
    Write-Host "📦 Stopping containers (data preserved)..." -ForegroundColor Yellow
    docker-compose -f docker-compose.test.yml down
    Write-Host "✅ Test database containers stopped!" -ForegroundColor Green
}

Write-Host ""
Write-Host "📝 To start again: .\scripts\start-test-db.ps1" -ForegroundColor Cyan
Write-Host "📝 To reset completely: .\scripts\stop-test-db.ps1 -RemoveVolumes" -ForegroundColor Cyan
Write-Host ""
