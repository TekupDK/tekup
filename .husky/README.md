# Git Hooks (Husky)

This directory contains Git hooks managed by [Husky](https://typicode.github.io/husky/) to enforce code quality and commit standards.

## Hooks

### `commit-msg`
Validates commit messages against [Conventional Commits](https://www.conventionalcommits.org/) format using commitlint.

**Runs on:** `git commit`

**Purpose:** Ensure all commits follow the required format before they are created.

**Format:**
```
<type>(<scope>): <subject>
```

**Example:**
```
feat(vault): add semantic search endpoint
```

**To bypass** (not recommended):
```powershell
git commit --no-verify -m "your message"
```

### `pre-commit`
Runs markdown linting on staged markdown files.

**Runs on:** `git commit` (before commit-msg)

**Purpose:** Catch markdown formatting issues early.

## Setup

Hooks are automatically installed when you run:
```powershell
pnpm install
```

This triggers the `prepare` script in `package.json`.

## Troubleshooting

### Hooks not running
1. Check if hooks are executable:
   ```powershell
   # On Unix/macOS/WSL
   chmod +x .husky/commit-msg .husky/pre-commit
   ```

2. Ensure husky is installed:
   ```powershell
   pnpm install
   ```

3. Verify git hooks path:
   ```powershell
   git config core.hooksPath
   # Should output: .husky
   ```

### Bypass hooks temporarily
Use `--no-verify` flag (not recommended for production):
```powershell
git commit --no-verify -m "your message"
```

### Disable hooks entirely
Set environment variable:
```powershell
# PowerShell
$env:HUSKY = "0"

# Unix/macOS
export HUSKY=0
```

## Configuration

- **Commitlint config:** `commitlint.config.cjs`
- **Conventional commits guide:** `docs/CONVENTIONAL_COMMITS.md`
- **Husky documentation:** https://typicode.github.io/husky/

## CI/CD

Git hooks run locally only. CI validation runs via GitHub Actions:
- `.github/workflows/commitlint.yml` - Validates all commits in PRs and pushes
