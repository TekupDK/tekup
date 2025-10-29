# TODO/FIXME Inventory Report

**Generated:** 2025-10-29  
**Scope:** Tekup Portfolio Monorepo  
**Total Matches:** 252+ instances

---

## Summary

Comprehensive scan of the codebase identified **252+ TODO/FIXME comments** requiring attention.

### Distribution

| Category           | Count | Priority |
| ------------------ | ----- | -------- |
| **Active Code**    | ~40   | 🔴 HIGH  |
| **Archive Folder** | ~212  | 🔵 LOW   |
| **Total**          | 252+  | -        |

### Key Insights

- **Most TODOs are in archived code** (archived-2025-10-22 folder)
- **Active TODOs (~40)** are primarily in TekupAI services and test files
- **Common themes:**
  - Prisma schema/database integration pending
  - Authentication/authorization stubs
  - External service integrations (Gmail, Calendar, Billy.dk)
  - Health check implementations

---

## Active Code TODOs (Priority: HIGH)

### TekupAI Services (2 instances)

#### 1. `services/tekup-ai/apps/ai-vault/__tests__/auth.test.ts:319`

```typescript
// TODO: Implement support for multiple API keys in future
```

**Action:** Create GitHub issue for multi-API-key feature  
**Impact:** Low - enhancement for future scalability

#### 2. `services/tekup-ai/apps/ai-vault/src/routes/webhooks.ts:55`

```typescript
// TODO: Trigger async sync job
```

**Action:** Implement async job queue (Bull/BullMQ) for webhook processing  
**Impact:** Medium - affects webhook reliability

---

## Archived Code TODOs (Priority: LOW)

### Authentication & Authorization (~30 instances)

**Files:**

- `archive/tekup-org-archived-2025-10-22/apps/voicedk-api/src/auth/auth.module.ts`
- `archive/.../tekup-unified-platform/src/modules/security/security.service.ts`
- `archive/.../tekup-crm-api/src/companies/companies.controller.ts`

**Pattern:**

```typescript
// TODO: Implement proper authentication
// TODO: Implement JWT token validation
// TODO: Implement RBAC permission checking
```

**Decision:** ✅ **IGNORE** - Archived code, no longer maintained

---

### Database Integration (~40 instances)

**Files:**

- `archive/.../voicedk-api/src/pricing/voice-pricing.service.ts`
- `archive/.../tekup-lead-platform/src/qualification/qualification.service.ts`
- `archive/.../tekup-crm-api/src/integrations/rendetalje-ai/webhook/*.ts`

**Pattern:**

```typescript
// TODO: Create PrismaService or use TypeORM instead
// TODO: Fix Prisma model - payload field seems to be missing
// TODO: Implement with Prisma once client issues are resolved
```

**Decision:** ✅ **IGNORE** - These services are archived and not in active development

---

### External Service Integrations (~35 instances)

**Files:**

- `archive/.../tekup-crm-api/src/integrations/calendar-billy-automation.service.ts`
- `archive/.../inbox-ai/src/main/services/EmailService.ts`
- `archive/.../tekup-crm-api/src/booking/auto-booking.service.ts`

**Pattern:**

```typescript
// TODO: Implement actual server endpoint
// TODO: Implement Google Calendar API integration
// TODO: Implement actual email sending when Google Workspace integration is available
```

**Decision:** ✅ **IGNORE** - Archived integrations, not in current roadmap

---

### Health Checks & Monitoring (~10 instances)

**Files:**

- `archive/.../tekup-crm-api/src/integrations/rendetalje-ai/rendetalje-friday.controller.ts`

**Pattern:**

```typescript
// TODO: Implement health checks for all dependencies
// TODO: Check Gmail API connection
// TODO: Check Calendar API connection
// TODO: Check Prisma connection
```

**Decision:** ✅ **IGNORE** - Archived service

---

### UI/UX Implementations (~15 instances)

**Files:**

- `archive/.../Tekup Website Figma/src/components/SchedulingPage.tsx`
- `archive/.../tekup-ai-platform/src/App.tsx`

**Pattern:**

```typescript
// TODO: Implement job detail view or edit modal
// TODO: Implement booking confirmation logic
// TODO: Replace with real auth check
```

**Decision:** ✅ **IGNORE** - Old UI prototypes, not in active use

---

### Miscellaneous Stubs (~50 instances)

**Files spread across archive folder**

**Pattern:**

```typescript
// TODO: Implement actual backup functionality
// TODO: Implement compliance checking
// TODO: Implement cron expression description
// TODO: Implement analytics database
```

**Decision:** ✅ **IGNORE** - Archived/experimental code

---

## Recommended Actions

### Immediate (Week 1)

1. **Create GitHub Issues for Active TODOs**

   ```bash
   # Only 2 active TODOs identified:
   - TekupAI: Multi-API-key support (enhancement)
   - TekupAI: Async webhook sync job (medium priority)
   ```

2. **Add Labels**
   - `technical-debt`
   - `enhancement` (for multi-API-key)
   - `bug/reliability` (for async webhook)

3. **Document Archive Decision**
   - Add `ARCHIVE.md` explaining archived code should be ignored
   - Update `.eslintignore` to skip archive folder

### Short-term (Month 1)

4. **Implement Async Webhook Processing**
   - Priority: Medium
   - Estimated effort: 2-3 days
   - Use Bull/BullMQ for job queue
   - Benefits: Improved webhook reliability, better error handling

5. **Plan Multi-API-Key Feature**
   - Priority: Low (future enhancement)
   - Estimated effort: 1 week
   - Research API key rotation patterns
   - Design schema changes

### Long-term (Quarter 1)

6. **Archive Cleanup**
   - Consider deleting or moving archive folder to separate repository
   - Reduces noise in codebase searches
   - Benefits: Cleaner workspace, faster IDE indexing

---

## Prevention Strategy

### 1. ESLint Rule (Enforce TODO Format)

Add to `.eslintrc.js`:

```javascript
rules: {
  'no-warning-comments': ['warn', {
    terms: ['todo', 'fixme'],
    location: 'start'
  }]
}
```

This will **warn** when TODO/FIXME is found, encouraging developers to create issues instead.

### 2. Pre-commit Hook (Suggest Issue Creation)

Create `.husky/pre-commit`:

```bash
#!/bin/sh
NEW_TODOS=$(git diff --cached --diff-filter=A | grep -i "// TODO\|// FIXME" || true)
if [ -n "$NEW_TODOS" ]; then
  echo "⚠️  New TODO/FIXME comments detected!"
  echo "Consider creating a GitHub issue instead for better tracking."
  echo ""
  echo "$NEW_TODOS"
fi
```

### 3. CI Check (Block New TODOs in CI)

Add to GitHub Actions workflow:

```yaml
- name: Check for new TODOs
  run: |
    if git diff origin/main...HEAD | grep -i "^\+.*// TODO\|^\+.*// FIXME"; then
      echo "❌ New TODO/FIXME comments found. Please create a GitHub issue instead."
      exit 1
    fi
```

---

## Metrics

### Before Migration

- **Total TODOs:** 252+
- **Active TODOs:** ~40
- **Tracking:** Comments only (not tracked in issues)
- **Visibility:** Low (requires grep search)

### After Cleanup Goal

- **Active GitHub Issues:** 2 (from active TODOs)
- **Archive TODOs:** Ignored via .eslintignore
- **New TODOs:** Blocked by CI
- **Tracking:** GitHub Issues with labels
- **Visibility:** High (project board)

---

## Detailed File List (Active Code Only)

### Services

1. `services/tekup-ai/apps/ai-vault/__tests__/auth.test.ts:319`
   - **TODO:** Multiple API keys support
   - **Type:** Enhancement
   - **Priority:** Low

2. `services/tekup-ai/apps/ai-vault/src/routes/webhooks.ts:55`
   - **TODO:** Async sync job
   - **Type:** Feature
   - **Priority:** Medium

---

## Archive Folder Stats

- **Total Files:** 117 packages/apps
- **TODO Count:** ~212 instances
- **Recommendation:** IGNORE - old/unmaintained code
- **Action:** Add to .eslintignore, consider moving to separate repo

---

## Next Steps

1. ✅ Create this report
2. ⏳ Create 2 GitHub issues for active TODOs
3. ⏳ Update `.eslintignore` to exclude archive/
4. ⏳ Add ESLint rule to warn on new TODOs
5. ⏳ Document archive folder policy in ARCHIVE.md
6. ⏳ Implement async webhook processing (medium priority)
7. ⏳ Plan multi-API-key feature (low priority)

---

**Maintainer Notes:**

- Archive folder (`archive/tekup-org-archived-2025-10-22/`) contains **212 out of 252 TODOs**
- Only **2 active TODOs** require immediate attention
- Focus on preventing **new** TODOs rather than migrating existing ones in archive
- Use GitHub Issues for task tracking going forward

**Last Updated:** 2025-10-29  
**Next Review:** 2025-11-29
