# Tekup MCP Cleanup & Standardization Script
# Version: 1.0.0
# Date: 2025-10-27
# Author: Jonas (empir)

Write-Host "`n🎯 TEKUP MCP CLEANUP & STANDARDIZATION" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

# Phase 1: Verify VS Code Discovery is Disabled
Write-Host "📋 Phase 1: Verify VS Code Discovery Settings" -ForegroundColor Yellow
$vscodeSettings = "C:\Users\empir\AppData\Roaming\Code\User\settings.json"

if (Test-Path $vscodeSettings) {
    $settings = Get-Content $vscodeSettings -Raw | ConvertFrom-Json
    
    if ($settings.'chat.mcp.discovery.enabled'.'claude-desktop' -eq $false -and
        $settings.'chat.mcp.discovery.enabled'.'cursor-global' -eq $false -and
        $settings.'chat.mcp.discovery.enabled'.'windsurf' -eq $false -and
        $settings.'chat.mcp.discovery.enabled'.'cursor-workspace' -eq $false) {
        Write-Host "  ✅ VS Code MCP Discovery is DISABLED" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ VS Code MCP Discovery still ENABLED - manually disable!" -ForegroundColor Red
    }
} else {
    Write-Host "  ❌ VS Code settings.json not found!" -ForegroundColor Red
}

# Phase 2: Check Current MCP Processes
Write-Host "`n📊 Phase 2: Check Running MCP Processes" -ForegroundColor Yellow
$nodeProcesses = (Get-Process node -ErrorAction SilentlyContinue | Measure-Object).Count

if ($nodeProcesses -le 5) {
    Write-Host "  ✅ Node.js processes: $nodeProcesses (Good!)" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ Node.js processes: $nodeProcesses (Still high!)" -ForegroundColor Yellow
    Write-Host "     Consider restarting PC or stopping individual processes" -ForegroundColor Gray
}

# Phase 3: Audit MCP Config Files
Write-Host "`n🔍 Phase 3: Audit MCP Configuration Files" -ForegroundColor Yellow

$configs = @{
    "VS Code (Primary)" = "C:\Users\empir\AppData\Roaming\Code\User\mcp.json"
    "Claude Desktop" = "C:\Users\empir\AppData\Roaming\Claude\claude_desktop_config.json"
    "Cursor Global" = "C:\Users\empir\.cursor\mcp.json"
    "Windsurf" = "C:\Users\empir\.codeium\windsurf\mcp_config.json"
    "Kilo Code CLI" = "C:\Users\empir\.kilocode\cli\mcp.json"
    "Tekup Workspace - Claude" = "C:\Users\empir\Tekup\.claude\mcp.json"
    "Tekup Workspace - Kilo Code" = "C:\Users\empir\Tekup\.kilocode\mcp.json"
}

foreach ($name in $configs.Keys) {
    $path = $configs[$name]
    if (Test-Path $path) {
        $content = Get-Content $path -Raw | ConvertFrom-Json
        
        # Count servers
        $serverCount = 0
        if ($content.mcpServers) {
            $serverCount = ($content.mcpServers | Get-Member -MemberType NoteProperty).Count
        } elseif ($content.servers) {
            $serverCount = ($content.servers | Get-Member -MemberType NoteProperty).Count
        }
        
        Write-Host "  📄 $name`: $serverCount servere" -ForegroundColor Cyan
        
        # Check for hardcoded secrets
        $configText = Get-Content $path -Raw
        $hasHardcodedPAT = $configText -match 'github_pat_[A-Za-z0-9_]+'
        $hasHardcodedSupabase = $configText -match 'eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+'
        
        if ($hasHardcodedPAT) {
            Write-Host "     ⚠️ WARNING: Hardcoded GitHub PAT found!" -ForegroundColor Red
        }
        if ($hasHardcodedSupabase) {
            Write-Host "     ⚠️ WARNING: Hardcoded Supabase key found!" -ForegroundColor Red
        }
        
        # Check filesystem scope
        if ($configText -match '"C:\\\\Users\\\\empir"[^\\]') {
            Write-Host "     ⚠️ WARNING: Filesystem scope too broad (entire user folder)!" -ForegroundColor Red
        } elseif ($configText -match '"C:\\\\Users\\\\empir\\\\Tekup"') {
            Write-Host "     ✅ Filesystem scope: Tekup only (Good!)" -ForegroundColor Green
        }
        
    } else {
        Write-Host "  ❌ $name`: Not found" -ForegroundColor Gray
    }
}

# Phase 4: Security Check
Write-Host "`n🔒 Phase 4: Security Audit" -ForegroundColor Yellow

$claudeConfig = "C:\Users\empir\AppData\Roaming\Claude\claude_desktop_config.json"
if (Test-Path $claudeConfig) {
    $claudeText = Get-Content $claudeConfig -Raw
    
    if ($claudeText -match 'github_pat_11BDCB62Q0[A-Za-z0-9_]+') {
        Write-Host "  🚨 CRITICAL: Exposed GitHub PAT in Claude Desktop config!" -ForegroundColor Red
        Write-Host "     Token: github_pat_11BDCB62Q0... (MUST BE REVOKED!)" -ForegroundColor Red
        Write-Host "     Action: https://github.com/settings/tokens" -ForegroundColor Yellow
    } else {
        Write-Host "  ✅ No exposed GitHub PAT in Claude Desktop" -ForegroundColor Green
    }
}

# Check environment variables
Write-Host "`n  Environment Variables Status:" -ForegroundColor Gray
$envVars = @(
    "GITHUB_PERSONAL_ACCESS_TOKEN",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "BILLY_API_KEY",
    "BILLY_ORGANIZATION_ID"
)

foreach ($var in $envVars) {
    if ([System.Environment]::GetEnvironmentVariable($var, 'User')) {
        Write-Host "  ✅ $var is set" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $var is NOT set" -ForegroundColor Red
    }
}

# Phase 5: Docker Readiness Check
Write-Host "`n🐳 Phase 5: Docker Readiness Check" -ForegroundColor Yellow

try {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        Write-Host "  ✅ Docker installed: $dockerVersion" -ForegroundColor Green
        
        # Check if Docker is running
        $dockerRunning = docker ps 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Docker daemon is running" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️ Docker daemon is NOT running" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "  ❌ Docker not found or not running" -ForegroundColor Red
}

# Check for docker-compose.yml
$dockerCompose = "C:\Users\empir\Tekup\tekup-mcp-servers\docker-compose.yml"
if (Test-Path $dockerCompose) {
    Write-Host "  ✅ docker-compose.yml exists" -ForegroundColor Green
} else {
    Write-Host "  ⏳ docker-compose.yml not created yet (Phase 2 task)" -ForegroundColor Gray
}

# Phase 6: Recommendations
Write-Host "`n📋 Phase 6: Action Items & Recommendations" -ForegroundColor Yellow

Write-Host "`n  🚨 CRITICAL (Do Now):" -ForegroundColor Red
Write-Host "  1. Revoke exposed GitHub PAT token" -ForegroundColor White
Write-Host "     → https://github.com/settings/tokens" -ForegroundColor Gray
Write-Host "  2. Generate new GitHub PAT with minimal scope (repo:status, public_repo)" -ForegroundColor White
Write-Host "  3. Add new PAT to environment variables" -ForegroundColor White

Write-Host "`n  ⚡ HIGH PRIORITY (Today):" -ForegroundColor Yellow
Write-Host "  4. Update Claude Desktop config - replace hardcoded PAT with `${GITHUB_PERSONAL_ACCESS_TOKEN}" -ForegroundColor White
Write-Host "  5. Reduce filesystem scope in Claude Desktop to C:\\Users\\empir\\Tekup" -ForegroundColor White
Write-Host "  6. Reduce filesystem scope in Windsurf to C:\\Users\\empir\\Tekup" -ForegroundColor White
Write-Host "  7. Restart VS Code to apply discovery disable" -ForegroundColor White

Write-Host "`n  🐳 MEDIUM PRIORITY (This Week):" -ForegroundColor Cyan
Write-Host "  8. Create docker-compose.yml for Tekup MCP servers" -ForegroundColor White
Write-Host "  9. Create Dockerfiles for each custom server" -ForegroundColor White
Write-Host "  10. Test Docker setup locally" -ForegroundColor White
Write-Host "  11. Update all IDE configs to use HTTP endpoints" -ForegroundColor White

Write-Host "`n  📊 LOW PRIORITY (Next Week):" -ForegroundColor Gray
Write-Host "  12. Decide: Keep or remove Cursor?" -ForegroundColor White
Write-Host "  13. Decide: Keep or remove Windsurf?" -ForegroundColor White
Write-Host "  14. Standardize remaining IDE configs" -ForegroundColor White

# Summary
Write-Host "`n" -NoNewline
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

$totalConfigs = ($configs.Keys | Where-Object { Test-Path $configs[$_] }).Count
Write-Host "  📄 MCP Config Files: $totalConfigs found" -ForegroundColor White
Write-Host "  🖥️ Node.js Processes: $nodeProcesses running" -ForegroundColor White
Write-Host "  🐳 Docker: $(if (Get-Command docker -ErrorAction SilentlyContinue) { 'Installed' } else { 'Not found' })" -ForegroundColor White

Write-Host "`n  Next Step: Revoke GitHub PAT token NOW!" -ForegroundColor Yellow
Write-Host "  Then: Create docker-compose.yml for unified Docker setup`n" -ForegroundColor Yellow

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "`n✅ Audit Complete!`n" -ForegroundColor Green
