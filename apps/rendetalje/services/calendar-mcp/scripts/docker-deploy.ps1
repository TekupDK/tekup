# Docker Deployment Script for RenOS Calendar MCP
# This script builds and deploys the complete application using Docker

Write-Host "🐳 RenOS Calendar MCP - Docker Deployment" -ForegroundColor Blue
Write-Host "================================================" -ForegroundColor Blue

# Check if Docker is installed
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is installed
if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose is not installed. Please install Docker Compose first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker and Docker Compose are installed" -ForegroundColor Green

# Create .env file if it doesn't exist
if (!(Test-Path ".env")) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "⚠️  Please edit .env file with your actual credentials" -ForegroundColor Yellow
}

# Build and start services
Write-Host "🔨 Building Docker images..." -ForegroundColor Yellow
docker-compose build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker images built successfully" -ForegroundColor Green

# Start services
Write-Host "🚀 Starting services..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start services" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Services started successfully" -ForegroundColor Green

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Health check
Write-Host "🔍 Performing health checks..." -ForegroundColor Yellow

$services = @(
    @{Name="MCP Server"; Url="http://localhost:3001/health"},
    @{Name="Dashboard"; Url="http://localhost:3006/health"},
    @{Name="Chatbot"; Url="http://localhost:3005/health"}
)

foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri $service.Url -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $($service.Name) is healthy" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $($service.Name) returned status $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ $($service.Name) health check failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Show running containers
Write-Host "📊 Running containers:" -ForegroundColor Blue
docker-compose ps

# Show logs
Write-Host "📋 Recent logs:" -ForegroundColor Blue
docker-compose logs --tail=20

Write-Host "🎉 RenOS Calendar MCP is now running!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Blue
Write-Host "📱 Dashboard: http://localhost:3006" -ForegroundColor Cyan
Write-Host "🤖 Chatbot: http://localhost:3005" -ForegroundColor Cyan
Write-Host "🔧 API Server: http://localhost:3001" -ForegroundColor Cyan
Write-Host "🌐 Nginx Proxy: http://localhost" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Blue

Write-Host "📚 Useful commands:" -ForegroundColor Yellow
Write-Host "  docker-compose logs -f          # Follow logs" -ForegroundColor White
Write-Host "  docker-compose ps               # Show status" -ForegroundColor White
Write-Host "  docker-compose restart          # Restart services" -ForegroundColor White
Write-Host "  docker-compose down             # Stop services" -ForegroundColor White
Write-Host "  docker-compose exec mcp-server bash  # Access MCP server" -ForegroundColor White
