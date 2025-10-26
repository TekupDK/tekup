# TekUp Lead Platform Development Automation Script
# This script manages the development environment for the Lead Platform

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "test", "mcp", "status")]
    [string]$Action = "start",
    
    [Parameter()]
    [switch]$Backend,
    
    [Parameter()]
    [switch]$Frontend,
    
    [Parameter()]
    [switch]$MCP,
    
    [Parameter()]
    [switch]$All
)

$ErrorActionPreference = "Stop"

# Configuration
$LEAD_BACKEND_DIR = "C:\Users\empir\Tekup-org\apps\tekup-lead-platform"
$LEAD_FRONTEND_DIR = "C:\Users\empir\Tekup-org\apps\tekup-lead-platform-web"
$MCP_SERVER_DIR = "C:\Users\empir\Tekup-org"

# Colors for output
$ColorInfo = "Cyan"
$ColorSuccess = "Green" 
$ColorWarning = "Yellow"
$ColorError = "Red"

function Write-Info { param($Message) Write-Host $Message -ForegroundColor $ColorInfo }
function Write-Success { param($Message) Write-Host $Message -ForegroundColor $ColorSuccess }
function Write-Warning { param($Message) Write-Host $Message -ForegroundColor $ColorWarning }
function Write-Error { param($Message) Write-Host $Message -ForegroundColor $ColorError }

function Test-Port {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $Port -WarningAction SilentlyContinue
        return $connection.TcpTestSucceeded
    } catch {
        return $false
    }
}

function Stop-ProcessByPort {
    param([int]$Port)
    $processId = (Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue).OwningProcess
    if ($processId) {
        Write-Info "Stopping process on port $Port (PID: $processId)"
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}

function Start-LeadBackend {
    Write-Info "🚀 Starting Lead Platform Backend..."
    
    if (Test-Port 3003) {
        Write-Warning "Backend already running on port 3003"
        return
    }
    
    Push-Location $LEAD_BACKEND_DIR
    try {
        Write-Info "Building shared dependencies..."
        pnpm --filter @tekup/shared build
        pnpm --filter @tekup/config build
        
        Write-Info "Starting backend server..."
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$LEAD_BACKEND_DIR'; pnpm dev" -WindowStyle Minimized
        
        # Wait for service to start
        $timeout = 30
        $elapsed = 0
        while (-not (Test-Port 3003) -and $elapsed -lt $timeout) {
            Start-Sleep -Seconds 1
            $elapsed++
        }
        
        if (Test-Port 3003) {
            Write-Success "✅ Lead Platform Backend started on http://localhost:3003"
            Write-Info "📚 API Documentation: http://localhost:3003/api"
        } else {
            Write-Error "❌ Failed to start backend within $timeout seconds"
        }
    } finally {
        Pop-Location
    }
}

function Start-LeadFrontend {
    Write-Info "🎨 Starting Lead Platform Frontend..."
    
    if (Test-Port 3002) {
        Write-Warning "Frontend already running on port 3002"
        return
    }
    
    Push-Location $LEAD_FRONTEND_DIR
    try {
        Write-Info "Starting frontend server..."
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$LEAD_FRONTEND_DIR'; pnpm dev" -WindowStyle Minimized
        
        # Wait for service to start
        $timeout = 45
        $elapsed = 0
        while (-not (Test-Port 3002) -and $elapsed -lt $timeout) {
            Start-Sleep -Seconds 1
            $elapsed++
        }
        
        if (Test-Port 3002) {
            Write-Success "✅ Lead Platform Frontend started on http://localhost:3002"
        } else {
            Write-Error "❌ Failed to start frontend within $timeout seconds"
        }
    } finally {
        Pop-Location
    }
}

function Start-MCPServer {
    Write-Info "🔧 Starting MCP Browser Server..."
    
    # Check if MCP Inspector is available
    $mcpInspector = Get-Command "mcp-inspector" -ErrorAction SilentlyContinue
    if (-not $mcpInspector) {
        Write-Warning "MCP Inspector not found. Installing..."
        npm install -g @modelcontextprotocol/inspector
    }
    
    # Start MCP server with browser automation
    Push-Location $MCP_SERVER_DIR
    try {
        Write-Info "Starting MCP Inspector with browser server..."
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "mcp-inspector -- npx --yes @agent-infra/mcp-server-browser" -WindowStyle Normal
        Write-Success "✅ MCP Browser Server started - check the opened window"
    } finally {
        Pop-Location
    }
}

function Stop-Services {
    Write-Info "🛑 Stopping Lead Platform services..."
    
    # Stop services by port
    if (Test-Port 3003) {
        Write-Info "Stopping backend (port 3003)..."
        Stop-ProcessByPort 3003
    }
    
    if (Test-Port 3002) {
        Write-Info "Stopping frontend (port 3002)..."
        Stop-ProcessByPort 3002
    }
    
    # Stop any remaining node processes related to Tekup
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*tekup*" -or $_.CommandLine -like "*lead-platform*"
    }
    
    foreach ($process in $nodeProcesses) {
        Write-Info "Stopping Node process: $($process.Id)"
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    
    Write-Success "✅ Services stopped"
}

function Show-Status {
    Write-Info "📊 Lead Platform Status:"
    Write-Host ""
    
    # Backend status
    if (Test-Port 3003) {
        Write-Success "✅ Backend: Running on http://localhost:3003"
    } else {
        Write-Error "❌ Backend: Not running"
    }
    
    # Frontend status  
    if (Test-Port 3002) {
        Write-Success "✅ Frontend: Running on http://localhost:3002"  
    } else {
        Write-Error "❌ Frontend: Not running"
    }
    
    # Show running processes
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Info ""
        Write-Info "Node.js processes:"
        $nodeProcesses | Select-Object Id, @{Name="CPU%";Expression={[math]::Round($_.CPU,2)}}, WorkingSet | Format-Table -AutoSize
    }
}

function Run-Tests {
    Write-Info "🧪 Running Lead Platform Tests..."
    
    Push-Location $LEAD_BACKEND_DIR
    try {
        Write-Info "Running backend tests..."
        pnpm test
    } finally {
        Pop-Location
    }
    
    Push-Location $LEAD_FRONTEND_DIR  
    try {
        Write-Info "Running frontend tests..."
        pnpm test
    } finally {
        Pop-Location
    }
}

# Main execution
Write-Host "🏢 TekUp Lead Platform Development Tool" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

switch ($Action) {
    "start" {
        if ($All -or (-not $Backend -and -not $Frontend -and -not $MCP)) {
            Start-LeadBackend
            Start-LeadFrontend
            if ($MCP) { Start-MCPServer }
        } else {
            if ($Backend) { Start-LeadBackend }
            if ($Frontend) { Start-LeadFrontend }  
            if ($MCP) { Start-MCPServer }
        }
        
        Start-Sleep -Seconds 2
        Show-Status
    }
    
    "stop" {
        Stop-Services
    }
    
    "restart" {
        Stop-Services
        Start-Sleep -Seconds 3
        Start-LeadBackend
        Start-LeadFrontend
        Show-Status
    }
    
    "status" {
        Show-Status
    }
    
    "test" {
        Run-Tests
    }
    
    "mcp" {
        Start-MCPServer
    }
}

Write-Host ""
Write-Info "Usage examples:"
Write-Host "  .\dev-lead-platform.ps1 start -All      # Start everything"
Write-Host "  .\dev-lead-platform.ps1 start -Backend  # Start only backend"
Write-Host "  .\dev-lead-platform.ps1 start -Frontend # Start only frontend"
Write-Host "  .\dev-lead-platform.ps1 mcp             # Start MCP browser server"
Write-Host "  .\dev-lead-platform.ps1 status          # Show service status"
Write-Host "  .\dev-lead-platform.ps1 stop            # Stop all services"
