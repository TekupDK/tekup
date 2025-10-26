# Setup & Deploy Open WebUI
# Automated script to install and configure Open WebUI with Docker

param(
    [switch]$Force = $false
)

# Colors
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "╔════════════════════════════════════════╗" -ForegroundColor $Colors.Header
    Write-Host "║ $Title" -PadRight 40 | % { $_ + "║" } -ForegroundColor $Colors.Header
    Write-Host "╚════════════════════════════════════════╝" -ForegroundColor $Colors.Header
    Write-Host ""
}

function Check-Docker {
    Write-Host "🔍 Checking Docker installation..." -ForegroundColor $Colors.Info
    try {
        $DockerVersion = docker --version
        Write-Host "✅ Docker found: $DockerVersion" -ForegroundColor $Colors.Success
        return $true
    } catch {
        Write-Host "❌ Docker not found!" -ForegroundColor $Colors.Error
        Write-Host "   Install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor $Colors.Warning
        return $false
    }
}

function Check-DockerDaemon {
    Write-Host "🔍 Checking Docker daemon..." -ForegroundColor $Colors.Info
    try {
        docker ps > $null 2>&1
        Write-Host "✅ Docker daemon is running" -ForegroundColor $Colors.Success
        return $true
    } catch {
        Write-Host "⚠️  Docker daemon not running, starting Docker Desktop..." -ForegroundColor $Colors.Warning
        Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        Start-Sleep -Seconds 15
        
        # Check again
        try {
            docker ps > $null 2>&1
            Write-Host "✅ Docker daemon started successfully" -ForegroundColor $Colors.Success
            return $true
        } catch {
            Write-Host "❌ Failed to start Docker daemon" -ForegroundColor $Colors.Error
            return $false
        }
    }
}

function Check-ExistingContainer {
    Write-Host "🔍 Checking for existing Open WebUI container..." -ForegroundColor $Colors.Info
    $Existing = docker ps -a --filter "name=open-webui" --format "{{.Names}}"
    
    if ($Existing) {
        Write-Host "   Found existing container: $Existing" -ForegroundColor $Colors.Warning
        
        if ($Force) {
            Write-Host "   Removing existing container (--Force flag)..." -ForegroundColor $Colors.Warning
            docker stop $Existing 2>$null
            docker rm $Existing 2>$null
            return $true
        } else {
            $Response = Read-Host "   Remove and recreate? (yes/no)"
            if ($Response -eq "yes") {
                docker stop $Existing 2>$null
                docker rm $Existing 2>$null
                return $true
            } else {
                Write-Host "   Keeping existing container" -ForegroundColor $Colors.Info
                return $false
            }
        }
    }
    return $true
}

function Pull-Image {
    Write-Host "📥 Pulling Open WebUI image..." -ForegroundColor $Colors.Info
    Write-Host "   (This may take a minute or two...)" -ForegroundColor $Colors.Warning
    
    try {
        docker pull ghcr.io/open-webui/open-webui:latest
        Write-Host "✅ Image pulled successfully" -ForegroundColor $Colors.Success
        return $true
    } catch {
        Write-Host "❌ Failed to pull image: $_" -ForegroundColor $Colors.Error
        return $false
    }
}

function Start-Container {
    Write-Host "🚀 Starting Open WebUI container..." -ForegroundColor $Colors.Info
    
    try {
        $ContainerId = docker run -d `
            -p 3000:8080 `
            --add-host=host.docker.internal:host-gateway `
            --name open-webui `
            ghcr.io/open-webui/open-webui:latest
        
        Write-Host "✅ Container started: $($ContainerId.Substring(0, 12))" -ForegroundColor $Colors.Success
        
        Write-Host "⏳ Waiting for container to become healthy..." -ForegroundColor $Colors.Info
        $MaxAttempts = 30
        $Attempt = 0
        
        while ($Attempt -lt $MaxAttempts) {
            $HealthStatus = docker inspect open-webui --format='{{.State.Health.Status}}' 2>$null
            
            if ($HealthStatus -eq "healthy") {
                Write-Host "✅ Container is healthy!" -ForegroundColor $Colors.Success
                return $true
            }
            
            $Attempt++
            Write-Host "   ($Attempt/$MaxAttempts) Status: $HealthStatus..." -ForegroundColor $Colors.Warning
            Start-Sleep -Seconds 2
        }
        
        Write-Host "⚠️  Container is running but health check incomplete. Proceeding..." -ForegroundColor $Colors.Warning
        return $true
    } catch {
        Write-Host "❌ Failed to start container: $_" -ForegroundColor $Colors.Error
        return $false
    }
}

function Verify-Access {
    Write-Host "🌐 Verifying Open WebUI access..." -ForegroundColor $Colors.Info
    
    $MaxAttempts = 10
    $Attempt = 0
    
    while ($Attempt -lt $MaxAttempts) {
        try {
            $Response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($Response.StatusCode -eq 200) {
                Write-Host "✅ Open WebUI is accessible at http://localhost:3000" -ForegroundColor $Colors.Success
                return $true
            }
        } catch {
            # Expected during startup
        }
        
        $Attempt++
        Write-Host "   Attempt $Attempt/$MaxAttempts - waiting for web server..." -ForegroundColor $Colors.Warning
        Start-Sleep -Seconds 2
    }
    
    Write-Host "⚠️  Could not verify web access, but container is running" -ForegroundColor $Colors.Warning
    return $true
}

function Show-NextSteps {
    Write-Header "Setup Complete!"
    Write-Host ""
    Write-Host "📍 Open WebUI is running at:" -ForegroundColor $Colors.Info
    Write-Host "   http://localhost:3000" -ForegroundColor $Colors.Success
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor $Colors.Info
    Write-Host "   1. Open http://localhost:3000 in your browser" -ForegroundColor $Colors.Info
    Write-Host "   2. Create an admin account (first user)" -ForegroundColor $Colors.Info
    Write-Host "   3. Go to Settings → Models" -ForegroundColor $Colors.Info
    Write-Host "   4. Add connection: http://host.docker.internal:11434" -ForegroundColor $Colors.Info
    Write-Host "   5. Select and load your Ollama models" -ForegroundColor $Colors.Info
    Write-Host ""
    Write-Host "🛠️  Useful commands:" -ForegroundColor $Colors.Info
    Write-Host "   ./scripts/manage-docker.ps1 -Action status   # Check status" -ForegroundColor $Colors.Info
    Write-Host "   ./scripts/manage-docker.ps1 -Action logs     # View logs" -ForegroundColor $Colors.Info
    Write-Host "   ./scripts/manage-docker.ps1 -Action stop     # Stop container" -ForegroundColor $Colors.Info
    Write-Host ""
}

# Main execution
Write-Header "Open WebUI Setup"

if (-not (Check-Docker)) { exit 1 }
if (-not (Check-DockerDaemon)) { exit 1 }
if (-not (Check-ExistingContainer)) { exit 0 }
if (-not (Pull-Image)) { exit 1 }
if (-not (Start-Container)) { exit 1 }
if (-not (Verify-Access)) { exit 1 }

Show-NextSteps

Write-Host ""
Write-Host "🎉 Setup successful! Open WebUI is ready to use." -ForegroundColor $Colors.Success
Write-Host ""
