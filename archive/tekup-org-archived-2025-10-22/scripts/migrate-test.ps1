param(
  [string]$DatabaseUrl = $env:DATABASE_URL
)

Write-Host "Running test DB migrations against $DatabaseUrl"

# Example: call each service's migration script (adjust for your stack: Prisma, TypeORM, Knex, Sequelize, etc.)
$serviceScripts = @(
  "apps/flow-api",
  "apps/tekup-crm-api", 
  "apps/voicedk-api"
)

foreach ($svc in $serviceScripts) {
  $pkgJson = Join-Path $svc "package.json"
  if (Test-Path $pkgJson) {
    Write-Host "Migrating $svc ..."
    Push-Location $svc
    if (Test-Path "pnpm-lock.yaml") { pnpm i --frozen-lockfile }
    # Expected each service to have a script: "migrate:test"
    $scripts = (Get-Content "package.json" | ConvertFrom-Json).scripts
    if ($scripts.PSObject.Properties.Name -contains "migrate:test") {
      pnpm run migrate:test
    } else {
      Write-Host "No migrate:test script found in $svc, skipping..."
    }
    Pop-Location
  }
}

Write-Host "Migrations complete."
