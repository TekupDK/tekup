# TekupDK Network Cleanup Script
# Cleans up Docker networks and containers to prevent conflicts
# Usage: .\scripts\cleanup-networks.ps1

param(
    [switch]$Force
)

Write-Host "🧹 TekupDK Network Cleanup" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

# Function to stop and remove containers
function Stop-RemoveContainers {
    Write-Host ""
    Write-Host "Stopping and removing containers..." -ForegroundColor Blue

    # Get all TekupDK related containers
    $containers = docker ps -a --filter "name=tekup-" --format "{{.Names}}"
    $rendetaljeContainers = docker ps -a --filter "name=rendetalje-" --format "{{.Names}}"

    # Stop and remove TekupDK containers
    foreach ($container in $containers) {
        if ($container) {
            Write-Host "Stopping container: $container" -ForegroundColor Yellow
            docker stop $container 2>$null
            docker rm $container 2>$null
        }
    }

    # Stop and remove Rendetalje containers
    foreach ($container in $rendetaljeContainers) {
        if ($container) {
            Write-Host "Stopping container: $container" -ForegroundColor Yellow
            docker stop $container 2>$null
            docker rm $container 2>$null
        }
    }
}

# Function to clean up networks
function Remove-Networks {
    Write-Host ""
    Write-Host "Cleaning up networks..." -ForegroundColor Blue

    $networks = @("tekup-mcp-network", "tekup-gmail-network", "renos-calendar-network")

    foreach ($network in $networks) {
        $existingNetworks = docker network ls --format "{{.Name}}"
        if ($existingNetworks -contains $network) {
            Write-Host "Removing network: $network" -ForegroundColor Yellow
            try {
                docker network rm $network 2>$null
            } catch {
                Write-Host "Failed to remove network: $network" -ForegroundColor Red
            }
        } else {
            Write-Host "Network $network not found (already clean)" -ForegroundColor Green
        }
    }
}

# Function to clean up volumes
function Remove-Volumes {
    Write-Host ""
    Write-Host "Cleaning up volumes..." -ForegroundColor Blue

    # Remove orphaned volumes
    docker volume prune -f

    $volumes = @("redis_data", "postgres_data", "calendar_logs", "knowledge_logs", "code_intelligence_logs", "nginx_logs", "gmail_credentials", "gmail_oauth")

    foreach ($volume in $volumes) {
        $existingVolumes = docker volume ls --format "{{.Name}}"
        if ($existingVolumes -contains $volume) {
            Write-Host "Removing volume: $volume" -ForegroundColor Yellow
            try {
                docker volume rm $volume 2>$null
            } catch {
                Write-Host "Failed to remove volume: $volume (may be in use)" -ForegroundColor Red
            }
        }
    }
}

# Function to clean up images
function Remove-Images {
    Write-Host ""
    Write-Host "Cleaning up dangling images..." -ForegroundColor Blue

    # Remove dangling images
    docker image prune -f
}

# Function to show current status
function Show-Status {
    Write-Host ""
    Write-Host "📊 Current Docker Status" -ForegroundColor Blue
    Write-Host "=========================" -ForegroundColor Blue

    Write-Host ""
    Write-Host "Running containers:" -ForegroundColor Green
    docker ps --filter "name=tekup-\|name=rendetalje-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

    Write-Host ""
    Write-Host "All TekupDK containers:" -ForegroundColor Green
    docker ps -a --filter "name=tekup-\|name=rendetalje-" --format "table {{.Names}}\t{{.Status}}"

    Write-Host ""
    Write-Host "Networks:" -ForegroundColor Green
    docker network ls --filter "name=tekup-\|name=renos-"

    Write-Host ""
    Write-Host "Volumes:" -ForegroundColor Green
    docker volume ls --filter "name=redis_\|name=postgres_\|name=calendar_\|name=gmail_"
}

# Main execution
function Main {
    Write-Host "This will stop and remove all TekupDK containers, networks, and volumes." -ForegroundColor Blue
    Write-Host "⚠️  Make sure to backup any important data before proceeding!" -ForegroundColor Yellow
    Write-Host ""

    # Ask for confirmation unless -Force flag is used
    if (!$Force) {
        $confirmation = Read-Host "Do you want to continue? (y/N)"
        if ($confirmation -notmatch "^[Yy]$") {
            Write-Host "Cleanup cancelled." -ForegroundColor Green
            exit 0
        }
    }

    Stop-RemoveContainers
    Remove-Networks
    Remove-Volumes
    Remove-Images
    Show-Status

    Write-Host ""
    Write-Host "✅ Network cleanup completed!" -ForegroundColor Green
    Write-Host "💡 You can now run 'docker-compose up' to start services fresh." -ForegroundColor Blue
}

# Run main function
Main