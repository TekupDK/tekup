# Rendetalje Development Startup Script (Windows PowerShell)
# Supports Windows PowerShell and PowerShell Core

param(
    [Parameter(HelpMessage="Start with local PostgreSQL (default)")]
    [switch]$Local,
    
    [Parameter(HelpMessage="Start with Supabase cloud database")]
    [switch]$Cloud,
    
    [Parameter(HelpMessage="Stop all services")]
    [switch]$Stop,
    
    [Parameter(HelpMessage="Restart all services")]
    [switch]$Restart,
    
    [Parameter(HelpMessage="Show service logs")]
    [switch]$Logs,
    
    [Parameter(HelpMessage="Show service status")]
    [switch]$Status,
    
    [Parameter(HelpMessage="Rebuild and start services")]
    [switch]$Build,
    
    [Parameter(HelpMessage="Clean up containers and volumes")]
    [switch]$Clean,
    
    [Parameter(HelpMessage="Start only MCP server")]
    [switch]$McpOnly,
    
    [Parameter(HelpMessage="Open pgAdmin4 in browser")]
    [switch]$PgAdmin,
    
    [Parameter(HelpMessage="Show help message")]
    [switch]$Help
)

# Configuration
$ProjectName = "rendetalje"
$DefaultMode = "local"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$DockerComposeFile = "..\docker-compose.yml"

# Functions
function Write-LogInfo {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-LogSuccess {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-LogWarning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-LogError {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Show-Help {
    Write-Host "Rendetalje Development Server Startup Script (Windows)"
    Write-Host ""
    Write-Host "Usage: .\start.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Local      Start with local PostgreSQL (default)"
    Write-Host "  -Cloud      Start with Supabase cloud database"
    Write-Host "  -Stop       Stop all services"
    Write-Host "  -Restart    Restart all services"
    Write-Host "  -Logs       Show service logs"
    Write-Host "  -Status     Show service status"
    Write-Host "  -Build      Rebuild and start services"
    Write-Host "  -Clean      Clean up containers and volumes"
    Write-Host "  -McpOnly    Start only MCP server"
    Write-Host "  -PgAdmin    Open pgAdmin4 in browser"
    Write-Host "  -Help       Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\start.ps1 -Local    # Start with local database"
    Write-Host "  .\start.ps1 -Cloud    # Start with cloud database"
    Write-Host "  .\start.ps1 -Stop     # Stop all services"
    Write-Host "  .\start.ps1 -PgAdmin  # Open pgAdmin4 in browser"
}

function Test-Dependencies {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-LogError "Docker is not installed or not in PATH"
        exit 1
    }

    $dockerComposeAvailable = $false
    if (Get-Command "docker" -ErrorAction SilentlyContinue) {
        $dockerVersion = docker --version
        if ($dockerVersion -match "Docker version") {
            try {
                $composeCheck = docker compose version
                if ($composeCheck -match "Docker Compose") {
                    $dockerComposeAvailable = $true
                }
            } catch {
                # Fall back to docker-compose
                try {
                    $composeCheck = docker-compose --version
                    if ($composeCheck -match "docker-compose") {
                        $dockerComposeAvailable = $true
                    }
                } catch {
                    # Neither docker compose nor docker-compose available
                }
            }
        }
    }

    if (-not $dockerComposeAvailable) {
        Write-LogError "Docker Compose is not installed or not in PATH"
        exit 1
    }
}

function Start-Services {
    param(
        [string]$Mode = $DefaultMode
    )
    
    Write-LogInfo "Starting Rendetalje development environment (mode: $Mode)"
    
    # Set environment based on mode
    $env:DATABASE_MODE = $Mode
    $env:RENDER_DATABASE_MODE = $Mode
    
    if ($Mode -eq "local") {
        Write-LogInfo "Using local PostgreSQL database"
    } else {
        Write-LogInfo "Using Supabase cloud database"
    }
    
    # Start services
    try {
        docker compose -f $DockerComposeFile up -d
    } catch {
        # Fall back to docker-compose
        docker-compose -f $DockerComposeFile up -d
    }
    
    Write-LogSuccess "Services started successfully!"
    
    # Wait for services to be healthy
    Start-Sleep -Seconds 5
    
    # Show status
    Show-Status
}

function Stop-Services {
    Write-LogInfo "Stopping all Rendetalje services..."
    
    try {
        docker compose -f $DockerComposeFile down
    } catch {
        # Fall back to docker-compose
        docker-compose -f $DockerComposeFile down
    }
    
    Write-LogSuccess "All services stopped"
}

function Restart-Services {
    param(
        [string]$Mode = $DefaultMode
    )
    
    Write-LogInfo "Restarting Rendetalje services (mode: $Mode)"
    Stop-Services
    Start-Sleep -Seconds 2
    Start-Services $Mode
}

function Show-Logs {
    param(
        [string]$Service = ""
    )
    
    if ($Service) {
        try {
            docker compose -f $DockerComposeFile logs -f $Service
        } catch {
            docker-compose -f $DockerComposeFile logs -f $Service
        }
    } else {
        try {
            docker compose -f $DockerComposeFile logs -f
        } catch {
            docker-compose -f $DockerComposeFile logs -f
        }
    }
}

function Show-Status {
    Write-LogInfo "Rendetalje Development Environment Status:"
    Write-Host ""
    
    # Check Docker containers
    try {
        docker compose -f $DockerComposeFile ps
    } catch {
        docker-compose -f $DockerComposeFile ps
    }
    
    Write-Host ""
    Write-LogInfo "Access Points:"
    Write-Host "  - Backend API:     http://localhost:3001"
    Write-Host "  - Frontend App:    http://localhost:3002"
    Write-Host "  - pgAdmin4:        http://localhost:5050"
    Write-Host "  - MCP Server:      http://localhost:3003"
    Write-Host "  - PostgreSQL:      localhost:5432"
    Write-Host "  - Redis:           localhost:6379"
    Write-Host ""
    
    if ($env:DATABASE_MODE -eq "local") {
        Write-LogInfo "Database: Local PostgreSQL"
        Write-Host "  pgAdmin4 Login:"
        Write-Host "    Email: admin@rendetalje.dk"
        Write-Host "    Password: admin123"
    } else {
        Write-LogInfo "Database: Supabase Cloud"
    }
}

function Build-Services {
    Write-LogInfo "Building and starting all services..."
    
    try {
        docker compose -f $DockerComposeFile up -d --build
    } catch {
        # Fall back to docker-compose
        docker-compose -f $DockerComposeFile up -d --build
    }
    
    Write-LogSuccess "Services built and started successfully!"
    Show-Status
}

function Clean-Services {
    Write-LogWarning "This will remove all containers, volumes, and networks!"
    $response = Read-Host "Are you sure? (y/N)"
    
    if ($response -eq "y" -or $response -eq "Y") {
        Write-LogInfo "Cleaning up Docker resources..."
        
        try {
            docker compose -f $DockerComposeFile down -v --remove-orphans
            docker compose -f $DockerComposeFile rm -f
        } catch {
            docker-compose -f $DockerComposeFile down -v --remove-orphans
            docker-compose -f $DockerComposeFile rm -f
        }
        
        # Remove dangling images
        try {
            docker image prune -f | Out-Null
        } catch {
            # Ignore errors during cleanup
        }
        
        Write-LogSuccess "Cleanup completed"
    } else {
        Write-LogInfo "Cleanup cancelled"
    }
}

function Start-McpOnly {
    Write-LogInfo "Starting only MCP server..."
    
    try {
        docker compose -f $DockerComposeFile up -d mcp
    } catch {
        docker-compose -f $DockerComposeFile up -d mcp
    }
    
    Write-LogSuccess "MCP server started on http://localhost:3003"
}

function Open-PgAdmin {
    Write-LogInfo "Opening pgAdmin4 in default browser..."
    
    try {
        Start-Process "http://localhost:5050"
        Write-LogSuccess "pgAdmin4 opened in browser"
    } catch {
        Write-LogInfo "Please open http://localhost:5050 in your browser"
        Write-LogInfo "Login: admin@rendetalje.dk / admin123"
    }
}

# Main script logic
function Main {
    Test-Dependencies
    
    Set-Location $ScriptDir
    
    # Handle PowerShell parameter binding
    $selectedMode = $DefaultMode
    $action = ""
    
    if ($PSBoundParameters.Count -eq 0) {
        # No parameters provided, use default
        $action = "start"
        $selectedMode = $DefaultMode
    } elseif ($Local) {
        $action = "start"
        $selectedMode = "local"
    } elseif ($Cloud) {
        $action = "start"
        $selectedMode = "cloud"
    } elseif ($Stop) {
        $action = "stop"
    } elseif ($Restart) {
        $action = "restart"
    } elseif ($Logs) {
        $action = "logs"
    } elseif ($Status) {
        $action = "status"
    } elseif ($Build) {
        $action = "build"
    } elseif ($Clean) {
        $action = "clean"
    } elseif ($McpOnly) {
        $action = "mcp-only"
    } elseif ($PgAdmin) {
        $action = "pgadmin"
    } elseif ($Help) {
        $action = "help"
    }
    
    switch ($action) {
        "start" {
            Start-Services $selectedMode
        }
        "stop" {
            Stop-Services
        }
        "restart" {
            Restart-Services $selectedMode
        }
        "logs" {
            Show-Logs
        }
        "status" {
            Show-Status
        }
        "build" {
            Build-Services
        }
        "clean" {
            Clean-Services
        }
        "mcp-only" {
            Start-McpOnly
        }
        "pgadmin" {
            Open-PgAdmin
        }
        "help" {
            Show-Help
        }
        default {
            Write-LogError "Unknown action or no valid parameters provided"
            Show-Help
            exit 1
        }
    }
}

# Run main function
Main