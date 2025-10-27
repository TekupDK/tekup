# KRITISK SIKKERHED - Revoke GitHub PAT ASAP

## 🚨 EXPOSED TOKEN FOUND

**Lokation**: `%APPDATA%\Claude\claude_desktop_config.json`

**Token**: `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`

**Også fundet i**: 
- Git commits (5c7ca06)
- CLAUDE_CODE_BRIEFING.md (redacted)
- MCP_COMPLETE_AUDIT_2025-10-27.md (redacted)

## Handling - GØR NU

### 1. Revoke Token (AKUT)

1. Gå til: https://github.com/settings/tokens
2. Find token: `github_pat_11BDCB62Q0...`
3. Klik "Delete" eller "Revoke"
4. Bekræft deletion

### 2. Generer Ny Token (Minimal Scope)

**Scope needed for MCP**:
- ✅ `repo:status` - Commit status
- ✅ `repo:public_repo` - Public repositories only
- ❌ ~~`repo`~~ - Fuld adgang IKKE nødvendig

**Settings**:
```
Name: MCP GitHub Server (2025-10-27)
Expiration: 90 days
Scopes: 
  - repo:status
  - repo:public_repo
```

### 3. Tilføj til Windows Environment Variables

```powershell
# Åbn PowerShell som Administrator
[System.Environment]::SetEnvironmentVariable(
    'GITHUB_PERSONAL_ACCESS_TOKEN', 
    'din_nye_token_her', 
    'User'
)

# Verificer
$env:GITHUB_PERSONAL_ACCESS_TOKEN
```

### 4. Update Claude Desktop Config

**Find**: `%APPDATA%\Claude\claude_desktop_config.json`

**Ændr**:
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    }
  }
}
```

### 5. Verificer

Genstart Claude Desktop og test GitHub MCP server virker.

---

**VIGTIGT**: Token er også synlig i git history (commit 5c7ca06). Overvej:
- Git history rewrite (git filter-repo)
- ELLER: Bare revoke token (simplere)

**Action**: REVOKE TOKEN NU!


