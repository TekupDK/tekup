# 🔐 Tekup Secrets - Centralized Secret Management

**Purpose:** Centralized, secure environment variable management for all Tekup Portfolio projects  
**Status:** ✅ Production Ready (Updated for TekupDK/Tekup-Portfolio workspace)  
**Location:** `C:\Users\empir\Tekup\tekup-secrets\`  
**Last Updated:** October 23, 2025

## 🎯 What is Tekup Secrets?

Tekup Secrets is the **central nervous system** for all secret configurations across the entire Tekup Portfolio. Instead of scattered `.env` files everywhere, it consolidates **all secret configurations in one place** with intelligent distribution to all services.

### 🔧 Core Problems It Solves:
- **Secrets Sprawl:** No more scattered `.env` files across services
- **Inconsistency:** Same API keys used consistently across all services  
- **Security Risks:** Git protection prevents accidental commits
- **Maintenance:** Update one API key, automatically distributed everywhere
- **Environment Management:** Clean separation of development vs production

## 📁 Architecture

## 📁 Architecture

**Structure:**
```bash
tekup-secrets/
├── 📄 Documentation
│   ├── README.md                    # This file (complete guide)
│   ├── QUICK_START.md              # 5-minute getting started
│   ├── CHANGELOG.md                # Version history & updates
│   ├── SYSTEM_OVERVIEW.md          # High-level system overview  
│   ├── TEKUP_WORKSPACE_INTEGRATION.md # Workspace integration guide
│   ├── SETUP_GIT_CRYPT.md         # Git encryption setup
│   └── PC2_SETUP.md               # Multi-PC setup instructions
│
├── 🔧 Configuration
│   ├── .env.production             # Production secrets (NEVER commit)
│   ├── .env.development            # Development secrets (local only)
│   ├── .env.shared                 # Shared non-sensitive config
│   └── config/
│       ├── ai-services.env         # OpenAI, Gemini, Ollama
│       ├── databases.env           # Supabase, PostgreSQL
│       ├── google-workspace.env    # Gmail, Calendar, Drive
│       ├── apis.env               # Billy.dk, GitHub, external APIs
│       └── monitoring.env         # Sentry, logging, feature flags
│
├── 🤖 Automation
│   └── scripts/
│       ├── sync-to-project.ps1     # Copy .env to specific project
│       └── sync-all.ps1           # Sync to all projects (most used)
│
└── 🛡️ Security
    └── .gitignore                  # CRITICAL: Ignore all .env files
```

## 📚 Documentation Index

| Document | Purpose | Audience |
|----------|---------|----------|
| **QUICK_START.md** | Get running in 5 minutes | New developers |
| **SYSTEM_OVERVIEW.md** | High-level architecture | Technical overview |
| **TEKUP_WORKSPACE_INTEGRATION.md** | How it integrates with Tekup Portfolio | DevOps, Architects |
| **CHANGELOG.md** | Version history & breaking changes | All users |
| **SETUP_GIT_CRYPT.md** | Secure git synchronization | Multi-PC setups |
| **PC2_SETUP.md** | Instructions for second PC | Setup team |

## 🔐 Security Architecture

### File Permissions (Windows)
```powershell
# Set restricted access (owner only)
icacls "C:\Users\empir\tekup-secrets" /inheritance:r /grant:r "$env:USERNAME:(OI)(CI)F"
```

### Git Protection
```gitignore
# tekup-secrets/.gitignore
*.env
*.env.*
!.env.example
.env.local
.env.production
.env.development
config/*.env
secrets/
*.key
*.pem
```

## 📋 Environment File Structure

### .env.production (Master Production Secrets)
```bash
# ==================== LLM PROVIDERS ====================
OPENAI_API_KEY=sk-proj-REAL_PRODUCTION_KEY
GEMINI_KEY=REAL_GEMINI_PRODUCTION_KEY

# ==================== DATABASES ====================
DATABASE_URL=postgresql://postgres:REAL_PASSWORD@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres
SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...REAL_KEY
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...REAL_KEY

# ==================== GOOGLE WORKSPACE ====================
GOOGLE_PROJECT_ID=renos-backend-443015
GOOGLE_CLIENT_EMAIL=renos-backend@renos-backend-443015.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nREAL_KEY_HERE\n-----END PRIVATE KEY-----"
GOOGLE_IMPERSONATED_USER=jonas@rendetalje.dk

# ==================== GITHUB ====================
GITHUB_TOKEN=ghp_REAL_TOKEN_HERE
GITHUB_WEBHOOK_SECRET=REAL_WEBHOOK_SECRET

# ==================== APIS ====================
BILLY_API_KEY=REAL_BILLY_KEY
BILLY_ORGANIZATION_ID=REAL_ORG_ID
FIRECRAWL_API_KEY=REAL_FIRECRAWL_KEY

# ==================== MONITORING ====================
SENTRY_DSN=https://REAL_SENTRY_DSN@sentry.io/PROJECT_ID
```

### .env.shared (Non-sensitive defaults)
```bash
# Application defaults (safe to share)
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
RUN_MODE=dry-run

# Feature flags
AUTO_RESPONSE_ENABLED=false
FOLLOW_UP_ENABLED=false
ESCALATION_ENABLED=true
ENABLE_VOICE_ALERTS=true

# LLM defaults
LLM_PROVIDER=heuristic
OPENAI_MODEL=gpt-4o-mini
GEMINI_MODEL=gemini-2.0-flash-exp
OLLAMA_BASE_URL=http://localhost:11434

# Calendar
GOOGLE_CALENDAR_ID=c_39570a852bf141658572fa37bb229c7246564a6cca47560bc66a4f9e4fec67ff@group.calendar.google.com

# URLs
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:3000
TEKUPVAULT_API_URL=https://tekupvault-api.onrender.com
```

## 🤖 AI Agent Integration

### Auto-Sync Script (scripts/sync-to-project.ps1) - UPDATED for TekupDK
```powershell
<#
.SYNOPSIS
    Sync environment variables to a specific project
.EXAMPLE
    .\sync-to-project.ps1 -Project "tekup-billy" -Environment "development"
#>
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("tekup-ai", "tekup-billy", "tekup-vault", "tekup-gmail-services", "RendetaljeOS")]
    [string]$Project,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("production", "development")]
    [string]$Environment = "development"
)

$secretsRoot = "C:\Users\empir\Tekup\tekup-secrets"
$projectsRoot = "C:\Users\empir\Tekup"

# Project path mapping (updated for new Tekup-Portfolio workspace structure)
$projectPaths = @{
    "tekup-ai" = "$projectsRoot\services\tekup-ai"
    "tekup-billy" = "$projectsRoot\apps\production\tekup-billy"
    "tekup-vault" = "$projectsRoot\apps\production\tekup-vault"
    "tekup-gmail-services" = "$projectsRoot\services\tekup-gmail-services"
    "RendetaljeOS" = "$projectsRoot\apps\rendetalje\monorepo"
}

$projectPath = $projectPaths[$Project]

if (-not (Test-Path $projectPath)) {
    Write-Error "❌ Project path not found: $projectPath"
    exit 1
}

# Merge files (.env.shared + .env.{environment} + all component configs)
$envContent = @()

# Add shared config
if (Test-Path "$secretsRoot\.env.shared") {
    $envContent += Get-Content "$secretsRoot\.env.shared"
}

# Add environment-specific secrets
$envFile = "$secretsRoot\.env.$Environment"
if (Test-Path $envFile) {
    $envContent += Get-Content $envFile
}

# Add component-specific configs
$configFiles = @(
    "config\ai-services.env",
    "config\databases.env",
    "config\google-workspace.env",
    "config\apis.env",
    "config\monitoring.env"
)

foreach ($configFile in $configFiles) {
    $fullPath = Join-Path $secretsRoot $configFile
    if (Test-Path $fullPath) {
        $envContent += Get-Content $fullPath
    }
}

# Write to project
$targetEnvFile = Join-Path $projectPath ".env"
$envContent | Set-Content $targetEnvFile -Encoding UTF8

Write-Host "✅ Synced $Environment secrets to $Project" -ForegroundColor Green
Write-Host "📁 Target: $targetEnvFile" -ForegroundColor Cyan
```

### AI-Readable Config Loader (TypeScript)
```typescript
// packages/tekup-config/src/secrets-loader.ts
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

const SECRETS_ROOT = process.env.TEKUP_SECRETS_PATH || 'C:\\Users\\empir\\tekup-secrets';

export class SecretsLoader {
  private static cache: Record<string, string> = {};

  /**
   * Load secrets from centralized location
   * AI agents can call this to get fresh secrets
   */
  static load(environment: 'production' | 'development' = 'development'): Record<string, string> {
    const files = [
      '.env.shared',
      `.env.${environment}`,
      'config/ai-services.env',
      'config/databases.env',
      'config/google-workspace.env',
      'config/apis.env',
      'config/monitoring.env'
    ];

    const secrets: Record<string, string> = {};

    for (const file of files) {
      const filePath = join(SECRETS_ROOT, file);
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf-8');
        const parsed = this.parseEnvFile(content);
        Object.assign(secrets, parsed);
      }
    }

    return secrets;
  }

  /**
   * Get specific secret by key
   */
  static get(key: string, environment?: 'production' | 'development'): string | undefined {
    if (!this.cache[key]) {
      const secrets = this.load(environment);
      this.cache = secrets;
    }
    return this.cache[key];
  }

  /**
   * Validate secrets against schema
   */
  static validate<T extends z.ZodTypeAny>(schema: T, secrets?: Record<string, string>): z.infer<T> {
    const data = secrets || this.load();
    return schema.parse(data);
  }

  private static parseEnvFile(content: string): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=').trim();
        // Remove quotes
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        result[key.trim()] = value;
      }
    }
    
    return result;
  }
}

/**
 * Example usage in AI agent:
 * 
 * import { SecretsLoader } from '@tekup/config';
 * 
 * // Load all secrets
 * const secrets = SecretsLoader.load('development');
 * 
 * // Get specific secret
 * const openaiKey = SecretsLoader.get('OPENAI_API_KEY');
 * 
 * // Validate with Zod
 * const config = SecretsLoader.validate(MyConfigSchema);
 */
```

## 🔄 Sync Workflows

### 1. Initial Setup
```powershell
# Create secrets directory
New-Item -ItemType Directory -Path "C:\Users\empir\tekup-secrets" -Force

# Set permissions (owner only)
icacls "C:\Users\empir\tekup-secrets" /inheritance:r /grant:r "$env:USERNAME:(OI)(CI)F"

# Copy current secrets
Copy-Item "C:\Users\empir\tekup-ai\.env" "C:\Users\empir\tekup-secrets\.env.development"

# Initialize git (private repo ONLY)
cd "C:\Users\empir\tekup-secrets"
git init
git remote add origin git@github.com:JonasAbde/tekup-secrets-private.git  # MUST BE PRIVATE!
```

### 2. AI Agent Auto-Sync
```typescript
// In AI agent startup:
import { SecretsLoader } from '@tekup/config';

async function initializeAgent() {
  // Load secrets
  const secrets = SecretsLoader.load(process.env.NODE_ENV === 'production' ? 'production' : 'development');
  
  // Inject into process.env
  Object.assign(process.env, secrets);
  
  // Validate critical secrets
  const requiredKeys = ['OPENAI_API_KEY', 'SUPABASE_URL', 'GITHUB_TOKEN'];
  const missing = requiredKeys.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required secrets: ${missing.join(', ')}`);
  }
  
  console.log('✅ Secrets loaded from tekup-secrets');
}
```

### 3. Manual Sync (For specific project)
```powershell
# Sync to tekup-ai development
.\tekup-secrets\scripts\sync-to-project.ps1 -Project "tekup-ai" -Environment "development"

# Sync to Tekup-Billy production
.\tekup-secrets\scripts\sync-to-project.ps1 -Project "Tekup-Billy" -Environment "production"

# Sync to all projects
.\tekup-secrets\scripts\sync-all.ps1 -Environment "development"
```

## 🛡️ Security Best Practices

### DO ✅
- ✅ Use separate `.env.production` and `.env.development`
- ✅ Set strict file permissions (owner only)
- ✅ Use private Git repo if versioning (recommended: NO git at all)
- ✅ Rotate secrets regularly (use `rotate-secrets.ps1`)
- ✅ Use `SecretsLoader` in code, not direct `process.env`
- ✅ Validate with Zod schemas before use

### DON'T ❌
- ❌ Never commit `.env` files to public repos
- ❌ Never share production secrets in chat/Slack
- ❌ Never hardcode secrets in source code
- ❌ Never use production secrets in development
- ❌ Never store secrets in browser localStorage
- ❌ Never log full secret values (mask them)

## 📊 Integration Status (Updated October 2025)

| Project | Status | Location | Lines | Last Sync |
|---------|--------|----------|-------|-----------|
| **tekup-ai** | ✅ Active | `/services/tekup-ai` | 229 | 2025-10-23 |
| **tekup-billy** | ✅ Active | `/apps/production/tekup-billy` | 229 | 2025-10-23 |
| **tekup-vault** | ✅ Active | `/apps/production/tekup-vault` | 229 | 2025-10-23 |
| **tekup-gmail-services** | ✅ Active | `/services/tekup-gmail-services` | 229 | 2025-10-23 |
| **RendetaljeOS** | ✅ Active | `/apps/rendetalje/monorepo` | 229 | 2025-10-23 |

**Summary:** All 5 projects successfully integrated with TekupDK/Tekup-Portfolio workspace structure.

## 🚀 Quick Start

**New to Tekup Secrets? Start here:**

```powershell
# 1. Navigate to secrets folder
cd C:\Users\empir\Tekup\tekup-secrets

# 2. Read the quick start guide (recommended)
notepad QUICK_START.md

# 3. Test sync (safe - doesn't change anything)
.\scripts\sync-all.ps1 -Environment "development" -DryRun

# 4. Actually sync all projects
.\scripts\sync-all.ps1 -Environment "development"
# - etc.

# 5. Sync to project
cd tekup-secrets
.\scripts\sync-to-project.ps1 -Project "tekup-ai" -Environment "development"

# 6. Verify
cd ..\tekup-ai
pnpm build  # Should work if secrets are correct
```

## 🔗 Related Documentation

- `docs/security/SECRET_ROTATION.md` - How to rotate API keys safely
- `docs/deployment/ENV_VARS.md` - Environment variable reference
- `packages/tekup-config/README.md` - TypeScript config loader usage

---

**Last Updated:** October 23, 2025  
**Maintained by:** Jonas (empir)  
**Security Level:** 🔴 CRITICAL - Handle with care
