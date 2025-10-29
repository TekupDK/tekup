# Start Tekup MCP Servers with proper environment loading
# Launches all MCP servers in separate PowerShell windows

$mcpRoot = "c:\Users\empir\Tekup\tekup-mcp-servers"
$envFile = "$mcpRoot\.env"

Write-Host "Starting Tekup MCP Servers..." -ForegroundColor Cyan

# Load .env file and export variables
if (Test-Path $envFile) {
    Write-Host "Loading environment from .env..." -ForegroundColor Yellow
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [System.Environment]::SetEnvironmentVariable($name, $value, [System.EnvironmentVariableTarget]::Process)
        }
    }
}

# Get Supabase vars from env
$supabaseUrl = $env:SUPABASE_URL
$supabaseAnonKey = $env:SUPABASE_ANON_KEY
$supabaseServiceKey = $env:SUPABASE_SERVICE_ROLE_KEY

# Start Knowledge MCP (Port 8051)
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$mcpRoot\packages\knowledge-mcp'; `$env:PORT='8051'; `$env:KNOWLEDGE_SEARCH_ROOT='C:\Users\empir\Tekup'; Write-Host 'Starting Knowledge MCP on port 8051...' -ForegroundColor Green; npm run dev"
)
Write-Host "[OK] Knowledge MCP starting on port 8051" -ForegroundColor Green
Start-Sleep -Milliseconds 500

# Start Code Intelligence MCP (Port 8052)
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$mcpRoot\packages\code-intelligence-mcp'; `$env:PORT='8052'; `$env:CODE_SEARCH_ROOT='C:\Users\empir\Tekup'; Write-Host 'Starting Code Intelligence MCP on port 8052...' -ForegroundColor Green; npm run dev"
)
Write-Host "[OK] Code Intelligence MCP starting on port 8052" -ForegroundColor Green
Start-Sleep -Milliseconds 500

# Start Database MCP (Port 8053) with Supabase env
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$mcpRoot\packages\database-mcp'; `$env:PORT='8053'; `$env:SUPABASE_URL='$supabaseUrl'; `$env:SUPABASE_ANON_KEY='$supabaseAnonKey'; `$env:SUPABASE_SERVICE_ROLE_KEY='$supabaseServiceKey'; Write-Host 'Starting Database MCP on port 8053...' -ForegroundColor Green; Write-Host 'Supabase URL: $supabaseUrl' -ForegroundColor Gray; npm run dev"
)
Write-Host "[OK] Database MCP starting on port 8053" -ForegroundColor Green

Write-Host "`n[DONE] All MCP servers are starting in separate windows" -ForegroundColor Cyan
Write-Host "   Wait 5-10 seconds for all servers to initialize..." -ForegroundColor Yellow
Write-Host "`nStatus: .\test-mcp-connectivity.ps1" -ForegroundColor White
Write-Host "Stop: .\stop-mcp-servers.ps1" -ForegroundColor White
