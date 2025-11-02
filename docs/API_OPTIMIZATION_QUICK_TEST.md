# API Optimering - Quick Test Guide

**Quick Reference** for at teste API optimeringer

## 🚀 Hurtig Start

### 1. Åbn DevTools

```bash
# Browser DevTools (F12)
- Network tab: Monitor API calls
- Console tab: Se rate limit logs
```

### 2. Test Cache (2 minutter)

```
1. Åbn CalendarTab
2. Skift til InvoicesTab
3. Skift tilbage til CalendarTab
4. Observer: Ingen API call (cache hit)
```

✅ **Success:** Ingen API call når data er cached (< 60s)

---

### 3. Test Adaptive Polling (5 minutter)

**Test A: Activity Detection**

```
1. Åbn CalendarTab
2. Observer Network tab
3. Interager (klik, scroll) → Polling: ~30s
4. Stop interaktion → Vent 2 min
5. Observer → Polling: ~90-180s (øget)
```

✅ **Success:** Interval stiger ved inaktivitet

**Test B: Page Visibility**

```
1. Åbn CalendarTab
2. Observer polling i Network tab
3. Skift til anden tab (eller minimer)
4. Vent 2 minutter
5. Skift tilbage → Observer: Umiddelbar API call
```

✅ **Success:** Ingen polling når tab skjult, resume ved return

---

### 4. Test Rate Limit Handling

**Hvis rate limit opstår:**

```
1. Observer UI: Countdown timer vises
2. Observer Console: "[Rate Limit]" log med queue size
3. Observer Network: Polling pauser
4. Vent til countdown når 0
5. Observer: Polling resume automatisk
```

✅ **Success:** Rate limit håndteres automatisk

---

## 📊 Quick Metrics

### Mål API Calls (10 minutter)

**Før optimering:**

- EmailTab: ~7 calls (90s interval)
- CalendarTab: ~7 calls (90s interval)
- InvoicesTab: ~10 calls (60s interval)
- **Total: ~24 calls**

**Efter optimering (forventet):**

- Aktiv brug: ~15-17 calls (40-50% reduktion)
- Inaktiv brug: ~7-10 calls (60-70% reduktion)

### Observer i Network Tab:

```
- Filter: XHR eller Fetch
- Group by: Endpoint eller Domain
- Tæl requests over 10 minutter
```

---

## 🔍 Console Commands

**Check Request Queue:**

```javascript
// I browser console (development only)
window.__requestQueue?.getQueueSize()
window.__requestQueue?.isRateLimited()
window.__requestQueue?.clearRateLimit() // Manual clear
```

**Check Rate Limit State:**

```javascript
// Se i console logs
// "[Rate Limit]" viser state
```

**Check Cache State:**

```javascript
// React Query DevTools (hvis installeret)
// Eller observer Network tab for cache headers
```

---

## ✅ Success Checklist

- [ ] Cache virker (ingen unødvendige refetches)
- [ ] Adaptive polling justerer interval
- [ ] Page visibility pauser polling
- [ ] Rate limit errors håndteres korrekt
- [ ] API calls reduceret (verificer via Network tab)
- [ ] Ingen console errors
- [ ] UI responsivitet forbedret

---

## 📝 Test Notater

**Dato:** **\*\***\_\_\_**\*\***
**Browser:** **\*\***\_\_\_**\*\***
**Test Duration:** **\*\***\_\_\_**\*\***

**Observations:**

- API Calls (10min): **\*\***\_\_\_**\*\***
- Cache Hits: **\*\***\_\_\_**\*\***
- Rate Limit Errors: **\*\***\_\_\_**\*\***
- Issues Found: **\*\***\_\_\_**\*\***

---

## 🔗 Relaterede Docs

- **Detaljeret Test Rapport:** [API_OPTIMIZATION_TEST_REPORT.md](./API_OPTIMIZATION_TEST_REPORT.md)
- **Implementerings Notater:** [API_OPTIMIZATION_IMPLEMENTATION_NOTES.md](./API_OPTIMIZATION_IMPLEMENTATION_NOTES.md)
