# ===================================================================
# Tekup Workspace - New Machine Setup Script
# ===================================================================
# Purpose: Automated setup for new machines (PC2, team members, CI/CD)
# Usage: .\setup-new-machine.ps1 [-SkipSubmodule] [-SkipMCP]
# Created: October 24, 2025
# ===================================================================

param(
    [switch]$SkipSubmodule,
    [switch]$SkipMCP,
    [switch]$Help
)

# Display help
if ($Help) {
    Write-Host @"
Tekup Workspace - New Machine Setup Script
==========================================

Automates the setup of tekup-secrets submodule and MCP configurations
for new machines (PC2, team members) or fresh workspace clones.

USAGE:
    .\setup-new-machine.ps1 [OPTIONS]

OPTIONS:
    -SkipSubmodule    Skip tekup-secrets submodule initialization
    -SkipMCP          Skip MCP configuration setup
    -Help             Display this help message

EXAMPLES:
    # Full setup (recommended for first time)
    .\setup-new-machine.ps1

    # Only setup MCP (submodule already initialized)
    .\setup-new-machine.ps1 -SkipSubmodule

    # Only setup submodule (MCP configs later)
    .\setup-new-machine.ps1 -SkipMCP

REQUIREMENTS:
    - Git installed
    - Access to TekupDK/tekup-secrets repository (private)
    - GitHub authentication configured (HTTPS with PAT or SSH)
    - PowerShell 5.1+ or PowerShell Core 7+

DOCUMENTATION:
    - MIGRATION_TO_SUBMODULE.md - Submodule usage guide
    - MCP_SECURE_SETUP.md - MCP configuration details
    - tekup-secrets/README.md - Credential documentation

"@ -ForegroundColor Cyan
    exit 0
}

# ===================================================================
# Configuration
# ===================================================================

$ErrorActionPreference = "Stop"
$WorkspaceRoot = $PSScriptRoot
$SecretsPath = Join-Path $WorkspaceRoot "tekup-secrets"
$MCPSetupScript = Join-Path $WorkspaceRoot "setup-mcp-secure.ps1"

# Color output helpers
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Step { param($Message) Write-Host "`n📦 $Message" -ForegroundColor Magenta }

# ===================================================================
# Prerequisites Check
# ===================================================================

Write-Step "Checking prerequisites..."

# Check Git installation
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git is not installed or not in PATH"
    Write-Info "Install Git from: https://git-scm.com/downloads"
    exit 1
}
Write-Success "Git is installed: $(git --version)"

# Check if we're in a git repository
if (-not (Test-Path (Join-Path $WorkspaceRoot ".git"))) {
    Write-Error "Not in a git repository"
    Write-Info "Clone the workspace first: git clone https://github.com/TekupDK/tekup.git"
    exit 1
}
Write-Success "Git repository detected"

# Check GitHub authentication
$gitUser = git config user.name
$gitEmail = git config user.email
if (-not $gitUser -or -not $gitEmail) {
    Write-Warning "Git user not configured"
    Write-Info "Configure with:"
    Write-Info "  git config --global user.name 'Your Name'"
    Write-Info "  git config --global user.email 'your.email@example.com'"
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne 'y') { exit 1 }
} else {
    Write-Success "Git user: $gitUser <$gitEmail>"
}

# ===================================================================
# Submodule Setup
# ===================================================================

if (-not $SkipSubmodule) {
    Write-Step "Setting up tekup-secrets submodule..."

    # Check if .gitmodules exists
    $gitmodulesPath = Join-Path $WorkspaceRoot ".gitmodules"
    if (-not (Test-Path $gitmodulesPath)) {
        Write-Error ".gitmodules not found"
        Write-Info "This workspace may not have submodules configured yet."
        exit 1
    }

    # Initialize submodules
    Write-Info "Initializing git submodules..."
    try {
        git submodule init
        Write-Success "Submodules initialized"
    } catch {
        Write-Error "Failed to initialize submodules: $_"
        exit 1
    }

    # Update submodules (clone tekup-secrets)
    Write-Info "Cloning tekup-secrets repository..."
    Write-Info "Repository: https://github.com/TekupDK/tekup-secrets.git (private)"
    
    try {
        git submodule update --init --recursive
        Write-Success "Submodule cloned successfully"
    } catch {
        Write-Error "Failed to clone tekup-secrets submodule"
        Write-Info ""
        Write-Info "Possible causes:"
        Write-Info "1. You don't have access to TekupDK/tekup-secrets (private repo)"
        Write-Info "2. GitHub authentication not configured (PAT or SSH)"
        Write-Info "3. Network issues or GitHub is down"
        Write-Info ""
        Write-Info "Solutions:"
        Write-Info "- Request access: Ask @JonasAbde for invite to TekupDK organization"
        Write-Info "- Setup PAT: https://github.com/settings/tokens (repo scope required)"
        Write-Info "- Setup SSH: https://github.com/settings/keys"
        Write-Info ""
        Write-Info "Test access manually:"
        Write-Info "  git ls-remote https://github.com/TekupDK/tekup-secrets.git"
        exit 1
    }

    # Verify submodule contents
    if (-not (Test-Path (Join-Path $SecretsPath "config/mcp.env"))) {
        Write-Error "Submodule initialized but config/mcp.env not found"
        Write-Info "The submodule may be empty or in detached HEAD state."
        
        Write-Info "Attempting to fix..."
        Push-Location $SecretsPath
        try {
            git checkout main
            git pull origin main
            Pop-Location
            
            if (Test-Path (Join-Path $SecretsPath "config/mcp.env")) {
                Write-Success "Fixed: Checked out main branch"
            } else {
                Write-Error "Still unable to find config/mcp.env"
                Pop-Location
                exit 1
            }
        } catch {
            Write-Error "Failed to fix submodule: $_"
            Pop-Location
            exit 1
        }
    } else {
        Write-Success "Submodule contents verified: config/mcp.env exists"
    }

    # Show submodule status
    Write-Info "Submodule status:"
    git submodule status

} else {
    Write-Info "Skipping submodule setup (--SkipSubmodule specified)"
    
    # Verify submodule exists if skipping
    if (-not (Test-Path $SecretsPath) -or -not (Test-Path (Join-Path $SecretsPath "config/mcp.env"))) {
        Write-Warning "tekup-secrets not found or incomplete"
        Write-Info "Run without -SkipSubmodule to initialize it."
    }
}

# ===================================================================
# MCP Configuration Setup
# ===================================================================

if (-not $SkipMCP) {
    Write-Step "Setting up MCP configurations..."

    # Check if setup-mcp-secure.ps1 exists
    if (-not (Test-Path $MCPSetupScript)) {
        Write-Error "MCP setup script not found: $MCPSetupScript"
        Write-Info "This script should be in the workspace root."
        exit 1
    }

    # Check if tekup-secrets is available
    if (-not (Test-Path $SecretsPath) -or -not (Test-Path (Join-Path $SecretsPath "config/mcp.env"))) {
        Write-Error "tekup-secrets not available"
        Write-Info "Run without -SkipSubmodule first to initialize the submodule."
        exit 1
    }

    # Run MCP setup script
    Write-Info "Running MCP configuration setup..."
    try {
        & $MCPSetupScript
        Write-Success "MCP configuration setup completed"
    } catch {
        Write-Error "Failed to run MCP setup script: $_"
        Write-Info "Try running it manually: .\setup-mcp-secure.ps1"
        exit 1
    }

} else {
    Write-Info "Skipping MCP configuration setup (--SkipMCP specified)"
}

# ===================================================================
# Verification
# ===================================================================

Write-Step "Verification..."

$allGood = $true

# Check tekup-secrets submodule
if (Test-Path (Join-Path $SecretsPath "config/mcp.env")) {
    Write-Success "tekup-secrets submodule initialized"
} else {
    Write-Warning "tekup-secrets submodule not found or incomplete"
    $allGood = $false
}

# Check MCP configuration (Cursor)
$cursorMCPConfig = Join-Path $env:USERPROFILE ".cursor/mcp.json"
if (Test-Path $cursorMCPConfig) {
    Write-Success "Cursor MCP configuration exists"
    
    # Verify it has required servers
    $mcpContent = Get-Content $cursorMCPConfig -Raw | ConvertFrom-Json
    $serverCount = ($mcpContent.mcpServers | Get-Member -MemberType NoteProperty).Count
    Write-Info "  Configured MCP servers: $serverCount"
    
    if ($mcpContent.mcpServers.PSObject.Properties.Name -contains "tekup-billy") {
        Write-Success "  tekup-billy MCP server configured"
    } else {
        Write-Warning "  tekup-billy MCP server not found in config"
    }
} else {
    Write-Warning "Cursor MCP configuration not found"
    Write-Info "  Run: .\setup-mcp-secure.ps1"
    $allGood = $false
}

# ===================================================================
# Summary
# ===================================================================

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "         Setup Complete!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

if ($allGood) {
    Write-Success "All checks passed! Workspace is ready."
    Write-Host ""
    Write-Info "Next steps:"
    Write-Info "1. Open Cursor IDE and verify MCP servers are loaded"
    Write-Info "2. Test Billy.dk integration: Ask Copilot to list Billy products"
    Write-Info "3. Check documentation:"
    Write-Info "   - MIGRATION_TO_SUBMODULE.md - Submodule usage guide"
    Write-Info "   - MCP_SECURE_SETUP.md - MCP configuration details"
    Write-Info "   - tekup-secrets/README.md - Credential documentation"
} else {
    Write-Warning "Setup completed with warnings. Some components may not be configured."
    Write-Host ""
    Write-Info "Review warnings above and run setup again if needed."
    Write-Info "For help: .\setup-new-machine.ps1 -Help"
}

Write-Host ""
Write-Info "Documentation:"
Write-Info "  MIGRATION_TO_SUBMODULE.md - Submodule migration guide"
Write-Info "  MCP_SECURE_SETUP.md - MCP configuration details"
Write-Info "  CHANGELOG_MCP_FIX_2025-10-24.md - Recent changes"
Write-Host ""
