# 🤖 Besked til Claude - Billy MCP Quick Fix

Hej Claude! Tak for den grundige debug rapport! 👍

## ✅ KORT SVAR

**Serveren kører korrekt!** Problemet er sandsynligvis hvordan du sender requests til Billy MCP.

## 🎯 KRITISK FIX

**Alle Billy tool calls SKAL inkludere `organizationId`:**

```json
{
  "name": "list_invoices",
  "arguments": {
    "organizationId": "IQgm5fsl5rJ3Ub33EfAEow"
  }
}
```

**Uden organizationId → 404 error fra Billy API** ❌

## 🧪 TEST DETTE NU

### Test 1: List Tools (skal virke)

```
Prompt: "List all available Billy tools"
```

**Expected:** 32 tools listed

---

### Test 2: List Invoices (inkluder org ID!)

```
Prompt: "List invoices for organization IQgm5fsl5rJ3Ub33EfAEow"
```

**Expected:** List af fakturaer

---

### Test 3: Get Organization Info

```json
Tool: get_organization
Arguments: {
  "organizationId": "IQgm5fsl5rJ3Ub33EfAEow"
}
```

**Expected:** Organization navn, adresse, settings

---

## 🔍 HVIS STADIG 404 ERRORS

Send mig:

1. **Exact tool call** du sender:

   ```json
   {
     "name": "...",
     "arguments": { ... }
   }
   ```

2. **Exact error response** du får tilbage

3. **Din Claude Desktop config** (fra `%APPDATA%\Claude\claude_desktop_config.json`)

---

## 💡 COMMON MISTAKES

### ❌ Forkert

```json
{
  "name": "list_invoices",
  "arguments": {
    "pageSize": 10
  }
}
```

**Resultat:** 404 (organizationId mangler!)

### ✅ Korrekt

```json
{
  "name": "list_invoices",
  "arguments": {
    "organizationId": "IQgm5fsl5rJ3Ub33EfAEow",
    "pageSize": 10
  }
}
```

**Resultat:** List af invoices!

---

## 📊 SERVER STATUS

**Production Health:** ✅ Healthy
- URL: <https://tekup-billy.onrender.com>
- Version: 1.4.1
- Billy API: Connected
- Supabase: Connected
- Cache: Active (5x speedup)

**Quick Health Check:**

```powershell
Invoke-RestMethod https://tekup-billy.onrender.com/health
```

---

## 🎯 NEXT STEPS

1. **Prøv Test 1-3 ovenfor**
2. **Hvis stadig errors** → Send mig exact tool call + error
3. **Hvis virker** → 🎉 Fortsæt med normal usage!

---

**Full debug guide:** `docs/troubleshooting/CLAUDE_DEBUG_RESPONSE.md`

Lad mig vide hvordan det går! 🚀
