# 🔐 Tekup Secrets - Centralized Secret Management System

**Status:** 💡 Idea/Future Task  
**Priority:** Medium  
**Created:** October 23, 2025  
**Estimated Effort:** 2-3 days

## 🎯 Problem Statement

Currently, environment variables and API keys are scattered across multiple `.env` files in different repositories:
- `tekup-ai/.env`
- `Tekup-Billy/.env`
- `TekupVault/.env`
- `Tekup Google AI/.env`

This makes it difficult for:
- AI agents to programmatically access secrets
- Maintaining consistency across projects
- Rotating keys securely
- Managing production vs development environments

## 💡 Proposed Solution

Create centralized `tekup-secrets` repository with:

### Structure
```
C:\Users\empir\tekup-secrets\
├── .env.production              # Production secrets (NEVER commit)
├── .env.development             # Development secrets (local only)
├── .env.shared                  # Shared non-sensitive config
├── config/
│   ├── ai-services.env          # OpenAI, Gemini, Ollama
│   ├── databases.env            # Supabase, PostgreSQL
│   ├── google-workspace.env     # Gmail, Calendar, Drive
│   ├── apis.env                 # Billy.dk, TekupVault
│   └── monitoring.env           # Sentry, logging
└── scripts/
    ├── sync-to-project.ps1      # Copy to specific project
    ├── sync-all.ps1             # Sync to all projects
    └── validate.ps1             # Validate with Zod
```

### Key Features
1. **AI-Readable Config Loader** (TypeScript)
   ```typescript
   import { SecretsLoader } from '@tekup/config';
   const secrets = SecretsLoader.load('development');
   const openaiKey = SecretsLoader.get('OPENAI_API_KEY');
   ```

2. **Auto-Sync Scripts** (PowerShell)
   ```powershell
   .\sync-to-project.ps1 -Project "tekup-ai" -Environment "development"
   ```

3. **Zod Validation**
   - Runtime validation of all secrets
   - Fail fast on missing/invalid keys
   - Type-safe config export

4. **Security**
   - Windows file permissions (owner only)
   - Separate production/development
   - Never commit to public repos

## 📋 Implementation Steps

### Phase 1: Setup (Day 1)
- [ ] Create `C:\Users\empir\tekup-secrets` directory
- [ ] Set Windows file permissions (icacls)
- [ ] Copy existing `.env` as starting point
- [ ] Create `.gitignore` (ignore all .env files)
- [ ] Split secrets into component files

### Phase 2: TypeScript Package (Day 2)
- [ ] Create `packages/tekup-config` in tekup-ai monorepo
- [ ] Implement `SecretsLoader` class
- [ ] Add Zod schema validation
- [ ] Write tests for loader
- [ ] Update turbo.json dependencies

### Phase 3: Sync Scripts (Day 2-3)
- [ ] Write `sync-to-project.ps1`
- [ ] Write `sync-all.ps1`
- [ ] Write `validate.ps1`
- [ ] Test sync to all active projects
- [ ] Document sync workflow

### Phase 4: Migration (Day 3)
- [ ] Migrate tekup-ai to use SecretsLoader
- [ ] Migrate Tekup-Billy
- [ ] Migrate TekupVault
- [ ] Migrate Tekup Google AI
- [ ] Update all README files

## 📚 Reference Documentation

Full design document created:
- `C:\Users\empir\tekup-ai\TEKUP_SECRETS_MANAGEMENT.md`

Includes:
- Complete file structure
- Security architecture
- TypeScript SecretsLoader implementation
- PowerShell sync scripts
- AI agent integration examples
- Security best practices

## 🔗 Related Projects

| Project | Current .env | Secrets Needed |
|---------|-------------|----------------|
| tekup-ai | 146 lines | All (OpenAI, Gemini, Ollama, Supabase, Google, GitHub) |
| Tekup-Billy | ~30 lines | Billy API, Supabase |
| TekupVault | ~20 lines | GitHub, OpenAI, Supabase |
| Tekup Google AI | ~50 lines | Google Workspace, LLMs |

## ⚠️ Security Considerations

- **NEVER** commit `.env.production` to any repo (public or private)
- Use Windows file permissions to restrict access
- Rotate production keys if exposed
- Use separate keys for development/production
- Mask secrets in logs and error messages

## 🎯 Success Criteria

- ✅ Single source of truth for all secrets
- ✅ AI agents can load secrets programmatically
- ✅ Easy sync to any project (one command)
- ✅ Type-safe with Zod validation
- ✅ Secure file permissions
- ✅ All projects migrated and working

## 📝 Notes

- Pattern inspired by TekupVault's `packages/vault-core/src/config.ts`
- Consider using HashiCorp Vault for future production deployment
- Could later create MCP server for secrets (AI agent access)

---

**When ready to implement:**
1. Read full design: `tekup-ai\TEKUP_SECRETS_MANAGEMENT.md`
2. Run setup script (to be created)
3. Follow implementation checklist above
