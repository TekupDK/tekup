#!/usr/bin/env pwsh
# 🚀 Quick Deployment Status Check

$API_BASE = "https://api.renos.dk"

Write-Host ""
Write-Host "🚀 RenOS Deployment Quick Status" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# Quick ping test
Write-Host "Checking backend..." -ForegroundColor Yellow
try {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $health = Invoke-RestMethod -Uri "$API_BASE/api/health" -Method Get -TimeoutSec 10
    $sw.Stop()
    
    Write-Host "✅ BACKEND ONLINE" -ForegroundColor Green
    Write-Host "   Response time: $($sw.ElapsedMilliseconds)ms" -ForegroundColor Gray
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
    Write-Host "   Uptime: $($health.uptime)s" -ForegroundColor Gray
    Write-Host "   Database: $($health.database)" -ForegroundColor Gray
    
    if ($health.status -eq "ok" -and $health.database -eq "connected") {
        Write-Host ""
        Write-Host "🎉 All systems operational!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Run: .\verify-env-vars.ps1 (check environment)" -ForegroundColor White
        Write-Host "2. Run: .\test-deployment.ps1 (full test suite)" -ForegroundColor White
        Write-Host "3. Open: $API_BASE (test UI)" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "⚠️  System partially operational" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ BACKEND OFFLINE" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Possible reasons:" -ForegroundColor Yellow
    Write-Host "• Deployment still in progress (wait 2-3 min)" -ForegroundColor Gray
    Write-Host "• Build failed (check Render logs)" -ForegroundColor Gray
    Write-Host "• Environment variables missing" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Check: https://dashboard.render.com" -ForegroundColor Cyan
}

Write-Host ""
