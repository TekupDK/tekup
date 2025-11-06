# Security – Plan

Context: httpOnly cookies enabled; secure in production; rate limits present.

## Goals

- Protect sessions and APIs; keep secrets safe.

## Acceptance criteria

- [ ] Cookies: `httpOnly`, `secure` in prod, proper SameSite.
- [ ] Rate limits on sensitive endpoints.
- [ ] Environment secrets stored outside repo; leaked credentials rotated.

## Steps (suggested)

- [ ] Review oauth/session config periodically.
- [ ] Audit dependencies for CVEs occasionally.
- [ ] Remove committed secrets (`.env.prod`), rotate Supabase keys, update deployment secrets store.

## New Tasks

### Auto-Approve Preferences Migration (localStorage → Server)

**Context**: Currently, action auto-approve preferences are stored in browser localStorage (`auto-approve-${actionType}`). This creates security and UX issues:

- No RBAC enforcement (any user can enable auto-approve)
- Settings lost on browser clear or device switch
- No audit trail of who enabled auto-approve

**Goals**:

- [ ] Create `user_preferences` table with JSONB column for settings
- [ ] Add tRPC routes: `preferences.get`, `preferences.update`
- [ ] Migrate `ChatPanel.tsx` to use server preferences
- [ ] Add RBAC checks (only admins can auto-approve high-risk actions)
- [ ] Audit log when auto-approve is enabled/disabled
- [ ] Optional: admin override to disable auto-approve globally

**Acceptance Criteria**:

- [ ] Preferences persist across devices and sessions
- [ ] Non-admin users cannot auto-approve high-risk actions
- [ ] Audit log captures preference changes with user ID and timestamp
- [ ] Backward compatible (localStorage as fallback during migration)

### Google Service Account Security Audit

**Context**: `server/google-api.ts` uses service account impersonation for Gmail/Calendar access. Need to verify least-privilege configuration.

**Goals**:

- [ ] Review scopes: ensure only required scopes are used
- [ ] Document DWD (Domain-Wide Delegation) setup and impersonation
- [ ] Verify service account credentials are not logged or exposed
- [ ] Check that impersonation email is from trusted domain only
- [ ] Add rotation schedule for service account keys
- [ ] Test OAuth flow with minimal scopes in dev

**Acceptance Criteria**:

- [ ] Service account has minimum required scopes (Gmail read/write, Calendar read/write)
- [ ] No credentials appear in logs or error messages
- [ ] Documentation includes setup instructions and security best practices
- [ ] Impersonation limited to verified domain users only
- [ ] Key rotation process documented (quarterly recommended)
