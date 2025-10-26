# 🎯 RenOS Work Plan - 7. Oktober 2025

**Status:** 85% Production Ready  
**Blocker:** 252 TypeScript Errors (Time Tracking Schema Mismatch)  
**Mål:** 100% Deployment Ready inden EOD

---

## 📊 Nuværende Status

### ✅ Hvad Fungerer
- **Git:** Clean working tree, 1 commit ahead of origin
- **Frontend:** Build success, modern glassmorphism design
- **Architecture:** Solid monorepo struktur med 214 React filer
- **Documentation:** 60+ comprehensive markdown filer
- **CLI Tools:** 50+ scripts til automation

### ❌ Hvad Er Blokeret
- **Backend:** Dev server crashed (Exit Code 1)
- **TypeScript:** 252 compilation errors i `timeTrackingService.ts`
- **Database:** Prisma schema mangler Time Tracking felter
- **Deployment:** Kan ikke deploye før TypeScript errors er løst

---

## 🔧 Action Plan (8 Todos)

### **FASE 1: Database Schema Fix** (Kritisk)

#### Todo 1: Update Prisma Schema
**Fil:** `prisma/schema.prisma`

**Tilføj til Booking model:**
```prisma
model Booking {
  // ... existing fields ...
  
  // Time Tracking Fields (NEW)
  timerStatus      String?    // "idle" | "running" | "paused" | "completed"
  actualStartTime  DateTime?
  actualEndTime    DateTime?
  actualDuration   Int?       // Minutter
  timeVariance     Int?       // Forskel fra estimat (minutter)
  efficiencyScore  Float?     // 0.0 - 1.0
  
  // Relation
  breaks           Break[]
}
```

**Tilføj Break model:**
```prisma
model Break {
  id         String   @id @default(cuid())
  createdAt  DateTime @default(now())
  startTime  DateTime
  endTime    DateTime?
  duration   Int?     // Minutter
  reason     String?
  
  // Relations
  bookingId  String
  booking    Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  
  @@index([bookingId])
}
```

#### Todo 2: Run Database Migration
```powershell
# Push schema til Neon database
npm run db:push

# Generer Prisma client
npm run db:generate
```

**Forventet Output:**
```
✔ Schema pushed to database
✔ Prisma Client generated
```

---

### **FASE 2: Verify Fix** (Testing)

#### Todo 3: Fix TypeScript Errors
```powershell
# Verificer compilation
npm run build
```

**Forventet:** 0 errors (fra 252)

#### Todo 4: Restart Dev Server
```powershell
npm run dev
```

**Forventet:** 
```
🚀 Server running on http://localhost:3000
✅ Database connected
```

---

### **FASE 3: Frontend Updates** (Design Consistency)

#### Todo 5: Update Duplicate Component Pages

**Reference:** `DUPLICATE_FILES_ANALYSIS.md`

**Filer at opdatere** (samme design som Dashboard):
1. `client/src/pages/Analytics/Analytics.tsx`
2. `client/src/pages/Quotes/Quotes.tsx`
3. `client/src/pages/Settings/Settings.tsx`
4. `client/src/pages/Bookings/Bookings.tsx`
5. `client/src/pages/Services/Services.tsx`

**Design Pattern:**
```tsx
// Modern header
<h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
  [Page Title]
</h1>

// Primary button
<button className="btn-primary">
  <Icon className="h-4 w-4" />
  [Action]
</button>

// Muted text
<p className="text-muted">Description text</p>
```

---

### **FASE 4: Quality Assurance** (Testing & Deploy)

#### Todo 6: Run Full Test Suite
```powershell
# Backend + Frontend tests
npm test

# Frontend-specific
npm run lint:client
```

#### Todo 7: Git Push
```powershell
# Push pending commit
git push origin main
```

**Commit:** `58fcce2 - fix: Update CORRECT Dashboard file`

#### Todo 8: Verify Production
**Monitor:**
- Backend: <https://tekup-renos.onrender.com>
- Frontend: <https://tekup-renos-1.onrender.com>

**Check:**
- ✅ Build logs (no errors)
- ✅ Health endpoint: `/api/health`
- ✅ Frontend loads correctly
- ✅ API integration works

---

## 📈 Success Criteria

| Kriterie | Nuværende | Mål |
|----------|-----------|-----|
| TypeScript Errors | 252 | 0 |
| Dev Server Status | Crashed | Running |
| Build Success | Backend ❌ | All ✅ |
| Test Pass Rate | Unknown | 100% |
| Production Deploy | Blocked | Live |

---

## 🚨 Risk Assessment

### High Risk
- ⚠️ **Schema migration** kan fejle hvis Neon DB har data konflikter
- ⚠️ **Breaking changes** i Booking model kan påvirke eksisterende features

### Mitigation
- ✅ Alle nye felter er `optional` (nullable)
- ✅ Cascade delete på Break model
- ✅ Backup i Git (kan revert)

### Low Risk
- Frontend updates (isolated changes)
- Git push (clean working tree)

---

## 📝 Notes

### Time Tracking Feature
Funktionaliteten er **allerede implementeret** i kode:
- `src/services/timeTrackingService.ts` (complete)
- `src/api/timeTrackingRoutes.ts` (API endpoints)
- UI komponenter eksisterer

**Problem:** Database schema blev ikke opdateret samtidig.

### Duplicate Files
**Router bruger:**
- `pages/Dashboard/Dashboard.tsx` ✅ (fixed)
- `pages/Analytics/Analytics.tsx` (needs update)
- `pages/Quotes/Quotes.tsx` (needs update)
- `pages/Settings/Settings.tsx` (needs update)

**Ignored by router:**
- `components/Dashboard.tsx` (old file)
- `components/Analytics.tsx` (old file)
- `components/Quotes.tsx` (old file)

**Action:** Delete old component files efter verification.

---

## 🎯 Timeline Estimate

| Fase | Tasks | Estimate | Priority |
|------|-------|----------|----------|
| **Fase 1** | Schema fix + migration | 15 min | 🔴 Kritisk |
| **Fase 2** | Verify & test | 10 min | 🔴 Kritisk |
| **Fase 3** | Frontend updates | 30 min | 🟡 Medium |
| **Fase 4** | Deploy & verify | 20 min | 🟢 Low |
| **Total** | 8 todos | **~75 min** | |

---

## 📚 Reference Documentation

### Key Files
- `prisma/schema.prisma` - Database schema
- `src/services/timeTrackingService.ts` - Time tracking logic (252 errors)
- `client/src/pages/Dashboard/Dashboard.tsx` - Modern design reference
- `DUPLICATE_FILES_ANALYSIS.md` - Duplicate components analysis

### Important Scripts
```json
{
  "db:push": "npx prisma db push",
  "db:generate": "npx prisma generate",
  "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
  "build": "tsc -p tsconfig.json",
  "test": "vitest run"
}
```

### Environment Variables
```ini
RUN_MODE=dry-run                    # Safety first
DATABASE_URL=postgresql://...       # Neon database
GEMINI_KEY=...                      # AI features
GOOGLE_IMPERSONATED_USER=info@...   # Gmail/Calendar
```

---

## ✅ Ready to Execute

**Start med Todo 1:** Fix Prisma Schema

Alle kommandoer og eksempler er klar. Lad os køre! 🚀
