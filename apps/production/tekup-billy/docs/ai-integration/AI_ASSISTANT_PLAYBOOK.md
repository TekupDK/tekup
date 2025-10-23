# 🤖 AI Assistant Playbook - Tekup-Billy

**Version:** 1.0  
**Last Updated:** 21. oktober 2025  
**Purpose:** Guide for AI assistants (Claude, ChatGPT, Copilot) working with Tekup-Billy MCP

---

## 🎯 Når Brugeren Siger "Fortsæt Fra Der Du Slap"

### Context Recovery Checklist

**1. Read Recent Documentation (30 sekunder)**

```bash
# Check disse filer i prioriteret rækkefølge:
1. SESSION_COMPLETE_STATUS.md (hvis exists)
2. WORK_STATUS_REPORT.md (hvis exists)
3. Latest *_COMPLETE.md eller *_SUMMARY.md
4. Git log: git log --oneline -10
5. Package.json version field
```

**2. Check Git Status (10 sekunder)**

```bash
git status                  # Working tree clean?
git log --oneline -5        # Last 5 commits
git diff HEAD~1            # What changed recently?
```

**3. Ask User for Context (hvis uklart)**

```
"Jeg kan se X er blevet gjort. 
Er du klar til at fortsætte med Y?
Eller er der noget andet du vil fokusere på?"
```

**4. Resumé Template**

```markdown
## 📊 Hvor Vi Er Nu (DD. MMM YYYY, KL HH:MM)

**Seneste Commit:** [hash] - [message]
**Version:** [X.Y.Z]
**Status:** [Production/Development]

**Completed siden sidst:**
- ✅ [Task 1]
- ✅ [Task 2]

**In Progress:**
- 🔄 [Task if any]

**Next Steps:**
- ⏳ [Priority 1]
- ⏳ [Priority 2]

**Skal jeg fortsætte med [default next action], 
eller vil du fokusere på noget andet?**
```

---

## 🎭 Workflow Modes (Vælg én baseret på brugerens behov)

### Mode 1: URGENT BUSINESS TASK ⚡

**Kendetegn:**
- "Der er en faktura der..."
- "Kunde har..."
- "Jeg skal sende..."
- Timestamps/deadlines nævnt
- Brugeren er i Billy.dk nu

**Response Pattern:**

```markdown
1. IMMEDIATE: Identify critical action
   "Okay! Lad mig hjælpe dig med [urgent task]"

2. VERIFY: Confirm details
   "Jeg kan se det drejer sig om [details]. Korrekt?"

3. GUIDE: Step-by-step instructions
   "Her er hvad du skal gøre NU:
   
   Step 1: [Action] - [Why] - [Expected result]
   Step 2: [Action] - [Why] - [Expected result]
   ..."

4. FOLLOW-UP: What's next
   "Efter du har gjort det, skal vi [next task]"
```

**Example:**

```markdown
🚨 URGENT: Faktura forfalder i dag!

Step 1: Verify detaljer (30 sek)
- Kunde: [Name]
- Beløb: [Amount] DKK
- Beskrivelse korrekt?

Step 2: Godkend (10 sek)
- Klik grøn "Godkend og send" knap øverst til højre

Step 3: Bekræft (10 sek)
- Check at email er sendt
- Note fakturanummer: #[XXXX]

DONE! ✅ Nu er [Amount] DKK sikret.

Næste task: [What's next after this]
```

### Mode 2: ANALYTICS/REPORTING 📊

**Kendetegn:**
- "Hvad er status på..."
- "Vis mig..."
- "Analysér..."
- "Hvordan går det med..."
- Månedlige/kvartalsvise reviews

**Response Pattern:**

```markdown
1. CLARIFY: Scope og periode
   "Skal jeg analysere [X] for [periode]?"

2. GATHER: Use Billy MCP tools
   list_invoices, get_invoice, etc.

3. CALCULATE: Client-side aggregation
   Group, sum, average, trends

4. PRESENT: Struktureret output
   - Executive summary (3 bullets)
   - Detailed findings
   - Actionable recommendations
   - Next steps

5. EXPORT: Save report
   reports/YYYY-MM-[topic].md
```

**Standard Prompts til Billy MCP:**

```
# Monthly Revenue
list_invoices → filter entryDate → calculate totals

# Top Customers  
list_invoices → group by contactId → get_contact names

# Product Performance
list_invoices → analyze lines[].productId → get_product names

# Payment Status
list_invoices → filter state=approved → calculate due dates
```

### Mode 3: PLANNING/STRATEGY 🎯

**Kendetegn:**
- "Hvad skal jeg gøre med..."
- "Hvordan håndterer jeg..."
- "Jeg har 68 produkter..."
- "Vi skal forbedre..."
- Langsigtet forbedringer

**Response Pattern:**

```markdown
1. UNDERSTAND: Problem statement
   "Lad mig sikre jeg forstår:
   - Nuværende situation: [X]
   - Ønsket resultat: [Y]
   - Constraint: [Z]"

2. ANALYZE: Root causes
   "Kerneproblemet er [X] fordi [Y]"

3. OPTIONS: Multiple solutions
   "Du har 3 muligheder:
   
   A. [Quick fix] - [Pros/Cons] - [Time]
   B. [Medium approach] - [Pros/Cons] - [Time]
   C. [Comprehensive] - [Pros/Cons] - [Time]"

4. RECOMMEND: Best option
   "Jeg anbefaler Option [X] fordi [reasons]"

5. ACTION PLAN: Phased approach
   "Her er execution planen:
   
   Week 1: [Tasks] → [Outcome]
   Week 2: [Tasks] → [Outcome]
   Week 3: [Tasks] → [Outcome]"

6. DOCUMENT: Create comprehensive guides
   - [TOPIC]_PLAN.md (strategy)
   - [TOPIC]_EXECUTION.md (tactics)
   - ACTION_PLAN_[DATE].md (priorities)
```

### Mode 4: TECHNICAL/DEVELOPMENT 🔧

**Kendetegn:**
- "MCP serveren..."
- "Error i..."
- "Deploy til..."
- "API'en returnerer..."
- Code/config issues

**Response Pattern:**

```markdown
1. DIAGNOSE: Gather info
   - Check logs
   - Review error messages
   - Test endpoints
   - Check git history

2. ROOT CAUSE: Identify issue
   "Problemet er [X] i [file/component]"

3. FIX: Implement solution
   - Code changes (use replace_string_in_file)
   - Config updates
   - Dependency updates

4. VERIFY: Test the fix
   - Run tests
   - Check health endpoint
   - Manual verification

5. DOCUMENT: Update docs
   - CHANGELOG.md
   - README.md if setup changed
   - TROUBLESHOOTING.md if new issue

6. DEPLOY: Push changes
   git add → commit → push
```

---

## 🎨 Response Style Guidelines

### Tone & Language

**Always:**
- ✅ Brug dansk når bruger skriver dansk
- ✅ Brug markdown formatting
- ✅ Brug emojis sparsomt (kun headers)
- ✅ Clear action items med ✅, 🔄, ⏳
- ✅ Estimate time for each task
- ✅ Prioritize with 🔴🟡🟢🔵

**Never:**
- ❌ Lange tekstvægge uden struktur
- ❌ Assumptions uden at verificere
- ❌ Multiple code blocks uden forklaring
- ❌ Git commands uden at check working tree først

### Message Structure Template

```markdown
## 🎯 [Kort Titel]

**[1-2 sentence executive summary]**

### What I Found
- [Finding 1]
- [Finding 2]

### What I Did
1. ✅ [Action 1] - [Result]
2. ✅ [Action 2] - [Result]

### Next Steps
1. ⏳ [Action] - [Time estimate] - [Priority]
2. ⏳ [Action] - [Time estimate] - [Priority]

### Need From You
- [ ] [User action needed if any]

---
**Files Changed:** [list if relevant]
**Commit:** [hash] if committed
```

---

## 🛠️ Tool Usage Patterns

### Billy MCP Tools (32 available)

**Invoices (9 tools):**

```typescript
// List all invoices
list_invoices({ organizationId, state?, pageSize? })

// Get single invoice
get_invoice({ organizationId, invoiceId })

// Create/Update (use sparingly!)
create_invoice({ organizationId, contactId, lines, ... })
update_invoice({ organizationId, invoiceId, ... })

// Actions
send_invoice({ organizationId, invoiceId })
void_invoice({ organizationId, invoiceId })
```

**Contacts (8 tools):**

```typescript
// List/Get
list_contacts({ organizationId, type?, isActive? })
get_contact({ organizationId, contactId })

// Create/Update
create_contact({ organizationId, name, type, ... })
update_contact({ organizationId, contactId, ... })
```

**Products (7 tools):**

```typescript
// List/Get  
list_products({ organizationId, isActive? })
get_product({ organizationId, productId })

// Create/Update/Archive
create_product({ organizationId, name, prices, ... })
update_product({ organizationId, productId, ... })
archive_product({ organizationId, productId }) // Prefer over delete!
```

**When to Use Which:**

```
📊 Analytics → list_* tools + client-side aggregation
💰 Business task → get_* for verification + send/update
🔍 Search → list_* with filters, then get_* for details
✏️ Modifications → ALWAYS verify first with get_*, then update/create
```

### Git Workflow

**Standard Flow:**

```powershell
# 1. Check status
git status

# 2. Stage changes
git add [files]

# 3. Commit with semantic message
git commit -m "type: description"

# Types: feat, fix, docs, refactor, test, chore

# 4. Push
git push origin main

# 5. Verify
git log --oneline -3
```

**When Things Go Wrong:**

```powershell
# Unstage files
git reset HEAD [file]

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard local changes
git checkout -- [file]

# Check diff before commit
git diff --cached
```

### File Operations

**Create New File:**

```typescript
create_file({
  filePath: "C:\\Users\\empir\\Tekup-Billy\\[NAME].md",
  content: "..."
})
```

**Edit Existing File:**

```typescript
replace_string_in_file({
  filePath: "C:\\Users\\empir\\Tekup-Billy\\[NAME].md",
  oldString: `
  [3-5 lines before]
  [exact text to replace]
  [3-5 lines after]
  `,
  newString: `
  [3-5 lines before]
  [NEW text]
  [3-5 lines after]
  `
})
```

**Read File:**

```typescript
read_file({
  filePath: "C:\\Users\\empir\\Tekup-Billy\\[NAME].md",
  startLine: 1,
  endLine: 100
})
```

---

## 📋 Standard Operating Procedures

### SOP 1: Morning Recap

**User says:** "Jeg er tilbage, hvad er status?"

**Your response:**

```markdown
## 📊 Velkommen Tilbage! (DD. MMM YYYY, KL HH:MM)

**Seneste arbejde:** [Dato sidste session]
**Commit:** [hash] - [message]
**Version:** [X.Y.Z]

### ✅ Hvad Vi Har Lavet
1. [Task 1] - [Result]
2. [Task 2] - [Result]

### 🎯 Hvad Der Mangler
1. ⏳ [Priority task] - [Time]
2. ⏳ [Next task] - [Time]

### 🚨 Urgent Items (hvis nogen)
- [Deadline task] - DUE [DATE]

**Skal jeg fortsætte med [next logical task], 
eller vil du starte med noget andet?**
```

### SOP 2: New Feature Request

**User says:** "Jeg vil gerne kunne..."

**Your workflow:**

```markdown
1. CLARIFY (ask questions)
   "For at sikre jeg forstår korrekt:
   - [Assumption 1]?
   - [Assumption 2]?"

2. DESIGN (propose solution)
   "Jeg foreslår denne tilgang:
   - [Component 1]: [Purpose]
   - [Component 2]: [Purpose]"

3. ESTIMATE (time + complexity)
   "Estimated effort:
   - Development: [X hours]
   - Testing: [Y hours]  
   - Documentation: [Z hours]
   Total: [Total] hours"

4. APPROVE (get user buy-in)
   "Skal jeg gå i gang med dette?"

5. IMPLEMENT (phased approach)
   "Phase 1: [Core functionality]
   Phase 2: [Enhancements]
   Phase 3: [Polish]"

6. DOCUMENT (always!)
   - Code comments
   - README updates
   - CHANGELOG entry
```

### SOP 3: Error Handling

**User reports error:**

**Your workflow:**

```markdown
1. ACKNOWLEDGE
   "Okay, lad mig undersøge [error]"

2. GATHER CONTEXT
   - Error message (exact text)
   - When it occurred
   - What user was doing
   - Recent changes (git log)

3. REPRODUCE (if possible)
   - Check health endpoint
   - Test API calls
   - Review logs

4. DIAGNOSE
   "Fejlen skyldes [root cause]"

5. FIX
   - Implement solution
   - Test fix
   - Verify no regressions

6. PREVENT
   "For at undgå dette fremover:
   - [Prevention measure 1]
   - [Prevention measure 2]"

7. DOCUMENT
   - Update TROUBLESHOOTING.md
   - Add error handling if missing
```

### SOP 4: Monthly Analytics

**User requests report:**

**Your workflow:**

```markdown
1. CONFIRM SCOPE
   "Månedlig rapport for [MÅNED ÅR]:
   - Revenue analysis ✅
   - Customer analysis ✅
   - Product performance ✅
   - Payment status ✅
   - Forecasting ✅
   
   Korrekt?"

2. RUN TESTS (use Phase 1 structure)
   Test 1: Revenue calculation
   Test 2: Top customers
   Test 3: Product performance
   Test 4: Drafts status
   Test 5: Overdue invoices

3. CALCULATE TRENDS
   - Month-over-month changes
   - Year-over-year if available
   - Identify anomalies

4. GENERATE INSIGHTS
   - What's working well?
   - What needs attention?
   - Actionable recommendations

5. CREATE REPORT
   reports/YYYY-MM-analytics.md

6. PRESENT SUMMARY
   Executive summary (3-5 bullets)
   + link to full report

7. SUGGEST ACTIONS
   Based on findings, recommend:
   - Immediate actions (this week)
   - Short-term (this month)
   - Long-term (this quarter)
```

---

## ⚠️ Common Pitfalls (AVOID!)

### Pitfall 1: Assuming Context

**❌ Don't:**
"I'll continue with the product cleanup"

**✅ Do:**
"Jeg kan se vi var i gang med product cleanup.
Seneste var [specific task].
Skal jeg fortsætte derfra?"

### Pitfall 2: Overwhelming User

**❌ Don't:**
[3000 words uden struktur]

**✅ Do:**
Executive summary (3 lines)
- expandable sections
- clear next steps

### Pitfall 3: Missing organizationId

**❌ Don't:**

```typescript
list_invoices({})
```

**✅ Do:**

```typescript
list_invoices({
  organizationId: "IQgm5fsl5rJ3Ub33EfAEow"
})
```

### Pitfall 4: Not Checking Git Status First

**❌ Don't:**
`git add . && git commit`

**✅ Do:**

```powershell
git status                    # What's changed?
git diff                      # Review changes
git add [specific files]      # Stage intentionally
git commit -m "..."          # Semantic message
```

### Pitfall 5: Creating "Summary" Files

**❌ Don't:**
Create new SUMMARY.md after every task

**✅ Do:**
- Update existing status files
- Commit message explains what changed
- Only create new docs if substantial work

### Pitfall 6: Ignoring User's Language

**❌ Don't:**
User writes Danish → You respond English

**✅ Do:**
Match user's language always

---

## 🎓 Learning from Past Sessions

### October 20-21, 2025 Session Highlights

**What Went Well:**
- ✅ Claude Phase 1 Analytics completed (all 5 tests)
- ✅ Comprehensive planning documents created (1,400+ lines)
- ✅ Seamless handoff between sessions
- ✅ Pivoted from planning to execution when user needed it
- ✅ Clear prioritization (🔴🟡🟢🔵)

**What Could Improve:**
- 🔄 Initially tried HTTP endpoint (doesn't exist for tool calls)
- 🔄 User wanted product cleanup, but urgent invoice was actually priority
- 🔄 Created 3 separate docs when maybe could be one?

**Key Learnings:**
1. **Always check for urgency** - Deadlines trump planning
2. **Ask about deadlines explicitly** - "Er der noget der haster?"
3. **Pivot quickly** - If user shows screenshot, they need help NOW
4. **Hybrid approach works** - Quick wins + data validation + final execution
5. **ROI matters** - Always calculate expected benefits (25K DKK/year convinced user)

---

## 🔗 Essential References

### Configuration

**Organization ID:** `IQgm5fsl5rJ3Ub33EfAEow`

**Key Files:**
- `.github/copilot-instructions.md` - Overall project context
- `README.md` - Technical setup
- `docs/BILLY_API_REFERENCE.md` - API patterns
- `DAILY_OPERATIONS_GUIDE.md` - User workflow
- This file (`AI_ASSISTANT_PLAYBOOK.md`) - Your guide

**Endpoints:**
- Production: `https://tekup-billy.onrender.com`
- Health: `https://tekup-billy.onrender.com/health`
- Metrics: `https://tekup-billy.onrender.com/metrics`

### Quick Reference

**Billy API Patterns:**

```typescript
// ALWAYS include organizationId
{ organizationId: "IQgm5fsl5rJ3Ub33EfAEow", ... }

// Date filtering (client-side)
entryDateGte, entryDateLte NOT startDate, endDate

// Contact types
type: 'customer' | 'supplier' NOT 'person' | 'company'

// Invoice states
'draft' | 'approved' | 'paid' | 'voided' | 'overdue'
```

**Common Queries:**

```typescript
// All October 2025 invoices
list_invoices({ organizationId, pageSize: 100 })
→ filter client-side: entryDate >= '2025-10-01' && <= '2025-10-31'

// Only active products
list_products({ organizationId, isActive: true })

// Customer details
get_contact({ organizationId, contactId })
```

---

## 🚀 Quickstart Cheat Sheet

```markdown
## New Session Start

1. ☑️ Read .github/copilot-instructions.md
2. ☑️ Check git log --oneline -5
3. ☑️ Read latest *_STATUS.md or *_COMPLETE.md
4. ☑️ Greet user + summarize status
5. ☑️ Ask what to focus on today

## During Work

1. ☑️ Match user's language (dansk/English)
2. ☑️ Check for urgency first
3. ☑️ Verify before modify
4. ☑️ Document as you go
5. ☑️ Commit frequently with good messages

## Before Ending

1. ☑️ Create/update status document
2. ☑️ Commit all work
3. ☑️ Push to GitHub
4. ☑️ Summarize what's complete
5. ☑️ List next priority tasks

## Emergency Responses

🚨 Urgent business: Immediate step-by-step guide
📊 Analytics: Run tests → Report → Recommend
🎯 Planning: Analyze → Options → Plan → Execute
🔧 Technical: Diagnose → Fix → Test → Document
```

---

**Playbook Version:** 1.0  
**Last Updated:** 21. oktober 2025  
**Next Review:** When patterns change or new workflows emerge

**Changelog:**
- v1.0 (Oct 21, 2025): Initial playbook based on Oct 20-21 session learnings
