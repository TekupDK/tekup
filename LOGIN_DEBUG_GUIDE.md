# 🔐 Login Debug Guide - tekup-ai-v2

**Problem:** `{"error":"Login failed"}`

**Løst:** Forbedret fejlhåndtering og validering tilføjet.

---

## 📋 Root Causes

| # | Problem | Symptom | Fix |
|---|---------|---------|-----|
| 1 | `.env` fil mangler | LOGIN_FAILED + keine detaljer | Kopier `env.template.txt` → `.env` |
| 2 | `JWT_SECRET` er tom | LOGIN_FAILED + JWT sign fejler | Tilføj værdi i `.env` |
| 3 | `OWNER_OPEN_ID` er tom | LOGIN_FAILED + bruger-oprettelse fejler | Tilføj værdi i `.env` |
| 4 | Database forbindelse fejler | LOGIN_FAILED + DB upsert fejler | Tjek `DATABASE_URL` og MySQL køring |
| 5 | Cookie-indstillinger er forkerte | LOGIN_FAILED + cookie sættes ikke | Tjek `getSessionCookieOptions()` |

---

## 🔧 Løsning - Hvad er ændret?

### **Before (Dårlig fejlhåndtering):**
```typescript
// oauth.ts:72-75 (FØR)
catch (error) {
  console.error("[Auth] Dev login failed", error);
  res.status(500).json({ error: "Login failed" }); // ❌ Ingen detaljer!
}
```

### **After (Forbedret fejlhåndtering):**
```typescript
// oauth.ts:72-81 (NU)
catch (error) {
  console.error("[Auth] Dev login failed", error);
  const errorMessage = error instanceof Error ? error.message : String(error);
  const statusCode = errorMessage.includes('session') ? 500 : 500;
  res.status(statusCode).json({
    error: "Login failed",
    details: process.env.NODE_ENV === 'development' ? errorMessage : undefined // ✅ Detaljer i dev!
  });
}
```

### **Tilføjet i oauth.ts (Login-validering):**
```typescript
// Validate required environment variables FØR du gør noget
if (!ENV.cookieSecret) {
  throw new Error("JWT_SECRET is not configured. Set JWT_SECRET in .env file.");
}
if (!ENV.appId) {
  throw new Error("VITE_APP_ID is not configured. Set VITE_APP_ID in .env file.");
}
```

### **Tilføjet i env.ts (Start-validering):**
```typescript
// Kører automatisk når modulet loades
function validateEnv() {
  const required = ['JWT_SECRET', 'OWNER_OPEN_ID', 'DATABASE_URL', 'VITE_APP_ID'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`⚠️ [ENV] Missing required environment variables: ${missing.join(', ')}`);
    console.warn('📄 Copy env.template.txt to .env and fill in your values');
  }
}
validateEnv(); // ✅ Kører når serveren starter
```

---

## ✅ Konfigurationsguide

### **Step 1: Opret `.env` fil**

```bash
cd C:\Users\empir\Tekup\services\tekup-ai-v2
cp env.template.txt .env
```

### **Step 2: Tilføj mindste påkrævede værdier**

```env
# PÅKRÆVET - Authentication
JWT_SECRET=my-super-secret-key-min-32-chars-lang-!@#$
OWNER_OPEN_ID=owner-friday-ai-dev
VITE_APP_ID=friday-ai

# PÅKRÆVET - Database
DATABASE_URL=mysql://friday_user:friday_password@localhost:3306/friday_ai

# PÅKRÆVET - Environment
NODE_ENV=development
PORT=3000
```

### **Step 3: Start serveren**

```bash
pnpm dev
```

### **Step 4: Tjek logs**

Du skal se:
```
⚠️ [ENV] Missing required environment variables: (INGEN - hvis alt er godt!)
[AUTH] Dev-login endpoint called, NODE_ENV: development
[AUTH] Setting session cookie: { cookieName: 'friday-ai-session', ... }
```

### **Step 5: Prøv login**

Åbn browser: `http://localhost:3000/api/auth/login`

**Succesuld (302 redirect):**
```
Location: /
```

**Fejl (500 med detaljer):**
```json
{
  "error": "Login failed",
  "details": "JWT_SECRET is not configured. Set JWT_SECRET in .env file."
}
```

---

## 🔍 Fejlfinding

### **Symptom 1: `{"error":"Login failed","details":"JWT_SECRET is not configured..."}`**

**Løsning:**
```env
# .env
JWT_SECRET=my-super-secret-key-her-mindst-32-karakterer!@#$
```

### **Symptom 2: `{"error":"Login failed","details":"VITE_APP_ID is not configured..."}`**

**Løsning:**
```env
# .env
VITE_APP_ID=friday-ai
```

### **Symptom 3: `{"error":"Login failed","details":"Failed to create user"}`**

**Årsag:** Database forbindelse fejler

**Løsning:**
```bash
# Tjek MySQL kører
docker-compose ps

# Tjek forbindelse
mysql -h localhost -u friday_user -p friday_ai -e "SELECT 1;"

# Tjek DATABASE_URL i .env
cat .env | grep DATABASE_URL
```

### **Symptom 4: Server starter ikke - ENOENT eller permission error**

**Årsag:** `.env` indeholder invalid path

**Løsning:**
```bash
# Verificer .env er valid
cat .env

# Hvis MySQL sti er forkert:
# ❌ DATABASE_URL=C:\path\to\db
# ✅ DATABASE_URL=mysql://user:pass@host:3306/dbname
```

---

## 📊 Tjekliste

- [ ] `.env` fil oprettet
- [ ] `JWT_SECRET` sat (mindst 32 karakterer)
- [ ] `OWNER_OPEN_ID` sat (default: `owner-friday-ai-dev`)
- [ ] `VITE_APP_ID` sat (default: `friday-ai`)
- [ ] `DATABASE_URL` sat og korrekt
- [ ] MySQL kørende (check: `docker-compose ps`)
- [ ] Server starter uden fejl (`pnpm dev`)
- [ ] Logs viser `[AUTH]`Messages
- [ ] Login redirect virker (`/api/auth/login` → `/`)

---

## 📞 Hvis problemet fortsætter

1. **Kopier hele log output:**
   ```bash
   pnpm dev 2>&1 | tee debug.log
   ```

2. **Check database:**
   ```bash
   mysql -u friday_user -p friday_ai -e "SELECT * FROM users LIMIT 1;"
   ```

3. **Verificer cookies i browser (F12 → Application → Cookies)**

4. **Se Session Secret format:**
   ```bash
   node -e "console.log(process.env.JWT_SECRET)"
   ```

---

## 🎯 Næste Steps

Når login virker:
1. ✅ Gå til `http://localhost:3000`
2. ✅ Tjek om du er logged in (brugermenuen øverst)
3. ✅ Prøv at bruge Jarvis chatbot
4. ✅ Test Gmail/Calendar integration (hvis keys er sat)

