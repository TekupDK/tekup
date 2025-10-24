# Pre-Deployment Verification

Comprehensive pre-deployment check for production readiness.

## Checklist

1. **TypeScript Compilation**
   - Backend: `cd apps/rendetalje/services/backend-nestjs && npx tsc --noEmit`
   - Frontend: `cd apps/rendetalje/services/frontend-nextjs && npx tsc --noEmit`
   - Target: 0 errors (warnings acceptable with explanation)

2. **Test Suite**
   - Run `/test-all` command
   - Require: 95%+ pass rate
   - Block if critical tests fail

3. **Git Status**
   - Check for uncommitted changes: `git status`
   - Verify branch is up to date with origin
   - Check no merge conflicts exist

4. **Environment Configuration**
   - Verify .env files exist (use .env.example as template)
   - Check for exposed secrets (scan for API keys in code)
   - Validate all required env vars are documented

5. **Docker Build Verification**
   - Test: `docker-compose config` (validates syntax)
   - Optional: Build images to verify Dockerfiles

6. **Code Quality**
   - Scan for console.log() in production code
   - Check for TODO/FIXME in critical paths
   - Run ESLint if configured

7. **Dependencies**
   - Check for outdated critical packages
   - Verify no security vulnerabilities: `npm audit`

## Output

Generate markdown report:

```markdown
# Deployment Readiness Report

**Date:** {timestamp}
**Branch:** {branch}

## Summary
**Decision:** ✅ GO / ❌ NO-GO

## Details
✅/❌ TypeScript: X errors
✅/❌ Tests: X% pass rate
✅/❌ Git: Clean / Has uncommitted changes
✅/❌ Environment: All configs present
✅/❌ Docker: Builds successfully
✅/❌ Code Quality: No issues
✅/❌ Dependencies: No vulnerabilities

## Blockers (if NO-GO)
[List critical issues that must be fixed]

## Recommendations
[List nice-to-have improvements]
```

## Knowledge Search

Check troubleshooting docs and deployment docs in KNOWLEDGE_INDEX.json for known deployment issues.
