# Performance & Load Testing
# Tests response times and concurrent requests

$API_URL = "http://localhost:3000/api/chat"

Write-Host "[TEST] Performance & Load Testing`n" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray

# Test 1: Response Time Distribution
Write-Host "`n[1/3] Testing Response Time Distribution..." -ForegroundColor Yellow

$queries = @(
    "Hej",
    "Hvad er Tekup?",
    "Hvordan laver jeg en faktura?",
    "Forklar MCP tools",
    "Vis mig et TypeScript eksempel"
)

$responseTimes = @()

foreach ($query in $queries) {
    $startTime = Get-Date
    
    try {
        $body = @{
            message = $query
            messages = @()
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri $API_URL -Method Post -Body $body -ContentType "application/json" -TimeoutSec 30
        
        $duration = ((Get-Date) - $startTime).TotalMilliseconds
        $responseTimes += $duration
        
        Write-Host "   Query: '$query' -> $([math]::Round($duration))ms"
    } catch {
        Write-Host "   Query: '$query' -> FAILED" -ForegroundColor Red
    }
}

if ($responseTimes.Count -gt 0) {
    $avgTime = ($responseTimes | Measure-Object -Average).Average
    $minTime = ($responseTimes | Measure-Object -Minimum).Minimum
    $maxTime = ($responseTimes | Measure-Object -Maximum).Maximum
    
    Write-Host "`n   Average: $([math]::Round($avgTime))ms" -ForegroundColor Cyan
    Write-Host "   Min: $([math]::Round($minTime))ms"
    Write-Host "   Max: $([math]::Round($maxTime))ms"
    Write-Host "   Variance: $([math]::Round($maxTime - $minTime))ms"
}

# Test 2: Concurrent Requests
Write-Host "`n[2/3] Testing Concurrent Requests..." -ForegroundColor Yellow

$concurrentCount = 3
$jobs = @()

Write-Host "   Launching $concurrentCount concurrent requests..."

$scriptBlock = {
    param($url, $message)
    
    $body = @{
        message = $message
        messages = @()
    } | ConvertTo-Json
    
    $startTime = Get-Date
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" -TimeoutSec 30
        $duration = ((Get-Date) - $startTime).TotalMilliseconds
        
        return @{
            Success = $true
            Duration = $duration
            Length = $response.message.Length
        }
    } catch {
        $duration = ((Get-Date) - $startTime).TotalMilliseconds
        return @{
            Success = $false
            Duration = $duration
            Error = $_.Exception.Message
        }
    }
}

$startConcurrent = Get-Date

for ($i = 0; $i -lt $concurrentCount; $i++) {
    $jobs += Start-Job -ScriptBlock $scriptBlock -ArgumentList $API_URL, "Test concurrent query $i"
}

$results = $jobs | Wait-Job | Receive-Job
$jobs | Remove-Job

$concurrentDuration = ((Get-Date) - $startConcurrent).TotalMilliseconds

$successful = ($results | Where-Object { $_.Success }).Count

Write-Host "   Completed: $successful/$concurrentCount successful"
Write-Host "   Total time: $([math]::Round($concurrentDuration))ms"
Write-Host "   Time per request (sequential): $([math]::Round($concurrentDuration / $concurrentCount))ms avg"

# Test 3: Memory & Resource Usage
Write-Host "`n[3/3] Checking Resource Usage..." -ForegroundColor Yellow

$process = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -eq "" }

if ($process) {
    $memoryMB = [math]::Round($process.WorkingSet64 / 1MB, 2)
    $cpuPercent = [math]::Round($process.CPU, 2)
    
    Write-Host "   Memory: ${memoryMB} MB"
    Write-Host "   CPU Time: ${cpuPercent}s"
    
    if ($memoryMB -gt 500) {
        Write-Host "   [WARNING] High memory usage!" -ForegroundColor Yellow
    } else {
        Write-Host "   [OK] Memory usage normal" -ForegroundColor Green
    }
} else {
    Write-Host "   [SKIP] Node process not found"
}

# Summary
Write-Host "`n" ("=" * 60) -ForegroundColor Gray
Write-Host "`n[SUMMARY] Performance Results:" -ForegroundColor Cyan

$performanceReport = @{
    ResponseTime = @{
        Average = [math]::Round($avgTime)
        Min = [math]::Round($minTime)
        Max = [math]::Round($maxTime)
        Variance = [math]::Round($maxTime - $minTime)
    }
    Concurrent = @{
        Count = $concurrentCount
        Successful = $successful
        TotalTime = [math]::Round($concurrentDuration)
    }
    Resources = @{
        MemoryMB = if ($process) { $memoryMB } else { "N/A" }
        Status = if ($memoryMB -lt 500) { "OK" } else { "HIGH" }
    }
}

Write-Host "   Response Times: Avg $([math]::Round($avgTime))ms | Min $([math]::Round($minTime))ms | Max $([math]::Round($maxTime))ms"
Write-Host "   Concurrent: $successful/$concurrentCount successful in $([math]::Round($concurrentDuration))ms"
Write-Host "   Memory: $(if ($process) { $memoryMB } else { 'N/A' }) MB"

# Export
$performanceReport | ConvertTo-Json | Out-File -FilePath "tests\performance-results.json"
Write-Host "`n[SAVE] Results saved to tests\performance-results.json`n"

# Pass/Fail criteria
$failed = 0
if ($avgTime -gt 10000) {  # 10 seconds average is too slow
    Write-Host "[FAIL] Average response time too high" -ForegroundColor Red
    $failed++
}
if ($successful -lt $concurrentCount) {
    Write-Host "[WARNING] Some concurrent requests failed" -ForegroundColor Yellow
}

Write-Host "`n[DONE] Performance tests completed`n" -ForegroundColor Green

exit $failed
