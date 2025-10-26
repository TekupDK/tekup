# Start All Tekup Services in Background

Write-Host "Starting Tekup Unified Platform services..." -ForegroundColor Green

# Change to unified platform directory
Set-Location "C:\Users\empir\Tekup-org\apps\tekup-unified-platform"

# Seed the database first
Write-Host "Seeding test tenant..." -ForegroundColor Yellow
node seed-test-tenant.js

# Start Tekup Unified Platform in background
Write-Host "Starting Tekup Unified Platform..." -ForegroundColor Yellow
Start-Process -WindowStyle Minimized -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "C:\Users\empir\Tekup-org\apps\tekup-unified-platform"

# Start AgentScope backend in background
Write-Host "Starting AgentScope Backend..." -ForegroundColor Yellow
Start-Process -WindowStyle Minimized -FilePath "python" -ArgumentList "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload" -WorkingDirectory "C:\Users\empir\Tekup-org\apps\agentscope-backend"

# Start Jarvis frontend in background
Write-Host "Starting Jarvis Frontend..." -ForegroundColor Yellow
Start-Process -WindowStyle Minimized -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "C:\Users\empir\Tekup-org\apps\jarvis-frontend"

Write-Host "`nAll services are starting in the background!" -ForegroundColor Green
Write-Host "Services will be available at:" -ForegroundColor Cyan
Write-Host "  - Tekup Unified Platform: http://localhost:3000" -ForegroundColor White
Write-Host "  - AgentScope Backend: http://localhost:8000" -ForegroundColor White  
Write-Host "  - Jarvis Frontend: http://localhost:3001" -ForegroundColor White

Write-Host "`nYou can now continue working while the services are starting up." -ForegroundColor Green
