# RenOS Calendar MCP Chatbot Starter
# Starts both MCP server and chatbot interface

Write-Host "=== RenOS Calendar MCP Chatbot ===" -ForegroundColor Magenta

# Check if MCP server is running
Write-Host "`n1. Checking MCP server status..." -ForegroundColor Yellow
try {
    $mcpHealth = Invoke-RestMethod "http://localhost:3001/health" -TimeoutSec 5
    if ($mcpHealth.status -eq "ok") {
        Write-Host "✅ MCP server is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️ MCP server is degraded" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ MCP server is not running" -ForegroundColor Red
    Write-Host "Starting MCP server..." -ForegroundColor Yellow
    
    # Start MCP server in background
    Start-Process -FilePath "npm" -ArgumentList "run", "dev:http" -WorkingDirectory "C:\Users\empir\Tekup-Cloud\renos-calendar-mcp" -WindowStyle Hidden
    
    Write-Host "⏳ Waiting for MCP server to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Check again
    try {
        $mcpHealth = Invoke-RestMethod "http://localhost:3001/health" -TimeoutSec 5
        Write-Host "✅ MCP server started successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to start MCP server" -ForegroundColor Red
        Write-Host "Please start manually: cd renos-calendar-mcp && npm run dev:http" -ForegroundColor Yellow
        exit 1
    }
}

# Install chatbot dependencies
Write-Host "`n2. Installing chatbot dependencies..." -ForegroundColor Yellow
Set-Location "C:\Users\empir\Tekup-Cloud\renos-calendar-mcp\chatbot"

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

# Start chatbot server
Write-Host "`n3. Starting chatbot server..." -ForegroundColor Yellow
Write-Host "Chatbot will be available at: http://localhost:3002" -ForegroundColor Cyan
Write-Host "MCP server running at: http://localhost:3001" -ForegroundColor Cyan

# Start chatbot
Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory "C:\Users\empir\Tekup-Cloud\renos-calendar-mcp\chatbot"

Write-Host "`n=== CHATBOT READY ===" -ForegroundColor Green
Write-Host "🌐 Open your browser and go to: http://localhost:3002" -ForegroundColor Cyan
Write-Host "💬 Start chatting with RenOS Calendar MCP!" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to stop the chatbot" -ForegroundColor Yellow

# Keep script running
Write-Host "`nChatbot is running... Press Ctrl+C to stop" -ForegroundColor Green
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Host "`nStopping chatbot..." -ForegroundColor Yellow
    exit 0
}

