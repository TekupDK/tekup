# MCP Memory Server Fix - Quick Start Guide
# Run this script to fix the "Process exited with code 1" error

Write-Host "🔧 MCP Memory Server Fix Tool" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$memoryFile = "C:\Users\empir\.codeium\windsurf\memory.json"
$backupFile = "$memoryFile.backup_$(Get-Date -Format 'yyyy-MM-dd_HHmmss')"

# Check if file exists
if (-not (Test-Path $memoryFile)) {
    Write-Host "❌ Memory file not found: $memoryFile" -ForegroundColor Red
    Write-Host "Creating new empty memory file..." -ForegroundColor Yellow
    
    $emptyMemory = @"
{
  "entities": [],
  "relations": [],
  "observations": []
}
"@
    
    New-Item -Path (Split-Path $memoryFile) -ItemType Directory -Force | Out-Null
    $emptyMemory | Out-File $memoryFile -Encoding utf8
    Write-Host "✅ Empty memory file created" -ForegroundColor Green
    exit 0
}

# Show menu
Write-Host "Current memory file: $memoryFile" -ForegroundColor Yellow
Write-Host ""
Write-Host "Choose fix option:" -ForegroundColor Cyan
Write-Host "1. Reset memory file (clean slate, fast)" -ForegroundColor White
Write-Host "2. Convert NDJSON format (preserve data, slower)" -ForegroundColor White
Write-Host "3. Just backup and disable server (temporary)" -ForegroundColor White
Write-Host "4. Cancel" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "📦 Creating backup..." -ForegroundColor Yellow
        Copy-Item $memoryFile $backupFile
        Write-Host "✅ Backup created: $backupFile" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "🔨 Resetting memory file..." -ForegroundColor Yellow
        $freshMemory = @"
{
  "entities": [],
  "relations": [],
  "observations": []
}
"@
        $freshMemory | Out-File $memoryFile -Encoding utf8
        Write-Host "✅ Memory file reset to empty state" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "🎉 Fix complete!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Restart Windsurf IDE completely (not just reload)" -ForegroundColor White
        Write-Host "2. Check Settings → MCP → View Logs" -ForegroundColor White
        Write-Host "3. Verify memory server starts without exit code 1" -ForegroundColor White
        Write-Host "4. Test creating an entity in Cascade chat" -ForegroundColor White
    }
    
    "2" {
        Write-Host ""
        Write-Host "🔄 Running conversion script..." -ForegroundColor Yellow
        Write-Host ""
        
        $scriptPath = "$PSScriptRoot\convert-mcp-memory.mjs"
        if (-not (Test-Path $scriptPath)) {
            Write-Host "❌ Conversion script not found: $scriptPath" -ForegroundColor Red
            Write-Host "Creating script..." -ForegroundColor Yellow
            # Script will be created by AI agent
            exit 1
        }
        
        node $scriptPath
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "🎉 Conversion complete!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Next steps:" -ForegroundColor Cyan
            Write-Host "1. Restart Windsurf IDE completely" -ForegroundColor White
            Write-Host "2. Verify memory server works" -ForegroundColor White
        } else {
            Write-Host ""
            Write-Host "❌ Conversion failed. See errors above." -ForegroundColor Red
        }
    }
    
    "3" {
        Write-Host ""
        Write-Host "📦 Creating backup..." -ForegroundColor Yellow
        Copy-Item $memoryFile $backupFile
        Write-Host "✅ Backup created: $backupFile" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "⚠️  To disable memory server:" -ForegroundColor Yellow
        Write-Host "1. Open: C:\Users\empir\.codeium\windsurf\mcp_config.json" -ForegroundColor White
        Write-Host "2. Find the 'memory' server section" -ForegroundColor White
        Write-Host "3. Change 'disabled: false' to 'disabled: true'" -ForegroundColor White
        Write-Host "4. Save and restart Windsurf" -ForegroundColor White
        Write-Host ""
        Write-Host "Opening config file..." -ForegroundColor Yellow
        code "C:\Users\empir\.codeium\windsurf\mcp_config.json"
    }
    
    "4" {
        Write-Host ""
        Write-Host "❌ Cancelled" -ForegroundColor Red
        exit 0
    }
    
    default {
        Write-Host ""
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📄 Backup location: $backupFile" -ForegroundColor Cyan
