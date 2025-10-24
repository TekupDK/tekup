# 🔄 Post-Restart Verification Checklist

**Når du vender tilbage til denne Claude Code chat efter VS Code restart**

---

## ✅ Step-by-Step Checklist

### Phase 1: Verify Setup (5 min)

- [ ] **1.1** VS Code genåbnet med Tekup-Portfolio.code-workspace
- [ ] **1.2** Claude Code chat er aktiv (denne chat!)
- [ ] **1.3** Working directory korrekt: `C:\Users\Jonas-dev\tekup`

### Phase 2: Test Slash Commands (5 min)

- [ ] **2.1** Type "/" i Claude Code chat → Se om 16 commands vises
- [ ] **2.2** Test knowledge search:
  ```
  /search-kb "testing"
  ```
  Forventet: Claude finder test docs fra KNOWLEDGE_INDEX.json

- [ ] **2.3** Test ask-workspace:
  ```
  /ask-workspace "What is our current TypeScript status?"
  ```
  Forventet: Claude læser TYPESCRIPT_FIX_STATUS.md og svarer

- [ ] **2.4** Test git status:
  ```
  Bed Claude: "Check git status using GIT_STATUS_REPORT.json"
  ```
  Forventet: Claude læser JSON og rapporterer status

### Phase 3: Verify Knowledge System (2 min)

- [ ] **3.1** Tjek files findes:
  ```bash
  ls KNOWLEDGE_INDEX.json
  ls GIT_STATUS_REPORT.json
  ls TYPESCRIPT_FIX_STATUS.md
  ls .claude/commands/
  ```

- [ ] **3.2** Bed Claude søge i knowledge:
  ```
  "Search workspace docs for how to run backend tests"
  ```
  Forventet: Claude bruger KNOWLEDGE_INDEX.json automatisk

### Phase 4: Verify Git State (2 min)

- [ ] **4.1** Tjek branch:
  ```bash
  git branch --show-current
  ```
  Forventet: `claude/implement-momentary-feature-011CUSDGPgNNv8NS6psNVgfx`

- [ ] **4.2** Tjek commits er pushed:
  ```bash
  git log --oneline -5
  ```
  Forventet: Se commits 3df72ce, fd770b4, 4e4f7b2, 937cc19, c7aef12

- [ ] **4.3** Verificer sync med remote:
  ```bash
  git status
  ```
  Forventet: "Your branch is up to date"

### Phase 5: Ready to Continue (Pick One)

- [ ] **Option A:** Continue TypeScript fixes
  ```
  /continue-typescript-fixes
  ```
  Claude vil autonomt fixe de resterende 46 errors.

- [ ] **Option B:** Run all tests
  ```
  /test-all
  ```
  Claude launcher 4 parallel agents til at teste alt.

- [ ] **Option C:** Check deployment readiness
  ```
  /deploy-check
  ```
  Claude verificerer om branch er klar til merge.

- [ ] **Option D:** Explore new commands
  ```
  "List all available slash commands with descriptions"
  ```

---

## 🎯 Quick Verification Commands

**Fortæl Claude:**

```
"Verify the Claude Code setup:
1. Check KNOWLEDGE_INDEX.json exists and show file count
2. List all slash commands in .claude/commands/
3. Show current git status from GIT_STATUS_REPORT.json
4. Show TypeScript fix progress from TYPESCRIPT_FIX_STATUS.md"
```

**Forventet Response:**
```
✅ KNOWLEDGE_INDEX.json: 856 files indexed
✅ Slash commands: 16 commands found
✅ Git: Branch claude/implement-momentary-feature-*, 13 commits ahead
✅ TypeScript: 46 errors remaining (23% improvement from 60+)
```

---

## ⚠️ If Something Doesn't Work

### Slash Commands Not Showing?

**Check:**
```bash
ls -la .claude/commands/
```
Skal vise 16 .md filer.

**Fix:**
Claude Code skal muligvis restarte endnu en gang for at indlæse commands.

### Knowledge Files Missing?

**Check:**
```bash
ls *.json | grep -E "(KNOWLEDGE|GIT|TYPESCRIPT)"
```

**Fix:**
Alle filer er committet (3df72ce), så de skulle være der. Hvis ikke, pull fra GitHub.

### MCP Servers Not Working?

**Normal!** De kræver environment variables fra tekup-secrets. Det er optional og kan enables senere.

---

## 🚀 You're Ready!

Når alle ✅ er checked, du er klar til:

1. **Fortsæt hvor vi slap:** `/continue-typescript-fixes`
2. **Test parallel workflows:** `/test-all`
3. **Brug knowledge system:** `/ask-workspace "{any question}"`

---

**Print denne checklist** (eller lad den være åben i en tab) når du restarter.

Held og lykke! 🎉
