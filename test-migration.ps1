# Test Script for PostgreSQL Migration
# This script tests the migration to Supabase PostgreSQL

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL Migration Test Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Load environment variables
if (Test-Path ".env.supabase") {
    Write-Host "`n[1/7] Loading Supabase environment..." -ForegroundColor Yellow
    Get-Content ".env.supabase" | Where-Object { $_ -match "^[^#]" -and $_ -match "=" } | ForEach-Object {
        $line = $_.Split('=', 2)
        if ($line.Length -eq 2) {
            [System.Environment]::SetEnvironmentVariable($line[0].Trim(), $line[1].Trim(), "Process")
        }
    }
    Write-Host "✓ Environment loaded" -ForegroundColor Green
} else {
    Write-Host "✗ .env.supabase not found!" -ForegroundColor Red
    exit 1
}

# Test 1: Verify DATABASE_URL format
Write-Host "`n[2/7] Testing DATABASE_URL format..." -ForegroundColor Yellow
$dbUrl = $env:DATABASE_URL
if ($dbUrl -match "postgresql://") {
    Write-Host "✓ DATABASE_URL is PostgreSQL format" -ForegroundColor Green
} else {
    Write-Host "✗ DATABASE_URL is not PostgreSQL format: $dbUrl" -ForegroundColor Red
    exit 1
}

# Test 2: Check drizzle config
Write-Host "`n[3/7] Verifying drizzle.config.ts..." -ForegroundColor Yellow
if (Test-Path "drizzle.config.ts") {
    $config = Get-Content "drizzle.config.ts" -Raw
    if ($config -match "dialect.*postgresql" -and $config -match "drizzle-orm/postgres") {
        Write-Host "✓ drizzle.config.ts uses PostgreSQL" -ForegroundColor Green
    } else {
        Write-Host "✗ drizzle.config.ts not configured for PostgreSQL" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✗ drizzle.config.ts not found!" -ForegroundColor Red
    exit 1
}

# Test 3: Check schema.ts for PostgreSQL
Write-Host "`n[4/7] Verifying schema.ts..." -ForegroundColor Yellow
if (Test-Path "drizzle/schema.ts") {
    $schema = Get-Content "drizzle/schema.ts" -Raw
    $mysqlRefs = ($schema | Select-String -Pattern "mysql-core|mysqlTable|mysqlEnum" -AllMatches).Matches.Count
    $pgRefs = ($schema | Select-String -Pattern "pg-core|pgTable|pgEnum" -AllMatches).Matches.Count

    if ($mysqlRefs -eq 0 -and $pgRefs -gt 0) {
        Write-Host "✓ schema.ts uses PostgreSQL ($pgRefs PostgreSQL references)" -ForegroundColor Green
    } else {
        Write-Host "✗ schema.ts has MySQL references or no PostgreSQL references" -ForegroundColor Red
        Write-Host "  MySQL refs: $mysqlRefs, PostgreSQL refs: $pgRefs" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✗ drizzle/schema.ts not found!" -ForegroundColor Red
    exit 1
}

# Test 4: Check server/db.ts
Write-Host "`n[5/7] Verifying server/db.ts..." -ForegroundColor Yellow
if (Test-Path "server/db.ts") {
    $db = Get-Content "server/db.ts" -Raw
    $hasPostgres = $db -match "drizzle-orm/postgres-js" -and $db -match "import postgres"
    $hasMysql = $db -match "mysql2|MySql2"

    if ($hasPostgres -and -not $hasMysql) {
        Write-Host "✓ server/db.ts uses PostgreSQL" -ForegroundColor Green
    } else {
        Write-Host "✗ server/db.ts has issues" -ForegroundColor Red
        Write-Host "  Has PostgreSQL: $hasPostgres, Has MySQL: $hasMysql" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✗ server/db.ts not found!" -ForegroundColor Red
    exit 1
}

# Test 5: Check for insertId usage
Write-Host "`n[6/7] Checking for MySQL-specific code..." -ForegroundColor Yellow
$insertIdCount = (Get-ChildItem -Path "server" -Recurse -Include "*.ts" | Select-String -Pattern "insertId" | Measure-Object).Count
$returningCount = (Get-ChildItem -Path "server" -Recurse -Include "*.ts" | Select-String -Pattern "\.returning\(\)" | Measure-Object).Count

if ($insertIdCount -eq 0) {
    Write-Host "✓ No insertId references found (PostgreSQL uses .returning())" -ForegroundColor Green
    Write-Host "  Found $returningCount .returning() usages" -ForegroundColor Cyan
} else {
    Write-Host "✗ Found $insertIdCount insertId references (should be 0)" -ForegroundColor Red
    exit 1
}

# Test 6: Check package.json
Write-Host "`n[7/7] Verifying dependencies..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    $pkg = Get-Content "package.json" -Raw
    $hasPostgres = $pkg -match '"postgres"'
    $hasMysql2 = $pkg -match '"mysql2"'

    if ($hasPostgres -and -not $hasMysql2) {
        Write-Host "✓ package.json has postgres, no mysql2" -ForegroundColor Green
    } else {
        Write-Host "✗ package.json dependencies incorrect" -ForegroundColor Red
        Write-Host "  Has postgres: $hasPostgres, Has mysql2: $hasMysql2" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✗ package.json not found!" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✓ All migration tests passed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Test schema generation: pnpm db:push" -ForegroundColor White
Write-Host "2. Run triggers: Execute postgresql_triggers.sql in Supabase" -ForegroundColor White
Write-Host "3. Start app: pnpm dev" -ForegroundColor White

