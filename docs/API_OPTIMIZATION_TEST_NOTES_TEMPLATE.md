# API Optimering - Test Notater Template

**Test Session Dato:** **\*\***\_\_\_**\*\***
**Tester:** **\*\***\_\_\_**\*\***
**Branch:** **\*\***\_\_\_**\*\***
**Browser:** **\*\***\_\_\_**\*\***
**Network Throttling:** **\*\***\_\_\_**\*\***

---

## 🧪 Test 1: Cache Optimering

**Status:** ⏳ Pending / ✅ Pass / ❌ Fail

**Steps Udført:**

- [ ] Åbn CalendarTab
- [ ] Skift til InvoicesTab og tilbage
- [ ] Observer Network tab

**Observations:**

```
[Indsæt notater her]
```

**Result:**

- Cache Hit: ⏳ Yes / No
- API Calls: **\_** (forventet: 0 hvis cached)
- Issues: **\*\***\_\_\_**\*\***

---

## 🧪 Test 2: Exponential Backoff

**Status:** ⏳ Pending / ✅ Pass / ❌ Fail

**Steps Udført:**

- [ ] Observer console logs ved fejl
- [ ] Verificer retry delays
- [ ] Check jitter variation

**Observations:**

```
Retry 1: _____ms
Retry 2: _____ms
Retry 3: _____ms
Jitter observed: Yes/No
```

**Result:**

- Exponential backoff: ⏳ Working / Not working
- Jitter: ⏳ Working / Not working
- Issues: **\*\***\_\_\_**\*\***

---

## 🧪 Test 3: Adaptive Polling - Activity

**Status:** ⏳ Pending / ✅ Pass / ❌ Fail

**Steps Udført:**

- [ ] Åbn CalendarTab
- [ ] Observer Network tab
- [ ] Interager med siden
- [ ] Stop interaktion, vent 2 min
- [ ] Observer interval changes

**Observations:**

```
Active interval: _____s (forventet: 30s)
After 1min inactive: _____s
After 2min inactive: _____s (forventet: ~90s+)
```

**Result:**

- Activity detection: ⏳ Working / Not working
- Interval adjustment: ⏳ Working / Not working
- Issues: **\*\***\_\_\_**\*\***

---

## 🧪 Test 4: Adaptive Polling - Page Visibility

**Status:** ⏳ Pending / ✅ Pass / ❌ Fail

**Steps Udført:**

- [ ] Åbn tab med polling
- [ ] Observer Network tab
- [ ] Skift til anden tab (2 min)
- [ ] Skift tilbage
- [ ] Observer polling resume

**Observations:**

```
Tab hidden: _____ API calls (forventet: 0)
Tab visible again: Immediate call? Yes/No
Polling resumed: Yes/No
```

**Result:**

- Page visibility pausing: ⏳ Working / Not working
- Auto-resume: ⏳ Working / Not working
- Issues: **\*\***\_\_\_**\*\***

---

## 🧪 Test 5: Request Queue ved Rate Limit

**Status:** ⏳ Pending / ✅ Pass / ❌ Fail

**Steps Udført:**

- [ ] Trigger rate limit (hvis muligt)
- [ ] Prøv flere API calls
- [ ] Observer console logs
- [ ] Vent til retry-after
- [ ] Verificer queue processing

**Observations:**

```
Rate limit triggered: Yes/No
Queue size: _____
Console logs: _______________
Queue processed: Yes/No
```

**Result:**

- Request queue: ⏳ Working / Not working
- Auto-processing: ⏳ Working / Not working
- Issues: **\*\***\_\_\_**\*\***

---

## 🧪 Test 6: Rate Limit Error Handling

**Status:** ⏳ Pending / ✅ Pass / ❌ Fail

**Steps Udført:**

- [ ] Observer UI ved rate limit
- [ ] Check countdown timer
- [ ] Verificer polling pause
- [ ] Check retry-after timestamp

**Observations:**

```
UI Error shown: Yes/No
Countdown visible: Yes/No
Countdown time: _____
Polling paused: Yes/No
Retry-after timestamp: _______________
```

**Result:**

- Error UI: ⏳ Working / Not working
- Countdown timer: ⏳ Working / Not working
- Polling pause: ⏳ Working / Not working
- Issues: **\*\***\_\_\_**\*\***

---

## 🧪 Test 7: Overall API Call Reduction

**Status:** ⏳ Pending / ✅ Pass / ❌ Fail

**Steps Udført:**

- [ ] Åbn alle tabs (Email, Calendar, Invoices)
- [ ] Observer Network tab i 10 minutter
- [ ] Tæl total API calls
- [ ] Kategoriser (aktiv vs inaktiv)

**Observations:**

```
Test Duration: _____ minutter

Aktiv Brug (10min):
- EmailTab calls: _____
- CalendarTab calls: _____
- InvoicesTab calls: _____
- Total: _____ (forventet: ~15-17)

Inaktiv Brug (10min):
- Total: _____ (forventet: ~7-10)

Tab Hidden:
- Total: _____ (forventet: ~0)
```

**Result:**

- Active reduction: **\_**% (target: 30-40%)
- Inactive reduction: **\_**% (target: 60-70%)
- Overall: ⏳ Success / Needs improvement
- Issues: **\*\***\_\_\_**\*\***

---

## 📊 Metrics Collected

```
API Calls (10min aktiv): _______
API Calls (10min inaktiv): _______
Cache Hit Rate: _______%
Rate Limit Errors: _______
Average Polling (aktiv): _______s
Average Polling (inaktiv): _______s
DOM Nodes (50 emails): _______ (for virtual scrolling)
Scroll Performance: _______ (subjektiv: Smooth/Slow)
```

---

## 🐛 Issues Found

### Issue #1

**Description:** **\*\***\_\_\_**\*\***
**Severity:** High / Medium / Low
**Steps to Reproduce:** **\*\***\_\_\_**\*\***
**Expected:** **\*\***\_\_\_**\*\***
**Actual:** **\*\***\_\_\_**\*\***

### Issue #2

**Description:** **\*\***\_\_\_**\*\***
**Severity:** High / Medium / Low
**Steps to Reproduce:** **\*\***\_\_\_**\*\***
**Expected:** **\*\***\_\_\_**\*\***
**Actual:** **\*\***\_\_\_**\*\***

---

## ✅ Overall Test Result

**Status:** ⏳ In Progress / ✅ Pass / ❌ Fail / ⚠️ Partial

**Summary:**

```
[Kort sammenfatning af test resultater]
```

**Recommendations:**

1. ***
2. ***
3. ***

---

**Test Completed:** **\*\***\_\_\_**\*\***
**Next Steps:** **\*\***\_\_\_**\*\***
