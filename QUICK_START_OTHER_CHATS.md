# 🚀 Quick Start for Anden Chat

**For de 2 andre chats i Cursor:**

## ⚡ Hurtigste Metode (Kopier-Paste)

Åbn terminal i Cursor og kør:

```powershell
cd C:\Users\empir\Tekup\services\tekup-ai-v2
.\scripts\create-chat-branch.ps1
```

**Det gør automatisk:**

- ✅ Stasher dine uncommitted changes
- ✅ Opretter ny branch: `cursor/20250115-143022-abc123`
- ✅ Skifter til den branch
- ✅ Restaurerer dine changes

## 📋 Eller Manuelt (Hvis script fejler)

```bash
cd C:\Users\empir\Tekup\services\tekup-ai-v2

# Hvis du har uncommitted changes
git stash

# Opret branch
git checkout -b cursor/chat-$(date +%Y%m%d-%H%M%S)

# Push til GitHub
git push -u origin cursor/chat-$(date +%Y%m%d-%H%M%S)

# Hvis du stashede, få dem tilbage
git stash pop
```

## ✅ Tjek Det Virker

```bash
git branch --show-current
# Skal vise: cursor/YYYYMMDD-HHMMSS-xxxxx
```

**Nu kan du arbejde isoleret fra migration branch! 🎉**
