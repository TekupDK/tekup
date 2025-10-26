# TekUp Port Health Monitor
# Advanced health checking and monitoring dashboard for all services

param(
    [string]$Environment = "development",
    [switch]$Continuous,
    [int]$Interval = 30,
    [switch]$GenerateReport,
    [string]$OutputFormat = "console" # console, html, json
)

# Configuration
$ConfigPath = "config/ports/registry.yaml"
$LogPath = "logs/port-health.log"
$ReportPath = "reports/port-health-report.html"

function Write-HealthLog {
    param($Message, $Level = "INFO", $Service = "", $Port = "")
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Service`:$Port - $Message"
    
    # Console output with colors
    $Color = switch ($Level) {
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR" { "Red" }
        "INFO" { "Cyan" }
        default { "White" }
    }
    
    Write-Host "[Health] $Message" -ForegroundColor $Color
    
    # File logging
    if (!(Test-Path (Split-Path $LogPath -Parent))) {
        New-Item -ItemType Directory -Path (Split-Path $LogPath -Parent) -Force | Out-Null
    }
    Add-Content -Path $LogPath -Value $LogEntry
}

function Get-ServiceConfiguration {
    # Enhanced service configuration with health endpoints
    return @{
        "tekup-unified-platform" = @{
            development = 8000; staging = 18000; production = 28000
            category = "backend_apis"
            health = "/health"
            timeout = 10
            expected_status = 200
            critical = $true
        }
        "tekup-crm-web" = @{
            development = 3005; staging = 13005; production = 23005
            category = "frontend_apps"
            health = "/"
            timeout = 5
            expected_status = 200
            critical = $true
        }
        "flow-api" = @{
            development = 8001; staging = 18001; production = 28001
            category = "backend_apis"
            health = "/api/health"
            timeout = 10
            expected_status = 200
            critical = $true
        }
        "flow-web" = @{
            development = 3001; staging = 13001; production = 23001
            category = "frontend_apps"
            health = "/"
            timeout = 5
            expected_status = 200
            critical = $false
        }
        "voice-agent" = @{
            development = 8002; staging = 18002; production = 28002
            category = "backend_apis"
            health = "/health"
            timeout = 10
            expected_status = 200
            critical = $false
        }
        "lead-platform" = @{
            development = 8003; staging = 18003; production = 28003
            category = "backend_apis"
            health = "/health"
            timeout = 10
            expected_status = 200
            critical = $false
        }
        "agentscope-enhanced" = @{
            development = 8004; staging = 18004; production = 28004
            category = "backend_apis"
            health = "/health"
            timeout = 15
            expected_status = 200
            critical = $true
        }
        "website" = @{
            development = 3080; staging = 13080; production = 23080
            category = "frontend_apps"
            health = "/"
            timeout = 5
            expected_status = 200
            critical = $false
        }
        "postgres" = @{
            development = 5432; staging = 5433; production = 5434
            category = "databases"
            timeout = 5
            critical = $true
        }
        "redis" = @{
            development = 6379; staging = 6380; production = 6381
            category = "databases"
            timeout = 5
            critical = $true
        }
        "prometheus" = @{
            all = 9090
            category = "monitoring"
            health = "/-/healthy"
            timeout = 5
            expected_status = 200
            critical = $false
        }
        "grafana" = @{
            all = 9091
            category = "monitoring"
            health = "/api/health"
            timeout = 5
            expected_status = 200
            critical = $false
        }
    }
}

function Test-ServiceHealth {
    param(
        [string]$ServiceName,
        [hashtable]$ServiceConfig,
        [string]$Environment
    )
    
    $result = @{
        service = $ServiceName
        port = 0
        status = "Unknown"
        response_time = 0
        error = ""
        critical = $ServiceConfig.critical -eq $true
        category = $ServiceConfig.category
        timestamp = Get-Date
    }
    
    # Get port for environment
    if ($ServiceConfig.ContainsKey($Environment)) {
        $port = $ServiceConfig[$Environment]
    } elseif ($ServiceConfig.ContainsKey("all")) {
        $port = $ServiceConfig["all"]
    } else {
        $result.status = "Not Configured"
        $result.error = "No port configured for environment $Environment"
        return $result
    }
    
    $result.port = $port
    
    # Test port availability first
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
        if (-not $connection) {
            $result.status = "Port Closed"
            $result.error = "Port $port is not accessible"
            return $result
        }
    } catch {
        $result.status = "Port Error"
        $result.error = "Error testing port: $($_.Exception.Message)"
        return $result
    }
    
    # Test health endpoint if available
    if ($ServiceConfig.ContainsKey("health")) {
        $healthEndpoint = $ServiceConfig["health"]
        $timeout = if ($ServiceConfig.ContainsKey("timeout")) { $ServiceConfig["timeout"] } else { 10 }
        $expectedStatus = if ($ServiceConfig.ContainsKey("expected_status")) { $ServiceConfig["expected_status"] } else { 200 }
        
        $url = "http://localhost:$port$healthEndpoint"
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        
        try {
            $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec $timeout -UseBasicParsing
            $stopwatch.Stop()
            $result.response_time = $stopwatch.ElapsedMilliseconds
            
            if ($response.StatusCode -eq $expectedStatus) {
                $result.status = "Healthy"
            } else {
                $result.status = "Unhealthy"
                $result.error = "Unexpected status code: $($response.StatusCode)"
            }
        } catch {
            $stopwatch.Stop()
            $result.response_time = $stopwatch.ElapsedMilliseconds
            $result.status = "Error"
            $result.error = $_.Exception.Message
        }
    } else {
        # For services without health endpoints, port accessibility means healthy
        $result.status = "Port Open"
    }
    
    return $result
}

function Show-HealthDashboard {
    param([array]$HealthResults)
    
    Clear-Host
    Write-Host "=" * 80 -ForegroundColor Cyan
    Write-Host "🏥 TekUp Port Health Monitor Dashboard" -ForegroundColor Cyan
    Write-Host "Environment: $Environment | $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Blue
    Write-Host "=" * 80 -ForegroundColor Cyan
    Write-Host ""
    
    # Summary statistics
    $total = $HealthResults.Count
    $healthy = ($HealthResults | Where-Object { $_.status -eq "Healthy" -or $_.status -eq "Port Open" }).Count
    $unhealthy = ($HealthResults | Where-Object { $_.status -eq "Unhealthy" -or $_.status -eq "Error" -or $_.status -eq "Port Closed" }).Count
    $critical = ($HealthResults | Where-Object { $_.critical -eq $true -and ($_.status -eq "Unhealthy" -or $_.status -eq "Error" -or $_.status -eq "Port Closed") }).Count
    
    Write-Host "📊 Health Summary" -ForegroundColor Yellow
    Write-Host "  Total Services: $total" -ForegroundColor White
    Write-Host "  Healthy: $healthy" -ForegroundColor Green
    Write-Host "  Unhealthy: $unhealthy" -ForegroundColor Red
    Write-Host "  Critical Issues: $critical" -ForegroundColor Red
    Write-Host ""
    
    # Group by category
    $categories = $HealthResults | Group-Object category | Sort-Object Name
    
    foreach ($category in $categories) {
        $categoryName = $category.Name
        Write-Host "🏷️ $($categoryName.ToUpper())" -ForegroundColor Magenta
        Write-Host ("-" * 60) -ForegroundColor Gray
        
        $categoryServices = $category.Group | Sort-Object service
        foreach ($service in $categoryServices) {
            $statusIcon = switch ($service.status) {
                "Healthy" { "✅" }
                "Port Open" { "🟢" }
                "Unhealthy" { "⚠️" }
                "Error" { "❌" }
                "Port Closed" { "🔴" }
                "Not Configured" { "❓" }
                default { "⚪" }
            }
            
            $criticalMark = if ($service.critical) { " [CRITICAL]" } else { "" }
            $responseTime = if ($service.response_time -gt 0) { " ($($service.response_time)ms)" } else { "" }
            
            $statusColor = switch ($service.status) {
                "Healthy" { "Green" }
                "Port Open" { "Green" }
                "Unhealthy" { "Yellow" }
                "Error" { "Red" }
                "Port Closed" { "Red" }
                "Not Configured" { "Gray" }
                default { "White" }
            }
            
            Write-Host "  $statusIcon " -NoNewline
            Write-Host "$($service.service):$($service.port)" -ForegroundColor White -NoNewline
            Write-Host "$responseTime" -ForegroundColor Gray -NoNewline
            Write-Host " - " -NoNewline
            Write-Host "$($service.status)" -ForegroundColor $statusColor -NoNewline
            Write-Host "$criticalMark" -ForegroundColor Red
            
            if ($service.error -ne "") {
                Write-Host "    Error: $($service.error)" -ForegroundColor Red
            }
        }
        Write-Host ""
    }
    
    # Show alerts for critical services
    $criticalIssues = $HealthResults | Where-Object { $_.critical -eq $true -and ($_.status -eq "Unhealthy" -or $_.status -eq "Error" -or $_.status -eq "Port Closed") }
    if ($criticalIssues.Count -gt 0) {
        Write-Host "🚨 CRITICAL ALERTS" -ForegroundColor Red -BackgroundColor Yellow
        Write-Host ("-" * 60) -ForegroundColor Red
        foreach ($issue in $criticalIssues) {
            Write-Host "  ❌ $($issue.service):$($issue.port) - $($issue.status)" -ForegroundColor Red
            if ($issue.error -ne "") {
                Write-Host "     $($issue.error)" -ForegroundColor Red
            }
        }
        Write-Host ""
    }
}

function Generate-HTMLReport {
    param([array]$HealthResults)
    
    if (!(Test-Path (Split-Path $ReportPath -Parent))) {
        New-Item -ItemType Directory -Path (Split-Path $ReportPath -Parent) -Force | Out-Null
    }
    
    $html = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TekUp Port Health Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .header { background: #2d3748; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
        .metric { background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .healthy { color: #38a169; }
        .unhealthy { color: #e53e3e; }
        .warning { color: #d69e2e; }
        .category { background: white; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .category-header { background: #4a5568; color: white; padding: 15px; border-radius: 8px 8px 0 0; font-weight: bold; }
        .service { display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; border-bottom: 1px solid #e2e8f0; }
        .service:last-child { border-bottom: none; }
        .service-name { font-weight: 500; }
        .service-status { display: flex; align-items: center; gap: 10px; }
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .status-healthy { background: #c6f6d5; color: #22543d; }
        .status-unhealthy { background: #fed7d7; color: #742a2a; }
        .status-error { background: #fed7d7; color: #742a2a; }
        .critical { border-left: 4px solid #e53e3e; }
        .alerts { background: #fed7d7; border: 1px solid #e53e3e; border-radius: 8px; padding: 15px; margin-top: 20px; }
        .timestamp { color: #718096; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏥 TekUp Port Health Report</h1>
        <div class="timestamp">Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') | Environment: $Environment</div>
    </div>
"@

    # Summary metrics
    $total = $HealthResults.Count
    $healthy = ($HealthResults | Where-Object { $_.status -eq "Healthy" -or $_.status -eq "Port Open" }).Count
    $unhealthy = ($HealthResults | Where-Object { $_.status -eq "Unhealthy" -or $_.status -eq "Error" -or $_.status -eq "Port Closed" }).Count
    $critical = ($HealthResults | Where-Object { $_.critical -eq $true -and ($_.status -eq "Unhealthy" -or $_.status -eq "Error" -or $_.status -eq "Port Closed") }).Count

    $html += @"
    <div class="summary">
        <div class="metric">
            <div class="metric-value">$total</div>
            <div>Total Services</div>
        </div>
        <div class="metric">
            <div class="metric-value healthy">$healthy</div>
            <div>Healthy</div>
        </div>
        <div class="metric">
            <div class="metric-value unhealthy">$unhealthy</div>
            <div>Unhealthy</div>
        </div>
        <div class="metric">
            <div class="metric-value unhealthy">$critical</div>
            <div>Critical Issues</div>
        </div>
    </div>
"@

    # Services by category
    $categories = $HealthResults | Group-Object category | Sort-Object Name
    
    foreach ($category in $categories) {
        $categoryName = $category.Name
        $html += @"
    <div class="category">
        <div class="category-header">$($categoryName.ToUpper())</div>
"@
        
        $categoryServices = $category.Group | Sort-Object service
        foreach ($service in $categoryServices) {
            $statusClass = switch ($service.status) {
                "Healthy" { "status-healthy" }
                "Port Open" { "status-healthy" }
                "Unhealthy" { "status-unhealthy" }
                "Error" { "status-error" }
                "Port Closed" { "status-error" }
                default { "status-unhealthy" }
            }
            
            $criticalClass = if ($service.critical) { " critical" } else { "" }
            $responseTime = if ($service.response_time -gt 0) { " ($($service.response_time)ms)" } else { "" }
            
            $html += @"
        <div class="service$criticalClass">
            <div>
                <div class="service-name">$($service.service):$($service.port)</div>
                $(if ($service.error -ne "") { "<div style='color: #e53e3e; font-size: 12px;'>$($service.error)</div>" } else { "" })
            </div>
            <div class="service-status">
                <span class="status-badge $statusClass">$($service.status)</span>
                <span style="font-size: 12px; color: #718096;">$responseTime</span>
            </div>
        </div>
"@
        }
        
        $html += "    </div>"
    }

    # Critical alerts
    $criticalIssues = $HealthResults | Where-Object { $_.critical -eq $true -and ($_.status -eq "Unhealthy" -or $_.status -eq "Error" -or $_.status -eq "Port Closed") }
    if ($criticalIssues.Count -gt 0) {
        $html += @"
    <div class="alerts">
        <h3 style="margin-top: 0; color: #742a2a;">🚨 Critical Alerts</h3>
"@
        foreach ($issue in $criticalIssues) {
            $html += "<div><strong>$($issue.service):$($issue.port)</strong> - $($issue.status)"
            if ($issue.error -ne "") {
                $html += "<br><small>$($issue.error)</small>"
            }
            $html += "</div>"
        }
        $html += "    </div>"
    }

    $html += @"
</body>
</html>
"@

    Set-Content -Path $ReportPath -Value $html
    Write-HealthLog "HTML report generated: $ReportPath" "INFO"
}

function Start-ContinuousMonitoring {
    Write-HealthLog "Starting continuous monitoring (interval: ${Interval}s)" "INFO"
    Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Yellow
    
    try {
        while ($true) {
            $services = Get-ServiceConfiguration
            $healthResults = @()
            
            foreach ($serviceName in $services.Keys) {
                $serviceConfig = $services[$serviceName]
                $result = Test-ServiceHealth -ServiceName $serviceName -ServiceConfig $serviceConfig -Environment $Environment
                $healthResults += $result
                
                # Log health status changes
                if ($result.status -eq "Error" -or $result.status -eq "Unhealthy" -or $result.status -eq "Port Closed") {
                    Write-HealthLog "Service $serviceName is $($result.status): $($result.error)" "ERROR" $serviceName $result.port
                }
            }
            
            Show-HealthDashboard -HealthResults $healthResults
            
            if ($GenerateReport) {
                Generate-HTMLReport -HealthResults $healthResults
            }
            
            Write-Host "Next check in ${Interval} seconds... (Ctrl+C to stop)" -ForegroundColor Gray
            Start-Sleep -Seconds $Interval
        }
    }
    catch {
        Write-HealthLog "Monitoring stopped" "INFO"
    }
}

# Main execution
Write-HealthLog "Starting TekUp Port Health Monitor" "INFO"

$services = Get-ServiceConfiguration
$healthResults = @()

foreach ($serviceName in $services.Keys) {
    $serviceConfig = $services[$serviceName]
    $result = Test-ServiceHealth -ServiceName $serviceName -ServiceConfig $serviceConfig -Environment $Environment
    $healthResults += $result
}

if ($Continuous) {
    Start-ContinuousMonitoring
} else {
    Show-HealthDashboard -HealthResults $healthResults
    
    if ($GenerateReport) {
        Generate-HTMLReport -HealthResults $healthResults
    }
    
    # Output JSON if requested
    if ($OutputFormat -eq "json") {
        $healthResults | ConvertTo-Json -Depth 3 | Out-File "reports/port-health.json"
        Write-HealthLog "JSON report generated: reports/port-health.json" "INFO"
    }
}