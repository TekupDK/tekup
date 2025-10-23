# 🧹 Tekup-Billy Root Directory Cleanup Script
# Date: 18. Oktober 2025
# Purpose: Move historical docs to archive, organize root

Write-Host "🧹 Tekup-Billy Root Cleanup" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Must run from project root (c:\Users\empir\Tekup-Billy\)" -ForegroundColor Red
    exit 1
}

Write-Host "Creating archive directories..." -ForegroundColor Yellow

# Create archive structure
$directories = @(
    "archive",
    "archive/v1.3.0",
    "archive/historical-fixes",
    "archive/session-reports",
    "tekupvault"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✅ Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "⏭️  Already exists: $dir" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Moving files to archive..." -ForegroundColor Yellow
Write-Host ""

# Files to archive/v1.3.0/
$v130Files = @(
    "ACTION_PLAN_v1.3.0.md",
    "CHANGELOG_v1.3.0.md",
    "CODE_AUDIT_REPORT_v1.3.0.md",
    "COMPLETION_SUMMARY_v1.3.0.md",
    "DEPLOYMENT_VERIFICATION_v1.3.0.md",
    "PROJECT_REPORT_v1.3.0.md",
    "QUICK_REFERENCE_v1.3.0.md",
    "ROADMAP_v1.3.0.md",
    "SECURITY_AUDIT_v1.3.0.md",
    "v1.3.0_IMPLEMENTATION_TIMELINE.md",
    "v1.3.0_PLANNING_STATUS.md"
)

Write-Host "📦 Moving v1.3.0 files..." -ForegroundColor Cyan
foreach ($file in $v130Files) {
    if (Test-Path $file) {
        git mv $file "archive/v1.3.0/" 2>$null
        if ($?) {
            Write-Host "  ✅ $file → archive/v1.3.0/" -ForegroundColor Green
        } else {
            Move-Item $file "archive/v1.3.0/" -Force
            Write-Host "  ✅ $file → archive/v1.3.0/ (manual)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""

# Files to archive/historical-fixes/
$historicalFixes = @(
    "BILLY_MCP_FIXES_SUMMARY.md",
    "CLAUDE_AI_FIX.md",
    "CLAUDE_CONNECTION_QUICK_REF.md",
    "CLAUDE_CONNECTOR_VERIFIED.md",
    "CLAUDE_EXACT_SETUP.md",
    "CREATE_GITHUB_RELEASE.md",
    "CRITICAL_FIX_RESPONSE_FORMAT.md",
    "EMAIL_PHONE_AUTO_SAVE_FEATURE.md",
    "EMAIL_RECIPIENT_FIX.md",
    "GIT_COMMIT_GUIDE.md",
    "INVOICE_DRAFT_ONLY_FIX.md",
    "MCP_TRANSPORT_UPGRADE_PLAN.md",
    "RENDER_FIX_OCT_11.md",
    "SIMPLIFIED_UPDATECONTACT_FIX.md",
    "STREAMABLE_HTTP_DEPLOYMENT.md",
    "TEKUP_BILLY_MODULE_RESOLUTION_FIX.md",
    "SHORTWAVE_AI_FIX.md",
    "SHORTWAVE_CUSTOMER_DEBUG.md",
    "SHORTWAVE_DEBUGGING_STEPS.md"
)

Write-Host "🔧 Moving historical fixes..." -ForegroundColor Cyan
foreach ($file in $historicalFixes) {
    if (Test-Path $file) {
        git mv $file "archive/historical-fixes/" 2>$null
        if ($?) {
            Write-Host "  ✅ $file → archive/historical-fixes/" -ForegroundColor Green
        } else {
            Move-Item $file "archive/historical-fixes/" -Force
            Write-Host "  ✅ $file → archive/historical-fixes/ (manual)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""

# Files to archive/session-reports/
$sessionReports = @(
    "ALL_TASKS_COMPLETE.md",
    "AUTONOMOUS_WORK_REPORT.md",
    "BRANCH_MERGE_VERIFICATION.md",
    "CLEANUP_SUMMARY.md",
    "COPILOT_RESUME_PROMPT.md",
    "CURSOR_BRANCH_KLAR_TIL_MERGE.md",
    "CURSOR_SETUP_VALIDATION.md",
    "MERGE_READINESS_REPORT.md",
    "PHASE2_LOGGING_COMPLETE.md",
    "PHASE2_LOGGING_FINAL.md",
    "PHASE2_LOGGING_PROGRESS.md",
    "PR_REVIEW_AND_MERGE_SUMMARY.md",
    "RESTRUCTURE_COMPLETE.md",
    "SESSION_COMPLETE_STATUS.md",
    "SESSION_PAUSE_STATUS.md",
    "TEKUPVAULT_CLEANUP_COMPLETE.md",
    "TEKUPVAULT_STATUS_UPDATE_2025-10-17.md",
    "TEKUPVAULT_SUBMISSION_AI_GUIDE.md",
    "WELCOME_BACK.md",
    "WORK_COMPLETED_SUMMARY.md",
    "WORK_STATUS_REPORT.md",
    "DOCUMENTATION_UPDATE_2025-10-17.md"
)

Write-Host "📝 Moving session reports..." -ForegroundColor Cyan
foreach ($file in $sessionReports) {
    if (Test-Path $file) {
        git mv $file "archive/session-reports/" 2>$null
        if ($?) {
            Write-Host "  ✅ $file → archive/session-reports/" -ForegroundColor Green
        } else {
            Move-Item $file "archive/session-reports/" -Force
            Write-Host "  ✅ $file → archive/session-reports/ (manual)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""

# Files to tekupvault/
$tekupvaultFiles = @(
    "TEKUPVAULT_INTEGRATION.md",
    "TEKUPVAULT_REQUIREMENTS_FROM_BILLY.md",
    "test-tekupvault-search.ps1"
)

Write-Host "🗄️  Moving TekupVault files..." -ForegroundColor Cyan
foreach ($file in $tekupvaultFiles) {
    if (Test-Path $file) {
        git mv $file "tekupvault/" 2>$null
        if ($?) {
            Write-Host "  ✅ $file → tekupvault/" -ForegroundColor Green
        } else {
            Move-Item $file "tekupvault/" -Force
            Write-Host "  ✅ $file → tekupvault/ (manual)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "✅ Cleanup Complete!" -ForegroundColor Green
Write-Host ""

# Statistics
Write-Host "📊 Statistics:" -ForegroundColor Cyan
Write-Host "  • v1.3.0 files moved: $($v130Files.Count)" -ForegroundColor Gray
Write-Host "  • Historical fixes moved: $($historicalFixes.Count)" -ForegroundColor Gray
Write-Host "  • Session reports moved: $($sessionReports.Count)" -ForegroundColor Gray
Write-Host "  • TekupVault files moved: $($tekupvaultFiles.Count)" -ForegroundColor Gray
Write-Host "  • Total files organized: $(($v130Files.Count + $historicalFixes.Count + $sessionReports.Count + $tekupvaultFiles.Count))" -ForegroundColor Green
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review the moved files in archive/ and tekupvault/" -ForegroundColor Gray
Write-Host "  2. Commit the changes: git add . && git commit -m 'chore: Organize root directory'" -ForegroundColor Gray
Write-Host "  3. Run: ls *.md to see clean root" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 Root directory is now organized!" -ForegroundColor Green
