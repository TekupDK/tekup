#!/usr/bin/env pwsh

param(
    [string]$Service = "",
    [string]$Port = "",
    [switch]$All,
    [switch]$Json,
    [switch]$Watch,
    [int]$Interval = 5
)

# Set console encoding to handle Unicode properly
$OutputEncoding = [Console]::OutputEncoding = [Text.Encoding]::UTF8

# Health check configuration
$script:healthConfig = @{
    timeout = 5
    retries = 2
    endpoints = @{
        "tekup-unified-platform" = @{
            path = "/health"
            method = "GET"
            expected = 200
        }
        "agentscope-enhanced" = @{
            path = "/api/health"
            method = "GET"
            expected = 200
        }
        "lead-platform" = @{
            path = "/api/v1/health"
            method = "GET"
            expected = 200
        }
        "flow-api" = @{
            path = "/api/health"
            method = "GET"
            expected = 200
        }
        "voice-agent" = @{
            path = "/health"
            method = "GET"
            expected = 200
        }
        "postgres" = @{
            type = "tcp"
            timeout = 3
        }
        "redis" = @{
            type = "tcp"
            timeout = 3
        }
        "flow-web" = @{
            path = "/"
            method = "GET"
            expected = 200
        }
        "tekup-crm-web" = @{
            path = "/"
            method = "GET"
            expected = 200
        }
        "website" = @{
            path = "/"
            method = "GET"
            expected = 200
        }
    }
}

function Get-PortRegistry {
    $registryPath = "config/ports/registry.yaml"
    
    if (!(Test-Path $registryPath)) {
        Write-Error "Port registry not found at $registryPath"
        return @{}
    }
    
    try {
        $content = Get-Content $registryPath -Raw -Encoding UTF8
        $data = ConvertFrom-Yaml $content
        
        # Transform into simpler format for health checks
        $services = @{}
        foreach ($service in $data.services.Keys) {
            $serviceConfig = $data.services[$service]
            
            # Skip services without development port
            if (-not $serviceConfig.environments -or -not $serviceConfig.environments.development) {
                continue
            }
            
            $services[$service] = @{
                development = $serviceConfig.environments.development
                category = $serviceConfig.category
                health = $serviceConfig.health_endpoint
                protocol = $serviceConfig.protocol
                dependencies = $serviceConfig.dependencies
            }
        }
        
        return $services
    } catch {
        Write-Error "Failed to parse port registry: $($_.Exception.Message)"
        return @{}
    }
}

function Test-TcpConnection {
    param(
        [string]$HostName = "localhost",
        [int]$Port,
        [int]$Timeout = 5
    )
    
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $task = $tcpClient.ConnectAsync($HostName, $Port)
        
        if ($task.Wait($Timeout * 1000)) {
            $tcpClient.Close()
            return $true
        } else {
            return $false
        }
    } catch {
        return $false
    } finally {
        if ($tcpClient) {
            $tcpClient.Dispose()
        }
    }
}

function Test-HttpEndpoint {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [int]$ExpectedStatus = 200,
        [int]$Timeout = 5
    )
    
    try {
        $request = [System.Net.HttpWebRequest]::Create($Url)
        $request.Method = $Method
        $request.Timeout = $Timeout * 1000
        $request.UserAgent = "TekUp-HealthCheck/1.0"
        
        $response = $request.GetResponse()
        $statusCode = [int]$response.StatusCode
        $response.Close()
        
        return @{
            success = ($statusCode -eq $ExpectedStatus)
            status = $statusCode
            expected = $ExpectedStatus
        }
    } catch [System.Net.WebException] {
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            return @{
                success = ($statusCode -eq $ExpectedStatus)
                status = $statusCode
                expected = $ExpectedStatus
                error = $_.Exception.Message
            }
        } else {
            return @{
                success = $false
                status = 0
                expected = $ExpectedStatus
                error = $_.Exception.Message
            }
        }
    } catch {
        return @{
            success = $false
            status = 0
            expected = $ExpectedStatus
            error = $_.Exception.Message
        }
    }
}

function Get-ServiceHealth {
    param(
        [string]$ServiceName,
        [int]$Port
    )
    
    $result = @{
        service = $ServiceName
        port = $Port
        status = "Unknown"
        details = @{}
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    
    # Check if port is listening
    $portOpen = Test-TcpConnection -Port $Port
    $result.details.port_open = $portOpen
    
    if (-not $portOpen) {
        $result.status = "Down"
        $result.details.error = "Port not listening"
        return $result
    }
    
    # Check service-specific health endpoint if configured
    if ($script:healthConfig.endpoints.ContainsKey($ServiceName)) {
        $healthEndpoint = $script:healthConfig.endpoints[$ServiceName]
        
        if ($healthEndpoint.type -eq "tcp") {
            # TCP-only check (already done above)
            $result.status = "Up"
        } else {
            # HTTP health check
            $url = "http://localhost:$Port$($healthEndpoint.path)"
            $healthCheck = Test-HttpEndpoint -Url $url -Method $healthEndpoint.method -ExpectedStatus $healthEndpoint.expected
            
            $result.details.http_check = $healthCheck
            
            if ($healthCheck.success) {
                $result.status = "Healthy"
            } else {
                $result.status = "Unhealthy"
                $result.details.http_error = $healthCheck.error
            }
        }
    } else {
        # Default: port is open means service is up
        $result.status = "Up"
    }
    
    return $result
}

function Get-AllServicesHealth {
    $registry = Get-PortRegistry
    $results = @()
    
    foreach ($serviceName in $registry.Keys) {
        $serviceConfig = $registry[$serviceName]
        $port = $serviceConfig.development
        
        if ($port) {
            $health = Get-ServiceHealth -ServiceName $serviceName -Port $port
            $results += $health
        }
    }
    
    return $results
}

function Format-HealthOutput {
    param(
        [array]$HealthResults,
        [switch]$Json
    )
    
    if ($Json) {
        return $HealthResults | ConvertTo-Json -Depth 4
    }
    
    Write-Host "`n[TekUp Health] Service Health Status - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
    Write-Host "=" * 70 -ForegroundColor Cyan
    
    $summary = @{
        healthy = 0
        unhealthy = 0
        down = 0
        up = 0
        unknown = 0
    }
    
    foreach ($result in $HealthResults) {
        $statusColor = switch ($result.status) {
            "Healthy" { "Green"; $summary.healthy++ }
            "Up" { "Yellow"; $summary.up++ }
            "Unhealthy" { "Red"; $summary.unhealthy++ }
            "Down" { "Red"; $summary.down++ }
            default { "Gray"; $summary.unknown++ }
        }
        
        $statusIcon = switch ($result.status) {
            "Healthy" { "[OK]" }
            "Up" { "[UP]" }
            "Unhealthy" { "[WARN]" }
            "Down" { "[DOWN]" }
            default { "[?]" }
        }
        
        Write-Host "`n$statusIcon $($result.service)" -ForegroundColor $statusColor -NoNewline
        Write-Host " (Port: $($result.port))" -ForegroundColor Gray
        Write-Host "  Status: $($result.status)" -ForegroundColor $statusColor
        
        if ($result.details.http_check) {
            $httpCheck = $result.details.http_check
            Write-Host "  HTTP: $($httpCheck.status)/$($httpCheck.expected)" -ForegroundColor Gray
        }
        
        if ($result.details.error) {
            Write-Host "  Error: $($result.details.error)" -ForegroundColor Red
        }
        
        if ($result.details.http_error) {
            Write-Host "  HTTP Error: $($result.details.http_error)" -ForegroundColor Red
        }
    }
    
    Write-Host "`nSummary:" -ForegroundColor Cyan
    Write-Host "  Healthy: $($summary.healthy)" -ForegroundColor Green
    Write-Host "  Up: $($summary.up)" -ForegroundColor Yellow
    Write-Host "  Unhealthy: $($summary.unhealthy)" -ForegroundColor Red
    Write-Host "  Down: $($summary.down)" -ForegroundColor Red
    Write-Host "  Unknown: $($summary.unknown)" -ForegroundColor Gray
}

function Start-HealthWatch {
    param(
        [int]$Interval = 5,
        [switch]$Json
    )
    
    Write-Host "[TekUp Health] Starting continuous health monitoring (Interval: $Interval seconds)" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop..." -ForegroundColor Yellow
    
    try {
        while ($true) {
            if (-not $Json) {
                Clear-Host
            }
            
            $results = Get-AllServicesHealth
            Format-HealthOutput -HealthResults $results -Json:$Json
            
            if (-not $Json) {
                Write-Host "`nNext check in $Interval seconds..." -ForegroundColor Gray
            }
            
            Start-Sleep -Seconds $Interval
        }
    } catch [System.Management.Automation.PipelineStoppedException] {
        Write-Host "`n[TekUp Health] Health monitoring stopped." -ForegroundColor Yellow
    }
}

# YAML parsing function (simple implementation)
function ConvertFrom-Yaml {
    param([string]$Content)
    
    $result = @{}
    $lines = ($Content -replace '\r', '') -split "`n"
    $stack = @()
    $current = $result
    $currentIndent = 0
    $inArray = $false
    
    foreach ($line in $lines) {
        if ($line -match '^\s*$' -or $line -match '^\s*#') { continue }
        
        $indent = $line -match '^(\s*)' | Out-Null
        $indent = $matches[1].Length
        $line = $line.TrimStart()
        
        # Pop stack if we're moving back in indentation
        while ($stack.Count -gt 0 -and $indent -le $currentIndent) {
            $current = $stack[-1]
            $stack = $stack[0..($stack.Count - 2)]
            $currentIndent -= 2
        }
        
        if ($line -match '^([\w-]+):\s*$') {
            # New section
            $key = $matches[1]
            $newSection = @{}
            $current[$key] = $newSection
            $stack += $current
            $current = $newSection
            $currentIndent = $indent
        }
        elseif ($line -match '^([\w-]+):\s*\[(.*)\]\s*$') {
            # Array on single line
            $key = $matches[1]
            $values = $matches[2] -split ',\s*' | ForEach-Object { $_.Trim('"') }
            $current[$key] = $values
        }
        elseif ($line -match '^([\w-]+):\s*(.+)$') {
            # Key-value pair
            $key = $matches[1]
            $value = $matches[2]
            
            # Convert value types
            if ($value -match '^\d+$') {
                $value = [int]$value
            }
            elseif ($value -match '^"(.*)"$') {
                $value = $matches[1]
            }
            elseif ($value -match '^true$') {
                $value = $true
            }
            elseif ($value -match '^false$') {
                $value = $false
            }
            
            $current[$key] = $value
        }
    }
    
    return $result
}

# Main execution
if ($All) {
    $results = Get-AllServicesHealth
    Format-HealthOutput -HealthResults $results -Json:$Json
} elseif ($Watch) {
    Start-HealthWatch -Interval $Interval -Json:$Json
} elseif ($Service -and $Port) {
    $result = Get-ServiceHealth -ServiceName $Service -Port ([int]$Port)
    Format-HealthOutput -HealthResults @($result) -Json:$Json
} elseif ($Service) {
    $registry = Get-PortRegistry
    if ($registry.ContainsKey($Service)) {
        $serviceConfig = $registry[$Service]
        $port = $serviceConfig.development
        if ($port) {
            $result = Get-ServiceHealth -ServiceName $Service -Port $port
            Format-HealthOutput -HealthResults @($result) -Json:$Json
        } else {
            Write-Error "No development port configured for service: $Service"
        }
    } else {
        Write-Error "Service not found in registry: $Service"
    }
} elseif ($Port) {
    $result = Get-ServiceHealth -ServiceName "Unknown" -Port ([int]$Port)
    Format-HealthOutput -HealthResults @($result) -Json:$Json
} else {
    Write-Host "TekUp Port Health Checker" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\port-health-check.ps1 -All                    # Check all services"
    Write-Host "  .\port-health-check.ps1 -Service <name>        # Check specific service"
    Write-Host "  .\port-health-check.ps1 -Port <number>         # Check specific port"
    Write-Host "  .\port-health-check.ps1 -Watch                 # Continuous monitoring"
    Write-Host "  .\port-health-check.ps1 -All -Json             # JSON output"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Interval <seconds>   Interval for watch mode (default: 5)"
    Write-Host "  -Json                 Output results as JSON"
}