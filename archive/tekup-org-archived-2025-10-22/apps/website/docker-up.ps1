#!/usr/bin/env pwsh
# Start Tekup Website in Docker (detached mode)

Write-Host "Starting Tekup Website in Docker..." -ForegroundColor Cyan

# Change to website directory
Set-Location $PSScriptRoot

# Build and start the container in detached mode
Write-Host "Building and starting container..." -ForegroundColor Yellow
docker-compose up --build -d

# Wait a moment for container to start
Start-Sleep -Seconds 3

# Check container status
$container = docker ps --filter "name=tekup-website-dev" --format "table {{.Names}}	{{.Status}}	{{.Ports}}"

if ($container) {
    Write-Host "`nContainer started successfully:" -ForegroundColor Green
    Write-Host $container
    Write-Host "`nWebsite should be available at: http://localhost:8080" -ForegroundColor Green
    Write-Host "Use docker-logs.ps1 to view container logs" -ForegroundColor Yellow
    Write-Host "Use docker-down.ps1 to stop the container" -ForegroundColor Yellow
} else {
    Write-Host "`nContainer failed to start" -ForegroundColor Red
    Write-Host "Run docker-compose logs website to see what went wrong" -ForegroundColor Yellow
}

Write-Host "`nTerminal is now free for other tasks!" -ForegroundColor Magenta
