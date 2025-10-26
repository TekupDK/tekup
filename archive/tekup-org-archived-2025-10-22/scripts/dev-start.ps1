# Tekup Development Environment Starter
# PowerShell script to start the complete Docker development environment

param(
    [switch]$Quick,
    [switch]$Services,
    [switch]$Apps,
    [switch]$Monitoring,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Tekup Development Environment Manager

USAGE:
  .\dev-start.ps1 [OPTIONS]

OPTIONS:
  -Quick       Start only essential services (databases, main apps)
  -Services    Start only infrastructure services (databases, redis, etc.)
  -Apps        Start only application services
  -Monitoring  Start only monitoring stack
  -Help        Show this help message

EXAMPLES:
  .\dev-start.ps1              # Start everything
  .\dev-start.ps1 -Quick       # Start essential services only
  .\dev-start.ps1 -Services    # Start databases and infrastructure
  .\dev-start.ps1 -Apps        # Start applications only
"@
    exit 0
}

Write-Host "🚀 Starting Tekup Development Environment" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check if .env.dev exists, create if not
if (!(Test-Path ".env.dev")) {
    Write-Host "📝 Creating .env.dev file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env.dev" -ErrorAction SilentlyContinue
}

# Define service groups
$ServicesGroup = @(
    "postgres",
    "redis"
)

$AppsGroup = @(
    "tekup-unified-platform",
    "tekup-crm-web", 
    "agentscope-enhanced",
    "flow-api",
    "flow-web",
    "voice-agent"
)

$MonitoringGroup = @(
    "prometheus",
    "grafana",
    "pgadmin",
    "redis-commander",
    "mailhog",
    "elasticsearch",
    "kibana"
)

$NetworkingGroup = @(
    "nginx"
)

# Function to start services
function Start-ServiceGroup {
    param([string[]]$Services, [string]$GroupName)
    
    Write-Host "🔧 Starting $GroupName..." -ForegroundColor Cyan
    foreach ($service in $Services) {
        Write-Host "  └── Starting $service..." -ForegroundColor Gray
    }
    
    docker-compose -f docker-compose.dev.yml up -d $Services
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $GroupName started successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to start $GroupName" -ForegroundColor Red
        exit 1
    }
}

# Start services based on parameters
if ($Quick) {
    Write-Host "⚡ Quick start mode - starting essential services only" -ForegroundColor Yellow
    Start-ServiceGroup ($ServicesGroup + @("tekup-unified-platform", "tekup-crm-web", "agentscope-enhanced")) "Essential Services"
} elseif ($Services) {
    Start-ServiceGroup $ServicesGroup "Infrastructure Services"
} elseif ($Apps) {
    Start-ServiceGroup $AppsGroup "Application Services"
} elseif ($Monitoring) {
    Start-ServiceGroup $MonitoringGroup "Monitoring Stack"
} else {
    # Start everything in order
    Start-ServiceGroup $ServicesGroup "Infrastructure Services"
    Start-Sleep 10  # Wait for databases to be ready
    
    Start-ServiceGroup $AppsGroup "Application Services"
    Start-Sleep 5   # Wait for apps to start
    
    Start-ServiceGroup $MonitoringGroup "Monitoring Stack"
    Start-ServiceGroup $NetworkingGroup "Networking"
}

Write-Host ""
Write-Host "🎉 Tekup Development Environment Started!" -ForegroundColor Green
Write-Host ""

# Show service URLs
Write-Host "📊 Available Services:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host "🌐 Main Application:      http://localhost/crm" -ForegroundColor White
Write-Host "🔧 Tekup Unified API:     http://localhost:3000" -ForegroundColor White
Write-Host "🧠 AgentScope Backend:    http://localhost:8001" -ForegroundColor White
Write-Host "🔄 Flow API (Legacy):     http://localhost:4000" -ForegroundColor White
Write-Host "📱 Voice Agent:           http://localhost:3002" -ForegroundColor White
Write-Host ""
Write-Host "🛠️  Development Tools:" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host "🗄️  pgAdmin:             http://localhost:5050" -ForegroundColor White
Write-Host "🔴 Redis Commander:      http://localhost:8081" -ForegroundColor White
Write-Host "📊 Grafana:              http://localhost:3333" -ForegroundColor White
Write-Host "🔍 Prometheus:           http://localhost:9090" -ForegroundColor White
Write-Host "📧 MailHog:              http://localhost:8025" -ForegroundColor White
Write-Host "🔍 Elasticsearch:        http://localhost:9200" -ForegroundColor White
Write-Host "📈 Kibana:               http://localhost:5601" -ForegroundColor White
Write-Host ""

# Show next steps
Write-Host "🔥 Next Steps:" -ForegroundColor Yellow
Write-Host "=============" -ForegroundColor Yellow
Write-Host "1. Wait for all services to be healthy (check with: docker-compose -f docker-compose.dev.yml ps)"
Write-Host "2. Run database migrations: pnpm run db:migrate"
Write-Host "3. Seed development data: pnpm run db:seed"
Write-Host "4. Visit http://localhost/crm to access the main application"
Write-Host ""
Write-Host "📝 Useful commands:"
Write-Host "  docker-compose -f docker-compose.dev.yml logs -f [service]  # View logs"
Write-Host "  docker-compose -f docker-compose.dev.yml ps                 # Check status"
Write-Host "  .\scripts\dev-stop.ps1                                      # Stop environment"
Write-Host "  .\scripts\dev-logs.ps1                                      # View all logs"
