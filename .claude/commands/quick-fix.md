# Quick Fix Iteration Mode

Rapid iterative fixing - one error at a time with immediate commits.

## Workflow

1. Run linter/compiler: `npx tsc --noEmit`
2. Fix FIRST error found (focus, don't try to fix multiple)
3. Commit immediately: `git commit -m "fix: {specific issue}"`
4. Re-run check
5. Repeat until 0 errors OR user stops

## Advantages

- Clean git history (1 commit = 1 fix)
- Easy rollback if fix breaks something
- Fast iteration
- Clear progress tracking

## Knowledge Integration

For each error type, search KNOWLEDGE_INDEX.json → troubleshooting category for similar issues and solutions.

Use Python/bash scripts for autonomous fixing (same as /fix-types but one-at-a-time).
