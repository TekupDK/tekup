# Create Smart Pull Request

Automatically create a comprehensive, professional pull request.

## Process

1. **Analyze branch changes**
   ```bash
   git log master..HEAD --oneline
   git diff master...HEAD --stat
   ```

2. **Run pre-PR checks**
   - Execute `/deploy-check` first
   - Block if NO-GO decision
   - Run `/test-all` if not already done

3. **Generate PR description**
   - Analyze ALL commits (not just latest!)
   - Categorize changes (features, fixes, docs, tests, refactoring)
   - List files changed by category
   - Include test coverage impact
   - Note any breaking changes
   - Add migration notes if applicable

4. **Create PR**
   ```bash
   gh pr create --title "{title}" --body "$(cat PR_DESCRIPTION.md)"
   ```

## PR Description Template

```markdown
## Summary
- {Bullet points of major changes across ALL commits}

## Changes by Category

### Features
- {List features added}

### Bug Fixes  
- {List fixes}

### Refactoring
- {List refactorings}

### Documentation
- {List doc updates}

### Tests
- {List test additions/changes}

## Test Impact
- Tests added: X
- Tests modified: Y
- Coverage: Z%

## Breaking Changes
{List any breaking changes or NONE}

## Migration Notes
{Any setup/migration steps needed or NONE}

## Checklist
- [x] Tests passing
- [x] TypeScript compiles
- [x] Documentation updated
- [x] No merge conflicts

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## Knowledge Integration

- Check KNOWLEDGE_INDEX.json → plans category for PR best practices
- Search docs for similar PRs to match style
- Use conventional commit format from git history
