# Tekup Workspace - Prioritized Action Items

**Generated:** 22. Oktober 2025, kl. 05:15 CET  
**Total Items:** 45  
**Priority Levels:** Critical (🔴), High (🟠), Medium (🟡), Low (🟢)

---

## QUICK SUMMARY

| Priority | Count | Must Complete By |
|----------|-------|------------------|
| 🔴 **CRITICAL** | 8 | Within 7 days |
| 🟠 **HIGH** | 12 | Within 30 days |
| 🟡 **MEDIUM** | 15 | Within 90 days |
| 🟢 **LOW** | 10 | Backlog |

---

## 🔴 CRITICAL (7 days)

### 1. Create Supabase Tables for RenOS Calendar MCP

**Priority:** 🔴 CRITICAL  
**Effort:** 2 hours  
**Impact:** Unlocks 3/5 tools (60% functionality)

**Action:**
```sql
-- Create customer_intelligence table
CREATE TABLE customer_intelligence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id TEXT NOT NULL UNIQUE,
    preferences JSONB,
    patterns JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create overtime_logs table
CREATE TABLE overtime_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id TEXT NOT NULL,
    customer_id TEXT,
    estimated_duration INTEGER,
    actual_duration INTEGER,
    overtime_minutes INTEGER,
    logged_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_customer_intelligence_customer_id ON customer_intelligence(customer_id);
CREATE INDEX idx_overtime_logs_booking_id ON overtime_logs(booking_id);
CREATE INDEX idx_overtime_logs_customer_id ON overtime_logs(customer_id);
```

**Verification:**

- Test `track_overtime_risk` tool
- Test `get_customer_memory` tool
- Confirm no PGRST205 errors

**Repository:** RenOS Calendar MCP  
**Assignee:** Jonas Abde  
**Status:** 🔴 BLOCKED (2/5 tools not operational)

---

### 2. Deploy RenOS Calendar MCP to Render.com

**Priority:** 🔴 CRITICAL  
**Effort:** 3 hours  
**Impact:** Production-ready calendar intelligence service

**Prerequisites:**

- ✅ Docker Compose complete
- ✅ Port configuration system complete
- ❌ Supabase tables (Item #1)
- ❌ Rate limiting implementation

**Action:**

1. Add rate limiting middleware (express-rate-limit)
2. Create `render.yaml`:

```yaml
services:
  - type: web
    name: renos-calendar-mcp
    env: docker
    dockerfilePath: ./Dockerfile.mcp
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_KEY
        sync: false
      - key: GOOGLE_CALENDAR_CREDENTIALS
        sync: false
```

3. Push to GitHub
4. Create Render service
5. Add environment variables from `.env`
6. Deploy and verify

**Verification:**

- Health check: https://[service].onrender.com/health
- Test all 5 tools via HTTP API
- Monitor logs for errors

**Repository:** RenOS Calendar MCP  
**Assignee:** Jonas Abde  
**Status:** 🟡 READY (blocked by Item #1)

---

### 3. Archive Tekup Google AI Repository

**Priority:** 🔴 CRITICAL  
**Effort:** 1 hour  
**Impact:** Reduce confusion, clarify active projects

**Action:**

1. Verify no missing features vs. RendetaljeOS
2. Rename repo: `Tekup-Google-AI-ARCHIVED-2025-10-22`
3. Add README.md to root:

```markdown
# ⚠️ ARCHIVED - Tekup Google AI

**Archive Date:** 22. Oktober 2025  
**Reason:** Superseded by RendetaljeOS monorepo  
**Replacement:** C:\Users\empir\RendetaljeOS

This repository is no longer maintained. All features have been migrated to RendetaljeOS.
```

4. Commit and push archive notice
5. Remove from active workspace (keep on disk for reference)

**Verification:**

- No active references in other repos
- RendetaljeOS has all features
- Documentation updated

**Repository:** Tekup Google AI  
**Assignee:** Jonas Abde  
**Status:** 🟡 READY

---

### 4. Extract Core Apps from Tekup-org

**Priority:** 🔴 CRITICAL  
**Effort:** 8 hours (spread over 2-3 days)  
**Impact:** Massive complexity reduction (30+ apps → 3-5 repos)

**Action:**

1. **Audit Phase** (2 hours):
   - List all 30+ apps
   - Identify actively developed apps (likely 3-5)
   - Document dependencies

2. **Extract Phase** (4 hours):
   - Create new repos:
     - `tekup-crm` (NestJS API + Next.js Web)
     - `tekup-cloud-services` (if active)
     - `tekup-mcp-servers` (if active)
   - Move code with git history
   - Update imports and dependencies

3. **Clean Phase** (2 hours):
   - Archive Tekup-org
   - Update workspace references
   - Document migration

**Verification:**

- New repos build successfully
- Tests pass
- No broken dependencies

**Repository:** Tekup-org  
**Assignee:** Jonas Abde  
**Status:** 🔴 HIGH COMPLEXITY

---

### 5. Initialize Git for Gmail Projects

**Priority:** 🔴 CRITICAL  
**Effort:** 30 minutes  
**Impact:** Prevent data loss, enable version control

**Action:**

1. **Investigate:**
   ```bash
   cd C:\Users\empir\Gmail-PDF-Auto
   ls -la  # Check contents
   cd C:\Users\empir\Gmail-PDF-Forwarder
   ls -la  # Check contents
   ```

2. **If Active:**
   ```bash
   cd C:\Users\empir\Gmail-PDF-Auto
   git init
   git add .
   git commit -m "Initial commit - Gmail PDF Auto"
   git remote add origin [github-url]
   git push -u origin main
   ```

3. **If Inactive:**
   - Delete folders or move to archive

**Repository:** Gmail-PDF-Auto, Gmail-PDF-Forwarder  
**Assignee:** Jonas Abde  
**Status:** 🟡 INVESTIGATION NEEDED

---

### 6. Commit tekup-cloud-dashboard Changes

**Priority:** 🔴 CRITICAL  
**Effort:** 15 minutes  
**Impact:** Save work, enable deployment

**Action:**
```bash
cd C:\Users\empir\tekup-cloud-dashboard
git add .
git commit -m "feat: update dashboard components and Supabase integration"
git push origin main
```

**Files to Commit:**

- README.md
- package.json
- src/App.tsx
- src/lib/supabase.ts
- src/pages/Dashboard.tsx
- .env.example (create from current .env)
- API_DOCUMENTATION.md (untracked)
- CHANGELOG.md (untracked)

**Repository:** tekup-cloud-dashboard  
**Assignee:** Jonas Abde  
**Status:** 🟡 READY

---

### 7. Organize Tekup-Cloud Documentation

**Priority:** 🔴 CRITICAL  
**Effort:** 1 hour  
**Impact:** Reduce clutter, improve navigation

**Action:**

1. **Create Docs Folder:**
   ```bash
   cd C:\Users\empir\Tekup-Cloud
   mkdir -p docs/reports docs/plans docs/analyses
   ```

2. **Move Files:**
   ```bash
   mv *_REPORT.md docs/reports/
   mv *_PLAN.md docs/plans/
   mv *_ANALYSIS*.md docs/analyses/
   mv STRATEGIC_*.md docs/plans/
   ```

3. **Update .gitignore:**
   ```gitignore
   # Temporary reports
   docs/reports/*_TEMP.md
   docs/reports/*_DRAFT.md
   
   # Kiro/Qoder
   .kiro/
   .qoder/
   ```

4. **Create Index:**
   ```markdown
   # Tekup-Cloud Documentation Index
   
   ## Reports
   - [Portfolio Audit](docs/reports/PORTFOLIO_AUDIT_*.md)
   - [Ecosystem Analysis](docs/reports/TEKUP_COMPLETE_ECOSYSTEM_ANALYSIS_*.md)
   
   ## Plans
   - [Strategic Action Plan](docs/plans/STRATEGIC_ACTION_PLAN_*.md)
   - [Implementation Plan](docs/plans/RENDETALJE_IMPLEMENTATION_PLAN.md)
   ```

5. **Commit:**
   ```bash
   git add .
   git commit -m "docs: organize documentation into folders"
   git push origin main
   ```

**Repository:** Tekup-Cloud  
**Assignee:** Jonas Abde  
**Status:** 🟡 READY

---

### 8. Clarify Tekup-Cloud Backend/Frontend Purpose

**Priority:** 🔴 CRITICAL  
**Effort:** 30 minutes  
**Impact:** Prevent confusion about project structure

**Action:**

1. **Investigate:**
   ```bash
   cd C:\Users\empir\Tekup-Cloud\backend
   cat package.json  # Check if it's a real project or test code
   cd C:\Users\empir\Tekup-Cloud\frontend
   cat package.json  # Check if it's a real project or test code
   ```

2. **Options:**
   - **If Active Projects**: Document purpose in README
   - **If Test Code**: Move to `tests/` or `examples/`
   - **If Superseded**: Delete or archive

3. **Document in README:**
   ```markdown
   # Tekup-Cloud
   
   ## Projects
   - **renos-calendar-mcp/**: RenOS Calendar Intelligence MCP (PRIMARY)
   - **backend/**: [Purpose - to be documented]
   - **frontend/**: [Purpose - to be documented]
   - **shared/**: Shared utilities
   ```

**Repository:** Tekup-Cloud  
**Assignee:** Jonas Abde  
**Status:** 🟡 INVESTIGATION NEEDED

---

## 🟠 HIGH (30 days)

### 9. Deploy RendetaljeOS Backend to Render

**Priority:** 🟠 HIGH  
**Effort:** 4 hours  
**Impact:** Production-ready RenOS backend API

**Action:**

1. Create `render.yaml` in RendetaljeOS/apps/backend/
2. Set up environment variables
3. Configure Prisma migrations
4. Deploy and test

**Repository:** RendetaljeOS  
**Assignee:** Jonas Abde  
**Status:** 🟡 PENDING

---

### 10. Deploy tekup-cloud-dashboard to Vercel

**Priority:** 🟠 HIGH  
**Effort:** 2 hours  
**Impact:** Production-ready dashboard UI

**Action:**

1. Connect GitHub repo to Vercel
2. Configure environment variables
3. Deploy and test

**Repository:** tekup-cloud-dashboard  
**Assignee:** Jonas Abde  
**Status:** 🟡 PENDING (blocked by Item #6)

---

### 11. Consolidate RendetaljeOS Mobile App

**Priority:** 🟠 HIGH  
**Effort:** 3 hours  
**Impact:** Clarify mobile app status

**Action:**

1. **Verify Duplication:**
   ```bash
   diff -r C:\Users\empir\RendetaljeOS\-Mobile C:\Users\empir\Tekup-Cloud\RendetaljeOS-Mobile
   ```

2. **Options:**
   - **If Duplicate**: Delete one copy
   - **If Different**: Document differences, choose canonical location

3. **Document:** Update README to explain mobile app location

**Repository:** RendetaljeOS, Tekup-Cloud  
**Assignee:** Jonas Abde  
**Status:** 🟡 INVESTIGATION NEEDED

---

### 12. Implement RenOS Backend → Billy Integration

**Priority:** 🟠 HIGH  
**Effort:** 3 hours  
**Impact:** Automated invoicing from RenOS

**Action:**

1. Add axios client for Tekup-Billy HTTP API
2. Create invoice service wrapper
3. Add invoice creation to booking flow
4. Test end-to-end

**Repository:** RendetaljeOS Backend  
**Assignee:** Jonas Abde  
**Status:** 🟡 DESIGN PHASE

---

### 13. Implement RenOS Backend → Calendar MCP Integration

**Priority:** 🟠 HIGH  
**Effort:** 3 hours  
**Impact:** AI-powered calendar intelligence in RenOS

**Action:**

1. Add axios client for Calendar MCP HTTP API
2. Create calendar intelligence service
3. Integrate validation into booking flow
4. Test conflict detection

**Repository:** RendetaljeOS Backend  
**Assignee:** Jonas Abde  
**Status:** 🟡 DESIGN PHASE (blocked by Item #2)

---

### 14. Add Rate Limiting to RenOS Calendar MCP

**Priority:** 🟠 HIGH  
**Effort:** 1 hour  
**Impact:** Security before production deployment

**Action:**
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later.'
});

app.use('/api/v1/tools', limiter);
```

**Repository:** RenOS Calendar MCP  
**Assignee:** Jonas Abde  
**Status:** 🟡 READY

---

### 15. Set Up Sentry Error Tracking

**Priority:** 🟠 HIGH  
**Effort:** 2 hours (all services)  
**Impact:** Proactive error monitoring

**Services:**

- Tekup-Billy
- TekupVault (API + Worker)
- RenOS Calendar MCP
- RendetaljeOS Backend

**Action:**

1. Create Sentry project (or use existing)
2. Install `@sentry/node` in each service
3. Initialize in entry point:

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

4. Deploy and verify

**Repository:** All production services  
**Assignee:** Jonas Abde  
**Status:** 🟡 DESIGN PHASE

---

### 16. Enable Billy Integration in RenOS Calendar MCP

**Priority:** 🟠 HIGH  
**Effort:** 2 hours  
**Impact:** Automated invoice creation tool

**Action:**

1. Set `ENABLE_AUTO_INVOICE=true` in config
2. Add `BILLY_MCP_API_KEY` environment variable
3. Test `auto_create_invoice` tool
4. Verify end-to-end flow

**Repository:** RenOS Calendar MCP  
**Assignee:** Jonas Abde  
**Status:** 🟡 PENDING (optional for v1)

---

### 17. Enable Twilio Integration in RenOS Calendar MCP

**Priority:** 🟠 HIGH (optional)  
**Effort:** 2 hours  
**Impact:** Voice alerts for overtime

**Action:**

1. Set `ENABLE_VOICE_ALERTS=true` in config
2. Add Twilio credentials
3. Test voice alert functionality
4. Verify phone call integration

**Repository:** RenOS Calendar MCP  
**Assignee:** Jonas Abde  
**Status:** 🟡 PENDING (optional for v1)

---

### 18. Add Redis to RenOS Calendar MCP

**Priority:** 🟠 HIGH  
**Effort:** 2 hours  
**Impact:** Performance boost via caching

**Action:**

1. Add `ioredis` dependency
2. Create Redis client utility
3. Add caching layer for Supabase queries
4. Configure Redis URL in environment

**Repository:** RenOS Calendar MCP  
**Assignee:** Jonas Abde  
**Status:** 🟡 DESIGN PHASE

---

### 19. Enable Redis for Tekup-Billy (All Deployments)

**Priority:** 🟠 HIGH  
**Effort:** 1 hour  
**Impact:** Horizontal scaling for all users

**Action:**

1. Make Redis required (not optional)
2. Add Redis URL to Render environment variables
3. Update deployment docs
4. Verify scaling behavior

**Repository:** Tekup-Billy  
**Assignee:** Jonas Abde  
**Status:** 🟡 OPTIONAL FEATURE

---

### 20. Build TekupVault Web UI (Phase 4)

**Priority:** 🟠 HIGH  
**Effort:** 8 hours  
**Impact:** User-friendly search interface

**Action:**

1. Create new package: `apps/vault-web`
2. Tech stack: React 18 + Vite + Tailwind
3. Features:
   - Search interface
   - Real-time results
   - Repository browser
   - Sync status dashboard
4. Deploy to Vercel

**Repository:** TekupVault  
**Assignee:** Jonas Abde  
**Status:** 🟡 DESIGN PHASE

---

## 🟡 MEDIUM (90 days)

### 21-25. Documentation Cleanup

**Priority:** 🟡 MEDIUM  
**Effort:** 4 hours total  
**Impact:** Improved navigation, reduced clutter

**Actions:**
21. Delete excessive status/complete files in Tekup Google AI (130+ files)
22. Consolidate TekupVault documentation (17+ markdown files)
23. Consolidate Tekup-Billy documentation (85+ files → organized structure)
24. Create master documentation index in Tekup-Cloud
25. Set up MkDocs or Docusaurus for unified docs

**Repositories:** All  
**Assignee:** Jonas Abde  
**Status:** 🟡 BACKLOG

---

### 26-30. Testing & Quality

**Priority:** 🟡 MEDIUM  
**Effort:** 8 hours total  
**Impact:** Improved reliability

**Actions:**
26. Add integration tests to RenOS Calendar MCP (expand from current)
27. Add E2E tests to RendetaljeOS (Playwright)
28. Add unit tests to TekupVault (increase coverage)
29. Add contract tests to Tekup-Billy (API contracts)
30. Set up CI/CD pipelines (GitHub Actions)

**Repositories:** All production services  
**Assignee:** Jonas Abde  
**Status:** 🟡 BACKLOG

---

### 31-35. Performance Optimization

**Priority:** 🟡 MEDIUM  
**Effort:** 6 hours total  
**Impact:** Faster response times

**Actions:**
31. Add CDN for static assets (Cloudflare)
32. Optimize TekupVault embeddings (batch processing)
33. Add database indexes to RendetaljeOS (Prisma)
34. Implement query caching in all services (Redis)
35. Add response compression (all services)

**Repositories:** All production services  
**Assignee:** Jonas Abde  
**Status:** 🟡 BACKLOG

---

### 36-40. Monitoring & Observability

**Priority:** 🟡 MEDIUM  
**Effort:** 6 hours total  
**Impact:** Better insights

**Actions:**
36. Set up Grafana + Prometheus dashboards
37. Add UptimeRobot monitoring (all production services)
38. Implement log aggregation (Papertrail or Loggly)
39. Add custom metrics to all services (prom-client)
40. Create status page (status.tekup.com)

**Repositories:** All production services  
**Assignee:** Jonas Abde  
**Status:** 🟡 BACKLOG

---

## 🟢 LOW (Backlog)

### 41. Update Agent-Orchestrator

**Priority:** 🟢 LOW  
**Effort:** 2 hours  
**Impact:** Nice-to-have UI

**Action:** Keep as-is, low maintenance mode

**Repository:** Agent-Orchestrator  
**Status:** 🟢 BACKLOG

---

### 42. Archive tekup-gmail-automation (if unused)

**Priority:** 🟢 LOW  
**Effort:** 30 minutes  
**Impact:** Reduced workspace clutter

**Action:** Verify usage, archive if superseded

**Repository:** tekup-gmail-automation  
**Status:** 🟢 INVESTIGATION NEEDED

---

### 43. Migrate to Monorepo (Optional)

**Priority:** 🟢 LOW  
**Effort:** 20 hours  
**Impact:** Unified development experience

**Action:** Consider creating single monorepo for all Tekup services

**Repository:** All  
**Status:** 🟢 LONG-TERM GOAL

---

### 44. Implement Dark Mode (All UIs)

**Priority:** 🟢 LOW  
**Effort:** 4 hours  
**Impact:** Better UX

**Action:** Add dark mode toggle to all React apps

**Repository:** All frontends  
**Status:** 🟢 UX ENHANCEMENT

---

### 45. Add i18n Support

**Priority:** 🟢 LOW  
**Effort:** 6 hours  
**Impact:** International expansion

**Action:** Add multi-language support (Danish + English)

**Repository:** All user-facing apps  
**Status:** 🟢 FUTURE FEATURE

---

## TIMELINE OVERVIEW

### Week 1 (Oct 22-28)

- ✅ Item #1: Create Supabase tables
- ✅ Item #2: Deploy RenOS Calendar MCP
- ✅ Item #3: Archive Tekup Google AI
- ✅ Item #6: Commit dashboard changes
- ✅ Item #7: Organize Tekup-Cloud docs

### Week 2-4 (Oct 29 - Nov 18)

- ✅ Item #4: Extract core apps from Tekup-org
- ✅ Item #9: Deploy RendetaljeOS Backend
- ✅ Item #10: Deploy dashboard
- ✅ Item #12-13: RenOS integrations
- ✅ Item #14: Add rate limiting
- ✅ Item #15: Set up Sentry

### Month 2-3 (Nov 19 - Jan 19)

- ✅ Item #20: Build TekupVault Web UI
- ✅ Items #21-25: Documentation cleanup
- ✅ Items #26-30: Testing & quality
- ✅ Items #31-35: Performance optimization
- ✅ Items #36-40: Monitoring setup

---

## SUCCESS METRICS

### Immediate (7 days)

- [ ] RenOS Calendar MCP deployed to production
- [ ] All 5 tools operational (100%)
- [ ] Tekup Google AI archived
- [ ] tekup-cloud-dashboard committed

### Short Term (30 days)

- [ ] 6 production services running (up from 4)
- [ ] All services have error tracking (Sentry)
- [ ] All services have rate limiting
- [ ] Tekup-org reduced to 3-5 core repos

### Long Term (90 days)

- [ ] TekupVault Web UI live
- [ ] CI/CD pipelines for all services
- [ ] Monitoring dashboards operational
- [ ] Documentation centralized and organized

---

**Status:** 45 action items identified, prioritized, and assigned. Ready for execution.
