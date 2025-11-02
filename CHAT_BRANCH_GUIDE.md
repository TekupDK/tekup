# 🔀 Cursor Chat Branch Guide - tekup-ai-v2

**Når du har flere chats åbne samtidigt i Cursor, brug denne guide til at isolere hver chat på sin egen branch.**

---

## 📌 Nuværende Situation

**Denne Chat:** `migration/postgresql-supabase`
**Andre Chats:** Skal oprette egne branches

---

## 🚀 Quick Start

### For de 2 andre chats:

**Option 1: Via Cursor Task (Anbefalet)**
1. I den anden chat, tryk `Ctrl+Shift+P`
2. Skriv: `Tasks: Run Task`
3. Vælg: `🔄 Create Cursor Chat Branch`
4. Arbejd isoleret! ✨

**Option 2: Via PowerShell**
```powershell
cd C:\Users\empir\Tekup\services\tekup-ai-v2
.\scripts\create-chat-branch.ps1
```

**Option 3: Manuelt**
```bash
git checkout -b cursor/chat-2-work
git push -u origin cursor/chat-2-work
```

---

## 📋 Branch Naming Convention

- **Migration work:** `migration/postgresql-supabase` (denne chat)
- **Feature chats:** `cursor/YYYYMMDD-HHMMSS-hash`
- **Specific features:** `feature/feature-name`

---

## 🔄 Workflow

### Når du starter en ny chat:

1. **Tjek hvilken branch du er på:**
   ```bash
   git branch --show-current
   ```

2. **Hvis du er på migration branch:**
   - Opret ny branch først!
   - Ellers vil dine ændringer blande sig med migration work

3. **Opret isoleret branch:**
   - Brug task'en eller scriptet
   - Eller manuelt: `git checkout -b cursor/my-chat-work`

4. **Arbejd isoleret:**
   - Alle commits går til din chat-branch
   - Ingen konflikter med andre chats

### Når chat er færdig:

```bash
# Review changes
git log --oneline

# Merge til migration branch (hvis relevant)
git checkout migration/postgresql-supabase
git merge cursor/your-chat-branch

# Eller opret feature branch
git checkout -b feature/my-feature
git merge cursor/your-chat-branch
```

---

## ✅ Best Practices

1. **Én branch per chat** når de arbejder på forskellige features
2. **Brug migration branch** kun til migration-specifikke ændringer
3. **Commit ofte** på din chat-branch
4. **Merge når færdig** - ikke lad cursor branches ligge

---

## 🆘 Troubleshooting

**Q: Jeg er allerede på migration branch, kan jeg skifte?**
A: Ja! Scriptet håndterer uncommitted changes automatisk (stash)

**Q: Mine ændringer forsvandt?**
A: Tjek `git stash list` - scriptet gemmer dem midlertidigt

**Q: Kan jeg arbejde på migration branch direkte?**
A: Ja, hvis du er den ENESTE der arbejder på migration. Men bedre at isolere.

---

## 📝 Eksempel

**Chat 1 (Migration):**
```bash
# Du er på: migration/postgresql-supabase ✅
# Fortsæt her - ingen ændringer nødvendig
```

**Chat 2 (Feature):**
```bash
# Kør: Create Cursor Chat Branch
# Opretter: cursor/20250115-143022-abc123
# Arbejd isoleret ✅
```

**Chat 3 (Bugfix):**
```bash
# Kør: Create Cursor Chat Branch
# Opretter: cursor/20250115-150045-xyz789
# Arbejd isoleret ✅
```

Alle 3 chats kan nu arbejde parallelt uden konflikter! 🎉

---

**Opdateret:** $(Get-Date -Format "yyyy-MM-dd HH:mm")

