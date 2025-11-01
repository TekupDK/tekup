# Friday AI Server Starter
# Run this script to start the server for TestSprite testing

Write-Host "🚀 Starting Friday AI Server..." -ForegroundColor Green
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "✅ Starting server on port 3011..." -ForegroundColor Green
Write-Host "   URL: http://localhost:3011" -ForegroundColor Cyan
Write-Host "   Health Check: http://localhost:3011/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Keep this window open while testing!" -ForegroundColor Yellow
Write-Host ""

npm run dev

