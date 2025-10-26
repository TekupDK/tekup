# 📊 RenOS Deployment Monitor
# Monitors Render deployment status and health

$API_BASE = "https://api.renos.dk"
$CHECK_INTERVAL = 30  # seconds

Write-Host "📊 RenOS Deployment Monitor" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host "Checking every $CHECK_INTERVAL seconds..." -ForegroundColor Gray
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

$iteration = 1
while ($true) {
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] Check #$iteration" -ForegroundColor Cyan
    
    # Health Check
    try {
        $health = Invoke-RestMethod -Uri "$API_BASE/api/health" -Method Get -TimeoutSec 10 -ErrorAction Stop
        Write-Host "  ✅ Backend: ONLINE" -ForegroundColor Green
        Write-Host "     Status: $($health.status)" -ForegroundColor Gray
        Write-Host "     Uptime: $($health.uptime)s" -ForegroundColor Gray
        
        # Database check
        if ($health.database -eq "connected") {
            Write-Host "     Database: ✅ Connected" -ForegroundColor Green
        } else {
            Write-Host "     Database: ⚠️ $($health.database)" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "  ❌ Backend: OFFLINE or ERROR" -ForegroundColor Red
        Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
    
    Write-Host ""
    
    # Wait before next check
    Start-Sleep -Seconds $CHECK_INTERVAL
    $iteration++
}
