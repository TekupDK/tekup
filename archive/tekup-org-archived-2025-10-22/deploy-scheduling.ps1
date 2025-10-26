# Build and deploy TekUp Job Scheduling System with Docker
# PowerShell script for Windows deployment

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "build",
    
    [Parameter(Mandatory=$false)]
    [string]$Environment = "production"
)

Write-Host "🚀 TekUp Job Scheduling System - Docker Deployment" -ForegroundColor Green
Write-Host "Action: $Action | Environment: $Environment" -ForegroundColor Cyan

# Set error action preference
$ErrorActionPreference = "Stop"

try {
    switch ($Action.ToLower()) {
        "build" {
            Write-Host "📦 Building Docker image for TekUp Job Scheduling..." -ForegroundColor Yellow
            
            # Build the Docker image
            docker build -t tekup-job-scheduling:latest -f apps/tekup-crm-web/Dockerfile .
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Docker image built successfully!" -ForegroundColor Green
                docker image ls | Select-String "tekup-job-scheduling"
            } else {
                throw "Docker build failed with exit code $LASTEXITCODE"
            }
        }
        
        "up" {
            Write-Host "🚀 Starting TekUp Job Scheduling System..." -ForegroundColor Yellow
            
            # Start the services
            docker-compose -f docker-compose.scheduling.yml up -d
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Services started successfully!" -ForegroundColor Green
                Write-Host "🌐 Application available at: http://localhost:3000" -ForegroundColor Cyan
                Write-Host "📊 Nginx proxy available at: http://localhost:80" -ForegroundColor Cyan
                
                # Show running containers
                Start-Sleep 3
                docker-compose -f docker-compose.scheduling.yml ps
            } else {
                throw "Docker compose up failed with exit code $LASTEXITCODE"
            }
        }
        
        "down" {
            Write-Host "⏹️ Stopping TekUp Job Scheduling System..." -ForegroundColor Yellow
            
            docker-compose -f docker-compose.scheduling.yml down
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Services stopped successfully!" -ForegroundColor Green
            } else {
                throw "Docker compose down failed with exit code $LASTEXITCODE"
            }
        }
        
        "logs" {
            Write-Host "📋 Showing logs for TekUp Job Scheduling System..." -ForegroundColor Yellow
            docker-compose -f docker-compose.scheduling.yml logs -f --tail=100
        }
        
        "rebuild" {
            Write-Host "🔄 Rebuilding and restarting TekUp Job Scheduling System..." -ForegroundColor Yellow
            
            # Stop services
            docker-compose -f docker-compose.scheduling.yml down
            
            # Remove old image
            docker rmi tekup-job-scheduling:latest -f 2>$null
            
            # Build new image
            docker build -t tekup-job-scheduling:latest -f apps/tekup-crm-web/Dockerfile .
            
            # Start services
            docker-compose -f docker-compose.scheduling.yml up -d --force-recreate
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ System rebuilt and restarted successfully!" -ForegroundColor Green
                Write-Host "🌐 Application available at: http://localhost:3000" -ForegroundColor Cyan
            } else {
                throw "Rebuild failed with exit code $LASTEXITCODE"
            }
        }
        
        "status" {
            Write-Host "📊 Checking TekUp Job Scheduling System status..." -ForegroundColor Yellow
            
            docker-compose -f docker-compose.scheduling.yml ps
            
            Write-Host "`n🔍 Container health checks:" -ForegroundColor Cyan
            $containers = docker ps --filter "name=tekup" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
            Write-Host $containers
            
            # Test application endpoint
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 5 -UseBasicParsing
                if ($response.StatusCode -eq 200) {
                    Write-Host "✅ Application health check: PASSED" -ForegroundColor Green
                } else {
                    Write-Host "⚠️ Application health check: FAILED (Status: $($response.StatusCode))" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "❌ Application health check: FAILED (Not reachable)" -ForegroundColor Red
            }
        }
        
        "clean" {
            Write-Host "🧹 Cleaning up Docker resources..." -ForegroundColor Yellow
            
            # Stop and remove containers
            docker-compose -f docker-compose.scheduling.yml down -v
            
            # Remove images
            docker rmi tekup-job-scheduling:latest -f 2>$null
            
            # Remove unused volumes (with confirmation)
            $confirmation = Read-Host "Remove all unused Docker volumes? (y/N)"
            if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
                docker volume prune -f
            }
            
            Write-Host "✅ Cleanup completed!" -ForegroundColor Green
        }
        
        default {
            Write-Host "❌ Unknown action: $Action" -ForegroundColor Red
            Write-Host "Available actions: build, up, down, logs, rebuild, status, clean" -ForegroundColor Yellow
            exit 1
        }
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎯 Action '$Action' completed successfully!" -ForegroundColor Green