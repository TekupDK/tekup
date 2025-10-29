# Test MCP Server Connectivity
# Tests health endpoints and basic MCP protocol for all running servers

Write-Host "`n=== Testing Tekup MCP Servers ===" -ForegroundColor Cyan

$servers = @(
    @{Name="Knowledge MCP"; Port=8051; Tool="search_knowledge"}
    @{Name="Code Intelligence MCP"; Port=8052; Tool="search_code"}
    @{Name="Database MCP"; Port=8053; Tool="query_database"}
)

foreach ($server in $servers) {
    Write-Host "`n--- Testing $($server.Name) on port $($server.Port) ---" -ForegroundColor Yellow
    
    # Test health endpoint
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:$($server.Port)/health" -Method GET -TimeoutSec 3
        Write-Host "✓ Health check: " -NoNewline -ForegroundColor Green
        Write-Host "Status=$($health.status), Uptime=$([math]::Round($health.metrics.uptime, 2))s"
    }
    catch {
        Write-Host "✗ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
        continue
    }
    
    # Test MCP tools/list endpoint
    try {
        $headers = @{
            "Accept" = "application/json"
            "Content-Type" = "application/json"
        }
        
        $body = @{
            jsonrpc = "2.0"
            id = 1
            method = "tools/list"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "http://localhost:$($server.Port)/messages" `
            -Method POST `
            -Headers $headers `
            -Body $body `
            -TimeoutSec 5
        
        if ($response.result.tools) {
            Write-Host "✓ MCP tools available: " -NoNewline -ForegroundColor Green
            $tools = $response.result.tools | ForEach-Object { $_.name }
            Write-Host ($tools -join ", ")
        }
    }
    catch {
        Write-Host "✗ MCP tools/list failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
Write-Host "`nTo use MCP in VS Code Copilot:" -ForegroundColor White
Write-Host "1. Restart VS Code to pick up new settings.json" -ForegroundColor Gray
Write-Host "2. Open Copilot Chat (Ctrl+Shift+I)" -ForegroundColor Gray
Write-Host "3. Type: '@knowledge search for authentication'" -ForegroundColor Gray
Write-Host "4. Or use: '@code-intelligence find function definitions'" -ForegroundColor Gray
