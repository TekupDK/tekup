# Stale Git Branches Report

**Generated:** 2025-10-25

## Identified Stale Branches

### Safe to Delete (Probably)

**1. claude/analyze-repository-011CUR2uDMWUY1jAvHdRTMbX**
- **Status:** Remote only (not checked out)
- **Associated PR:** None found
- **Recommendation:** Verify no unique commits, then delete

**2. claude/explore-teku-011CUSDhz3nPLBoFU5dh3JPs**
- **Status:** Remote only (not checked out)
- **Associated PR:** None found
- **Recommendation:** Verify no unique commits, then delete

### Active Branches (DO NOT DELETE)

**claude/implement-momentary-feature-011CUSDGPgNNv8NS6psNVgfx**
- **Status:** Current branch, Open PR #1
- **Commits:** 13 ahead of master
- **Keep:** YES

**master**
- **Status:** Main branch
- **Keep:** YES (always)

## Cleanup Commands

**To delete stale branches (run manually after verification):**
```bash
# Delete remote stale branches
git push origin --delete claude/analyze-repository-011CUR2uDMWUY1jAvHdRTMbX
git push origin --delete claude/explore-teku-011CUSDhz3nPLBoFU5dh3JPs

# Prune remote references
git remote prune origin
```

**Automated cleanup:**
```bash
/git-cleanup
```

## Recommendation

Use `/git-cleanup` command to safely delete these branches after verification.
