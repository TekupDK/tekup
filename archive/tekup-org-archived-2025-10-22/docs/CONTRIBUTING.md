# Contributing

## Branching
- Feature branches: `feat/<scope>-<short-desc>`
- Fix branches: `fix/<scope>-<short-desc>`
- Release branches: `release/<version>`

## Commit style
- Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`

## PR checklist
- [ ] Tests og lint passerer
- [ ] Dokumentation opdateret (README, docs/*, CHANGELOG.md)
- [ ] OpenAPI/TypeDoc opdateret ved API-ændringer
- [ ] Sikkerhedsnoter opdateret ved berørte moduler

## Code style
- TypeScript 5, ESLint, Prettier
- TSDoc for public klasser/funktioner

## Testing
- `pnpm test` i roden kører alle pakker
- E2E testes i app-mapper efter behov

## Release flow
- Skær versionsnummer opdatering pr. app/pakke
- Tilføj CHANGELOG entry under ny version