# PowerShell script to reorganize all markdown files into logical structure

Write-Host "=== MARKDOWN REORGANIZATION SCRIPT ===" -ForegroundColor Cyan
Write-Host "This will organize all .md files into docs/ subdirectories" -ForegroundColor Yellow
Write-Host ""

# Backup først
$backupDir = ".\docs-backup-$(Get-Date -Format 'yyyy-MM-dd-HHmmss')"
Write-Host "Creating backup at: $backupDir" -ForegroundColor Green
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Get-ChildItem -Path . -Filter "*.md" -Recurse | Copy-Item -Destination $backupDir -Force

# Define category mappings
$categories = @{
    # Architecture
    "VISUAL_"               = "docs/architecture"
    "CSS_ARCHITECTURE"      = "docs/architecture"
    "COMPLETE_SYSTEM"       = "docs/architecture"
    
    # Guides
    "USER_GUIDE"            = "docs/guides/user"
    "RENOS_UI"              = "docs/guides/user"
    "QUICK_AUTH"            = "docs/guides/setup"
    "GOOGLE_CALENDAR_SETUP" = "docs/guides/setup"
    "AUTHENTICATION_GUIDE"  = "docs/guides/setup"
    "SETUP_CHECKLIST"       = "docs/guides/setup"
    "AGENT_GUIDE"           = "docs/guides/developer"
    "CONTRIBUTING"          = "docs/guides/developer"
    "TROUBLESHOOTING"       = "docs/guides/developer"
    
    # Deployment
    "DEPLOYMENT"            = "docs/deployment/guides"
    "DEPLOY_"               = "docs/deployment/guides"
    "GO_LIVE"               = "docs/deployment/guides"
    "RENDER_DEPLOYMENT"     = "docs/deployment/guides"
    "RENDER_SETUP"          = "docs/deployment/guides"
    "PRODUCTION_"           = "docs/deployment/status"
    
    # Features - AI/Chat
    "AI_CHAT"               = "docs/features/ai-chat"
    "CHAT_"                 = "docs/features/ai-chat"
    "OLLAMA"                = "docs/features/ai-chat"
    "LLM_"                  = "docs/features/ai-chat"
    "FRIDAY"                = "docs/features/ai-chat"
    
    # Features - Email
    "EMAIL_"                = "docs/features/email"
    "GMAIL_"                = "docs/features/email"
    
    # Features - Calendar/Booking
    "CALENDAR_"             = "docs/features/calendar"
    "BOOKING_"              = "docs/features/calendar"
    
    # Features - Customer
    "CUSTOMER_"             = "docs/features/customer"
    "KUNDE_"                = "docs/features/customer"
    
    # Features - Integration
    "INTEGRATION_"          = "docs/features/integration"
    
    # Sprints
    "SPRINT_1"              = "docs/sprints/sprint-1"
    "SPRINT_2"              = "docs/sprints/sprint-2"
    "SPRINT_3"              = "docs/sprints/sprint-3"
    
    # Testing
    "TEST_"                 = "docs/testing"
    "TESTING_"              = "docs/testing"
    "E2E_"                  = "docs/testing"
    
    # Sessions
    "SESSION_"              = "docs/sessions"
    
    # Status
    "STATUS_"               = "docs/status/current"
    "_STATUS"               = "docs/status/current"
    "FOUNDATION_STATUS"     = "docs/status/current"
    "MASSIVE_UPDATE"        = "docs/status/current"
    
    # Fixes
    "_FIX"                  = "docs/fixes"
    "FIX_"                  = "docs/fixes"
    
    # Planning
    "GAP_ANALYSIS"          = "docs/planning"
    "INCOMPLETE_"           = "docs/planning"
    "IMPLEMENTATION_PLAN"   = "docs/planning"
    "NEXT_STEPS"            = "docs/planning"
    "TODO_"                 = "docs/planning"
    "POST_MORTEM"           = "docs/planning"
    "PRIORITERING"          = "docs/planning"
    
    # Security
    "SECURITY"              = "docs/security"
    "GOOGLE_PRIVATE_KEY"    = "docs/security"
    
    # Frontend
    "FRONTEND_"             = "docs/features/frontend"
    "DASHBOARD"             = "docs/features/frontend"
    
    # Market & Business
    "MARKET_"               = "docs/business"
    "RENOS_VS_"             = "docs/business"
    "RENOS_KOMPLET"         = "docs/business"
    "KPI_"                  = "docs/business"
    
    # Data
    "HISTORISK_DATA"        = "docs/features/data"
    "HISTORICAL_DATA"       = "docs/features/data"
    "IMPORT_"               = "docs/features/data"
    
    # Reports/Completion
    "_COMPLETE"             = "docs/status/archive"
    "COMPLETION_"           = "docs/status/archive"
    "_SUCCESS"              = "docs/status/archive"
}

# Create all directories
$allDirs = $categories.Values | Select-Object -Unique
foreach ($dir in $allDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created: $dir" -ForegroundColor Green
    }
}

# Also create docs/testing/test-reports
New-Item -ItemType Directory -Path "docs/testing/test-reports" -Force | Out-Null
New-Item -ItemType Directory -Path "docs/sessions/2025-09" -Force | Out-Null
New-Item -ItemType Directory -Path "docs/sessions/2025-10" -Force | Out-Null
New-Item -ItemType Directory -Path "docs/archive" -Force | Out-Null
New-Item -ItemType Directory -Path "docs/deployment/fixes" -Force | Out-Null

# Move files
$rootFiles = Get-ChildItem -Path . -Filter "*.md" -File
$movedCount = 0
$skippedCount = 0

foreach ($file in $rootFiles) {
    $fileName = $file.Name
    
    # Skip special files that should stay in root
    if ($fileName -in @("README.md", "CONTRIBUTING.md", "SECURITY.md")) {
        Write-Host "Skipping root file: $fileName" -ForegroundColor Gray
        $skippedCount++
        continue
    }
    
    # Find matching category
    $targetDir = $null
    foreach ($pattern in $categories.Keys | Sort-Object -Property Length -Descending) {
        if ($fileName -like "*$pattern*") {
            $targetDir = $categories[$pattern]
            break
        }
    }
    
    # Default to archive if no match
    if (-not $targetDir) {
        $targetDir = "docs/archive"
    }
    
    # Special handling for specific patterns
    if ($fileName -match "^SESSION.*2025") {
        if ($fileName -match "SEP|29") {
            $targetDir = "docs/sessions/2025-09"
        }
        elseif ($fileName -match "OKT|OCT|_2_|_3_") {
            $targetDir = "docs/sessions/2025-10"
        }
    }
    
    if ($fileName -match "TEST_.*\.(md)$" -and $fileName -notmatch "QUICK_START") {
        $targetDir = "docs/testing/test-reports"
    }
    
    if ($fileName -match "DEPLOYMENT.*FIX") {
        $targetDir = "docs/deployment/fixes"
    }
    
    # Move file
    $targetPath = Join-Path $targetDir $fileName
    try {
        Move-Item -Path $file.FullName -Destination $targetPath -Force
        Write-Host "Moved: $fileName -> $targetDir" -ForegroundColor Cyan
        $movedCount++
    }
    catch {
        Write-Host "Error moving $fileName : $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Green
Write-Host "Moved: $movedCount files" -ForegroundColor Cyan
Write-Host "Skipped: $skippedCount files" -ForegroundColor Yellow
Write-Host "Backup: $backupDir" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review moved files in docs/" -ForegroundColor Gray
Write-Host "2. Run: npm run docs:index (to create indexes)" -ForegroundColor Gray
Write-Host "3. Commit changes" -ForegroundColor Gray
Write-Host ""
Write-Host "Done!" -ForegroundColor Green
