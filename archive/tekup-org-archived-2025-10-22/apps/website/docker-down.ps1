#!/usr/bin/env pwsh
# Stop Tekup Website Docker container

Write-Host "🛑 Stopping Tekup Website Docker container..." -ForegroundColor Red

# Change to website directory
Set-Location $PSScriptRoot

# Stop and remove the container
Write-Host "Stopping container..." -ForegroundColor Yellow
docker-compose down

# Check if container is still running
$container = docker ps --filter "name=tekup-website-dev" --format "{{.Names}}"

if (-not $container) {
    Write-Host "`n✅ Container stopped successfully" -ForegroundColor Green
    Write-Host "🚀 Use 'docker-up.ps1' to start it again" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️ Container might still be running" -ForegroundColor Yellow
    Write-Host "Try: docker stop tekup-website-dev" -ForegroundColor Yellow
}