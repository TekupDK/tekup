# TypeScript Performance Optimization – Plan

## Context

VS Code's TypeScript Language Service analyser alle filer ved opstart, inkl. 30+ root-level scripts (migration, test, check-scripts). Dette skaber unødvendig load og langsommere IDE-opstart.

## Problem

- TypeScript analyserer **alle** `.ts`, `.mjs`, og `.js` filer i roden
- 17 TypeScript filer i root (migrations, checks, setup)
- 12 JavaScript/MJS filer i root (tests, checks)
- `tsconfig.json` ekskluderer ikke root-level scripts
- Langsom IDE-opstart med notifikationer: "Analyzing 'google-api.ts' and its dependencies"

## Goals

1. Forbedre VS Code TypeScript-analyse performance
2. Organisere root-level scripts i logiske mapper
3. Optimere `tsconfig.json` til kun at analysere application code
4. Bevare eksisterende funktionalitet og scripts

## Root-level Scripts Analyse

### Database/Migration Scripts (→ `scripts/database/`)

- `add-alias-columns.ts`
- `add-missing-columns.ts`
- `check-customers.ts`
- `check-emails-table.ts`
- `check-invoices.ts`
- `check-tables.ts`
- `create-tables-directly.ts`
- `fix-emails-table.ts`
- `migrate-emails-schema.ts`
- `run-email-threads-migration.ts`
- `run-migration.ts`
- `setup-enums-via-cli.ts`
- `check-columns.mjs`
- `run-pipeline-migration.mjs`

### Test Scripts (→ `scripts/tests/`)

- `test-all-email-functions.mjs`
- `test-email-actions.mjs`
- `test-email-sidebar.mjs`
- `test-google-api.mjs`
- `test-intent.mjs`
- `test-label-filtering.mjs`
- `test-ui-state.mjs`
- `test-database.js`
- `test-inbound-email.js`

### Environment/Config Scripts (→ `scripts/env/`)

- `check-env.js`

### Config Files (forbliver i root)

- `drizzle.config.ts` ✅ (config)
- `playwright.config.ts` ✅ (config)
- `vite.config.ts` ✅ (config)
- `vitest.config.ts` ✅ (config)
- `vitest.setup.ts` ✅ (config)

## Acceptance Criteria

### Phase 1: Organisering

- [ ] Opret `scripts/database/` mappe
- [ ] Opret `scripts/tests/` mappe
- [ ] Opret `scripts/env/` mappe
- [ ] Flyt database/migration scripts til `scripts/database/`
- [ ] Flyt test scripts til `scripts/tests/`
- [ ] Flyt environment scripts til `scripts/env/`
- [ ] Bevar config filer i root (\*.config.ts)

### Phase 2: TypeScript Config Optimization

- [ ] Opdater `tsconfig.json` exclude:
  ```json
  "exclude": [
    "node_modules",
    "build",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts",
    "scripts/**/*"  // Ekskluder alle scripts fra TypeScript analyse
  ]
  ```

### Phase 3: Opdater Referencer

- [ ] Find og opdater alle script references i:
  - [ ] `package.json` scripts
  - [ ] `tasks.json` (VS Code tasks)
  - [ ] `.md` dokumentation filer
  - [ ] PowerShell scripts (`.ps1`)
  - [ ] README filer

### Phase 4: Validering

- [ ] Test alle npm scripts virker efter flytning
- [ ] Test alle VS Code tasks virker
- [ ] Verificer TypeScript Language Service kun analyserer app code
- [ ] Bekræft hurtigere IDE-opstart
- [ ] Ingen fejl i Problems panel

## Implementation Steps

### 1. Backup

```powershell
# Git commit før ændringer
git add .
git commit -m "chore: backup before script reorganization"
```

### 2. Create Directory Structure

```powershell
New-Item -ItemType Directory -Path "scripts/database" -Force
New-Item -ItemType Directory -Path "scripts/tests" -Force
New-Item -ItemType Directory -Path "scripts/env" -Force
```

### 3. Move Files

```powershell
# Database scripts
Move-Item -Path "*.ts" -Destination "scripts/database/" -Include "*migration*","*check-*","*add-*","*fix-*","*setup-*","*create-tables*"
Move-Item -Path "*.mjs" -Destination "scripts/database/" -Include "*migration*","*check-columns*"

# Test scripts
Move-Item -Path "test-*.mjs" -Destination "scripts/tests/"
Move-Item -Path "test-*.js" -Destination "scripts/tests/"

# Environment scripts
Move-Item -Path "check-env.js" -Destination "scripts/env/"
```

### 4. Update tsconfig.json

```json
{
  "include": ["client/src/**/*", "shared/**/*", "server/**/*"],
  "exclude": [
    "node_modules",
    "build",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/tests/**",
    "scripts/**/*"
  ],
  "compilerOptions": {
    // ... existing options
  }
}
```

### 5. Update References

- Scan for hardcoded paths in `package.json`
- Update task definitions i `.vscode/tasks.json`
- Update documentation

### 6. Verify

```powershell
# Test key scripts
pnpm db:migrate
pnpm test

# Check TypeScript
npx tsc --noEmit
```

## Expected Performance Improvements

**Before:**

- ⏳ TypeScript analyser 29+ root files
- ⏳ Langsom IDE opstart (30-60 sek)
- ⚠️ Notifikationer om analyse af diverse scripts

**After:**

- ✅ TypeScript analyserer kun `client/`, `server/`, `shared/`
- ⚡ Hurtigere IDE opstart (5-15 sek)
- ✅ Ingen unødvendige analyse-notifikationer
- ✅ Bedre organiseret projekt struktur

## Rollback Plan

```powershell
# Hvis problemer opstår
git reset --hard HEAD~1
```

## Related Tasks

- `tasks/ops/PLAN.md` - Operations & maintenance
- `tasks/db/PLAN.md` - Database migrations

## References

- [TypeScript Performance](https://github.com/microsoft/TypeScript/wiki/Performance)
- [VS Code TypeScript Configuration](https://code.visualstudio.com/docs/typescript/typescript-compiling)

## Notes

- Config filer (`*.config.ts`) skal forblive i root for at fungere korrekt
- PowerShell scripts (`.ps1`) skal ikke flyttes (ikke TypeScript-filer)
- Markdown filer påvirker ikke TypeScript performance
