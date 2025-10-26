---
id: performance
title: Ydelse
---

Generelle retningslinjer:
- Undgå N+1-queries; brug batch og caching
- Overvåg latens via `MetricsService` og Prometheus-scrape

flow-api:
- Brug histogrammer til at måle ingestion og duplikat-detektion

lead-platform:
- Validerings-pipelines med `ValidationPipe` og whitelisting

crm-api:
- Aktivér HTTP keep-alive og connection pooling
