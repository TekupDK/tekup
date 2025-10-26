# Simple Tekup Service Monitor
param(
    [int]$Interval = 30,
    [switch]$Continuous
)

function Write-MonitorLog {
    param($Message, $Color = "White", $Level = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $Color
}

function Test-Services {
    Write-MonitorLog "Testing all services..." "Blue" "MONITOR"
    
    $services = @(
        @{Name="Marketing Website"; URL="http://localhost:8080"; Type="Frontend"}
        @{Name="Lead Platform Web"; URL="http://localhost:3002"; Type="Frontend"}
        @{Name="Lead Platform API"; URL="http://localhost:3003/api"; Type="Backend"}
        @{Name="API Stats"; URL="http://localhost:3003/qualification/stats"; Type="API"}
    )
    
    $results = @()
    foreach ($service in $services) {
        try {
            $startTime = Get-Date
            $response = Invoke-WebRequest -Uri $service.URL -Method Head -TimeoutSec 10
            $responseTime = (Get-Date) - $startTime
            
            $result = @{
                Name = $service.Name
                Status = "HEALTHY"
                ResponseTime = [math]::Round($responseTime.TotalMilliseconds, 2)
                StatusCode = $response.StatusCode
            }
            
            Write-MonitorLog "✓ $($service.Name): $($result.ResponseTime)ms" "Green" "HEALTH"
            $results += $result
            
        } catch {
            $result = @{
                Name = $service.Name
                Status = "DOWN"
                Error = $_.Exception.Message
            }
            
            Write-MonitorLog "✗ $($service.Name): DOWN - $($_.Exception.Message)" "Red" "ERROR"
            $results += $result
        }
    }
    
    return $results
}

function Test-DatabaseConnections {
    Write-MonitorLog "Testing database connections..." "Cyan" "DB"
    
    # Test PostgreSQL
    try {
        $pgTest = Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet -WarningAction SilentlyContinue
        if ($pgTest.TcpTestSucceeded) {
            Write-MonitorLog "✓ PostgreSQL: Connected" "Green" "DB"
        } else {
            Write-MonitorLog "✗ PostgreSQL: Not connected" "Red" "DB"
        }
    } catch {
        Write-MonitorLog "✗ PostgreSQL: Test failed" "Red" "DB"
    }
    
    # Test Redis
    try {
        $redisTest = Test-NetConnection -ComputerName localhost -Port 6379 -InformationLevel Quiet -WarningAction SilentlyContinue
        if ($redisTest.TcpTestSucceeded) {
            Write-MonitorLog "✓ Redis: Connected" "Green" "DB"
        } else {
            Write-MonitorLog "✗ Redis: Not connected" "Red" "DB"
        }
    } catch {
        Write-MonitorLog "✗ Redis: Test failed" "Red" "DB"
    }
}

function Show-ServiceSummary {
    param($Results)
    
    $healthy = ($Results | Where-Object { $_.Status -eq "HEALTHY" }).Count
    $total = $Results.Count
    $avgResponse = if ($Results.ResponseTime) {
        ($Results | Where-Object { $_.ResponseTime } | Measure-Object ResponseTime -Average).Average
    } else { 0 }
    
    Write-MonitorLog "=== SERVICE SUMMARY ===" "Blue"
    Write-MonitorLog "Healthy Services: $healthy/$total" "White"
    if ($avgResponse -gt 0) {
        Write-MonitorLog "Average Response: $([math]::Round($avgResponse, 2))ms" "Cyan"
    }
    
    if ($healthy -eq $total) {
        Write-MonitorLog "✓ All services are healthy!" "Green" "STATUS"
    } else {
        Write-MonitorLog "⚠ Some services have issues!" "Yellow" "STATUS"
    }
}

Write-MonitorLog "Starting Tekup Service Monitor..." "Blue"
Write-MonitorLog "Monitoring interval: $Interval seconds" "Cyan"

if ($Continuous) {
    Write-MonitorLog "Starting continuous monitoring... (Press Ctrl+C to stop)" "Yellow"
    
    $iteration = 0
    while ($true) {
        $iteration++
        Write-MonitorLog "=== Monitoring Iteration $iteration ===" "Blue"
        
        $serviceResults = Test-Services
        Test-DatabaseConnections
        Show-ServiceSummary -Results $serviceResults
        
        Write-MonitorLog "Next check in $Interval seconds..." "Cyan"
        Start-Sleep -Seconds $Interval
    }
} else {
    $serviceResults = Test-Services
    Test-DatabaseConnections
    Show-ServiceSummary -Results $serviceResults
}

Write-MonitorLog "Service monitoring completed!" "Green"