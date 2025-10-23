# Terminal Crash Fix - Stack Overflow Error (Exit Code -2147023895)

## Diagnose Result 🔍

**GOOD NEWS:** Your PowerShell profile (`Microsoft.PowerShell_profile.ps1`) runs perfectly in isolation.

**The Problem:** The crash only happens in VS Code/AI editors, which means:
- VS Code PowerShell extension conflict
- Environment variable pollution
- Host-specific issue (VS Code terminal vs. standard PowerShell)

## Quick Fixes (Choose One) ⚡

### Fix #1: Switch to Command Prompt (Fastest)

1. Press `Ctrl+Shift+P` in VS Code
2. Type: "Terminal: Select Default Profile"
3. Choose: **Command Prompt**
4. Open new terminal (`Ctrl+``)

**Why this works:** Bypasses PowerShell entirely

---

### Fix #2: Switch to PowerShell 7 (Best Long-Term)

```powershell
# Install PowerShell 7
winget install Microsoft.PowerShell

# In VS Code:
# Ctrl+Shift+P → "Terminal: Select Default Profile" → PowerShell 7 (pwsh.exe)
```

**Why this works:** PowerShell 7 is more stable, better VS Code integration, avoids legacy Windows PowerShell issues

---

### Fix #3: Disable PowerShell Extension Temporarily

1. Go to Extensions in VS Code (`Ctrl+Shift+X`)
2. Search for "PowerShell"
3. Click "Disable"
4. Reload VS Code
5. Open new terminal

**Why this works:** The extension may be interfering with terminal initialization

---

### Fix #4: Use PowerShell with -NoProfile Flag

Add to VS Code `settings.json`:

```json
{
  "terminal.integrated.profiles.windows": {
    "PowerShell (No Profile)": {
      "path": "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
      "args": ["-NoProfile", "-NoLogo"]
    }
  },
  "terminal.integrated.defaultProfile.windows": "PowerShell (No Profile)"
}
```

**Why this works:** Skips profile loading, eliminates any profile-related conflicts

---

## Already Applied ✅

You've already run `fix-all-ai-editors-terminal.ps1` which added:
- Windows Defender exclusions for all AI editors (Kiro, VS Code, Windsurf, Cursor)
- Process exclusions for `powershell.exe`, `pwsh.exe`, `cmd.exe`

This eliminates antivirus interference.

---

## Recommended Solution 🎯

**For immediate fix:** Switch to Command Prompt (Fix #1)

**For long-term:** Install PowerShell 7 (Fix #2) - it's faster, more modern, and better integrated with VS Code

---

## Testing Your Fix

After applying a fix:

1. **Close ALL terminals** in VS Code (`Ctrl+Shift+P` → "Terminal: Kill All Terminals")
2. **Restart VS Code** completely
3. **Open new terminal** (`Ctrl+``)
4. **Test with:**

   ```powershell
   Write-Host "Terminal works!" -ForegroundColor Green
   Get-Location
   ```

If it runs without crashing, you're fixed! ✅

---

## Advanced Troubleshooting (If Nothing Works)

### Check Windows Event Viewer

1. Open Event Viewer (Windows Key → search "Event Viewer")
2. Go to: **Windows Logs → Application**
3. Look for errors from **powershell.exe** around the crash time
4. Share any error messages for deeper diagnosis

### Try Safe Mode VS Code

```powershell
# Launch VS Code without extensions
code --disable-extensions
```

Open terminal and test. If it works, an extension is causing the issue.

### Check for Corrupted PowerShell

```powershell
# Repair PowerShell installation
sfc /scannow

# Or reinstall PowerShell 7
winget uninstall Microsoft.PowerShell
winget install Microsoft.PowerShell
```

---

## Your Profile Contents (For Reference)

Location: `C:\Users\empir\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1`

Total lines: 13

**This profile tested clean** - no stack overflow detected when run in isolation.

---

## Files Created for You

1. `find-profile-crash.ps1` - Diagnostic tool that found the issue
2. `fix-all-ai-editors-terminal.ps1` - Antivirus exclusion script (already run)
3. `fix-terminal-crash.ps1` - Windows Defender exclusion script (already run)

---

## Quick Command Reference

```powershell
# Test terminal without profile
powershell.exe -NoProfile

# Check PowerShell version
$PSVersionTable

# List installed PowerShell versions
Get-Command pwsh, powershell -ErrorAction SilentlyContinue | Select-Object Source

# Install PowerShell 7
winget install Microsoft.PowerShell

# Verify no errors in profile
powershell.exe -NoProfile -File $PROFILE
```

---

**Last Updated:** October 22, 2025  
**Status:** Profile is clean. Issue is VS Code environment-specific.  
**Recommended Action:** Switch to PowerShell 7 (winget install Microsoft.PowerShell)
