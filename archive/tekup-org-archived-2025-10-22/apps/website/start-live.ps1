# 🚀 TekUp Simple Live Editing Starter
Write-Host "🚀 Starting TekUp Live Editing..." -ForegroundColor Cyan

# Start dev server in new window
Write-Host "🔧 Starting development server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

# Wait a moment for server to start
Write-Host "⏳ Waiting for server..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Open browser to playground
Write-Host "🌐 Opening Live Editing Playground..." -ForegroundColor Green
try {
    Start-Process "http://localhost:8081/playground"
    Write-Host "✅ Playground opened!" -ForegroundColor Green
} catch {
    Write-Host "📱 Opening main website..." -ForegroundColor Yellow
    Start-Process "http://localhost:8081"
}

# Open VS Code with key files
Write-Host "📝 Opening VS Code..." -ForegroundColor Green
try {
    & code . "src/index.css" "src/App.tsx"
    Write-Host "✅ VS Code opened!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ VS Code not found - you can open it manually" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 LIVE EDITING READY!" -ForegroundColor Magenta
Write-Host "===================" -ForegroundColor Magenta
Write-Host "🔥 HOT RELOAD: Save files → Instant changes" -ForegroundColor Yellow
Write-Host "🎨 PLAYGROUND: /playground for CSS testing" -ForegroundColor Yellow
Write-Host "🛠️ DEVTOOLS: F12 → Elements for live CSS" -ForegroundColor Yellow
Write-Host ""
Write-Host "📁 KEY FILES:" -ForegroundColor Cyan
Write-Host "• src/index.css → Global styles" -ForegroundColor White
Write-Host "• src/App.tsx → Main app" -ForegroundColor White
Write-Host "• src/components/ → Components" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Happy Live Editing!" -ForegroundColor Green