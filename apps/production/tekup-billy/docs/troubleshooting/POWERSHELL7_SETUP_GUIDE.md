# ✅ PowerShell 7 Installeret

**Version:** PowerShell 7.5.3  
**Placering:** `C:\Program Files\PowerShell\7\pwsh.exe`  
**Status:** Fungerer perfekt! ✅

---

## 🔧 Næste Skridt: Konfigurer VS Code

### Metode 1: Via VS Code UI (Nemmest)

1. **Åbn en ny terminal i VS Code:** `Ctrl + backtick`
2. **Klik på dropdown-pilen** ved siden af `+` i terminal-panelet
3. **Vælg "Select Default Profile"**
4. **Vælg: "PowerShell"** (dette er nu PowerShell 7)
5. **Luk alle gamle terminaler** og åbn en ny

---

### Metode 2: Via Settings (Mere præcist)

1. **Åbn VS Code Settings:** `Ctrl + ,`
2. **Søg efter:** `terminal.integrated.defaultProfile.windows`
3. **Vælg:** `PowerShell`

Eller rediger `settings.json` direkte:

**Tryk:** `Ctrl + Shift + P` → skriv "Preferences: Open User Settings (JSON)"

**Tilføj:**

```json
{
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "terminal.integrated.profiles.windows": {
    "PowerShell": {
      "source": "PowerShell",
      "icon": "terminal-powershell"
    }
  }
}
```

---

## 🧪 Test Din Terminal

Efter du har sat PowerShell 7 som standard:

1. **Luk ALLE terminaler:** `Ctrl + Shift + P` → "Terminal: Kill All Terminals"
2. **Genstart VS Code** (valgfrit, men anbefalet)
3. **Åbn ny terminal:** `Ctrl + backtick`
4. **Verificer version:**

   ```powershell
   $PSVersionTable.PSVersion
   # Skal vise: 7.5.3
   ```

5. **Test kommando:**

   ```powershell
   Write-Host "Terminal fungerer perfekt!" -ForegroundColor Green
   ```

---

## 🎯 Fordele ved PowerShell 7

✅ **Mere stabil** - Ingen stack overflow fejl  
✅ **Hurtigere** - Bedre performance  
✅ **Cross-platform** - Virker på Windows, Linux, macOS  
✅ **Bedre VS Code integration** - Native support  
✅ **Nyere funktioner** - Pipeline chain operators (`&&`, `||`), ternary operator  
✅ **Parallel kommandoer** - `ForEach-Object -Parallel`

---

## 🔄 Hvis Du Stadig Får Fejl

### Quick Fix: Genstart PATH

Luk og genåbn VS Code for at opdatere system PATH.

### Verificer Installation

```powershell
# Fra Windows PowerShell 5.1:
Get-Command pwsh

# Eller direkte test:
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Version
```

### Manuel Path Tilføjelse (Hvis Nødvendig)

```powershell
# Kør som Administrator
$env:Path += ";C:\Program Files\PowerShell\7"
[Environment]::SetEnvironmentVariable("Path", $env:Path, "Machine")
```

---

## 📋 Kommando Reference

```powershell
# Tjek hvilken PowerShell version du bruger
$PSVersionTable.PSVersion

# Liste alle tilgængelige PowerShell versioner
Get-Command pwsh, powershell -All | Select-Object Source, Version

# Åbn PowerShell 7 direkte
pwsh

# Kør script i PowerShell 7
pwsh -File .\script.ps1

# PowerShell 7 uden profil
pwsh -NoProfile
```

---

## 🚀 Tekup-Billy Specifikt

Nu kan du køre alle Tekup-Billy kommandoer i en stabil terminal:

```powershell
# Test MCP server
npm run dev

# HTTP server
npm start:http

# Inspector
npm run inspect

# Test suite
npm run test:integration
```

---

## ✨ Bonus: PowerShell 7 Funktioner

### Pipeline Chain Operators

```powershell
# Kør næste kommando kun hvis første lykkes
npm install && npm run build

# Kør næste kommando kun hvis første fejler
npm test || Write-Host "Tests failed!"
```

### Ternary Operator

```powershell
$result = $value -gt 10 ? "High" : "Low"
```

### Parallel Processing

```powershell
1..10 | ForEach-Object -Parallel {
  Start-Sleep -Seconds 1
  "Processed $_"
} -ThrottleLimit 5
```

---

**Opdateret:** 22. oktober 2025  
**Status:** PowerShell 7.5.3 installeret og klar til brug! ✅  
**Næste:** Konfigurer VS Code og genstart terminaler
