# Monitor Frontend Deploy Status
$env:RENDER_API_KEY = "rnd_spBHfqtMGYf51WJKgfuLL0aGvNzD"
$serviceId = "srv-d3e057nfte5s73f2naqg"
$deployId = "dep-d3i4qb49c44c73afuun0"

Write-Host "Monitoring Frontend Deploy..." -ForegroundColor Cyan
Write-Host ""

$elapsed = 0
$maxWait = 300

while ($elapsed -lt $maxWait) {
    try {
        $response = curl.exe -s "https://api.render.com/v1/services/$serviceId/deploys/$deployId" `
            -H "Authorization: Bearer $env:RENDER_API_KEY" | ConvertFrom-Json
        
        $status = $response.status
        
        $color = switch ($status) {
            "live" { "Green" }
            "build_in_progress" { "Yellow" }
            "build_failed" { "Red" }
            default { "White" }
        }
        
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Status: $status" -ForegroundColor $color
        
        if ($status -eq "live") {
            Write-Host ""
            Write-Host "Frontend Deploy Complete!" -ForegroundColor Green
            Write-Host "Test: https://www.renos.dk/dashboard" -ForegroundColor Cyan
            break
        }
        
        if ($status -eq "build_failed") {
            Write-Host ""
            Write-Host "Build Failed!" -ForegroundColor Red
            break
        }
        
        Start-Sleep -Seconds 10
        $elapsed += 10
        
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
        break
    }
}

if ($elapsed -ge $maxWait) {
    Write-Host "Timeout after 5 minutes" -ForegroundColor Yellow
}
