# 📝 PC1 SVAR PÅ PC2'S MAPPE ANALYSE

**Dato:** 24. Oktober 2025, 11:30 CET  
**Fra:** PC1 (empir)  
**Til:** PC2 (Jonas-dev)  
**Vedr:** Repository folder naming

---

## ✅ SVAR PÅ DINE SPØRGSMÅL

### ❓ Spørgsmål 1: Hvad hedder PC1's mappe?

**Svar:**

```
C:\Users\empir\Tekup\
```

**Details:**

- ✅ Mappe navn: `Tekup` (PascalCase, uden "-Monorepo")
- ✅ GitHub repo: `TekupDK/tekup`
- ⚠️ **INKONSISTENT:** PC1 bruger `Tekup`, PC2 bruger `Tekup-Monorepo`

**Status:** Vi er IKKE konsistente mellem PC1 og PC2!

---

### ❓ Spørgsmål 2: Er der hardcoded paths i scripts?

**Svar:** ✅ JA - fundet i 3 scripts:

#### 1. `scripts/push-all-to-github.ps1`

```powershell
# Linje 85:
$baseDir = "c:\Users\empir\Tekup"
```

#### 2. `scripts/utilities/quick-commit.ps1`

```powershell
# Linje 1:
cd c:\Users\empir\Tekup
```

#### 3. `tekup-secrets/scripts/sync-to-project.ps1`

```powershell
# Linje 41-42:
$secretsRoot = "C:\Users\empir\Tekup\tekup-secrets"
$projectsRoot = "C:\Users\empir\Tekup"
```

**Konklusion:**

- Alle 3 scripts bruger hardcoded `C:\Users\empir\Tekup`
- Hvis jeg omdøber, skal disse opdateres

---

### ❓ Spørgsmål 3: Vil du omdøbe nu eller senere?

**Svar:** 🎯 **SENERE** (men snart)

**Rationale:**

1. **Stabilitet først:** Git-crypt lige blevet sat op, PC2 lige unlocked ✅
2. **Koordinering:** Vi skal omdøbe BEGGE PC1 og PC2 samtidigt
3. **Testing:** Vil teste scripts efter omdøbning grundigt

**Forslag timing:**

- ⏰ **Weekend (26-27 okt)** når vi begge har tid
- ✅ PC1 og PC2 koordinerer i samme session
- ✅ Tester alt bagefter før production arbejde

---

### ❓ Spørgsmål 4: Skal PC1 også omdøbe hvis de bruger noget andet?

**Svar:** 🎯 **JA - vi skal BEGGE omdøbe til `tekup` (lowercase)**

**Beslutning:**

```
🎯 STANDARDISER TIL: tekup (lowercase)
```

**Rationale:**

| Machine    | Nuværende            | Target     | Rationale          |
| ---------- | -------------------- | ---------- | ------------------ |
| **PC1**    | `Tekup` (PascalCase) | `tekup` ✅ | Match GitHub repo  |
| **PC2**    | `Tekup-Monorepo`     | `tekup` ✅ | Match GitHub repo  |
| **GitHub** | `tekup`              | N/A        | Already correct ✅ |

**Fordele:**

- ✅ Konsistent på tværs af PC1, PC2, og GitHub
- ✅ Standard git convention: `git clone tekup.git` → `tekup/`
- ✅ Lowercase = Linux-friendly (hvis vi deployer til Linux servers)
- ✅ Kortere paths
- ✅ Ingen forvirring for fremtidige udviklere

---

## 🎯 PC1's BESLUTNING

### Valg: **Option A - Omdøb til `tekup` (lowercase)**

**Koordineret plan:**

### PC1 vil:

1. ✅ Omdøbe `C:\Users\empir\Tekup` → `C:\Users\empir\tekup`
2. ✅ Opdatere 3 scripts med hardcoded paths
3. ✅ Opdatere `Tekup-Portfolio.code-workspace` paths
4. ✅ Committe ændringer
5. ✅ Notificere PC2 når klar

### PC2 skal:

1. ✅ Omdøbe `C:\Users\Jonas-dev\Tekup-Monorepo` → `C:\Users\Jonas-dev\tekup`
2. ✅ Opdatere workspace file
3. ✅ Pull PC1's ændringer (scripts updates)
4. ✅ Verificere alt virker

---

## 📋 MIGRATION TIMING

**Når:** 🗓️ Weekend (26-27 Oktober 2025)

**Hvorfor ikke nu:**

- ⏰ Torsdag eftermiddag - midt i arbejdsuge
- ✅ Git-crypt lige blevet sat op og testet
- ✅ PC2 lige unlocked secrets successfully
- 🎯 Vil ikke risikere breaking changes midt i produktivt arbejde

**Hvad vi gør indtil da:**

- ✅ Fortsæt med nuværende mappe navne
- ✅ Git fungerer perfekt (det er kun lokale paths)
- ✅ Planlæg migration scripts

---

## 🔧 MIGRATION PLAN (PC1)

### Pre-migration Checklist:

```powershell
# 1. Backup git-crypt key (hvis ikke allerede)
Copy-Item C:\Users\empir\Desktop\tekup-git-crypt.key D:\Backup\

# 2. Commit alt uncommitted
cd C:\Users\empir\Tekup
git status
git add -A
git commit -m "Pre-rename checkpoint - PC1"
git push origin master

# 3. Luk VS Code
```

### Migration Steps:

```powershell
# 1. Omdøb mappe
cd C:\Users\empir\
Rename-Item Tekup tekup

# 2. Opdater scripts med hardcoded paths
cd tekup

# Update push-all-to-github.ps1
(Get-Content scripts\push-all-to-github.ps1) -replace 'c:\\Users\\empir\\Tekup', 'C:\Users\empir\tekup' | Set-Content scripts\push-all-to-github.ps1

# Update quick-commit.ps1
(Get-Content scripts\utilities\quick-commit.ps1) -replace 'c:\\Users\\empir\\Tekup', 'C:\Users\empir\tekup' | Set-Content scripts\utilities\quick-commit.ps1

# Update sync-to-project.ps1
(Get-Content tekup-secrets\scripts\sync-to-project.ps1) -replace 'C:\\Users\\empir\\Tekup', 'C:\Users\empir\tekup' | Set-Content tekup-secrets\scripts\sync-to-project.ps1

# 3. Opdater workspace file
(Get-Content Tekup-Portfolio.code-workspace) -replace 'C:\\\\Users\\\\empir\\\\Tekup', 'C:\\Users\\empir\\tekup' | Set-Content Tekup-Portfolio.code-workspace

# 4. Find og opdater alle markdown docs
Get-ChildItem -Filter "*.md" -Recurse | ForEach-Object {
    (Get-Content $_.FullName) -replace 'C:\\Users\\empir\\Tekup', 'C:\Users\empir\tekup' | Set-Content $_.FullName
    (Get-Content $_.FullName) -replace 'C:/Users/empir/Tekup', 'C:/Users/empir/tekup' | Set-Content $_.FullName
}

# 5. Verify git status
git status

# 6. Commit
git add -A
git commit -m "refactor(pc1): rename workspace folder Tekup -> tekup for consistency with GitHub repo"
git push origin master

# 7. Genåbn VS Code
code Tekup-Portfolio.code-workspace
```

### Post-migration Validation:

```powershell
# 1. Test git operations
git status
git log --oneline -5

# 2. Test secrets sync
cd tekup-secrets
.\scripts\sync-all.ps1

# 3. Test other scripts
cd ..\scripts
.\push-all-to-github.ps1 -WhatIf  # Dry run

# 4. Verify workspace loads
# Open VS Code and check all folders load
```

---

## 📢 TIL PC2

### Status:

✅ **PC1 er enig i at omdøbe til `tekup` (lowercase)**

### Koordinering:

🗓️ **Lad os gøre det i weekend (26-27 okt)** når vi begge har ro til det

### Hvad PC2 skal vide:

1. ✅ PC1 bruger `Tekup` (PascalCase) - skal også omdøbes
2. ✅ PC1 har 3 scripts med hardcoded paths
3. ✅ Vi omdøber BEGGE til `tekup` (lowercase) for konsistens
4. ✅ PC1 committer script updates først, så PC2 kan pull

### Workflow i weekend:

```
PC1 (empir):                    PC2 (Jonas-dev):
├─ Omdøb Tekup → tekup          ├─ Vent på PC1's commit
├─ Opdater scripts              │
├─ Commit & push ─────────────► ├─ Pull updates
                                ├─ Omdøb Tekup-Monorepo → tekup
                                ├─ Opdater workspace
                                ├─ Commit & push
                                └─ ✅ Sync complete
```

---

## 🎓 OPSUMMERING

### PC1's Svar:

1. ✅ **PC1's mappe:** `C:\Users\empir\Tekup` (PascalCase, inkonsistent)
2. ✅ **Hardcoded paths:** Ja - 3 scripts fundet
3. 🗓️ **Timing:** Weekend (26-27 okt) - koordineret med PC2
4. 🎯 **Beslutning:** PC1 omdøber også til `tekup` (lowercase)

### Endeligt mål:

```
✅ PC1:     C:\Users\empir\tekup\
✅ PC2:     C:\Users\Jonas-dev\tekup\
✅ GitHub:  TekupDK/tekup
✅ Clone:   git clone tekup.git → tekup/

= PERFEKT KONSISTENS 🎯
```

### Indtil weekend:

- ✅ Fortsæt som nu (intet går i stykker)
- ✅ Git virker perfekt
- ✅ Planlæg migration i ro og mag

---

**Lavet af:** PC1 (empir via GitHub Copilot)  
**Dato:** 24. Oktober 2025, 11:30 CET  
**Status:** ✅ Decision made, awaiting weekend execution
