# Agentrooms AI Agent Team Configuration

This document defines the AI agent team structure and their assigned work areas within the Tekup monorepo.

## Agent Team Structure

### 1. Frontend Specialist Agent
**Agent ID:** `frontend-specialist`  
**Provider:** `claude-code`  
**Responsibility:** Frontend development, UI/UX implementation, React/Next.js applications

**Assigned Work Areas:**
- `apps/flow-web/` - Main flow application frontend
- `apps/tekup-crm-web/` - CRM web interface
- `apps/tekup-lead-platform-web/` - Lead platform frontend
- `apps/voice-agent/` - Voice agent interface
- `apps/site/` - Marketing site
- `packages/ui/` - Shared UI components

**File Allowlist:**
```
app/**/*.{tsx,ts,jsx,js,css,scss,json}
components/**/*.{tsx,ts,jsx,js,css,scss}
lib/**/*.{ts,js}
pages/**/*.{tsx,ts,jsx,js}
src/**/*.{tsx,ts,jsx,js,css,scss}
*.{json,md,yml,yaml}
tailwind.config.*
next.config.*
vite.config.*
package.json
tsconfig.json
```

### 2. Backend API Specialist Agent
**Agent ID:** `backend-specialist`  
**Provider:** `claude-code`  
**Responsibility:** Backend API development, database schemas, server-side logic

**Assigned Work Areas:**
- `apps/flow-api/` - Main flow API
- `apps/tekup-crm-api/` - CRM API
- `apps/tekup-lead-platform/` - Lead platform API
- `apps/secure-platform/` - Security platform
- `packages/api-client/` - API client library
- `packages/auth/` - Authentication package

**File Allowlist:**
```
src/**/*.{ts,js}
prisma/**/*.{prisma,sql}
test/**/*.{ts,js}
__tests__/**/*.{ts,js}
*.{json,md,yml,yaml}
nest-cli.json
package.json
tsconfig.json
jest.config.*
.env.example*
```

### 3. DevOps & Infrastructure Agent
**Agent ID:** `devops-specialist`  
**Provider:** `claude-code`  
**Responsibility:** CI/CD, Docker, deployment, build systems, monorepo tooling

**Assigned Work Areas:**
- Root level configuration files
- `scripts/` - Build and deployment scripts
- Docker files across all apps
- CI/CD configurations
- Nx workspace configuration

**File Allowlist:**
```
.github/**/*
scripts/**/*.{sh,js,ts,py}
Dockerfile*
docker-compose.*
nx.json
package.json
pnpm-workspace.yaml
.npmrc
renovate.json
*.{md,yml,yaml,json}
```

### 4. Mobile Development Agent
**Agent ID:** `mobile-specialist`  
**Provider:** `claude-code`  
**Responsibility:** Mobile app development, React Native, cross-platform solutions

**Assigned Work Areas:**
- `apps/tekup-mobile/` - Mobile application
- `apps/inbox-ai/` - AI inbox mobile features

**File Allowlist:**
```
src/**/*.{tsx,ts,jsx,js}
android/**/*.{java,kt,xml,gradle}
ios/**/*.{swift,m,h,plist}
*.{json,md,yml,yaml}
package.json
tsconfig.json
metro.config.js
babel.config.js
```

### 5. Documentation & Content Agent
**Agent ID:** `docs-specialist`  
**Provider:** `claude-code`  
**Responsibility:** Documentation, README files, API docs, user guides

**Assigned Work Areas:**
- `docs/` - Documentation directory
- All README.md files
- API documentation
- User guides and tutorials

**File Allowlist:**
```
docs/**/*.{md,mdx}
**/README.md
**/CHANGELOG.md
**/CONTRIBUTING.md
**/*.md
typedoc.json
```

### 6. Orchestrator Agent
**Agent ID:** `orchestrator`  
**Provider:** `claude-code`  
**Responsibility:** Cross-cutting concerns, architecture decisions, coordination between agents

**Assigned Work Areas:**
- Full monorepo access for coordination
- Architecture decisions
- Cross-app integrations
- Shared packages coordination

**File Allowlist:**
```
**/*.{ts,tsx,js,jsx,json,md,yml,yaml}
package.json
tsconfig.json
nx.json
```

## Security & Access Control

### File Access Restrictions
- **Secrets:** No agent can access `.env` files (only `.env.example`)
- **Git:** No direct access to `.git/` directory
- **Node modules:** No access to `node_modules/` or `dist/` directories
- **Sensitive configs:** Limited access to deployment configurations

### Branch Protection
- Agents work in feature branches: `agent/{agent-id}/{feature-name}`
- All changes require PR review
- No direct commits to `main` or `develop` branches

### Code Review Requirements
- All agent PRs require human review
- Automated checks: lint, test, build
- CODEOWNERS file enforces domain expert reviews

## Integration with Existing Workflow

### Development Commands
```bash
# Start agentrooms with all agents
npm run agentrooms:dev

# Build all agent-accessible apps
npm run agentrooms:build

# Run tests for agent changes
npm run agentrooms:test

# Lint agent code
npm run agentrooms:lint
```

### Nx Integration
- Agents use `nx affected` to understand impact
- Respect existing project dependencies
- Follow established build and test patterns

## Monitoring & Metrics

### Agent Performance Tracking
- PR merge rate and time to merge
- Code quality metrics (test coverage, lint issues)
- Build success rate
- Human review feedback scores

### Quality Gates
- All tests must pass
- No lint errors
- Build succeeds for affected projects
- Security scan passes
- Performance regression checks

This configuration ensures agents can work effectively within their domains while maintaining security and code quality standards.