# Docker Stop Script for RenOS Calendar MCP
# This script stops and cleans up the Docker containers

Write-Host "🛑 RenOS Calendar MCP - Docker Stop" -ForegroundColor Red
Write-Host "================================================" -ForegroundColor Red

# Stop services
Write-Host "🛑 Stopping services..." -ForegroundColor Yellow
docker-compose down

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to stop services" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Services stopped successfully" -ForegroundColor Green

# Optional: Remove containers and images
$choice = Read-Host "Do you want to remove containers and images? (y/N)"
if ($choice -eq "y" -or $choice -eq "Y") {
    Write-Host "🗑️  Removing containers and images..." -ForegroundColor Yellow
    docker-compose down --rmi all --volumes --remove-orphans
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Containers and images removed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Some containers or images could not be removed" -ForegroundColor Yellow
    }
}

Write-Host "🎉 RenOS Calendar MCP has been stopped" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Red
