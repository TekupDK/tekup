# 🔍 Terminal Crash Diagnostic Report

**Date:** October 21, 2025, 10:00 AM  
**Error Code:** -2147023895 (0x80070005 - Access Denied)  
**Location:** Tekup-Billy Project  
**PowerShell Version:** 5.1.26100.6899

---

## 🚨 Problem Identificeret

Terminal processen crashede med exit code **-2147023895** (`E_ACCESSDENIED`).

### Windows Error Code Betydning

```
0x80070005 = ACCESS_DENIED
```

Dette er en **Windows security/permissions fejl** der typisk opstår når:
- Anti-virus software blokerer processen
- Windows Defender scanner aktivt
- File system permissions mangler
- Admin rettigheder kræves
- Execution policy restrictions

---

## 📊 System Information

### PowerShell Environment

```
Version: 5.1.26100.6899
Edition: Desktop
CLR Version: 4.0.30319.42000
```

### Execution Policy

```
Scope           ExecutionPolicy
-----           ---------------
MachinePolicy   Undefined
UserPolicy      Undefined
Process         Undefined
CurrentUser     RemoteSigned ✅
LocalMachine    Undefined
```

**Status:** ✅ Execution policy er korrekt konfigureret

---

## 🔧 Mulige Løsninger

### 1. Anti-virus Exclusions (Højt Anbefalet)

Tilføj disse stier til anti-virus exclusions:

```
C:\Users\empir\Tekup-Billy\
C:\Users\empir\AppData\Local\Programs\Microsoft VS Code\
C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe
```

**Windows Defender Exclusions:**

```powershell
# Kør som Administrator
Add-MpPreference -ExclusionPath "C:\Users\empir\Tekup-Billy"
Add-MpPreference -ExclusionPath "C:\Users\empir\AppData\Local\Programs\Microsoft VS Code"
```

### 2. VS Code Terminal Settings

Opdater VS Code settings for at bruge PowerShell 7 (hvis installeret):

**File → Preferences → Settings → Search "terminal"**

```json
{
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "terminal.integrated.profiles.windows": {
    "PowerShell": {
      "source": "PowerShell",
      "icon": "terminal-powershell"
    },
    "Command Prompt": {
      "path": [
        "${env:windir}\\System32\\cmd.exe"
      ]
    }
  }
}
```

### 3. Kør VS Code som Administrator

**Midlertidig Løsning:**
- Højreklik på VS Code
- Vælg "Run as administrator"

**Permanent Løsning:**
- Højreklik på VS Code shortcut
- Properties → Compatibility tab
- ✅ Check "Run this program as an administrator"

### 4. Disable Real-time Protection (Midlertidigt)

**Kun til testing:**

```powershell
# Disable Windows Defender real-time protection (requires admin)
Set-MpPreference -DisableRealtimeMonitoring $true

# Test hvis problemet forsvinder
# Husk at enable igen efter test:
Set-MpPreference -DisableRealtimeMonitoring $false
```

### 5. Alternative Terminal

Prøv at bruge en alternativ terminal:

**Command Prompt:**

```
Ctrl+Shift+P → Terminal: Select Default Profile → Command Prompt
```

**PowerShell 7 (hvis installeret):**

```
Ctrl+Shift+P → Terminal: Select Default Profile → PowerShell 7
```

---

## 🎯 Anbefalet Fix (Step-by-Step)

### Option A: Quick Fix (Anbefalet)

1. **Tilføj folder til Windows Defender exclusions:**

   ```powershell
   # Kør i PowerShell som Administrator
   Add-MpPreference -ExclusionPath "C:\Users\empir\Tekup-Billy"
   ```

2. **Restart VS Code**

3. **Test terminal:**

   ```powershell
   # Åbn ny terminal og test
   Write-Host "Terminal fungerer!" -ForegroundColor Green
   ```

### Option B: Complete Fix

1. **Install PowerShell 7:**

   ```powershell
   winget install --id Microsoft.Powershell --source winget
   ```

2. **Update VS Code settings:**

   ```json
   {
     "terminal.integrated.defaultProfile.windows": "PowerShell"
   }
   ```

3. **Restart VS Code**

---

## 📝 Troubleshooting Steps

Hvis problemet fortsætter:

### 1. Check Event Viewer

```
Win + R → eventvwr.msc
Windows Logs → Application
Filter for "PowerShell" errors around crash time
```

### 2. Enable PowerShell Logging

```powershell
# Enable script block logging
$regPath = "HKLM:\Software\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging"
New-Item -Path $regPath -Force
Set-ItemProperty -Path $regPath -Name EnableScriptBlockLogging -Value 1
```

### 3. Check File Permissions

```powershell
# Check folder permissions
Get-Acl "C:\Users\empir\Tekup-Billy" | Format-List
```

### 4. VS Code Terminal Trace Logging

```json
{
  "terminal.integrated.logLevel": "trace"
}
```

Restart VS Code og tjek Output → Terminal

---

## 🔍 Exit Code Reference

| Exit Code | Hex | Betydning |
|-----------|-----|-----------|
| -2147023895 | 0x80070005 | Access Denied |
| -2147024891 | 0x80070005 | Access Denied (variant) |
| 259 | 0x103 | Still Active |
| 3221225786 | 0xC000013A | Ctrl+C interrupt |
| 1 | 0x1 | General error |

---

## 🚀 Forebyggelse

For at undgå fremtidige crashes:

1. ✅ **Tilføj project folder til anti-virus exclusions**
2. ✅ **Brug PowerShell 7** i stedet for Windows PowerShell 5.1
3. ✅ **Opdater VS Code** regelmæssigt
4. ✅ **Monitor Windows Defender** aktivitet under udvikling
5. ✅ **Undgå lange kommandoer** i terminal (brug scripts i stedet)

---

## 📚 Ressourcer

- [VS Code Terminal Troubleshooting](https://code.visualstudio.com/docs/supporting/troubleshoot-terminal-launch)
- [PowerShell Exit Codes](https://docs.microsoft.com/en-us/powershell/scripting/developer/cmdlet/cmdlet-error-reporting)
- [Windows Error Codes](https://docs.microsoft.com/en-us/windows/win32/debug/system-error-codes)

---

## ✅ Status Efter Fix

Efter du har implementeret en af løsningerne, test med:

```powershell
# Test 1: Basic command
Write-Host "Test 1: Basic command OK" -ForegroundColor Green

# Test 2: File operations
Get-ChildItem | Select-Object -First 5
Write-Host "Test 2: File operations OK" -ForegroundColor Green

# Test 3: Long command
$test = "This is a long test command that should not crash the terminal if the fix worked correctly"
Write-Host "Test 3: Long command OK - $test" -ForegroundColor Green

# Test 4: API call (hvis du har curl installeret)
Invoke-RestMethod -Uri "https://tekup-billy.onrender.com/health" -Method Get
Write-Host "Test 4: API call OK" -ForegroundColor Green
```

Alle tests skal køre uden crash! 🎉

---

**Konklusion:**  
Terminal crash med exit code -2147023895 er **meget sandsynligt** forårsaget af **Windows Defender** eller **anti-virus software** der scanner/blokerer PowerShell processer i real-time.

**Recommended Fix:** Tilføj project folder til Windows Defender exclusions (se Option A ovenfor).
