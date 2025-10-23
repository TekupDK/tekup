# PowerShell Execution Policy Fix Guide

## 🚨 Problem
PowerShell commands fejler med exit code: `-2147023895`  
Dette er typisk en execution policy restriction.

## 🔧 Løsninger (prøv i rækkefølge)

### Løsning 1: Sæt Execution Policy (Anbefalet)
```powershell
# 1. Åbn PowerShell som Administrator
# 2. Kør denne kommando:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 3. Bekræft med 'Y' når prompted
# 4. Verificer med:
Get-ExecutionPolicy
```

### Løsning 2: Bypass for enkelte kommandoer
```powershell
# Kør kommandoer med bypass:
powershell -ExecutionPolicy Bypass -Command "Get-ChildItem"
powershell -ExecutionPolicy Bypass -File ".\script.ps1"
```

### Løsning 3: Windows Terminal som Administrator
1. **Højreklik på Windows Terminal**
2. **Vælg "Run as administrator"**
3. **Åbn PowerShell tab**
4. **Kør**: `Set-ExecutionPolicy RemoteSigned`

### Løsning 4: VS Code Terminal Fix
1. **Åbn VS Code som Administrator**
2. **Gå til Terminal → New Terminal**
3. **Vælg PowerShell som default**
4. **Test kommandoer**

## 🧪 Test at det virker

### Basic Test
```powershell
# Test basic commands
Get-Location
Get-ChildItem
$PSVersionTable
```

### Test vores scripts
```powershell
# Test status check script
.\check-rendetalje-status.ps1

# Test directory listing
Get-ChildItem "C:\Users\empir" -Directory
```

## 🔍 Debugging Steps

### Tjek nuværende policy
```powershell
Get-ExecutionPolicy -List
```

### Tjek PowerShell version
```powershell
$PSVersionTable.PSVersion
```

### Tjek om du er Administrator
```powershell
([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
```

## 🛡️ Execution Policy Forklaring

### Policy Levels
- **Restricted**: Ingen scripts kan køre (default)
- **RemoteSigned**: Lokale scripts kan køre, downloaded skal være signed
- **Unrestricted**: Alle scripts kan køre (ikke anbefalet)
- **Bypass**: Ingen restrictions (midlertidig brug)

### Scopes
- **CurrentUser**: Kun for nuværende bruger
- **LocalMachine**: For alle brugere (kræver admin)
- **Process**: Kun for nuværende PowerShell session

## 🚀 Anbefalet Setup

### For Development
```powershell
# Sæt for current user (sikrest)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Eller for hele maskinen (kræver admin)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine
```

### For VS Code Integration
1. **Sæt execution policy som vist ovenfor**
2. **Genstart VS Code**
3. **Test terminal commands**

## 🔄 Hvis problemet fortsætter

### Alternative Terminals
- **Git Bash**: Brug bash commands i stedet
- **WSL**: Windows Subsystem for Linux
- **Command Prompt**: Brug cmd commands

### Alternative Approaches
- **Batch files**: Lav .bat filer i stedet for .ps1
- **Node.js scripts**: Brug npm scripts til automation
- **Manual execution**: Kør kommandoer manuelt

## ✅ Verification Checklist

Efter fix, verificer at disse virker:
- [ ] `Get-Location`
- [ ] `Get-ChildItem`
- [ ] `Test-Path "C:\Users\empir\RendetaljeOS"`
- [ ] `.\check-rendetalje-status.ps1`
- [ ] VS Code integrated terminal commands

## 📞 Hvis intet virker

### Kontakt IT Support eller:
1. **Tjek Group Policy**: Måske sat af organisation
2. **Antivirus**: Måske blokerer PowerShell execution
3. **Windows Updates**: Måske påkrævet
4. **User Permissions**: Måske mangler nødvendige rettigheder

---

**Status**: 🔧 Fix Required  
**Priority**: High - Blokerer development workflow  
**Estimated Time**: 5-10 minutter