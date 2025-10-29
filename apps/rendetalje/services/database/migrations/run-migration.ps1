# Run Subcontractor Management Migration
# This script applies the subcontractor schema to the RenOS database

param(
    [Parameter(Mandatory=$false)]
    [string]$DatabaseUrl = "postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=renos"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Running Subcontractor Management Migration..." -ForegroundColor Cyan
Write-Host "📁 Database: $DatabaseUrl" -ForegroundColor Gray

# Read the migration file
$migrationFile = Join-Path $PSScriptRoot "001_subcontractor_schema.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Error "❌ Migration file not found: $migrationFile"
    exit 1
}

Write-Host "  ✅ Found migration file" -ForegroundColor Green

# Check if psql is available
$psqlAvailable = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlAvailable) {
    Write-Error "❌ psql not found. Please install PostgreSQL client tools."
    exit 1
}

Write-Host "  ✅ psql command available" -ForegroundColor Green

# Run the migration
Write-Host "  📊 Applying migration..." -ForegroundColor Yellow

try {
    Get-Content $migrationFile | psql $DatabaseUrl 2>&1 | Tee-Object -Variable output
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Created:"
        Write-Host "  - 9 tables (subcontractors, services, task_assignments, etc.)"
        Write-Host "  - 17 indexes for performance"
        Write-Host "  - 12 RLS policies"
        Write-Host "  - 2 helper views"
        Write-Host ""
        Write-Host "🎯 Next steps:" -ForegroundColor Cyan
        Write-Host "  1. Generate VAPID keys: npx web-push generate-vapid-keys"
        Write-Host "  2. Create Supabase Storage bucket: subcontractor-documents"
        Write-Host "  3. Verify tables: SELECT * FROM subcontractors LIMIT 1;"
    } else {
        Write-Error "❌ Migration failed with exit code $LASTEXITCODE"
        Write-Host $output
        exit 1
    }
} catch {
    Write-Error "❌ Migration failed: $_"
    exit 1
}
