# Tekup Health Check Script
param([switch]$Continuous, [int]$Interval = 10)

function Write-HealthLog {
    param($Message, $Color = "White")
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

Write-HealthLog "Starting Tekup Health Check..." "Blue"

do {
    $iteration = if ($iteration) { $iteration + 1 } else { 1 }
    
    if ($Continuous) {
        Write-HealthLog "=== Health Check #$iteration ===" "Blue"
    }
    
    # Test web services
    $services = @(
        "http://localhost:8080",
        "http://localhost:3002", 
        "http://localhost:3003/qualification/stats"
    )
    
    $healthyCount = 0
    foreach ($url in $services) {
        try {
            $startTime = Get-Date
            $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 5
            $responseTime = (Get-Date) - $startTime
            $healthyCount++
            Write-HealthLog "✓ $url : $([math]::Round($responseTime.TotalMilliseconds))ms" "Green"
        }
        catch {
            Write-HealthLog "✗ $url : Failed" "Red"
        }
    }
    
    # Test databases
    try {
        $pgTest = Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet -WarningAction SilentlyContinue
        if ($pgTest.TcpTestSucceeded) {
            Write-HealthLog "✓ PostgreSQL: Connected" "Green"
        } else {
            Write-HealthLog "✗ PostgreSQL: Not available" "Red"
        }
    } catch {
        Write-HealthLog "✗ PostgreSQL: Connection test failed" "Red"
    }
    
    try {
        $redisTest = Test-NetConnection -ComputerName localhost -Port 6379 -InformationLevel Quiet -WarningAction SilentlyContinue
        if ($redisTest.TcpTestSucceeded) {
            Write-HealthLog "✓ Redis: Connected" "Green"
        } else {
            Write-HealthLog "✗ Redis: Not available" "Red"
        }
    } catch {
        Write-HealthLog "✗ Redis: Connection test failed" "Red"
    }
    
    # Summary
    Write-HealthLog "Summary: $healthyCount/3 web services healthy" "Cyan"
    
    if ($Continuous) {
        Write-HealthLog "Next check in $Interval seconds..." "Yellow"
        Start-Sleep -Seconds $Interval
    }
    
} while ($Continuous)

Write-HealthLog "Health check completed!" "Green"