# TekupDK - Clone All Repos to PC 2
# Run this on PC 2 (anden computer) to clone all repos from GitHub

param(
    [string]$TargetPath = "c:\Users\$env:USERNAME\Tekup"
)

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "TekupDK Clone All Repos Script" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if GitHub CLI is installed
if (!(Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI not installed!" -ForegroundColor Red
    Write-Host "Install: winget install --id GitHub.cli" -ForegroundColor Yellow
    exit 1
}

# Check if authenticated
$authStatus = gh auth status 2>&1
if ($authStatus -notlike "*Logged in*") {
    Write-Host "❌ Not authenticated with GitHub!" -ForegroundColor Red
    Write-Host "Run: gh auth login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ GitHub CLI authenticated" -ForegroundColor Green
Write-Host "Target path: $TargetPath" -ForegroundColor Cyan
Write-Host ""

# Create base directory
if (!(Test-Path $TargetPath)) {
    Write-Host "Creating workspace directory..." -ForegroundColor Gray
    New-Item -ItemType Directory -Path $TargetPath -Force | Out-Null
}

# Define repos and their target folders
$repos = @(
    @{
        Name = "tekup-database"
        Folder = "apps\production"
    },
    @{
        Name = "tekup-vault"
        Folder = "apps\production"
    },
    @{
        Name = "tekup-billy"
        Folder = "apps\production"
    },
    @{
        Name = "rendetalje-os"
        Folder = "apps\web"
    },
    @{
        Name = "tekup-cloud-dashboard"
        Folder = "apps\web"
    },
    @{
        Name = "tekup-ai"
        Folder = "services"
    },
    @{
        Name = "tekup-cloud"
        Folder = "services"
    },
    @{
        Name = "tekup-gmail-services"
        Folder = "services"
    },
    @{
        Name = "tekup-ai-assistant"
        Folder = "services"
    }
)

$successCount = 0
$failCount = 0

foreach ($repo in $repos) {
    Write-Host "----------------------------------------" -ForegroundColor Cyan
    Write-Host "Cloning: $($repo.Name)" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Cyan
    
    $targetFolder = Join-Path $TargetPath $repo.Folder
    
    # Create target folder if doesn't exist
    if (!(Test-Path $targetFolder)) {
        Write-Host "Creating folder: $($repo.Folder)" -ForegroundColor Gray
        New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null
    }
    
    # Navigate to target folder
    Push-Location $targetFolder
    
    try {
        # Check if repo already exists
        $repoPath = Join-Path $targetFolder $repo.Name
        if (Test-Path $repoPath) {
            Write-Host "⚠️  Repo already exists. Pulling latest changes..." -ForegroundColor Yellow
            Push-Location $repoPath
            git pull
            Pop-Location
        } else {
            # Clone repo
            Write-Host "Cloning from GitHub..." -ForegroundColor Gray
            gh repo clone "TekupDK/$($repo.Name)" 2>&1 | Out-Null
        }
        
        Write-Host "✅ $($repo.Name) cloned successfully!" -ForegroundColor Green
        $successCount++
        
    } catch {
        Write-Host "❌ Error cloning $($repo.Name): $_" -ForegroundColor Red
        $failCount++
    } finally {
        Pop-Location
    }
    
    Write-Host ""
}

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "✅ Successful: $successCount" -ForegroundColor Green
Write-Host "❌ Failed: $failCount" -ForegroundColor Red
Write-Host ""

if ($successCount -gt 0) {
    Write-Host "🎉 Workspace setup complete!" -ForegroundColor Green
    Write-Host "Location: $TargetPath" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Configure .env files in each project" -ForegroundColor Gray
    Write-Host "2. Run 'pnpm install' in each project" -ForegroundColor Gray
    Write-Host "3. Test each project works" -ForegroundColor Gray
}
