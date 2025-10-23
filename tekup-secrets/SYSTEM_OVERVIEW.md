# Tekup Secrets Management System - Oversigt

## 📋 Hvad er dette system?

Dette er et centraliseret secrets management system for alle Tekup Portfolio projekter. I stedet for at hver projekt har sine egne `.env` filer spredt rundt, samler vi alle secrets ét sted med:

- ✅ **Centraliseret lagring** - Alle secrets i `C:\Users\empir\Tekup\tekup-secrets`
- ✅ **Component-baseret organisation** - Opdelt i ai-services, databases, google-workspace, apis, monitoring
- ✅ **Miljø-specifik konfiguration** - Development og production adskilt
- ✅ **Automatisk synkronisering** - PowerShell scripts til at synce til projekter
- ✅ **TypeScript API** - Programmatisk adgang via @tekup-ai/config pakke
- ✅ **Git-sikkerhed** - .gitignore beskytter mod accidentelle commits

## 📁 Mappestruktur

```
C:\Users\empir\tekup-secrets\
├── .env.shared              # Non-sensitive defaults (NODE_ENV, PORT, etc.)
├── .env.development         # Development secrets (real keys)
├── .env.production          # Production secrets (placeholders - udfyld med prod keys)
├── .gitignore               # Beskytter secrets fra git
├── README.md                # Fuld dokumentation (411 linjer)
├── SYSTEM_OVERVIEW.md       # Denne fil
├── config/
│   ├── ai-services.env      # LLM providers (OpenAI, Gemini, Anthropic, Ollama)
│   ├── databases.env        # PostgreSQL, Supabase, Redis, encryption keys
│   ├── google-workspace.env # Google service account, Gmail OAuth2, Calendar
│   ├── apis.env             # Billy.dk, GitHub, Firecrawl, Twilio, MCP keys
│   └── monitoring.env       # Sentry, feature flags, CORS, URLs
└── scripts/
    ├── sync-to-project.ps1  # Syncer secrets til ét projekt
    └── sync-all.ps1         # Syncer til alle projekter på én gang
```

## 🔑 Secrets oversigt

### LLM Providers (ai-services.env)
- **OpenAI**: sk-proj-WCwMYK5Nm1_1UhzOKsb6z... (gpt-4o-mini)
- **Gemini**: AIzaSyAYOUR_GEMINI_KEY_HERE (placeholder)
- **Anthropic**: Ikke konfigureret endnu
- **Ollama**: Lokal (http://localhost:11434)

### Databases (databases.env)
- **Primary DB**: postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=renos
- **Supabase**: https://oaevagdgrasfppbrxbey.supabase.co
  - Anon key: yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  - Service key: yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- **Encryption**: Billy.dk API key encryption (32-char key, 16-char salt)

### Google Workspace (google-workspace.env)
- **Service Account**: Placeholders (skal udfyldes med rigtige værdier)
- **Calendar ID**: c_39570a852bf141658572fa37bb229c7246564a6cca47560bc66a4f9e4fec67ff@group.calendar.google.com
- **Gmail OAuth2**: Konfigureret med redirect til http://localhost:3000/oauth/callback

### External APIs (apis.env)
- **Billy.dk**: REDACTED_BILLY_API_KEY (org: pmf9tU56RoyZdcX3k69z1g)
- **GitHub**: [REDACTED - Set locally in .env files]
- **Firecrawl**: Placeholder (skal udfyldes)
- **Twilio**: Placeholders (skal udfyldes)
- **MCP HTTP**: d674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b
- **Vault API**: 	ekup_vault_api_key_2025_secure

### Monitoring (monitoring.env)
- **Sentry**: Placeholder (skal udfyldes)
- **Feature Flags**: VOICE_ALERTS, AUTO_INVOICE, AUDIT_LOGGING enabled
- **CORS**: Tillader localhost + tekup.ai + renos.dk

## 🚀 Hvordan bruges systemet?

### 1. Synkroniser secrets til ét projekt

```powershell
cd C:\Users\empir\tekup-secrets
.\scripts\sync-to-project.ps1 -Project "tekup-ai" -Environment "development"
```

Dette merger:
1. .env.shared (non-sensitive defaults)
2. .env.development (environment-specific secrets)
3. Alle config/*.env filer (component-specific secrets)

Resultatet skrives til C:\Users\empir\tekup-ai\.env (188 linjer)

### 2. Synkroniser til alle projekter på én gang

```powershell
cd C:\Users\empir\tekup-secrets
.\scripts\sync-all.ps1 -Environment "development"
```

Syncer automatisk til:
- tekup-ai ✅
- Tekup-Billy ✅
- TekupVault ✅
- Tekup Google AI ✅
- RendetaljeOS (hvis .env.example findes)

### 3. Brug TypeScript API i kode

```typescript
import { SecretsLoader } from '@tekup-ai/config';

// Load all secrets for development
const secrets = SecretsLoader.load('development');
console.log(secrets.OPENAI_API_KEY);

// Or inject into process.env
SecretsLoader.injectIntoProcessEnv('development');
console.log(process.env.OPENAI_API_KEY);

// Validate with Zod schema
import { z } from 'zod';
const schema = z.object({
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  DATABASE_URL: z.string().url(),
});
const validated = SecretsLoader.validate(schema);

// Check required keys
SecretsLoader.checkRequired(['OPENAI_API_KEY', 'DATABASE_URL'], true);
```

### 4. Dry-run test (uden at skrive filer)

```powershell
.\scripts\sync-to-project.ps1 -Project "tekup-ai" -Environment "development" -DryRun
```

Viser preview af hvad der ville blive skrevet, uden faktisk at ændre noget.

## ✅ Status

### Completed
- ✅ Directory struktur oprettet
- ✅ .gitignore beskytter secrets
- ✅ .env.shared med non-sensitive defaults (24 linjer)
- ✅ .env.development med reelle development keys (40 linjer)
- ✅ .env.production template (placeholders - skal udfyldes)
- ✅ Component configs oprettet:
  - config/ai-services.env (19 linjer)
  - config/databases.env (24 linjer)
  - config/google-workspace.env (20 linjer)
  - config/apis.env (26 linjer)
  - config/monitoring.env (16 linjer)
- ✅ sync-to-project.ps1 script (158 linjer)
- ✅ sync-all.ps1 script (100 linjer)
- ✅ SecretsLoader TypeScript class (188 linjer)
- ✅ Integrated i @tekup-ai/config package
- ✅ **OPDATERET FOR TEKUPDK/TEKUP-PORTFOLIO** Synkroniseret til alle projekter:
  - tekup-ai (229 linjer) ✅ → C:\Users\empir\Tekup\services\tekup-ai
  - tekup-billy (229 linjer) ✅ → C:\Users\empir\Tekup\apps\production\tekup-billy
  - tekup-vault (229 linjer) ✅ → C:\Users\empir\Tekup\apps\production\tekup-vault
  - tekup-gmail-services (229 linjer) ✅ → C:\Users\empir\Tekup\services\tekup-gmail-services
  - RendetaljeOS (229 linjer) ✅ → C:\Users\empir\Tekup\apps\rendetalje\monorepo
- ✅ **Path mapping opdateret for nye workspace struktur**
- ✅ Verificeret: pnpm build succeeds i tekup-ai

### TODO
- ⏸️ Udfyld Google Workspace credentials med rigtige værdier
- ⏸️ Udfyld Firecrawl API key
- ⏸️ Udfyld Twilio credentials (hvis relevant)
- ⏸️ Udfyld Sentry DSN
- ⏸️ Udfyld Gemini API key
- ⏸️ Udfyld .env.production med production keys
- ⏸️ Test production sync: .\scripts\sync-to-project.ps1 -Project "tekup-ai" -Environment "production"

## 🔒 Sikkerhed

### Git Protection
.gitignore beskytter:
- *.env og *.env.* filer
- config/*.env filer
- secrets/ mappe
- *.key, *.pem, *.p12 filer
- credentials*.json filer

### Best Practices
- ✅ **Development keys** er i .env.development
- ✅ **Production keys** skal være i .env.production (IKKE committet)
- ✅ **Placeholders** tydelig markeret med YOUR_ prefix eller REPLACE_WITH
- ✅ **Encryption keys** for Billy.dk API key storage er genereret og gemt
- ✅ **MCP API keys** er unikke per projekt (HTTP server authentication)

### File Permissions
Forsøgt at sætte owner-only permissions med icacls, men kommando havde syntaksfejl. Kan rettes med:

```powershell
icacls "C:\Users\empir\tekup-secrets" /inheritance:r /grant:r "empir:(OI)(CI)F"
```

## 📊 Statistik

- **Total secrets filer**: 8 (.env.shared, .env.development, .env.production, 5x config/*.env)
- **Total PowerShell scripts**: 2 (sync-to-project.ps1, sync-all.ps1)
- **TypeScript API**: 1 class (SecretsLoader med 8 public methods)
- **Projekter synkroniseret**: 5 af 5 (tekup-ai, tekup-billy, tekup-vault, tekup-gmail-services, RendetaljeOS)
- **Gennemsnitlig .env størrelse**: 229 linjer (efter merge)
- **Total linjer kode skrevet**: ~600 linjer (scripts + TypeScript + configs)
- **Workspace struktur**: ✅ Opdateret for TekupDK/Tekup-Portfolio

## 🎯 Næste skridt

1. **Udfyld manglende keys** i .env.development:
   - Gemini API key
   - Google Workspace credentials (private key)
   - Firecrawl API key
   - Twilio credentials
   - Sentry DSN

2. **Opret production secrets** i .env.production:
   - Production database credentials (med SSL)
   - Production Supabase project
   - Production API keys (FORSKELLIG fra dev!)
   - Production encryption keys (FORSKELLIG fra dev!)

3. **Test production sync**:
   ```powershell
   .\scripts\sync-to-project.ps1 -Project "tekup-ai" -Environment "production" -DryRun
   ```

4. **Synkroniser RendetaljeOS** (når .env.example findes):
   ```powershell
   .\scripts\sync-to-project.ps1 -Project "RendetaljeOS" -Environment "development"
   ```

## 📚 Dokumentation

- **Fuld guide**: C:\Users\empir\tekup-secrets\README.md (411 linjer)
- **Copilot instructions**: .github\copilot-instructions.md i hvert projekt
- **Original spec**: 	ekup-ai\TEKUP_SECRETS_MANAGEMENT.md

---

**Sidste opdatering**: 2025-10-23  
**Version**: 1.0.0  
**Status**: ✅ Production ready (development environment)
