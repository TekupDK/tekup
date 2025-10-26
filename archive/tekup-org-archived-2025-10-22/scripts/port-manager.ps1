# TekUp Port Manager - Simplified Version
param(
    [Parameter(Mandatory=$true)]
    [string]$Command,
    [string]$Service = "",
    [string]$Port = "",
    [string]$Environment = "development"
)

# Configuration
$ConfigPath = "config/ports/registry.yaml"
$LogPath = "logs/port-manager.log"

function Write-Log {
    param($Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[TekUp Port] $Message" -ForegroundColor Green
    
    if (!(Test-Path (Split-Path $LogPath -Parent))) {
        New-Item -ItemType Directory -Path (Split-Path $LogPath -Parent) -Force | Out-Null
    }
    Add-Content -Path $LogPath -Value "[$Timestamp] $Message"
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
    return @{
        "tekup-unified-platform" = @{
            development = 8000; staging = 18000; production = 28000
            category = "backend_apis"; health = "/health"
        }
        "tekup-crm-web" = @{
            development = 3005; staging = 13005; production = 23005
            category = "frontend_apps"
        }
        "flow-api" = @{
            development = 8001; staging = 18001; production = 28001
            category = "backend_apis"; health = "/api/health"
        }
        "flow-web" = @{
            development = 3001; staging = 13001; production = 23001
            category = "frontend_apps"
        }
        "voice-agent" = @{
            development = 8002; staging = 18002; production = 28002
            category = "backend_apis"; health = "/health"
        }
        "lead-platform" = @{
            development = 8003; staging = 18003; production = 28003
            category = "backend_apis"; health = "/health"
        }
        "agentscope-enhanced" = @{
            development = 8004; staging = 18004; production = 28004
            category = "backend_apis"; health = "/health"
        }
        "website" = @{
            development = 3080; staging = 13080; production = 23080
            category = "frontend_apps"
        }
        "postgres" = @{
            development = 5432; staging = 5433; production = 5434
            category = "databases"
        }
        "redis" = @{
            development = 6379; staging = 6380; production = 6381
            category = "databases"
        }
    }
}

function Show-PortList {
    Write-Log "TekUp Port Registry - Environment: $Environment"
    Write-Host ""
    
    $services = Get-ServicePorts
    $table = @()
    
    foreach ($serviceName in $services.Keys) {
        $serviceConfig = $services[$serviceName]
        $port = $serviceConfig[$Environment]
        
        if ($port) {
            $available = Test-PortAvailable -Port $port
            $status = if ($available) { "Available" } else { "In Use" }
            
            $table += [PSCustomObject]@{
                Service = $serviceName
                Port = $port
                Category = $serviceConfig.category
                Status = $status
            }
        }
    }
    
    $table | Sort-Object Category, Service | Format-Table -AutoSize
}

function Test-PortHealth {
    param([string]$ServiceName)
    
    $services = Get-ServicePorts
    
    if ($ServiceName -and $services.ContainsKey($ServiceName)) {
        $serviceConfig = $services[$ServiceName]
        $port = $serviceConfig[$Environment]
        
        if ($serviceConfig.ContainsKey("health")) {
            $healthEndpoint = $serviceConfig["health"]
            $url = "http://localhost:$port$healthEndpoint"
            
            try {
                $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 5
                Write-Log "$ServiceName health check passed (Port: $port)"
            }
            catch {
                Write-Host "[TekUp Port] $ServiceName health check failed (Port: $port)" -ForegroundColor Red
            }
        }
        else {
            Write-Log "No health endpoint configured for $ServiceName"
        }
    }
    else {
        foreach ($serviceName in $services.Keys) {
            Test-PortHealth -ServiceName $serviceName
        }
    }
}

function Find-PortConflicts {
    Write-Log "Scanning for port conflicts in environment: $Environment"
    
    $services = Get-ServicePorts
    $portUsage = @{}
    $conflicts = @()
    
    foreach ($serviceName in $services.Keys) {
        $serviceConfig = $services[$serviceName]
        $port = $serviceConfig[$Environment]
        
        if ($port) {
            if ($portUsage.ContainsKey($port)) {
                $conflicts += [PSCustomObject]@{
                    Port = $port
                    Services = "$($portUsage[$port]), $serviceName"
                }
            }
            else {
                $portUsage[$port] = $serviceName
            }
        }
    }
    
    if ($conflicts.Count -eq 0) {
        Write-Log "No port conflicts found!"
    }
    else {
        Write-Host "Found $($conflicts.Count) port conflicts:" -ForegroundColor Yellow
        $conflicts | Format-Table -AutoSize
    }
}

function Initialize-PortManager {
    Write-Log "Initializing TekUp Port Manager..."
    
    $dirs = @("config/ports", "logs", "temp")
    foreach ($dir in $dirs) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Log "Created directory: $dir"
        }
    }
    
    if (!(Test-Path $ConfigPath)) {
        Write-Host "[TekUp Port] Port registry not found at $ConfigPath" -ForegroundColor Yellow
    }
    else {
        Write-Log "Port registry found"
    }
    
    Write-Log "TekUp Port Manager initialized"
}

function Show-PortStatus {
    Write-Log "TekUp Port Manager Status"
    Write-Host ""
    Write-Host "Environment: $Environment" -ForegroundColor Blue
    Write-Host "Registry: $ConfigPath" -ForegroundColor Blue
    Write-Host ""
    
    $services = Get-ServicePorts
    $totalServices = $services.Count
    $activeServices = 0
    
    foreach ($serviceName in $services.Keys) {
        $serviceConfig = $services[$serviceName]
        $port = $serviceConfig[$Environment]
        if ($port -and !(Test-PortAvailable -Port $port)) {
            $activeServices++
        }
    }
    
    Write-Host "Service Summary:" -ForegroundColor Cyan
    Write-Host "  Total Services: $totalServices" -ForegroundColor Blue
    Write-Host "  Active Services: $activeServices" -ForegroundColor Green
    Write-Host "  Inactive Services: $($totalServices - $activeServices)" -ForegroundColor Yellow
}

# Main command execution
switch ($Command.ToLower()) {
    "init" { Initialize-PortManager }
    "list" { Show-PortList }
    "status" { Show-PortStatus }
    "health" { Test-PortHealth -ServiceName $Service }
    "conflicts" { Find-PortConflicts }
    "check" { 
        if ($Port) {
            $available = Test-PortAvailable -Port ([int]$Port)
            if ($available) {
                Write-Log "Port $Port is available"
            }
            else {
                Write-Host "[TekUp Port] Port $Port is in use" -ForegroundColor Red
            }
        }
        else {
            Write-Host "[TekUp Port] Port number required for check command" -ForegroundColor Red
        }
    }
    default {
        Write-Host "[TekUp Port] Unknown command: $Command" -ForegroundColor Red
        Write-Host "[TekUp Port] Available commands: init, list, status, health, conflicts, check" -ForegroundColor Blue
    }
}