#!/usr/bin/env pwsh
# View logs from Tekup Website Docker container

param(
    [switch]$Follow,  # -Follow or -f to follow logs
    [int]$Tail = 50   # Number of lines to show (default: 50)
)

Write-Host "📊 Viewing Tekup Website Docker logs..." -ForegroundColor Cyan

# Change to website directory
Set-Location $PSScriptRoot

if ($Follow) {
    Write-Host "Following logs (Press Ctrl+C to stop)..." -ForegroundColor Yellow
    docker-compose logs -f --tail $Tail website
} else {
    Write-Host "Showing last $Tail lines..." -ForegroundColor Yellow
    docker-compose logs --tail $Tail website
}

Write-Host "`n💡 Usage examples:" -ForegroundColor Magenta
Write-Host "  .\docker-logs.ps1                # Show last 50 lines" -ForegroundColor Gray
Write-Host "  .\docker-logs.ps1 -Follow        # Follow logs in real-time" -ForegroundColor Gray
Write-Host "  .\docker-logs.ps1 -Tail 100      # Show last 100 lines" -ForegroundColor Gray