# Auto-Fix TypeScript Errors

Systematically fix all TypeScript compilation errors autonomously.

## Process

1. **Scan for errors**
   ```bash
   cd apps/rendetalje/services/backend-nestjs
   npx tsc --noEmit > ts-errors.txt 2>&1
   ```

2. **Categorize errors**
   - Import errors (missing modules)
   - Type mismatches (incompatible types)
   - Missing properties (interface violations)
   - Generic type issues

3. **Fix autonomously using Python/bash scripts**
   - Priority 1: Missing imports → Add import statements
   - Priority 2: Wrong paths → Fix file paths
   - Priority 3: Type assertions → Add `as` casts or @ts-ignore
   - Priority 4: Interface fixes → Update type definitions

4. **Iterate**
   - Fix one category at a time
   - Commit after each category: `fix(types): resolve {category} errors`
   - Re-run TypeScript check
   - Repeat until 0 errors OR max 5 iterations

5. **Report**
   - Total errors fixed
   - Remaining errors (if any)
   - Commits made
   - Estimated time for remaining issues

## Knowledge Integration

1. Check REMAINING_TYPESCRIPT_ERRORS.json for known issues
2. Search troubleshooting docs for similar TypeScript errors
3. Apply patterns from previous fixes

## Autonomous Mode

Use bash/Python scripts (NOT Edit tool) for file modifications:
- sed for simple replacements
- Python for complex logic
- cat/heredoc for full file rewrites

## Output

Update TYPESCRIPT_FIX_STATUS.md and REMAINING_TYPESCRIPT_ERRORS.json after completion.
