# 🎯 TEKUP WORKSPACE - Komplet Omstrukturerings Plan

**Created:** 22. Oktober 2025, 23:13 CET  
**Analyseret af:** AI Assistant  
**Confidence:** 95%  
**Estimeret tid:** 3-5 dage (opdelt i faser)

---

## 📊 **EXECUTIVE SUMMARY**

### **Current State:**

- 14 aktive projekter spredt i root directory
- 2 legacy projekter (Tekup-org, Tekup Google AI)
- 14+ tomme mapper
- Ingen klar struktur
- Blanding af production, development, og legacy

### **Target State:**

- Organized Tekup/ folder med klar struktur
- tekup-ai som central AI monorepo
- Separate GitHub repos per major service (following OpenAI/Anthropic pattern)
- Legacy arkiveret med værdi ekstraheret
- Clean root directory

### **Expected Benefits:**

- 80% reduktion i mental overhead
- Klar separation mellem production og development
- Nemmere at finde projekter
- Aligned med industry best practices
- Prepared for future scaling

---

## 🔍 **PART 1: CURRENT STATE ANALYSE**

### **A. Production Services (4 - KEEP SEPARATE)**

#### 1. **tekup-database** (v1.4.0)

- **Status:** ✅ CRITICAL - Central database
- **GitHub:** Separate repo ✅
- **Size:** 97 items
- **Dependencies:** ALL projects use this
- **Last updated:** 22 Oct 2025
- **Health:** 10/10
- **Action:** Keep separate, move to Tekup/production/

#### 2. **TekupVault** (v0.1.0)

- **Status:** ✅ LIVE - Knowledge layer
- **GitHub:** github.com/TekupDK/TekupVault ✅
- **Size:** 117 items
- **URL:** <https://tekupvault.onrender.com>
- **Value:** €120,000
- **Last updated:** 22 Oct 2025
- **Health:** 8.5/10
- **Action:** Keep separate, move to Tekup/production/

#### 3. **Tekup-Billy** (v1.4.3)

- **Status:** ✅ LIVE - Billy.dk MCP
- **GitHub:** github.com/TekupDK/Tekup-Billy ✅
- **Size:** 215 items
- **URL:** <https://tekup-billy.onrender.com>
- **Value:** €150,000
- **Last updated:** 22 Oct 2025
- **Health:** 9.2/10
- **Action:** Keep separate, move to Tekup/production/

#### 4. **RendetaljeOS** (Monorepo)

- **Status:** ✅ MONOREPO - Cleaning platform
- **GitHub:** github.com/TekupDK/rendetalje-os ✅
- **Size:** 528 items (backend + frontend)
- **Value:** €180,000
- **Last updated:** 20 Oct 2025 (monorepo migration 16 Oct)
- **Health:** 8/10
- **Action:** Keep separate, move to Tekup/development/

---

### **B. AI Projects (CONSOLIDATE TO MONOREPO)**

#### 5. **tekup-ai** (Phase 1)

- **Status:** 🟡 Monorepo structure ready
- **Size:** 322 items
- **Apps:** 0 (empty, structure only)
- **Packages:** 0 (empty, structure only)
- **Docs:** 274 files gathered
- **Action:** ✅ CENTRAL AI MONOREPO - consolidate all AI here

#### 6. **tekup-chat** (v1.1.0)

- **Status:** ✅ Standalone Next.js app
- **Size:** 58 items
- **Tech:** Next.js 15 + ChatGPT interface
- **Action:** ➡️ MOVE to tekup-ai/apps/ai-chat/

#### 7. **Agent-Orchestrator**

- **Status:** ✅ Electron desktop app
- **Size:** 25+ items + dist
- **Tech:** Electron + React + Render integration
- **Built:** 14 Oct 2025
- **Action:** ➡️ MOVE to tekup-ai/apps/ai-orchestrator/

#### 8. **rendetalje-ai-chat**

- **Status:** 📋 Docs complete, 0% implementation
- **Size:** 43 items
- **Tech:** Next.js 15 + GPT-4o + 24 business memories
- **Action:** ➡️ MOVE to tekup-ai/apps/rendetalje-chat/

#### 9. **Tekup Google AI** (Legacy)

- **Status:** 🔴 Legacy - features migrating
- **Size:** 1,531 items (LARGE!)
- **Contains:** LLM abstraction, AI agent logic
- **Action:** 🔄 EXTRACT to tekup-ai/packages/ → ARCHIVE

#### 10. **tekup-ai-assistant** (v1.5.0)

- **Status:** ✅ Docs & configs hub
- **Size:** 85 items
- **Action:** 🤔 DECISION: Keep standalone OR merge docs to tekup-ai/docs/

---

### **C. Supporting Services (KEEP SEPARATE)**

#### 11. **tekup-gmail-services** (v1.0.0)

- **Status:** ✅ Consolidated monorepo
- **Size:** 82 items
- **Consolidated:** 4 repos → 1 (22 Oct 2025)
- **Action:** Keep separate, move to Tekup/services/

#### 12. **Tekup-Cloud**

- **Status:** ✅ RenOS tools + docs
- **Size:** 477 items
- **Contains:** renos-calendar-mcp (5 AI tools)
- **Action:** Keep separate, move to Tekup/development/

#### 13. **tekup-cloud-dashboard** (Unreleased)

- **Status:** 🟡 Production-ready
- **Size:** 47 items
- **Action:** Keep separate, move to Tekup/development/

---

### **D. Legacy Projects (ARCHIVE)**

#### 14. **Tekup-org** (FAILED EXPERIMENT)

- **Status:** 🔴 66 apps - not maintainable
- **Size:** 3,228 items (MASSIVE!)
- **Value to extract:** €360,000 (design system + schemas)
- **Action:** 🗑️ ARCHIVE without extraction (per user request)

#### 15. **tekup-gmail-automation**

- **Status:** ✅ MIGRATED to tekup-gmail-services
- **Size:** 73 items
- **Action:** 🗑️ DELETE (already migrated)

---

### **E. Empty/Dead Folders (DELETE)**

**14 empty folders identified:**

- agent-orchestrator/ (0 items) - Will be moved first
- ansel/ (0 items)
- backups/ (0 items)
- frontend/ (0 items)
- gmail-repos-backup-2025-10-22/ (0 items)
- logs/ (0 items)
- optimere/ (0 items)
- rendetalje-ai-chat/ (0 items) - Will be moved first
- renos-backend/ (0 items) - Migrated to RendetaljeOS
- renos-frontend/ (0 items) - Migrated to RendetaljeOS
- supabase-migration/ (0 items)
- tekup-unified-docs/ (0 items)
- RendetaljeOS-Production/ (0 items)
- Ny mappe/ (0 items)
- Ny mappe (2)/ (0 items)

**Action:** 🗑️ DELETE ALL after verification

---

## 🎯 **PART 2: TARGET STRUCTURE**

### **A. Local Workspace Structure**

```
c:\Users\empir\
├── Tekup/                          ← NY HOVEDMAPPE
│   │
│   ├── production/                 ← Live production services
│   │   ├── tekup-database/        (git: TekupDK/tekup-database)
│   │   ├── tekup-vault/           (git: TekupDK/TekupVault)
│   │   └── tekup-billy/           (git: TekupDK/Tekup-Billy)
│   │
│   ├── development/                ← Active development
│   │   ├── rendetalje-os/         (git: TekupDK/rendetalje-os)
│   │   ├── tekup-ai/              (git: TekupDK/tekup-ai) ⭐ MONOREPO
│   │   ├── tekup-cloud/           (git: TekupDK/Tekup-Cloud)
│   │   └── tekup-cloud-dashboard/ (git: TekupDK/tekup-cloud-dashboard)
│   │
│   ├── services/                   ← Supporting services
│   │   ├── tekup-gmail-services/  (git: TekupDK/tekup-gmail-services)
│   │   └── tekup-ai-assistant/    (git: TekupDK/tekup-ai-assistant)
│   │
│   ├── archive/                    ← Legacy projects (read-only)
│   │   ├── tekup-org/             (archived 22-10-2025)
│   │   ├── tekup-google-ai/       (archived 22-10-2025)
│   │   └── tekup-gmail-automation/ (archived 22-10-2025)
│   │
│   └── docs/                       ← Workspace-level docs
│       ├── TEKUP_COMPLETE_VISION_ANALYSIS.md
│       ├── TEKUP_FOLDER_STRUCTURE_PLAN.md
│       ├── WHAT_IS_NEW_IN_EACH_FOLDER.md
│       ├── README_START_HERE.md
│       └── GIT_COMMIT_COMPLETE_2025-10-22.md
│
└── [Standard Windows folders remain]
```

---

### **B. GitHub Repository Structure**

**Following OpenAI/Anthropic Pattern: Separate Repos**

```
github.com/TekupDK/
│
├── tekup-database                  ← Shared infrastructure
├── TekupVault                      ← Knowledge layer
├── Tekup-Billy                     ← Billy.dk MCP
├── rendetalje-os                   ← Cleaning platform monorepo
├── tekup-ai                        ← AI MONOREPO ⭐
├── Tekup-Cloud                     ← RenOS tools & calendar MCP
├── tekup-cloud-dashboard           ← Unified dashboard
├── tekup-gmail-services            ← Email automation monorepo
└── tekup-ai-assistant              ← AI docs & configs
```

---

### **C. tekup-ai Monorepo Structure**

```
tekup-ai/                           ← CENTRAL AI REPOSITORY
├── apps/
│   ├── ai-chat/                   ← FROM: tekup-chat
│   │   ├── src/
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── ai-orchestrator/           ← FROM: Agent-Orchestrator
│   │   ├── electron/
│   │   ├── src/
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── rendetalje-chat/           ← FROM: rendetalje-ai-chat
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── ai-vault/                  ← Future: TekupVault features
│   ├── ai-vault-worker/           ← Future: Background worker
│   └── ai-mcp-hub/                ← Future: MCP router
│
├── packages/
│   ├── ai-llm/                    ← FROM: Tekup Google AI
│   │   ├── src/
│   │   │   ├── openai/
│   │   │   ├── gemini/
│   │   │   ├── ollama/
│   │   │   └── heuristic/
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── ai-agents/                 ← FROM: Tekup Google AI
│   │   ├── src/
│   │   │   ├── intent-classification/
│   │   │   ├── task-planning/
│   │   │   └── execution/
│   │   └── package.json
│   │
│   ├── ai-mcp/                    ← MCP utilities
│   ├── ai-rag/                    ← RAG pipeline
│   ├── ai-config/                 ← Shared configuration
│   └── ai-types/                  ← TypeScript types
│
├── docs/
│   ├── architecture/
│   ├── guides/
│   ├── api/
│   ├── migration/
│   └── assistant/                 ← FROM: tekup-ai-assistant (optional)
│
├── .env.example
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── README.md
└── CHANGELOG.md
```

---

## 📅 **PART 3: IMPLEMENTATION PLAN**

### **PHASE 1: Preparation & Structure Setup (Day 1 - 2 hours)**

#### **Step 1.1: Create Base Structure (10 min)**

```powershell
# Create main Tekup folder and subfolders
cd c:\Users\empir
mkdir Tekup
cd Tekup
mkdir production, development, services, archive, docs
```

**Deliverable:** Empty folder structure created

---

#### **Step 1.2: Move Workspace Docs (5 min)**

```powershell
# Move all workspace-level documentation
Move-Item "c:\Users\empir\TEKUP_COMPLETE_VISION_ANALYSIS.md" "c:\Users\empir\Tekup\docs\"
Move-Item "c:\Users\empir\TEKUP_SESSION_COMPLETE_2025-10-22.md" "c:\Users\empir\Tekup\docs\"
Move-Item "c:\Users\empir\TEKUP_FOLDER_STRUCTURE_PLAN.md" "c:\Users\empir\Tekup\docs\"
Move-Item "c:\Users\empir\WHAT_IS_NEW_IN_EACH_FOLDER.md" "c:\Users\empir\Tekup\docs\"
Move-Item "c:\Users\empir\README_START_HERE.md" "c:\Users\empir\Tekup\docs\"
Move-Item "c:\Users\empir\GIT_COMMIT_COMPLETE_2025-10-22.md" "c:\Users\empir\Tekup\docs\"
Move-Item "c:\Users\empir\TEKUP_COMPLETE_RESTRUCTURE_PLAN.md" "c:\Users\empir\Tekup\docs\"
```

**Deliverable:** Workspace docs organized

---

#### **Step 1.3: Archive Legacy (15 min)**

```powershell
# Archive Tekup-org without extraction (per user request)
Move-Item "c:\Users\empir\Tekup-org" "c:\Users\empir\Tekup\archive\tekup-org-archived-2025-10-22"

# Create archive note
@"
# Tekup-org - Archived

**Archived:** 22. Oktober 2025
**Reason:** Failed experiment - 66 apps not maintainable
**Status:** Read-only archive for reference
**Size:** 3,228 items

## Contents:
- 66 apps (mix of AI, business, integrations)
- 30+ packages
- Extensive documentation

## Note:
This was the original unified platform vision that proved too complex.
Valuable lessons learned led to current focused strategy.
"@ | Out-File "c:\Users\empir\Tekup\archive\tekup-org-archived-2025-10-22\ARCHIVED.md"

# Archive Tekup Google AI
Move-Item "c:\Users\empir\Tekup Google AI" "c:\Users\empir\Tekup\archive\tekup-google-ai-archived-2025-10-22"

# Archive tekup-gmail-automation
Move-Item "c:\Users\empir\tekup-gmail-automation" "c:\Users\empir\Tekup\archive\tekup-gmail-automation-archived-2025-10-22"
```

**Deliverable:** 3 legacy projects archived

---

#### **Step 1.4: Delete Empty Folders (10 min)**

```powershell
# Verify empty, then delete
$emptyFolders = @(
    "c:\Users\empir\ansel",
    "c:\Users\empir\backups",
    "c:\Users\empir\frontend",
    "c:\Users\empir\gmail-repos-backup-2025-10-22",
    "c:\Users\empir\logs",
    "c:\Users\empir\optimere",
    "c:\Users\empir\renos-backend",
    "c:\Users\empir\renos-frontend",
    "c:\Users\empir\supabase-migration",
    "c:\Users\empir\tekup-unified-docs",
    "c:\Users\empir\RendetaljeOS-Production",
    "c:\Users\empir\Ny mappe",
    "c:\Users\empir\Ny mappe (2)"
)

foreach ($folder in $emptyFolders) {
    if (Test-Path $folder) {
        $itemCount = (Get-ChildItem $folder -Recurse -Force).Count
        if ($itemCount -eq 0) {
            Remove-Item $folder -Recurse -Force
            Write-Host "✅ Deleted: $folder"
        } else {
            Write-Host "⚠️ Skipped (not empty): $folder ($itemCount items)"
        }
    }
}
```

**Deliverable:** 13+ empty folders removed

---

### **PHASE 2: Move Production Services (Day 1 - 30 min)**

#### **Step 2.1: Move Production Repos (10 min)**

```powershell
# Move critical production services
Move-Item "c:\Users\empir\tekup-database" "c:\Users\empir\Tekup\production\tekup-database"
Move-Item "c:\Users\empir\TekupVault" "c:\Users\empir\Tekup\production\tekup-vault"
Move-Item "c:\Users\empir\Tekup-Billy" "c:\Users\empir\Tekup\production\tekup-billy"
```

**Deliverable:** 3 production services moved

---

#### **Step 2.2: Verify Production Services (10 min)**

```powershell
# Verify each service still works
cd c:\Users\empir\Tekup\production\tekup-database
# Check git status, verify .env files intact

cd c:\Users\empir\Tekup\production\tekup-vault
# Verify structure

cd c:\Users\empir\Tekup\production\tekup-billy
# Verify structure
```

**Deliverable:** All production services verified

---

### **PHASE 3: Setup tekup-ai Monorepo (Day 2 - 3 hours)**

#### **Step 3.1: Prepare tekup-ai Structure (15 min)**

```powershell
cd c:\Users\empir\tekup-ai

# Verify current structure
Get-ChildItem

# Update pnpm-workspace.yaml
$workspaceConfig = @'
packages:
  - "apps/*"
  - "packages/*"
'@
$workspaceConfig | Out-File "pnpm-workspace.yaml" -Encoding UTF8

# Verify apps/ and packages/ folders exist
if (!(Test-Path "apps")) { mkdir apps }
if (!(Test-Path "packages")) { mkdir packages }
```

**Deliverable:** tekup-ai ready for apps

---

#### **Step 3.2: Move Agent-Orchestrator (20 min)**

```powershell
# Move to tekup-ai/apps/
Move-Item "c:\Users\empir\Agent-Orchestrator" "c:\Users\empir\tekup-ai\apps\ai-orchestrator"

# Update workspace
cd c:\Users\empir\tekup-ai
pnpm install

# Verify it still works
cd apps\ai-orchestrator
pnpm install
pnpm dev
```

**Deliverable:** Agent-Orchestrator integrated

---

#### **Step 3.3: Move rendetalje-ai-chat (20 min)**

```powershell
# Move to tekup-ai/apps/
Move-Item "c:\Users\empir\rendetalje-ai-chat" "c:\Users\empir\tekup-ai\apps\rendetalje-chat"

# Update workspace
cd c:\Users\empir\tekup-ai
pnpm install

# Verify structure
cd apps\rendetalje-chat
ls
```

**Deliverable:** rendetalje-ai-chat integrated

---

#### **Step 3.4: Migrate tekup-chat (45 min)**

```powershell
# Create target directory
mkdir "c:\Users\empir\tekup-ai\apps\ai-chat"

# Copy source (exclude node_modules, .next, dist)
$source = "c:\Users\empir\tekup-chat"
$target = "c:\Users\empir\tekup-ai\apps\ai-chat"

# Copy essential files
Copy-Item "$source\src" "$target\src" -Recurse
Copy-Item "$source\public" "$target\public" -Recurse
Copy-Item "$source\package.json" "$target\"
Copy-Item "$source\next.config.js" "$target\"
Copy-Item "$source\tsconfig.json" "$target\"
Copy-Item "$source\tailwind.config.js" "$target\"
Copy-Item "$source\.env.example" "$target\"
Copy-Item "$source\README.md" "$target\"

# Install and test
cd "$target"
pnpm install
pnpm dev

# If successful, archive original
if ($testSuccessful) {
    Move-Item "c:\Users\empir\tekup-chat" "c:\Users\empir\Tekup\archive\tekup-chat-backup-2025-10-22"
}
```

**Deliverable:** tekup-chat migrated and tested

---

#### **Step 3.5: Extract from Tekup Google AI (90 min)**

```powershell
# This is complex - needs manual review

# Step 1: Identify LLM code
cd "c:\Users\empir\Tekup\archive\tekup-google-ai-archived-2025-10-22"
Get-ChildItem -Recurse -Include "*llm*","*openai*","*gemini*","*ollama*" | Format-List FullName

# Step 2: Create package structure
mkdir "c:\Users\empir\tekup-ai\packages\ai-llm\src"

# Step 3: Copy relevant files (MANUAL REVIEW NEEDED)
# Copy LLM abstraction code
# Copy provider implementations
# Copy configuration

# Step 4: Identify Agent code
Get-ChildItem -Recurse -Include "*agent*","*orchestrat*","*intent*","*task*" | Format-List FullName

# Step 5: Create agent package
mkdir "c:\Users\empir\tekup-ai\packages\ai-agents\src"

# Step 6: Copy relevant files (MANUAL REVIEW NEEDED)
# Copy agent logic
# Copy intent classification
# Copy task planning
```

**Deliverable:** Key code extracted (requires manual review)

---

### **PHASE 4: Move Development & Services (Day 2-3 - 1 hour)**

#### **Step 4.1: Move Development Projects (20 min)**

```powershell
# Move development projects
Move-Item "c:\Users\empir\RendetaljeOS" "c:\Users\empir\Tekup\development\rendetalje-os"
Move-Item "c:\Users\empir\tekup-ai" "c:\Users\empir\Tekup\development\tekup-ai"
Move-Item "c:\Users\empir\Tekup-Cloud" "c:\Users\empir\Tekup\development\tekup-cloud"
Move-Item "c:\Users\empir\tekup-cloud-dashboard" "c:\Users\empir\Tekup\development\tekup-cloud-dashboard"
```

**Deliverable:** 4 development projects moved

---

#### **Step 4.2: Move Services (10 min)**

```powershell
# Move supporting services
Move-Item "c:\Users\empir\tekup-gmail-services" "c:\Users\empir\Tekup\services\tekup-gmail-services"
Move-Item "c:\Users\empir\tekup-ai-assistant" "c:\Users\empir\Tekup\services\tekup-ai-assistant"
```

**Deliverable:** 2 services moved

---

### **PHASE 5: Documentation & Verification (Day 3 - 2 hours)**

#### **Step 5.1: Create Master README (30 min)**

```powershell
# Create c:\Users\empir\Tekup\README.md
```

_Content: Complete workspace overview, links to all projects, quick start guides_

---

#### **Step 5.2: Update All Project READMEs (60 min)**

Update README.md in each project with:

- New location
- Updated paths
- Links to related projects
- Quick start instructions

---

#### **Step 5.3: Final Verification (30 min)**

```powershell
# Verify structure
cd c:\Users\empir\Tekup
Get-ChildItem -Recurse -Depth 2

# Verify git repos still work
# Test each production service
# Test each development project
```

---

## 📊 **PART 4: SUCCESS METRICS**

### **Technical Metrics:**

- ✅ 0 projects in root (except Tekup/)
- ✅ All projects organized in logical folders
- ✅ tekup-ai monorepo with 3+ apps
- ✅ All git repos intact and functional
- ✅ No broken paths or dependencies

### **Organizational Metrics:**

- ✅ Clear separation: production vs development
- ✅ Legacy properly archived
- ✅ All empty folders removed
- ✅ Documentation organized

### **Time Metrics:**

- ⏱️ Phase 1: 2 hours
- ⏱️ Phase 2: 30 min
- ⏱️ Phase 3: 3 hours
- ⏱️ Phase 4: 1 hour
- ⏱️ Phase 5: 2 hours
- **Total: 8.5 hours (~1-2 work days)**

---

## 🚨 **PART 5: RISK MITIGATION**

### **Risk 1: Git History Loss**

- **Mitigation:** All moves preserve .git folders
- **Verification:** Check git log after each move

### **Risk 2: Broken Paths**

- **Mitigation:** Update .env files and configs after moves
- **Verification:** Test each app after moving

### **Risk 3: Dependency Issues**

- **Mitigation:** Run pnpm install after workspace changes
- **Verification:** Build each app to confirm

### **Risk 4: Data Loss**

- **Mitigation:** NO deletion until after verification
- **Backup:** Keep archives for 30 days

---

## 🎯 **PART 6: NEXT STEPS AFTER COMPLETION**

### **Week 1:**

1. ✅ Structure complete
2. ✅ Update all documentation
3. ✅ Test all production services
4. ✅ Verify all git repos

### **Week 2:**

1. Complete Tekup Google AI extraction
2. Finalize tekup-ai packages
3. Setup CI/CD for tekup-ai monorepo

### **Week 3:**

1. Deploy updated services
2. Update Render.com paths if needed
3. Monitor production stability

---

## ✅ **APPROVAL CHECKLIST**

Before starting, confirm:

- [ ] Backup strategy in place (archives kept for 30 days)
- [ ] No active development that will be disrupted
- [ ] Time allocated (8.5 hours over 1-2 days)
- [ ] User approves archive without extraction for Tekup-org
- [ ] Ready to start with Phase 1

---

## 🚀 **READY TO START?**

**Phase 1 commands are ready to execute.**

**Bekræft og vi starter!** 🎯

