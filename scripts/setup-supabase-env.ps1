<#
  Tekup – Supabase Environment Setup

  What it does:
  - Prompts securely for SUPABASE_SERVICE_ROLE_KEY
  - Optionally sets/updates SUPABASE_URL and SUPABASE_ANON_KEY
  - Writes Windows User-level environment variables
  - Synchronizes tekup-mcp-servers/.env with the provided values

  Usage:
    pwsh -File ./Tekup/scripts/setup-supabase-env.ps1

  Notes:
  - Runs at User scope (no Admin required). In some environments this may
    require elevated permissions. If so, re-run in an elevated PowerShell.
  - Does NOT echo secrets to console. The .env file is updated locally.
#>

param(
  [string]$SupabaseUrl,
  [string]$SupabaseAnonKey,
  [string]$ServiceRoleKey,
  [switch]$NonInteractive
)

function Set-UserEnv([string]$Name, [string]$Value) {
  [System.Environment]::SetEnvironmentVariable($Name, $Value, 'User')
}

Write-Host "Tekup Supabase environment setup" -ForegroundColor Cyan

# 1) Gather inputs
if (-not $SupabaseUrl) {
  $SupabaseUrl = Read-Host -Prompt "Enter SUPABASE_URL (leave blank to keep current)"
}
if (-not $SupabaseAnonKey) {
  $SupabaseAnonKey = Read-Host -Prompt "Enter SUPABASE_ANON_KEY (leave blank to keep current)"
}

# Resolve service role key input
$serviceRolePlain = $null
if ($ServiceRoleKey) {
  $serviceRolePlain = $ServiceRoleKey
} elseif (-not $NonInteractive.IsPresent) {
  $serviceRoleSecure = Read-Host -AsSecureString -Prompt "Enter SUPABASE_SERVICE_ROLE_KEY (required)"
  if (-not $serviceRoleSecure) {
    Write-Error "SUPABASE_SERVICE_ROLE_KEY is required. Aborting."
    exit 1
  }
  $serviceRolePlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($serviceRoleSecure)
  )
} else {
  Write-Warning "SUPABASE_SERVICE_ROLE_KEY not provided (NonInteractive mode). Skipping service role key setup."
}

# 2) Write Windows User environment variables (only set when provided)
if ($SupabaseUrl) {
  Set-UserEnv -Name 'SUPABASE_URL' -Value $SupabaseUrl
  Write-Host "Set User env SUPABASE_URL" -ForegroundColor Green
}
if ($SupabaseAnonKey) {
  Set-UserEnv -Name 'SUPABASE_ANON_KEY' -Value $SupabaseAnonKey
  Write-Host "Set User env SUPABASE_ANON_KEY" -ForegroundColor Green
}
if ($serviceRolePlain) {
  Set-UserEnv -Name 'SUPABASE_SERVICE_ROLE_KEY' -Value $serviceRolePlain
  Write-Host "Set User env SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Green
}

# 3) Sync tekup-mcp-servers/.env
$repoRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $repoRoot 'tekup-mcp-servers/.env'

if (-not (Test-Path $envPath)) {
  # create minimal .env if missing
  @()
  | Set-Content -Path $envPath -Encoding UTF8 -Force
}

# Load existing .env into a hashtable
$envLines = Get-Content -Path $envPath -ErrorAction SilentlyContinue
$envMap = @{}
foreach ($line in $envLines) {
  if ($line -match '^[#\s]*$') { continue }
  $kv = $line -split '=', 2
  if ($kv.Count -eq 2) { $envMap[$kv[0].Trim()] = $kv[1] }
}

function Upsert-EnvFile([hashtable]$map, [string]$k, [string]$v) {
  if ($v -ne $null -and $v -ne '') { $map[$k] = $v }
}

Upsert-EnvFile -map $envMap -k 'SUPABASE_URL' -v $SupabaseUrl
Upsert-EnvFile -map $envMap -k 'SUPABASE_ANON_KEY' -v $SupabaseAnonKey
if ($serviceRolePlain) {
  Upsert-EnvFile -map $envMap -k 'SUPABASE_SERVICE_ROLE_KEY' -v $serviceRolePlain
}

# Ensure typical MCP roots exist if not set
if (-not $envMap.ContainsKey('CODE_SEARCH_ROOT')) { $envMap['CODE_SEARCH_ROOT'] = "$repoRoot" }
if (-not $envMap.ContainsKey('KNOWLEDGE_SEARCH_ROOT')) { $envMap['KNOWLEDGE_SEARCH_ROOT'] = "$repoRoot" }

# Write back .env (preserve order minimally by sorting keys)
$out = @()
foreach ($key in ($envMap.Keys | Sort-Object)) {
  $out += "$key=$($envMap[$key])"
}
$out | Set-Content -Path $envPath -Encoding UTF8
Write-Host "Updated $envPath" -ForegroundColor Green

Write-Host "Done. Restart IDEs to load new User env." -ForegroundColor Cyan
