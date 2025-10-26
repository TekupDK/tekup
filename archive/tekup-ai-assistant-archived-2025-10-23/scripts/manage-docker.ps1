# Docker Container Management Script
# Manages Open WebUI container operations

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "status",
    
    [Parameter(Mandatory=$false)]
    [string]$Container = "open-webui"
)

# Colors for output
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Header = "Magenta"
}

function Show-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "════════════════════════════════════════" -ForegroundColor $Colors.Header
    Write-Host "  $Title" -ForegroundColor $Colors.Header
    Write-Host "════════════════════════════════════════" -ForegroundColor $Colors.Header
    Write-Host ""
}

function Start-Container {
    Show-Header "Starting Docker Container: $Container"
    try {
        docker start $Container
        Write-Host "✅ Container started successfully" -ForegroundColor $Colors.Success
        Start-Sleep -Seconds 3
        Get-ContainerStatus
    } catch {
        Write-Host "❌ Failed to start container: $_" -ForegroundColor $Colors.Error
    }
}

function Stop-Container {
    Show-Header "Stopping Docker Container: $Container"
    try {
        docker stop $Container
        Write-Host "✅ Container stopped successfully" -ForegroundColor $Colors.Success
    } catch {
        Write-Host "❌ Failed to stop container: $_" -ForegroundColor $Colors.Error
    }
}

function Get-ContainerLogs {
    Show-Header "Docker Logs for: $Container"
    try {
        docker logs --tail 50 $Container
    } catch {
        Write-Host "❌ Failed to get logs: $_" -ForegroundColor $Colors.Error
    }
}

function Get-ContainerStatus {
    Show-Header "Container Status: $Container"
    try {
        $Status = docker ps --filter "name=$Container" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        if ([string]::IsNullOrEmpty($Status)) {
            Write-Host "⏹️  Container is not running" -ForegroundColor $Colors.Warning
            $Exists = docker ps -a --filter "name=$Container" --format "table {{.Names}}"
            if (-not [string]::IsNullOrEmpty($Exists)) {
                Write-Host "   (But container exists. Use 'start' action to run it.)" -ForegroundColor $Colors.Info
            }
        } else {
            Write-Host $Status -ForegroundColor $Colors.Success
        }
    } catch {
        Write-Host "❌ Failed to get status: $_" -ForegroundColor $Colors.Error
    }
}

function Remove-Container {
    Show-Header "Removing Docker Container: $Container"
    $Confirm = Read-Host "Are you sure? (yes/no)"
    if ($Confirm -eq "yes") {
        try {
            docker stop $Container 2>$null
            docker rm $Container
            Write-Host "✅ Container removed successfully" -ForegroundColor $Colors.Success
        } catch {
            Write-Host "❌ Failed to remove container: $_" -ForegroundColor $Colors.Error
        }
    } else {
        Write-Host "⏹️  Cancelled" -ForegroundColor $Colors.Warning
    }
}

function Show-Help {
    Write-Host ""
    Write-Host "Docker Container Management Script" -ForegroundColor $Colors.Header
    Write-Host ""
    Write-Host "Usage: ./scripts/manage-docker.ps1 -Action <action> [-Container <name>]" -ForegroundColor $Colors.Info
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor $Colors.Info
    Write-Host "  start    - Start the container"
    Write-Host "  stop     - Stop the container"
    Write-Host "  status   - Show container status (default)"
    Write-Host "  logs     - Show container logs (last 50 lines)"
    Write-Host "  remove   - Remove the container (with confirmation)"
    Write-Host "  health   - Check container health status"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor $Colors.Info
    Write-Host "  ./scripts/manage-docker.ps1 -Action start"
    Write-Host "  ./scripts/manage-docker.ps1 -Action logs"
    Write-Host "  ./scripts/manage-docker.ps1 -Action status"
    Write-Host ""
}

# Route action
switch ($Action.ToLower()) {
    "start" { Start-Container }
    "stop" { Stop-Container }
    "status" { Get-ContainerStatus }
    "logs" { Get-ContainerLogs }
    "remove" { Remove-Container }
    "health" { 
        Show-Header "Checking Health Status"
        docker inspect $Container --format='{{.State.Health.Status}}'
    }
    "help" { Show-Help }
    default { 
        Write-Host "❌ Unknown action: $Action" -ForegroundColor $Colors.Error
        Show-Help
    }
}
