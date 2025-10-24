# Git Branch Cleanup

Clean up merged and stale branches.

## Safe Cleanup Process

1. **List all branches**
   ```bash
   git branch -a
   gh pr list --state merged --limit 50
   ```

2. **Identify safe-to-delete branches**
   - Branches with merged PRs
   - Old claude/* branches (not current)
   - Branches fully merged to master

3. **Verify before delete**
   - Check branch has no unique commits
   - Verify associated PR is merged
   - Confirm not currently checked out

4. **Delete locally and remotely**
   ```bash
   git branch -d {branch-name}
   git push origin --delete {branch-name}
   ```

5. **Update GIT_STATUS_REPORT.json**

## Safety Rules

- NEVER delete master/main branch
- NEVER delete current branch
- NEVER force delete branches with unique commits
- Always check PR merge status first

## Knowledge Reference

Check GIT_STATUS_REPORT.json → branches.stale for suggested deletions.
