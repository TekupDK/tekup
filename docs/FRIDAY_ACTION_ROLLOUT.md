# Friday Action – Udrulning/Feature Flag

## Feature flag

- `FRIDAY_ACTION_SUGGESTIONS`: styrer visning af SuggestionsBar og action‑chips.

## Rul ud i trin

1. Intern dogfood (10%)
2. Udvid til 50% af brugere
3. 100% når metrikker er grønne

## Canary & Policy

- Brug eksisterende GitHub workflows (`.github/workflows/*`) for canary/policy gates
- Smoke tests: visning af chips, åbning af modal, ingen PII i logs

## Rollback

- Deaktivér feature flag (øjeblikkelig)
- Revert deploy hvis serverfejl (>X/min)

## Kommunikation

- Release notes og 30 sek. GIF af flowet
- Kort “hvordan” i app (tooltip ved første visning)
