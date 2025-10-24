# Check CI/CD Pipeline Status

Query GitHub Actions for current build/test status.

## Execution

```bash
# Get workflow runs for current branch
gh run list --branch {current-branch} --limit 5 --json status,conclusion,name,createdAt

# If latest run failed, get logs
gh run view {run-id} --log-failed
```

## Analysis

1. Parse CI/CD results
2. Identify failing jobs
3. Extract error messages from logs
4. Categorize failures (build, test, deploy)
5. Search KNOWLEDGE_INDEX.json for similar CI failures
6. Recommend fixes based on error patterns

## Output

```markdown
# CI/CD Status

**Branch:** {branch}
**Latest Run:** {status}

## Job Results
✅/❌ Lint: {result}
✅/❌ Unit Tests: {result}
✅/❌ E2E Tests: {result}
✅/❌ Build: {result}
✅/❌ Deploy: {result}

## Failures
{If any failures, show errors and recommended fixes}
```
