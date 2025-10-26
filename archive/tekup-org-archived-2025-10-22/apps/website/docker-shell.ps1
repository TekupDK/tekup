#!/usr/bin/env pwsh
# Access shell in Tekup Website Docker container

Write-Host "🐚 Accessing Tekup Website Docker container shell..." -ForegroundColor Cyan

# Change to website directory
Set-Location $PSScriptRoot

# Check if container is running
$container = docker ps --filter "name=tekup-website-dev" --format "{{.Names}}"

if ($container) {
    Write-Host "Container found: $container" -ForegroundColor Green
    Write-Host "Opening shell (type 'exit' to return)..." -ForegroundColor Yellow
    docker exec -it tekup-website-dev /bin/sh
} else {
    Write-Host "❌ Container 'tekup-website-dev' is not running" -ForegroundColor Red
    Write-Host "🚀 Start it first with: .\docker-up.ps1" -ForegroundColor Yellow
}