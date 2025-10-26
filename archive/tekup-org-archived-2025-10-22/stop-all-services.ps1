# Stop All Tekup Services

Write-Host "Stopping all Tekup services..." -ForegroundColor Yellow

# Stop Node.js processes (Tekup Platform and Jarvis Frontend)
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Stopping Node.js processes..." -ForegroundColor Red
    $nodeProcesses | Stop-Process -Force
    Write-Host "Node.js processes stopped." -ForegroundColor Green
} else {
    Write-Host "No Node.js processes found." -ForegroundColor Yellow
}

# Stop Python processes (AgentScope Backend)
$pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue
if ($pythonProcesses) {
    Write-Host "Stopping Python processes..." -ForegroundColor Red
    $pythonProcesses | Stop-Process -Force
    Write-Host "Python processes stopped." -ForegroundColor Green
} else {
    Write-Host "No Python processes found." -ForegroundColor Yellow
}

Write-Host "`nAll services have been stopped." -ForegroundColor Green
