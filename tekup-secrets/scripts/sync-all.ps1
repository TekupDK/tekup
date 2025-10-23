<#
.SYNOPSIS
    Sync environment variables to ALL Tekup projects
    
.DESCRIPTION
    Runs sync-to-project.ps1 for each active project in the Tekup Portfolio
    
.PARAMETER Environment
    The environment to use (production or development)
    
.PARAMETER SkipArchived
    Skip archived projects (default: true)
    
.PARAMETER DryRun
    Show what would be synced without actually writing files
    
.EXAMPLE
    .\sync-all.ps1 -Environment "development"
    
.EXAMPLE
    .\sync-all.ps1 -Environment "production" -DryRun
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("production", "development")]
    [string]$Environment = "development",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipArchived = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# Active projects (updated for new Tekup-Portfolio workspace structure)
$projects = @(
    "tekup-ai",
    "tekup-billy",
    "tekup-vault",
    "tekup-gmail-services",
    "RendetaljeOS"
)

# Archived projects (skip by default)
if (-not $SkipArchived) {
    $projects += @("tekup-chat")
}

Write-Host "🔐 Syncing secrets to ALL projects ($Environment)" -ForegroundColor Cyan
Write-Host "📋 Projects: $($projects.Count)" -ForegroundColor Gray
Write-Host ""

$successCount = 0
$failedCount = 0
$results = @()

foreach ($project in $projects) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    try {
        $params = @{
            Project = $project
            Environment = $Environment
        }
        
        if ($DryRun) {
            $params.DryRun = $true
        }
        
        & "$PSScriptRoot\sync-to-project.ps1" @params
        
        $successCount++
        $results += [PSCustomObject]@{
            Project = $project
            Status = "✅ Success"
            Error = $null
        }
        
    } catch {
        $failedCount++
        $results += [PSCustomObject]@{
            Project = $project
            Status = "❌ Failed"
            Error = $_.Exception.Message
        }
        
        Write-Host "❌ Failed to sync $project" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Final summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "📊 SYNC SUMMARY" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$results | Format-Table -AutoSize

Write-Host "✅ Successful: $successCount" -ForegroundColor Green
if ($failedCount -gt 0) {
    Write-Host "❌ Failed: $failedCount" -ForegroundColor Red
}
Write-Host "📁 Total: $($projects.Count)" -ForegroundColor Gray

if ($DryRun) {
    Write-Host "`n⚠️  DRY RUN - No files were modified" -ForegroundColor Yellow
} else {
    Write-Host "`n💡 Tip: Run tests in each project to verify secrets work correctly" -ForegroundColor Yellow
}
