# 🚀 PC2 Setup - Quick Reference Card

## Prerequisites ✅
- [ ] Git installed on PC2
- [ ] GitHub account with access to TekupDK organization
- [ ] Access granted to `TekupDK/tekup-secrets` (private repo)

## Setup Commands (Run on PC2)

### Option 1: Automated Setup (Recommended) ⭐
```powershell
# Clone main workspace
git clone https://github.com/TekupDK/tekup.git
cd tekup

# Run automated setup
.\setup-new-machine.ps1

# Open workspace in VS Code
code Tekup-Portfolio.code-workspace
```

### Option 2: Manual Setup
```powershell
# Clone main workspace
git clone https://github.com/TekupDK/tekup.git
cd tekup

# Initialize submodules
git submodule init
git submodule update --recursive

# Setup MCP configurations
.\setup-mcp-secure.ps1

# Open workspace
code Tekup-Portfolio.code-workspace
```

## Verification ✓

### 1. Check Submodule
```powershell
cd tekup-secrets
Get-Content config/mcp.env -First 5
```
Should show:
```
# ==================== MCP CONFIGURATION ====================
# Model Context Protocol server credentials
# Used by: Cursor, Windsurf, Claude Desktop, VS Code Copilot
```

### 2. Check MCP Config (Cursor)
```powershell
Get-Content ~\.cursor\mcp.json
```
Should contain `tekup-billy`, `tekupvault`, `filesystem`, `github` servers.

### 3. Check Git Status
```powershell
git submodule status
```
Should show:
```
734f1aba4ae9577d9c25e52c09701c81f98e36b4 tekup-secrets (heads/main)
```

## Common Issues & Solutions 🔧

### Issue: "repository 'https://github.com/TekupDK/tekup-secrets.git' not found"
**Solution:** You don't have access to private repository.
```powershell
# Request access from @JonasAbde
# Or test your access:
git ls-remote https://github.com/TekupDK/tekup-secrets.git
```

### Issue: Empty `tekup-secrets` folder
**Solution:** Submodule not initialized.
```powershell
git submodule update --init --recursive
```

### Issue: MCP servers not loading in Cursor
**Solution:** Re-run MCP setup.
```powershell
.\setup-mcp-secure.ps1
# Restart Cursor IDE
```

## What Changed from PC1? 🔄

### Before (PC1 - Old Setup)
```
tekup-secrets/         # Regular tracked folder
├── .git-crypt/        # Encrypted with git-crypt
└── .env files         # Encrypted files
```

### After (PC2 - New Setup)
```
tekup-secrets/         # Git submodule → TekupDK/tekup-secrets
└── .env files         # Plaintext (private repo security)
```

**Key Differences:**
- ❌ No git-crypt required
- ✅ Separate private repository
- ✅ Easier team collaboration
- ✅ Automated setup script

## Documentation 📚

- **Quick Start:** This file
- **Complete Guide:** `MIGRATION_TO_SUBMODULE.md`
- **Detailed Changelog:** `SUBMODULE_MIGRATION_CHANGELOG_2025-10-24.md`
- **MCP Setup:** `MCP_SECURE_SETUP.md`
- **Troubleshooting:** `MCP_QUICK_FIX.md`

## Next Steps After Setup 🎯

1. **Open Cursor IDE**
   ```powershell
   code Tekup-Portfolio.code-workspace
   ```

2. **Test MCP Integration**
   - Open Cursor → Check MCP servers in settings
   - Ask Copilot: "List all Billy.dk products"
   - Verify response comes from tekup-billy MCP server

3. **Install Project Dependencies**
   ```powershell
   # Tekup Billy
   cd apps\production\tekup-billy
   npm install

   # TekupVault
   cd ..\tekup-vault
   pnpm install

   # RenOS Backend
   cd ..\..\rendetalje\services\backend-nestjs
   npm install
   ```

4. **Run Development Servers**
   ```powershell
   # Tekup Billy MCP (port 3000)
   cd apps\production\tekup-billy
   npm start:http

   # TekupVault API (port 3001)
   cd ..\tekup-vault
   pnpm dev
   ```

## Help & Support 💬

**For Setup Issues:**
1. Read `MIGRATION_TO_SUBMODULE.md` (comprehensive troubleshooting)
2. Check `setup-new-machine.ps1 -Help` for script options
3. Contact @JonasAbde on GitHub

**For Access Issues:**
1. Verify GitHub account linked to TekupDK organization
2. Confirm invite to `tekup-secrets` repository
3. Test access: `git ls-remote https://github.com/TekupDK/tekup-secrets.git`

---

**Setup Time:** ~5-10 minutes  
**Last Updated:** October 24, 2025  
**Status:** ✅ Ready for PC2 deployment
