# Start Tekup MCP Servers
# Launches all MCP servers in separate PowerShell windows

$mcpRoot = "c:\Users\empir\Tekup\tekup-mcp-servers"

Write-Host "Starting Tekup MCP Servers..." -ForegroundColor Cyan

# Start Knowledge MCP (Port 8051)
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$mcpRoot\packages\knowledge-mcp'; `$env:PORT='8051'; `$env:KNOWLEDGE_SEARCH_ROOT='C:\Users\empir\Tekup'; Write-Host 'Starting Knowledge MCP on port 8051...' -ForegroundColor Green; npm run dev"
)
Write-Host "[OK] Knowledge MCP starting on port 8051" -ForegroundColor Green

# Start Code Intelligence MCP (Port 8052)
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$mcpRoot\packages\code-intelligence-mcp'; `$env:PORT='8052'; `$env:CODE_SEARCH_ROOT='C:\Users\empir\Tekup'; Write-Host 'Starting Code Intelligence MCP on port 8052...' -ForegroundColor Green; npm run dev"
)
Write-Host "[OK] Code Intelligence MCP starting on port 8052" -ForegroundColor Green

# Start Database MCP (Port 8053)
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$mcpRoot\packages\database-mcp'; `$env:PORT='8053'; `$env:SUPABASE_URL='$env:SUPABASE_URL'; `$env:SUPABASE_ANON_KEY='$env:SUPABASE_ANON_KEY'; `$env:SUPABASE_SERVICE_ROLE_KEY='$env:SUPABASE_SERVICE_ROLE_KEY'; Write-Host 'Starting Database MCP on port 8053...' -ForegroundColor Green; npm run dev"
)
Write-Host "[OK] Database MCP starting on port 8053" -ForegroundColor Green

Write-Host "`n[DONE] All MCP servers are starting in separate windows" -ForegroundColor Cyan
Write-Host "   Wait 5-10 seconds for all servers to initialize..." -ForegroundColor Yellow
Write-Host "`n📊 To check status, run: .\test-mcp-connectivity.ps1" -ForegroundColor White
Write-Host "🛑 To stop all servers: .\stop-mcp-servers.ps1" -ForegroundColor White
