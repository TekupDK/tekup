# Apply Subcontractor Migration to Supabase
# Manual execution guide

Write-Host "🚀 Subcontractor Management Migration" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Instructions:" -ForegroundColor Yellow
Write-Host "  1. Open Supabase SQL Editor:"
Write-Host "     https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey/sql/new"
Write-Host ""
Write-Host "  2. Copy the SQL file content:"
Write-Host "     c:\Users\empir\Tekup\apps\rendetalje\services\database\migrations\001_subcontractor_schema.sql"
Write-Host ""
Write-Host "  3. Paste into SQL Editor and click 'Run'"
Write-Host ""

$confirm = Read-Host "Do you want to copy the SQL to clipboard now? (y/n)"

if ($confirm -eq 'y' -or $confirm -eq 'Y') {
    $sqlPath = Join-Path $PSScriptRoot "001_subcontractor_schema.sql"
    Get-Content $sqlPath | Set-Clipboard
    Write-Host "✅ SQL copied to clipboard!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Open: https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey/sql/new"
    Write-Host "  2. Paste (Ctrl+V)"
    Write-Host "  3. Click 'Run'"
    Write-Host "  4. Return here and press Enter when done"
    Write-Host ""
    Read-Host "Press Enter after running the SQL in Supabase..."
    
    Write-Host ""
    Write-Host "✅ Migration should now be applied!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Verify with this query:" -ForegroundColor Cyan
    Write-Host "  SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'subcontractor%';"
    
} else {
    Write-Host "ℹ️ Manual steps:" -ForegroundColor Gray
    Write-Host "  1. Open: https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey/sql/new"
    Write-Host "  2. Copy/paste content from: 001_subcontractor_schema.sql"
    Write-Host "  3. Run the SQL"
}
