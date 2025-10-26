# Tekup Development Environment Stopper
# PowerShell script to stop and cleanup the Docker development environment

param(
    [switch]$Clean,
    [switch]$Volumes,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Tekup Development Environment Stopper

USAGE:
  .\dev-stop.ps1 [OPTIONS]

OPTIONS:
  -Clean       Remove stopped containers and networks
  -Volumes     Also remove data volumes (WARNING: This deletes all data!)
  -Help        Show this help message

EXAMPLES:
  .\dev-stop.ps1           # Stop all services
  .\dev-stop.ps1 -Clean    # Stop and cleanup containers
  .\dev-stop.ps1 -Volumes  # Stop and remove everything including data
"@
    exit 0
}

Write-Host "🛑 Stopping Tekup Development Environment" -ForegroundColor Red
Write-Host "==========================================" -ForegroundColor Red

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Nothing to stop." -ForegroundColor Yellow
    exit 0
}

Write-Host "🔧 Stopping all services..." -ForegroundColor Cyan
docker-compose -f docker-compose.dev.yml down

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ All services stopped successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Some services failed to stop properly" -ForegroundColor Yellow
}

if ($Clean) {
    Write-Host "🧹 Cleaning up containers and networks..." -ForegroundColor Cyan
    
    # Remove stopped containers
    docker container prune -f
    
    # Remove unused networks
    docker network prune -f
    
    # Remove unused images (dangling)
    docker image prune -f
    
    Write-Host "✅ Cleanup completed" -ForegroundColor Green
}

if ($Volumes) {
    Write-Host "⚠️  WARNING: This will delete all development data!" -ForegroundColor Red
    $confirmation = Read-Host "Are you sure you want to remove data volumes? Type 'yes' to confirm"
    
    if ($confirmation -eq 'yes') {
        Write-Host "🗑️  Removing data volumes..." -ForegroundColor Red
        
        # Stop and remove everything including volumes
        docker-compose -f docker-compose.dev.yml down -v
        
        # Remove named volumes
        $volumes = @(
            "tekup-org_postgres_dev_data",
            "tekup-org_redis_dev_data", 
            "tekup-org_pgadmin_dev_data",
            "tekup-org_prometheus_dev_data",
            "tekup-org_grafana_dev_data",
            "tekup-org_elasticsearch_dev_data",
            "tekup-org_tekup_node_modules",
            "tekup-org_tekup_crm_web_node_modules",
            "tekup-org_flow_api_node_modules",
            "tekup-org_flow_web_node_modules",
            "tekup-org_voice_agent_node_modules"
        )
        
        foreach ($volume in $volumes) {
            docker volume rm $volume 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✅ Removed volume: $volume" -ForegroundColor Gray
            }
        }
        
        Write-Host "✅ All data volumes removed" -ForegroundColor Green
    } else {
        Write-Host "❌ Volume removal cancelled" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎉 Tekup Development Environment Stopped!" -ForegroundColor Green
Write-Host ""

# Show docker status
Write-Host "📊 Current Docker Status:" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

$containers = docker ps -a --filter "name=tekup-" --format "table {{.Names}}\t{{.Status}}"
if ($containers) {
    Write-Host $containers
} else {
    Write-Host "No Tekup containers found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "  .\scripts\dev-start.ps1     # Start the environment again"
Write-Host "  docker system df           # Check disk usage"
Write-Host "  docker system prune        # Clean up unused Docker resources"
