# TypeScript Performance Optimization – Status

## Current Status: ⏳ Ready to Start

**Last updated:** 2025-11-05

## Quick Status

- ✅ Problem identificeret: 29+ root-level scripts sænker TypeScript performance
- ✅ Analyse komplet: Alle scripts kategoriseret
- ✅ Plan oprettet: Klar til implementation
- ⏳ Awaiting implementation

## Implementation Checklist

### Phase 1: Organisering (Not Started)

- [ ] Opret `scripts/database/` mappe
- [ ] Opret `scripts/tests/` mappe
- [ ] Opret `scripts/env/` mappe
- [ ] Flyt 14 database/migration scripts
- [ ] Flyt 9 test scripts
- [ ] Flyt 1 environment script

### Phase 2: TypeScript Config (Not Started)

- [ ] Opdater `tsconfig.json` exclude
- [ ] Verificer config syntax

### Phase 3: Referencer (Not Started)

- [ ] Scan `package.json` for script paths
- [ ] Opdater `tasks.json` (VS Code tasks)
- [ ] Opdater dokumentation
- [ ] Opdater PowerShell scripts

### Phase 4: Validering (Not Started)

- [ ] Test npm scripts
- [ ] Test VS Code tasks
- [ ] Verificer TypeScript performance
- [ ] Bekræft ingen fejl

## Blockers

Ingen blockers. Klar til at starte når tid tillader det.

## Next Steps

1. Commit current work til git (backup)
2. Opret script directories
3. Flyt filer systematisk
4. Opdater alle referencer
5. Test grundigt

## Performance Metrics

### Expected Improvements

| Metric                   | Before           | After (Target) |
| ------------------------ | ---------------- | -------------- |
| Files analyzed by TS     | 29+ root scripts | 0 root scripts |
| IDE startup time         | 30-60 sek        | 5-15 sek       |
| TypeScript notifications | Mange            | Minimal        |

## Notes

- Sikker operation: alle ændringer kan revertes via git
- Ingen breaking changes til application code
- Config filer forbliver i root (nødvendigt for tooling)
