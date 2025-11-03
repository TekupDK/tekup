# Usage: .\scripts\backup-db.ps1 -ConnectionString "postgresql://user:pass@host:5432/db?schema=friday_ai&sslmode=require" -OutFile "backups/db_$(Get-Date -Format yyyyMMdd_HHmmss).sql"
param(
  [Parameter(Mandatory=$true)] [string]$ConnectionString,
  [Parameter(Mandatory=$true)] [string]$OutFile
)

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
  Write-Error "pg_dump not found. Install PostgreSQL client tools or use Supabase Adminer export."
  exit 1
}

New-Item -ItemType Directory -Path (Split-Path $OutFile) -ErrorAction SilentlyContinue | Out-Null

# Parse connection string minimally
$uri = [System.Uri]$ConnectionString
$User = $uri.UserInfo.Split(':')[0]
$Pass = [System.Uri]::UnescapeDataString($uri.UserInfo.Split(':')[1])
$Host = $uri.Host
$Port = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }
$Db   = $uri.AbsolutePath.Trim('/').Split('?')[0]

$Env:PGPASSWORD = $Pass
Write-Host "Backing up $Db@$Host:$Port to $OutFile" -ForegroundColor Cyan
pg_dump -U $User -h $Host -p $Port -d $Db -F p -f $OutFile
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "✅ Backup complete" -ForegroundColor Green
