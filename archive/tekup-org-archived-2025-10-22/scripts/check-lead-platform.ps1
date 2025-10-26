# Simple Lead Platform Status Check
param(
    [Parameter()]
    [ValidateSet("status", "test", "start-backend", "start-frontend")]
    [string]$Action = "status"
)

function Test-Port {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $Port -WarningAction SilentlyContinue
        return $connection.TcpTestSucceeded
    } catch {
        return $false
    }
}

function Show-Status {
    Write-Host "Lead Platform Status Check" -ForegroundColor Green
    Write-Host "=========================="
    
    # Check backend
    if (Test-Port 3003) {
        Write-Host "[OK] Backend running on port 3003" -ForegroundColor Green
        Write-Host "     API Docs: http://localhost:3003/api"
    } else {
        Write-Host "[FAIL] Backend not running on port 3003" -ForegroundColor Red
    }
    
    # Check frontend
    if (Test-Port 3002) {
        Write-Host "[OK] Frontend running on port 3002" -ForegroundColor Green
        Write-Host "     URL: http://localhost:3002"
    } else {
        Write-Host "[FAIL] Frontend not running on port 3002" -ForegroundColor Red
    }
    
    # Show Node processes
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Host "`nNode.js processes: $($nodeProcesses.Count)"
    }
}

function Test-API {
    Write-Host "Testing API endpoints..." -ForegroundColor Yellow
    
    try {
        $headers = @{ 'x-tenant-key' = 'test-tenant' }
        $response = Invoke-RestMethod -Uri "http://localhost:3003/qualification/stats" -Method Get -Headers $headers -TimeoutSec 10
        
        if ($response -and $response.total -ge 0) {
            Write-Host "[OK] API responding - Stats: Total=$($response.total), Qualified=$($response.qualified)" -ForegroundColor Green
        } else {
            Write-Host "[FAIL] API not responding correctly" -ForegroundColor Red
        }
    } catch {
        Write-Host "[FAIL] API error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Start-Backend {
    Write-Host "Starting Lead Platform Backend..." -ForegroundColor Yellow
    
    if (Test-Port 3003) {
        Write-Host "Backend already running" -ForegroundColor Yellow
        return
    }
    
    $backendDir = "C:\Users\empir\Tekup-org\apps\tekup-lead-platform"
    Write-Host "Starting backend process..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; pnpm dev" -WindowStyle Minimized
    
    Write-Host "Waiting for backend to start..."
    $timeout = 30
    $elapsed = 0
    while (-not (Test-Port 3003) -and $elapsed -lt $timeout) {
        Start-Sleep -Seconds 2
        $elapsed += 2
        Write-Host "." -NoNewline
    }
    Write-Host ""
    
    if (Test-Port 3003) {
        Write-Host "[OK] Backend started on http://localhost:3003" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Backend failed to start within $timeout seconds" -ForegroundColor Red
    }
}

function Start-Frontend {
    Write-Host "Starting Lead Platform Frontend..." -ForegroundColor Yellow
    
    if (Test-Port 3002) {
        Write-Host "Frontend already running" -ForegroundColor Yellow
        return
    }
    
    $frontendDir = "C:\Users\empir\Tekup-org\apps\tekup-lead-platform-web"
    Write-Host "Starting frontend process..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; pnpm dev" -WindowStyle Minimized
    
    Write-Host "Waiting for frontend to start..."
    $timeout = 45
    $elapsed = 0
    while (-not (Test-Port 3002) -and $elapsed -lt $timeout) {
        Start-Sleep -Seconds 2
        $elapsed += 2
        Write-Host "." -NoNewline
    }
    Write-Host ""
    
    if (Test-Port 3002) {
        Write-Host "[OK] Frontend started on http://localhost:3002" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Frontend failed to start within $timeout seconds" -ForegroundColor Red
    }
}

# Execute based on action
switch ($Action) {
    "status" { Show-Status }
    "test" { 
        Show-Status
        if (Test-Port 3003) { Test-API }
    }
    "start-backend" { Start-Backend }
    "start-frontend" { Start-Frontend }
}

Write-Host "`nUsage: .\check-lead-platform.ps1 [status|test|start-backend|start-frontend]"
