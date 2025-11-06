# Debug Login Problem med MCP Tools

## Problem

Login knappen "Sign in to continue" virker ikke - browseren sender ikke `app_session_id` cookie tilbage efter login redirect.

## MCP Tools til Debugging

### 1. Playwright Browser Automation

Test login flowet automatisk:

```
@copilot åbn http://localhost:3000 i Playwright browser
@copilot klik på "Sign in to continue" knappen
@copilot log alle cookies efter redirect
@copilot tag screenshot af hver step i login flowet
```

### 2. Database Verification

Tjek om user bliver oprettet korrekt:

```
@copilot vis mig users tabellen struktur
@copilot find brugeren med openId="owner-friday-ai-dev"
@copilot tjek om lastSignedIn bliver opdateret når jeg logger ind
```

### 3. Filesystem Analysis

Find alle cookie-relaterede konfigurationer:

```
@copilot søg efter "app_session_id" i hele projektet
@copilot find alle steder hvor vi sætter cookies
@copilot vis mig cookie configuration i oauth.ts og cookies.ts
```

### 4. Fetch External Documentation

Hent relevant dokumentation:

```
@copilot hent Express cookie dokumentation
@copilot fetch information om SameSite cookie attributes
@copilot hent Playwright browser context cookie methods
```

## Automated Test Script

Bed Copilot om at oprette en test:

```
@copilot opret en Playwright test der:
1. Navigerer til http://localhost:3000
2. Klikker "Sign in to continue"
3. Verificerer at app_session_id cookie bliver sat
4. Tjekker om redirect til / inkluderer cookien
5. Logger alle cookie attributes (domain, path, sameSite, httpOnly)
```

## Current Issue Analysis

Baseret på logs ved vi:

- ✅ Server sætter cookie korrekt: `domain: undefined, path: '/', sameSite: 'lax', httpOnly: false`
- ❌ Browser sender kun Clerk cookies tilbage: `__clerk_db_jwt`, `__client_uat`
- ❌ `app_session_id` mangler i alle efterfølgende requests

## Mulige Årsager (som MCP kan hjælpe med at teste)

### Test 1: Browser Cookie Storage

```
@copilot brug Playwright til at inspicere browser cookie storage efter login
@copilot log document.cookie fra browser console
```

### Test 2: Cookie Domain Issue

```
@copilot test om cookie fungerer med explicit domain: 'localhost'
@copilot sammenlign cookie behavior med og uden domain attribute
```

### Test 3: Simple Browser vs Real Browser

```
@copilot test login i både Chrome og Firefox via Playwright
@copilot sammenlign cookie behavior mellem browsere
```

### Test 4: HTTP Response Headers

```
@copilot capture Set-Cookie headers fra /api/auth/login response
@copilot verificer at Cookie header sendes i næste request til /
```

## Quick Fix Test

Prøv denne kommando i Agent Mode:

```
@copilot
1. Åbn http://localhost:3000 i Playwright
2. Monitor network requests og cookies
3. Klik login knappen
4. Log alle Set-Cookie og Cookie headers
5. Identificer hvorfor app_session_id ikke persisterer
6. Generer en rapport med screenshots og logs
```

## Forventet Output

MCP tools burde kunne fortælle os:

- Om cookien rent faktisk bliver sat i browser storage
- Om det er et redirect timing problem
- Om browser sikkerhedspolitikker blokerer cookien
- Forskellen mellem Simple Browser og rigtige browsere

## Næste Skridt

Hvis MCP tools bekræfter at:

- Cookie IKKE ses i browser storage → Problem med Set-Cookie header
- Cookie SES i storage men ikke sendes → Problem med cookie attributes
- Cookie virker i Chrome men ikke Simple Browser → Browser compatibility issue

---

**Tip**: Brug Agent Mode (`Ctrl+Shift+P` → "GitHub Copilot: Open Agent Chat") for at få Copilot til automatisk at vælge de rigtige MCP tools til hver opgave!
