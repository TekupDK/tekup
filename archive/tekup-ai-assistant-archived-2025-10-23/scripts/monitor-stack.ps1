Write-Host ""
Write-Host "TekUp Stack Monitor" -ForegroundColor Magenta
Write-Host ""

Write-Host "Ollama Server:" -ForegroundColor Cyan
try {
    $Response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($Response.StatusCode -eq 200) {
        Write-Host "   [OK] Ollama is running" -ForegroundColor Green
    }
} catch {
    Write-Host "   [ERROR] Ollama not responding" -ForegroundColor Red
}

Write-Host ""
Write-Host "Open WebUI:" -ForegroundColor Cyan
try {
    $Response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($Response.StatusCode -eq 200) {
        Write-Host "   [OK] Open WebUI is running" -ForegroundColor Green
    }
} catch {
    Write-Host "   [ERROR] Open WebUI not responding" -ForegroundColor Red
}

Write-Host ""
Write-Host "Docker Container:" -ForegroundColor Cyan
try {
    $Container = docker ps --filter "name=open-webui" --format "table {{.Names}} {{.Status}}" 2>$null
    if ($Container) {
        Write-Host "   [OK] Container is running" -ForegroundColor Green
        Write-Host "   $Container" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] Container is not running" -ForegroundColor Red
    }
} catch {
    Write-Host "   [ERROR] Docker not accessible" -ForegroundColor Red
}

Write-Host ""
Write-Host "Done" -ForegroundColor Cyan
Write-Host ""
