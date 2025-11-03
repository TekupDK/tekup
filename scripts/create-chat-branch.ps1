# Create isolated branch for Cursor chat session
# Usage: .\scripts\create-chat-branch.ps1 [branch-name]

param(
    [string]$BranchName = ""
)

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

# Get current branch
$CurrentBranch = git branch --show-current
Write-Host "Current branch: $CurrentBranch" -ForegroundColor Cyan

# Generate branch name if not provided
if ([string]::IsNullOrWhiteSpace($BranchName)) {
    $Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $ShortHash = git rev-parse --short HEAD 2>$null
    $BranchName = "cursor/$Timestamp-$ShortHash"
} elseif (-not $BranchName.StartsWith("cursor/")) {
    $BranchName = "cursor/$BranchName"
}

# Check if branch already exists
if (git show-ref --verify --quiet "refs/heads/$BranchName") {
    Write-Host "Branch '$BranchName' already exists. Switching to it..." -ForegroundColor Yellow
    git checkout $BranchName
    exit 0
}

# Check if we have uncommitted changes
$Status = git status --porcelain
if ($Status) {
    Write-Host "⚠️  You have uncommitted changes! Stashing automatically..." -ForegroundColor Yellow
    Write-Host "Stashing changes..." -ForegroundColor Cyan
    git stash push -m "Auto-stashed before creating branch $BranchName at $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    $ShouldStashPop = $true
    Write-Host "✓ Changes stashed. They will be restored after branch creation." -ForegroundColor Green
}

# Create and switch to new branch
Write-Host "Creating branch: $BranchName" -ForegroundColor Green
git checkout -b $BranchName

# Push to remote
Write-Host "Pushing to remote..." -ForegroundColor Cyan
git push -u origin $BranchName 2>$null

# Pop stash if we stashed
if ($ShouldStashPop) {
    Write-Host "Restoring stashed changes..." -ForegroundColor Cyan
    git stash pop
}

Write-Host "✅ Switched to branch: $BranchName" -ForegroundColor Green
Write-Host "You can now work isolated from other chats!" -ForegroundColor Green

