# Fix GitHub MCP Token

## Problem
GitHub MCP virker ikke - får "Bad credentials" fejl.

## Løsning

### Trin 1: Revoke den gamle token på GitHub
1. Gå til: https://github.com/settings/tokens
2. Find token der starter med: `github_pat_11BDCB62Q0...`
3. Klik **Delete** eller **Revoke**

### Trin 2: Lav en ny Personal Access Token (classic)
1. Gå til: https://github.com/settings/tokens/new
2. **Note**: "Tekup MCP Access"
3. **Expiration**: 90 days (eller No expiration hvis du vil)
4. **Scopes** (vælg disse):
   - ✅ `repo` (Full control of private repositories)
   - ✅ `read:org` (Read org and team membership)
   - ✅ `workflow` (Update GitHub Action workflows)
5. Klik **Generate token**
6. **KOPIÉR TOKENET NU** (du kan ikke se det igen!)

### Trin 3: Sæt den nye token i miljøvariabel

#### PowerShell (nuværende session):
```powershell
$env:GITHUB_PERSONAL_ACCESS_TOKEN = "github_pat_DIN_NYE_TOKEN_HER"
```

#### Permanent (System miljøvariabel):
```powershell
[System.Environment]::SetEnvironmentVariable('GITHUB_PERSONAL_ACCESS_TOKEN', 'github_pat_DIN_NYE_TOKEN_HER', 'User')
```

#### Eller tilføj til .env fil:
```bash
# C:\Users\empir\Tekup\tekup-mcp-servers\.env
GITHUB_PERSONAL_ACCESS_TOKEN=github_pat_DIN_NYE_TOKEN_HER
```

### Trin 4: Genstart VS Code
Efter du har sat den nye token, genstart VS Code så MCP-serverne genindlæser miljøvariablen.

### Trin 5: Test
Prøv at bruge GitHub MCP - den skulle virke nu!

## Verification
Kør dette i PowerShell for at tjekke om token er sat:
```powershell
if($env:GITHUB_PERSONAL_ACCESS_TOKEN) { "✅ Token er sat" } else { "❌ Token mangler" }
```
