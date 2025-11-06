# TypeScript Performance Optimization – Impact Analysis

## 📊 Filer der Påvirkes af Reorganisering

Denne analyse viser **præcis** hvilke filer der skal opdateres når vi flytter root-level scripts.

---

## ✅ Filer Som IKKE Påvirkes

### Config Filer (forbliver i root)

- `drizzle.config.ts` ✅
- `playwright.config.ts` ✅
- `vite.config.ts` ✅
- `vitest.config.ts` ✅
- `vitest.setup.ts` ✅

### Application Code

- `client/**/*` ✅ (ingen ændringer)
- `server/**/*` ✅ (ingen ændringer)
- `shared/**/*` ✅ (ingen ændringer)

---

## ⚠️ Filer der SKAL Opdateres

### 1. `package.json` (1 reference)

**Linje 11 skal opdateres:**

```json
// FØR:
"check:env": "node check-env.js",

// EFTER:
"check:env": "node scripts/env/check-env.js",
```

**Alle andre npm scripts bruger allerede `server/scripts/` eller npm scripts** ✅

---

### 2. `.vscode/tasks.json`

**INGEN DIREKTE REFERENCER** ✅

Tasks bruger kun npm scripts:

- `"script": "dev"` ✅
- `"script": "migrate:emails"` ✅
- `"command": "pnpm analyze:customer"` ✅

Så tasks.json behøver **INGEN opdateringer** da den kalder via package.json!

---

### 3. `tsconfig.json` (primær ændring)

**Skal tilføje exclude:**

```json
{
  "include": ["client/src/**/*", "shared/**/*", "server/**/*"],
  "exclude": [
    "node_modules",
    "build",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts",
    "scripts/**/*" // ← NY LINJE
  ]
}
```

---

### 4. Dokumentation Filer (minor updates)

#### `tasks/env/PLAN.md`

**Linje 12:**

```markdown
// FØR:

- [ ] `check-env.js` passes for both dev and prod.

// EFTER:

- [ ] `scripts/env/check-env.js` passes for both dev and prod.
```

#### `TEST_RAPPORT_EMAIL_SIDEBAR.md`

**Linje 11:**

```markdown
// FØR:
**Fil**: `test-email-sidebar.mjs`

// EFTER:
**Fil**: `scripts/tests/test-email-sidebar.mjs`
```

---

### 5. PowerShell Scripts (potentielle referencer)

**Filer at checke:**

- `push-schema.ps1` ✅ (ingen referencer)
- `test-phase-4.ps1` ✅ (kun references til `server/*.ts`)
- `test-migration.ps1` ✅ (kun references til `drizzle.config.ts` i root)

**Resultat:** INGEN opdateringer nødvendige ✅

---

## 📋 Fuld Impact Summary

| Fil Type               | Antal Filer | Påvirkes? | Action Needed                     |
| ---------------------- | ----------- | --------- | --------------------------------- |
| **Config files**       | 5           | ❌        | Ingen - forbliver i root          |
| **Application code**   | ~hundreds   | ❌        | Ingen ændringer                   |
| **package.json**       | 1           | ✅        | 1 linje opdatering                |
| **tsconfig.json**      | 1           | ✅        | 1 linje tilføjelse                |
| **tasks.json**         | 1           | ❌        | Ingen - bruger npm scripts        |
| **Markdown docs**      | 2           | ✅        | Minor path updates                |
| **PowerShell scripts** | 3           | ❌        | Ingen referencer til root scripts |
| **Scripts at flytte**  | 29          | ✅        | Flyttes til `scripts/*`           |

---

## 🎯 Minimal Impact Implementation

### Total Filer at Ændre: **3-4 filer**

1. ✅ `tsconfig.json` - Add 1 line to exclude
2. ✅ `package.json` - Update 1 script path
3. ✅ `tasks/env/PLAN.md` - Update 1 path reference (optional)
4. ✅ `TEST_RAPPORT_EMAIL_SIDEBAR.md` - Update 1 path reference (optional)

### Filer at Flytte: **29 files**

- 14 database/migration scripts
- 9 test scripts
- 1 environment script
- 5 config files **forbliver i root**

---

## ✨ Risk Assessment: **MEGET LAV**

### Hvorfor er risikoen lav?

1. **Ingen breaking changes til application code**
   - `client/`, `server/`, `shared/` påvirkes ikke

2. **Tasks bruger npm scripts indirekte**
   - VS Code tasks kalder package.json scripts
   - Kun 1 script path skal opdateres i package.json

3. **Git giver fuld rollback**
   - Alt kan revertes med `git reset --hard`

4. **Scripts bruges sjældent**
   - Migration og test scripts køres manuelt
   - Ikke kritiske for app runtime

5. **TypeScript config isoleret**
   - tsconfig exclude påvirker kun IDE analyse
   - Ingen runtime impact

---

## 🔍 Verification Checklist

Efter implementation, verificer:

```powershell
# 1. Test npm script stadig virker
pnpm check:env

# 2. Verificer TypeScript check
pnpm check

# 3. Test dev server starter
pnpm dev

# 4. Check for fejl i Problems panel
# → Skulle være clean eller kun eksisterende fejl
```

---

## 📝 Implementation Order

1. **Commit alt arbejde** (backup)
2. **Opret `scripts/` directories**
3. **Flyt files** (29 scripts)
4. **Opdater `tsconfig.json`** (1 linje)
5. **Opdater `package.json`** (1 linje)
6. **Test scripts virker**
7. **Genstart VS Code** (verificer TypeScript performance)
8. **Opdater docs** (optional - 2 filer)

**Total tid estimeret:** 15-20 minutter ⚡

---

## 🚀 Expected Result

**FØR:**

```
TypeScript Language Service analyzing:
- google-api.ts ⏳
- check-customers.ts ⏳
- migrate-emails-schema.ts ⏳
- test-email-sidebar.mjs ⏳
- ... 25+ more files ⏳
```

**EFTER:**

```
TypeScript Language Service analyzing:
- client/* ✅
- server/* ✅
- shared/* ✅

scripts/* IGNORED ⚡
```

**Resultat:** 30-60 sek → 5-15 sek IDE opstart! 🎉
