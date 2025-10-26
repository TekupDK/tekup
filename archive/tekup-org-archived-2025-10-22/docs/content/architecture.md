---
id: architecture
title: Arkitektur
---

Høj-niveau arkitektur for TekUp monorepo:

```mermaid
flowchart LR
  Users((Users)) -->|HTTP| flowAPI[flow-api (NestJS)]
  Users -->|Web| flowWeb[flow-web (Next.js)]
  flowAPI -->|Queues/DB| shared[(Shared services)]
  secure[secure-platform] --> shared
  crmAPI[tekup-crm-api] --> shared
  leadAPI[tekup-lead-platform] --> shared
```

Map af mapper:
- `apps/*`: Kørende applikationer (API og web)
- `packages/*`: Delte biblioteker (`@tekup/*`)

Rendetalje-integrationer eksisterer som moduler under relevante apps (fx lead-platform integrations).
