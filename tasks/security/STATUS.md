# Security – Status

Dato: 4. november 2025  
Owner: Platform/SRE  
Status: [!] Blocked – production Supabase credentials are checked into git.

## Immediate Actions

- [ ] Rotate Supabase `postgres` password + regenerate connection string.
- [ ] Remove `.env.prod` from repo (replace with template + secret manager entry).
- [ ] Audit other secrets (OpenAI, Gemini, Billy) for possible exposure and rotate if needed.

## Follow-up

- [ ] Update deployment pipeline to source secrets from Azure Key Vault / GitHub Actions secrets (TBD).
- [ ] Add pre-commit/CI check preventing `.env.*` with secrets from being committed.

## New Tasks (2025-11-05)

### Auto-Approve Preferences Migration

Status: ⏳ Not Started

- [ ] Create `user_preferences` table schema
- [ ] Implement tRPC routes for preferences
- [ ] Migrate ChatPanel.tsx to use server preferences
- [ ] Add RBAC checks for high-risk actions
- [ ] Add audit logging for preference changes

### Google Service Account Audit

Status: ⏳ Not Started

- [ ] Review and document current scopes
- [ ] Verify credentials not exposed in logs
- [ ] Document DWD setup and impersonation flow
- [ ] Create key rotation schedule
- [ ] Test with minimal scopes in dev
