# Run All Tests in Parallel

Run comprehensive test suite across entire Tekup monorepo using parallel execution.

## Strategy

Launch 4 parallel agents using Task tool with `subagent_type=Explore`:

1. **Backend Unit Tests**
   - Path: `apps/rendetalje/services/backend-nestjs`
   - Command: `npm test`
   - Check: Jest test results

2. **Frontend Unit Tests**
   - Path: `apps/rendetalje/services/frontend-nextjs`
   - Command: `npm test -- --passWithNoTests`
   - Check: Jest + React Testing Library results

3. **Shared Library Tests**
   - Path: `apps/rendetalje/services/shared`
   - Command: `npm test`
   - Check: All 32 tests should pass

4. **E2E Tests (Playwright)**
   - Path: `apps/rendetalje/services/frontend-nextjs`
   - Command: `npx playwright test`
   - Check: E2E test suite results

## Output Format

Aggregate results and report:
```
Test Results Summary:
├── Backend: X/Y passed
├── Frontend: X/Y passed  
├── Shared: X/Y passed
└── E2E: X/Y passed

Total: X/Y tests passed (Z% pass rate)
Coverage: X% (if available)

Failed Tests:
[List any failures with file:line references]
```

## Post-Execution

If any tests fail:
- Create TodoWrite with specific fix tasks for each failure
- Prioritize by severity (unit test failures > E2E failures)
- Provide file:line references for easy navigation

## Knowledge Search

Before running, search KNOWLEDGE_INDEX.json for "testing" category docs to apply known fixes.
