# Push schema to Supabase PostgreSQL
# This script sets correct environment variables before pushing
# Note: Removes schema parameter from URL as postgres.js doesn't support it

$supabaseUrlRaw = (Get-Content .env.supabase | Select-String '^DATABASE_URL=').ToString().Split('=',2)[1]

# Parse URL and remove schema parameter (postgres.js doesn't support it as query param)
$uri = [System.Uri]::new($supabaseUrlRaw)
$builder = [System.UriBuilder]::new($uri)
$queryParams = [System.Web.HttpUtility]::ParseQueryString($uri.Query)

# Remove schema parameter
$queryParams.Remove('schema')

# Rebuild query string
$newQuery = ($queryParams.GetEnumerator() | ForEach-Object {
    "$($_.Key)=$([System.Web.HttpUtility]::UrlEncode($_.Value))"
}) -join '&'

$builder.Query = $newQuery
$supabaseUrl = $builder.ToString()

# Extract schema name for later use
$schemaName = if ($uri.Query -match 'schema=([^&]+)') { $matches[1] } else { 'friday_ai' }

# Set environment variables
[System.Environment]::SetEnvironmentVariable('DATABASE_URL', $supabaseUrl, 'Process')
[System.Environment]::SetEnvironmentVariable('NODE_TLS_REJECT_UNAUTHORIZED', '0', 'Process')

Write-Host "Pushing schema to Supabase..." -ForegroundColor Cyan
Write-Host "Schema: $schemaName" -ForegroundColor Yellow
Write-Host "Using connection: $($supabaseUrl -replace '://[^:]+:[^@]+@', '://***:***@')" -ForegroundColor Yellow

# Push schema
# Note: Drizzle Kit will create tables in the default schema (public)
# We'll need to move them to friday_ai schema or create schema first
Write-Host ""
Write-Host "⚠️  IMPORTANT: Make sure friday_ai schema exists in Supabase!" -ForegroundColor Red
Write-Host "   Run this SQL in Supabase SQL Editor:" -ForegroundColor Yellow
Write-Host "   CREATE SCHEMA IF NOT EXISTS friday_ai;" -ForegroundColor White
Write-Host ""

pnpm drizzle-kit push

