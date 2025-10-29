# 🔒 TEKUP MCP SECURITY AUDIT

**Dokument Version:** 1.0.0  
**Dato:** 26. oktober 2025  
**Severity:** 🔴 KRITISK  
**Status:** Identified - Remediation Required

---

## ⚠️ EXECUTIVE SUMMARY

Under komplet analyse af Tekup's MCP økosystem blev der identificeret **1 kritisk sikkerhedsproblem** og **3 mindre problemer** der kræver handling.

### Kritisk Severity

- **1 kritisk issue:** Hardcoded credentials i Cursor MCP config
- **Impact:** Exposed GitHub PAT, Supabase credentials, Billy API key
- **Affected Systems:** Cursor IDE, potentielt git backups
- **Immediate Action Required:** JA

### Medium Severity

- **2 medium issues:** Memory file inconsistency, placeholder API keys
- **Impact:** Fragmented context, non-functional servers
- **Immediate Action Required:** NEJ (men anbefalet indenfor 1 uge)

---

## 🔴 KRITISK ISSUE #1: HARDCODED CREDENTIALS I CURSOR

### Problem Description

**File:** `C:\Users\empir\.cursor\mcp.json`  
**Discovery Date:** 26. oktober 2025  
**Severity:** CRITICAL 🔴

Cursor IDE MCP konfiguration indeholder hardcoded credentials i plain text:

```json
{
  "mcpServers": {
    "github": {
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "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"
      }
    },
    "tekup-billy": {
      "env": {
        "SUPABASE_URL": "https://oaevagdgrasfppbrxbey.supabase.co",
        "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcyNjM5ODgsImV4cCI6MjA0MjgzOTk4OH0.1EiilYPIH4BWI_A2XWWZjEh-kI_K8aNcm_Ie5i0bPwA",
        "BILLY_API_KEY": "43e7439bccb58a8a96dd57dd06dae10add009111",
        "BILLY_ORGANIZATION_ID": "pmf9tU56RoyZdcX3k69z1g"
      }
    }
  }
}
```

### Security Impact

#### Immediate Risks

1. **Git Commit Risk**
   - Hvis `.cursor/` folder committed til git → credentials exposed i history
   - Potentielt synligt i GitHub/GitLab hvis pushed
   - Git history cleanup kompleks og ikke garanteret

2. **Backup Exposure**
   - File backups (OneDrive, cloud backup) indeholder credentials
   - Old versions kan ikke let fjernes
   - Tredjeparter med backup access har credentials

3. **No Credential Rotation**
   - Hardcoded values kan ikke rotates uden manual file edit
   - Ingen central credential management
   - Modsatte best practices for secret management

4. **Access Scope**
   - GitHub PAT har fuld account access (afhængig af scope)
   - Supabase anon key kan query database
   - Billy API key har organisation access

#### Potential Attack Vectors

- File system compromise → instant credential access
- Malware scanning local files
- Accidental git commit → public exposure
- Cloud backup breach
- Developer sharing config "for reference"

### Affected Credentials

| Credential | Type | Scope | Risk Level |
|------------|------|-------|------------|
| `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` | GitHub PAT | Fuld account access | 🔴 CRITICAL |
| `eyJhbGciOiJIUzI1NiIs...` | Supabase Anon Key | Database read/write | 🔴 CRITICAL |
| `43e7439bccb58a8a96dd57dd06dae10add009111` | Billy API Key | Organization billing | 🔴 CRITICAL |
| `pmf9tU56RoyZdcX3k69z1g` | Billy Org ID | Organization identifier | 🟡 MEDIUM |

---

## 🛠️ REMEDIATION PLAN

### Step 1: Immediate Action (DO NOW)

#### 1.1 Rotate Exposed Credentials

**GitHub Personal Access Token:**
```bash
# 1. Go to GitHub → Settings → Developer settings → Personal access tokens
# 2. Find token starting with ghp_xOa3...
# 3. Click "Delete" or "Regenerate"
# 4. Create new token with minimal required scopes
# 5. Save new token to tekup-secrets
```

**Supabase Credentials:**
```bash
# Note: Supabase anon key is safe to expose (RLS policies protect data)
# BUT best practice is environment variables
# Action: Verify RLS policies are correct, consider rotating service_role key if exposed
```

**Billy API Key:**
```bash
# 1. Login to Billy.dk
# 2. Go to Settings → API
# 3. Revoke old key: 43e7439bcc...
# 4. Generate new API key
# 5. Save to tekup-secrets
```

#### 1.2 Update Cursor Config

**Before:**
```json
{
  "mcpServers": {
    "github": {
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "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"
      }
    }
  }
}
```

**After:**
```json
{
  "mcpServers": {
    "github": {
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    }
  }
}
```

**Full Fixed Config:**
```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-memory"
      ],
      "env": {
        "MEMORY_FILE_PATH": "C:\\Users\\empir\\.mcp-shared\\memory.json"
      }
    },
    "sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    },
    "puppeteer": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-puppeteer"
      ]
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\Users\\empir"
      ]
    },
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    },
    "tekup-billy": {
      "command": "node",
      "args": [
        "C:\\Users\\empir\\Tekup\\apps\\production\\tekup-billy\\dist\\index.js"
      ],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_ANON_KEY": "${SUPABASE_ANON_KEY}",
        "BILLY_API_KEY": "${BILLY_API_KEY}",
        "BILLY_ORGANIZATION_ID": "${BILLY_ORGANIZATION_ID}"
      }
    },
    "tekupvault": {
      "url": "https://tekupvault.onrender.com/mcp"
    }
  }
}
```

#### 1.3 Set Environment Variables

**Windows (PowerShell):**
```powershell
# Set user-level environment variables
[System.Environment]::SetEnvironmentVariable('GITHUB_PERSONAL_ACCESS_TOKEN', 'ghp_NEW_TOKEN_HERE', 'User')
[System.Environment]::SetEnvironmentVariable('SUPABASE_URL', 'https://oaevagdgrasfppbrxbey.supabase.co', 'User')
[System.Environment]::SetEnvironmentVariable('SUPABASE_ANON_KEY', 'eyJhbG...NEW_KEY', 'User')
[System.Environment]::SetEnvironmentVariable('BILLY_API_KEY', 'NEW_BILLY_KEY', 'User')
[System.Environment]::SetEnvironmentVariable('BILLY_ORGANIZATION_ID', 'pmf9tU56RoyZdcX3k69z1g', 'User')

# Restart Cursor IDE to load new environment variables
```

**Alternative: Load from tekup-secrets:**
```powershell
# Add to PowerShell profile or startup script
# C:\Users\empir\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1

# Load Tekup secrets
$secretsPath = "C:\Users\empir\Tekup\tekup-secrets"
if (Test-Path "$secretsPath\.env") {
    Get-Content "$secretsPath\.env" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
        }
    }
}
```

### Step 2: Verify Git History (URGENT)

#### 2.1 Check if Cursor Config Was Ever Committed

```bash
cd C:\Users\empir\Tekup

# Search git history for cursor config
git log --all --full-history -- "**/.cursor/mcp.json"

# Search for exposed credentials in history
git log --all --full-history -S "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"
git log --all --full-history -S "43e7439bccb58a8a96dd57dd06dae10add009111"
```

#### 2.2 If Found in Git History (CRITICAL)

**Option A: BFG Repo-Cleaner (Recommended)**
```bash
# Install BFG
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Backup repo first!
cd C:\Users\empir\Tekup
git clone --mirror . ../Tekup-backup.git

# Remove credentials from history
java -jar bfg.jar --replace-text credentials.txt ../Tekup.git

# credentials.txt contains:
# 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==>REDACTED
# 43e7439bccb58a8a96dd57dd06dae10add009111==>REDACTED

# Force push (coordinate with team!)
cd C:\Users\empir\Tekup
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force --all
```

**Option B: git-filter-repo**
```bash
# Install git-filter-repo
pip install git-filter-repo

# Remove file from history
git filter-repo --path .cursor/mcp.json --invert-paths

# Force push
git push --force --all
```

**⚠️ WARNING:** Force push affects entire team. Coordinate først!

### Step 3: Prevent Future Issues

#### 3.1 Update .gitignore

```bash
cd C:\Users\empir\Tekup

# Add to .gitignore if not already present
echo "" >> .gitignore
echo "# IDE MCP Configs (may contain credentials)" >> .gitignore
echo ".cursor/" >> .gitignore
echo ".codeium/" >> .gitignore
echo "**/.kilocode/cli/mcp.json" >> .gitignore
echo "**/AppData/Roaming/*/User/mcp.json" >> .gitignore
```

#### 3.2 Setup Pre-commit Hook

```bash
# Create pre-commit hook
# File: .git/hooks/pre-commit

#!/bin/bash

# Check for potential secrets in staged files
if git diff --cached --name-only | grep -E '\.(json|env|config)$'; then
    echo "⚠️  JSON/config files detected. Checking for secrets..."
    
    if git diff --cached | grep -E '(ghp_[a-zA-Z0-9]{36}|sk-[a-zA-Z0-9]{48}|AKIA[A-Z0-9]{16})'; then
        echo "🔴 ERROR: Potential secret detected in commit!"
        echo "Please use environment variables instead of hardcoded secrets."
        exit 1
    fi
fi

exit 0
```

```powershell
# Make executable (Git Bash)
chmod +x .git/hooks/pre-commit
```

#### 3.3 Document Secret Management Policy

**Create:** `C:\Users\empir\Tekup\docs\SECURITY_POLICY.md`

```markdown
# Tekup Security Policy

## Secret Management

### ✅ DO
- Use environment variables: `${VAR_NAME}`
- Store secrets in `tekup-secrets/` submodule
- Use `.env` files (never commit!)
- Rotate credentials regularly

### ❌ DON'T
- Hardcode credentials in config files
- Commit `.env` files
- Share secrets in chat/email
- Use weak/default credentials

### MCP Config Pattern
```json
{
  "env": {
    "API_KEY": "${API_KEY}"  // ✅ GOOD
    // "API_KEY": "sk-1234..." // ❌ BAD
  }
}
```
```

---

## 🟡 MEDIUM ISSUE #2: MEMORY FILE INCONSISTENCY

### Problem Description

**Severity:** MEDIUM 🟡  
**Impact:** Fragmented context, no cross-IDE memory

5 IDEs bruger shared memory: `.mcp-shared\memory.json`  
Cursor bruger isoleret memory: `.cursor\memory.json`

### Affected IDEs

| IDE | Memory Path | Shared? |
|-----|-------------|---------|
| VS Code | `.mcp-shared\memory.json` | ✅ Yes |
| Windsurf | `.mcp-shared\memory.json` | ✅ Yes |
| Kilo Code | `.mcp-shared\memory.json` | ✅ Yes |
| Trae | `.mcp-shared\memory.json` | ✅ Yes |
| Tekup/.claude | `.mcp-shared\memory.json` | ✅ Yes |
| **Cursor** | **`.cursor\memory.json`** | ❌ **No** |

### Impact
- Cursor AI har ikke context fra andre IDEs
- Memory fragmentation
- Duplikerede learnings across IDEs
- Inconsistent AI behavior

### Solution

Update Cursor config memory path:

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_FILE_PATH": "C:\\Users\\empir\\.mcp-shared\\memory.json"
      }
    }
  }
}
```

**Timeline:** Within 1 week  
**Priority:** Medium (improves UX but not security-critical)

---

## 🟡 MEDIUM ISSUE #3: PLACEHOLDER API KEYS

### Problem Description

**Severity:** MEDIUM 🟡  
**Impact:** Non-functional MCP servers

**Affected:** Jan IDE (`AppData\Roaming\Jan\data\mcp_config.json`)

```json
{
  "exa": {
    "disabled": true,
    "command": "npx",
    "args": ["-y", "exa-mcp-server"],
    "env": {
      "EXA_API_KEY": ""
    }
  },
  "serper": {
    "command": "npx",
    "args": ["-y", "serper-search-scrape-mcp-server"],
    "env": {
      "SERPER_API_KEY": "YOUR_SERPER_API_KEY_HERE"
    }
  }
}
```

### Solution Options

**Option A: Get Real API Keys**
```bash
# Exa (search API): https://exa.ai/
# Serper (Google search): https://serper.dev/

# Add to environment variables
[System.Environment]::SetEnvironmentVariable('EXA_API_KEY', 'your_key_here', 'User')
[System.Environment]::SetEnvironmentVariable('SERPER_API_KEY', 'your_key_here', 'User')

# Update config
{
  "exa": {
    "disabled": false,
    "env": {
      "EXA_API_KEY": "${EXA_API_KEY}"
    }
  }
}
```

**Option B: Disable Unused Servers**
```json
{
  "exa": {
    "disabled": true
  },
  "serper": {
    "disabled": true
  }
}
```

**Timeline:** 1-2 weeks  
**Priority:** Low-Medium (functionalitet forbedring)

---

## 🟢 LOW ISSUE #4: EMPTY QODER CONFIG

### Problem Description

**Severity:** LOW 🟢  
**Impact:** Qoder IDE har ingen MCP functionality

**File:** `AppData\Roaming\Qoder\SharedClientCache\mcp.json`
```json
{
  "mcpServers": {}
}
```

### Solution Options

**Option A: Configure MCP Servers for Qoder**
```json
{
  "mcpServers": {
    "memory": { /* ... */ },
    "filesystem": { /* ... */ },
    "sequential-thinking": { /* ... */ },
    "tekup-billy": { /* ... */ }
  }
}
```

**Option B: Keep Empty** (if Qoder not used for development)

**Timeline:** As needed  
**Priority:** Low (depends on Qoder usage)

---

## 📋 REMEDIATION CHECKLIST

### Immediate (Day 1)

- [ ] **CRITICAL:** Rotate GitHub PAT
- [ ] **CRITICAL:** Rotate Billy API key
- [ ] **CRITICAL:** Update Cursor config with `${VAR}` syntax
- [ ] **CRITICAL:** Set environment variables
- [ ] **CRITICAL:** Test Cursor MCP functionality
- [ ] **CRITICAL:** Check git history for exposed credentials
- [ ] Update `.gitignore` for IDE configs

### Week 1

- [ ] Fix Cursor memory path inconsistency
- [ ] Setup pre-commit hook for secret detection
- [ ] Document security policy
- [ ] Audit other IDE configs for similar issues
- [ ] Review tekup-secrets submodule usage

### Week 2

- [ ] Decide on Jan API keys (get or disable)
- [ ] Configure or disable Qoder MCP
- [ ] Review Tekup/.kilocode missing servers
- [ ] Security team review (if applicable)

### Ongoing

- [ ] Quarterly credential rotation
- [ ] Regular security audits
- [ ] Team security training
- [ ] Monitor for exposed secrets (GitHub secret scanning)

---

## 🎓 LESSONS LEARNED

### What Went Wrong

1. Manual credential entry in IDE configs without validation
2. No centralized secret management enforcement
3. Lack of pre-commit hooks for secret detection
4. No security audit of MCP configs during setup

### Prevention for Future

#### For Custom MCP Servers

1. **Design for environment variables from start**
   ```typescript
   const apiKey = process.env.API_KEY;
   if (!apiKey) throw new Error("API_KEY environment variable required");
   ```

2. **Provide `.env.example` files**
   ```bash
   # .env.example
   GITHUB_PERSONAL_ACCESS_TOKEN=your_token_here
   BILLY_API_KEY=your_key_here
   ```

3. **Documentation emphasizes security**
   - README mentions environment variables first
   - Setup guides include secret management
   - Examples never show real credentials

4. **Automated validation**
   ```typescript
   // validate-config.ts
   if (config.includes('ghp_') || config.includes('sk-')) {
     throw new Error("Hardcoded secrets detected!");
   }
   ```

---

## 📚 REFERENCES

### Security Resources

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [git-filter-repo](https://github.com/newren/git-filter-repo)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

### Tekup Resources

- tekup-secrets submodule (reference for secret storage)
- VS Code MCP config (reference for proper `${VAR}` usage)
- Windsurf MCP config (reference for environment variables)

---

**Document Version:** 1.0.0  
**Last Updated:** 26. oktober 2025  
**Next Review:** 26. november 2025  
**Status:** Active Remediation Required
