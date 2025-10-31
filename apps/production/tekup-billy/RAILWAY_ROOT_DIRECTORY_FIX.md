# Railway Root Directory Fix

## Problem

Railway bruger Railpack og kigger i repository root, ikke i `apps/production/tekup-billy/`.

Railpack finder workspace med 10 packages og fejler fordi den ikke ved hvilken package der skal køres.

## Løsning

**I Railway Dashboard:**

1. Gå til **Service Settings → Source**
2. Sæt **Root Directory** til: `apps/production/tekup-billy`
3. Gem ændringer
4. Redeploy

Dette fortæller Railway hvor service mappen er, så den kan finde `package.json` og køre start script korrekt.

## Alternativ: Brug Dockerfile

Hvis Railpack stadig fejler:

1. Gå til **Service Settings → Build**
2. Sæt **Builder** til: `DOCKERFILE`
3. **Dockerfile Path:** `apps/production/tekup-billy/Dockerfile`
4. **Docker Context:** `apps/production/tekup-billy`
5. Gem og redeploy

