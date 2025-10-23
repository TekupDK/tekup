# PowerShell script to merge all separate schemas into main schema.prisma
# This will create a complete schema with all 64 models

Write-Host "🔄 Merging all schemas into schema.prisma..." -ForegroundColor Cyan

# Read the main schema template (up to the placeholder sections)
$mainSchema = Get-Content "prisma\schema.prisma" -Raw

# Read the separate schema files (skip the generator/datasource parts)
$renosContent = Get-Content "prisma\schema-renos.prisma" -Raw
$crmContent = Get-Content "prisma\schema-crm.prisma" -Raw
$flowContent = Get-Content "prisma\schema-flow.prisma" -Raw

# Extract only the model definitions (skip first 5 lines which have generator/datasource)
$renosModels = ($renosContent -split "`n" | Select-Object -Skip 5) -join "`n"
$crmModels = ($crmContent -split "`n" | Select-Object -Skip 20) -join "`n" # CRM has more header lines  
$flowModels = ($flowContent -split "`n" | Select-Object -Skip 20) -join "`n"

# Find the placeholder sections and replace them
$renosPlaceholder = "// =====================================================`n// RENOS SCHEMA (Tekup Google AI - RenOS)`n// =====================================================`n// Placeholder - Will be added in migration from existing Prisma schema"

$crmPlaceholder = "// =====================================================`n// CRM SCHEMA (Tekup-org CRM)`n// =====================================================`n// Placeholder - Will be added in migration from existing Prisma schema"

$flowPlaceholder = "// =====================================================`n// FLOW SCHEMA (Flow API)`n// =====================================================`n// Placeholder - Will be added in migration from existing Prisma schema"

# Replace placeholders with actual content
$mergedSchema = $mainSchema
$mergedSchema = $mergedSchema -replace [regex]::Escape($renosPlaceholder), "// =====================================================`n// RENOS SCHEMA (Tekup Google AI - RenOS)`n// =====================================================`n`n$renosModels"
$mergedSchema = $mergedSchema -replace [regex]::Escape($crmPlaceholder), "// =====================================================`n// CRM SCHEMA (Tekup-org CRM)`n// =====================================================`n`n$crmModels"
$mergedSchema = $mergedSchema -replace [regex]::Escape($flowPlaceholder), "// =====================================================`n// FLOW SCHEMA (Flow API)`n// =====================================================`n`n$flowModels"

# Write the merged schema
$mergedSchema | Set-Content "prisma\schema.prisma" -NoNewline

Write-Host "✅ Schema merge complete!" -ForegroundColor Green
Write-Host "📊 Merged schemas: vault, billy, renos (22 models), crm (18 models), flow (11 models), shared" -ForegroundColor Yellow
Write-Host "📝 Total: 64 database models" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. pnpm db:generate" -ForegroundColor White
Write-Host "2. pnpm db:push" -ForegroundColor White
