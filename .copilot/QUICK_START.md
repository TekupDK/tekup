# MCP Quick Start Guide

## 1. Verificer Installation

Genstart VS Code for at aktivere MCP konfigurationen.

## 2. Test MCP Servere

### Test Filesystem Access

Åbn Copilot Chat og prøv:

```
Vis mig strukturen af server/ mappen
```

### Test Database Access (kræver DATABASE_URL i .env.dev)

```
Hvilke tabeller har vi i databasen?
```

### Test Playwright (første gang downloader browsers)

```
Åbn https://localhost:5000 i en browser
```

### Test Fetch

```
Hent dokumentationen fra https://trpc.io/docs
```

## 3. Praktiske Use Cases for Tekup

### Udvikling

```
Hjælp mig med at tilføje en ny tRPC endpoint for customer search
Generer en ny React komponent til at vise case timelines
Refaktorer EmailTab.tsx til at bruge React Query bedre
```

### Database Operations

```
Vis mig alle customers der har uløste cases
Generer en migration til at tilføje 'priority' felt til cases
Analyser performance af vores email queries
```

### Testing & Debugging

```
Test login flow end-to-end med Playwright
Find alle steder hvor vi bruger localStorage
Debug hvorfor customer profil ikke loader korrekt
```

### AI Analysis Integration

```
Analyser Emil Laerke case og identificer lignende patterns
Generer rapport over alle konflikt types fra sidste måned
Foreslå forbedringer til vores case resolution workflow
```

## 4. Advanced: Kombiner Multiple Tools

```
1. Hent customer data fra databasen
2. Åbn deres profil i browser
3. Tag screenshots af UI states
4. Generer test cases baseret på deres historik
```

## Næste Skridt

1. Prøv agent mode: `Ctrl+Shift+P` → "GitHub Copilot: Open Agent Chat"
2. Læs fuld dokumentation i `.copilot/README.md`
3. Tilpas `context.json` med flere use cases efterhånden som projektet udvikler sig

God fornøjelse med de nye Copilot capabilities! 🚀
