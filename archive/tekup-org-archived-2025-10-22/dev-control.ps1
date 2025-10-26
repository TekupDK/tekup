# Tekup Development Environment Control Script
# Håndterer Docker services for website udvikling og testing med AI

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "restart", "status", "logs", "test", "website", "cleanup")]
    [string]$Action,
    
    [Parameter(Mandatory=$false)]
    [string]$Service = ""
)

# Farver til output
$Green = "Green"
$Yellow = "Yellow" 
$Red = "Red"
$Blue = "Blue"

function Write-Status {
    param($Message, $Color = "White")
    Write-Host "[Tekup Dev] $Message" -ForegroundColor $Color
}

function Start-TekupDev {
    Write-Status "🚀 Starter Tekup udviklingsservices..." $Blue
    
    # Stop eksisterende services først
    docker-compose -f docker-compose.dev.yml down --remove-orphans
    
    # Start grundlæggende services
    Write-Status "📦 Starter databaser og grundlæggende services..." $Yellow
    docker-compose -f docker-compose.dev.yml up postgres redis -d
    
    # Vent på databaser
    Start-Sleep -Seconds 10
    
    # Start website
    Write-Status "🌐 Starter marketing website på port 8080..." $Yellow
    docker rm -f tekup-website-dev 2>$null
    docker run -d --name tekup-website-dev -p 8080:8080 --network tekup-development-network `
        -e NODE_ENV=development -e VITE_API_URL=http://localhost:3000 -e PORT=8080 `
        -v "${PWD}/apps/website:/app" `
        tekup-website-dev
    
    Write-Status "✅ Services startet!" $Green
    Write-Status "🔗 Marketing website: http://localhost:8080" $Green
    Write-Status "🔗 PostgreSQL: localhost:5432 (tekup_dev/tekup_dev_2024)" $Green  
    Write-Status "🔗 Redis: localhost:6379" $Green
}

function Stop-TekupDev {
    Write-Status "⏹️  Stopper Tekup services..." $Yellow
    docker-compose -f docker-compose.dev.yml down --remove-orphans
    docker rm -f tekup-website-dev 2>$null
    Write-Status "✅ Services stoppet!" $Green
}

function Restart-TekupDev {
    Write-Status "🔄 Genstarter services..." $Yellow
    Stop-TekupDev
    Start-Sleep -Seconds 5
    Start-TekupDev
}

function Show-Status {
    Write-Status "📊 Service status:" $Blue
    
    # Docker containers
    Write-Host "`n🐳 Docker Containers:" -ForegroundColor $Blue
    docker ps --filter "name=tekup-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    # Port status  
    Write-Host "`n🌐 Port Status:" -ForegroundColor $Blue
    $ports = @(8080, 5432, 6379, 3002, 3003)
    foreach ($port in $ports) {
        $result = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
        $status = if ($result) { "✅ ÅBEN" } else { "❌ LUKKET" }
        Write-Host "Port $port`: $status"
    }
    
    # Website respons test
    Write-Host "`n🧪 Website Test:" -ForegroundColor $Blue
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080" -Method Head -TimeoutSec 5
        Write-Host "Marketing Website (8080): ✅ $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor $Green
    } catch {
        Write-Host "Marketing Website (8080): ❌ Ikke tilgængelig" -ForegroundColor $Red
    }
}

function Show-Logs {
    if ($Service -eq "") {
        Write-Status "📜 Viser logs for alle services..." $Blue
        docker-compose -f docker-compose.dev.yml logs --tail=50 -f
    } else {
        Write-Status "📜 Viser logs for $Service..." $Blue
        if ($Service -eq "website") {
            docker logs --tail=50 -f tekup-website-dev
        } else {
            docker-compose -f docker-compose.dev.yml logs --tail=50 -f $Service
        }
    }
}

function Test-Website {
    Write-Status "🧪 Tester marketing website..." $Blue
    
    # Grundlæggende tilgængelighed
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080" -TimeoutSec 10
        Write-Status "✅ Website svarer: $($response.StatusCode)" $Green
        
        # Tjek for Vite development server
        if ($response.Content -match "vite") {
            Write-Status "✅ Vite development server detekteret" $Green
        }
        
        # Tjek for React
        if ($response.Content -match "react") {
            Write-Status "✅ React detekteret" $Green  
        }
        
        # Tjek for Tailwind CSS
        if ($response.Content -match "tailwind") {
            Write-Status "✅ Tailwind CSS detekteret" $Green
        }
        
        Write-Status "🌐 Åbn http://localhost:8080 i din browser for at teste" $Blue
        
    } catch {
        Write-Status "❌ Website test fejlede: $($_.Exception.Message)" $Red
    }
}

function Start-WebsiteOnly {
    Write-Status "🌐 Starter kun marketing website..." $Blue
    docker rm -f tekup-website-dev 2>$null
    docker run -d --name tekup-website-dev -p 8080:8080 --network tekup-development-network `
        -e NODE_ENV=development -e VITE_API_URL=http://localhost:3000 -e PORT=8080 `
        -v "${PWD}/apps/website:/app" `
        tekup-website-dev
    Start-Sleep -Seconds 5
    Test-Website
}

function Cleanup-TekupDev {
    Write-Status "🧹 Rydder op i Docker ressourcer..." $Yellow
    docker-compose -f docker-compose.dev.yml down --volumes --remove-orphans
    docker system prune -f
    docker volume prune -f
    Write-Status "✅ Oprydning færdig!" $Green
}

# Hovedlogik
switch ($Action.ToLower()) {
    "start" { Start-TekupDev }
    "stop" { Stop-TekupDev }
    "restart" { Restart-TekupDev }  
    "status" { Show-Status }
    "logs" { Show-Logs }
    "test" { Test-Website }
    "website" { Start-WebsiteOnly }
    "cleanup" { Cleanup-TekupDev }
    default { 
        Write-Status "❌ Ugyldig handling: $Action" $Red
        Write-Status "Tilgængelige handlinger: start, stop, restart, status, logs, test, website, cleanup" $Yellow
    }
}