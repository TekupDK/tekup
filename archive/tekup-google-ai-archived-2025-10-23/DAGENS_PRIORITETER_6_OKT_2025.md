# 🎯 DAGENS PRIORITETER - 6. Oktober 2025

**TL;DR:** Fix kritiske email bugs → QA Sprint 1 → Forbered Sprint 2

---

## 🚨 KRITISK (Gør først - 2-4 timer)

### 1. Email Sikkerhedsproblemer (P0)
**Fil:** `src/services/followUpService.ts` + `escalationService.ts`

**Quick Fix:**
```bash
# Disable følgende services indtil de er sikret:
# 1. Follow-up auto-send
# 2. Escalation auto-send
```

**Tid:** 1 time

---

### 2. Email Gateway Implementation (P0)
**Fil:** `src/services/emailGateway.ts` (NY)

**Purpose:** Central kontrol over ALLE udgående emails

**Tid:** 2-3 timer

---

### 3. Email Quality Validation (P0)
**Fil:** `src/services/emailResponseGenerator.ts`

**Fix:**
- ❌ Ingen midnatstider (kun 08:00-17:00)
- ❌ Ingen [Ukendt] placeholders
- ❌ Max 30kr/m² pris

**Tid:** 1-2 timer

---

## 🟡 VIGTIGE (Gør derefter - 2-3 timer)

### 4. Sprint 1 QA Testing
**Tid:** 1 time

```bash
npm run plan:test
npm test -- cleaningPlanRoutes
cd client && npm test -- CleaningPlanBuilder
```

---

### 5. Sprint 2 Database Schema
**Tid:** 1-2 timer

Finalize schema design for Time Tracking feature.

---

## 🟢 NICE TO HAVE (Hvis tid - 1-2 timer)

### 6. Dokumentation Update
- README.md update
- Sprint 1 final docs

### 7. Performance Review
- Check Redis cache hit rate
- Review API response times

---

## ✅ SUCCESS FOR I DAG

**MUST HAVE:**
- ✅ Alle email bugs fixed/disabled
- ✅ Email gateway implementeret
- ✅ Sprint 1 QA done

**SHOULD HAVE:**
- ✅ Sprint 2 schema klar
- ✅ Docs updated

---

## 📞 DECISIONS NEEDED FROM JONAS

1. **Sprint 2 start:** I morgen eller senere?
2. **Render upgrade:** Ja ($7/md) eller vent?
3. **Email strategy:** Re-enable eller hybrid?

---

## 🗓️ TIDSSKEMA (Forslag)

```
08:00-09:00  ☕ Morning review af repo
09:00-10:00  🔴 Fix followUpService
10:00-11:00  🔴 Fix escalationService  
11:00-12:00  🔴 Implement emailGateway
12:00-13:00  🍽️ Lunch
13:00-15:00  🔴 Email quality validation
15:00-16:00  🟡 Sprint 1 QA testing
16:00-17:00  🟡 Sprint 2 schema design
17:00-18:00  🟢 Documentation & wrap-up
```

---

## 📋 QUICK COMMANDS

```bash
# Start udvikling
npm run dev:all

# Run tests
npm run plan:test
npm test

# Check status
git status
git log --oneline -10

# API health
curl http://localhost:3000/api/health
```

---

**HUSK:**
- 🚨 Security først
- 📝 Commit ofte
- ✅ Test grundigt
- 💬 Hold Jonas opdateret

**Status:** 🔥 READY TO GO!
