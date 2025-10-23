# RenOS Calendar MCP - Secrets Setup Helper (Fixed)
# Automatisk setup af secrets fra eksisterende credentials

Write-Host "=== Setting up Secrets ===" -ForegroundColor Magenta
Write-Host ""

# Check if .secrets directory exists
if (-not (Test-Path "deployment/.secrets")) {
    Write-Host "Creating .secrets directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "deployment/.secrets" -Force | Out-Null
}

# Check for existing credentials in workspace
Write-Host "Looking for existing credentials in workspace..." -ForegroundColor Yellow

# Try to find Google credentials
$googleKeyPath = "C:\Users\empir\RendetaljeOS\apps\backend\.env"
if (Test-Path $googleKeyPath) {
    Write-Host "Found RendetaljeOS backend .env file" -ForegroundColor Green
    $envContent = Get-Content $googleKeyPath -Raw
    
    # Extract Google credentials
    if ($envContent -match "GOOGLE_PRIVATE_KEY=(.+?)(?=\n|$)") {
        $privateKey = $matches[1].Trim('"')
        $privateKey | Out-File -FilePath "deployment/.secrets/google-private-key.txt" -Encoding UTF8
        Write-Host "✓ Google private key extracted" -ForegroundColor Green
    }
    
    if ($envContent -match "GOOGLE_CLIENT_EMAIL=(.+?)(?=\n|$)") {
        $clientEmail = $matches[1].Trim('"')
        Write-Host "✓ Google client email: $clientEmail" -ForegroundColor Green
    }
}

# Check for Supabase credentials
$supabaseKeyPath = "C:\Users\empir\Tekup-Billy\deployment\RENDER_ENV_VARIABLES.txt"
if (Test-Path $supabaseKeyPath) {
    Write-Host "Found Tekup-Billy Supabase credentials" -ForegroundColor Green
    $supabaseContent = Get-Content $supabaseKeyPath -Raw
    
    # Extract Supabase keys
    if ($supabaseContent -match "SUPABASE_ANON_KEY=(.+?)(?=\n|$)") {
        $anonKey = $matches[1].Trim()
        $anonKey | Out-File -FilePath "deployment/.secrets/supabase-anon-key.txt" -Encoding UTF8
        Write-Host "✓ Supabase anon key extracted" -ForegroundColor Green
    }
    
    if ($supabaseContent -match "SUPABASE_SERVICE_KEY=(.+?)(?=\n|$)") {
        $serviceKey = $matches[1].Trim()
        $serviceKey | Out-File -FilePath "deployment/.secrets/supabase-service-key.txt" -Encoding UTF8
        Write-Host "✓ Supabase service key extracted" -ForegroundColor Green
    }
}

# Check what we have
Write-Host ""
Write-Host "Secrets status:" -ForegroundColor Yellow
$secrets = @(
    @{ Name = "Google Private Key"; File = "deployment/.secrets/google-private-key.txt" },
    @{ Name = "Supabase Anon Key"; File = "deployment/.secrets/supabase-anon-key.txt" },
    @{ Name = "Supabase Service Key"; File = "deployment/.secrets/supabase-service-key.txt" }
)

foreach ($secret in $secrets) {
    if (Test-Path $secret.File) {
        $size = (Get-Item $secret.File).Length
        Write-Host "✓ $($secret.Name): $size bytes" -ForegroundColor Green
    } else {
        Write-Host "✗ $($secret.Name): Missing" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. If any secrets are missing, use deployment/COMET_PROMPT.md" -ForegroundColor White
Write-Host "2. Run: ./scripts/deploy-all.ps1" -ForegroundColor White
