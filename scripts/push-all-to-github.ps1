# TekupDK - Push All Projects to GitHub
# Run this on PC 1 (hovedcomputer) to push all projects to GitHub organization

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "TekupDK GitHub Push Script" -ForegroundColor Cyan
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
Write-Host ""

# Define projects to push
$projects = @(
    @{
        Name = "tekup-database"
        Path = "apps\production\tekup-database"
        Visibility = "private"
        Description = "Central PostgreSQL database for all Tekup services"
    },
    @{
        Name = "tekup-vault"
        Path = "apps\production\tekup-vault"
        Visibility = "public"
        Description = "Knowledge layer with semantic search across all Tekup repos"
    },
    @{
        Name = "tekup-billy"
        Path = "apps\production\tekup-billy"
        Visibility = "public"
        Description = "Billy.dk MCP server for AI agents"
    },
    @{
        Name = "rendetalje-os"
        Path = "apps\web\rendetalje-os"
        Visibility = "private"
        Description = "Cleaning management platform for Rendetalje.dk"
    },
    @{
        Name = "tekup-cloud-dashboard"
        Path = "apps\web\tekup-cloud-dashboard"
        Visibility = "private"
        Description = "Unified dashboard for all Tekup services"
    },
    @{
        Name = "tekup-ai"
        Path = "services\tekup-ai"
        Visibility = "private"
        Description = "AI infrastructure monorepo for Tekup ecosystem"
    },
    @{
        Name = "tekup-cloud"
        Path = "services\tekup-cloud"
        Visibility = "private"
        Description = "RenOS tools and calendar MCP server"
    },
    @{
        Name = "tekup-gmail-services"
        Path = "services\tekup-gmail-services"
        Visibility = "private"
        Description = "Email automation for Tekup ecosystem"
    },
    @{
        Name = "tekup-ai-assistant"
        Path = "services\tekup-ai-assistant"
        Visibility = "public"
        Description = "AI assistant integration docs and configs"
    }
)

$baseDir = "c:\Users\empir\Tekup"
$successCount = 0
$failCount = 0

foreach ($project in $projects) {
    Write-Host "----------------------------------------" -ForegroundColor Cyan
    Write-Host "Processing: $($project.Name)" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Cyan
    
    $projectPath = Join-Path $baseDir $project.Path
    
    # Check if directory exists
    if (!(Test-Path $projectPath)) {
        Write-Host "⚠️  Directory not found: $projectPath" -ForegroundColor Red
        Write-Host "Skipping..." -ForegroundColor Yellow
        $failCount++
        continue
    }
    
    # Navigate to project
    Push-Location $projectPath
    
    try {
        # Initialize git if needed
        if (!(Test-Path ".git")) {
            Write-Host "Initializing git..." -ForegroundColor Gray
            git init
            
            # Add .gitignore if doesn't exist
            if (!(Test-Path ".gitignore")) {
                Write-Host "Creating .gitignore..." -ForegroundColor Gray
                @"
# Dependencies
node_modules/
.pnp/
.pnp.js

# Testing
coverage/
.nyc_output/

# Production
build/
dist/
.next/
out/

# Environment
.env
.env.local
.env.*.local

# OS
.DS_Store
Thumbs.db
desktop.ini

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
logs/
*.log
npm-debug.log*

# Database
*.db
*.sqlite

# Misc
.turbo/
.cache/
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8
            }
            
            # Initial commit
            Write-Host "Making initial commit..." -ForegroundColor Gray
            git add .
            git commit -m "Initial commit: $($project.Name)"
        }
        
        # Check if remote already exists
        $remotes = git remote
        if ($remotes -contains "origin") {
            Write-Host "⚠️  Remote 'origin' already exists" -ForegroundColor Yellow
            Write-Host "Pushing to existing remote..." -ForegroundColor Gray
            git push -u origin main 2>&1 | Out-Null
        } else {
            # Create repo on GitHub and push
            Write-Host "Creating repo on GitHub..." -ForegroundColor Gray
            
            $visibilityFlag = if ($project.Visibility -eq "public") { "--public" } else { "--private" }
            
            gh repo create "TekupDK/$($project.Name)" `
                $visibilityFlag `
                --description "$($project.Description)" `
                --source=. `
                --push 2>&1 | Out-Null
        }
        
        Write-Host "✅ $($project.Name) pushed successfully!" -ForegroundColor Green
        $successCount++
        
    } catch {
        Write-Host "❌ Error processing $($project.Name): $_" -ForegroundColor Red
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
    Write-Host "🎉 Projects are now on GitHub!" -ForegroundColor Green
    Write-Host "View: https://github.com/TekupDK" -ForegroundColor Cyan
}
