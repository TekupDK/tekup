# Docs Lint – Plan

Context: Markdownlint noise in `docs/**`, `STATUS.md`, `MIGRATION_GUIDE.md` etc.

## Goals

- Reduce Problems noise without blocking developers.
- Enforce minimal, helpful rules; ignore generated or long-form reports.

## Options

- Editor-only: filter/suppress markdownlint locally.
- Workspace: `.vscode/settings.json` scoped ignore.
- Repo: `.markdownlint.json` + `.markdownlintignore` (preferred once stable).

## Acceptance criteria

- [ ] `Problems` pane is < 25 issues from docs (or ignored) by default.
- [ ] CI does not fail on docs unless explicitly requested (e.g., `lint:md`).
- [ ] Writers can preview lint locally on demand.

## Steps (suggested)

- [ ] Propose `.markdownlint.json` with targeted rules (MD022/MD032/MD029 tuning).
- [ ] Add `.markdownlintignore` for `docs/screenshots/**`, large reports.
- [ ] Optional: `pnpm run lint:md` for changed files in PR.
