# Branch Protection Configuration

This document outlines the recommended branch protection rules for the Tekup monorepo to ensure code quality and security when working with AI agents.

## Main Branch Protection

### Required Settings for `main` branch:

#### General Protection Rules
- ✅ **Restrict pushes that create files larger than 100MB**
- ✅ **Require a pull request before merging**
  - Require approvals: **2**
  - Dismiss stale PR approvals when new commits are pushed
  - Require review from code owners (CODEOWNERS file)
  - Restrict pushes that create files larger than 100MB

#### Status Checks
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**

**Required status checks:**
- `ci/lint-and-format` - ESLint and Prettier checks
- `ci/test` - Unit and integration tests
- `ci/build` - Build verification for all apps
- `ci/typecheck` - TypeScript type checking
- `ci/security-audit` - Security and dependency audit
- `ci/agent-config-validation` - AI agent configuration validation

#### Additional Restrictions
- ✅ **Restrict pushes to matching branches**
  - Only allow administrators and the `@tekup-org/leads` team to push directly
- ✅ **Allow force pushes**: ❌ (Disabled)
- ✅ **Allow deletions**: ❌ (Disabled)

## Development Branch Protection

### Settings for `develop` branch (if used):

- ✅ **Require a pull request before merging**
  - Require approvals: **1**
  - Require review from code owners for sensitive areas
- ✅ **Require status checks to pass before merging**
  - Same status checks as main branch
- ✅ **Allow force pushes**: ❌ (Disabled)

## Feature Branch Naming Convention

### Required branch naming patterns:
- `feature/TICKET-123-description` - New features
- `bugfix/TICKET-123-description` - Bug fixes
- `hotfix/TICKET-123-description` - Critical fixes
- `agent/TICKET-123-description` - AI agent configuration changes
- `docs/TICKET-123-description` - Documentation updates
- `refactor/TICKET-123-description` - Code refactoring

## AI Agent Specific Protections

### Agent Configuration Changes
Any changes to the following paths require additional review:
- `apps/agentrooms-backend/config/agents.json`
- `apps/agentrooms-frontend/src/config/agents.ts`
- `CODEOWNERS`
- `.github/workflows/ci.yml`
- `.husky/pre-commit`

### Agent Workspace Boundaries
Changes to agent workspace directories require review from the respective domain teams:
- `apps/flow-*` → `@tekup-org/flow-team`
- `apps/agentrooms-*` → `@tekup-org/ai-team`
- `packages/*` → `@tekup-org/platform-team`
- `docs/*` → `@tekup-org/docs-team`

## Security Considerations

### Sensitive File Protection
The following files require review from `@tekup-org/security-team`:
- `.env*` files
- `package.json` (dependency changes)
- `nx.json` (build configuration)
- `tsconfig*.json` (TypeScript configuration)
- Any files containing authentication or API configurations

### Secret Scanning
- Enable GitHub secret scanning
- Enable push protection for secrets
- Configure custom secret patterns for:
  - API keys
  - Database connection strings
  - Third-party service tokens
  - Private keys

## Implementation Steps

### 1. GitHub Repository Settings
```bash
# Navigate to: Settings > Branches > Add rule
# Branch name pattern: main
# Apply the protection rules listed above
```

### 2. Required GitHub Apps/Integrations
- **CodeQL** - For security analysis
- **Dependabot** - For dependency updates
- **GitHub Actions** - For CI/CD pipeline

### 3. Team Permissions
Ensure the following GitHub teams exist with appropriate permissions:
- `@tekup-org/leads` - Admin access
- `@tekup-org/ai-team` - Write access to agentrooms
- `@tekup-org/frontend-team` - Write access to frontend apps
- `@tekup-org/backend-team` - Write access to backend apps
- `@tekup-org/mobile-team` - Write access to mobile apps
- `@tekup-org/devops-team` - Write access to infrastructure
- `@tekup-org/security-team` - Write access to security configs
- `@tekup-org/docs-team` - Write access to documentation

## Monitoring and Alerts

### GitHub Notifications
Configure notifications for:
- Failed status checks on protected branches
- Direct pushes to protected branches (should be blocked)
- Changes to branch protection rules
- Security alerts and vulnerabilities

### Slack Integration (Optional)
Set up Slack notifications for:
- PR reviews required
- CI/CD pipeline failures
- Security alerts
- Agent configuration changes

## Emergency Procedures

### Hotfix Process
1. Create hotfix branch from `main`
2. Implement minimal fix
3. Fast-track review process (1 approval minimum)
4. Deploy immediately after merge
5. Create follow-up PR for comprehensive fix

### Branch Protection Bypass
Only repository administrators can bypass branch protection:
- Document reason for bypass
- Create immediate follow-up issue
- Notify security team
- Review bypass in next team meeting

## Compliance and Auditing

### Audit Trail
- All branch protection changes are logged
- PR reviews and approvals are tracked
- Failed status checks are recorded
- Direct push attempts are logged

### Regular Reviews
- Monthly review of branch protection effectiveness
- Quarterly review of team permissions
- Annual review of security policies
- Post-incident review of any protection bypasses