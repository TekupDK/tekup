# Commitlint Setup Guide

This workspace now enforces [Conventional Commits](https://www.conventionalcommits.org/) via commitlint and husky git hooks.

## What Was Added

### Configuration Files
- **`commitlint.config.cjs`** — Root commitlint configuration with TekupDK-specific scopes
- **`.husky/`** — Git hooks directory managed by Husky
  - `commit-msg` — Validates commit messages on `git commit`
  - `pre-commit` — Lints staged markdown files
  - `_/husky.sh` — Husky runtime script

### Documentation
- **`docs/CONVENTIONAL_COMMITS.md`** — Complete guide to conventional commits with TekupDK examples
- **`.husky/README.md`** — Git hooks documentation and troubleshooting

### GitHub Actions
- **`.github/workflows/commitlint.yml`** — CI workflow to validate commits on push and PR
  - Validates all commits in PR against base branch
  - Posts helpful comment on failure with examples and fix instructions

### Templates & Guides
- **`.github/PULL_REQUEST_TEMPLATE.md`** — Enhanced PR template with:
  - Commit format validation checkbox
  - Type/scope fields
  - Comprehensive checklist (code quality, build, docs, security)
  - Testing evidence and deployment notes sections

### Package Updates
- **`package.json`** — Added scripts and dev dependencies:
  - `commitlint` script for manual validation
  - `prepare` script to auto-install husky hooks
  - `@commitlint/cli` and `@commitlint/config-conventional`
  - `husky` for git hooks

### Workspace README
- **`README.md`** — Updated with:
  - Quick start guide with pnpm installation
  - Git workflow section
  - Conventional commit examples
  - Reference to detailed guide

## Installation

After pulling these changes, run:

```powershell
pnpm install
```

This will:
1. Install commitlint and husky dependencies
2. Set up git hooks in `.husky/`
3. Configure git to use husky hooks

## Usage

### Making Commits

Commits will be validated automatically:

```powershell
git add .
git commit -m "feat(vault): add semantic search"
# ✅ Hook validates format before commit is created
```

Invalid commits are rejected:

```powershell
git commit -m "Added search"
# ❌ Error: subject may not be empty, type may not be empty
```

### Manual Validation

Test a commit message before committing:

```powershell
echo "feat(vault): add semantic search" | npx commitlint
# ✅ Passes

echo "Added search" | npx commitlint
# ❌ Fails with detailed error
```

### Bypass Hooks (Emergency Only)

```powershell
git commit --no-verify -m "emergency fix"
```

⚠️ **Warning:** Bypassed commits will still be validated in CI and may block PR merge.

## CI Validation

### On Pull Requests
- All commits in PR are validated against `commitlint.config.cjs`
- Failures post a helpful comment with format guide and examples
- PR cannot merge until commits are fixed

### On Push to master/develop
- All new commits are validated
- Failures are visible in Actions tab

## Commit Format

### Structure
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Valid Types
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation only
- `style` — Formatting, semicolons, etc.
- `refactor` — Code restructuring
- `perf` — Performance improvement
- `test` — Add/update tests
- `chore` — Maintenance (deps, configs)
- `ci` — CI/CD changes
- `build` — Build system changes
- `revert` — Revert previous commit

### TekupDK Scopes
Common scopes for this workspace:
- `vault`, `billy`, `database` — Production services
- `rendetalje`, `renos`, `cloud-dashboard`, `chat` — Web apps
- `ai`, `gmail`, `mcp` — Backend services
- `ci`, `docker`, `docs`, `config`, `deps` — Infrastructure
- `shared`, `packages`, `scripts`, `chatmode` — Shared/meta

### Examples

**Good ✅**
```
feat(vault): add semantic search endpoint

Implement POST /api/search with OpenAI embeddings.
Returns top-N similar documents with configurable threshold.

Closes #42
```

**Bad ❌**
```
Added search feature
```

## Troubleshooting

### Hooks Not Running

1. Ensure hooks are installed:
   ```powershell
   pnpm install
   ```

2. Check git hooks path:
   ```powershell
   git config core.hooksPath
   # Should output: .husky
   ```

3. On Unix/WSL, ensure hooks are executable:
   ```bash
   chmod +x .husky/commit-msg .husky/pre-commit
   ```

### Disable Hooks Temporarily

```powershell
# PowerShell
$env:HUSKY = "0"
git commit -m "your message"
$env:HUSKY = "1"
```

### Fix Existing Commits

For feature branches with non-conformant commits:

```powershell
# Interactive rebase to reword commits
git rebase -i HEAD~3

# Change 'pick' to 'reword' for commits to fix
# Save and follow prompts to edit commit messages
```

For most recent commit only:
```powershell
git commit --amend
# Edit commit message, save and exit
```

## Integration with TekupDK Chatmode

The **TekupDK chatmode** (`.github/chatmodes/TekupDK.chatmode.md`) now includes:
- Autonomous execution rules
- Git workflow defaults (conventional commits, branch naming)
- Non-interference guards to avoid affecting other chatmodes

When TekupDK chatmode creates commits, they will automatically follow the conventional format.

## Resources

- [Conventional Commits Spec](https://www.conventionalcommits.org/)
- [Commitlint Documentation](https://commitlint.js.org/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [TekupDK Conventional Commits Guide](../docs/CONVENTIONAL_COMMITS.md)
- [TekupDK Chatmode](./chatmodes/TekupDK.chatmode.md)

## Next Steps

1. **Validate setup:**
   ```powershell
   pnpm install
   git commit --allow-empty -m "test(ci): validate commitlint setup"
   ```

2. **Review documentation:**
   - Read `docs/CONVENTIONAL_COMMITS.md`
   - Review `.github/PULL_REQUEST_TEMPLATE.md`

3. **Update existing branches:**
   - Rebase feature branches to fix commit messages
   - Use `git rebase -i` to reword non-conformant commits

4. **Monitor CI:**
   - Check Actions tab after first push
   - Verify commitlint workflow runs successfully

## Support

For issues or questions:
1. Check `.husky/README.md` for troubleshooting
2. Review `docs/CONVENTIONAL_COMMITS.md` for format examples
3. Test locally: `echo "your message" | npx commitlint`
4. Contact workspace maintainer: @JonasAbde
