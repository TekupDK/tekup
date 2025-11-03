# API Optimering Test Rapport

**Dato:** ${new Date().toISOString().split('T')[0]}
**Version:** 1.0
**Status:** Test Fase

## 📋 Oversigt

Denne rapport dokumenterer implementeringen af API optimeringer til at reducere rate limit errors og forbedre performance.

## ✅ Implementerede Features

### Phase 1: Quick Wins ✅

1. **Structural Sharing**
   - Aktiveret i QueryClient (`main.tsx`)
   - Forbedrer cache hit rates og reducerer re-renders

2. **Intelligent Caching Strategi**
   - Global staleTime: 30s → 60s
   - Global gcTime: 5min → 15min
   - Query-specifikke overrides mulige

3. **Exponential Backoff med Jitter**
   - Fil: `client/src/lib/retryStrategy.ts`
   - Intelligent retry baseret på error type
   - Random jitter forhindrer thundering herd problem

4. **EmailSidebar Cache Fix**
   - Fixet deprecated `cacheTime` → `gcTime`
   - React Query v5 kompatibilitet

### Phase 2: Request Queue System ✅

- **Fil:** `client/src/lib/requestQueue.ts`
- Priority-based queueing (high/normal/low)
- Automatisk rate limit håndtering
- Auto-processing efter retry-after period
- Integreret globalt i `main.tsx`

### Phase 4: Adaptive Polling ✅

- **Fil:** `client/src/hooks/useAdaptivePolling.ts`
- Activity-based interval adjustment
- Page Visibility API integration
- Implementeret i:
  - `CalendarTab.tsx` (30s-5min interval)
  - `InvoicesTab.tsx` (30s-3min interval)

### Phase 5: TRPC Middleware ✅

- **Server:** Error formatter med retry-after
- **Client:** Request queue integration i error handlers

## 🧪 Test Scenarier

### Test 1: Cache Optimering

**Mål:** Verificer at cache reducerer unødvendige API calls

**Steps:**

1. Åbn CalendarTab eller InvoicesTab
2. Observer Network tab i DevTools
3. Skift til anden tab og tilbage igen
4. Verificer at ingen nye API calls forekommer (data skal være cached)

**Forventet Resultat:**

- ✅ Ingen API calls når data er cached (60s staleTime)
- ✅ Cache hit rate > 80%

**Måling:**

```
Før: ~2-3 requests ved tab switch
Efter: ~0 requests (hvis inden for staleTime)
Reduktion: 100% for cached requests
```

---

### Test 2: Exponential Backoff med Jitter

**Mål:** Verificer at retry strategy virker korrekt

**Steps:**

1. Simuler rate limit error (eller vent på faktisk rate limit)
2. Observer console logs for retry attempts
3. Verificer at retry delays stiger eksponentielt
4. Verificer at jitter tilføjes (random variation)

**Forventet Resultat:**

- ✅ Retry delays: 1s → 2s → 4s → 8s → 16s → 30s (max)
- ✅ Hver delay har random jitter (0-50% af delay)
- ✅ Rate limit errors retries ikke efter første forsøg

**Måling:**

```
Retry 1: ~1000-1500ms (med jitter)
Retry 2: ~2000-3000ms (med jitter)
Retry 3: ~4000-6000ms (med jitter)
```

---

### Test 3: Adaptive Polling - Activity Detection

**Mål:** Verificer at polling justerer sig baseret på brugeraktivitet

**Steps:**

1. Åbn CalendarTab eller InvoicesTab
2. Observer Network tab
3. Interager med siden (klik, scroll, etc.) - observer polling interval
4. Lad siden stå i 1+ minut uden interaktion
5. Observer at polling interval øges

**Forventet Resultat:**

- ✅ Aktiv polling: 30 sekunder interval
- ✅ Inaktiv polling: Graduel øgning til max (3-5 minutter)
- ✅ Resume til min interval ved aktivitet

**Måling:**

```
Aktiv: ~30s interval
Inaktiv (1min): ~45s interval
Inaktiv (2min): ~90s interval
Inaktiv (5min): Max interval (180s-300s)
```

---

### Test 4: Adaptive Polling - Page Visibility

**Mål:** Verificer at polling pauser når tab er skjult

**Steps:**

1. Åbn CalendarTab eller InvoicesTab
2. Observer Network tab
3. Skift til anden browser tab (eller minimer vinduet)
4. Vent 2 minutter
5. Skift tilbage til original tab
6. Observer at polling genoptages

**Forventet Resultat:**

- ✅ Ingen polling når tab er skjult
- ✅ Umiddelbar polling resumption når tab bliver synlig igen
- ✅ Polling interval reset til min ved resume

**Måling:**

```
Tab skjult: 0 API calls
Tab synlig igen: Umiddelbar API call + normal polling resume
```

---

### Test 5: Request Queue ved Rate Limit

**Mål:** Verificer at requests bliver queued ved rate limit

**Steps:**

1. Trigger rate limit (gennem mange requests)
2. Prøv at lave flere API calls mens rate limited
3. Observer console logs for queue status
4. Vent til retry-after period udløber
5. Verificer at queued requests proceses

**Forventet Resultat:**

- ✅ Requests bliver queued når rate limited
- ✅ Queue vises i console logs med size
- ✅ Requests proceses automatisk efter retry-after
- ✅ High priority requests proceses først

**Måling:**

```
Rate limit: Request queue size vises i console
Efter retry-after: Queue proceses automatisk
Processing order: High → Normal → Low priority
```

---

### Test 6: Rate Limit Error Handling

**Mål:** Verificer at rate limit errors håndteres korrekt

**Steps:**

1. Observer UI når rate limit opstår
2. Verificer at countdown timer vises
3. Verificer at polling pauser
4. Verificer at retry-after timestamp er korrekt

**Forventet Resultat:**

- ✅ Rate limit error vises i UI med countdown
- ✅ Polling pauser automatisk
- ✅ Retry-after timestamp er korrekt
- ✅ Auto-resume efter retry-after period

**Måling:**

```
Error visning: "Rate limit: X minutter" countdown
Polling status: Paused
Auto-resume: Efter retry-after timestamp
```

---

### Test 7: Overall API Call Reduction

**Mål:** Mål total reduktion i API calls

**Steps:**

1. Åbn alle tabs (EmailTab, CalendarTab, InvoicesTab)
2. Observer Network tab i 10 minutter
3. Tæl total antal API calls
4. Sammenlign med baseline (før optimeringer)

**Forventet Resultat:**

- ✅ 30-50% reduktion i API calls i første 10 minutter
- ✅ 60-70% reduktion ved inaktiv brug
- ✅ Ingen rate limit errors i normal brug

**Baseline (Før):**

```
EmailTab: ~7 calls/10min (90s interval)
CalendarTab: ~7 calls/10min (90s interval)
InvoicesTab: ~10 calls/10min (60s interval)
Total: ~24 calls/10min
```

**Forventet (Efter):**

```
Aktiv brug: ~15-17 calls/10min (40-50% reduktion)
Inaktiv brug: ~7-10 calls/10min (60-70% reduktion)
```

---

## 📊 Målepunkter

### Performance Metrics

| Metric                     | Før      | Mål (Efter)     | Status    |
| -------------------------- | -------- | --------------- | --------- |
| API Calls (aktiv 10min)    | ~24      | ~15-17          | ⏳ Testes |
| API Calls (inaktiv 10min)  | ~24      | ~7-10           | ⏳ Testes |
| Cache Hit Rate             | ~40%     | >80%            | ⏳ Testes |
| Rate Limit Errors          | Høj      | 0 (normal brug) | ⏳ Testes |
| Polling Interval (aktiv)   | Fast 90s | 30s             | ⏳ Testes |
| Polling Interval (inaktiv) | Fast 90s | 180-300s        | ⏳ Testes |
| Request Queue Usage        | N/A      | Automatisk      | ⏳ Testes |

### Success Criteria

✅ **Phase 1 Success:**

- [ ] Cache hit rate > 80%
- [ ] Ingen deprecated warnings
- [ ] Exponential backoff viser jitter

✅ **Phase 2 Success:**

- [ ] Request queue håndterer rate limits
- [ ] Priority queueing virker korrekt

✅ **Phase 4 Success:**

- [ ] Adaptive polling justerer interval
- [ ] Page visibility pauser polling korrekt
- [ ] 30-50% reduktion i API calls ved aktiv brug

✅ **Overall Success:**

- [ ] 50%+ reduktion i API calls
- [ ] 0 rate limit errors i normal brug
- [ ] Forbedret perceived performance

---

## 🔍 Fejlfinding

### Problem: Cache virker ikke

**Symptomer:**

- API calls forekommer selv når data er cached
- Cache hit rate < 50%

**Løsninger:**

1. Tjek at `structuralSharing: true` er aktiveret
2. Verificer at `staleTime` er sat korrekt
3. Tjek Network tab for cache headers

### Problem: Adaptive Polling justerer ikke interval

**Symptomer:**

- Interval forbliver fast uanset aktivitet
- Ingen ændring ved inaktivitet

**Løsninger:**

1. Tjek at `useAdaptivePolling` hook er korrekt implementeret
2. Verificer at `inactivityThreshold` er sat korrekt
3. Tjek console for errors i hook

### Problem: Request Queue proceses ikke

**Symptomer:**

- Requests bliver i queue men proceses ikke
- Rate limit bliver aldrig cleared

**Løsninger:**

1. Tjek console logs for queue status
2. Verificer at `requestQueue.setRateLimitUntil()` kaldes
3. Tjek at `retry-after` timestamp er korrekt

### Problem: Rate Limit Errors fortsætter

**Symptomer:**

- Rate limit errors opstår stadig
- Retry-after ikke respekteret

**Løsninger:**

1. Verificer at rate limit detection virker (`isRateLimitError`)
2. Tjek at `retry: shouldRetry` bruges i queries
3. Verificer at polling pauser ved rate limit

---

## 📝 Test Notater

### Test Session: [Dato]

**Test Environment:**

- Browser: **\*\***\_\_\_**\*\***
- Network Throttling: **\*\***\_\_\_**\*\***
- Duration: **\*\***\_\_\_**\*\***

**Observations:**

```
[Indsæt notater her under testning]
```

**Issues Found:**

```
[Indsæt issues fundet under testning]
```

**Metrics Collected:**

```
API Calls (10min aktiv): _____
API Calls (10min inaktiv): _____
Cache Hit Rate: _____%
Rate Limit Errors: _____
Average Polling Interval (aktiv): _____
Average Polling Interval (inaktiv): _____
```

---

## 🎯 Næste Skridt

Efter testning:

1. **Hvis success criteria opfyldes:**
   - Dokumenter resultater
   - Overvej at implementere Gmail History API (Phase 3)
   - Integrer adaptive polling i EmailTab

2. **Hvis issues findes:**
   - Dokumenter alle issues
   - Prioritér fixes
   - Retest efter fixes

3. **Optimering:**
   - Juster intervals baseret på test data
   - Tune cache times baseret på usage patterns
   - Fine-tune adaptive polling thresholds

---

## 📚 Relaterede Dokumenter

- [Rate Limit Fix Dokumentation](./EMAIL_TAB_RATE_LIMIT_FIX.md)
- [API Optimization Plan](../api-optimering-og-rate-limiting-forbedringer.plan.md)
- [Email Tab Development](../email-tab-development-branch.plan.md)
