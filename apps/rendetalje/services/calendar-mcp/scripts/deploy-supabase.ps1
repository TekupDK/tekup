# RenOS Calendar MCP - Supabase Deployment
# Deploys database schema to Supabase via CLI

param(
    [string]$ProjectRef = "oaevagdgrasfppbrxbey",
    [string]$DbUrl = "postgresql://postgres.oaevagdgrasfppbrxbey:Habibie12%40@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
)

Write-Host "=== Deploying to Supabase ===" -ForegroundColor Magenta
Write-Host "Project: $ProjectRef" -ForegroundColor Cyan
Write-Host ""

# Check if schema file exists
if (-not (Test-Path "docs/SUPABASE_SCHEMA.sql")) {
    Write-Host "✗ Schema file not found: docs/SUPABASE_SCHEMA.sql" -ForegroundColor Red
    exit 1
}

# Step 1: Link to existing project
Write-Host "1. Linking to Supabase project..." -ForegroundColor Yellow
try {
    supabase link --project-ref $ProjectRef
    Write-Host "✓ Linked to project successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠ Link failed (may already be linked): $_" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Execute SQL schema
Write-Host "2. Executing SUPABASE_SCHEMA.sql..." -ForegroundColor Yellow
try {
    $sqlContent = Get-Content -Path "docs/SUPABASE_SCHEMA.sql" -Raw
    
    # Use psql if available, otherwise use supabase CLI
    if (Get-Command psql -ErrorAction SilentlyContinue) {
        $env:PGPASSWORD = "Habibie12@"
        $sqlContent | psql -h "aws-1-eu-central-1.pooler.supabase.com" -p 5432 -U "postgres.oaevagdgrasfppbrxbey" -d postgres
    } else {
        # Fallback: Save to temp file and use supabase db execute
        $tempFile = New-TemporaryFile
        $sqlContent | Out-File -FilePath $tempFile.FullName -Encoding UTF8
        supabase db execute --db-url $DbUrl --file $tempFile.FullName
        Remove-Item $tempFile.FullName
    }
    
    Write-Host "✓ Schema executed successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Schema execution failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual fallback: Go to https://supabase.com/dashboard/project/$ProjectRef/editor" -ForegroundColor Yellow
    Write-Host "and run docs/SUPABASE_SCHEMA.sql manually" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 3: Verify tables
Write-Host "3. Verifying tables..." -ForegroundColor Yellow
$verifyQuery = @"
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN (
  'customer_preferences',
  'booking_validations',
  'overtime_logs',
  'undo_actions',
  'customer_satisfaction'
)
ORDER BY tablename;
"@

try {
    if (Get-Command psql -ErrorAction SilentlyContinue) {
        Write-Host ""
        $env:PGPASSWORD = "Habibie12@"
        $verifyQuery | psql -h "aws-1-eu-central-1.pooler.supabase.com" -p 5432 -U "postgres.oaevagdgrasfppbrxbey" -d postgres
    } else {
        Write-Host "✓ Schema deployed (verification requires psql)" -ForegroundColor Green
        Write-Host "Install PostgreSQL client for full verification" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Verification skipped (psql not available)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Supabase deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Verify manually: https://supabase.com/dashboard/project/$ProjectRef/editor" -ForegroundColor Cyan

