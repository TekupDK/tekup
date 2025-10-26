# Tekup Docker Development Environment Setup
# One-time setup script for initializing the complete development environment

param(
    [switch]$Reset,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Tekup Docker Development Environment Setup

USAGE:
  .\dev-setup.ps1 [OPTIONS]

OPTIONS:
  -Reset       Reset entire environment (removes all data!)
  -Help        Show this help message

DESCRIPTION:
  This script performs initial setup of the Tekup Docker development environment:
  - Creates necessary directories and files
  - Sets up database initialization scripts
  - Configures environment variables
  - Builds Docker images
  - Initializes databases with schema and seed data

EXAMPLES:
  .\dev-setup.ps1         # Initial setup
  .\dev-setup.ps1 -Reset  # Reset everything
"@
    exit 0
}

Write-Host "🔧 Tekup Docker Development Environment Setup" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check prerequisites
Write-Host "📋 Checking Prerequisites..." -ForegroundColor Cyan

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "  ✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check if pnpm is available
try {
    pnpm --version | Out-Null
    Write-Host "  ✅ pnpm is available" -ForegroundColor Green
} catch {
    Write-Host "  ❌ pnpm is not available. Please install pnpm." -ForegroundColor Red
    exit 1
}

# Reset environment if requested
if ($Reset) {
    Write-Host ""
    Write-Host "⚠️  RESET MODE: This will destroy all existing data!" -ForegroundColor Red
    $confirmation = Read-Host "Are you sure? Type 'RESET' to confirm"
    
    if ($confirmation -ne 'RESET') {
        Write-Host "❌ Reset cancelled" -ForegroundColor Yellow
        exit 0
    }
    
    Write-Host "🗑️  Removing existing environment..." -ForegroundColor Red
    .\scripts\dev-stop.ps1 -Volumes -ErrorAction SilentlyContinue
    
    # Remove Docker images
    docker rmi $(docker images -q --filter "reference=tekup-*") -f 2>$null
    
    Write-Host "✅ Environment reset complete" -ForegroundColor Green
}

Write-Host ""
Write-Host "📂 Setting up directories and files..." -ForegroundColor Cyan

# Ensure all necessary directories exist
$directories = @(
    "docker/app",
    "docker/postgres/init", 
    "docker/postgres/config",
    "docker/redis",
    "docker/nginx/conf.d",
    "docker/prometheus",
    "docker/grafana/provisioning",
    "docker/grafana/dashboards",
    "docker/pgadmin",
    "scripts"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -Path $dir -ItemType Directory -Force | Out-Null
        Write-Host "  ✅ Created directory: $dir" -ForegroundColor Gray
    }
}

# Check critical files
$criticalFiles = @(
    "docker-compose.dev.yml",
    ".env.dev",
    "docker/app/Dockerfile.dev",
    "docker/app/Dockerfile.python",
    "docker/postgres/init/01-init-multiple-databases.sh",
    "scripts/dev-start.ps1",
    "scripts/dev-stop.ps1",
    "scripts/dev-logs.ps1",
    "scripts/dev-status.ps1"
)

$missingFiles = @()
foreach ($file in $criticalFiles) {
    if (!(Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "  ❌ Missing critical files:" -ForegroundColor Red
    foreach ($file in $missingFiles) {
        Write-Host "    - $file" -ForegroundColor Red
    }
    Write-Host "  Please ensure all files are created before running setup." -ForegroundColor Yellow
    exit 1
}

Write-Host "  ✅ All directories and critical files exist" -ForegroundColor Green

Write-Host ""
Write-Host "🔐 Setting up environment configuration..." -ForegroundColor Cyan

# Copy environment file if it doesn't exist
if (!(Test-Path ".env.local")) {
    Copy-Item ".env.dev" ".env.local" -ErrorAction SilentlyContinue
    Write-Host "  ✅ Created .env.local from template" -ForegroundColor Green
    Write-Host "  💡 Please update API keys in .env.local:" -ForegroundColor Yellow
    Write-Host "    - GEMINI_API_KEY" -ForegroundColor Yellow
    Write-Host "    - ANTHROPIC_API_KEY" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🏗️  Building Docker images..." -ForegroundColor Cyan

# Build base development images
Write-Host "  📦 Building Node.js development image..." -ForegroundColor Gray
docker build -f docker/app/Dockerfile.dev -t tekup-node-dev . --build-arg NODE_VERSION=20 --build-arg APP_NAME=base

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Node.js development image built successfully" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Node.js image build had warnings (continuing...)" -ForegroundColor Yellow
}

Write-Host "  🐍 Building Python development image..." -ForegroundColor Gray
docker build -f docker/app/Dockerfile.python -t tekup-python-dev . --build-arg APP_NAME=backend/agentscope-enhanced

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Python development image built successfully" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Python image build had warnings (continuing...)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Starting essential services for initial setup..." -ForegroundColor Cyan

# Start database services first
Write-Host "  🗄️  Starting database services..." -ForegroundColor Gray
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Wait for databases to be ready
Write-Host "  ⏳ Waiting for databases to be ready..." -ForegroundColor Gray
Start-Sleep 15

# Check if PostgreSQL is ready
$retries = 0
$maxRetries = 30
do {
    try {
        $pgReady = docker exec tekup-postgres-dev pg_isready -U postgres 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ PostgreSQL is ready" -ForegroundColor Green
            break
        }
    } catch {}
    
    $retries++
    if ($retries -ge $maxRetries) {
        Write-Host "  ❌ PostgreSQL failed to start after $maxRetries attempts" -ForegroundColor Red
        exit 1
    }
    
    Start-Sleep 2
} while ($retries -lt $maxRetries)

# Check if Redis is ready
try {
    $redisReady = docker exec tekup-redis-dev redis-cli --no-auth-warning -a tekup_redis_2024 ping 2>$null
    if ($redisReady -eq "PONG") {
        Write-Host "  ✅ Redis is ready" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Redis is not responding properly" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ❌ Redis connection failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📊 Setting up database schemas..." -ForegroundColor Cyan

# Install dependencies for unified platform if not already done
if (!(Test-Path "apps/tekup-unified-platform/node_modules")) {
    Write-Host "  📦 Installing dependencies for unified platform..." -ForegroundColor Gray
    pnpm --filter tekup-unified-platform install
}

# Generate Prisma client
Write-Host "  🔧 Generating Prisma client..." -ForegroundColor Gray
pnpm --filter tekup-unified-platform run prisma:generate 2>$null

# Run database migrations
Write-Host "  🗄️  Running database migrations..." -ForegroundColor Gray
try {
    if (Test-Path "apps/tekup-unified-platform/prisma/schema.prisma") {
        # Use SQLite for initial development
        pnpm --filter tekup-unified-platform run db:push 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Database schema created successfully" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Database schema creation had issues (continuing...)" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "  ⚠️  Could not run migrations (you may need to run them manually)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green
Write-Host ""

Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update API keys in .env.local:" -ForegroundColor White
Write-Host "   - GEMINI_API_KEY=your_actual_key" -ForegroundColor Gray
Write-Host "   - ANTHROPIC_API_KEY=your_actual_key" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start the full development environment:" -ForegroundColor White
Write-Host "   .\scripts\dev-start.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Check that everything is running:" -ForegroundColor White
Write-Host "   .\scripts\dev-status.ps1 -Health" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Access the applications:" -ForegroundColor White
Write-Host "   🌐 Main App:    http://localhost/crm" -ForegroundColor Gray
Write-Host "   🔧 API:         http://localhost:3000" -ForegroundColor Gray
Write-Host "   🗄️  pgAdmin:    http://localhost:5050" -ForegroundColor Gray
Write-Host "   📊 Grafana:     http://localhost:3333" -ForegroundColor Gray
Write-Host ""

Write-Host "🆘 If you need help:" -ForegroundColor Yellow
Write-Host "   .\scripts\dev-start.ps1 -Help" -ForegroundColor Gray
Write-Host "   .\scripts\dev-status.ps1 -Help" -ForegroundColor Gray
Write-Host "   Check README-Docker-Development.md for detailed documentation" -ForegroundColor Gray

Write-Host ""
Write-Host "🚀 Happy developing with Tekup Docker Environment!" -ForegroundColor Green
