# RenOS Calendar MCP Server Starter
# Starts the MCP server for chatbot communication

Write-Host "=== RenOS Calendar MCP Server ===" -ForegroundColor Magenta

# Check if already running
Write-Host "`n1. Checking if MCP server is already running..." -ForegroundColor Yellow
try {
    $mcpHealth = Invoke-RestMethod "http://localhost:3001/health" -TimeoutSec 5
    if ($mcpHealth.status -eq "ok") {
        Write-Host "✅ MCP server is already running" -ForegroundColor Green
        Write-Host "Server status: $($mcpHealth.status)" -ForegroundColor Cyan
        Write-Host "Available tools: $($mcpHealth.tools)" -ForegroundColor Cyan
        exit 0
    }
} catch {
    Write-Host "MCP server is not running, starting..." -ForegroundColor Yellow
}

# Navigate to project directory
Set-Location "C:\Users\empir\Tekup-Cloud\renos-calendar-mcp"

# Build TypeScript
Write-Host "`n2. Building TypeScript..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful" -ForegroundColor Green

# Start MCP server
Write-Host "`n3. Starting MCP server..." -ForegroundColor Yellow
Write-Host "MCP server will be available at: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Health check: http://localhost:3001/health" -ForegroundColor Cyan
Write-Host "Tools: http://localhost:3001/api/v1/tools" -ForegroundColor Cyan

Write-Host "`n=== MCP SERVER STARTING ===" -ForegroundColor Green
Write-Host "Server is starting... This may take a few seconds" -ForegroundColor Yellow
Write-Host "`nPress Ctrl+C to stop the server" -ForegroundColor Yellow

# Start server
npm run dev:http

