# Tekup Development Environment Control Script
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "restart", "status", "logs", "test", "website", "cleanup")]
    [string]$Action,
    
    [Parameter(Mandatory=$false)]
    [string]$Service = ""
)

function Write-TekupStatus {
    param($Message, $Color = "White")
    Write-Host "[Tekup Dev] $Message" -ForegroundColor $Color
}

function Start-TekupServices {
    Write-TekupStatus "Starting Tekup development services..." "Blue"
    
    # Stop existing services first
    docker-compose -f docker-compose.dev.yml down --remove-orphans
    
    # Start basic services
    Write-TekupStatus "Starting databases..." "Yellow"
    docker-compose -f docker-compose.dev.yml up postgres redis -d
    
    # Wait for databases
    Start-Sleep -Seconds 10
    
    # Start website
    Write-TekupStatus "Starting marketing website on port 8080..." "Yellow"
    docker rm -f tekup-website-dev 2>$null
    docker run -d --name tekup-website-dev -p 8080:8080 --network tekup-development-network -e NODE_ENV=development -e VITE_API_URL=http://localhost:3000 -e PORT=8080 -v "${PWD}/apps/website:/app" tekup-website-dev
    
    Write-TekupStatus "Services started!" "Green"
    Write-TekupStatus "Marketing website: http://localhost:8080" "Green"
    Write-TekupStatus "PostgreSQL: localhost:5432" "Green"  
    Write-TekupStatus "Redis: localhost:6379" "Green"
}

function Stop-TekupServices {
    Write-TekupStatus "Stopping Tekup services..." "Yellow"
    docker-compose -f docker-compose.dev.yml down --remove-orphans
    docker rm -f tekup-website-dev 2>$null
    Write-TekupStatus "Services stopped!" "Green"
}

function Show-TekupStatus {
    Write-TekupStatus "Service status:" "Blue"
    
    # Docker containers
    Write-Host "`nDocker Containers:" -ForegroundColor "Blue"
    docker ps --filter "name=tekup-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    # Port status  
    Write-Host "`nPort Status:" -ForegroundColor "Blue"
    $ports = @(8080, 5432, 6379, 3002, 3003)
    foreach ($port in $ports) {
        $result = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
        $status = if ($result) { "OPEN" } else { "CLOSED" }
        Write-Host "Port ${port}: $status"
    }
    
    # Website response test
    Write-Host "`nWebsite Test:" -ForegroundColor "Blue"
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080" -Method Head -TimeoutSec 5
        Write-Host "Marketing Website (8080): OK - $($response.StatusCode)" -ForegroundColor "Green"
    } catch {
        Write-Host "Marketing Website (8080): ERROR - Not available" -ForegroundColor "Red"
    }
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3002" -Method Head -TimeoutSec 5
        Write-Host "Lead Platform Web (3002): OK - $($response.StatusCode)" -ForegroundColor "Green"
    } catch {
        Write-Host "Lead Platform Web (3002): ERROR - Not available" -ForegroundColor "Red"
    }
}

function Test-TekupWebsite {
    Write-TekupStatus "Testing marketing website..." "Blue"
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080" -TimeoutSec 10
        Write-TekupStatus "Website responds: $($response.StatusCode)" "Green"
        
        if ($response.Content -match "vite") {
            Write-TekupStatus "Vite development server detected" "Green"
        }
        
        if ($response.Content -match "react") {
            Write-TekupStatus "React detected" "Green"  
        }
        
        Write-TekupStatus "Open http://localhost:8080 in your browser" "Blue"
        
    } catch {
        Write-TekupStatus "Website test failed: $($_.Exception.Message)" "Red"
    }
}

# Main logic
switch ($Action.ToLower()) {
    "start" { Start-TekupServices }
    "stop" { Stop-TekupServices }
    "restart" { 
        Stop-TekupServices
        Start-Sleep -Seconds 5
        Start-TekupServices 
    }
    "status" { Show-TekupStatus }
    "logs" { 
        if ($Service -eq "website") {
            docker logs --tail=50 -f tekup-website-dev
        } else {
            docker-compose -f docker-compose.dev.yml logs --tail=50 -f
        }
    }
    "test" { Test-TekupWebsite }
    "website" { 
        Write-TekupStatus "Starting website only..." "Blue"
        docker rm -f tekup-website-dev 2>$null
        docker run -d --name tekup-website-dev -p 8080:8080 --network tekup-development-network -e NODE_ENV=development -e VITE_API_URL=http://localhost:3000 -e PORT=8080 -v "${PWD}/apps/website:/app" tekup-website-dev
        Start-Sleep -Seconds 5
        Test-TekupWebsite
    }
    "cleanup" { 
        Write-TekupStatus "Cleaning up Docker resources..." "Yellow"
        docker-compose -f docker-compose.dev.yml down --volumes --remove-orphans
        docker system prune -f
        docker volume prune -f
        Write-TekupStatus "Cleanup complete!" "Green"
    }
    default { 
        Write-TekupStatus "Invalid action: $Action" "Red"
        Write-TekupStatus "Available actions: start, stop, restart, status, logs, test, website, cleanup" "Yellow"
    }
}