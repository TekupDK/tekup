# Tekup Development Environment Status Checker
# PowerShell script to check the health and status of all development services

param(
    [switch]$Health,
    [switch]$Resources,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Tekup Development Environment Status Checker

USAGE:
  .\dev-status.ps1 [OPTIONS]

OPTIONS:
  -Health      Show detailed health check information
  -Resources   Show resource usage (CPU, Memory, etc.)
  -Help        Show this help message

EXAMPLES:
  .\dev-status.ps1            # Show basic status
  .\dev-status.ps1 -Health    # Show health checks
  .\dev-status.ps1 -Resources # Show resource usage
"@
    exit 0
}

Write-Host "📊 Tekup Development Environment Status" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Get container status
Write-Host "🐳 Container Status:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

$containers = docker ps -a --filter "name=tekup-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Out-String
if ($containers.Trim()) {
    Write-Host $containers
} else {
    Write-Host "No Tekup containers found" -ForegroundColor Yellow
    Write-Host "💡 Start the environment with: .\scripts\dev-start.ps1" -ForegroundColor Yellow
    exit 0
}

# Count running vs stopped containers
$runningCount = (docker ps --filter "name=tekup-" --format "{{.Names}}").Count
$stoppedCount = (docker ps -a --filter "name=tekup-" --format "{{.Names}}").Count - $runningCount

Write-Host ""
Write-Host "📈 Summary:" -ForegroundColor Yellow
Write-Host "  🟢 Running: $runningCount containers"
Write-Host "  🔴 Stopped: $stoppedCount containers"

if ($Health) {
    Write-Host ""
    Write-Host "🏥 Health Checks:" -ForegroundColor Cyan
    Write-Host "=================" -ForegroundColor Cyan
    
    # Define service health check URLs
    $healthChecks = @{
        "Tekup Unified Platform" = "http://localhost:3000/health"
        "AgentScope Enhanced" = "http://localhost:8001/health"
        "Flow API" = "http://localhost:4000/health"
        "Grafana" = "http://localhost:3333/api/health"
        "Prometheus" = "http://localhost:9090/-/healthy"
        "pgAdmin" = "http://localhost:5050/misc/ping"
        "Redis Commander" = "http://localhost:8081/"
        "MailHog" = "http://localhost:8025/"
        "Elasticsearch" = "http://localhost:9200/_cluster/health"
        "Kibana" = "http://localhost:5601/api/status"
    }
    
    foreach ($service in $healthChecks.Keys) {
        $url = $healthChecks[$service]
        
        try {
            $response = Invoke-RestMethod -Uri $url -TimeoutSec 5 -ErrorAction Stop
            Write-Host "  ✅ $service" -ForegroundColor Green
        } catch {
            Write-Host "  ❌ $service" -ForegroundColor Red
        }
    }
    
    # Database connectivity checks
    Write-Host ""
    Write-Host "💾 Database Connectivity:" -ForegroundColor Cyan
    
    # Check PostgreSQL
    try {
        $pgResult = docker exec tekup-postgres-dev pg_isready -U postgres 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ PostgreSQL" -ForegroundColor Green
        } else {
            Write-Host "  ❌ PostgreSQL" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ❌ PostgreSQL (container not running)" -ForegroundColor Red
    }
    
    # Check Redis
    try {
        $redisResult = docker exec tekup-redis-dev redis-cli --no-auth-warning -a tekup_redis_2024 ping 2>$null
        if ($redisResult -eq "PONG") {
            Write-Host "  ✅ Redis" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Redis" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ❌ Redis (container not running)" -ForegroundColor Red
    }
}

if ($Resources) {
    Write-Host ""
    Write-Host "💻 Resource Usage:" -ForegroundColor Cyan
    Write-Host "==================" -ForegroundColor Cyan
    
    $stats = docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" --filter "name=tekup-"
    Write-Host $stats
}

# Show network information
Write-Host ""
Write-Host "🌐 Network Information:" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan

$networkInfo = docker network ls --filter "name=tekup" --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"
if ($networkInfo) {
    Write-Host $networkInfo
} else {
    Write-Host "No Tekup networks found" -ForegroundColor Yellow
}

# Show volume information
Write-Host ""
Write-Host "💾 Volume Information:" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan

$volumeInfo = docker volume ls --filter "name=tekup-org" --format "table {{.Name}}\t{{.Driver}}"
if ($volumeInfo) {
    Write-Host $volumeInfo
} else {
    Write-Host "No Tekup volumes found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔗 Service URLs:" -ForegroundColor Yellow
Write-Host "===============" -ForegroundColor Yellow
Write-Host "🌐 Main App:       http://localhost/crm"
Write-Host "🔧 API:            http://localhost:3000"
Write-Host "🧠 AgentScope:     http://localhost:8001"
Write-Host "🗄️  pgAdmin:       http://localhost:5050"
Write-Host "🔴 Redis UI:       http://localhost:8081"
Write-Host "📊 Grafana:        http://localhost:3333"
Write-Host "🔍 Prometheus:     http://localhost:9090"

Write-Host ""
Write-Host "📝 Management Commands:" -ForegroundColor Yellow
Write-Host "  .\scripts\dev-start.ps1    # Start environment"
Write-Host "  .\scripts\dev-stop.ps1     # Stop environment"
Write-Host "  .\scripts\dev-logs.ps1     # View logs"
Write-Host "  docker-compose -f docker-compose.dev.yml ps    # Quick status"
