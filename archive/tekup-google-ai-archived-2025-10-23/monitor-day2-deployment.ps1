# Monitor Day 2 Deployment Progress
# Automatically checks deployment status every 30 seconds

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         MONITORING DAY 2 DEPLOYMENT PROGRESS          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$env:RENDER_API_KEY = "rnd_spBHfqtMGYf51WJKgfuLL0aGvNzD"
$serviceId = "srv-d3dv61ffte5s73f1uccg"
$targetDeployId = "dep-d3iluabuibrs73d1cqb0"

$maxChecks = 20
$checkInterval = 30 # seconds

Write-Host "Target Deploy: $targetDeployId" -ForegroundColor Yellow
Write-Host "Service: tekup-renos" -ForegroundColor Yellow
Write-Host "Checking every $checkInterval seconds...`n" -ForegroundColor Gray

for ($i = 1; $i -le $maxChecks; $i++) {
    try {
        $deploys = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId/deploys?limit=1" `
            -Headers @{"Authorization" = "Bearer $env:RENDER_API_KEY"}
        
        $latest = $deploys[0].deploy
        $deployId = $latest.id
        $commit = $latest.commit.id.Substring(0, 7)
        $status = $latest.status
        $timestamp = Get-Date -Format "HH:mm:ss"
        
        $statusColor = switch ($status) {
            'live' { 'Green' }
            'build_in_progress' { 'Yellow' }
            'created' { 'Cyan' }
            'build_failed' { 'Red' }
            default { 'White' }
        }
        
        Write-Host "[$timestamp] Check $i/$maxChecks" -NoNewline -ForegroundColor Gray
        Write-Host " - Deploy: " -NoNewline -ForegroundColor Gray
        Write-Host "$($deployId.Substring(0, 12))..." -NoNewline -ForegroundColor Cyan
        Write-Host " - Commit: $commit - Status: " -NoNewline -ForegroundColor Gray
        Write-Host "$status" -ForegroundColor $statusColor
        
        if ($status -eq 'live') {
            Write-Host "`n✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
            Write-Host "`n📋 Commit Message:" -ForegroundColor Yellow
            Write-Host $latest.commit.message.Split("`n")[0]
            
            Write-Host "`n🧪 Testing Customer 360 Endpoints..." -ForegroundColor Cyan
            
            # Test endpoints
            try {
                Write-Host "   Testing GET /api/dashboard/customers..." -NoNewline
                $customers = Invoke-RestMethod "https://api.renos.dk/api/dashboard/customers"
                Write-Host " ✅ ($($customers.Count) customers)" -ForegroundColor Green
                
                if ($customers.Count -gt 0) {
                    $testId = $customers[0].id
                    $testName = $customers[0].name
                    
                    Write-Host "   Testing GET /customers/$testId/leads..." -NoNewline
                    $leads = Invoke-RestMethod "https://api.renos.dk/api/dashboard/customers/$testId/leads"
                    Write-Host " ✅ ($($leads.Count) leads)" -ForegroundColor Green
                    
                    Write-Host "   Testing GET /customers/$testId/bookings..." -NoNewline
                    $bookings = Invoke-RestMethod "https://api.renos.dk/api/dashboard/customers/$testId/bookings"
                    Write-Host " ✅ ($($bookings.Count) bookings)" -ForegroundColor Green
                    
                    Write-Host "`n🎉 ALL ENDPOINTS WORKING!" -ForegroundColor Green
                    Write-Host "`nTest Customer: $testName" -ForegroundColor Yellow
                    Write-Host "   Leads: $($leads.Count)" -ForegroundColor Gray
                    Write-Host "   Bookings: $($bookings.Count)" -ForegroundColor Gray
                }
            }
            catch {
                Write-Host " ❌ FAILED" -ForegroundColor Red
                Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
            }
            
            break
        }
        
        if ($status -eq 'build_failed') {
            Write-Host "`n❌ BUILD FAILED!" -ForegroundColor Red
            Write-Host "`n📋 Commit Message:" -ForegroundColor Yellow
            Write-Host $latest.commit.message.Split("`n")[0]
            Write-Host "`n🔍 Check Render dashboard for logs:" -ForegroundColor Yellow
            Write-Host "   https://dashboard.render.com/web/$serviceId" -ForegroundColor Cyan
            break
        }
        
        if ($i -lt $maxChecks) {
            Write-Host "   ⏳ Waiting $checkInterval seconds..." -ForegroundColor Gray
            Start-Sleep -Seconds $checkInterval
        }
        
    }
    catch {
        Write-Host "❌ Error checking status: $($_.Exception.Message)" -ForegroundColor Red
        break
    }
}

if ($status -ne 'live' -and $status -ne 'build_failed') {
    Write-Host "`n⚠️ Deployment still in progress after $(($maxChecks * $checkInterval) / 60) minutes" -ForegroundColor Yellow
    Write-Host "   Check Render dashboard: https://dashboard.render.com/web/$serviceId" -ForegroundColor Cyan
}

Write-Host ""
