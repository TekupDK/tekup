# Tekup Port Manager CLI Tool
# Automated port allocation and management for Tekup services
# Version: 1.0.0

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("list", "allocate", "deallocate", "check", "health", "conflicts", "migrate", "init", "status", "generate")]
    [string]$Command,
    
    [Parameter(Mandatory=$false)]
    [string]$Service = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Port = "",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("development", "staging", "production", "testing")]
    [string]$Environment = "development",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("frontend_apps", "backend_apis", "databases", "monitoring", "dev_tools", "mcp_services")]
    [string]$Category = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$Force,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFormat = "table" # table, json, yaml
)

# Configuration
$ConfigPath = "config/ports/registry.yaml"
$LogPath = "logs/port-manager.log"
$LockFile = "temp/port-manager.lock"

# Colors for output
$Colors = @{
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Info = "Blue"
    Header = "Cyan"
}

function Write-Log {
    param($Message, $Level = "INFO", $Color = "White")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] [$Level] $Message"
    
    # Console output
    Write-Host "[TekUp Port] $Message" -ForegroundColor $Color
    
    # File logging
    if (!(Test-Path (Split-Path $LogPath -Parent))) {
        New-Item -ItemType Directory -Path (Split-Path $LogPath -Parent) -Force | Out-Null
    }
    Add-Content -Path $LogPath -Value $LogMessage
}

function Get-PortConfig {
    if (!(Test-Path $ConfigPath)) {
        Write-Log "Port registry not found at $ConfigPath" "ERROR" $Colors.Error
        return $null
    }
    
    try {
        # Simple YAML parser for PowerShell (basic implementation)
        $content = Get-Content $ConfigPath -Raw
        # This is a simplified parser - in production, use a proper YAML library
        return @{ content = $content }
    }
    catch {
        Write-Log "Failed to parse port registry: $($_.Exception.Message)" "ERROR" $Colors.Error
        return $null
    }
}

function Test-PortAvailable {
    param([int]$Port)
    
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
        return -not $connection
    }
    catch {
        return $true
    }
}

function Get-ServicePorts {
    param([string]$ServiceName = "")
    
    # Hardcoded service mapping (in production, parse from YAML)
    $ServicePorts = @{
        "tekup-unified-platform" = @{
            development = 8000
            staging = 18000
            production = 28000
            testing = 38000
            category = "backend_apis"
            health = "/health"
        }
        "tekup-crm-web" = @{
            development = 3005
            staging = 13005
            production = 23005
            testing = 33005
            category = "frontend_apps"
        }
        "flow-api" = @{
            development = 8001
            staging = 18001
            production = 28001
            testing = 38001
            category = "backend_apis"
            health = "/api/health"
        }
        "flow-web" = @{
            development = 3001
            staging = 13001
            production = 23001
            testing = 33001
            category = "frontend_apps"
        }
        "voice-agent" = @{
            development = 8002
            staging = 18002
            production = 28002
            testing = 38002
            category = "backend_apis"
            health = "/health"
        }
        "lead-platform" = @{
            development = 8003
            staging = 18003
            production = 28003
            testing = 38003
            category = "backend_apis"
            health = "/health"
        }
        "agentscope-enhanced" = @{
            development = 8004
            staging = 18004
            production = 28004
            testing = 38004
            category = "backend_apis"
            health = "/health"
        }
        "website" = @{
            development = 3080
            staging = 13080
            production = 23080
            testing = 33080
            category = "frontend_apps"
        }
        "postgres" = @{
            development = 5432
            staging = 5433
            production = 5434
            testing = 5435
            category = "databases"
        }
        "redis" = @{
            development = 6379
            staging = 6380
            production = 6381
            testing = 6382
            category = "databases"
        }
        "prometheus" = @{
            all = 9090
            category = "monitoring"
            health = "/-/healthy"
        }
        "grafana" = @{
            all = 9091
            category = "monitoring"
            health = "/api/health"
        }
    }
    
    if ($ServiceName -and $ServicePorts.ContainsKey($ServiceName)) {
        return $ServicePorts[$ServiceName]
    }
    
    return $ServicePorts
}

function Show-PortList {
    Write-Log "📊 TekUp Port Registry - Environment: $Environment" "INFO" $Colors.Header
    Write-Host ""
    
    $services = Get-ServicePorts
    $table = @()
    
    foreach ($serviceName in $services.Keys) {
        $serviceConfig = $services[$serviceName]
        
        if ($serviceConfig.ContainsKey($Environment)) {
            $port = $serviceConfig[$Environment]
        }
        elseif ($serviceConfig.ContainsKey("all")) {
            $port = $serviceConfig["all"]
        }
        else {
            $port = "N/A"
        }
        
        $available = if ($port -ne "N/A") { Test-PortAvailable -Port $port } else { $null }
        $status = if ($available -eq $true) { "🟢 Available" } elseif ($available -eq $false) { "🔴 In Use" } else { "❓ Unknown" }
        
        $table += [PSCustomObject]@{
            Service = $serviceName
            Port = $port
            Category = $serviceConfig.category
            Status = $status
            Health = if ($serviceConfig.ContainsKey("health")) { $serviceConfig.health } else { "N/A" }
        }
    }
    
    $table | Sort-Object Category, Service | Format-Table -AutoSize
}

function Test-PortHealth {
    param([string]$ServiceName)
    
    $services = Get-ServicePorts
    
    if ($ServiceName -and $services.ContainsKey($ServiceName)) {
        $serviceConfig = $services[$ServiceName]
        
        if ($serviceConfig.ContainsKey($Environment)) {
            $port = $serviceConfig[$Environment]
        }
        elseif ($serviceConfig.ContainsKey("all")) {
            $port = $serviceConfig["all"]
        }
        else {
            Write-Log "Port not configured for service $ServiceName in environment $Environment" "ERROR" $Colors.Error
            return
        }
        
        if ($serviceConfig.ContainsKey("health")) {
            $healthEndpoint = $serviceConfig["health"]
            $url = "http://localhost:$port$healthEndpoint"
            
            try {
                $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 5
                if ($response.StatusCode -eq 200) {
                    Write-Log "✅ $ServiceName health check passed (Port: $port)" "SUCCESS" $Colors.Success
                }
                else {
                    Write-Log "⚠️ $ServiceName health check returned status $($response.StatusCode) (Port: $port)" "WARNING" $Colors.Warning
                }
            }
            catch {
                Write-Log "❌ $ServiceName health check failed: $($_.Exception.Message) (Port: $port)" "ERROR" $Colors.Error
            }
        }
        else {
            Write-Log "ℹ️ No health endpoint configured for $ServiceName" "INFO" $Colors.Info
        }
    }
    else {
        # Test all services
        Write-Log "🏥 Running health checks for all services in environment: $Environment" "INFO" $Colors.Header
        Write-Host ""
        
        foreach ($serviceName in $services.Keys) {
            Test-PortHealth -ServiceName $serviceName
        }
    }
}

function Find-PortConflicts {
    Write-Log "🔍 Scanning for port conflicts in environment: $Environment" "INFO" $Colors.Header
    Write-Host ""
    
    $services = Get-ServicePorts
    $portUsage = @{}
    $conflicts = @()
    
    foreach ($serviceName in $services.Keys) {
        $serviceConfig = $services[$serviceName]
        
        if ($serviceConfig.ContainsKey($Environment)) {
            $port = $serviceConfig[$Environment]
        }
        elseif ($serviceConfig.ContainsKey("all")) {
            $port = $serviceConfig["all"]
        }
        else {
            continue
        }
        
        if ($portUsage.ContainsKey($port)) {
            $conflicts += [PSCustomObject]@{
                Port = $port
                Services = "$($portUsage[$port]), $serviceName"
            }
            $portUsage[$port] = "$($portUsage[$port]), $serviceName"
        }
        else {
            $portUsage[$port] = $serviceName
        }
    }
    
    if ($conflicts.Count -eq 0) {
        Write-Log "✅ No port conflicts found!" "SUCCESS" $Colors.Success
    }
    else {
        Write-Log "⚠️ Found $($conflicts.Count) port conflicts:" "WARNING" $Colors.Warning
        $conflicts | Format-Table -AutoSize
    }
}

function Get-NextAvailablePort {
    param(
        [string]$Category,
        [int]$StartPort = 0
    )
    
    $ranges = @{
        "frontend_apps" = @{ start = 3000; end = 3999 }
        "backend_apis" = @{ start = 8000; end = 8999 }
        "databases" = @{ start = 5432; end = 5499 }
        "monitoring" = @{ start = 9000; end = 9999 }
        "dev_tools" = @{ start = 4000; end = 4999 }
        "mcp_services" = @{ start = 13000; end = 13999 }
    }
    
    if (!$ranges.ContainsKey($Category)) {
        Write-Log "Unknown category: $Category" "ERROR" $Colors.Error
        return $null
    }
    
    $range = $ranges[$Category]
    $searchStart = if ($StartPort -gt 0) { $StartPort } else { $range.start }
    
    for ($port = $searchStart; $port -le $range.end; $port++) {
        if (Test-PortAvailable -Port $port) {
            return $port
        }
    }
    
    return $null
}

function New-ServicePort {
    param(
        [string]$ServiceName,
        [string]$Category,
        [int]$Port = 0
    )
    
    if (!$ServiceName) {
        Write-Log "Service name is required for allocation" "ERROR" $Colors.Error
        return
    }
    
    if (!$Category) {
        Write-Log "Category is required for allocation" "ERROR" $Colors.Error
        return
    }
    
    if ($Port -eq 0) {
        $Port = Get-NextAvailablePort -Category $Category
        if (!$Port) {
            Write-Log "No available ports in category $Category" "ERROR" $Colors.Error
            return
        }
    }
    else {
        if (!(Test-PortAvailable -Port $Port)) {
            if (!$Force) {
                Write-Log "Port $Port is already in use. Use -Force to override" "ERROR" $Colors.Error
                return
            }
            Write-Log "⚠️ Forcing allocation of port $Port (already in use)" "WARNING" $Colors.Warning
        }
    }
    
    Write-Log "✅ Allocated port $Port to service $ServiceName (category: $Category)" "SUCCESS" $Colors.Success
    
    # TODO: Update registry file
    Write-Log "ℹ️ Note: Registry update not implemented yet - manual update required" "INFO" $Colors.Info
}

function Initialize-PortManager {
    Write-Log "🚀 Initializing TekUp Port Manager..." "INFO" $Colors.Header
    
    # Create directories
    $dirs = @("config/ports", "logs", "temp")
    foreach ($dir in $dirs) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Log "Created directory: $dir" "SUCCESS" $Colors.Success
        }
    }
    
    # Check if registry exists
    if (!(Test-Path $ConfigPath)) {
        Write-Log "⚠️ Port registry not found at $ConfigPath" "WARNING" $Colors.Warning
        Write-Log "Please ensure the registry.yaml file is created" "INFO" $Colors.Info
    }
    else {
        Write-Log "✅ Port registry found" "SUCCESS" $Colors.Success
    }
    
    Write-Log "✅ TekUp Port Manager initialized" "SUCCESS" $Colors.Success
}

function Show-PortStatus {
    Write-Log "📈 TekUp Port Manager Status" "INFO" $Colors.Header
    Write-Host ""
    
    # System info
    Write-Host "Environment: $Environment" -ForegroundColor $Colors.Info
    Write-Host "Registry: $ConfigPath" -ForegroundColor $Colors.Info
    Write-Host "Log File: $LogPath" -ForegroundColor $Colors.Info
    Write-Host ""
    
    # Port usage summary
    $services = Get-ServicePorts
    $totalServices = $services.Count
    $activeServices = 0
    
    foreach ($serviceName in $services.Keys) {
        $serviceConfig = $services[$serviceName]
        if ($serviceConfig.ContainsKey($Environment) -or $serviceConfig.ContainsKey("all")) {
            $port = if ($serviceConfig.ContainsKey($Environment)) { $serviceConfig[$Environment] } else { $serviceConfig["all"] }
            if (!(Test-PortAvailable -Port $port)) {
                $activeServices++
            }
        }
    }
    
    Write-Host "📊 Service Summary:" -ForegroundColor $Colors.Header
    Write-Host "  Total Services: $totalServices" -ForegroundColor $Colors.Info
    Write-Host "  Active Services: $activeServices" -ForegroundColor $Colors.Success
    Write-Host "  Inactive Services: $($totalServices - $activeServices)" -ForegroundColor $Colors.Warning
    Write-Host ""
}

function Generate-DockerCompose {
    Write-Log "🐳 Generating Docker Compose with port registry..." "INFO" $Colors.Header
    
    $services = Get-ServicePorts
    $composeServices = @()
    
    foreach ($serviceName in $services.Keys) {
        $serviceConfig = $services[$serviceName]
        if ($serviceConfig.category -in @("frontend_apps", "backend_apis")) {
            $port = if ($serviceConfig.ContainsKey($Environment)) { $serviceConfig[$Environment] } else { "3000" }
            $composeServices += "  $serviceName:`n    ports:`n      - `"$port:$port`""
        }
    }
    
    $composeContent = @"
version: '3.8'
services:
$($composeServices -join "`n")
"@
    
    $outputPath = "docker-compose.generated.yml"
    Set-Content -Path $outputPath -Value $composeContent
    Write-Log "✅ Generated Docker Compose file: $outputPath" "SUCCESS" $Colors.Success
}

# Main command execution
switch ($Command.ToLower()) {
    "init" { Initialize-PortManager }
    "list" { Show-PortList }
    "status" { Show-PortStatus }
    "health" { Test-PortHealth -ServiceName $Service }
    "conflicts" { Find-PortConflicts }
    "allocate" { New-ServicePort -ServiceName $Service -Category $Category -Port $Port }
    "check" { 
        if ($Port) {
            $available = Test-PortAvailable -Port $Port
            if ($available) {
                Write-Log "✅ Port $Port is available" "SUCCESS" $Colors.Success
            }
            else {
                Write-Log "❌ Port $Port is in use" "ERROR" $Colors.Error
            }
        }
        else {
            Write-Log "Port number required for check command" "ERROR" $Colors.Error
        }
    }
    "generate" { Generate-DockerCompose }
    default {
        Write-Log "Unknown command: $Command" "ERROR" $Colors.Error
        Write-Log "Available commands: init, list, status, health, conflicts, allocate, check, generate" "INFO" $Colors.Info
    }
}
