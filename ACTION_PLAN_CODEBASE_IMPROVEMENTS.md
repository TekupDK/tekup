# Action Plan: Codebase Analysis Follow-up

**Based on:** CODEBASE_COMPREHENSIVE_ANALYSIS_2025-11-06.md  
**Date:** 2025-11-06  
**Priority:** Immediate to Long-term

---

## 🚨 Critical Issues - Fix Immediately

### Issue #1: TypeScript Compilation Failures
**Package:** `services/tekup-ai/packages/ai-llm`  
**Severity:** HIGH  
**Impact:** Prevents builds and tests from running

**Action:**
```bash
cd services/tekup-ai/packages/ai-llm
pnpm add @google/generative-ai
pnpm add openai@latest
pnpm run build  # Verify fix
```

**Affected Files:**
- `src/providers/geminiProvider.ts`
- `src/providers/llmProvider.ts`
- `src/providers/ollamaProvider.ts`

**Estimated Time:** 10 minutes  
**Assigned To:** Backend Team

---

### Issue #2: Missing Workspace Package
**Package:** `packages/inbox-orchestrator`  
**Severity:** HIGH  
**Impact:** Build warnings, potential runtime errors

**Action (Choose one):**

**Option A - Remove references:**
```bash
# Search for references
grep -r "inbox-orchestrator" services/tekup-ai/

# Remove from package.json files
# Remove from tsconfig references
```

**Option B - Add package:**
```bash
# Restore package from git history or create new
mkdir -p services/tekup-ai/packages/inbox-orchestrator
# Add package.json and source
pnpm install
```

**Estimated Time:** 30 minutes  
**Assigned To:** DevOps Team

---

### Issue #3: pnpm Tool Conflicts
**Severity:** HIGH  
**Impact:** Build instability, ENOTEMPTY errors

**Action:**
```bash
# Clean pnpm cache
pnpm store prune

# Reinstall with clean slate
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install --frozen-lockfile

# Approve build scripts
pnpm approve-builds
```

**Estimated Time:** 15 minutes  
**Assigned To:** DevOps Team

---

## ⚠️ Medium Priority - Fix This Week

### Issue #4: Documentation Quality
**Severity:** MEDIUM  
**Impact:** 20,612 markdown linting errors affecting readability

**Action:**
```bash
# Auto-fix ~80% of errors
pnpm markdown:fix

# Review remaining errors
pnpm markdown:lint > /tmp/remaining-md-errors.txt

# Manual fixes for complex issues
# - Fix multiple H1 headings in chatmode files
# - Add language tags to code blocks
# - Fix inline HTML in system prompts
```

**Estimated Time:** 2 hours  
**Assigned To:** Documentation Team

---

### Issue #5: TypeScript Type Safety
**Package:** `tekup-mcp-servers/packages/google-mcp`  
**Severity:** MEDIUM  
**Impact:** 24 instances of `any` type reducing type safety

**Action:**
```typescript
// Example fix for config.ts
// Before:
const config: any = { ... }

// After:
interface GoogleMCPConfig {
  googleClientEmail?: string;
  googlePrivateKey?: string;
  impersonatedUser: string;
  calendarId: string;
  port: number;
}

const config: GoogleMCPConfig = { ... }
```

**Files to Update:**
- `src/config.ts` (2 instances)
- `src/http-server.ts` (14 instances)
- `src/index.ts` (4 instances)
- `src/tools/gmail.ts` (1 instance)
- `src/types.ts` (3 instances)

**Estimated Time:** 4 hours  
**Assigned To:** TypeScript Team

---

### Issue #6: Test Coverage Tracking
**Severity:** MEDIUM  
**Impact:** Unknown code coverage, hard to ensure quality

**Action:**
```bash
# Add to root package.json
{
  "scripts": {
    "test:coverage": "pnpm -r --if-present test:coverage",
    "coverage:report": "pnpm -r --if-present coverage:report"
  }
}

# Update individual package.json files
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage",
    "coverage:report": "jest --coverage --coverageReporters=lcov"
  },
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 70,
        "lines": 70,
        "statements": 70
      }
    }
  }
}
```

**Estimated Time:** 3 hours  
**Assigned To:** Testing Team

---

## 📅 Short-term Improvements - This Month

### Task #7: Centralize TypeScript Configuration
**Priority:** Medium  
**Benefit:** Consistent compiler options across packages

**Action:**
```bash
# Create base config
cat > tsconfig.base.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
EOF

# Update package tsconfig files to extend base
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Estimated Time:** 2 hours  
**Assigned To:** Architecture Team

---

### Task #8: Set Up CI/CD Pipeline
**Priority:** High  
**Benefit:** Automated quality checks, faster feedback

**Action:**
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 10.17.0
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm markdown:lint
  
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3
  
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
  
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm audit
```

**Estimated Time:** 4 hours  
**Assigned To:** DevOps Team

---

### Task #9: Improve ESLint Rules
**Priority:** Medium  
**Benefit:** Better code quality enforcement

**Action:**
```javascript
// Update .eslintrc.js
module.exports = {
  // ... existing config
  rules: {
    // Existing rules
    'no-console': ['error', { allow: ['warn', 'error'] }],
    '@typescript-eslint/no-explicit-any': 'error', // Changed from 'warn'
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    
    // New rules
    'import/order': ['error', {
      'groups': [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index'
      ],
      'newlines-between': 'always',
      'alphabetize': { order: 'asc' }
    }],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
  },
};
```

**Estimated Time:** 2 hours  
**Assigned To:** Code Quality Team

---

## 🎯 Long-term Goals - This Quarter

### Goal #10: Architecture Decision Records
**Timeline:** Month 1  
**Benefit:** Document important architectural decisions

**Action:**
```bash
mkdir -p docs/adr

# Create ADR template
cat > docs/adr/template.md << 'EOF'
# [Number]. [Title]

Date: YYYY-MM-DD
Status: [Proposed | Accepted | Deprecated | Superseded]
Deciders: [List of people involved]

## Context

[Describe the context and problem statement]

## Decision

[Describe the decision]

## Consequences

### Positive
- [Benefit 1]

### Negative
- [Drawback 1]

## Alternatives Considered

1. [Alternative 1]
   - Pros: ...
   - Cons: ...
EOF

# Create first ADR
# ADR-001: Monorepo with pnpm
# ADR-002: TypeScript-first development
# ADR-003: Docker containerization strategy
```

**Estimated Time:** 8 hours over 4 weeks  
**Assigned To:** Architecture Team

---

### Goal #11: API Documentation
**Timeline:** Month 2  
**Benefit:** Better developer experience, easier onboarding

**Action:**
```bash
# Install documentation tools
pnpm add -D @microsoft/api-extractor @microsoft/api-documenter

# Generate API docs
pnpm -r exec api-extractor run --local
pnpm -r exec api-documenter markdown -i ./temp -o ./docs/api

# Set up documentation site (Docusaurus, VitePress, etc.)
```

**Estimated Time:** 16 hours over 4 weeks  
**Assigned To:** Documentation Team

---

### Goal #12: Performance Monitoring
**Timeline:** Month 3  
**Benefit:** Proactive issue detection, better user experience

**Action:**
```bash
# Add Sentry for error tracking
pnpm add @sentry/node @sentry/nextjs

# Add application performance monitoring
# Configure in each service

# Set up dashboards
# - Error rates
# - Response times
# - Resource usage
# - User experience metrics
```

**Estimated Time:** 20 hours over 4 weeks  
**Assigned To:** DevOps + Backend Team

---

## 📊 Progress Tracking

### Weekly Checklist

**Week 1:**
- [ ] Fix TypeScript compilation errors (Issue #1)
- [ ] Resolve missing workspace package (Issue #2)
- [ ] Clean pnpm cache and fix conflicts (Issue #3)
- [ ] Run markdown:fix on documentation (Issue #4)

**Week 2:**
- [ ] Replace any types in google-mcp (Issue #5)
- [ ] Set up test coverage tracking (Issue #6)
- [ ] Create centralized TypeScript config (Task #7)

**Week 3:**
- [ ] Implement CI/CD pipeline (Task #8)
- [ ] Improve ESLint rules (Task #9)
- [ ] Start ADR documentation (Goal #10)

**Week 4:**
- [ ] Review and adjust targets
- [ ] Plan API documentation (Goal #11)
- [ ] Research performance monitoring tools (Goal #12)

---

## 🎯 Success Criteria

### After Week 1
- ✅ All packages build successfully
- ✅ pnpm operations run without errors
- ✅ Documentation error rate < 5 errors/file

### After Month 1
- ✅ ESLint errors = 0
- ✅ ESLint warnings < 10
- ✅ Test coverage tracking enabled
- ✅ CI/CD pipeline operational

### After Quarter 1
- ✅ Test coverage ≥ 70%
- ✅ Documentation error rate < 2 errors/file
- ✅ Build success rate = 100%
- ✅ Performance monitoring live
- ✅ 10+ ADRs documented

---

## 📞 Contact & Support

**Questions about this action plan?**
- Architecture Team: [architecture@tekup.dk]
- DevOps Team: [devops@tekup.dk]
- Code Quality: [quality@tekup.dk]

**Progress Updates:**
- Daily: #codebase-health Slack channel
- Weekly: Team sync meetings
- Monthly: Engineering all-hands

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-06  
**Next Review:** 2025-11-13
