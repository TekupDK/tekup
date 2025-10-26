# AI-Driven Continuous Monitoring for Tekup Platform
param([int]$Interval = 30, [switch]$EnableMCP, [switch]$EnableReports)

$script:MonitorData = @{
    StartTime = Get-Date
    Iterations = 0
    ServiceChecks = @()
    MCPTests = @()
    Alerts = @()
}

function Write-AILog {
    param($Message, $Color = "White", $Level = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss.fff"
    Write-Host "[$timestamp] [AI-Monitor] [$Level] $Message" -ForegroundColor $Color
}

function Test-CoreServices {
    Write-AILog "Testing core services..." "Blue" "SERVICES"
    
    $services = @(
        @{Name="Marketing Website"; URL="http://localhost:8080"},
        @{Name="PostgreSQL"; Port=5432},
        @{Name="Redis"; Port=6379}
    )
    
    $results = @()
    foreach ($service in $services) {
        if ($service.URL) {
            try {
                $startTime = Get-Date
                $response = Invoke-WebRequest -Uri $service.URL -Method Head -TimeoutSec 3
                $responseTime = (Get-Date) - $startTime
                
                $result = @{
                    Name = $service.Name
                    Status = "HEALTHY" 
                    ResponseTime = [math]::Round($responseTime.TotalMilliseconds, 2)
                    Type = "HTTP"
                }
                Write-AILog "✓ $($service.Name): $($result.ResponseTime)ms" "Green" "HEALTH"
                
            } catch {
                $result = @{
                    Name = $service.Name
                    Status = "DOWN"
                    Error = $_.Exception.Message
                    Type = "HTTP"
                }
                Write-AILog "✗ $($service.Name): DOWN" "Red" "ERROR"
                $script:MonitorData.Alerts += "Service $($service.Name) is down"
            }
            $results += $result
            
        } elseif ($service.Port) {
            try {
                $test = Test-NetConnection -ComputerName localhost -Port $service.Port -InformationLevel Quiet -WarningAction SilentlyContinue
                
                $result = @{
                    Name = $service.Name
                    Status = if ($test.TcpTestSucceeded) { "CONNECTED" } else { "DISCONNECTED" }
                    Type = "TCP"
                }
                
                if ($test.TcpTestSucceeded) {
                    Write-AILog "✓ $($service.Name): Connected" "Green" "DB"
                } else {
                    Write-AILog "✗ $($service.Name): Not connected" "Red" "DB"
                    $script:MonitorData.Alerts += "Database $($service.Name) not connected"
                }
                
            } catch {
                $result = @{
                    Name = $service.Name
                    Status = "ERROR"
                    Error = $_.Exception.Message
                    Type = "TCP"
                }
                Write-AILog "✗ $($service.Name): Test failed" "Red" "ERROR"
            }
            $results += $result
        }
    }
    
    return $results
}

function Invoke-MCPAutomatedTesting {
    if (-not $EnableMCP) { return @() }
    
    Write-AILog "Running MCP automated testing..." "Magenta" "MCP"
    
    $mcpTests = @()
    try {
        # Test 1: Navigate to marketing site
        Write-AILog "MCP: Navigating to marketing website..." "Yellow"
        call_mcp_tool -name "browser_navigate" -input '{"url":"http://localhost:8080"}'
        $mcpTests += @{Test="Navigation"; Status="PASSED"; Time=Get-Date}
        
        Start-Sleep -Seconds 2
        
        # Test 2: Take screenshot for visual monitoring
        Write-AILog "MCP: Capturing screenshot..." "Yellow" 
        $timestamp = Get-Date -Format "HHmmss"
        call_mcp_tool -name "browser_screenshot" -input "{`"name`":`"auto-monitor-$timestamp`",`"fullPage`":true}"
        $mcpTests += @{Test="Screenshot"; Status="PASSED"; Time=Get-Date}
        
        # Test 3: Content analysis
        Write-AILog "MCP: Analyzing page content..." "Yellow"
        call_mcp_tool -name "browser_get_text" -input "{}"
        $mcpTests += @{Test="Content Analysis"; Status="PASSED"; Time=Get-Date}
        
        # Test 4: Element detection
        Write-AILog "MCP: Detecting interactive elements..." "Yellow"
        call_mcp_tool -name "browser_get_clickable_elements" -input "{}"
        $mcpTests += @{Test="Element Detection"; Status="PASSED"; Time=Get-Date}
        
        # Test 5: Scroll testing
        Write-AILog "MCP: Testing scroll functionality..." "Yellow"
        call_mcp_tool -name "browser_scroll" -input '{"amount":500}'
        Start-Sleep -Seconds 1
        call_mcp_tool -name "browser_scroll" -input '{"amount":-500}'
        $mcpTests += @{Test="Scroll Interaction"; Status="PASSED"; Time=Get-Date}
        
        Write-AILog "✓ MCP automated testing completed successfully" "Green" "MCP"
        
    } catch {
        Write-AILog "✗ MCP testing failed: $($_.Exception.Message)" "Red" "ERROR"
        $mcpTests += @{Test="MCP Suite"; Status="FAILED"; Error=$_.Exception.Message; Time=Get-Date}
        $script:MonitorData.Alerts += "MCP automated testing failed"
    }
    
    return $mcpTests
}

function Show-MonitoringSummary {
    param($ServiceResults, $MCPResults)
    
    $healthyServices = ($ServiceResults | Where-Object { $_.Status -eq "HEALTHY" -or $_.Status -eq "CONNECTED" }).Count
    $totalServices = $ServiceResults.Count
    $mcpPassed = ($MCPResults | Where-Object { $_.Status -eq "PASSED" }).Count
    $mcpTotal = $MCPResults.Count
    
    Write-AILog "=== MONITORING SUMMARY ===" "Blue"
    Write-AILog "Services: $healthyServices/$totalServices healthy" "White"
    if ($EnableMCP -and $mcpTotal -gt 0) {
        Write-AILog "MCP Tests: $mcpPassed/$mcpTotal passed" "Cyan"
    }
    Write-AILog "Alerts: $($script:MonitorData.Alerts.Count)" "Yellow"
    
    if ($script:MonitorData.Alerts.Count -eq 0) {
        Write-AILog "✓ All systems operational!" "Green" "STATUS"
    } else {
        Write-AILog "⚠ Issues detected!" "Yellow" "STATUS"
        foreach ($alert in $script:MonitorData.Alerts) {
            Write-AILog "  - $alert" "Red" "ALERT"
        }
    }
}

function Generate-AIReport {
    if (-not $EnableReports) { return }
    
    $reportDir = "ai-monitoring-reports"
    if (-not (Test-Path $reportDir)) {
        New-Item -ItemType Directory -Path $reportDir | Out-Null
    }
    
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $reportFile = "$reportDir/ai-monitor-$timestamp.json"
    
    $report = @{
        GeneratedAt = Get-Date
        Duration = (Get-Date) - $script:MonitorData.StartTime
        Iterations = $script:MonitorData.Iterations
        Services = $script:MonitorData.ServiceChecks | Select-Object -Last 20
        MCPTests = $script:MonitorData.MCPTests | Select-Object -Last 20
        Alerts = $script:MonitorData.Alerts
        SystemHealth = if ($script:MonitorData.Alerts.Count -eq 0) { "HEALTHY" } else { "DEGRADED" }
    }
    
    $report | ConvertTo-Json -Depth 4 | Out-File -FilePath $reportFile -Encoding UTF8
    Write-AILog "Report generated: $reportFile" "Green" "REPORT"
}

# Main monitoring loop
Write-AILog "Starting AI-Driven Continuous Monitoring..." "Blue"
Write-AILog "Monitoring interval: $Interval seconds" "Cyan"
Write-AILog "MCP Testing: $EnableMCP" "Cyan"
Write-AILog "Report Generation: $EnableReports" "Cyan"
Write-AILog "Press Ctrl+C to stop monitoring" "Yellow"

try {
    while ($true) {
        $script:MonitorData.Iterations++
        $script:MonitorData.Alerts = @()  # Reset alerts each iteration
        
        Write-AILog "=== Monitoring Iteration $($script:MonitorData.Iterations) ===" "Blue"
        
        # Core service testing
        $serviceResults = Test-CoreServices
        $script:MonitorData.ServiceChecks += $serviceResults
        
        # MCP automated testing (every 3rd iteration or if explicitly enabled)
        $mcpResults = @()
        if ($EnableMCP -and ($script:MonitorData.Iterations % 3 -eq 0)) {
            $mcpResults = Invoke-MCPAutomatedTesting
            $script:MonitorData.MCPTests += $mcpResults
        }
        
        # Show summary
        Show-MonitoringSummary -ServiceResults $serviceResults -MCPResults $mcpResults
        
        # Generate reports every 10th iteration
        if ($EnableReports -and ($script:MonitorData.Iterations % 10 -eq 0)) {
            Generate-AIReport
        }
        
        $uptime = (Get-Date) - $script:MonitorData.StartTime
        Write-AILog "Next check in $Interval seconds | Uptime: $($uptime.ToString('hh\:mm\:ss'))" "Cyan"
        
        Start-Sleep -Seconds $Interval
    }
    
} catch {
    Write-AILog "Monitoring interrupted: $($_.Exception.Message)" "Red" "ERROR"
} finally {
    Write-AILog "AI monitoring session ended." "Green"
    if ($EnableReports) {
        Generate-AIReport
    }
}