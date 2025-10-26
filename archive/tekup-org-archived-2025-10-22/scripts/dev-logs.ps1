# Tekup Development Environment Log Viewer
# PowerShell script to view logs from Docker development services

param(
    [string]$Service = "",
    [switch]$Follow,
    [switch]$Tail,
    [int]$Lines = 50,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Tekup Development Environment Log Viewer

USAGE:
  .\dev-logs.ps1 [SERVICE] [OPTIONS]

PARAMETERS:
  SERVICE      Specific service to view logs for (optional)

OPTIONS:
  -Follow      Follow log output (like tail -f)
  -Tail        Show only recent logs
  -Lines       Number of lines to show (default: 50)
  -Help        Show this help message

AVAILABLE SERVICES:
  postgres, redis, tekup-unified-platform, tekup-crm-web, 
  agentscope-enhanced, flow-api, flow-web, voice-agent,
  nginx, prometheus, grafana, pgadmin, redis-commander

EXAMPLES:
  .\dev-logs.ps1                              # Show all logs
  .\dev-logs.ps1 tekup-unified-platform      # Show specific service logs  
  .\dev-logs.ps1 -Follow                     # Follow all logs in real-time
  .\dev-logs.ps1 postgres -Follow            # Follow postgres logs
  .\dev-logs.ps1 -Tail -Lines 100            # Show last 100 lines
"@
    exit 0
}

Write-Host "📋 Tekup Development Environment Logs" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running." -ForegroundColor Red
    exit 1
}

# Check if any Tekup containers are running
$runningContainers = docker ps --filter "name=tekup-" --format "{{.Names}}" | Where-Object { $_ -ne "" }
if (-not $runningContainers) {
    Write-Host "❌ No Tekup containers are currently running." -ForegroundColor Red
    Write-Host "💡 Start the environment with: .\scripts\dev-start.ps1" -ForegroundColor Yellow
    exit 1
}

# Build docker-compose logs command
$command = "docker-compose -f docker-compose.dev.yml logs"

if ($Tail -or $Lines -gt 0) {
    $command += " --tail=$Lines"
}

if ($Follow) {
    $command += " -f"
}

if ($Service -ne "") {
    # Validate service exists
    $availableServices = @(
        "postgres", "redis", "tekup-unified-platform", "tekup-crm-web", 
        "agentscope-enhanced", "flow-api", "flow-web", "voice-agent",
        "nginx", "prometheus", "grafana", "pgadmin", "redis-commander",
        "mailhog", "elasticsearch", "kibana"
    )
    
    if ($Service -notin $availableServices) {
        Write-Host "❌ Unknown service: $Service" -ForegroundColor Red
        Write-Host "💡 Available services: $($availableServices -join ', ')" -ForegroundColor Yellow
        exit 1
    }
    
    $command += " $Service"
    Write-Host "📝 Showing logs for: $Service" -ForegroundColor Cyan
} else {
    Write-Host "📝 Showing logs for all services" -ForegroundColor Cyan
}

if ($Follow) {
    Write-Host "👀 Following logs in real-time (Press Ctrl+C to stop)" -ForegroundColor Yellow
}

Write-Host ""

# Execute the command
try {
    Invoke-Expression $command
} catch {
    Write-Host "❌ Failed to retrieve logs: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

if (-not $Follow) {
    Write-Host ""
    Write-Host "📝 Log Commands:" -ForegroundColor Yellow
    Write-Host "  .\scripts\dev-logs.ps1 -Follow        # Follow all logs"
    Write-Host "  .\scripts\dev-logs.ps1 [service]      # View specific service"
    Write-Host "  .\scripts\dev-status.ps1              # Check service status"
}
