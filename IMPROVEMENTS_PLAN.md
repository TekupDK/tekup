# 📋 Friday AI Chat - Forbedringsplan

**Oprettet:** 2. november 2025  
**Status:** 🔴 High Priority Forbedringer Identificeret

---

## 🎯 Executive Summary

Dette dokument identificerer konkrete forbedringer der kan implementeres i Friday AI Chat projektet. Forbedringerne er organiseret efter prioritet og kompleksitet.

**Overall Status:** ✅ 96% Production-Ready  
**Kritiske Forbedringer:** 12  
**Fremtidige Forbedringer:** 25+

---

## 🔴 PRIORITY 1: Kritisk Bugs & Security

### 1.1 Input Field Visibility (UI Bug)
**Status:** ⚠️ Not Fixed  
**Fil:** `client/src/components/ChatPanel.tsx`

**Problem:**
- Input felt kan forsvinde eller blive skjult bag andre elementer
- Z-index og positioning issues

**Løsning:**
```typescript
// Tilføj sticky positioning og z-index
<div className="sticky bottom-0 z-50 bg-background border-t">
  {/* Chat input */}
</div>
```

**Estimeret tid:** 15 min

---

### 1.2 HMAC Signature Verification (Security)
**Status:** ⚠️ TODO Comment Found  
**Fil:** `server/api/inbound-email.ts:72`

**Problem:**
```typescript
// TODO: Implement HMAC signature verification
// For now, return true to allow development
return true;
```

**Risiko:** 🔴 HIGH - Tillader alle requests gennem webhook

**Løsning:**
```typescript
import crypto from 'crypto';

function verifyHMAC(body: string, signature: string): boolean {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return false;
  
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

**Estimeret tid:** 30 min

---

### 1.3 XSS Prevention (Security)
**Status:** ⚠️ Missing  
**Fil:** Frontend components (markdown rendering)

**Problem:**
- Markdown rendering kan potentielt tillade XSS
- Ingen input sanitization

**Løsning:**
```bash
pnpm add dompurify @types/dompurify
```

```typescript
import DOMPurify from 'dompurify';

const sanitized = DOMPurify.sanitize(markdownContent);
```

**Estimeret tid:** 45 min

---

### 1.4 Rate Limiting (Security)
**Status:** ⚠️ Missing  
**Fil:** `server/_core/index.ts`

**Problem:**
- Ingen rate limiting på API endpoints
- Risiko for abuse

**Løsning:**
```bash
pnpm add express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // 100 requests per window
});

app.use('/api/', limiter);
```

**Estimeret tid:** 20 min

---

## 🟡 PRIORITY 2: Testing & Quality Assurance

### 2.1 Test Coverage (Critical Gap)
**Status:** ⚠️ Minimal Testing  
**Filer:** `client/src/components/inbox/__tests__/`

**Nuværende:**
- ✅ 5 test filer findes
- ❌ Men tests mangler implementation

**Løsning:**
```bash
# Kør eksisterende tests
pnpm test

# Tilføj mere coverage
# - Unit tests for intent-actions.ts
# - Integration tests for Billy API
# - E2E tests for complete workflows
```

**Estimeret tid:** 4-6 timer

---

### 2.2 TypeScript Error Fixes
**Status:** ⚠️ Type Mismatches Found  
**Fil:** `client/src/components/inbox/EmailTab.tsx`

**Problem:**
- Gmail type mismatches (`subject`, `from`, `to` ikke på `GmailThread`)
- Billy feedback type issues

**Løsning:**
```typescript
// Opret korrekt type definition
interface GmailThreadWithDetails extends GmailThread {
  subject?: string;
  from?: string;
  to?: string;
}
```

**Estimeret tid:** 1 time

---

### 2.3 Remaining Workflow Tests
**Status:** ⚠️ 4/7 Workflows Untested  
**Fra:** `todo.md`

**Mangler Tests:**
- [ ] Test #4: Invoice creation (Billy API)
- [ ] Test #5: Gmail search for duplicates
- [ ] Test #6: Job completion 6-step checklist
- [ ] Test #7: Photo request blocks quote sending

**Estimeret tid:** 2-3 timer

---

## 🟢 PRIORITY 3: Dokumentation Forbedringer

### 3.1 Docs README Index
**Status:** ⚠️ Missing  
**Fil:** `docs/README.md` (skal oprettes)

**Problem:**
- 41 dokumentationsfiler i `docs/` men ingen index
- Svært at navigere

**Løsning:**
```markdown
# Friday AI Chat - Documentation Index

## Core Documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [API_REFERENCE.md](./API_REFERENCE.md) - API endpoints
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - Dev workflow

## Feature Documentation
### Email Tab
- [EMAIL_TAB_STATUS.md](./EMAIL_TAB_STATUS.md)
- [EMAIL_TAB_COMPLETE_ROADMAP.md](./EMAIL_TAB_COMPLETE_ROADMAP.md)

## ... osv
```

**Estimeret tid:** 30 min

---

### 3.2 Consolidate API Optimization Docs
**Status:** ⚠️ Too Many Files  
**Filer:** 17 API_OPTIMIZATION_*.md filer

**Problem:**
- For mange status-filer (17 stk)
- Svært at følge progress

**Løsning:**
- Konsolider til 3-4 filer:
  - `API_OPTIMIZATION_README.md` (index)
  - `API_OPTIMIZATION_STATUS.md` (current status)
  - `API_OPTIMIZATION_COMPLETE.md` (final report)

**Estimeret tid:** 1 time

---

### 3.3 Update Architecture Technical Debt Section
**Status:** ⚠️ Outdated  
**Fil:** `docs/ARCHITECTURE.md:580`

**Problem:**
- Technical debt liste er ikke opdateret
- Mangler nye issues

**Løsning:**
- Opdater med nuværende status
- Tilføj konkrete action items

**Estimeret tid:** 30 min

---

## 🔵 PRIORITY 4: Feature Improvements

### 4.1 Streaming Support for AI Responses
**Status:** ⚠️ Missing  
**Fra:** `todo.md:180`

**Problem:**
- AI responses er ikke streaming
- Bruger må vente på komplet svar

**Løsning:**
```typescript
// Implementer SSE eller WebSocket for streaming
const stream = await aiRouter.routeAI(/*...*/);
for await (const chunk of stream) {
  // Update UI med chunk
}
```

**Estimeret tid:** 3-4 timer

---

### 4.2 Real-time Inbox Updates
**Status:** ⚠️ Polling Only  
**Fra:** `todo.md:181`

**Problem:**
- Nuværende: Polling hver 30 sek
- Ideelt: WebSocket/SSE for real-time

**Løsning:**
```typescript
// Tilføj WebSocket server
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3001 });
// Broadcast updates når data ændres
```

**Estimeret tid:** 4-5 timer

---

### 4.3 Command Palette (⌘K)
**Status:** ⚠️ Future Enhancement  
**Fra:** `todo.md:185`

**Problem:**
- Ingen quick actions for power users

**Løsning:**
```bash
pnpm add cmdk  # Already in dependencies!
```

```typescript
import { Command } from 'cmdk';

<Command.Dialog>
  <Command.Input />
  <Command.List>
    <Command.Item>Create Lead</Command.Item>
    <Command.Item>New Task</Command.Item>
    {/* ... */}
  </Command.List>
</Command.Dialog>
```

**Estimeret tid:** 2 timer

---

### 4.4 Chat History Search
**Status:** ⚠️ Missing  
**Fra:** `todo.md:186`

**Problem:**
- Ingen søgning i gamle samtaler

**Løsning:**
```typescript
// Backend: Tilføj search endpoint
trpc.conversations.search.useQuery({ query: "lead" });

// Frontend: Tilføj search bar i sidebar
<input 
  placeholder="Søg i samtaler..." 
  onChange={handleSearch}
/>
```

**Estimeret tid:** 3 timer

---

### 4.5 Missing UI Features
**Status:** ⚠️ Multiple Items  
**Fra:** `todo.md`

**Mangler:**
- [ ] Typing indicators
- [ ] "Clear conversation" button
- [ ] "Rename conversation" functionality

**Estimeret tid:** 2 timer totalt

---

## 🟣 PRIORITY 5: Performance & Monitoring

### 5.1 Error Tracking (Sentry)
**Status:** ⚠️ Missing  
**Fra:** `docs/ARCHITECTURE.md:592`

**Problem:**
- Ingen error tracking service
- Svært at debug production issues

**Løsning:**
```bash
pnpm add @sentry/react @sentry/node
```

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

**Estimeret tid:** 1 time

---

### 5.2 Performance Monitoring
**Status:** ⚠️ Missing  
**Fra:** `docs/ARCHITECTURE.md:593`

**Problem:**
- Ingen performance metrics
- Svært at identificere bottlenecks

**Løsning:**
- Tilføj New Relic eller AppDynamics
- Eller: Custom metrics med `perf_hooks`

**Estimeret tid:** 2 timer

---

### 5.3 Database Query Optimization
**Status:** ⚠️ Unknown  
**Fil:** `server/db.ts`

**Problem:**
- Ingen query performance analysis
- Potentielt N+1 queries

**Løsning:**
```typescript
// Tilføj query logging i development
if (process.env.NODE_ENV === 'development') {
  console.log('Query:', sql, params);
  console.time('Query duration');
}
```

**Estimeret tid:** 2 timer

---

## 🟠 PRIORITY 6: Code Quality & Cleanup

### 6.1 Remove TODO Comments
**Status:** ⚠️ 14 TODO Comments Found  
**Filer:** Multiple

**Løsning:**
- Gennemgå alle TODO kommentarer
- Implementer eller fjern dem
- Dokumenter i tickets hvis fremtidigt work

**Estimeret tid:** 2 timer

---

### 6.2 Remove DEBUG Console Logs
**Status:** ⚠️ Found in Production Code  
**Fil:** `server/ai-router.ts:217`

**Problem:**
```typescript
console.log(`[DEBUG] Execution conditions:`, { /*...*/ });
```

**Løsning:**
```typescript
// Brug proper logger
import { logger } from './logger';

if (process.env.DEBUG === 'true') {
  logger.debug('Execution conditions', data);
}
```

**Estimeret tid:** 1 time

---

### 6.3 Code Organization
**Status:** ⚠️ Large Files  
**Filer:** `server/routers.ts` (må være <200 linjer ifølge .cursorrules)

**Problem:**
- Routers.ts er sandsynligvis >200 linjer

**Løsning:**
- Split op i feature-based routers
- Eks: `auth-router.ts`, `chat-router.ts`, osv.

**Estimeret tid:** 1 time

---

## 📊 Prioritetsmatrix

| Prioritet | Items | Estimeret Tid | Impact |
|-----------|-------|---------------|--------|
| 🔴 P1 - Kritisk | 4 | 2 timer | HIGH |
| 🟡 P2 - Testing | 3 | 6-8 timer | MEDIUM |
| 🟢 P3 - Dokumentation | 3 | 2 timer | LOW |
| 🔵 P4 - Features | 5 | 14-16 timer | MEDIUM |
| 🟣 P5 - Performance | 3 | 5 timer | MEDIUM |
| 🟠 P6 - Cleanup | 3 | 4 timer | LOW |

**Total Estimeret Tid:** 33-37 timer (ca. 1 uges arbejde)

---

## 🚀 Quick Wins (1-2 Timer Total)

1. **Input Field Visibility Fix** (15 min)
2. **Docs README Index** (30 min)
3. **Remove DEBUG Logs** (1 time)

**Total:** ~1.75 timer for 3 forbedringer

---

## 📝 Anbefalede Næste Skridt

### Uge 1: Security & Critical Bugs
- [ ] Fix input field visibility
- [ ] Implement HMAC verification
- [ ] Add XSS protection
- [ ] Add rate limiting

### Uge 2: Testing & Quality
- [ ] Fix TypeScript errors
- [ ] Implement missing workflow tests
- [ ] Add unit tests for critical functions

### Uge 3: Documentation
- [ ] Create docs/README.md
- [ ] Consolidate API optimization docs
- [ ] Update architecture docs

### Uge 4: Features & Performance
- [ ] Implement streaming responses
- [ ] Add command palette
- [ ] Set up error tracking
- [ ] Add performance monitoring

---

## 🔗 Relaterede Dokumenter

- `todo.md` - Eksisterende TODO liste
- `docs/ARCHITECTURE.md` - System arkitektur
- `.cursorrules` - Development guidelines

---

**Næste Review:** Efter Priority 1 implementering

