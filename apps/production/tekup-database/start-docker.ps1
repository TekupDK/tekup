# Start Docker Desktop
Write-Host "Starting Docker Desktop..." -ForegroundColor Cyan

$dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"

if (Test-Path $dockerPath) {
    Start-Process $dockerPath
    Write-Host "Docker Desktop started!" -ForegroundColor Green
    Write-Host "Waiting for Docker to be ready (this takes 30-60 seconds)..." -ForegroundColor Yellow
} else {
    Write-Host "Docker Desktop not found at: $dockerPath" -ForegroundColor Red
    exit 1
}
