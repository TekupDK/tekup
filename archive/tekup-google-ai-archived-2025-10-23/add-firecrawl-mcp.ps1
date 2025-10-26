# Add Firecrawl MCP to VS Code Configuration
# Usage: .\add-firecrawl-mcp.ps1 -ApiKey "your_api_key_here"

param(
    [Parameter(Mandatory = $false)]
    [string]$ApiKey
)

Write-Host "`n════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   FIRECRAWL MCP INSTALLER" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════`n" -ForegroundColor Cyan

# Check if API key provided
if (-not $ApiKey) {
    Write-Host "⚠️  No API key provided!" -ForegroundColor Yellow
    Write-Host "`nTo get your Firecrawl API key:" -ForegroundColor White
    Write-Host "  1. Go to: https://firecrawl.dev" -ForegroundColor Gray
    Write-Host "  2. Sign up (free tier)" -ForegroundColor Gray
    Write-Host "  3. Dashboard > API Keys > Create" -ForegroundColor Gray
    Write-Host "`nThen run:" -ForegroundColor White
    Write-Host "  .\add-firecrawl-mcp.ps1 -ApiKey `"fc-xxx...`"" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

# Config file path
$configPath = "$env:APPDATA\Code\User\mcp.json"

# Backup existing config
$backupPath = "$env:APPDATA\Code\User\mcp.json.backup.firecrawl"
Copy-Item $configPath $backupPath -Force
Write-Host "✅ Backup created: mcp.json.backup.firecrawl" -ForegroundColor Green

# Read existing config
$config = Get-Content $configPath -Raw | ConvertFrom-Json

# Check if Firecrawl already exists
if ($config.servers.PSObject.Properties.Name -contains "firecrawl") {
    Write-Host "⚠️  Firecrawl MCP already configured!" -ForegroundColor Yellow
    Write-Host "   Updating API key..." -ForegroundColor Gray
    $config.servers.firecrawl.env.FIRECRAWL_API_KEY = $ApiKey
}
else {
    Write-Host "➕ Adding Firecrawl MCP server..." -ForegroundColor Cyan
    
    # Add Firecrawl server
    $config.servers | Add-Member -Name "firecrawl" -Value @{
        command = "npx"
        args    = @(
            "-y",
            "firecrawl-mcp"
        )
        env     = @{
            FIRECRAWL_API_KEY = $ApiKey
        }
    } -MemberType NoteProperty
}

# Save updated config
$config | ConvertTo-Json -Depth 10 | Out-File $configPath -Encoding UTF8

Write-Host "✅ Firecrawl MCP added to configuration!" -ForegroundColor Green

# Show summary
Write-Host "`n════════════════════════════════════════════" -ForegroundColor Green
Write-Host "   FIRECRAWL MCP CONFIGURED!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════`n" -ForegroundColor Green

Write-Host "📦 Configured MCP Servers:`n" -ForegroundColor Yellow
$config.servers.PSObject.Properties | ForEach-Object {
    Write-Host "   ✓ $($_.Name)" -ForegroundColor Cyan
}

Write-Host "`n🚀 NEXT STEPS:`n" -ForegroundColor Yellow
Write-Host "   1. Reload VS Code" -ForegroundColor White
Write-Host "      Ctrl+Shift+P > 'Developer: Reload Window'`n" -ForegroundColor Gray

Write-Host "   2. Test Firecrawl i Copilot Chat:" -ForegroundColor White
Write-Host "      > Scrape this website: https://rendetalje.dk" -ForegroundColor Cyan
Write-Host "      > Extract text from https://leadmail.no" -ForegroundColor Cyan
Write-Host "      > Get pricing from https://molly.dk`n" -ForegroundColor Cyan

Write-Host "   3. Read documentation:" -ForegroundColor White
Write-Host "      docs\FIRECRAWL_MCP_SETUP.md" -ForegroundColor Cyan

Write-Host "`n💡 Use Cases:" -ForegroundColor Magenta
Write-Host "   - Automatic lead scraping" -ForegroundColor Gray
Write-Host "   - Competitor monitoring" -ForegroundColor Gray
Write-Host "   - Company enrichment" -ForegroundColor Gray
Write-Host "   - All via natural language!`n" -ForegroundColor Gray

Write-Host "════════════════════════════════════════════`n" -ForegroundColor Green
