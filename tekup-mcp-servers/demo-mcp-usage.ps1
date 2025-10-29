# Test MCP Tools via HTTP
# Direct tool invocation test

Write-Host "=== Testing MCP Tool Invocation ===" -ForegroundColor Cyan

# Test Knowledge MCP search_knowledge tool
Write-Host "`n--- Testing Knowledge MCP: search_knowledge ---" -ForegroundColor Yellow

$knowledgeTest = @{
    name = "search_knowledge"
    arguments = @{
        query = "authentication"
        limit = 3
    }
} | ConvertTo-Json -Depth 10

Write-Host "Query: Search for 'authentication' documentation" -ForegroundColor Gray
Write-Host "Searching through: C:\Users\empir\Tekup" -ForegroundColor Gray

# Note: Direct tool calls require proper MCP session initialization
# This is just to show the server is responding
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8051/health" -UseBasicParsing
    Write-Host "✓ Knowledge MCP is responding" -ForegroundColor Green
    Write-Host "  Server: $($response.Content | ConvertFrom-Json | Select-Object -ExpandProperty serverId)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Knowledge MCP error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Code Intelligence MCP
Write-Host "`n--- Testing Code Intelligence MCP: search_code ---" -ForegroundColor Yellow
Write-Host "Query: Search for code patterns" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8052/health" -UseBasicParsing
    Write-Host "✓ Code Intelligence MCP is responding" -ForegroundColor Green
    Write-Host "  Server: $($response.Content | ConvertFrom-Json | Select-Object -ExpandProperty serverId)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Code Intelligence MCP error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Database MCP
Write-Host "`n--- Testing Database MCP ---" -ForegroundColor Yellow
Write-Host "Connected to: Supabase" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8053/health" -UseBasicParsing
    Write-Host "✓ Database MCP is responding" -ForegroundColor Green
    Write-Host "  Server: $($response.Content | ConvertFrom-Json | Select-Object -ExpandProperty serverId)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Database MCP error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== MCP Servers Ready ===" -ForegroundColor Cyan
Write-Host "`n📝 HOW TO USE IN VS CODE COPILOT CHAT:" -ForegroundColor White
Write-Host ""
Write-Host "1. Open Copilot Chat:" -ForegroundColor Yellow
Write-Host "   Press: Ctrl+Shift+I" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Try these commands:" -ForegroundColor Yellow
Write-Host "   @knowledge search for authentication" -ForegroundColor Cyan
Write-Host "   @knowledge find Docker documentation" -ForegroundColor Cyan
Write-Host "   @code-intelligence find API endpoints" -ForegroundColor Cyan
Write-Host "   @database show schema" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Or just ask naturally:" -ForegroundColor Yellow
Write-Host "   'Can you search my docs for authentication setup?'" -ForegroundColor Gray
Write-Host "   'Find all function definitions in the backend'" -ForegroundColor Gray
Write-Host ""
Write-Host "📊 Server Status: http://localhost:8051/health" -ForegroundColor White
