Write-Host "Testing Tekup Services..." -ForegroundColor Blue

$services = @(
    "http://localhost:8080",
    "http://localhost:3002", 
    "http://localhost:3003/qualification/stats"
)

foreach ($url in $services) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 5
        Write-Host "✓ $url" -ForegroundColor Green
    } catch {
        Write-Host "✗ $url" -ForegroundColor Red
    }
}

Write-Host "Done!" -ForegroundColor Blue