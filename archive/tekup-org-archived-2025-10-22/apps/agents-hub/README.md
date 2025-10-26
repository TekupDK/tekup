# TekUp Agents Hub

Overblik, styring og personalisering af AI agents på tværs af TekUp-platformen.

## Konfiguration

1) Kopiér .env.example til .env.local og udfyld værdierne:

```
cp .env.example .env.local
```

- NEXT_PUBLIC_API_URL: URL til flow-api (fx http://localhost:4000)
- NEXT_PUBLIC_TENANT_API_KEY: (valgfri) API-nøgle til flow-api

2) Start appen

```
pnpm -C apps/agents-hub dev
```

## Metrics

Agents Hub henter Prometheus-metrics fra `${NEXT_PUBLIC_API_URL}/metrics`. Hvis API kræver nøgle, sendes `x-api-key` header med `NEXT_PUBLIC_TENANT_API_KEY`.

## Providers

- Voice (Gemini) konfigureres via GEMINI_API_KEY i Voice Agent app
- Inbox AI bruger OpenAI/Anthropic i deres respektive apps
