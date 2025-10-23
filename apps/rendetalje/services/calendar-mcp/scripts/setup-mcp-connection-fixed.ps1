# RenOS Calendar MCP - MCP Connection Setup (Fixed)
# Automatisk setup af MCP server forbindelse

Write-Host "=== RenOS Calendar MCP - Connection Setup ===" -ForegroundColor Magenta
Write-Host ""

# Step 1: Check if MCP server is running
Write-Host "=== Step 1: Checking MCP Server ===" -ForegroundColor Magenta
try {
    $health = Invoke-RestMethod "http://localhost:3001/health" -TimeoutSec 5
    Write-Host "✓ MCP Server is running" -ForegroundColor Green
    Write-Host "  Status: $($health.status)" -ForegroundColor White
} catch {
    Write-Host "✗ MCP Server is not running" -ForegroundColor Red
    Write-Host "Starting MCP server..." -ForegroundColor Yellow
    
    # Start MCP server in background
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Hidden
    Start-Sleep -Seconds 5
    
    # Check again
    try {
        $health = Invoke-RestMethod "http://localhost:3001/health" -TimeoutSec 5
        Write-Host "✓ MCP Server started successfully" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to start MCP server" -ForegroundColor Red
        Write-Host "Please run: npm run dev" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""

# Step 2: Test MCP tools
Write-Host "=== Step 2: Testing MCP Tools ===" -ForegroundColor Magenta
try {
    $tools = Invoke-RestMethod "http://localhost:3001/tools"
    Write-Host "✓ Tools endpoint accessible" -ForegroundColor Green
    Write-Host "  Available tools: $($tools.tools.Count)" -ForegroundColor White
    
    foreach ($tool in $tools.tools) {
        Write-Host "  - $($tool.name): $($tool.description)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "✗ Tools endpoint not accessible" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Create MCP configuration files
Write-Host "=== Step 3: Creating MCP Configuration ===" -ForegroundColor Magenta

# Cursor MCP configuration
$cursorConfig = @{
    mcpServers = @{
        "renos-calendar" = @{
            command = "node"
            args = @("C:\Users\empir\Tekup-Cloud\renos-calendar-mcp\dist\index.js")
            env = @{
                NODE_ENV = "production"
                SUPABASE_URL = "https://oaevagdgrasfppbrxbey.supabase.co"
                SUPABASE_ANON_KEY = "your_anon_key"
                SUPABASE_SERVICE_KEY = "your_service_key"
                GOOGLE_CLIENT_EMAIL = "renos-319@renos-465008.iam.gserviceaccount.com"
                GOOGLE_PRIVATE_KEY = "your_private_key"
                GOOGLE_PROJECT_ID = "renos-465008"
                GOOGLE_CALENDAR_ID = "your_calendar_id"
                GOOGLE_IMPERSONATED_USER = "info@rendetalje.dk"
                TWILIO_ACCOUNT_SID = "your_twilio_sid"
                TWILIO_AUTH_TOKEN = "your_twilio_token"
                TWILIO_PHONE_NUMBER = "your_twilio_number"
                BILLY_API_KEY = "your_billy_key"
                BILLY_ORGANIZATION_ID = "your_org_id"
                ENCRYPTION_KEY = "9c22d3c2cebd332a194ca9f30b99e57112d10a290d9188eda881fe09eaa01947"
                ENCRYPTION_SALT = "9b2af923a0665b2f47c7a799b9484b28"
                MCP_API_KEY = "renos-calendar-mcp-secret-key-2025"
                ENABLE_AUTO_INVOICE = "true"
                ENABLE_FAIL_SAFE_MODE = "true"
            }
        }
    }
}

# Save Cursor configuration
$cursorConfigPath = "$env:USERPROFILE\.cursor\mcp_servers.json"
$cursorConfigDir = Split-Path $cursorConfigPath -Parent

if (-not (Test-Path $cursorConfigDir)) {
    New-Item -ItemType Directory -Path $cursorConfigDir -Force | Out-Null
}

$cursorConfig | ConvertTo-Json -Depth 10 | Out-File -FilePath $cursorConfigPath -Encoding UTF8
Write-Host "✓ Cursor MCP configuration created" -ForegroundColor Green
Write-Host "  Path: $cursorConfigPath" -ForegroundColor White

# Claude Desktop configuration
$claudeConfigPath = "$env:USERPROFILE\.claude\mcp_servers.json"
$claudeConfigDir = Split-Path $claudeConfigPath -Parent

if (-not (Test-Path $claudeConfigDir)) {
    New-Item -ItemType Directory -Path $claudeConfigDir -Force | Out-Null
}

$cursorConfig | ConvertTo-Json -Depth 10 | Out-File -FilePath $claudeConfigPath -Encoding UTF8
Write-Host "✓ Claude Desktop MCP configuration created" -ForegroundColor Green
Write-Host "  Path: $claudeConfigPath" -ForegroundColor White

Write-Host ""

# Step 4: Create .env file
Write-Host "=== Step 4: Creating Environment File ===" -ForegroundColor Magenta
$envContent = @"
# RenOS Calendar MCP Environment Variables
NODE_ENV=production
PORT=3001

# Database
SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Google Calendar
GOOGLE_CLIENT_EMAIL=renos-319@renos-465008.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=your_private_key
GOOGLE_PROJECT_ID=renos-465008
GOOGLE_CALENDAR_ID=your_calendar_id
GOOGLE_IMPERSONATED_USER=info@rendetalje.dk

# Twilio Voice
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number

# Billy.dk
BILLY_API_KEY=your_billy_key
BILLY_ORGANIZATION_ID=your_org_id

# Security
ENCRYPTION_KEY=9c22d3c2cebd332a194ca9f30b99e57112d10a290d9188eda881fe09eaa01947
ENCRYPTION_SALT=9b2af923a0665b2f47c7a799b9484b28
MCP_API_KEY=renos-calendar-mcp-secret-key-2025

# Features
ENABLE_AUTO_INVOICE=true
ENABLE_FAIL_SAFE_MODE=true
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "✓ Environment file created" -ForegroundColor Green
Write-Host "  Path: .env" -ForegroundColor White

Write-Host ""
Write-Host "=== MCP CONNECTION SETUP COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update environment variables in .env file" -ForegroundColor White
Write-Host "2. Restart Cursor/Claude Desktop" -ForegroundColor White
Write-Host "3. Test MCP connection in Cursor/Claude" -ForegroundColor White
Write-Host ""
Write-Host "MCP Server URLs:" -ForegroundColor Yellow
Write-Host "  Local: http://localhost:3001" -ForegroundColor White
Write-Host "  Health: http://localhost:3001/health" -ForegroundColor White
Write-Host "  Tools: http://localhost:3001/tools" -ForegroundColor White
Write-Host ""
Write-Host "Configuration files created:" -ForegroundColor Yellow
Write-Host "  Cursor: $cursorConfigPath" -ForegroundColor White
Write-Host "  Claude: $claudeConfigPath" -ForegroundColor White
Write-Host "  Environment: .env" -ForegroundColor White
