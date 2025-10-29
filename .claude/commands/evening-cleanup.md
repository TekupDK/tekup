# Evening Development Cleanup

End-of-day workflow to clean up and prepare for tomorrow.

## Execution

### Phase 1: Work Status

1. Check uncommitted changes: `git status`
2. If changes exist:
   - Review changes: `git diff`
   - Run linter: `npx prettier --write . && npx eslint --fix .`
   - Run quick tests on changed files
   - Commit with descriptive message
   - Push to remote

### Phase 2: Docker Cleanup

3. Stop containers: `docker-compose down`
4. Prune unused images (optional): `docker system prune -f`

### Phase 3: Daily Summary

5. Generate report:
   - Files changed today: `git diff --name-status @{yesterday}..HEAD`
   - Commits made: `git log --since=yesterday --oneline`
   - Tests written/modified
   - Features completed (check TODOs)
   - New TODOs created

### Phase 4: Knowledge Sync

6. Search today's work for learnings
7. Update WORKSPACE_KNOWLEDGE_BASE.json with new patterns
8. Sync to TekupVault if significant learnings

## Output

```markdown
# Daily Summary - {date}

## Work Completed
- Commits: X
- Files changed: Y
- Tests added/modified: Z

## Features/Fixes
{List from commit messages}

## Learnings
{Key takeaways to remember}

## Tomorrow's Focus
{Based on open TODOs and PRs}

See you tomorrow! 👋
```
