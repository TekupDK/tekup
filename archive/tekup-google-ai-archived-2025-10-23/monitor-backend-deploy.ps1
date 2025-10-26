# Monitor Backend Deployment Status
# Run this to track deployment progress

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       MONITORING BACKEND DEPLOYMENT PROGRESS...       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$env:RENDER_API_KEY = "rnd_spBHfqtMGYf51WJKgfuLL0aGvNzD"
$serviceId = "srv-d3dv61ffte5s73f1uccg"

$maxChecks = 20
$checkInterval = 15 # seconds

for ($i = 1; $i -le $maxChecks; $i++) {
    try {
        $deploys = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId/deploys?limit=1" `
            -Headers @{"Authorization" = "Bearer $env:RENDER_API_KEY" }
        
        $latest = $deploys[0].deploy
        $commit = $latest.commit.id.Substring(0, 7)
        $status = $latest.status
        
        $statusColor = switch ($status) {
            'live' { 'Green' }
            'building' { 'Yellow' }
            'created' { 'Cyan' }
            'update_in_progress' { 'Yellow' }
            default { 'Red' }
        }
        
        $timestamp = Get-Date -Format "HH:mm:ss"
        
        Write-Host "[$timestamp] Check $i/$maxChecks - Commit: $commit - Status: $status" -ForegroundColor $statusColor
        
        if ($status -eq 'live') {
            Write-Host "`n✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
            Write-Host "`nCommit Message:" -ForegroundColor Yellow
            Write-Host $latest.commit.message.Split("`n")[0]
            
            Write-Host "`n🧪 TEST COMMANDS:" -ForegroundColor Cyan
            Write-Host "  1. Test frontend: https://www.renos.dk/dashboard" -ForegroundColor White
            Write-Host "  2. Test backend: https://api.renos.dk/api/chat" -ForegroundColor White
            Write-Host "  3. Check DevTools Console for CORS errors" -ForegroundColor White
            break
        }
        
        if ($i -lt $maxChecks) {
            Write-Host "   Waiting $checkInterval seconds..." -ForegroundColor Gray
            Start-Sleep -Seconds $checkInterval
        }
        
    }
    catch {
        Write-Host "❌ Error checking status: $($_.Exception.Message)" -ForegroundColor Red
        break
    }
}

if ($status -ne 'live') {
    Write-Host "`n⚠️ Deployment still in progress after $(($maxChecks * $checkInterval) / 60) minutes" -ForegroundColor Yellow
    Write-Host "   Check Render dashboard: https://dashboard.render.com/" -ForegroundColor Cyan
}

Write-Host ""
