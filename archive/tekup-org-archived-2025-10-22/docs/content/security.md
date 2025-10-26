---
id: security
title: Sikkerhed
---

Overordnede sikkerhedsprincipper:
- Minimer rettigheder (least privilege)
- Valider input og begræns rate på kritiske endpoints
- Log hændelser uden PII; brug kategorier fremfor rå data

API-specifikke noter:
- flow-api: API-nøgler, tenant-kontekst, rate limiting
- lead-platform: `x-tenant-key` i header; følsomme felter maskeres
- crm-api: brug `@nestjs/config` til konfiguration, aldrig hårdkode hemmeligheder

Miljøvariabler: dokumentér nøgle-navne i README; offentliggør ikke værdier.
