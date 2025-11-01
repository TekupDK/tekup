# 🚀 Friday AI Migration Plan: V1 → V2

**Dato:** 1. november 2025  
**Status:** Planning Phase  
**Mål:** Erstatte lokal Friday AI V1 med avanceret GitHub V2 version

---

## 📋 **Situation Overview**

### Nuværende Lokal V1 Setup

```
C:\Users\empir\Tekup\services\tekup-ai\
├── packages/inbox-orchestrator/     # V1 Friday AI (PRD version)
├── apps/ai-chat/                   # Ældre Next.js chat app
├── packages/ai-llm/                # LLM provider abstraktion
├── packages/ai-vault*/             # Vault services
└── docs/                          # Fragmenteret dokumentation
```

**Karakteristika:**

- Monorepo struktur med pakke-dependencies
- Focus på lead parsing og email orchestration
- Basic chat interface
- Kun Gemini AI support
- Fragmenteret implementation

### GitHub V2 Target (TekupDK/tekup-friday)

```
tekup-friday/
├── client/          # React 19 + TypeScript frontend
├── server/          # Express + tRPC backend
├── drizzle/         # Database schema (9 tabeller)
└── shared/          # Shared types
```

**Avancerede Features:**

- ✅ Unified inbox (Email + Calendar + Billy + Tasks + Leads)
- ✅ Multi-AI support (Gemini 2.5 Flash, Claude 3.5, GPT-4o, Manus AI)
- ✅ Intent-based actions (7 typer)
- ✅ 25 MEMORY business rules
- ✅ Mobile responsive design
- ✅ Live production deployment
- ✅ Modern tech stack (React 19, tRPC 11, Drizzle ORM)
- ✅ Komplet database schema (9 tabeller)

---

## 🎯 **Migration Strategy**

### Phase 1: Backup & Preparation ✅

- [x] Clone GitHub V2 repository for analysis
- [x] Identify valuable content fra lokal V1
- [x] Document current integrations
- [ ] Backup critical configuration files
- [ ] Export existing data

### Phase 2: Replace Lokal Implementation 🔄

- [ ] Archive current V1 setup
- [ ] Replace med GitHub V2 code
- [ ] Migrate configuration values
- [ ] Update environment variables
- [ ] Test lokalt setup

### Phase 3: Integration & Configuration 🔧

- [ ] Configure database connections
- [ ] Setup Google API credentials
- [ ] Configure Billy.dk integration
- [ ] Setup MCP servers
- [ ] Test all critical workflows

### Phase 4: Documentation & Organization 📝

- [ ] Update workspace documentation
- [ ] Organize GitHub TekupDK repositories
- [ ] Clean up old references
- [ ] Update README files

---

## 🔧 **Technical Migration Steps**

### Step 1: Archive Current V1 Setup

```powershell
# Create backup of current implementation
cd C:\Users\empir\Tekup\services
mkdir tekup-ai-v1-archive
robocopy tekup-ai tekup-ai-v1-archive /E /R:3 /W:1

# Tag current state in git
git add -A
git commit -m "backup: Archive Friday AI V1 before V2 migration"
git tag friday-ai-v1-backup
```

### Step 2: Deploy GitHub V2 Locally

```powershell
# Remove old structure
rmdir /s tekup-ai

# Clone GitHub V2
git clone https://github.com/TekupDK/tekup-friday.git tekup-ai
cd tekup-ai

# Install dependencies
pnpm install

# Copy configuration from backup
# (Need to extract relevant env vars)
```

### Step 3: Configuration Migration

**Environment Variables to Transfer:**

```bash
# Fra V1 backup til V2
GOOGLE_CLIENT_EMAIL=          # Google service account
GOOGLE_PRIVATE_KEY=          # Google private key
GOOGLE_IMPERSONATED_USER=    # Gmail user
BILLY_API_KEY=              # Billy integration
GEMINI_API_KEY=             # Gemini AI
OPENAI_API_KEY=             # OpenAI (if available)
DATABASE_URL=               # Database connection
```

**Configuration Files:**

- `google-service-account.json` → Copy fra backup
- `.env` → Merge værdier fra V1
- `drizzle.config.ts` → Update database URL

### Step 4: Data Migration

**Database Schema (V2 has 9 tables):**

```sql
-- V2 Tables (all new - much more advanced)
users           -- Authentication (Manus OAuth)
conversations   -- Chat threads
messages        -- Chat messages with AI responses
email_threads   -- Gmail integration
invoices        -- Billy.dk invoices
calendar_events -- Google Calendar events
leads           -- Sales pipeline
tasks           -- Task management
analytics_events -- User tracking
```

**Migration Approach:** Start fresh (V2 schema is completely different)

### Step 5: Test Critical Workflows

**Must Test Before Going Live:**

1. **Chat Interface** - Basic conversation flow
2. **Lead Creation** - "Opret lead: Lars Nielsen, lars@test.dk, 12345678"
3. **Task Management** - "Opret opgave: Send tilbud, i morgen, høj prioritet"
4. **Calendar Booking** - "Book Lars Nielsen til rengøring mandag kl 10-13"
5. **Billy Integration** - "Lav faktura til Lars Nielsen for 6 timer"
6. **Gmail Integration** - "Søg emails fra lars@test.dk"
7. **Mobile Interface** - Test responsive design

---

## 📁 **File Structure Comparison**

### V1 Structure (Complex Monorepo)

```
tekup-ai/
├── packages/
│   ├── inbox-orchestrator/    # Main Friday AI logic
│   ├── ai-llm/               # LLM abstraction
│   ├── ai-vault-core/        # Vault services
│   └── ai-config/            # Config management
├── apps/
│   ├── ai-chat/              # Next.js chat app
│   ├── ai-vault/             # Vault API
│   └── ai-vault-worker/      # Background worker
└── docs/                    # 266 markdown files
```

### V2 Structure (Clean & Unified)

```
tekup-friday/
├── client/                   # React 19 frontend
│   └── src/
│       ├── components/       # UI components
│       ├── pages/           # Route components
│       └── lib/             # tRPC client
├── server/                  # Express backend
│   ├── ai-router.ts         # AI logic
│   ├── google-api.ts        # Gmail/Calendar
│   ├── billy.ts             # Billy integration
│   └── intent-actions.ts    # Intent processing
├── drizzle/                 # Database schema
└── shared/                  # Shared types
```

**V2 Benefits:**

- ⚡ **Simpler**: 1 unified app vs 7+ pakker
- 🚀 **Modern**: React 19, tRPC 11, latest tech
- 📱 **Mobile**: Responsive design fra start
- 🎯 **Focused**: Specific til Rendetalje business
- 🔄 **Live**: Already deployed and tested

---

## 🧠 **Business Logic Migration**

### V1 Memories (24 rules)

```
MEMORY_1: Time validation before date operations
MEMORY_4: Lead source rules (reply strategy per source)
MEMORY_5: Calendar check before booking suggestions
MEMORY_7: Email search before sending replies
MEMORY_8: Overtime communication (+1h rule)
...
```

### V2 Memories (25 rules - Enhanced)

```
MEMORY_15: Calendar bookings only on round hours
MEMORY_16: Always request photos for flytterengøring
MEMORY_17: Billy invoices draft-only, never auto-approve
MEMORY_19: NEVER add attendees to calendar events
MEMORY_24: Job completion requires 6-step checklist
+ All V1 memories included and improved
```

**Migration:** V2 already includes all V1 logic + enhancements

---

## 🎯 **Success Criteria**

### Phase Completion Checkpoints

**Phase 1 Complete ✅ When:**

- [x] V2 repository analyzed and understood
- [x] Migration plan documented
- [ ] Critical configuration files backed up
- [ ] Data extraction plan confirmed

**Phase 2 Complete When:**

- [ ] V1 safely archived
- [ ] V2 code deployed locally
- [ ] Environment configured
- [ ] Application starts without errors
- [ ] Database schema deployed

**Phase 3 Complete When:**

- [ ] All 7 critical workflows tested
- [ ] Google/Billy integrations working
- [ ] MCP servers responding
- [ ] Mobile interface functional
- [ ] Performance acceptable (<2s response time)

**Phase 4 Complete When:**

- [ ] Documentation updated
- [ ] Team trained on new interface
- [ ] Old references removed
- [ ] GitHub repositories organized
- [ ] Monitoring/alerts configured

---

## 🚨 **Risk Mitigation**

### High Risk Areas

1. **Data Loss** - V1 has existing conversation history
2. **Configuration Mistakes** - Google API/Billy credentials
3. **Performance Issues** - V2 database schema is different
4. **Integration Failures** - MCP servers need reconfiguration

### Mitigation Strategies

1. **Complete Backup** - Full V1 archive + git tagging
2. **Staged Deployment** - Test locally before production
3. **Configuration Validation** - Test each integration separately
4. **Rollback Plan** - Keep V1 accessible for 30 days
5. **Documentation** - Document every configuration step

---

## 📅 **Timeline Estimate**

### Realistic Timeline (3-5 days)

- **Day 1**: Backup & preparation (2-3 hours)
- **Day 2**: Code replacement & basic setup (4-6 hours)
- **Day 3**: Configuration & integration (4-6 hours)
- **Day 4**: Testing & validation (3-4 hours)
- **Day 5**: Documentation & cleanup (2-3 hours)

### Aggressive Timeline (1-2 days)

- **Day 1**: Backup + deployment + basic config (6-8 hours)
- **Day 2**: Integration testing + documentation (4-6 hours)

**Recommendation:** Use realistic timeline for safer migration

---

## 🔄 **Next Immediate Actions**

### Right Now (Next 1 hour)

1. **Backup Critical Files**

   ```powershell
   # Extract environment variables
   copy C:\Users\empir\Tekup\services\tekup-ai\.env backup-env-v1.txt

   # Copy Google credentials
   copy C:\Users\empir\Tekup\services\tekup-ai\*google*.json .\backup\

   # Export any existing data
   # (Check if any sqlite/db files exist)
   ```

2. **Git Safety**
   ```powershell
   cd C:\Users\empir\Tekup
   git add -A
   git commit -m "Pre-migration checkpoint: Friday AI V1 backup"
   git push origin master
   ```

### Today (Next 4 hours)

3. **Deploy V2 Locally**
4. **Basic Configuration**
5. **Test Core Chat Functionality**

### This Weekend

6. **Complete Integration Testing**
7. **Update Documentation**
8. **GitHub Repository Organization**

---

## 📞 **Support Resources**

### GitHub V2 Resources

- **Live Demo:** https://3000-ijhgukurr5hhbd1h5s5sk-e0f84be7.manusvm.computer
- **Repository:** https://github.com/TekupDK/tekup-friday
- **Documentation:** README.md, STATUS.md, ANALYSIS.md

### TekUp Resources

- **Billy Integration:** TekupDK/tekup-billy repository
- **MCP Servers:** tekup-mcp-servers directory
- **Secrets Management:** tekup-secrets repository

### Technical Support

- **Database:** Drizzle Studio UI for schema management
- **AI Integration:** Manus Forge API documentation
- **Google APIs:** Google Cloud Console for credentials

---

**Migration Decision:** ✅ **PROCEED WITH MIGRATION**

V2 is significantly more advanced, production-ready, and aligned with business needs. The investment in migration will provide immediate value through:

- Better user experience (unified inbox)
- More reliable workflows (intent-based actions)
- Easier maintenance (unified codebase)
- Production deployment capability
- Mobile accessibility

**Risk Level:** 🟡 **MEDIUM** (mitigated by comprehensive backup strategy)

---

**Next Step:** Begin Phase 1 - Backup & Preparation ⏭️
