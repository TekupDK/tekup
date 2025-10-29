# Conventional Commits Guide

TekupDK workspace enforces [Conventional Commits](https://www.conventionalcommits.org/) to maintain clear, semantic commit history across all projects.

## Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

## Rules

### Type (required)
Must be one of:
- `feat`: New feature for the user
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Code style (formatting, semicolons, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding missing tests or correcting existing tests
- `chore`: Maintenance tasks (deps, configs, build, etc.)
- `ci`: Changes to CI configuration files and scripts
- `build`: Changes to build system or external dependencies
- `revert`: Reverts a previous commit

### Scope (optional but recommended)
A noun describing the section of codebase:
- `vault`, `billy`, `database` — production services
- `rendetalje`, `renos`, `cloud-dashboard`, `chat` — web apps
- `ai`, `gmail`, `mcp` — backend services
- `ci`, `docker`, `docs`, `config`, `deps` — infrastructure
- `shared`, `packages`, `scripts`, `chatmode` — shared/meta

### Subject (required)
- Imperative mood: "add feature" not "added feature"
- No capitalization of first letter
- No period at the end
- Min 10 characters, max 72 total (including type and scope)

### Body (optional)
- Separate from subject with blank line
- Explain *what* and *why*, not *how*
- Wrap at 72 characters

### Footer (optional)
- Reference issues: `Closes #123`
- Breaking changes: `BREAKING CHANGE: description`

## Examples

### Good ✅

```
feat(vault): add semantic search endpoint

Implement POST /api/search with OpenAI embeddings and pgvector.
Returns top-N similar documents with configurable threshold.

Closes #42
```

```
fix(billy): handle rate limit on token refresh

Add exponential backoff when Billy.dk API returns 429.
Prevents sync failures during high-traffic periods.
```

```
chore(deps): bump @supabase/supabase-js to 2.39.0
```

```
docs(chatmode): add git workflow section to TekupDK.chatmode.md
```

### Bad ❌

```
Added new feature
```
❌ Missing type, scope, and not imperative

```
feat: api
```
❌ Subject too short, missing scope

```
Feat(Vault): Added Search Endpoint.
```
❌ Type capitalized, subject capitalized, ends with period

```
fix(tekup-vault-search-service): fixed the search bug
```
❌ Scope too verbose, "fixed" not imperative, subject not specific

## Validation

Commits are validated:
1. **Locally** (if husky is configured): on `git commit`
2. **CI** (GitHub Actions): on push and PR

To manually check a commit message:
```powershell
echo "feat(vault): add search" | npx commitlint
```

## Branch Naming

While not enforced by commitlint, follow this pattern for consistency:
```
<type>/<scope>-<short-topic>-<YYYYMMDD>
```

Examples:
- `feat/vault-search-20251029`
- `fix/billy-rate-limit-20251029`
- `chore/deps-upgrade-20251029`

## Migration Tips

If you have existing commits that don't follow this format:
1. New commits must follow the format going forward
2. Use `git rebase -i` to rewrite history only on feature branches
3. For quick fixes: `git commit --amend` to fix the most recent commit

## References

- [Conventional Commits Spec](https://www.conventionalcommits.org/)
- [Commitlint Documentation](https://commitlint.js.org/)
- TekupDK chatmode: `.github/chatmodes/TekupDK.chatmode.md`
- Workspace config: `commitlint.config.cjs`
