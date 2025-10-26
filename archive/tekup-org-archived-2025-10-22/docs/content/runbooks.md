---
id: runbooks
title: Runbooks
---

Incident: API nedetid
- Bekræft status via `/health` og metrics `/metrics`
- Rul tilbage seneste release hvis nødvendigt

Export af docs lokalt:
```bash
pnpm -w build
pnpm docs:typedoc
pnpm docs:openapi
pnpm docs:dev
```
